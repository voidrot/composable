import fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import yaml from 'yaml';

export interface RegistryConfig {
    name: string;
    url: string;
}

export interface Config {
    registries: RegistryConfig[];
    defaults?: {
        env_file?: boolean;
        build?: boolean;
        watch?: boolean;
    };
}

const CONFIG_DIR = path.join(os.homedir(), '.composable');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.yml');

const DEFAULT_CONFIG: Config = {
    registries: [
        {
            name: 'default',
            url: 'https://voidrot.github.io/composable/latest'
        }
    ]
};

export async function getConfig(): Promise<Config> {
    if (!(await fs.pathExists(CONFIG_PATH))) {
        await fs.ensureDir(CONFIG_DIR);
        await fs.writeFile(CONFIG_PATH, yaml.stringify(DEFAULT_CONFIG));
        return DEFAULT_CONFIG;
    }
    
    try {
        const content = await fs.readFile(CONFIG_PATH, 'utf-8');
        const parsed = yaml.parse(content);
        if (!parsed || !parsed.registries) {
            return DEFAULT_CONFIG;
        }
        return parsed as Config;
    } catch (e) {
        console.warn(`Failed to parse ${CONFIG_PATH}, using defaults.`);
        return DEFAULT_CONFIG;
    }
}
