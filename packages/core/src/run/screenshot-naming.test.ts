import { describe, expect, it } from 'vitest';
import { getScreenshotName, resolveRouteUrl } from './screenshot-naming.ts';

describe('getScreenshotName', () => {
  it('joins the route and viewport names with a double hyphen', () => {
    expect(getScreenshotName({ name: 'extrato' }, { name: 'mobile' })).toBe('extrato--mobile');
  });
});

describe('resolveRouteUrl', () => {
  it('appends the path to the base URL', () => {
    expect(resolveRouteUrl('http://localhost:4200', '/extrato')).toBe('http://localhost:4200/extrato');
  });

  it('avoids a double slash when the base URL ends with one', () => {
    expect(resolveRouteUrl('http://localhost:4200/', '/extrato')).toBe('http://localhost:4200/extrato');
  });

  it('keeps a sub-path in the base URL', () => {
    expect(resolveRouteUrl('http://localhost:4200/app', '/extrato')).toBe('http://localhost:4200/app/extrato');
  });
});