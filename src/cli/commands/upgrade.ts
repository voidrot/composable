import fs from 'fs-extra';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { CACHE_DIR, fetchMergedIndex, fetchFromRegistry } from '../utils/registry.js';

interface UpgradeResult {
    name: string;
    status: 'updated' | 'unchanged' | 'skipped';
    reason?: string;
}

export async function upgradeFragments(name: string | undefined, options: any) {
    const targetDir = path.join(process.cwd(), '.compose');

    if (!(await fs.pathExists(targetDir))) {
        console.error('No .compose directory found. Run `composable add` first.');
        process.exit(1);
    }

    // Collect installed fragments from the .compose directory
    const installed = (await fs.readdir(targetDir))
        .filter(f => f.endsWith('.yml'))
        .map(f => path.basename(f, '.yml'));

    if (installed.length === 0) {
        console.log('No fragments installed in .compose/. Nothing to upgrade.');
        return;
    }

    // Filter to a single fragment if name was provided
    const targets = name ? installed.filter(f => f === name) : installed;

    if (targets.length === 0) {
        console.error(`Fragment '${name}' is not installed in .compose/.`);
        process.exit(1);
    }

    // Fetch registry index
    let index: Awaited<ReturnType<typeof fetchMergedIndex>>;
    try {
        index = await fetchMergedIndex();
    } catch (e: any) {
        console.error(`Failed to fetch registry index: ${e.message}`);
        process.exit(1);
    }

    const results: UpgradeResult[] = [];

    for (const fragName of targets) {
        // Find the fragment in the registry (type defaults to 'compose')
        const entry = index.fragments.find(
            f => f.name === fragName && (f.type === 'compose' || !f.type)
        ) ?? index.fragments.find(f => f.name === fragName);

        if (!entry) {
            results.push({ name: fragName, status: 'skipped', reason: 'not found in any configured registry' });
            continue;
        }

        const localFragmentPath = path.join(targetDir, `${fragName}.yml`);

        try {
            // Fetch latest fragment content from the registry
            const latestContent = await fetchFromRegistry(entry.registryUrl, entry.path);
            const existingContent = await fs.readFile(localFragmentPath, 'utf-8');

            const changed = latestContent.trim() !== existingContent.trim();

            if (changed || options.force) {
                await fs.writeFile(localFragmentPath, latestContent);

                // Also update cache
                const cacheFragmentPath = path.join(CACHE_DIR, entry.path);
                await fs.ensureDir(path.dirname(cacheFragmentPath));
                await fs.writeFile(cacheFragmentPath, latestContent);

                results.push({ name: fragName, status: 'updated' });
            } else {
                results.push({ name: fragName, status: 'unchanged' });
                continue;
            }

            // Sync new env vars from updated metadata
            if (entry.metadataPath) {
                try {
                    const metadataContent = await fetchFromRegistry(entry.registryUrl, entry.metadataPath);
                    const metadata = JSON.parse(metadataContent);

                    // Update metadata cache
                    const cacheMetaPath = path.join(CACHE_DIR, entry.metadataPath);
                    await fs.ensureDir(path.dirname(cacheMetaPath));
                    await fs.writeFile(cacheMetaPath, metadataContent);

                    if (metadata.variables && Object.keys(metadata.variables).length > 0) {
                        const composeEnvPath = path.join(process.cwd(), '.env.compose');
                        let composeEnvContent = '';
                        if (await fs.pathExists(composeEnvPath)) {
                            composeEnvContent = await fs.readFile(composeEnvPath, 'utf-8');
                        }
                        const existingVars = dotenv.parse(composeEnvContent);
                        const existingComments = composeEnvContent;

                        let newLines = '';
                        for (const [key, value] of Object.entries(metadata.variables)) {
                            // Check both the key and commented-out form
                            const alreadyPresent =
                                key in existingVars ||
                                existingComments.includes(`# ${key}=`) ||
                                existingComments.includes(`${key}=`);

                            if (!alreadyPresent) {
                                newLines += `# ${key}=${value}\n`;
                            }
                        }

                        if (newLines) {
                            await fs.appendFile(
                                composeEnvPath,
                                `\n# New variables from upgraded fragment: ${fragName}\n${newLines}`
                            );
                            console.log(`  → Added new env vars for '${fragName}' to .env.compose`);
                        }
                    }
                } catch (e) {
                    // Metadata unavailable — non-fatal
                }
            }
        } catch (e: any) {
            results.push({ name: fragName, status: 'skipped', reason: e.message });
        }
    }

    // Report
    console.log('\n── Upgrade Summary ──────────────────────────');
    for (const r of results) {
        if (r.status === 'updated') {
            console.log(`  ✔ ${r.name}  updated`);
        } else if (r.status === 'unchanged') {
            console.log(`  ─ ${r.name}  already up-to-date`);
        } else {
            console.log(`  ✗ ${r.name}  skipped (${r.reason})`);
        }
    }

    const updatedCount = results.filter(r => r.status === 'updated').length;
    const skippedCount = results.filter(r => r.status === 'skipped').length;
    console.log(`─────────────────────────────────────────────`);
    console.log(`  ${updatedCount} updated, ${results.length - updatedCount - skippedCount} already up-to-date, ${skippedCount} skipped\n`);
}
