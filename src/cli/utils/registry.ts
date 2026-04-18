import fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { getConfig } from './config.js';

export const CACHE_DIR = path.join(os.homedir(), '.composable', 'fragments');

export async function ensureCacheDir() {
    await fs.ensureDir(CACHE_DIR);
}

export interface IndexEntry {
    type?: string;
    name: string;
    description: string;
    path: string;
    metadataPath?: string;
    registryUrl: string; // added to track where it came from
}

export interface RegistryIndex {
    fragments: IndexEntry[];
    stacks: IndexEntry[];
}

export async function fetchMergedIndex(): Promise<RegistryIndex> {
    const config = await getConfig();
    const merged: RegistryIndex = { fragments: [], stacks: [] };

    for (const reg of config.registries) {
        try {
            const res = await fetch(`${reg.url}/index.json`);
            if (!res.ok) continue;
            const data = await res.json();
            
            if (data.fragments && Array.isArray(data.fragments)) {
                for (const f of data.fragments) {
                    merged.fragments.push({ ...f, registryUrl: reg.url });
                }
            }
            if (data.stacks && Array.isArray(data.stacks)) {
                for (const s of data.stacks) {
                    merged.stacks.push({ ...s, registryUrl: reg.url });
                }
            }
        } catch (e) {
            console.warn(`Failed to fetch index from ${reg.url}`);
        }
    }
    return merged;
}

export async function fetchFromRegistry(registryUrl: string, filePath: string): Promise<string> {
    const url = `${registryUrl}/${filePath}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    return await response.text();
}
