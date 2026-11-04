export type ConfigErrorCode = 'CONFIG_NOT_FOUND' | 'CONFIG_INVALID_JSON' | 'CONFIG_INVALID';

/**
 * Raised for any problem with the user's config file. The code lets the CLI
 * and the Action react to each case without parsing the message text.
 */
export class ConfigError extends Error {
  readonly code: ConfigErrorCode;

  constructor(code: ConfigErrorCode, message: string) {
    super(message);
    this.name = 'ConfigError';
    this.code = code;
  }
}