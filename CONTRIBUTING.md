# Contributing to spot-the-diff

Thank you for helping! This guide gets you from a fresh clone to a green test run, and explains the conventions the code follows.

## Prerequisites

| Tool | Version | Why |
| --- | --- | --- |
| Node.js | 22.18 or newer, 24 recommended | Runs TypeScript config files natively. The exact version is in `.nvmrc`. |
| pnpm | the version in `package.json` → `packageManager` | Workspaces and the lockfile. |
| git | 2.42 or newer | The Action uses `git worktree add --orphan`, and its tests run real git. |

## Setup

```bash
pnpm install
pnpm --dir packages/core exec playwright install chromium
pnpm build
pnpm test
```

All tests should pass before you change anything. If one fails on a fresh clone, please open an issue.

## Repository layout

```text
packages/
├── core/       config, capture, comparison, decisions and the report
├── cli/        the spot-the-diff command, a thin layer over core
└── action/     the GitHub Action, a thin layer over core
examples/
└── bank-demo/  a small static app used for manual runs and by the workflow
action.yml      entry point of the GitHub Action
```

`core` knows nothing about terminals or GitHub. The CLI and the Action translate their world (arguments, events, comments) into calls to `core`. A rule that both need belongs in `core`.

## Scripts

Run from the repository root:

| Command | What it does |
| --- | --- |
| `pnpm build` | Builds every package with tsdown. |
| `pnpm typecheck` | Type checks every package. |
| `pnpm test` | Runs every test suite with Vitest. |

Inside a package, `pnpm test:watch` (in `core`) reruns the tests on every save.

## How the code is written

- **Tests first.** Write the failing test, make it pass, then refactor. Every bug fix starts with a test that reproduces it.
- **Decisions apart from actions.** Rules such as "did this screen change?" or "should the check fail?" are pure functions with no I/O. Code that opens a browser, reads files or calls GitHub only orchestrates those decisions.
- **Validate at the boundary.** Data from outside (the config file, terminal arguments, GitHub events) is checked once where it enters. Inside, the types are trusted.
- **States as unions.** A result is `new`, `unchanged` or `changed`, and each carries only the fields that make sense for it.
- **Errors with codes.** Errors the user can fix carry a machine-readable `code` and a message that says what to do. Callers match on the code, never on the message.
- **Comments explain why.** The code says what it does; a comment is for the reason behind a rule that would otherwise look odd.

## Commits and pull requests

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/), with the package as the scope:

```text
feat(core): support masks in screenshots
fix(cli): reject arguments after the command
refactor(action): extract the comment adapter
docs: explain the baseline branch
```

Keep refactoring and behavior changes in separate commits, and one story per pull request. Every pull request runs the visual regression workflow on the bank demo, so you will see spot-the-diff review your own change.

## Reporting a bug

Please include the spot-the-diff version, your config file, the command or workflow you ran and the full output. A screenshot of the comment helps for anything visual.