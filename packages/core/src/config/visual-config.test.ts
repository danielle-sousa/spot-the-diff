import { describe, expect, it } from 'vitest';
import { ConfigError } from './config-error.ts';
import { parseVisualConfig } from './visual-config.ts';

function buildRawConfig(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    baseUrl: 'http://localhost:4200',
    viewports: [{ name: 'mobile', width: 390, height: 844 }],
    routes: [{ name: 'home', path: '/' }],
    ...overrides,
  };
}

function captureConfigError(rawConfig: unknown): ConfigError {
  try {
    parseVisualConfig(rawConfig);
  } catch (error) {
    if (error instanceof ConfigError) return error;
    throw error;
  }
  throw new Error('Expected parseVisualConfig to throw a ConfigError');
}

describe('parseVisualConfig', () => {
  it('fills in the default tolerances and masks', () => {
    const config = parseVisualConfig(buildRawConfig());

    expect(config.threshold).toBe(0.1);
    expect(config.maxDiffPercent).toBe(0);
    expect(config.routes[0]?.mask).toEqual([]);
  });

  it('keeps values the user set explicitly', () => {
    const config = parseVisualConfig(buildRawConfig({ maxDiffPercent: 2 }));

    expect(config.maxDiffPercent).toBe(2);
  });

  it('rejects a route path that does not start with a slash', () => {
    const error = captureConfigError(buildRawConfig({ routes: [{ name: 'home', path: 'home' }] }));

    expect(error.code).toBe('CONFIG_INVALID');
    expect(error.message).toContain('routes[0].path');
  });

  it('rejects names that are not safe to use in file names', () => {
    const error = captureConfigError(buildRawConfig({ routes: [{ name: 'Home Page', path: '/' }] }));

    expect(error.message).toContain('routes[0].name');
  });

  it('rejects two routes with the same name', () => {
    const error = captureConfigError(
      buildRawConfig({ routes: [{ name: 'home', path: '/' }, { name: 'home', path: '/inicio' }] }),
    );

    expect(error.message).toContain('Each route needs a unique name');
  });

  it('reports every problem at once', () => {
    const error = captureConfigError({ baseUrl: 'localhost', viewports: [], routes: [] });

    expect(error.message).toContain('baseUrl');
    expect(error.message).toContain('viewports');
    expect(error.message).toContain('routes');
  });
});