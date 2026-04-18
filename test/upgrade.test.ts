import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs-extra';
import * as registryModule from '../src/cli/utils/registry.js';
import { upgradeFragments } from '../src/cli/commands/upgrade.js';

vi.mock('fs-extra');
vi.mock('../src/cli/utils/registry.js');

// Suppress console output in tests
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

const MOCK_REGISTRY_URL = 'https://example.com/registry';

const MOCK_INDEX = {
    fragments: [
        {
            name: 'postgresql',
            type: 'compose',
            path: 'compose/postgresql.yml',
            metadataPath: 'compose/postgresql.json',
            registryUrl: MOCK_REGISTRY_URL,
            description: 'PostgreSQL',
        },
        {
            name: 'redis',
            type: 'compose',
            path: 'compose/redis.yml',
            metadataPath: 'compose/redis.json',
            registryUrl: MOCK_REGISTRY_URL,
            description: 'Redis',
        },
    ],
    stacks: [],
};

const POSTGRES_YML_V1 = 'services:\n  postgresql:\n    image: postgres:15-alpine\n';
const POSTGRES_YML_V2 = 'services:\n  postgresql:\n    image: postgres:16-alpine\n';
const POSTGRES_META = JSON.stringify({
    variables: {
        POSTGRES_VERSION: '16-alpine',
        POSTGRES_PORT: '5432',
        POSTGRES_DB: 'app',
    },
});

const REDIS_YML = 'services:\n  redis:\n    image: redis:7-alpine\n';
const REDIS_META = JSON.stringify({ variables: { REDIS_PORT: '6379' } });

// Helper: set up fs mock for a project with given installed fragments
function mockInstalledFragments(names: string[]) {
    vi.mocked(fs.pathExists).mockImplementation(async (p: any) => {
        const ps = String(p);
        if (ps.endsWith('.compose')) return true;
        if (ps.endsWith('.env.compose')) return false;
        return false;
    });
    vi.mocked(fs.readdir).mockResolvedValue(
        names.map(n => `${n}.yml`) as any
    );
}

describe('upgrade command', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(registryModule.fetchMergedIndex).mockResolvedValue(MOCK_INDEX);
        vi.mocked(registryModule.CACHE_DIR, { optional: true });
        (registryModule as any).CACHE_DIR = '/mock-cache';
    });

    // ─── No .compose directory ───────────────────────────────────────────────

    it('exits with error when .compose directory does not exist', async () => {
        vi.mocked(fs.pathExists).mockResolvedValue(false as never);
        const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

        await expect(upgradeFragments(undefined, {})).rejects.toThrow('exit');
        expect(exitSpy).toHaveBeenCalledWith(1);
    });

    // ─── No installed fragments ───────────────────────────────────────────────

    it('does nothing when .compose directory is empty', async () => {
        vi.mocked(fs.pathExists).mockResolvedValue(true as never);
        vi.mocked(fs.readdir).mockResolvedValue([] as any);

        await upgradeFragments(undefined, {});

        expect(registryModule.fetchMergedIndex).not.toHaveBeenCalled();
    });

    // ─── Single fragment named but not installed ──────────────────────────────

    it('exits with error when named fragment is not in .compose/', async () => {
        vi.mocked(fs.pathExists).mockResolvedValue(true as never);
        vi.mocked(fs.readdir).mockResolvedValue(['redis.yml'] as any);
        const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

        await expect(upgradeFragments('postgresql', {})).rejects.toThrow('exit');
        expect(exitSpy).toHaveBeenCalledWith(1);
    });

    // ─── Fragment not in registry ─────────────────────────────────────────────

    it('reports skipped when fragment is not found in any registry', async () => {
        mockInstalledFragments(['unknown-service']);
        vi.mocked(registryModule.fetchMergedIndex).mockResolvedValue({ fragments: [], stacks: [] });

        await upgradeFragments(undefined, {});

        // Should not try to write any files
        expect(fs.writeFile).not.toHaveBeenCalled();
    });

    // ─── Fragment already up-to-date ──────────────────────────────────────────

    it('skips a fragment that is already up-to-date', async () => {
        mockInstalledFragments(['postgresql']);
        vi.mocked(fs.readFile).mockResolvedValue(POSTGRES_YML_V2 as any);
        vi.mocked(registryModule.fetchFromRegistry).mockResolvedValue(POSTGRES_YML_V2);

        await upgradeFragments(undefined, {});

        // writeFile should not be called for the project file when unchanged
        expect(fs.writeFile).not.toHaveBeenCalled();
    });

    // ─── Fragment updated ─────────────────────────────────────────────────────

    it('overwrites .compose/<name>.yml when registry content differs', async () => {
        mockInstalledFragments(['postgresql']);
        vi.mocked(fs.readFile).mockResolvedValue(POSTGRES_YML_V1 as any);
        vi.mocked(fs.ensureDir).mockResolvedValue(undefined as never);
        vi.mocked(fs.writeFile).mockResolvedValue(undefined as never);
        vi.mocked(registryModule.fetchFromRegistry).mockImplementation(async (_url, filePath) => {
            if (String(filePath).endsWith('.yml')) return POSTGRES_YML_V2;
            return POSTGRES_META;
        });

        await upgradeFragments(undefined, {});

        // Should have written the new fragment content
        const writeCalls = vi.mocked(fs.writeFile).mock.calls;
        const compositeWrite = writeCalls.find(c => String(c[0]).endsWith('postgresql.yml'));
        expect(compositeWrite).toBeDefined();
        expect(compositeWrite![1]).toBe(POSTGRES_YML_V2);
    });

    // ─── Cache also gets updated ──────────────────────────────────────────────

    it('updates the global cache alongside the project file', async () => {
        mockInstalledFragments(['postgresql']);
        vi.mocked(fs.readFile).mockResolvedValue(POSTGRES_YML_V1 as any);
        vi.mocked(fs.ensureDir).mockResolvedValue(undefined as never);
        vi.mocked(fs.writeFile).mockResolvedValue(undefined as never);
        vi.mocked(registryModule.fetchFromRegistry).mockImplementation(async (_url, filePath) => {
            if (String(filePath).endsWith('.yml')) return POSTGRES_YML_V2;
            return POSTGRES_META;
        });

        await upgradeFragments(undefined, {});

        const writeCalls = vi.mocked(fs.writeFile).mock.calls;
        const cacheWrite = writeCalls.find(c => String(c[0]).includes('mock-cache'));
        expect(cacheWrite).toBeDefined();
    });

    // ─── New env vars appended to .env.compose ────────────────────────────────

    it('appends new env vars to .env.compose when metadata has new variables', async () => {
        mockInstalledFragments(['postgresql']);
        vi.mocked(fs.pathExists).mockImplementation(async (p: any) => {
            const ps = String(p);
            if (ps.endsWith('.compose')) return true;
            if (ps.endsWith('.env.compose')) return true;
            return false;
        });
        // .env.compose only has POSTGRES_PORT — POSTGRES_DB is new
        vi.mocked(fs.readFile).mockImplementation(async (p: any) => {
            if (String(p).endsWith('.env.compose')) return '# POSTGRES_PORT=5432\n' as any;
            return POSTGRES_YML_V1 as any;
        });
        vi.mocked(fs.ensureDir).mockResolvedValue(undefined as never);
        vi.mocked(fs.writeFile).mockResolvedValue(undefined as never);
        vi.mocked(fs.appendFile).mockResolvedValue(undefined as never);
        vi.mocked(registryModule.fetchFromRegistry).mockImplementation(async (_url, filePath) => {
            if (String(filePath).endsWith('.yml')) return POSTGRES_YML_V2;
            return POSTGRES_META; // includes POSTGRES_VERSION, POSTGRES_PORT, POSTGRES_DB
        });

        await upgradeFragments(undefined, {});

        const appendCall = vi.mocked(fs.appendFile).mock.calls[0];
        expect(appendCall).toBeDefined();
        const appended = String(appendCall[1]);
        // POSTGRES_DB is new — should be added
        expect(appended).toContain('POSTGRES_DB');
        // POSTGRES_PORT already present — should NOT be duplicated
        expect(appended).not.toContain('POSTGRES_PORT');
    });

    // ─── No new env vars ─────────────────────────────────────────────────────

    it('does not append to .env.compose when all vars are already present', async () => {
        mockInstalledFragments(['postgresql']);
        vi.mocked(fs.pathExists).mockImplementation(async (p: any) => {
            const ps = String(p);
            if (ps.endsWith('.compose')) return true;
            if (ps.endsWith('.env.compose')) return true;
            return false;
        });
        // All vars already present
        vi.mocked(fs.readFile).mockImplementation(async (p: any) => {
            if (String(p).endsWith('.env.compose'))
                return '# POSTGRES_VERSION=15\n# POSTGRES_PORT=5432\n# POSTGRES_DB=app\n' as any;
            return POSTGRES_YML_V1 as any;
        });
        vi.mocked(fs.ensureDir).mockResolvedValue(undefined as never);
        vi.mocked(fs.writeFile).mockResolvedValue(undefined as never);
        vi.mocked(fs.appendFile).mockResolvedValue(undefined as never);
        vi.mocked(registryModule.fetchFromRegistry).mockImplementation(async (_url, filePath) => {
            if (String(filePath).endsWith('.yml')) return POSTGRES_YML_V2;
            return POSTGRES_META;
        });

        await upgradeFragments(undefined, {});

        expect(fs.appendFile).not.toHaveBeenCalled();
    });

    // ─── --force flag ─────────────────────────────────────────────────────────

    it('overwrites unchanged fragment when --force is set', async () => {
        mockInstalledFragments(['postgresql']);
        vi.mocked(fs.readFile).mockResolvedValue(POSTGRES_YML_V2 as any); // identical to registry
        vi.mocked(fs.ensureDir).mockResolvedValue(undefined as never);
        vi.mocked(fs.writeFile).mockResolvedValue(undefined as never);
        vi.mocked(registryModule.fetchFromRegistry).mockImplementation(async (_url, filePath) => {
            if (String(filePath).endsWith('.yml')) return POSTGRES_YML_V2;
            return POSTGRES_META;
        });

        await upgradeFragments(undefined, { force: true });

        // Should write even though content is the same
        const writeCalls = vi.mocked(fs.writeFile).mock.calls;
        const compositeWrite = writeCalls.find(c => String(c[0]).endsWith('postgresql.yml'));
        expect(compositeWrite).toBeDefined();
    });

    // ─── Single named fragment upgrade ───────────────────────────────────────

    it('upgrades only the named fragment when a name is given', async () => {
        mockInstalledFragments(['postgresql', 'redis']);
        vi.mocked(fs.readFile).mockResolvedValue(POSTGRES_YML_V1 as any);
        vi.mocked(fs.ensureDir).mockResolvedValue(undefined as never);
        vi.mocked(fs.writeFile).mockResolvedValue(undefined as never);
        vi.mocked(registryModule.fetchFromRegistry).mockImplementation(async (_url, filePath) => {
            if (String(filePath).includes('postgresql')) {
                if (String(filePath).endsWith('.yml')) return POSTGRES_YML_V2;
                return POSTGRES_META;
            }
            if (String(filePath).includes('redis')) {
                if (String(filePath).endsWith('.yml')) return REDIS_YML;
                return REDIS_META;
            }
            throw new Error('unexpected fetch');
        });

        await upgradeFragments('postgresql', {});

        // Only postgresql should be fetched — redis should not be touched
        const fetchCalls = vi.mocked(registryModule.fetchFromRegistry).mock.calls;
        const redisCall = fetchCalls.find(c => String(c[1]).includes('redis'));
        expect(redisCall).toBeUndefined();
    });

    // ─── Registry fetch error ─────────────────────────────────────────────────

    it('reports skipped when registry fetch throws', async () => {
        mockInstalledFragments(['postgresql']);
        vi.mocked(fs.readFile).mockResolvedValue(POSTGRES_YML_V1 as any);
        vi.mocked(registryModule.fetchFromRegistry).mockRejectedValue(new Error('connection refused'));

        // Should not throw — error is captured per-fragment
        await expect(upgradeFragments(undefined, {})).resolves.not.toThrow();
        expect(fs.writeFile).not.toHaveBeenCalled();
    });
});
