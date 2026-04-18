import fs from 'fs-extra';
import { glob } from 'glob';
import * as path from 'path';

// This is a skeleton script. A full implementation would query Docker Hub / GHCR 
// to find the latest valid semver tags and update the YAML files.
async function updateTags() {
    console.log("Scanning fragments for images...");
    const files = await glob('fragments/**/*.yml');
    
    let updatedCount = 0;
    
    for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');
        
        // Match `image: something:tag`
        const regex = /image:\s*([^\s:]+):([^\s]+)/g;
        let match;
        let newContent = content;
        
        while ((match = regex.exec(content)) !== null) {
            const imageName = match[1];
            const currentTag = match[2];
            
            // Exclude latest or variable tags
            if (currentTag === 'latest' || currentTag.startsWith('${')) continue;
            
            console.log(`Found image ${imageName}:${currentTag} in ${file}`);
            
            // In a real script, we would fetch the latest tag here.
            // const latestTag = await fetchLatestTag(imageName);
            // if (latestTag && latestTag !== currentTag) {
            //     newContent = newContent.replace(`image: ${imageName}:${currentTag}`, `image: ${imageName}:${latestTag}`);
            //     updatedCount++;
            // }
        }
        
        if (newContent !== content) {
            await fs.writeFile(file, newContent);
            console.log(`Updated tags in ${file}`);
        }
    }
    
    console.log(`Finished updating. Changed files: ${updatedCount}`);
}

updateTags().catch(console.error);
