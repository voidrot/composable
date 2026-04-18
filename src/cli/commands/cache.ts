import fs from 'fs-extra';
import * as path from 'path';
import { CACHE_DIR, ensureCacheDir, fetchMergedIndex, fetchFromRegistry } from '../utils/registry.js';

export async function manageCache(options: any) {
    if (options.all) {
        try {
            await ensureCacheDir();
            console.log("Fetching index from registries...");
            const index = await fetchMergedIndex();

            for (const f of index.fragments) {
                console.log(`Caching ${f.name} from ${f.registryUrl}...`);
                try {
                    const yaml = await fetchFromRegistry(f.registryUrl, f.path);
                    const localYamlPath = path.join(CACHE_DIR, f.path);
                    await fs.ensureDir(path.dirname(localYamlPath));
                    await fs.writeFile(localYamlPath, yaml);

                    if (f.metadataPath) {
                        const json = await fetchFromRegistry(f.registryUrl, f.metadataPath);
                        await fs.writeFile(path.join(CACHE_DIR, f.metadataPath), json);
                        const metadata = JSON.parse(json);
                        
                        if (metadata.configs && Array.isArray(metadata.configs)) {
                            for (const config of metadata.configs) {
                                if (config.source) {
                                    const configPath = path.join('fragments', f.type!, config.source);
                                    try {
                                        const configContent = await fetchFromRegistry(f.registryUrl, configPath);
                                        const localConfigPath = path.join(CACHE_DIR, configPath);
                                        await fs.ensureDir(path.dirname(localConfigPath));
                                        await fs.writeFile(localConfigPath, configContent);
                                    } catch (e) {}
                                }
                            }
                        }
                    }
                } catch (e: any) {
                    console.warn(`Failed to cache ${f.name}: ${e.message}`);
                }
            }
            console.log("All fragments cached successfully.");
        } catch (error: any) {
            console.error(`Error caching all: ${error.message}`);
        }
    }
}

export async function updateCache() {
    console.log("Updating cache...");
    try {
        const index = await fetchMergedIndex();
        for (const f of index.fragments) {
            console.log(`Updating ${f.name}...`);
            try {
                const yaml = await fetchFromRegistry(f.registryUrl, f.path);
                await fs.writeFile(path.join(CACHE_DIR, f.path), yaml);
                
                if (f.metadataPath) {
                    const json = await fetchFromRegistry(f.registryUrl, f.metadataPath);
                    await fs.writeFile(path.join(CACHE_DIR, f.metadataPath), json);
                    const metadata = JSON.parse(json);
                    if (metadata.configs && Array.isArray(metadata.configs)) {
                        for (const config of metadata.configs) {
                            if (config.source) {
                                const configPath = path.join('fragments', f.type!, config.source);
                                try {
                                    const configContent = await fetchFromRegistry(f.registryUrl, configPath);
                                    const localConfigPath = path.join(CACHE_DIR, configPath);
                                    await fs.ensureDir(path.dirname(localConfigPath));
                                    await fs.writeFile(localConfigPath, configContent);
                                } catch (e) {}
                            }
                        }
                    }
                }
            } catch (e) {}
        }
        console.log("Cache updated.");
    } catch (e: any) {
        console.error(`Error updating cache: ${e.message}`);
    }
}
