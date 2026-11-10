# ChatGPT + Gemini: two-agent development process

## Status

Project conventions are prepared. **Gemini is not activated merely by these files**. The repository owner must connect Google/Gemini and enable GitHub integration or GitHub Actions. Never paste API keys into issues, PR comments, chat or source.

## Two independent functions

**Builder**: Gemini takes a single issue, works on a `gemini/<issue>` branch and opens a PR. ChatGPT reviews code and compares geometry against user photos/plans before owner approves merge.

**Reviewer**: Gemini reviews PRs independently with Code Assist (automatic initial reviews, or `/gemini review` comment) and makes actionable findings. No merge without human approval and visual check.

For ChatGPT-built changes use a `chatgpt/<topic>` branch and apply the same review rules.

## Recommended connection: official Gemini Code Assist for GitHub

Setup instructions:
https://docs.cloud.google.com/gemini/docs/code-review/set-up-code-assist-github

Gemini Code Assist app:
https://github.com/apps/gemini-code-assist

Choose **Only select repositories** and select `adi-002rulit-rgb/my-house-3d`. Follow Google Cloud prerequisites, authentication and any billing requirements shown by Google. Review in PR via `/gemini review`.

## Coding agent: Gemini CLI + GitHub Actions

Official integration and example workflows:
https://github.com/google-github-actions/run-gemini-cli

- Get Gemini API key through Google AI Studio (if choosing API-key authentication).
- Add key **only** as GitHub secret `GEMINI_API_KEY` under Settings → Secrets and variables → Actions.
- Run Gemini CLI locally and use `/setup-github`, or install the upstream `gemini-dispatch.yml` and corresponding Gemini assistant, PR-review and issue-triage workflows following upstream instructions.
- Use `GEMINI.md` as the project context. Restrict direct pushes to main through GitHub rulesets / branch protection.
- For first build, assign a contained issue: e.g. stair geometry inspector and door collision checks. Gemini opens a PR for ChatGPT + owner to review.

**Important security:** Do not copy arbitrary agent workflows with broad `contents: write` permissions to main without checking their triggers and secret exposure. Prefer manual or narrowly scoped tasks and require approval before merge. Scripts executed on untrusted PR code need additional isolation.

## What is already prepared

- `GEMINI.md` — implementation and independent QA instructions.
- `.github/pull_request_template.md` — QA and architectural checks for every PR.
- `AI_COLLABORATION.md` — this setup guide.

## Limitations

Gemini and ChatGPT do not directly message each other in this ChatGPT conversation. GitHub Issues, branches, PRs, reviews and artifacts provide shared coordination. Browser-based inspection is indispensable: static JS validation did not catch several staircase rendering failures in prior versions.
