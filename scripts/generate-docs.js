import fs from 'fs-extra';
import * as path from 'path';
import { glob } from 'glob';

async function generateDocs() {
    const fragmentFiles = await glob('fragments/compose/*.yml');
    
    for (const file of fragmentFiles) {
        const name = path.basename(file, '.yml');
        const jsonPath = file.replace('.yml', '.json');
        
        let metadata = { name, description: '', variables: {} };
        if (await fs.pathExists(jsonPath)) {
            metadata = await fs.readJson(jsonPath);
        }
        
        const date = new Date().toISOString().split('T')[0];
        let docContent = `---
title: ${metadata.name}
description: ${metadata.description || 'A composable fragment'}
tags:
  - compose
  - fragment
last_updated: ${date}
---

# ${metadata.name}

${metadata.description || 'No description provided.'}

## Variables

The following environment variables can be configured:

| Variable | Default Value | Description |
|----------|---------------|-------------|
`;

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
        await fs.writeFile(outPath, docContent);
        console.log(`Generated ${outPath}`);
    }

    await updateIndex(fragmentFiles);
    await generateStackDocs();
}

async function generateStackDocs() {
    const stackFiles = await glob('stacks/*.json');
    const stacks = [];

    for (const file of stackFiles) {
        const stack = await fs.readJson(file);
        stacks.push(stack);

        const date = new Date().toISOString().split('T')[0];
        let docContent = `---
title: ${stack.name}
description: ${stack.description || 'A composable stack'}
tags:
  - stack
last_updated: ${date}
---

# ${stack.name}

${stack.description || 'No description provided.'}

## Components

`;

        for (const fragment of stack.fragments) {
            docContent += `- [${fragment.name}](../fragments/compose/${fragment.name}.md)\n`;
        }

        const outPath = path.join('docs', 'stacks', `${stack.name}.md`);
        await fs.writeFile(outPath, docContent);
        console.log(`Generated ${outPath}`);
    }

    await updateStacksIndex(stacks);
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

async function updateIndex(fragmentFiles) {

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

generateDocs().catch(console.error);

