import { relative, sep } from 'node:path';

export interface ImageLocation {
  serverUrl: string;
  owner: string;
  repo: string;
  /** Commit on the baseline branch that holds the images. Pinning it keeps old comments showing old images. */
  commitSha: string;
  /** Local folder where the baseline branch is checked out. */
  branchDir: string;
}

/**
 * Builds GitHub links for images stored on the baseline branch. The
 * `blob/...?raw=true` form redirects to the raw file and is resolved by
 * GitHub, so it can be shown inside pull request comments.
 */
export function createImageUrl(location: ImageLocation): (filePath: string) => string {
  return (filePath) => {
    const pathInBranch = relative(location.branchDir, filePath).split(sep).join('/');
    return `${location.serverUrl}/${location.owner}/${location.repo}/blob/${location.commitSha}/${pathInBranch}?raw=true`;
  };
}