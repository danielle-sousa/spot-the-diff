import type { getOctokit } from '@actions/github';
import type { ReportCommentApi } from './report-comment.ts';

type Octokit = ReturnType<typeof getOctokit>;

/** Adapter between Octokit's REST client and the small comment API the Action uses. */
export function createGitHubCommentApi(octokit: Octokit, owner: string, repo: string): ReportCommentApi {
  return {
    listComments: (issueNumber) =>
      octokit.paginate(octokit.rest.issues.listComments, { owner, repo, issue_number: issueNumber, per_page: 100 }),
    createComment: async (issueNumber, body) => {
      await octokit.rest.issues.createComment({ owner, repo, issue_number: issueNumber, body });
    },
    updateComment: async (commentId, body) => {
      await octokit.rest.issues.updateComment({ owner, repo, comment_id: commentId, body });
    },
  };
}