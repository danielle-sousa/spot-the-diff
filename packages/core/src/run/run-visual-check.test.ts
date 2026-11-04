import { cp, mkdtemp, rm } from 'node:fs/promises';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { parseVisualConfig, type VisualConfig } from '../config/visual-config.ts';
import { runVisualCheck } from './run-visual-check.ts';

/** HTML served per path; tests change it to simulate a pull request. */
const pages = new Map<string, string>();

describe('runVisualCheck', () => {
  let server: Server;
  let workDir: string;
  let config: VisualConfig;

  beforeAll(async () => {
    server = createServer((request, response) => {
      response.setHeader('content-type', 'text/html');
      response.end(pages.get(request.url ?? '/') ?? '<h1>Not found</h1>');
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const { port } = server.address() as AddressInfo;

    workDir = await mkdtemp(join(tmpdir(), 'spot-the-diff-run-'));
    config = parseVisualConfig({
      baseUrl: `http://localhost:${port}`,
      viewports: [{ name: 'mobile', width: 390, height: 300 }],
      routes: [{ name: 'home', path: '/' }, { name: 'extrato', path: '/extrato' }],
    });

    pages.set('/', '<h1>Home</h1>');
    pages.set('/extrato', '<h1>Extrato</h1><button style="background:purple;color:white">Transferir</button>');
  });

  afterAll(async () => {
    server.close();
    await rm(workDir, { recursive: true, force: true });
  });

  it('reports every screenshot as new on the first run', async () => {
    const results = await runVisualCheck({
      config,
      baselineDir: join(workDir, 'baselines'),
      outputDir: join(workDir, 'first-run'),
    });

    expect(results.map((result) => [result.name, result.status])).toEqual([
      ['home--mobile', 'new'],
      ['extrato--mobile', 'new'],
    ]);
  }, 60_000);

  it('flags only the route that changed once baselines exist', async () => {
    await cp(join(workDir, 'first-run'), join(workDir, 'baselines'), { recursive: true });
    pages.set('/extrato', '<h1>Extrato</h1><button style="background:teal;color:white">Transferir</button>');

    const results = await runVisualCheck({
      config,
      baselineDir: join(workDir, 'baselines'),
      outputDir: join(workDir, 'second-run'),
    });

    expect(results.map((result) => [result.name, result.status])).toEqual([
      ['home--mobile', 'unchanged'],
      ['extrato--mobile', 'changed'],
    ]);
  }, 60_000);
});