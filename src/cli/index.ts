import { Command } from 'commander';
import fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import * as dotenv from 'dotenv';
import yaml from 'yaml';

const program = new Command();
const CACHE_DIR = path.join(os.homedir(), '.composable', 'fragments');
const REGISTRY_URL = 'https://voidrot.github.io/composable/latest';

program
  .name('composable')
  .description('Manage Docker Compose fragments')
  .version('1.0.0');

async function ensureCacheDir() {
  await fs.ensureDir(CACHE_DIR);
}

async function fetchFromRegistry(filePath: string) {
  const url = `${REGISTRY_URL}/${filePath}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  return await response.text();
}

program
  .command('add <type> <name>')
  .description('Add a fragment to your project')
  .option('-e, --extend', 'Add the service directly to an existing compose.yml using extends syntax')
  .action(async (type, name, options) => {
    try {
      await ensureCacheDir();
      const fragmentPath = path.join(type, `${name}.yml`);
      const metadataPath = path.join(type, `${name}.json`);
      const localFragmentPath = path.join(CACHE_DIR, fragmentPath);
      const localMetadataPath = path.join(CACHE_DIR, metadataPath);

      // Check cache or fetch
      if (!await fs.pathExists(localFragmentPath)) {
        console.log(`Fetching ${name}...`);
        const content = await fetchFromRegistry(fragmentPath);
        await fs.ensureDir(path.dirname(localFragmentPath));
        await fs.writeFile(localFragmentPath, content);
      }

      if (!await fs.pathExists(localMetadataPath)) {
        try {
          const metadataContent = await fetchFromRegistry(metadataPath);
          await fs.writeFile(localMetadataPath, metadataContent);
        } catch (e) {
          // Metadata might not exist
        }
      }

      // Copy to local compose directory
      const targetDir = path.join(process.cwd(), 'compose');
      await fs.ensureDir(targetDir);
      await fs.copy(localFragmentPath, path.join(targetDir, `${name}.yml`));

      if (options.extend) {
        const composeFiles = ['compose.yml', 'compose.yaml', 'docker-compose.yml', 'docker-compose.yaml'];
        let composePath = '';
        for (const file of composeFiles) {
          if (await fs.pathExists(path.join(process.cwd(), file))) {
            composePath = path.join(process.cwd(), file);
            break;
          }
        }
        
        if (!composePath) {
          composePath = path.join(process.cwd(), 'compose.yml');
          await fs.writeFile(composePath, 'services:\n');
        }

        const composeContent = await fs.readFile(composePath, 'utf-8');
        const doc = yaml.parseDocument(composeContent);
        
        const fragmentContent = await fs.readFile(localFragmentPath, 'utf-8');
        const fragmentDoc = yaml.parseDocument(fragmentContent);
        
        let servicesNode = doc.get('services') as any;
        if (!servicesNode) {
          servicesNode = doc.createNode({});
          doc.set('services', servicesNode);
        }
        const fragmentServices = fragmentDoc.get('services') as any;

        if (fragmentServices && fragmentServices.items) {
          for (const item of fragmentServices.items) {
            const serviceName = item.key.value;
            servicesNode.set(serviceName, doc.createNode({
              extends: {
                file: `compose/${name}.yml`,
                service: serviceName
              }
            }));
          }
        }

        await fs.writeFile(composePath, doc.toString());
        console.log(`Added service to ${path.basename(composePath)} using extends`);
      }

      // Handle .env variables
      if (await fs.pathExists(localMetadataPath)) {
        const metadata = await fs.readJson(localMetadataPath);
        if (metadata.variables) {
          const envPath = path.join(process.cwd(), '.env');
          let envContent = '';
          if (await fs.pathExists(envPath)) {
            envContent = await fs.readFile(envPath, 'utf-8');
          }

          const existingVars = dotenv.parse(envContent);
          let updated = false;
          let newLines = '\n# Composable variables for ' + name + '\n';
          
          for (const [key, value] of Object.entries(metadata.variables)) {
            if (!(key in existingVars)) {
              newLines += `${key}=${value}\n`;
              updated = true;
            }
          }

          if (updated) {
            await fs.appendFile(envPath, newLines);
            console.log(`Updated .env with default variables for ${name}`);
          }
        }
      }

      console.log(`Successfully added ${name} to ./compose/${name}.yml`);
    } catch (error: any) {
      console.error(`Error adding fragment: ${error.message}`);
    }
  });

program
  .command('search [query]')
  .description('Search for fragments')
  .action(async (query) => {
    try {
      console.log('Fetching index...');
      const indexStr = await fetchFromRegistry('index.json');
      const index = JSON.parse(indexStr);
      
      const results = index.fragments.filter((f: any) => 
        !query || 
        f.name.includes(query) || 
        f.type.includes(query) || 
        f.description.includes(query)
      );

      console.table(results.map((r: any) => ({
        Type: r.type,
        Name: r.name,
        Description: r.description
      })));
    } catch (error: any) {
      console.error(`Error searching: ${error.message}`);
    }
  });

program
  .command('cache')
  .option('--all', 'Cache all fragments')
  .description('Manage local cache')
  .action(async (options) => {
    if (options.all) {
      try {
        await ensureCacheDir();
        console.log('Fetching index...');
        const indexStr = await fetchFromRegistry('index.json');
        const index = JSON.parse(indexStr);

        for (const f of index.fragments) {
          console.log(`Caching ${f.name}...`);
          const yaml = await fetchFromRegistry(f.path);
          const localYamlPath = path.join(CACHE_DIR, f.path);
          await fs.ensureDir(path.dirname(localYamlPath));
          await fs.writeFile(localYamlPath, yaml);

          try {
            const json = await fetchFromRegistry(f.metadataPath);
            await fs.writeFile(path.join(CACHE_DIR, f.metadataPath), json);
          } catch (e) {}
        }
        console.log('All fragments cached successfully.');
      } catch (error: any) {
        console.error(`Error caching all: ${error.message}`);
      }
    }
  });

program
  .command('update')
  .description('Update cached fragments from registry')
  .action(async () => {
    // Similar to cache --all but overwrites
    console.log('Updating cache...');
    const indexStr = await fetchFromRegistry('index.json');
    const index = JSON.parse(indexStr);
    for (const f of index.fragments) {
      console.log(`Updating ${f.name}...`);
      const yaml = await fetchFromRegistry(f.path);
      await fs.writeFile(path.join(CACHE_DIR, f.path), yaml);
      try {
        const json = await fetchFromRegistry(f.metadataPath);
        await fs.writeFile(path.join(CACHE_DIR, f.metadataPath), json);
      } catch (e) {}
    }
    console.log('Cache updated.');
  });

program
  .command('init-metadata <ymlPath>')
  .description('Initialize metadata for a local fragment (developer tool)')
  .action(async (ymlPath) => {
    try {
      if (!await fs.pathExists(ymlPath)) {
        throw new Error(`File not found: ${ymlPath}`);
      }
      const content = await fs.readFile(ymlPath, 'utf-8');
      const varRegex = /\${([A-Z0-9_]+)(?::-([^}]+))?}/g;
      const vars: Record<string, string> = {};
      let match;
      while ((match = varRegex.exec(content)) !== null) {
        vars[match[1]] = match[2] || '';
      }

      const dir = path.dirname(ymlPath);
      const name = path.basename(ymlPath, '.yml');
      const metadataPath = path.join(dir, `${name}.json`);

      const metadata = {
        name,
        description: '',
        variables: vars
      };

      await fs.writeJson(metadataPath, metadata, { spaces: 2 });
      console.log(`Generated metadata skeleton at ${metadataPath}`);
    } catch (error: any) {
      console.error(`Error: ${error.message}`);
    }
  });

program.parse();
