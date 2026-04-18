import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as dev from '../src/cli/commands/dev.js';
import fs from 'fs-extra';
import path from 'path';

vi.mock('fs-extra');

describe('generateStack', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should generate stack.json from compose.yml', async () => {
        const composeYaml = `
services:
  prometheus:
    extends:
      file: .compose/prometheus.yml
      service: prometheus
  grafana:
    extends:
      file: .compose/grafana.yml
      service: grafana
  custom_app:
    image: myapp:latest
`;
        
        vi.mocked(fs.pathExists).mockResolvedValue(true as never);
        vi.mocked(fs.readFile).mockResolvedValue(composeYaml as never);
        
        const writeJsonSpy = vi.mocked(fs.writeJson);
        
        await dev.generateStack('compose.yml');

        expect(writeJsonSpy).toHaveBeenCalled();
        const callArgs = writeJsonSpy.mock.calls[0];
        expect(callArgs[0]).toMatch(/stack\.json$/);
        
        const stackConfig = callArgs[1] as any;
        expect(stackConfig.fragments).toHaveLength(2);
        expect(stackConfig.fragments).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ type: 'compose', name: 'prometheus' }),
                expect.objectContaining({ type: 'compose', name: 'grafana' })
            ])
        );
    });
});
