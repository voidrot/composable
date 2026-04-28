import fs from 'fs-extra';
import * as path from 'path';
import * as dotenv from 'dotenv';
import yaml from 'yaml';
import { CACHE_DIR, ensureCacheDir, fetchFromRegistry, fetchMergedIndex } from '../utils/registry.js';
import { getConfig } from '../utils/config.js';

export async function addFragment(type: string, name: string, options: any) {
    try {
        await ensureCacheDir();
        
        // Find registry URL for this fragment
        const index = await fetchMergedIndex();
        const fragmentEntry = index.fragments.find(f => f.type === type && f.name === name);
        if (!fragmentEntry) {
            throw new Error(`Fragment ${type}/${name} not found in any configured registry.`);
        }

        const fragmentPath = fragmentEntry.path;
        const metadataPath = fragmentEntry.metadataPath || `${type}/${name}.json`;
        const localFragmentPath = path.join(CACHE_DIR, fragmentPath);
        const localMetadataPath = path.join(CACHE_DIR, metadataPath);
        const registryUrl = fragmentEntry.registryUrl;

        // Fetch files
        if (!(await fs.pathExists(localFragmentPath))) {
            console.log(`Fetching ${name}...`);
            const content = await fetchFromRegistry(registryUrl, fragmentPath);
            await fs.ensureDir(path.dirname(localFragmentPath));
            await fs.writeFile(localFragmentPath, content);
        }

        if (!(await fs.pathExists(localMetadataPath))) {
            try {
                const metadataContent = await fetchFromRegistry(registryUrl, metadataPath);
                await fs.ensureDir(path.dirname(localMetadataPath));
                await fs.writeFile(localMetadataPath, metadataContent);
            } catch (e) {
                // Metadata might not exist
            }
        }

        // Load metadata
        let metadata: any = {};
        if (await fs.pathExists(localMetadataPath)) {
            metadata = await fs.readJson(localMetadataPath);
        }

        const fragmentContentForGpu = await fs.readFile(localFragmentPath, "utf-8");
        const hasGpu = fragmentContentForGpu.includes("GPU_DRIVER") || fragmentContentForGpu.includes("GPU_COUNT");

        if (hasGpu) {
            metadata.variables = metadata.variables || {};
            metadata.variables["GPU_DRIVER"] = options.gpu || "nvidia";
            metadata.variables["GPU_COUNT"] = options.gpuCount || "all";
        }

        // Apply env_overrides from options
        if (options.envOverrides) {
            metadata.variables = { ...metadata.variables, ...options.envOverrides };
        }

        // Generate variable mapping
        const envMapping: Record<string, string> = {};
        if (metadata.variables) {
            for (const key of Object.keys(metadata.variables)) {
                if (options.name) {
                    const customNameUpper = options.name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
                    const originalNameUpper = name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
                    if (key.startsWith(`${originalNameUpper}_`)) {
                        envMapping[key] = key.replace(new RegExp(`^${originalNameUpper}_`), `${customNameUpper}_`);
                    } else {
                        envMapping[key] = `${customNameUpper}_${key}`;
                    }
                } else {
                    envMapping[key] = key;
                }
            }
        }

        // Copy to local .compose directory
        const composeDirName = process.env.COMPOSABLE_REPO_DIR || ".compose";
        const targetDir = path.resolve(process.cwd(), composeDirName);
        await fs.ensureDir(targetDir);
        await fs.copy(localFragmentPath, path.join(targetDir, `${name}.yml`));

        if (options.extend) {
            const composeFiles = [
                "compose.yml",
                "compose.yaml",
                "docker-compose.yml",
                "docker-compose.yaml",
            ];
            let composePath = "";
            
            if (process.env.COMPOSABLE_COMPOSE_FILE_TARGET) {
                composePath = path.resolve(process.cwd(), process.env.COMPOSABLE_COMPOSE_FILE_TARGET);
                if (!(await fs.pathExists(composePath))) {
                    await fs.ensureDir(path.dirname(composePath));
                    await fs.writeFile(composePath, "services:\n");
                }
            } else {
                for (const file of composeFiles) {
                    if (await fs.pathExists(path.join(process.cwd(), file))) {
                        composePath = path.join(process.cwd(), file);
                        break;
                    }
                }

                if (!composePath) {
                    composePath = path.join(process.cwd(), "compose.yml");
                    await fs.writeFile(composePath, "services:\n");
                }
            }

            const composeContent = await fs.readFile(composePath, "utf-8");
            const doc = yaml.parseDocument(composeContent);

            const fragmentContent = await fs.readFile(localFragmentPath, "utf-8");
            const fragmentDoc = yaml.parseDocument(fragmentContent);

            let servicesNode = doc.get("services") as any;
            if (!servicesNode) {
                servicesNode = doc.createNode({});
                doc.set("services", servicesNode);
            }
            const fragmentServices = fragmentDoc.get("services") as any;

            if (fragmentServices && fragmentServices.items) {
                for (const item of fragmentServices.items) {
                    const originalServiceName = item.key.value;
                    const finalServiceName = options.name || originalServiceName;
                    
                    const relativeFragmentPath = path.relative(
                        path.dirname(composePath),
                        path.join(targetDir, `${name}.yml`)
                    );

                    const serviceConfig: any = {
                        extends: {
                            file: relativeFragmentPath,
                            service: originalServiceName,
                        },
                    };

                    if (options.name && Object.keys(envMapping).length > 0) {
                        const envNode: any = {};
                        for (const [origKey, mappedKey] of Object.entries(envMapping)) {
                            envNode[origKey] = `\${${mappedKey}}`;
                        }
                        serviceConfig.environment = envNode;
                    }

                    const config = await getConfig();
                    const useBuild = options.build ?? config.defaults?.build ?? true;
                    const useWatch = options.watch ?? config.defaults?.watch ?? true;
                    const useEnvFile = options.envFile ?? config.defaults?.env_file ?? true;
                    const composeEnvName = process.env.COMPOSABLE_COMPOSE_ENV_FILE || ".env.compose";
                    const relativeComposeEnvPath = path.relative(
                        path.dirname(composePath),
                        path.join(process.cwd(), composeEnvName)
                    );

                    if (useEnvFile && metadata.env_file) {
                        serviceConfig.env_file = [relativeComposeEnvPath];
                        console.log(`\n  [Info] Added env_file: - ${relativeComposeEnvPath} for '${finalServiceName}'.`);
                    }

                    if (options.restart) {
                        serviceConfig.restart = options.restart;
                        console.log(`\n  [Info] Added restart: ${options.restart} for '${finalServiceName}'.`);
                    }

                    if (options.profile) {
                        serviceConfig.profiles = [options.profile];
                        console.log(`\n  [Info] Added profile: ${options.profile} for '${finalServiceName}'.`);
                    }

                    if (options.dependsOn) {
                        serviceConfig.depends_on = options.dependsOn;
                        console.log(`\n  [Info] Added depends_on configuration for '${finalServiceName}'.`);
                    }

                    if (useBuild && metadata.build) {
                        serviceConfig.build = metadata.build;
                        console.log(`\n  [Info] Injected build configuration for '${finalServiceName}'. Please review and update paths (context, dockerfile) to match your project.`);
                    }

                    if (useWatch && metadata.watch) {
                        serviceConfig.develop = serviceConfig.develop || {};
                        serviceConfig.develop.watch = metadata.watch;
                        console.log(`\n  [Info] Injected develop/watch configuration for '${finalServiceName}'. Please review and update sync/rebuild paths to match your project.`);
                    }

                    const serviceNode = doc.createNode(serviceConfig);
                    if (options.name) {
                        serviceNode.commentBefore = ` Original fragment: ${type}/${name} (service: ${originalServiceName})`;
                    }

                    servicesNode.set(finalServiceName, serviceNode);
                }
            }

            const topLevelKeys = ["volumes", "networks", "configs"];
            for (const key of topLevelKeys) {
                const fragmentNode = fragmentDoc.get(key) as any;
                if (fragmentNode && fragmentNode.items) {
                    let mainNode = doc.get(key) as any;
                    if (!mainNode) {
                        mainNode = doc.createNode({});
                        doc.set(key, mainNode);
                    }
                    for (const item of fragmentNode.items) {
                        const itemName = item.key.value;
                        if (!mainNode.has(itemName)) {
                            mainNode.set(itemName, item.value);
                        }
                    }
                }
            }

            await fs.writeFile(composePath, doc.toString());
            console.log(
                `Added service and associated resources to ${path.basename(composePath)} using extends`,
            );

            if (options.name) {
                const statePath = path.join(process.cwd(), ".composable-state.json");
                let state: any = { services: {} };
                if (await fs.pathExists(statePath)) {
                    try {
                        state = await fs.readJson(statePath);
                    } catch (e) {
                        state = { services: {} };
                    }
                }
                if (!state.services) state.services = {};
                
                state.services[options.name] = {
                    fragment: `${type}/${name}`,
                    originalName: name,
                    restart: options.restart
                };
                await fs.writeJson(statePath, state, { spaces: 2 });
                console.log(`Updated state in .composable-state.json`);
            }
        }

        if (metadata.configs || metadata.variables) {
            if (metadata.configs && Array.isArray(metadata.configs)) {
                for (const config of metadata.configs) {
                    if (config.source && config.target) {
                        const configRegistryPath = path.join('fragments', type, config.source);
                        const localConfigCachePath = path.join(CACHE_DIR, configRegistryPath);
                        const targetConfigPath = path.join(targetDir, config.target);

                        if (!(await fs.pathExists(localConfigCachePath))) {
                            try {
                                console.log(`Fetching config ${config.source}...`);
                                const configContent = await fetchFromRegistry(registryUrl, configRegistryPath);
                                await fs.ensureDir(path.dirname(localConfigCachePath));
                                await fs.writeFile(localConfigCachePath, configContent);
                            } catch (e: any) {
                                console.warn(`Failed to fetch config ${config.source}: ${e.message}`);
                            }
                        }

                        if (await fs.pathExists(localConfigCachePath)) {
                            await fs.ensureDir(path.dirname(targetConfigPath));
                            await fs.copy(localConfigCachePath, targetConfigPath);
                            console.log(`Added config to ./${composeDirName}/${config.target}`);
                        }
                    }
                }
            }

            if (metadata.variables) {
                const composeEnvName = process.env.COMPOSABLE_COMPOSE_ENV_FILE || ".env.compose";
                const envName = process.env.COMPOSABLE_ENV_FILE || ".env";
                const exampleEnvName = process.env.COMPOSABLE_EXAMPLE_ENV_FILE || ".env.example";

                const composeEnvPath = path.join(process.cwd(), composeEnvName);
                const envPath = path.join(process.cwd(), envName);
                const exampleEnvPath = path.join(process.cwd(), exampleEnvName);

                let composeEnvContent = "";
                if (await fs.pathExists(composeEnvPath)) {
                    composeEnvContent = await fs.readFile(composeEnvPath, "utf-8");
                }
                const existingComposeVars = dotenv.parse(composeEnvContent);

                let envContent = "";
                if (await fs.pathExists(envPath)) {
                    envContent = await fs.readFile(envPath, "utf-8");
                }
                const existingVars = dotenv.parse(envContent);

                let exampleEnvContent = "";
                if (await fs.pathExists(exampleEnvPath)) {
                    exampleEnvContent = await fs.readFile(exampleEnvPath, "utf-8");
                }
                const existingExampleVars = dotenv.parse(exampleEnvContent);

                let composeUpdated = false;
                let envUpdated = false;
                let exampleUpdated = false;
                let composeNewLines = "\n# Composable variables for " + (options.name || name) + "\n";
                let envNewLines = "\n# Composable variables for " + (options.name || name) + "\n";
                let exampleNewLines = "\n# Composable variables for " + (options.name || name) + "\n";

                const envFileVars = Array.isArray(metadata.env_file_vars) ? metadata.env_file_vars : [];

                for (const [key, value] of Object.entries(metadata.variables)) {
                    const mappedKey = envMapping[key] as string;
                    
                    if (!(mappedKey in existingComposeVars)) {
                        composeNewLines += `# ${mappedKey}=${value}\n`;
                        composeUpdated = true;
                    }
                    
                    if (envFileVars.includes(key) && !(mappedKey in existingVars)) {
                        envNewLines += `# ${mappedKey}=${value}\n`;
                        envUpdated = true;
                    }

                    if (!(mappedKey in existingExampleVars)) {
                        exampleNewLines += `# ${mappedKey}=${value}\n`;
                        exampleUpdated = true;
                    }
                }

                if (composeUpdated) {
                    await fs.appendFile(composeEnvPath, composeNewLines);
                    console.log(`Updated ${composeEnvName} with default variables for ${options.name || name}`);
                }

                if (envUpdated) {
                    await fs.appendFile(envPath, envNewLines);
                    console.log(`Updated ${envName} with default variables for ${options.name || name}`);
                }

                if (exampleUpdated) {
                    await fs.appendFile(exampleEnvPath, exampleNewLines);
                    console.log(`Updated ${exampleEnvName} with default variables for ${options.name || name}`);
                }
            }
        }

        console.log(`Successfully added ${options.name || name} to ./${composeDirName}/${name}.yml`);
    } catch (error: any) {
        console.error(`Error adding fragment: ${error.message}`);
    }
}
