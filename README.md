# gh-reusable-workflows

Reusable GitHub Actions workflows for repositories under your account.  
This repo currently provides a production-oriented AI code review workflow named `ai-code-review`.

## What this provides

- Reusable workflow: `.github/workflows/ai-code-review.yml`
- Local composite action: `actions/glm-review/action.yml`
- Local Node implementation: `actions/glm-review/index.mjs`
- Sticky pull request summary comment (single updatable comment)
- Deterministic local verdict policy: `pass`, `warn`, `fail`
- Blocking decision made locally (never delegated to model)

## Reusable workflow path

Use this workflow from caller repositories:

- `marcopared/gh-reusable-workflows/.github/workflows/ai-code-review.yml@v1`

Use a version tag (or commit SHA) in callers for stable rollout.

## Required secrets

Caller repositories must provide:

- `ZHIPU_API_KEY`: API key for the GLM-compatible endpoint.

The caller maps this secret into the reusable workflow as:

- `zhipu_api_key: ${{ secrets.ZHIPU_API_KEY }}`

## Required permissions

Caller workflow/job should grant:

- `contents: read` (read repo content and diff context)
- `pull-requests: write` (create/update sticky PR summary comment)

Without `pull-requests: write`, review still runs and step summary still appears, but PR comment update may be skipped with a warning.

## Supported inputs

All inputs are optional unless noted.

- `model` (string, default: `glm-5`)
- `api_base` (string, default: `https://api.z.ai/api/paas/v4`)
- `max_files` (number, default: `25`)
- `max_patch_chars` (number, default: `120000`)
- `post_pr_comment` (boolean, default: `true`)
- `fail_on_blocking` (boolean, default: `true`)
- `min_block_severity` (string: `low|medium|high|critical`, default: `high`)
- `min_block_confidence` (string: `low|medium|high`, default: `high`)
- `extra_review_instructions` (string, default: empty)

Required secret:

- `zhipu_api_key`

## Verdict semantics

The implementation computes verdicts locally from normalized findings:

- `pass`: no findings
- `warn`: findings exist but none meet blocking policy
- `fail`: at least one blocking finding

Blocking policy (local, deterministic):

- category must be `correctness` or `security`
- severity must be `>= min_block_severity`
- confidence must be `>= min_block_confidence`

The model never decides blocking directly.

## Caller workflow example

Copy this into caller repo as `.github/workflows/ai-review.yml`:

```yaml
name: ai-code-review

on:
  pull_request:
    types: [opened, synchronize, reopened]
  push:
    branches:
      - main
      - develop
      - "feature/**"

concurrency:
  group: ai-code-review-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read
  pull-requests: write

jobs:
  review:
    uses: marcopared/gh-reusable-workflows/.github/workflows/ai-code-review.yml@v1
    permissions:
      contents: read
      pull-requests: write
    with:
      model: glm-5
      api_base: https://api.z.ai/api/paas/v4
      max_files: 25
      max_patch_chars: 120000
      post_pr_comment: true
      fail_on_blocking: true
      min_block_severity: high
      min_block_confidence: high
      extra_review_instructions: ""
    secrets:
      zhipu_api_key: ${{ secrets.ZHIPU_API_KEY }}
```

An equivalent sample file is included at `examples/ai-review-caller.yml`.

## Setup steps (caller repositories)

1. Add repository secret `ZHIPU_API_KEY`.
2. Add the caller workflow (example above) and commit it.
3. Open a PR to verify:
   - workflow check runs
   - step summary is generated
   - sticky PR comment is created/updated once per PR
4. In GitHub branch protection rules, add this workflow check (`ai-code-review / ai-code-review`) as a required status check.

## Notes on behavior

- Supports `pull_request` and `push` events.
- Review payload is bounded by changed files and patch size caps.
- Push mode computes changed files from git diff between `before` and `after`.
- PR mode fetches changed files via GitHub API and includes limited head content.
- v1 intentionally does not post inline diff comments.
- `pull_request_target` is intentionally not used.
