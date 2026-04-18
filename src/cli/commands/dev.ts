import fs from 'fs-extra';
import * as path from 'path';
import yaml from 'yaml';
import { execSync } from 'child_process';
import os from 'os';

export async function generateStack(composeFilePath: string) {
    try {
        if (!(await fs.pathExists(composeFilePath))) {
            throw new Error(`Compose file not found: ${composeFilePath}`);
        }

        const content = await fs.readFile(composeFilePath, 'utf-8');
        const doc = yaml.parse(content);

        if (!doc.services) {
            throw new Error('No services found in compose file.');
        }

        const stack = {
            name: path.basename(path.dirname(path.resolve(composeFilePath))) || 'generated-stack',
            description: 'Generated stack from compose file',
            fragments: [] as any[]
        };

        for (const [serviceName, serviceConfig] of Object.entries<any>(doc.services)) {
            // Check if it extends a local fragment
            if (serviceConfig.extends && serviceConfig.extends.file) {
                const extendFile = serviceConfig.extends.file;
                // e.g. .compose/prometheus.yml
                const basename = path.basename(extendFile, '.yml');
                
                // We don't necessarily know the type (compose) from just the .compose/ folder.
                // We'll guess 'compose' for now.
                stack.fragments.push({
                    type: 'compose',
                    name: basename,
                    customName: serviceName !== basename ? serviceName : undefined
                });
            } else {
                // If it doesn't extend, it's an inline service.
                // We could prompt to extract it, but for now we'll just note it.
                console.warn(`Service '${serviceName}' does not appear to extend a fragment. It will not be included in the stack config.`);
            }
        }

        const stackJsonPath = path.join(process.cwd(), 'stack.json');
        await fs.writeJson(stackJsonPath, stack, { spaces: 2 });
        console.log(`Generated stack configuration at ${stackJsonPath}`);
    } catch (e: any) {
        console.error(`Error generating stack: ${e.message}`);
    }
}

export async function testFragmentOrStack(type: string, name: string, options: any) {
    console.log(`Testing ${type} '${name}'...`);
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'composable-test-'));
    console.log(`Created temporary directory at ${tempDir}`);
    
    try {
        // Change to temp dir
        const originalCwd = process.cwd();
        process.chdir(tempDir);

        // We run the CLI programmatically to init the stack or fragment
        // For simplicity, we can shell out to our own CLI or just call the init functions directly if they didn't rely on process.cwd() as much.
        // Since our commands use process.cwd(), shelling out to the globally installed or local bin might be easier.
        // Wait, since we just process.chdir(), we can require/import the functions directly.
        
        if (type === 'stack') {
            const { initStack } = await import('./stack.js');
            await initStack(name, {});
        } else if (type === 'fragment') {
            // Need type and name for fragment. Wait, type is 'fragment', so we need something like 'compose/prometheus'
            const [fType, fName] = name.split('/');
            if (!fType || !fName) {
                throw new Error('Fragment name must be in the format <type>/<name> (e.g. compose/prometheus)');
            }
            const { addFragment } = await import('./add.js');
            await addFragment(fType, fName, { extend: true });
        } else {
            throw new Error(`Unknown test type: ${type}. Use 'fragment' or 'stack'.`);
        }

        console.log("Validating with docker compose config...");
        execSync('docker compose config', { stdio: 'inherit' });

        if (options.run) {
            console.log("Running docker compose up -d...");
            execSync('docker compose up -d', { stdio: 'inherit' });
            
            console.log("Tearing down...");
            execSync('docker compose down', { stdio: 'inherit' });
        }

        process.chdir(originalCwd);
        console.log("Test completed successfully.");
    } catch (e: any) {
        console.error(`Test failed: ${e.message}`);
    } finally {
        await fs.remove(tempDir);
    }
}

export async function initRegistry(targetPath?: string) {
    const registryPath = targetPath ? path.resolve(process.cwd(), targetPath) : process.cwd();
    console.log(`Initializing custom registry at ${registryPath}...`);
    
    try {
        await fs.ensureDir(registryPath);
        await fs.ensureDir(path.join(registryPath, 'fragments', 'compose'));
        await fs.ensureDir(path.join(registryPath, 'stacks'));
        await fs.ensureDir(path.join(registryPath, 'docs', 'fragments'));
        await fs.ensureDir(path.join(registryPath, 'docs', 'stacks'));
        await fs.ensureDir(path.join(registryPath, 'src', 'registry'));
        await fs.ensureDir(path.join(registryPath, '.github', 'workflows'));

        // Copy build script from somewhere? We can just create a basic one or copy current one if we are in the repo.
        // For a general CLI, we'd embed the build script template.
        const packageJson = {
            name: "custom-composable-registry",
            version: "0.1.0",
            private: true,
            scripts: {
                "build:registry": "tsx src/registry/build.ts"
            },
            dependencies: {
                "fs-extra": "^11.0.0",
                "glob": "^10.0.0",
                "tsx": "^4.0.0"
            }
        };

        await fs.writeJson(path.join(registryPath, 'package.json'), packageJson, { spaces: 2 });
        
        console.log("Registry template initialized. Install dependencies and customize build.ts.");
    } catch (e: any) {
        console.error(`Failed to initialize registry: ${e.message}`);
    }
}
