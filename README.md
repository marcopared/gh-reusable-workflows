# gh-reusable-workflows

Reusable GitHub Actions workflows for AI code review with deterministic local verdicting.  
This repo now provides two provider-specific reusable workflows: **Zhipu** and **OpenRouter**.

## What this repo provides

- Reusable workflow (Zhipu): `.github/workflows/ai-code-review-zhipu.yml`
- Reusable workflow (OpenRouter): `.github/workflows/ai-code-review-openrouter.yml`
- Provider actions:
  - `actions/glm-review-zhipu/action.yml`
  - `actions/glm-review-openrouter/action.yml`
- Shared runtime core:
  - `actions/glm-review/index.mjs`
- Sticky PR summary comment with marker `<!-- ai-code-review:glm-review -->`
- GitHub step summary output
- Deterministic local verdict policy: `pass | warn | fail`

## Provider paths

- **Preferred for future flexibility:** OpenRouter
  - `marcopared/gh-reusable-workflows/.github/workflows/ai-code-review-openrouter.yml@v1`
- **Direct Zhipu path:**
  - `marcopared/gh-reusable-workflows/.github/workflows/ai-code-review-zhipu.yml@v1`

### Backward compatibility

- Legacy generic workflow path is preserved and currently aliases to Zhipu:
  - `marcopared/gh-reusable-workflows/.github/workflows/ai-code-review.yml@v1`
- Legacy action path `actions/glm-review/action.yml` is also retained as a Zhipu-compatible wrapper.

## Required permissions (caller repos)

Grant these at workflow or job scope:

- `contents: read`
- `pull-requests: write`

If `pull-requests: write` is missing, review still runs and step summary is written, but PR comment upsert may be skipped with a warning.

## Required secrets

- Zhipu workflow: `ZHIPU_API_KEY` (mapped as `zhipu_api_key`)
- OpenRouter workflow: `OPENROUTER_API_KEY` (mapped as `openrouter_api_key`)

## Inputs

### Shared review-policy and bounding inputs

- `max_files` (default `25`)
- `max_patch_chars` (default `120000`)
- `post_pr_comment` (default `true`)
- `fail_on_blocking` (default `true`)
- `min_block_severity` (`low|medium|high|critical`, default `high`)
- `min_block_confidence` (`low|medium|high`, default `high`)
- `extra_review_instructions` (default empty)

### Zhipu workflow inputs

- `model` (default `glm-5`)
- `api_base` (default `https://api.z.ai/api/paas/v4`)

### OpenRouter workflow inputs

- `model` (**required**): exact OpenRouter model ID
- `api_base` (default `https://openrouter.ai/api/v1`)
- `http_referer` (optional, default empty)
- `x_title` (optional, default empty)

OpenRouter uses an OpenAI-compatible chat completions endpoint: `${api_base}/chat/completions`.

## OpenRouter model ID note

This repo does **not** guess a GLM-5 OpenRouter model slug.  
Pass the exact model ID available in your OpenRouter account via `with.model`.

## Verdict semantics

The model proposes findings, but blocking and verdict are computed locally:

- `pass`: no findings
- `warn`: findings exist, none block
- `fail`: at least one blocking finding

Blocking policy is local and conservative:

- only categories `correctness` and `security` can block
- severity must meet `min_block_severity`
- confidence must meet `min_block_confidence`

## Provider comparison

- **Use OpenRouter** when you want model-routing flexibility without changing workflow logic.
- **Use Zhipu** for direct provider integration with existing GLM defaults.

Both paths keep identical review behavior (bounded diffs, sticky PR comment, step summary, pass/warn/fail policy).

## Caller example: OpenRouter (preferred)

```yaml
name: ai-code-review-openrouter

on:
  pull_request:
    types: [opened, synchronize, reopened]
  push:
    branches: [main, develop, "feature/**"]

concurrency:
  group: ai-code-review-openrouter-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read
  pull-requests: write

jobs:
  review:
    uses: marcopared/gh-reusable-workflows/.github/workflows/ai-code-review-openrouter.yml@v1
    permissions:
      contents: read
      pull-requests: write
    with:
      model: your-openrouter-glm5-model-id
      api_base: https://openrouter.ai/api/v1
      max_files: 25
      max_patch_chars: 120000
      post_pr_comment: true
      fail_on_blocking: true
      min_block_severity: high
      min_block_confidence: high
      extra_review_instructions: ""
      http_referer: ""
      x_title: ""
    secrets:
      openrouter_api_key: ${{ secrets.OPENROUTER_API_KEY }}
```

## Caller example: Zhipu

```yaml
name: ai-code-review-zhipu

on:
  pull_request:
    types: [opened, synchronize, reopened]
  push:
    branches: [main, develop, "feature/**"]

concurrency:
  group: ai-code-review-zhipu-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read
  pull-requests: write

jobs:
  review:
    uses: marcopared/gh-reusable-workflows/.github/workflows/ai-code-review-zhipu.yml@v1
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

Equivalent files are in:

- `examples/ai-review-caller-openrouter.yml`
- `examples/ai-review-caller-zhipu.yml`
- `examples/ai-review-caller.yml` (legacy generic -> Zhipu path)

## Setup steps

### OpenRouter setup (preferred)

1. Add secret `OPENROUTER_API_KEY` in caller repo.
2. Add the OpenRouter caller workflow.
3. Set `with.model` to your exact OpenRouter GLM-5 model ID.
4. Open a PR and verify:
   - workflow executes
   - step summary appears
   - sticky PR comment is created/updated
5. Add the workflow check as required in branch protection.

### Zhipu setup

1. Add secret `ZHIPU_API_KEY` in caller repo.
2. Add the Zhipu caller workflow.
3. Open a PR and verify behavior.
4. Add the workflow check as required in branch protection.

## Behavior guarantees

- Event support: `pull_request` and `push`
- No inline diff comments (v1)
- No `pull_request_target`
- Bounded payload for deterministic CI behavior
- Malformed model output fails clearly with readable step summary
