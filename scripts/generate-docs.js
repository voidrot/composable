import fs from 'fs-extra';
import * as path from 'path';
import { glob } from 'glob';
import YAML from 'yaml';

async function generateDocs() {
    const fragmentFiles = await glob('fragments/compose/*.yml');
    const stackFiles = await glob('stacks/*.json');

    // 1. Generate individual fragment docs
    for (const file of fragmentFiles) {
        const name = path.basename(file, '.yml');
        const jsonPath = file.replace('.yml', '.json');
        
        let metadata = { name, description: '', variables: {} };
        if (await fs.pathExists(jsonPath)) {
            metadata = await fs.readJson(jsonPath);
        }
        
        const date = new Date().toISOString().split('T')[0];
        let docContent = `---\ntitle: ${metadata.name}\ndescription: ${metadata.description || 'A composable fragment'}\ntags:\n  - compose\n  - fragment\nlast_updated: ${date}\n---\n\n# ${metadata.name}\n\n${metadata.description || 'No description provided.'}\n\n## Variables\n\nThe following environment variables can be configured:\n\n| Variable | Default Value | Description |\n|----------|---------------|-------------|\n`;

        if (metadata.variables && Object.keys(metadata.variables).length > 0) {
            for (const [key, value] of Object.entries(metadata.variables)) {
                docContent += `| \`${key}\` | \`${value}\` | | \n`;
            }
        } else {
            docContent = docContent.replace(/\| Variable.*\n\|.*\n\|.*\n/, '');
            docContent += "\nNo environment variables are required.\n";
        }

        if (metadata.build) {
            docContent += `\n## Build\n\nThis fragment supports building from source.\n`;
        }

        if (metadata.watch) {
            docContent += `\n## Watch\n\nThis fragment supports live-syncing code with \`docker compose watch\`.\n`;
        }

        if (metadata.env_file) {
            docContent += `\n## Environment File\n\nThis fragment defaults to using \`.env.compose\` for environment variable isolation.\n`;
        }

        const outPath = path.join('docs', 'fragments', 'compose', `${name}.md`);
        await fs.ensureDir(path.dirname(outPath));
        await fs.writeFile(outPath, docContent);
        console.log(`Generated ${outPath}`);
    }

    // 2. Update fragments index (categorized)
    await updateFragmentsIndex();

    // 3. Generate individual stack docs
    const stacks = [];
    for (const file of stackFiles) {
        const stack = await fs.readJson(file);
        stacks.push(stack);

        const date = new Date().toISOString().split('T')[0];
        let docContent = `---\ntitle: ${stack.name}\ndescription: ${stack.description || 'A composable stack'}\ntags:\n  - stack\nlast_updated: ${date}\n---\n\n# ${stack.name}\n\n${stack.description || 'No description provided.'}\n\n## Components\n\n`;

        for (const fragment of stack.fragments) {
            docContent += `- [${fragment.name}](../fragments/compose/${fragment.name}.md)\n`;
        }

        const outPath = path.join('docs', 'stacks', `${stack.name}.md`);
        await fs.ensureDir(path.dirname(outPath));
        await fs.writeFile(outPath, docContent);
        console.log(`Generated ${outPath}`);
    }

    // 4. Update stacks index
    await updateStacksIndex(stacks);

    // 5. Update mkdocs.yml navigation
    await updateMkDocsNav(fragmentFiles, stacks);
}

async function updateFragmentsIndex() {
    const categories = {
        "Databases & Caching": ["postgresql", "redis", "valkey", "chromadb", "arcadedb"],
        "Message Brokers": ["rabbitmq", "nats", "eclipse-mosquitto"],
        "AI / ML": ["ollama", "vllm"],
        "Web & Routing": ["traefik", "caddy"],
        "Observability": ["grafana", "influxdb", "jaeger", "otel-collector"],
        "Application Frameworks": ["django", "celery", "celery-beat", "celery-flower"]
    };

    let indexContent = `## Available Compose Fragments\n\n`;

    for (const [category, fragments] of Object.entries(categories)) {
        indexContent += `- **${category}**:\n`;
        for (const fragment of fragments) {
            indexContent += `  - [${fragment}](compose/${fragment}.md)\n`;
        }
    }

    const indexPath = path.join('docs', 'fragments', 'index.md');
    const currentContent = await fs.readFile(indexPath, 'utf-8');
    const marker = '## Available Compose Fragments';
    const beforeMarker = currentContent.split(marker)[0];
    
    await fs.writeFile(indexPath, beforeMarker + indexContent);
    console.log(`Updated ${indexPath}`);
}

async function updateStacksIndex(stacks) {
    let indexContent = `## Available Stacks\n\n`;

    for (const stack of stacks) {
        indexContent += `### [${stack.name}](${stack.name}.md)\n\n`;
        indexContent += `${stack.description}\n\n`;
        indexContent += `- **Components**:\n`;
        for (const fragment of stack.fragments) {
            indexContent += `    - [${fragment.name}](../fragments/compose/${fragment.name}.md)\n`;
        }
        indexContent += `\n`;
    }

    const indexPath = path.join('docs', 'stacks', 'index.md');
    const currentContent = await fs.readFile(indexPath, 'utf-8');
    const marker = '## Available Stacks';
    const beforeMarker = currentContent.split(marker)[0];
    
    await fs.writeFile(indexPath, beforeMarker + indexContent);
    console.log(`Updated ${indexPath}`);
}

async function updateMkDocsNav(fragmentFiles, stacks) {
    const mkdocsPath = path.join(process.cwd(), 'mkdocs.yml');
    const content = await fs.readFile(mkdocsPath, 'utf-8');
    const config = YAML.parse(content);

    // Update Fragments -> Compose
    const fragmentsSection = config.nav.find(item => item.Fragments);
    if (fragmentsSection) {
        const composeSection = fragmentsSection.Fragments.find(item => item.Compose);
        if (composeSection) {
            composeSection.Compose = fragmentFiles.map(file => {
                const name = path.basename(file, '.yml');
                return { [name]: `fragments/compose/${name}.md` };
            }).sort((a, b) => Object.keys(a)[0].localeCompare(Object.keys(b)[0]));
        }
    }

    // Update Stacks
    const stacksIndex = config.nav.findIndex(item => item.Stacks);
    if (stacksIndex !== -1) {
        config.nav[stacksIndex] = {
            Stacks: [
                { Overview: 'stacks/index.md' },
                ...stacks.map(s => ({ [s.name]: `stacks/${s.name}.md` })).sort((a, b) => Object.keys(a)[0].localeCompare(Object.keys(b)[0]))
            ]
        };
    }

    await fs.writeFile(mkdocsPath, YAML.stringify(config));
    console.log(`Updated ${mkdocsPath} navigation`);
}

generateDocs().catch(console.error);
