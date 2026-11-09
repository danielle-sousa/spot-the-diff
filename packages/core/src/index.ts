// Config: read and validate visual.config.json
export { ConfigError } from './config/config-error.ts';
export type { ConfigErrorCode } from './config/config-error.ts';
export { loadVisualConfig } from './config/load-visual-config.ts';
export { parseVisualConfig } from './config/visual-config.ts';
export type { RouteConfig, ViewportConfig, VisualConfig } from './config/visual-config.ts';

// Capture: take screenshots with a shared browser
export { openScreenshotSession } from './capture/screenshot-session.ts';
export type { ScreenshotRequest, ScreenshotSession, Viewport } from './capture/screenshot-session.ts';

// Compare: measure and judge the difference between two screenshots
export { compareScreenshots } from './compare/compare-screenshots.ts';
export type { CompareOptions, ScreenshotComparison } from './compare/compare-screenshots.ts';
export { getComparisonVerdict } from './compare/comparison-verdict.ts';
export type { ComparisonInput, ComparisonVerdict } from './compare/comparison-verdict.ts';

// Run: check every route at every viewport
export { runVisualCheck } from './run/run-visual-check.ts';
export type { RunVisualCheckOptions, ScreenshotResult } from './run/run-visual-check.ts';

// Report: turn results into the pull request comment
export { REPORT_MARKER, buildPullRequestReport, countResultsByStatus } from './report/build-pull-request-report.ts';
export type { ReportOptions, ResultCounts } from './report/build-pull-request-report.ts';
export { formatDiffPercent } from './report/format-diff-percent.ts';

// Baselines: accept screenshots as the new reference
export { copyScreenshotsToBaselines } from './baselines/copy-screenshots-to-baselines.ts';