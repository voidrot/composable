import { fetchMergedIndex, fetchFromRegistry } from '../utils/registry.js';
import * as path from 'path';

export async function showDocs(type: string, name: string) {
    try {
        const index = await fetchMergedIndex();
        
        let registryUrl = '';
        let docPath = '';

        if (type === 'fragment') {
            const entry = index.fragments.find(f => f.name === name);
            if (!entry) throw new Error(`Fragment ${name} not found.`);
            registryUrl = entry.registryUrl;
            // E.g., docs/fragments/compose/prometheus.md
            docPath = `docs/fragments/${entry.type}/${name}.md`;
        } else if (type === 'stack') {
            const entry = index.stacks.find(s => s.name === name);
            if (!entry) throw new Error(`Stack ${name} not found.`);
            registryUrl = entry.registryUrl;
            docPath = `docs/stacks/${name}.md`;
        } else {
            throw new Error(`Unknown doc type: ${type}`);
        }

        console.log(`Fetching docs for ${type} ${name}...`);
        
        try {
            const md = await fetchFromRegistry(registryUrl, docPath);
            console.log("\n" + md + "\n");
        } catch (e: any) {
            console.error(`Could not fetch documentation from ${registryUrl}/${docPath}`);
        }

    } catch (e: any) {
        console.error(`Error fetching docs: ${e.message}`);
    }
}
