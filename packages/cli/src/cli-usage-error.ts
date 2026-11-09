export type CliUsageErrorCode = 'CLI_UNKNOWN_COMMAND' | 'CLI_INVALID_OPTION' | 'CLI_NOTHING_TO_APPROVE';

/** A mistake in how the command was called, as opposed to a bug or a failed check. */
export class CliUsageError extends Error {
  readonly code: CliUsageErrorCode;

  constructor(code: CliUsageErrorCode, message: string) {
    super(message);
    this.name = 'CliUsageError';
    this.code = code;
  }
}