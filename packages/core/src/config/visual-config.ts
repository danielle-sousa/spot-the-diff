import { z } from 'zod';
import { ConfigError } from './config-error.ts';

export interface ViewportConfig {
  name: string;
  width: number;
  height: number;
}

export interface RouteConfig {
  name: string;
  path: string;
  /** CSS selector that must be visible before the screenshot is taken. */
  waitFor?: string;
  /** CSS selectors of dynamic areas (dates, avatars, ads) to hide before comparing. */
  mask: string[];
}

export interface VisualConfig {
  baseUrl: string;
  threshold: number;
  maxDiffPercent: number;
  viewports: ViewportConfig[];
  routes: RouteConfig[];
}

/**
 * Names end up in file names such as "home--mobile.png", so they are kept to
 * lowercase letters, digits and single hyphens. A double hyphen is reserved
 * as the separator between the route and the viewport.
 */
const fileSafeName = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lowercase letters, digits and single hyphens, like "user-profile"');

const hasUniqueNames = (items: { name: string }[]): boolean =>
  new Set(items.map((item) => item.name)).size === items.length;

const viewportSchema = z.object({
  name: fileSafeName,
  width: z.int().positive(),
  height: z.int().positive(),
});

const routeSchema = z.object({
  name: fileSafeName,
  path: z.string().startsWith('/'),
  waitFor: z.string().optional(),
  mask: z.array(z.string()).default([]),
});

const visualConfigSchema: z.ZodType<VisualConfig> = z.object({
  baseUrl: z.url(),
  threshold: z.number().min(0).max(1).default(0.1),
  maxDiffPercent: z.number().min(0).max(100).default(0.5),
  viewports: z.array(viewportSchema).min(1).refine(hasUniqueNames, 'Each viewport needs a unique name'),
  routes: z.array(routeSchema).min(1).refine(hasUniqueNames, 'Each route needs a unique name'),
});

/**
 * Validates an already-parsed config object and fills in the defaults.
 * Every problem is reported at once, so the user fixes the file in one pass.
 */
export function parseVisualConfig(rawConfig: unknown): VisualConfig {
  const parsed = visualConfigSchema.safeParse(rawConfig);

  if (!parsed.success) {
    throw new ConfigError('CONFIG_INVALID', `Invalid spot-the-diff config:\n${z.prettifyError(parsed.error)}`);
  }

  return parsed.data;
}