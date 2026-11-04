import { readFile } from 'node:fs/promises';
import { ConfigError } from './config-error.ts';
import { parseVisualConfig, type VisualConfig } from './visual-config.ts';

/** Reads the JSON config file from disk and validates it. */
export async function loadVisualConfig(configPath: string): Promise<VisualConfig> {
  const fileContents = await readConfigFile(configPath);
  return parseVisualConfig(parseJson(fileContents, configPath));
}

async function readConfigFile(configPath: string): Promise<string> {
  try {
    return await readFile(configPath, 'utf8');
  } catch {
    throw new ConfigError('CONFIG_NOT_FOUND', `Config file not found at ${configPath}. Create it or pass another path.`);
  }
}

function parseJson(fileContents: string, configPath: string): unknown {
  try {
    return JSON.parse(fileContents);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new ConfigError('CONFIG_INVALID_JSON', `${configPath} is not valid JSON: ${reason}`);
  }
}