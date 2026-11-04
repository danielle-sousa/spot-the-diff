import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadVisualConfig } from './load-visual-config.ts';

describe('loadVisualConfig', () => {
  let workDir = '';

  beforeEach(async () => {
    workDir = await mkdtemp(join(tmpdir(), 'spot-the-diff-'));
  });

  afterEach(async () => {
    await rm(workDir, { recursive: true, force: true });
  });

  it('loads and validates a config file', async () => {
    const configPath = join(workDir, 'visual.config.json');
    await writeFile(configPath, JSON.stringify({
      baseUrl: 'http://localhost:4200',
      viewports: [{ name: 'desktop', width: 1440, height: 900 }],
      routes: [{ name: 'home', path: '/' }],
    }));

    const config = await loadVisualConfig(configPath);

    expect(config.routes[0]?.name).toBe('home');
  });

  it('explains when the file does not exist', async () => {
    await expect(loadVisualConfig(join(workDir, 'missing.json'))).rejects.toMatchObject({ code: 'CONFIG_NOT_FOUND' });
  });

  it('explains when the file is not valid JSON', async () => {
    const configPath = join(workDir, 'visual.config.json');
    await writeFile(configPath, '{ "baseUrl": ');

    await expect(loadVisualConfig(configPath)).rejects.toMatchObject({ code: 'CONFIG_INVALID_JSON' });
  });
});