import { REPORT_MARKER } from '@spot-the-diff/core';

/** The three comment operations the Action needs, kept apart from Octokit so they can be faked in tests. */
export interface ReportCommentApi {
  listComments(issueNumber: number): Promise<{ id: number; body?: string | null }[]>;
  createComment(issueNumber: number, body: string): Promise<void>;
  updateComment(commentId: number, body: string): Promise<void>;
}

/**
 * Keeps a single spot-the-diff comment per pull request: the first run
 * creates it, later runs rewrite it, so every push does not add more noise.
 */
export async function upsertReportComment(api: ReportCommentApi, issueNumber: number, report: string): Promise<'created' | 'updated'> {
  const comments = await api.listComments(issueNumber);
  const existing = comments.find((comment) => comment.body?.includes(REPORT_MARKER));

  if (existing) {
    await api.updateComment(existing.id, report);
    return 'updated';
  }

  await api.createComment(issueNumber, report);
  return 'created';
}