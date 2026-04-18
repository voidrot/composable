import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as registryModule from '../src/cli/utils/registry.js';
import * as configModule from '../src/cli/utils/config.js';
import fs from 'fs-extra';

vi.mock('fs-extra');
vi.mock('../src/cli/utils/config.js');

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('registry', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('fetchMergedIndex', () => {
        it('should return merged index from a single registry', async () => {
            vi.mocked(configModule.getConfig).mockResolvedValue({
                registries: [{ name: 'default', url: 'https://example.com/registry' }]
            });

            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({
                    fragments: [{ name: 'postgresql', type: 'compose', path: 'compose/postgresql.yml', description: 'PostgreSQL' }],
                    stacks: [{ name: 'django-base', path: 'stacks/django-base.json', description: 'Django stack' }]
                })
            });

            const index = await registryModule.fetchMergedIndex();

            expect(index.fragments).toHaveLength(1);
            expect(index.fragments[0].name).toBe('postgresql');
            expect(index.fragments[0].registryUrl).toBe('https://example.com/registry');
            expect(index.stacks).toHaveLength(1);
            expect(index.stacks[0].name).toBe('django-base');
            expect(index.stacks[0].registryUrl).toBe('https://example.com/registry');
        });

        it('should merge fragments from multiple registries', async () => {
            vi.mocked(configModule.getConfig).mockResolvedValue({
                registries: [
                    { name: 'default', url: 'https://registry1.example.com' },
                    { name: 'custom', url: 'https://registry2.example.com' }
                ]
            });

            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        fragments: [{ name: 'postgresql', type: 'compose', path: 'compose/postgresql.yml', description: 'PostgreSQL' }],
                        stacks: []
                    })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        fragments: [{ name: 'redis', type: 'compose', path: 'compose/redis.yml', description: 'Redis' }],
                        stacks: []
                    })
                });

            const index = await registryModule.fetchMergedIndex();

            expect(index.fragments).toHaveLength(2);
            expect(index.fragments[0].name).toBe('postgresql');
            expect(index.fragments[0].registryUrl).toBe('https://registry1.example.com');
            expect(index.fragments[1].name).toBe('redis');
            expect(index.fragments[1].registryUrl).toBe('https://registry2.example.com');
        });

        it('should skip registries that return a non-ok response', async () => {
            vi.mocked(configModule.getConfig).mockResolvedValue({
                registries: [
                    { name: 'bad', url: 'https://bad.example.com' },
                    { name: 'good', url: 'https://good.example.com' }
                ]
            });

            mockFetch
                .mockResolvedValueOnce({ ok: false })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        fragments: [{ name: 'redis', type: 'compose', path: 'compose/redis.yml', description: 'Redis' }],
                        stacks: []
                    })
                });

            const index = await registryModule.fetchMergedIndex();

            expect(index.fragments).toHaveLength(1);
            expect(index.fragments[0].name).toBe('redis');
        });

        it('should skip registries that throw a network error', async () => {
            vi.mocked(configModule.getConfig).mockResolvedValue({
                registries: [{ name: 'default', url: 'https://example.com/registry' }]
            });

            mockFetch.mockRejectedValue(new Error('Network error'));

            const index = await registryModule.fetchMergedIndex();

            expect(index.fragments).toHaveLength(0);
            expect(index.stacks).toHaveLength(0);
        });
    });

    describe('fetchFromRegistry', () => {
        it('should return text content from registry', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                text: async () => 'services:\n  postgresql:\n    image: postgres:16'
            });

            const content = await registryModule.fetchFromRegistry(
                'https://example.com/registry',
                'compose/postgresql.yml'
            );

            expect(content).toBe('services:\n  postgresql:\n    image: postgres:16');
            expect(mockFetch).toHaveBeenCalledWith('https://example.com/registry/compose/postgresql.yml');
        });

        it('should throw an error when the response is not ok', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                statusText: 'Not Found'
            });

            await expect(
                registryModule.fetchFromRegistry('https://example.com/registry', 'compose/missing.yml')
            ).rejects.toThrow('Failed to fetch https://example.com/registry/compose/missing.yml: Not Found');
        });
    });

    describe('ensureCacheDir', () => {
        it('should call fs.ensureDir with the cache directory', async () => {
            vi.mocked(fs.ensureDir).mockResolvedValue(undefined as never);

            await registryModule.ensureCacheDir();

            expect(fs.ensureDir).toHaveBeenCalledWith(registryModule.CACHE_DIR);
        });
    });
});
