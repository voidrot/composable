import fs from 'fs-extra';
import * as path from 'path';
import { glob } from 'glob';

async function buildRegistry() {
    const fragmentsDir = path.join(process.cwd(), 'fragments');
    const registryDir = path.join(process.cwd(), 'registry');
    const packageJson = await fs.readJson(path.join(process.cwd(), 'package.json'));
    const version = packageJson.version;

    const versionDir = path.join(registryDir, version);
    const latestDir = path.join(registryDir, 'latest');

    // Clean registry
    await fs.ensureDir(versionDir);
    await fs.emptyDir(versionDir);

    const index = {
        version,
        fragments: [] as any[]
    };

    const fragmentFiles = await glob('**/*.yml', { cwd: fragmentsDir });

    for (const file of fragmentFiles) {
        const type = path.dirname(file);
        const name = path.basename(file, '.yml');
        const metadataFile = path.join(fragmentsDir, type, `${name}.json`);

        let metadata = { name, description: '', variables: {} };
        if (await fs.pathExists(metadataFile)) {
            metadata = await fs.readJson(metadataFile);
        }

        // Copy files to version dir
        const targetTypeDir = path.join(versionDir, type);
        await fs.ensureDir(targetTypeDir);
        await fs.copy(path.join(fragmentsDir, file), path.join(targetTypeDir, `${name}.yml`));
        if (await fs.pathExists(metadataFile)) {
            await fs.copy(metadataFile, path.join(targetTypeDir, `${name}.json`));
            if (metadata.configs && Array.isArray(metadata.configs)) {
                for (const config of metadata.configs) {
                    if (config.source) {
                        const sourcePath = path.join(fragmentsDir, type, config.source);
                        const targetPath = path.join(targetTypeDir, config.source);
                        if (await fs.pathExists(sourcePath)) {
                            // Ensure the subdirectory in targetTypeDir exists if source contains slashes
                            await fs.ensureDir(path.dirname(targetPath));
                            await fs.copy(sourcePath, targetPath);
                        } else {
                            console.warn(`Config source file not found: ${sourcePath}`);
                        }
                    }
                }
            }
        }

        index.fragments.push({
            type,
            name,
            description: metadata.description,
            path: file,
            metadataPath: `${type}/${name}.json`
        });
    }

    await fs.writeJson(path.join(versionDir, 'index.json'), index, { spaces: 2 });

    // Copy docs to registry
    const docsSrc = path.join(process.cwd(), 'docs');
    const docsDest = path.join(registryDir, 'docs');
    if (await fs.pathExists(docsSrc)) {
        await fs.copy(docsSrc, docsDest);
    }

    // Update latest
    await fs.remove(latestDir);
    await fs.copy(versionDir, latestDir);

    // Generate index.html landing page
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Composable Registry</title>
    <style>
        :root {
            --primary: #6366f1;
            --bg: #0f172a;
            --text: #f8fafc;
        }
        body {
            font-family: 'Inter', sans-serif;
            background: var(--bg);
            color: var(--text);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            text-align: center;
        }
        h1 { font-size: 3rem; margin-bottom: 0.5rem; color: var(--primary); }
        p { font-size: 1.25rem; opacity: 0.8; max-width: 600px; }
        .links { margin-top: 2rem; display: flex; gap: 1rem; }
        a {
            color: white;
            text-decoration: none;
            padding: 0.75rem 1.5rem;
            background: var(--primary);
            border-radius: 0.5rem;
            transition: transform 0.2s;
        }
        a:hover { transform: scale(1.05); }
    </style>
</head>
<body>
    <h1>Composable</h1>
    <p>A collection of Docker Compose fragments for modern development.</p>
    <div class="links">
        <a href="docs/getting-started.md">Getting Started</a>
        <a href="latest/index.json">Fragments Index</a>
    </div>
</body>
</html>
    `;
    await fs.writeFile(path.join(registryDir, 'index.html'), htmlContent);

    console.log(`Registry built for version ${version} at ${registryDir}`);
}

buildRegistry().catch(err => {
    console.error(err);
    process.exit(1);
});
