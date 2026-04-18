#!/usr/bin/env node

import { Command } from "commander";
import fs from "fs-extra";
import * as path from "path";
import * as os from "os";
import * as dotenv from "dotenv";
import yaml from "yaml";
import { fileURLToPath } from "node:url";

const program = new Command();
const CACHE_DIR = path.join(os.homedir(), ".composable", "fragments");
const REGISTRY_URL = "https://voidrot.github.io/composable/latest";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PACKAGE_JSON_PATH = path.resolve(__dirname, "../../package.json");

function getCliVersion(): string {
  try {
    const pkg = fs.readJsonSync(PACKAGE_JSON_PATH) as { version?: string };
    return pkg.version ?? "0.1.0";
  } catch {
    return "0.1.0";
  }
}

program
  .name("composable")
  .description("Manage Docker Compose fragments")
  .version(getCliVersion());

async function ensureCacheDir() {
  await fs.ensureDir(CACHE_DIR);
}

async function fetchFromRegistry(filePath: string) {
  const url = `${REGISTRY_URL}/${filePath}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  return await response.text();
}

program
  .command("add <type> <name>")
  .description("Add a fragment to your project")
  .option(
    "-e, --extend",
    "Add the service directly to an existing compose.yml using extends syntax",
  )
  .option(
    "-n, --name <customName>",
    "Override the name of the service",
  )
  .option(
    "--gpu [driver]",
    "Specify the GPU driver type",
    "nvidia",
  )
  .option(
    "--gpu-count [count]",
    "Specify the GPU count",
    "all",
  )
  .action(async (type, name, options) => {
    try {
      await ensureCacheDir();
      const fragmentPath = path.join(type, `${name}.yml`);
      const metadataPath = path.join(type, `${name}.json`);
      const localFragmentPath = path.join(CACHE_DIR, fragmentPath);
      const localMetadataPath = path.join(CACHE_DIR, metadataPath);

      // Check cache or fetch
      if (!(await fs.pathExists(localFragmentPath))) {
        console.log(`Fetching ${name}...`);
        const content = await fetchFromRegistry(fragmentPath);
        await fs.ensureDir(path.dirname(localFragmentPath));
        await fs.writeFile(localFragmentPath, content);
      }

      if (!(await fs.pathExists(localMetadataPath))) {
        try {
          const metadataContent = await fetchFromRegistry(metadataPath);
          await fs.writeFile(localMetadataPath, metadataContent);
        } catch (e) {
          // Metadata might not exist
        }
      }

      // Load metadata early to process environment variable mapping
      let metadata: any = {};
      if (await fs.pathExists(localMetadataPath)) {
        metadata = await fs.readJson(localMetadataPath);
      }

      const fragmentContentForGpu = await fs.readFile(localFragmentPath, "utf-8");
      const hasGpu = fragmentContentForGpu.includes("GPU_DRIVER") || fragmentContentForGpu.includes("GPU_COUNT");

      if (hasGpu) {
        metadata.variables = metadata.variables || {};
        metadata.variables["GPU_DRIVER"] = options.gpu;
        metadata.variables["GPU_COUNT"] = options.gpuCount;
      }

      // Generate variable mapping if custom name is provided
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
      const targetDir = path.join(process.cwd(), ".compose");
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
            
            const serviceConfig: any = {
              extends: {
                file: `.compose/${name}.yml`,
                service: originalServiceName,
              },
            };

            // If we have custom mapped variables, pass them via environment
            if (options.name && Object.keys(envMapping).length > 0) {
              const envNode: any = {};
              for (const [origKey, mappedKey] of Object.entries(envMapping)) {
                envNode[origKey] = `\${${mappedKey}}`;
              }
              serviceConfig.environment = envNode;
            }

            const serviceNode = doc.createNode(serviceConfig);
            if (options.name) {
              serviceNode.commentBefore = ` Original fragment: ${type}/${name} (service: ${originalServiceName})`;
            }

            servicesNode.set(finalServiceName, serviceNode);
          }
        }

        // Add top-level volumes, networks, and configs if they exist in the fragment
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
              // Only set if not already present to avoid overwriting user config
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

        // Track override state
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
            originalName: name
          };
          await fs.writeJson(statePath, state, { spaces: 2 });
          console.log(`Updated state in .composable-state.json`);
        }
      }

      // Handle configs and variables (continued)
      if (metadata.configs || metadata.variables) {
        if (metadata.configs && Array.isArray(metadata.configs)) {
          for (const config of metadata.configs) {
            if (config.source && config.target) {
              const configRegistryPath = path.join(type, config.source);
              const localConfigCachePath = path.join(
                CACHE_DIR,
                configRegistryPath,
              );
              const targetConfigPath = path.join(
                process.cwd(),
                ".compose",
                config.target,
              );

              if (!(await fs.pathExists(localConfigCachePath))) {
                try {
                  console.log(`Fetching config ${config.source}...`);
                  const configContent =
                    await fetchFromRegistry(configRegistryPath);
                  await fs.ensureDir(path.dirname(localConfigCachePath));
                  await fs.writeFile(localConfigCachePath, configContent);
                } catch (e: any) {
                  console.warn(
                    `Failed to fetch config ${config.source}: ${e.message}`,
                  );
                }
              }

              if (await fs.pathExists(localConfigCachePath)) {
                await fs.ensureDir(path.dirname(targetConfigPath));
                await fs.copy(localConfigCachePath, targetConfigPath);
                console.log(`Added config to ./.compose/${config.target}`);
              }
            }
          }
        }

        if (metadata.variables) {
          const envPath = path.join(process.cwd(), ".env");
          let envContent = "";
          if (await fs.pathExists(envPath)) {
            envContent = await fs.readFile(envPath, "utf-8");
          }

          const existingVars = dotenv.parse(envContent);
          let updated = false;
          let newLines = "\n# Composable variables for " + (options.name || name) + "\n";

          for (const [key, value] of Object.entries(metadata.variables)) {
            const mappedKey = envMapping[key];
            if (mappedKey && !(mappedKey in existingVars)) {
              newLines += `${mappedKey}=${value}\n`;
              updated = true;
            }
          }

          if (updated) {
            await fs.appendFile(envPath, newLines);
            console.log(`Updated .env with default variables for ${options.name || name}`);
          }
        }
      }

      console.log(`Successfully added ${options.name || name} to ./.compose/${name}.yml`);
    } catch (error: any) {
      console.error(`Error adding fragment: ${error.message}`);
    }
  });

program
  .command("search [query]")
  .description("Search for fragments")
  .action(async (query) => {
    try {
      console.log("Fetching index...");
      const indexStr = await fetchFromRegistry("index.json");
      const index = JSON.parse(indexStr);

      const results = index.fragments.filter(
        (f: any) =>
          !query ||
          f.name.includes(query) ||
          f.type.includes(query) ||
          f.description.includes(query),
      );

      console.table(
        results.map((r: any) => ({
          Type: r.type,
          Name: r.name,
          Description: r.description,
        })),
      );
    } catch (error: any) {
      console.error(`Error searching: ${error.message}`);
    }
  });

program
  .command("cache")
  .option("--all", "Cache all fragments")
  .description("Manage local cache")
  .action(async (options) => {
    if (options.all) {
      try {
        await ensureCacheDir();
        console.log("Fetching index...");
        const indexStr = await fetchFromRegistry("index.json");
        const index = JSON.parse(indexStr);

        for (const f of index.fragments) {
          console.log(`Caching ${f.name}...`);
          const yaml = await fetchFromRegistry(f.path);
          const localYamlPath = path.join(CACHE_DIR, f.path);
          await fs.ensureDir(path.dirname(localYamlPath));
          await fs.writeFile(localYamlPath, yaml);

          try {
            const json = await fetchFromRegistry(f.metadataPath);
            await fs.writeFile(path.join(CACHE_DIR, f.metadataPath), json);
            const metadata = JSON.parse(json);
            if (metadata.configs && Array.isArray(metadata.configs)) {
              for (const config of metadata.configs) {
                if (config.source) {
                  const configPath = path.join(f.type, config.source);
                  try {
                    const configContent = await fetchFromRegistry(configPath);
                    const localConfigPath = path.join(CACHE_DIR, configPath);
                    await fs.ensureDir(path.dirname(localConfigPath));
                    await fs.writeFile(localConfigPath, configContent);
                  } catch (e) {}
                }
              }
            }
          } catch (e) {}
        }
        console.log("All fragments cached successfully.");
      } catch (error: any) {
        console.error(`Error caching all: ${error.message}`);
      }
    }
  });

program
  .command("update")
  .description("Update cached fragments from registry")
  .action(async () => {
    // Similar to cache --all but overwrites
    console.log("Updating cache...");
    const indexStr = await fetchFromRegistry("index.json");
    const index = JSON.parse(indexStr);
    for (const f of index.fragments) {
      console.log(`Updating ${f.name}...`);
      const yaml = await fetchFromRegistry(f.path);
      await fs.writeFile(path.join(CACHE_DIR, f.path), yaml);
      try {
        const json = await fetchFromRegistry(f.metadataPath);
        await fs.writeFile(path.join(CACHE_DIR, f.metadataPath), json);
        const metadata = JSON.parse(json);
        if (metadata.configs && Array.isArray(metadata.configs)) {
          for (const config of metadata.configs) {
            if (config.source) {
              const configPath = path.join(f.type, config.source);
              try {
                const configContent = await fetchFromRegistry(configPath);
                const localConfigPath = path.join(CACHE_DIR, configPath);
                await fs.ensureDir(path.dirname(localConfigPath));
                await fs.writeFile(localConfigPath, configContent);
              } catch (e) {}
            }
          }
        }
      } catch (e) {}
    }
    console.log("Cache updated.");
  });

program
  .command("init-metadata <ymlPath>")
  .description("Initialize metadata for a local fragment (developer tool)")
  .action(async (ymlPath) => {
    try {
      if (!(await fs.pathExists(ymlPath))) {
        throw new Error(`File not found: ${ymlPath}`);
      }
      const content = await fs.readFile(ymlPath, "utf-8");
      const varRegex = /\${([A-Z0-9_]+)(?::-([^}]+))?}/g;
      const vars: Record<string, string> = {};
      let match;
      while ((match = varRegex.exec(content)) !== null) {
        const key = match[1];
        if (key) {
          vars[key] = match[2] || "";
        }
      }

      const dir = path.dirname(ymlPath);
      const name = path.basename(ymlPath, ".yml");
      const metadataPath = path.join(dir, `${name}.json`);

      const metadata = {
        name,
        description: "",
        variables: vars,
      };

      await fs.writeJson(metadataPath, metadata, { spaces: 2 });
      console.log(`Generated metadata skeleton at ${metadataPath}`);
    } catch (error: any) {
      console.error(`Error: ${error.message}`);
    }
  });

program.parse();
