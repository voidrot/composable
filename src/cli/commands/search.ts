import { fetchMergedIndex } from '../utils/registry.js';

export async function searchFragments(query?: string) {
    try {
        console.log("Fetching index from registries...");
        const index = await fetchMergedIndex();

        const results = index.fragments.filter(
            (f: any) =>
                !query ||
                f.name.includes(query) ||
                f.type.includes(query) ||
                f.description?.includes(query),
        );

        if (results.length === 0) {
            console.log("No fragments found.");
            return;
        }

        console.table(
            results.map((r: any) => ({
                Type: r.type,
                Name: r.name,
                Description: r.description,
                Registry: r.registryUrl
            })),
        );
    } catch (error: any) {
        console.error(`Error searching fragments: ${error.message}`);
    }
}
