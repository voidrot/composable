import { fetchMergedIndex, fetchFromRegistry, ensureCacheDir } from '../utils/registry.js';
import { addFragment } from './add.js';

export async function initStack(name: string, options: any) {
    try {
        await ensureCacheDir();
        const index = await fetchMergedIndex();
        
        const stackEntry = index.stacks.find(s => s.name === name);
        if (!stackEntry) {
            throw new Error(`Stack '${name}' not found in any configured registry.`);
        }

        console.log(`Initializing stack: ${name}`);
        const stackJsonStr = await fetchFromRegistry(stackEntry.registryUrl, stackEntry.path);
        const stackConfig = JSON.parse(stackJsonStr);

        if (!stackConfig.fragments || !Array.isArray(stackConfig.fragments)) {
            throw new Error(`Stack '${name}' does not contain a valid fragments array.`);
        }

        for (const fragment of stackConfig.fragments) {
            console.log(`\nAdding fragment: ${fragment.type}/${fragment.name}`);
            const addOptions = {
                ...options,
                name: fragment.customName || fragment.name,
                envOverrides: fragment.env_overrides || {},
                dependsOn: fragment.depends_on || undefined
            };
            await addFragment(fragment.type, fragment.name, addOptions);
        }

        console.log(`\nSuccessfully initialized stack '${name}'`);

    } catch (error: any) {
        console.error(`Error initializing stack: ${error.message}`);
    }
}

export async function searchStacks(query?: string) {
    try {
        console.log("Fetching index from registries...");
        const index = await fetchMergedIndex();

        const results = index.stacks.filter(
            (s: any) =>
                !query ||
                s.name.includes(query) ||
                s.description?.includes(query),
        );

        if (results.length === 0) {
            console.log("No stacks found.");
            return;
        }

        console.table(
            results.map((r: any) => ({
                Name: r.name,
                Description: r.description,
                Registry: r.registryUrl
            })),
        );
    } catch (error: any) {
        console.error(`Error searching stacks: ${error.message}`);
    }
}
