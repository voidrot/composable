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
}

generateDocs().catch(console.error);
