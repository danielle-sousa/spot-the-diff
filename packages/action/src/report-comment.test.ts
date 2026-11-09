import { REPORT_MARKER } from '@spot-the-diff/core';
import { describe, expect, it } from 'vitest';
import { upsertReportComment, type ReportCommentApi } from './report-comment.ts';

function buildFakeApi(existing: { id: number; body: string }[]): ReportCommentApi & { created: string[]; updated: [number, string][] } {
  const created: string[] = [];
  const updated: [number, string][] = [];
  return {
    created,
    updated,
    listComments: async () => existing,
    createComment: async (_issueNumber, body) => { created.push(body); },
    updateComment: async (commentId, body) => { updated.push([commentId, body]); },
  };
}

describe('upsertReportComment', () => {
  it('creates the comment on the first run', async () => {
    const api = buildFakeApi([{ id: 1, body: 'Looks good to me!' }]);

    const outcome = await upsertReportComment(api, 7, `${REPORT_MARKER}\nreport`);

    expect(outcome).toBe('created');
    expect(api.created).toHaveLength(1);
  });

  it('updates its own comment on later runs', async () => {
    const api = buildFakeApi([{ id: 1, body: 'Looks good to me!' }, { id: 2, body: `${REPORT_MARKER}\nold report` }]);

    const outcome = await upsertReportComment(api, 7, `${REPORT_MARKER}\nnew report`);

    expect(outcome).toBe('updated');
    expect(api.updated).toEqual([[2, `${REPORT_MARKER}\nnew report`]]);
    expect(api.created).toHaveLength(0);
  });
});