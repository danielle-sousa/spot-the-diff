import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createImageUrl } from './image-url.ts';

describe('createImageUrl', () => {
  it('links to the image at a fixed commit of the baseline branch', () => {
    const branchDir = join('work', 'baselines-branch');
    const imageUrl = createImageUrl({ serverUrl: 'https://github.com', owner: 'dani', repo: 'spot-the-diff', commitSha: 'abc123', branchDir });

    const url = imageUrl(join(branchDir, 'prs', '7', 'def456', 'home--mobile.diff.png'));

    expect(url).toBe('https://github.com/dani/spot-the-diff/blob/abc123/prs/7/def456/home--mobile.diff.png?raw=true');
  });
});