import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as config from '../src/cli/utils/config.js';
import fs from 'fs-extra';

vi.mock('fs-extra');

describe('config', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return default config if none exists', async () => {
        vi.mocked(fs.pathExists).mockResolvedValue(false as never);
        
        const res = await config.getConfig();
        expect(res.registries).toHaveLength(1);
        expect(res.registries[0].name).toBe('default');
    });

    it('should parse existing config', async () => {
        vi.mocked(fs.pathExists).mockResolvedValue(true as never);
        vi.mocked(fs.readFile).mockResolvedValue(`
registries:
  - name: my-reg
    url: https://example.com/registry
` as never);

        const res = await config.getConfig();
        expect(res.registries).toHaveLength(1);
        expect(res.registries[0].name).toBe('my-reg');
    });
});
