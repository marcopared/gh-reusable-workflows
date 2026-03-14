# CODEBASE PACK: gh-reusable-workflows

## MANIFEST
- Included files: 11
- Skipped files/directories: 3
- Total included lines: 3811
- Full files: 10
- Chunked files: 1
- Summary files: 0

## READING GUIDE
Start with these files first:
1. `README.md` — project overview and setup [full]
2. `actions/glm-review-openrouter/index.mjs` — entrypoint [full]
3. `actions/glm-review-zhipu/index.mjs` — entrypoint [full]
4. `actions/glm-review/index.mjs` — entrypoint [full]
5. `actions/glm-review-openrouter/action.yml` — configuration [full]
6. `actions/glm-review-zhipu/action.yml` — configuration [full]
7. `actions/glm-review/action.yml` — configuration [full]
8. `examples/ai-review-caller-openrouter.yml` — configuration [full]
9. `examples/ai-review-caller-zhipu.yml` — configuration [full]
10. `examples/ai-review-caller.yml` — configuration [full]
11. `gh-reusable-workflows_codebase.md` — documentation [chunked]

## DIRECTORY TREE
- actions/
  - glm-review/
    - action.yml
    - index.mjs
  - glm-review-openrouter/
    - action.yml
    - index.mjs
  - glm-review-zhipu/
    - action.yml
    - index.mjs
- examples/
  - ai-review-caller-openrouter.yml
  - ai-review-caller-zhipu.yml
  - ai-review-caller.yml
- gh-reusable-workflows_codebase.md
- README.md

## FILE INDEX
| Path | Role | Lines | Chars | Mode |
|---|---|---:|---:|---|
| `README.md` | project overview and setup | 210 | 6205 | full |
| `actions/glm-review-openrouter/index.mjs` | entrypoint | 1 | 34 | full |
| `actions/glm-review-zhipu/index.mjs` | entrypoint | 1 | 34 | full |
| `actions/glm-review/index.mjs` | entrypoint | 720 | 22885 | full |
| `actions/glm-review-openrouter/action.yml` | configuration | 85 | 2762 | full |
| `actions/glm-review-zhipu/action.yml` | configuration | 76 | 2453 | full |
| `actions/glm-review/action.yml` | configuration | 76 | 2468 | full |
| `examples/ai-review-caller-openrouter.yml` | configuration | 40 | 992 | full |
| `examples/ai-review-caller-zhipu.yml` | configuration | 37 | 844 | full |
| `examples/ai-review-caller.yml` | configuration | 38 | 886 | full |
| `gh-reusable-workflows_codebase.md` | documentation | 2527 | 73128 | chunked |

## SKIPPED ITEMS
- `.DS_Store` — hidden
- `.git/` — skipped directory
- `.github/` — skipped directory

## FILE CONTENT

## FILE: README.md
- Role: project overview and setup
- Mode: full
- Language: markdown
- Lines: 210
- Characters: 6205

### Full Content
```markdown
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

```

## FILE: actions/glm-review-openrouter/index.mjs
- Role: entrypoint
- Mode: full
- Language: js
- Lines: 1
- Characters: 34

### Full Content
```js
import "../glm-review/index.mjs";

```

## FILE: actions/glm-review-zhipu/index.mjs
- Role: entrypoint
- Mode: full
- Language: js
- Lines: 1
- Characters: 34

### Full Content
```js
import "../glm-review/index.mjs";

```

## FILE: actions/glm-review/index.mjs
- Role: entrypoint
- Mode: full
- Language: js
- Lines: 720
- Characters: 22885

### Full Content
```js
import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";

const STICKY_MARKER = "<!-- ai-code-review:glm-review -->";

const ALLOWED_CATEGORIES = new Set([
  "correctness",
  "security",
  "reliability",
  "performance",
  "maintainability",
  "testing",
]);
const ALLOWED_SEVERITY = ["low", "medium", "high", "critical"];
const ALLOWED_CONFIDENCE = ["low", "medium", "high"];
const BLOCKABLE_CATEGORIES = new Set(["correctness", "security"]);

const GITHUB_API_BASE = "https://api.github.com";
const MAX_FILE_CONTENT_CHARS = 4000;
const MAX_FINDINGS_RENDER = 60;

function getInput(name, fallback = "") {
  const value = process.env[`INPUT_${name.toUpperCase()}`];
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  return value;
}

function parseBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "y", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "n", "off"].includes(normalized)) return false;
  return fallback;
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function clampEnum(value, allowedList, fallback) {
  const normalized = String(value ?? "").trim().toLowerCase();
  return allowedList.includes(normalized) ? normalized : fallback;
}

function writeOutput(name, value) {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (!outputPath) return;
  appendFileSync(outputPath, `${name}=${String(value)}\n`, "utf8");
}

function writeStepSummary(markdown) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) return;
  appendFileSync(summaryPath, `${markdown}\n`, "utf8");
}

function writeFailureSummary(reason) {
  const message = String(reason ?? "Unknown error");
  writeStepSummary([
    "## ❌ AI Code Review: Runtime Error",
    "",
    `The review job failed before producing a verdict.`,
    "",
    `- Error: \`${escapeMarkdown(message)}\``,
    "",
    "This usually indicates malformed model output, API failure, missing permissions, or invalid workflow inputs.",
  ].join("\n"));
}

function readJsonFile(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function runGit(args, options = {}) {
  try {
    return execFileSync("git", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 16 * 1024 * 1024,
      ...options,
    });
  } catch (error) {
    const stderr = error?.stderr ? String(error.stderr) : "";
    const message = `git ${args.join(" ")} failed${stderr ? `: ${stderr.trim()}` : ""}`;
    throw new Error(message);
  }
}

async function readHeadContent(path) {
  if (!path || !existsSync(path)) return "";
  try {
    const content = await readFile(path, "utf8");
    if (content.length <= MAX_FILE_CONTENT_CHARS) return content;
    return `${content.slice(0, MAX_FILE_CONTENT_CHARS)}\n...[truncated content]`;
  } catch {
    return "";
  }
}

async function ghRequest({ token, method = "GET", path, body }) {
  const response = await fetch(`${GITHUB_API_BASE}${path}`, {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "ai-code-review",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API ${method} ${path} failed (${response.status}): ${text.slice(0, 400)}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

async function getPullRequestChangedFiles({ token, owner, repo, prNumber }) {
  const files = [];
  let page = 1;

  while (true) {
    const pageItems = await ghRequest({
      token,
      path: `/repos/${owner}/${repo}/pulls/${prNumber}/files?per_page=100&page=${page}`,
    });

    if (!Array.isArray(pageItems) || pageItems.length === 0) break;
    files.push(...pageItems);
    if (pageItems.length < 100) break;
    page += 1;
  }

  const mapped = [];
  for (const file of files) {
    const status = file.status || "modified";
    const path = file.filename;
    const patch = typeof file.patch === "string" ? file.patch : "";
    const binary = typeof file.patch !== "string";
    const removed = status === "removed";
    const content = removed || binary ? "" : await readHeadContent(path);

    mapped.push({
      path,
      status,
      previous_path: file.previous_filename || "",
      patch,
      binary,
      content,
    });
  }

  return mapped;
}

function parseNameStatusLines(output) {
  const lines = output.split("\n").map((line) => line.trim()).filter(Boolean);
  const files = [];
  for (const line of lines) {
    const parts = line.split("\t");
    if (parts.length < 2) continue;
    const statusRaw = parts[0];
    if (statusRaw.startsWith("R") || statusRaw.startsWith("C")) {
      if (parts.length < 3) continue;
      files.push({
        status: "renamed",
        previous_path: parts[1],
        path: parts[2],
      });
    } else {
      const statusMap = {
        A: "added",
        M: "modified",
        D: "removed",
        T: "modified",
      };
      files.push({
        status: statusMap[statusRaw] || "modified",
        previous_path: "",
        path: parts[1],
      });
    }
  }
  return files;
}

async function getPushChangedFiles({ before, after }) {
  const isInitialPush = !before || /^0+$/.test(before);

  let nameStatusOutput = "";
  if (isInitialPush) {
    nameStatusOutput = runGit(["diff-tree", "--no-commit-id", "--name-status", "-r", after]);
  } else {
    nameStatusOutput = runGit(["diff", "--name-status", "--find-renames", before, after]);
  }

  const files = parseNameStatusLines(nameStatusOutput);
  const result = [];

  for (const file of files) {
    let patch = "";
    if (isInitialPush) {
      patch = runGit(["show", "--format=", "--unified=3", after, "--", file.path]);
    } else {
      patch = runGit(["diff", "--unified=3", before, after, "--", file.path]);
    }
    const binary = patch.includes("Binary files") || patch.includes("GIT binary patch");
    const removed = file.status === "removed";
    const content = removed || binary ? "" : await readHeadContent(file.path);
    result.push({
      ...file,
      patch,
      binary,
      content,
    });
  }

  return result;
}

function buildBoundedFiles(changedFiles, maxFiles, maxPatchChars) {
  const sorted = [...changedFiles].sort((a, b) => a.path.localeCompare(b.path));
  const selected = [];
  let totalPatchChars = 0;

  for (const file of sorted) {
    if (selected.length >= maxFiles) break;
    const safePatch = typeof file.patch === "string" ? file.patch : "";
    const remaining = Math.max(0, maxPatchChars - totalPatchChars);
    const includePatch = !file.binary && remaining > 0;
    let patch = "";
    let patch_truncated = false;

    if (includePatch) {
      if (safePatch.length <= remaining) {
        patch = safePatch;
        totalPatchChars += safePatch.length;
      } else {
        patch = `${safePatch.slice(0, remaining)}\n...[truncated patch]`;
        totalPatchChars += remaining;
        patch_truncated = true;
      }
    }

    selected.push({
      path: file.path,
      status: file.status,
      previous_path: file.previous_path || "",
      binary: Boolean(file.binary),
      patch,
      patch_truncated,
      content: file.content || "",
    });
  }

  return {
    total_changed_files: changedFiles.length,
    included_files: selected.length,
    files: selected,
    omitted_files: Math.max(0, changedFiles.length - selected.length),
    total_patch_chars_included: totalPatchChars,
  };
}

function toChatContentString(messageContent) {
  if (typeof messageContent === "string") return messageContent;
  if (Array.isArray(messageContent)) {
    return messageContent
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .join("\n")
      .trim();
  }
  return "";
}

function parseModelJson(raw) {
  const text = String(raw ?? "").trim();
  if (!text) throw new Error("Model returned empty content.");
  if (text.startsWith("```")) {
    throw new Error("Model output must be raw JSON without markdown code fences.");
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Model output is not valid JSON: ${error.message}`);
  }
}

function normalizeFinding(item) {
  if (!item || typeof item !== "object") return null;

  const path = String(item.path ?? "").trim();
  const title = String(item.title ?? "").trim();
  const body = String(item.body ?? "").trim();
  if (!path || !title || !body) return null;

  const lineRaw = Number.parseInt(String(item.line ?? ""), 10);
  const line = Number.isFinite(lineRaw) && lineRaw > 0 ? lineRaw : null;

  const severity = clampEnum(item.severity, ALLOWED_SEVERITY, "low");
  const confidence = clampEnum(item.confidence, ALLOWED_CONFIDENCE, "low");
  const category = clampEnum(item.category, [...ALLOWED_CATEGORIES], "maintainability");
  const suggestion = String(item.suggestion ?? "").trim();

  return { path, line, severity, confidence, category, title, body, suggestion };
}

function dedupeFindings(findings) {
  const seen = new Set();
  const unique = [];
  for (const finding of findings) {
    const key = [
      finding.path.toLowerCase(),
      finding.line,
      finding.category,
      finding.title.toLowerCase(),
      finding.body.toLowerCase().slice(0, 180),
    ].join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(finding);
  }
  return unique;
}

function rank(value, orderedValues) {
  return orderedValues.indexOf(value);
}

function isBlocking(finding, minSeverity, minConfidence) {
  if (!BLOCKABLE_CATEGORIES.has(finding.category)) return false;
  return (
    rank(finding.severity, ALLOWED_SEVERITY) >= rank(minSeverity, ALLOWED_SEVERITY) &&
    rank(finding.confidence, ALLOWED_CONFIDENCE) >= rank(minConfidence, ALLOWED_CONFIDENCE)
  );
}

function escapeMarkdown(text) {
  return String(text ?? "")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function groupFindings(findings) {
  const groups = new Map();
  for (const finding of findings) {
    if (!groups.has(finding.category)) groups.set(finding.category, []);
    groups.get(finding.category).push(finding);
  }
  for (const list of groups.values()) {
    list.sort((a, b) => {
      const sev = rank(b.severity, ALLOWED_SEVERITY) - rank(a.severity, ALLOWED_SEVERITY);
      if (sev !== 0) return sev;
      const conf = rank(b.confidence, ALLOWED_CONFIDENCE) - rank(a.confidence, ALLOWED_CONFIDENCE);
      if (conf !== 0) return conf;
      return `${a.path}:${a.line}`.localeCompare(`${b.path}:${b.line}`);
    });
  }
  return groups;
}

function buildReviewMarkdown({
  verdict,
  summary,
  findings,
  blockingCount,
  totalChangedFiles,
  includedFiles,
  omittedFiles,
  minBlockSeverity,
  minBlockConfidence,
  forPrComment,
}) {
  const verdictLabel = verdict === "fail" ? "FAIL" : verdict === "warn" ? "WARN" : "PASS";
  const verdictEmoji = verdict === "fail" ? "❌" : verdict === "warn" ? "⚠️" : "✅";
  const grouped = groupFindings(findings.slice(0, MAX_FINDINGS_RENDER));
  const lines = [];

  if (forPrComment) lines.push(STICKY_MARKER);
  lines.push(`## ${verdictEmoji} AI Code Review: ${verdictLabel}`);
  lines.push("");
  lines.push(`**Assessment:** ${escapeMarkdown(summary || "No additional concerns.")}`);
  lines.push("");
  lines.push(`- Verdict: \`${verdict}\``);
  lines.push(`- Findings: \`${findings.length}\``);
  lines.push(`- Blocking findings: \`${blockingCount}\``);
  lines.push(`- Reviewed files: \`${includedFiles}/${totalChangedFiles}\`${omittedFiles > 0 ? ` (omitted ${omittedFiles})` : ""}`);
  lines.push(`- Blocking threshold: category in \`correctness|security\`, severity >= \`${minBlockSeverity}\`, confidence >= \`${minBlockConfidence}\``);
  lines.push("");

  if (findings.length === 0) {
    lines.push("No findings were identified in the bounded changed-code set.");
  } else {
    lines.push("### Findings");
    lines.push("");
    const orderedCategories = [
      "security",
      "correctness",
      "reliability",
      "performance",
      "maintainability",
      "testing",
    ];
    for (const category of orderedCategories) {
      const list = grouped.get(category) || [];
      if (list.length === 0) continue;
      lines.push(`**${category}** (${list.length})`);
      for (const finding of list) {
        const scope = finding.line
          ? `\`${escapeMarkdown(finding.path)}:${finding.line}\``
          : `\`${escapeMarkdown(finding.path)}\``;
        const level = `${finding.severity}/${finding.confidence}`;
        const blockingTag = finding.blocking ? " **[blocking]**" : "";
        lines.push(`- [${level}] ${scope} - **${escapeMarkdown(finding.title)}**${blockingTag}`);
        lines.push(`  - ${escapeMarkdown(finding.body)}`);
        if (finding.suggestion) {
          lines.push(`  - Suggested fix: ${escapeMarkdown(finding.suggestion)}`);
        }
      }
      lines.push("");
    }
    if (findings.length > MAX_FINDINGS_RENDER) {
      lines.push(`_Only the first ${MAX_FINDINGS_RENDER} findings are shown._`);
    }
  }

  return lines.join("\n");
}

async function upsertStickyPrComment({ token, owner, repo, prNumber, body }) {
  let comments = [];
  let page = 1;
  while (true) {
    const pageItems = await ghRequest({
      token,
      path: `/repos/${owner}/${repo}/issues/${prNumber}/comments?per_page=100&page=${page}`,
    });
    if (!Array.isArray(pageItems) || pageItems.length === 0) break;
    comments = comments.concat(pageItems);
    if (pageItems.length < 100) break;
    page += 1;
  }

  const existing = comments.find(
    (comment) =>
      comment?.user?.type === "Bot" &&
      typeof comment?.body === "string" &&
      comment.body.includes(STICKY_MARKER),
  );
  if (existing) {
    await ghRequest({
      token,
      method: "PATCH",
      path: `/repos/${owner}/${repo}/issues/comments/${existing.id}`,
      body: { body },
    });
    return "updated";
  }

  await ghRequest({
    token,
    method: "POST",
    path: `/repos/${owner}/${repo}/issues/${prNumber}/comments`,
    body: { body },
  });
  return "created";
}

async function runModelReview({
  apiBase,
  apiKey,
  model,
  repo,
  eventType,
  boundedFiles,
  extraReviewInstructions,
  httpReferer,
  xTitle,
}) {
  const systemPrompt = [
    "You are a senior code reviewer for CI.",
    "Review ONLY changed code provided in input.",
    "Prioritize correctness, security, reliability, performance, maintainability, and materially important testing gaps.",
    "Avoid style-only nits, avoid speculation, and prefer fewer high-confidence findings.",
    "Use only evidence from provided data.",
    "Return JSON only with the required schema.",
  ].join(" ");

  const requiredSchema = {
    summary: "short overall assessment",
    findings: [
      {
        path: "relative/file/path",
        line: 123,
        severity: "low|medium|high|critical",
        confidence: "low|medium|high",
        category: "correctness|security|reliability|performance|maintainability|testing",
        title: "short specific title",
        body: "grounded explanation",
        suggestion: "specific fix",
      },
    ],
  };

  const userPayload = {
    repo,
    event_type: eventType,
    changed_files: boundedFiles.files,
    limits: {
      total_changed_files: boundedFiles.total_changed_files,
      included_files: boundedFiles.included_files,
      omitted_files: boundedFiles.omitted_files,
      total_patch_chars_included: boundedFiles.total_patch_chars_included,
    },
    extra_review_instructions: extraReviewInstructions || "",
    required_output_schema: requiredSchema,
  };

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  if (httpReferer) {
    headers["HTTP-Referer"] = httpReferer;
  }
  if (xTitle) {
    headers["X-Title"] = xTitle;
  }

  const response = await fetch(`${apiBase.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Return ONLY valid JSON matching required_output_schema. Input:\n${JSON.stringify(userPayload)}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Model API call failed (${response.status}): ${text.slice(0, 500)}`);
  }

  const data = await response.json();
  const content = toChatContentString(data?.choices?.[0]?.message?.content);
  const parsed = parseModelJson(content);

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Model output JSON root must be an object.");
  }
  if (typeof parsed.summary !== "string") {
    throw new Error("Model output JSON must include string field: summary.");
  }
  if (!Array.isArray(parsed.findings)) {
    throw new Error("Model output JSON must include array field: findings.");
  }

  return parsed;
}

async function main() {
  const githubToken = getInput("github_token");
  const zhipuApiKey = getInput("zhipu_api_key");
  const openrouterApiKey = getInput("openrouter_api_key");
  const selectedApiKey = zhipuApiKey || openrouterApiKey;
  const rawModel = getInput("model", "");
  const model = rawModel || (openrouterApiKey ? "" : "glm-5");
  const apiBase = getInput("api_base", "https://api.z.ai/api/paas/v4");
  const maxFiles = parsePositiveInt(getInput("max_files", "25"), 25);
  const maxPatchChars = parsePositiveInt(getInput("max_patch_chars", "120000"), 120000);
  const postPrComment = parseBoolean(getInput("post_pr_comment", "true"), true);
  const failOnBlocking = parseBoolean(getInput("fail_on_blocking", "true"), true);
  const minBlockSeverity = clampEnum(getInput("min_block_severity", "high"), ALLOWED_SEVERITY, "high");
  const minBlockConfidence = clampEnum(getInput("min_block_confidence", "high"), ALLOWED_CONFIDENCE, "high");
  const extraReviewInstructions = getInput("extra_review_instructions", "");
  const httpReferer = getInput("http_referer", "").trim();
  const xTitle = getInput("x_title", "").trim();

  const repository = process.env.GITHUB_REPOSITORY || "";
  const eventName = process.env.GITHUB_EVENT_NAME || "";
  const eventPath = process.env.GITHUB_EVENT_PATH || "";

  if (!githubToken) throw new Error("Missing required input: github_token");
  if (!selectedApiKey) {
    throw new Error("Missing required API key input: zhipu_api_key or openrouter_api_key.");
  }
  if (openrouterApiKey && !model) {
    throw new Error("Missing required input: model (OpenRouter model ID).");
  }
  if (!repository.includes("/")) throw new Error("GITHUB_REPOSITORY is not set correctly.");
  if (!eventPath || !existsSync(eventPath)) throw new Error("GITHUB_EVENT_PATH is missing or invalid.");

  const [owner, repo] = repository.split("/");
  const event = readJsonFile(eventPath);

  const isPr = eventName === "pull_request" || eventName === "pull_request_review" || Boolean(event.pull_request);
  const isPush = eventName === "push";
  if (!isPr && !isPush) {
    throw new Error(`Unsupported event '${eventName}'. Only pull_request and push are supported.`);
  }

  let changedFiles = [];
  let prNumber = null;
  if (isPr) {
    prNumber = event?.pull_request?.number;
    if (!prNumber) throw new Error("pull_request.number is missing from event payload.");
    changedFiles = await getPullRequestChangedFiles({ token: githubToken, owner, repo, prNumber });
  } else {
    changedFiles = await getPushChangedFiles({ before: event.before, after: event.after });
  }

  const boundedFiles = buildBoundedFiles(changedFiles, maxFiles, maxPatchChars);

  let modelSummary = "No changed files to review.";
  let normalizedFindings = [];

  if (boundedFiles.included_files > 0) {
    const modelResult = await runModelReview({
      apiBase,
      apiKey: selectedApiKey,
      model,
      repo: repository,
      eventType: isPr ? "pull_request" : "push",
      boundedFiles,
      extraReviewInstructions,
      httpReferer,
      xTitle,
    });
    modelSummary = modelResult.summary.trim();
    normalizedFindings = dedupeFindings(
      modelResult.findings.map(normalizeFinding).filter(Boolean),
    );
  }

  const findingsWithPolicy = normalizedFindings.map((finding) => ({
    ...finding,
    blocking: isBlocking(finding, minBlockSeverity, minBlockConfidence),
  }));

  const blockingCount = findingsWithPolicy.filter((finding) => finding.blocking).length;
  const findingsCount = findingsWithPolicy.length;
  const verdict = blockingCount > 0 ? "fail" : findingsCount > 0 ? "warn" : "pass";

  writeOutput("verdict", verdict);
  writeOutput("blocking_count", blockingCount);
  writeOutput("findings_count", findingsCount);

  const summaryMarkdown = buildReviewMarkdown({
    verdict,
    summary: modelSummary,
    findings: findingsWithPolicy,
    blockingCount,
    totalChangedFiles: boundedFiles.total_changed_files,
    includedFiles: boundedFiles.included_files,
    omittedFiles: boundedFiles.omitted_files,
    minBlockSeverity,
    minBlockConfidence,
    forPrComment: false,
  });
  writeStepSummary(summaryMarkdown);

  if (isPr && postPrComment) {
    const commentMarkdown = buildReviewMarkdown({
      verdict,
      summary: modelSummary,
      findings: findingsWithPolicy,
      blockingCount,
      totalChangedFiles: boundedFiles.total_changed_files,
      includedFiles: boundedFiles.included_files,
      omittedFiles: boundedFiles.omitted_files,
      minBlockSeverity,
      minBlockConfidence,
      forPrComment: true,
    });

    try {
      const operation = await upsertStickyPrComment({
        token: githubToken,
        owner,
        repo,
        prNumber,
        body: commentMarkdown,
      });
      console.log(`PR sticky comment ${operation}.`);
    } catch (error) {
      // Missing PR write permission should not block review verdict generation.
      console.warn(`Unable to upsert PR comment: ${error.message}`);
    }
  }

  if (verdict === "fail" && !failOnBlocking) {
    console.log("Blocking findings detected, but fail_on_blocking is false.");
  }
}

main().catch((error) => {
  writeOutput("verdict", "fail");
  writeOutput("blocking_count", 0);
  writeOutput("findings_count", 0);
  writeFailureSummary(error?.message);
  console.error(`ai-code-review failed: ${error.message}`);
  process.exit(1);
});

```

## FILE: actions/glm-review-openrouter/action.yml
- Role: configuration
- Mode: full
- Language: yaml
- Lines: 85
- Characters: 2762

### Full Content
```yaml
name: glm-review-openrouter
description: OpenRouter provider path for bounded AI code review.

inputs:
  github_token:
    description: GitHub token for API requests and PR comments.
    required: true
  openrouter_api_key:
    description: API key for OpenRouter API.
    required: true
  model:
    description: Exact OpenRouter model ID to call.
    required: true
  api_base:
    description: OpenRouter API base URL.
    required: false
    default: https://openrouter.ai/api/v1
  max_files:
    description: Maximum number of changed files to include.
    required: false
    default: "25"
  max_patch_chars:
    description: Maximum total patch characters to include.
    required: false
    default: "120000"
  post_pr_comment:
    description: Whether to post or update sticky PR comment.
    required: false
    default: "true"
  fail_on_blocking:
    description: Whether caller intends to fail on blocking findings.
    required: false
    default: "true"
  min_block_severity:
    description: Minimum severity threshold for blocking.
    required: false
    default: high
  min_block_confidence:
    description: Minimum confidence threshold for blocking.
    required: false
    default: high
  extra_review_instructions:
    description: Extra caller-provided instructions.
    required: false
    default: ""
  http_referer:
    description: Optional OpenRouter HTTP-Referer header.
    required: false
    default: ""
  x_title:
    description: Optional OpenRouter X-Title header.
    required: false
    default: ""

outputs:
  verdict:
    description: pass, warn, or fail.
    value: ${{ steps.run.outputs.verdict }}
  blocking_count:
    description: Number of blocking findings.
    value: ${{ steps.run.outputs.blocking_count }}
  findings_count:
    description: Number of normalized findings.
    value: ${{ steps.run.outputs.findings_count }}

runs:
  using: composite
  steps:
    - id: run
      shell: bash
      env:
        INPUT_GITHUB_TOKEN: ${{ inputs.github_token }}
        INPUT_OPENROUTER_API_KEY: ${{ inputs.openrouter_api_key }}
        INPUT_MODEL: ${{ inputs.model }}
        INPUT_API_BASE: ${{ inputs.api_base }}
        INPUT_MAX_FILES: ${{ inputs.max_files }}
        INPUT_MAX_PATCH_CHARS: ${{ inputs.max_patch_chars }}
        INPUT_POST_PR_COMMENT: ${{ inputs.post_pr_comment }}
        INPUT_FAIL_ON_BLOCKING: ${{ inputs.fail_on_blocking }}
        INPUT_MIN_BLOCK_SEVERITY: ${{ inputs.min_block_severity }}
        INPUT_MIN_BLOCK_CONFIDENCE: ${{ inputs.min_block_confidence }}
        INPUT_EXTRA_REVIEW_INSTRUCTIONS: ${{ inputs.extra_review_instructions }}
        INPUT_HTTP_REFERER: ${{ inputs.http_referer }}
        INPUT_X_TITLE: ${{ inputs.x_title }}
      run: node "${GITHUB_ACTION_PATH}/index.mjs"

```

## FILE: actions/glm-review-zhipu/action.yml
- Role: configuration
- Mode: full
- Language: yaml
- Lines: 76
- Characters: 2453

### Full Content
```yaml
name: glm-review-zhipu
description: Zhipu provider path for bounded AI code review.

inputs:
  github_token:
    description: GitHub token for API requests and PR comments.
    required: true
  zhipu_api_key:
    description: API key for GLM-compatible chat-completions API.
    required: true
  model:
    description: GLM model name.
    required: false
    default: glm-5
  api_base:
    description: GLM-compatible API base URL.
    required: false
    default: https://api.z.ai/api/paas/v4
  max_files:
    description: Maximum number of changed files to include.
    required: false
    default: "25"
  max_patch_chars:
    description: Maximum total patch characters to include.
    required: false
    default: "120000"
  post_pr_comment:
    description: Whether to post or update sticky PR comment.
    required: false
    default: "true"
  fail_on_blocking:
    description: Whether caller intends to fail on blocking findings.
    required: false
    default: "true"
  min_block_severity:
    description: Minimum severity threshold for blocking.
    required: false
    default: high
  min_block_confidence:
    description: Minimum confidence threshold for blocking.
    required: false
    default: high
  extra_review_instructions:
    description: Extra caller-provided instructions.
    required: false
    default: ""

outputs:
  verdict:
    description: pass, warn, or fail.
    value: ${{ steps.run.outputs.verdict }}
  blocking_count:
    description: Number of blocking findings.
    value: ${{ steps.run.outputs.blocking_count }}
  findings_count:
    description: Number of normalized findings.
    value: ${{ steps.run.outputs.findings_count }}

runs:
  using: composite
  steps:
    - id: run
      shell: bash
      env:
        INPUT_GITHUB_TOKEN: ${{ inputs.github_token }}
        INPUT_ZHIPU_API_KEY: ${{ inputs.zhipu_api_key }}
        INPUT_MODEL: ${{ inputs.model }}
        INPUT_API_BASE: ${{ inputs.api_base }}
        INPUT_MAX_FILES: ${{ inputs.max_files }}
        INPUT_MAX_PATCH_CHARS: ${{ inputs.max_patch_chars }}
        INPUT_POST_PR_COMMENT: ${{ inputs.post_pr_comment }}
        INPUT_FAIL_ON_BLOCKING: ${{ inputs.fail_on_blocking }}
        INPUT_MIN_BLOCK_SEVERITY: ${{ inputs.min_block_severity }}
        INPUT_MIN_BLOCK_CONFIDENCE: ${{ inputs.min_block_confidence }}
        INPUT_EXTRA_REVIEW_INSTRUCTIONS: ${{ inputs.extra_review_instructions }}
      run: node "${GITHUB_ACTION_PATH}/index.mjs"

```

## FILE: actions/glm-review/action.yml
- Role: configuration
- Mode: full
- Language: yaml
- Lines: 76
- Characters: 2468

### Full Content
```yaml
name: glm-review
description: Legacy wrapper for Zhipu bounded AI code review.

inputs:
  github_token:
    description: GitHub token for API requests and PR comments.
    required: true
  zhipu_api_key:
    description: API key for GLM-compatible chat-completions API.
    required: true
  model:
    description: GLM model name.
    required: false
    default: glm-5
  api_base:
    description: GLM-compatible API base URL.
    required: false
    default: https://api.z.ai/api/paas/v4
  max_files:
    description: Maximum number of changed files to include.
    required: false
    default: "25"
  max_patch_chars:
    description: Maximum total patch characters to include.
    required: false
    default: "120000"
  post_pr_comment:
    description: Whether to post or update sticky PR comment.
    required: false
    default: "true"
  fail_on_blocking:
    description: Whether caller intends to fail on blocking findings.
    required: false
    default: "true"
  min_block_severity:
    description: Minimum severity threshold for blocking.
    required: false
    default: high
  min_block_confidence:
    description: Minimum confidence threshold for blocking.
    required: false
    default: high
  extra_review_instructions:
    description: Extra caller-provided instructions.
    required: false
    default: ""

outputs:
  verdict:
    description: pass, warn, or fail.
    value: ${{ steps.run.outputs.verdict }}
  blocking_count:
    description: Number of blocking findings.
    value: ${{ steps.run.outputs.blocking_count }}
  findings_count:
    description: Number of normalized findings.
    value: ${{ steps.run.outputs.findings_count }}

runs:
  using: composite
  steps:
    - id: run
      shell: bash
      env:
        INPUT_GITHUB_TOKEN: ${{ inputs.github_token }}
        INPUT_ZHIPU_API_KEY: ${{ inputs.zhipu_api_key }}
        INPUT_MODEL: ${{ inputs.model }}
        INPUT_API_BASE: ${{ inputs.api_base }}
        INPUT_MAX_FILES: ${{ inputs.max_files }}
        INPUT_MAX_PATCH_CHARS: ${{ inputs.max_patch_chars }}
        INPUT_POST_PR_COMMENT: ${{ inputs.post_pr_comment }}
        INPUT_FAIL_ON_BLOCKING: ${{ inputs.fail_on_blocking }}
        INPUT_MIN_BLOCK_SEVERITY: ${{ inputs.min_block_severity }}
        INPUT_MIN_BLOCK_CONFIDENCE: ${{ inputs.min_block_confidence }}
        INPUT_EXTRA_REVIEW_INSTRUCTIONS: ${{ inputs.extra_review_instructions }}
      run: node "${GITHUB_ACTION_PATH}/../glm-review-zhipu/index.mjs"

```

## FILE: examples/ai-review-caller-openrouter.yml
- Role: configuration
- Mode: full
- Language: yaml
- Lines: 40
- Characters: 992

### Full Content
```yaml
name: ai-code-review-openrouter

on:
  pull_request:
    types: [opened, synchronize, reopened]
  push:
    branches:
      - main
      - develop
      - "feature/**"

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
      # Set this to your exact OpenRouter GLM-5 model ID.
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

## FILE: examples/ai-review-caller-zhipu.yml
- Role: configuration
- Mode: full
- Language: yaml
- Lines: 37
- Characters: 844

### Full Content
```yaml
name: ai-code-review-zhipu

on:
  pull_request:
    types: [opened, synchronize, reopened]
  push:
    branches:
      - main
      - develop
      - "feature/**"

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

## FILE: examples/ai-review-caller.yml
- Role: configuration
- Mode: full
- Language: yaml
- Lines: 38
- Characters: 886

### Full Content
```yaml
name: ai-code-review-legacy-zhipu

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
    # Legacy/backward-compatible path (Zhipu).
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

## FILE: gh-reusable-workflows_codebase.md
- Role: documentation
- Mode: chunked
- Language: markdown
- Lines: 2527
- Characters: 73128

### Section Index
- CODEBASE PACK: gh-reusable-workflows (1-2)
- MANIFEST (3-10)
- READING GUIDE (11-24)
- DIRECTORY TREE (25-42)
- FILE INDEX (43-57)
- SKIPPED ITEMS (58-62)
- FILE CONTENT (63-64)
- FILE: README.md (65-71)
- Full Content (72-73)
- gh-reusable-workflows (74-78)
- What this repo provides (79-91)
- Provider paths (92-98)
- Backward compatibility (99-104)
- Required permissions (caller repos) (105-113)
- Required secrets (114-118)
- Inputs (119-120)
- Shared review-policy and bounding inputs (121-130)
- Zhipu workflow inputs (131-135)
- OpenRouter workflow inputs (136-144)
- OpenRouter model ID note (145-149)
- Verdict semantics (150-163)
- Provider comparison (164-170)
- Caller example: OpenRouter (preferred) (171-211)
- Caller example: Zhipu (212-256)
- Setup steps (257-258)
- OpenRouter setup (preferred) (259-269)
- Zhipu setup (270-276)
- Behavior guarantees (277-286)
- FILE: actions/glm-review-openrouter/index.mjs (287-293)
- Full Content (294-299)
- FILE: actions/glm-review-zhipu/index.mjs (300-306)
- Full Content (307-312)
- FILE: actions/glm-review/index.mjs (313-319)
- Full Content (320-1042)
- FILE: actions/glm-review-openrouter/action.yml (1043-1049)
- Full Content (1050-1139)
- FILE: actions/glm-review-zhipu/action.yml (1140-1146)
- Full Content (1147-1227)
- FILE: actions/glm-review/action.yml (1228-1234)
- Full Content (1235-1315)
- FILE: examples/ai-review-caller-openrouter.yml (1316-1322)
- Full Content (1323-1367)
- FILE: examples/ai-review-caller-zhipu.yml (1368-1374)
- Full Content (1375-1416)
- FILE: examples/ai-review-caller.yml (1417-1423)
- Full Content (1424-1466)
- FILE: gh-reusable-workflows_codebase.md (1467-1473)
- Section Index (1474-1501)
- CODEBASE PACK: gh-reusable-workflows (1502-1504)
- CODEBASE PACK: gh-reusable-workflows (1505-1507)
- MANIFEST (1508-1510)
- MANIFEST (1511-1519)
- READING GUIDE (1520-1522)
- READING GUIDE (1523-1530)
- DIRECTORY TREE (1531-1533)
- DIRECTORY TREE (1534-1543)
- FILE INDEX (1544-1546)
- FILE INDEX (1547-1555)
- SKIPPED ITEMS (1556-1558)
- SKIPPED ITEMS (1559-1564)
- FILE CONTENT (1565-1567)
- FILE CONTENT (1568-1570)
- FILE: README.md (1571-1573)
- FILE: README.md (1574-1581)
- Full Content (1582-1584)
- Full Content (1585-1588)
- gh-reusable-workflows (1589-1591)
- gh-reusable-workflows (1592-1597)
- What this provides (1598-1600)
- What this provides (1601-1610)
- Reusable workflow path (1611-1613)
- Reusable workflow path (1614-1622)
- Required secrets (1623-1625)
- Required secrets (1626-1636)
- Required permissions (1637-1639)
- Required permissions (1640-1649)
- Supported inputs (1650-1652)
- Supported inputs (1653-1671)
- Verdict semantics (1672-1674)
- Verdict semantics (1675-1691)
- Caller workflow example (1692-1694)
- Caller workflow example (1695-1741)
- Setup steps (caller repositories) (1742-1744)
- Setup steps (caller repositories) (1745-1755)
- Notes on behavior (1756-1758)
- Notes on behavior (1759-1770)
- FILE: actions/glm-review/index.mjs (1771-1773)
- FILE: actions/glm-review/index.mjs (1774-1781)
- Full Content (1782-1784)
- Full Content (1785-2365)
- FILE: actions/glm-review/action.yml (2366-2368)
- FILE: actions/glm-review/action.yml (2369-2376)
- Full Content (2377-2379)
- Full Content (2380-2461)
- FILE: examples/ai-review-caller.yml (2462-2464)
- FILE: examples/ai-review-caller.yml (2465-2472)
- Full Content (2473-2475)
- Full Content (2476-2518)
- HOW TO USE THIS PACK WITH AN LLM (2519-2521)
- HOW TO USE THIS PACK WITH AN LLM (2522-2525)
- HOW TO USE THIS PACK WITH AN LLM (2526-2527)

### CODEBASE PACK: gh-reusable-workflows
Lines 1-2
```markdown
# CODEBASE PACK: gh-reusable-workflows
```

### MANIFEST
Lines 3-10
```markdown
## MANIFEST
- Included files: 11
- Skipped files/directories: 3
- Total included lines: 2321
- Full files: 10
- Chunked files: 1
- Summary files: 0
```

### READING GUIDE
Lines 11-24
```markdown
## READING GUIDE
Start with these files first:
1. `README.md` — project overview and setup [full]
2. `actions/glm-review-openrouter/index.mjs` — entrypoint [full]
3. `actions/glm-review-zhipu/index.mjs` — entrypoint [full]
4. `actions/glm-review/index.mjs` — entrypoint [full]
5. `actions/glm-review-openrouter/action.yml` — configuration [full]
6. `actions/glm-review-zhipu/action.yml` — configuration [full]
7. `actions/glm-review/action.yml` — configuration [full]
8. `examples/ai-review-caller-openrouter.yml` — configuration [full]
9. `examples/ai-review-caller-zhipu.yml` — configuration [full]
10. `examples/ai-review-caller.yml` — configuration [full]
11. `gh-reusable-workflows_codebase.md` — documentation [chunked]
```

### DIRECTORY TREE
Lines 25-42
```markdown
## DIRECTORY TREE
- actions/
  - glm-review/
    - action.yml
    - index.mjs
  - glm-review-openrouter/
    - action.yml
    - index.mjs
  - glm-review-zhipu/
    - action.yml
    - index.mjs
- examples/
  - ai-review-caller-openrouter.yml
  - ai-review-caller-zhipu.yml
  - ai-review-caller.yml
- gh-reusable-workflows_codebase.md
- README.md
```

### FILE INDEX
Lines 43-57
```markdown
## FILE INDEX
| Path | Role | Lines | Chars | Mode |
|---|---|---:|---:|---|
| `README.md` | project overview and setup | 210 | 6205 | full |
| `actions/glm-review-openrouter/index.mjs` | entrypoint | 1 | 34 | full |
| `actions/glm-review-zhipu/index.mjs` | entrypoint | 1 | 34 | full |
| `actions/glm-review/index.mjs` | entrypoint | 718 | 22808 | full |
| `actions/glm-review-openrouter/action.yml` | configuration | 85 | 2762 | full |
| `actions/glm-review-zhipu/action.yml` | configuration | 76 | 2453 | full |
| `actions/glm-review/action.yml` | configuration | 76 | 2468 | full |
| `examples/ai-review-caller-openrouter.yml` | configuration | 40 | 992 | full |
| `examples/ai-review-caller-zhipu.yml` | configuration | 37 | 844 | full |
| `examples/ai-review-caller.yml` | configuration | 38 | 886 | full |
| `gh-reusable-workflows_codebase.md` | documentation | 1039 | 31446 | chunked |
```

### SKIPPED ITEMS
Lines 58-62
```markdown
## SKIPPED ITEMS
- `.DS_Store` — hidden
- `.git/` — skipped directory
- `.github/` — skipped directory
```

### FILE CONTENT
Lines 63-64
```markdown
## FILE CONTENT
```

### FILE: README.md
Lines 65-71
```markdown
## FILE: README.md
- Role: project overview and setup
- Mode: full
- Language: markdown
- Lines: 210
- Characters: 6205
```

### Full Content
Lines 72-73
```markdown
### Full Content
```markdown
```

### gh-reusable-workflows
Lines 74-78
```markdown
# gh-reusable-workflows

Reusable GitHub Actions workflows for AI code review with deterministic local verdicting.  
This repo now provides two provider-specific reusable workflows: **Zhipu** and **OpenRouter**.
```

### What this repo provides
Lines 79-91
```markdown
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
```

### Provider paths
Lines 92-98
```markdown
## Provider paths

- **Preferred for future flexibility:** OpenRouter
  - `marcopared/gh-reusable-workflows/.github/workflows/ai-code-review-openrouter.yml@v1`
- **Direct Zhipu path:**
  - `marcopared/gh-reusable-workflows/.github/workflows/ai-code-review-zhipu.yml@v1`
```

### Backward compatibility
Lines 99-104
```markdown
### Backward compatibility

- Legacy generic workflow path is preserved and currently aliases to Zhipu:
  - `marcopared/gh-reusable-workflows/.github/workflows/ai-code-review.yml@v1`
- Legacy action path `actions/glm-review/action.yml` is also retained as a Zhipu-compatible wrapper.
```

### Required permissions (caller repos)
Lines 105-113
```markdown
## Required permissions (caller repos)

Grant these at workflow or job scope:

- `contents: read`
- `pull-requests: write`

If `pull-requests: write` is missing, review still runs and step summary is written, but PR comment upsert may be skipped with a warning.
```

### Required secrets
Lines 114-118
```markdown
## Required secrets

- Zhipu workflow: `ZHIPU_API_KEY` (mapped as `zhipu_api_key`)
- OpenRouter workflow: `OPENROUTER_API_KEY` (mapped as `openrouter_api_key`)
```

### Inputs
Lines 119-120
```markdown
## Inputs
```

### Shared review-policy and bounding inputs
Lines 121-130
```markdown
### Shared review-policy and bounding inputs

- `max_files` (default `25`)
- `max_patch_chars` (default `120000`)
- `post_pr_comment` (default `true`)
- `fail_on_blocking` (default `true`)
- `min_block_severity` (`low|medium|high|critical`, default `high`)
- `min_block_confidence` (`low|medium|high`, default `high`)
- `extra_review_instructions` (default empty)
```

### Zhipu workflow inputs
Lines 131-135
```markdown
### Zhipu workflow inputs

- `model` (default `glm-5`)
- `api_base` (default `https://api.z.ai/api/paas/v4`)
```

### OpenRouter workflow inputs
Lines 136-144
```markdown
### OpenRouter workflow inputs

- `model` (**required**): exact OpenRouter model ID
- `api_base` (default `https://openrouter.ai/api/v1`)
- `http_referer` (optional, default empty)
- `x_title` (optional, default empty)

OpenRouter uses an OpenAI-compatible chat completions endpoint: `${api_base}/chat/completions`.
```

### OpenRouter model ID note
Lines 145-149
```markdown
## OpenRouter model ID note

This repo does **not** guess a GLM-5 OpenRouter model slug.  
Pass the exact model ID available in your OpenRouter account via `with.model`.
```

### Verdict semantics
Lines 150-163
```markdown
## Verdict semantics

The model proposes findings, but blocking and verdict are computed locally:

- `pass`: no findings
- `warn`: findings exist, none block
- `fail`: at least one blocking finding

Blocking policy is local and conservative:

- only categories `correctness` and `security` can block
- severity must meet `min_block_severity`
- confidence must meet `min_block_confidence`
```

### Provider comparison
Lines 164-170
```markdown
## Provider comparison

- **Use OpenRouter** when you want model-routing flexibility without changing workflow logic.
- **Use Zhipu** for direct provider integration with existing GLM defaults.

Both paths keep identical review behavior (bounded diffs, sticky PR comment, step summary, pass/warn/fail policy).
```

### Caller example: OpenRouter (preferred)
Lines 171-211
```markdown
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
```

### Caller example: Zhipu
Lines 212-256
```markdown
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
```

### Setup steps
Lines 257-258
```markdown
## Setup steps
```

### OpenRouter setup (preferred)
Lines 259-269
```markdown
### OpenRouter setup (preferred)

1. Add secret `OPENROUTER_API_KEY` in caller repo.
2. Add the OpenRouter caller workflow.
3. Set `with.model` to your exact OpenRouter GLM-5 model ID.
4. Open a PR and verify:
   - workflow executes
   - step summary appears
   - sticky PR comment is created/updated
5. Add the workflow check as required in branch protection.
```

### Zhipu setup
Lines 270-276
```markdown
### Zhipu setup

1. Add secret `ZHIPU_API_KEY` in caller repo.
2. Add the Zhipu caller workflow.
3. Open a PR and verify behavior.
4. Add the workflow check as required in branch protection.
```

### Behavior guarantees
Lines 277-286
```markdown
## Behavior guarantees

- Event support: `pull_request` and `push`
- No inline diff comments (v1)
- No `pull_request_target`
- Bounded payload for deterministic CI behavior
- Malformed model output fails clearly with readable step summary

```
```

### FILE: actions/glm-review-openrouter/index.mjs
Lines 287-293
```markdown
## FILE: actions/glm-review-openrouter/index.mjs
- Role: entrypoint
- Mode: full
- Language: js
- Lines: 1
- Characters: 34
```

### Full Content
Lines 294-299
```markdown
### Full Content
```js
import "../glm-review/index.mjs";

```
```

### FILE: actions/glm-review-zhipu/index.mjs
Lines 300-306
```markdown
## FILE: actions/glm-review-zhipu/index.mjs
- Role: entrypoint
- Mode: full
- Language: js
- Lines: 1
- Characters: 34
```

### Full Content
Lines 307-312
```markdown
### Full Content
```js
import "../glm-review/index.mjs";

```
```

### FILE: actions/glm-review/index.mjs
Lines 313-319
```markdown
## FILE: actions/glm-review/index.mjs
- Role: entrypoint
- Mode: full
- Language: js
- Lines: 718
- Characters: 22808
```

### Full Content
Lines 320-1042
```markdown
### Full Content
```js
import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";

const STICKY_MARKER = "<!-- ai-code-review:glm-review -->";

const ALLOWED_CATEGORIES = new Set([
  "correctness",
  "security",
  "reliability",
  "performance",
  "maintainability",
  "testing",
]);
const ALLOWED_SEVERITY = ["low", "medium", "high", "critical"];
const ALLOWED_CONFIDENCE = ["low", "medium", "high"];
const BLOCKABLE_CATEGORIES = new Set(["correctness", "security"]);

const GITHUB_API_BASE = "https://api.github.com";
const MAX_FILE_CONTENT_CHARS = 4000;
const MAX_FINDINGS_RENDER = 60;

function getInput(name, fallback = "") {
  const value = process.env[`INPUT_${name.toUpperCase()}`];
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  return value;
}

function parseBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "y", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "n", "off"].includes(normalized)) return false;
  return fallback;
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function clampEnum(value, allowedList, fallback) {
  const normalized = String(value ?? "").trim().toLowerCase();
  return allowedList.includes(normalized) ? normalized : fallback;
}

function writeOutput(name, value) {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (!outputPath) return;
  appendFileSync(outputPath, `${name}=${String(value)}\n`, "utf8");
}

function writeStepSummary(markdown) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) return;
  appendFileSync(summaryPath, `${markdown}\n`, "utf8");
}

function writeFailureSummary(reason) {
  const message = String(reason ?? "Unknown error");
  writeStepSummary([
    "## ❌ AI Code Review: Runtime Error",
    "",
    `The review job failed before producing a verdict.`,
    "",
    `- Error: \`${escapeMarkdown(message)}\``,
    "",
    "This usually indicates malformed model output, API failure, missing permissions, or invalid workflow inputs.",
  ].join("\n"));
}

function readJsonFile(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function runGit(args, options = {}) {
  try {
    return execFileSync("git", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 16 * 1024 * 1024,
      ...options,
    });
  } catch (error) {
    const stderr = error?.stderr ? String(error.stderr) : "";
    const message = `git ${args.join(" ")} failed${stderr ? `: ${stderr.trim()}` : ""}`;
    throw new Error(message);
  }
}

async function readHeadContent(path) {
  if (!path || !existsSync(path)) return "";
  try {
    const content = await readFile(path, "utf8");
    if (content.length <= MAX_FILE_CONTENT_CHARS) return content;
    return `${content.slice(0, MAX_FILE_CONTENT_CHARS)}\n...[truncated content]`;
  } catch {
    return "";
  }
}

async function ghRequest({ token, method = "GET", path, body }) {
  const response = await fetch(`${GITHUB_API_BASE}${path}`, {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "ai-code-review",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API ${method} ${path} failed (${response.status}): ${text.slice(0, 400)}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

async function getPullRequestChangedFiles({ token, owner, repo, prNumber }) {
  const files = [];
  let page = 1;

  while (true) {
    const pageItems = await ghRequest({
      token,
      path: `/repos/${owner}/${repo}/pulls/${prNumber}/files?per_page=100&page=${page}`,
    });

    if (!Array.isArray(pageItems) || pageItems.length === 0) break;
    files.push(...pageItems);
    if (pageItems.length < 100) break;
    page += 1;
  }

  const mapped = [];
  for (const file of files) {
    const status = file.status || "modified";
    const path = file.filename;
    const patch = typeof file.patch === "string" ? file.patch : "";
    const binary = typeof file.patch !== "string";
    const removed = status === "removed";
    const content = removed || binary ? "" : await readHeadContent(path);

    mapped.push({
      path,
      status,
      previous_path: file.previous_filename || "",
      patch,
      binary,
      content,
    });
  }

  return mapped;
}

function parseNameStatusLines(output) {
  const lines = output.split("\n").map((line) => line.trim()).filter(Boolean);
  const files = [];
  for (const line of lines) {
    const parts = line.split("\t");
    if (parts.length < 2) continue;
    const statusRaw = parts[0];
    if (statusRaw.startsWith("R") || statusRaw.startsWith("C")) {
      if (parts.length < 3) continue;
      files.push({
        status: "renamed",
        previous_path: parts[1],
        path: parts[2],
      });
    } else {
      const statusMap = {
        A: "added",
        M: "modified",
        D: "removed",
        T: "modified",
      };
      files.push({
        status: statusMap[statusRaw] || "modified",
        previous_path: "",
        path: parts[1],
      });
    }
  }
  return files;
}

async function getPushChangedFiles({ before, after }) {
  const isInitialPush = !before || /^0+$/.test(before);

  let nameStatusOutput = "";
  if (isInitialPush) {
    nameStatusOutput = runGit(["diff-tree", "--no-commit-id", "--name-status", "-r", after]);
  } else {
    nameStatusOutput = runGit(["diff", "--name-status", "--find-renames", before, after]);
  }

  const files = parseNameStatusLines(nameStatusOutput);
  const result = [];

  for (const file of files) {
    let patch = "";
    if (isInitialPush) {
      patch = runGit(["show", "--format=", "--unified=3", after, "--", file.path]);
    } else {
      patch = runGit(["diff", "--unified=3", before, after, "--", file.path]);
    }
    const binary = patch.includes("Binary files") || patch.includes("GIT binary patch");
    const removed = file.status === "removed";
    const content = removed || binary ? "" : await readHeadContent(file.path);
    result.push({
      ...file,
      patch,
      binary,
      content,
    });
  }

  return result;
}

function buildBoundedFiles(changedFiles, maxFiles, maxPatchChars) {
  const sorted = [...changedFiles].sort((a, b) => a.path.localeCompare(b.path));
  const selected = [];
  let totalPatchChars = 0;

  for (const file of sorted) {
    if (selected.length >= maxFiles) break;
    const safePatch = typeof file.patch === "string" ? file.patch : "";
    const remaining = Math.max(0, maxPatchChars - totalPatchChars);
    const includePatch = !file.binary && remaining > 0;
    let patch = "";
    let patch_truncated = false;

    if (includePatch) {
      if (safePatch.length <= remaining) {
        patch = safePatch;
        totalPatchChars += safePatch.length;
      } else {
        patch = `${safePatch.slice(0, remaining)}\n...[truncated patch]`;
        totalPatchChars += remaining;
        patch_truncated = true;
      }
    }

    selected.push({
      path: file.path,
      status: file.status,
      previous_path: file.previous_path || "",
      binary: Boolean(file.binary),
      patch,
      patch_truncated,
      content: file.content || "",
    });
  }

  return {
    total_changed_files: changedFiles.length,
    included_files: selected.length,
    files: selected,
    omitted_files: Math.max(0, changedFiles.length - selected.length),
    total_patch_chars_included: totalPatchChars,
  };
}

function toChatContentString(messageContent) {
  if (typeof messageContent === "string") return messageContent;
  if (Array.isArray(messageContent)) {
    return messageContent
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .join("\n")
      .trim();
  }
  return "";
}

function parseModelJson(raw) {
  const text = String(raw ?? "").trim();
  if (!text) throw new Error("Model returned empty content.");
  if (text.startsWith("```")) {
    throw new Error("Model output must be raw JSON without markdown code fences.");
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Model output is not valid JSON: ${error.message}`);
  }
}

function normalizeFinding(item) {
  if (!item || typeof item !== "object") return null;

  const path = String(item.path ?? "").trim();
  const title = String(item.title ?? "").trim();
  const body = String(item.body ?? "").trim();
  if (!path || !title || !body) return null;

  const lineRaw = Number.parseInt(String(item.line ?? "1"), 10);
  const line = Number.isFinite(lineRaw) && lineRaw > 0 ? lineRaw : 1;

  const severity = clampEnum(item.severity, ALLOWED_SEVERITY, "low");
  const confidence = clampEnum(item.confidence, ALLOWED_CONFIDENCE, "low");
  const category = clampEnum(item.category, [...ALLOWED_CATEGORIES], "maintainability");
  const suggestion = String(item.suggestion ?? "").trim();

  return { path, line, severity, confidence, category, title, body, suggestion };
}

function dedupeFindings(findings) {
  const seen = new Set();
  const unique = [];
  for (const finding of findings) {
    const key = [
      finding.path.toLowerCase(),
      finding.line,
      finding.category,
      finding.title.toLowerCase(),
      finding.body.toLowerCase().slice(0, 180),
    ].join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(finding);
  }
  return unique;
}

function rank(value, orderedValues) {
  return orderedValues.indexOf(value);
}

function isBlocking(finding, minSeverity, minConfidence) {
  if (!BLOCKABLE_CATEGORIES.has(finding.category)) return false;
  return (
    rank(finding.severity, ALLOWED_SEVERITY) >= rank(minSeverity, ALLOWED_SEVERITY) &&
    rank(finding.confidence, ALLOWED_CONFIDENCE) >= rank(minConfidence, ALLOWED_CONFIDENCE)
  );
}

function escapeMarkdown(text) {
  return String(text ?? "")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function groupFindings(findings) {
  const groups = new Map();
  for (const finding of findings) {
    if (!groups.has(finding.category)) groups.set(finding.category, []);
    groups.get(finding.category).push(finding);
  }
  for (const list of groups.values()) {
    list.sort((a, b) => {
      const sev = rank(b.severity, ALLOWED_SEVERITY) - rank(a.severity, ALLOWED_SEVERITY);
      if (sev !== 0) return sev;
      const conf = rank(b.confidence, ALLOWED_CONFIDENCE) - rank(a.confidence, ALLOWED_CONFIDENCE);
      if (conf !== 0) return conf;
      return `${a.path}:${a.line}`.localeCompare(`${b.path}:${b.line}`);
    });
  }
  return groups;
}

function buildReviewMarkdown({
  verdict,
  summary,
  findings,
  blockingCount,
  totalChangedFiles,
  includedFiles,
  omittedFiles,
  minBlockSeverity,
  minBlockConfidence,
  forPrComment,
}) {
  const verdictLabel = verdict === "fail" ? "FAIL" : verdict === "warn" ? "WARN" : "PASS";
  const verdictEmoji = verdict === "fail" ? "❌" : verdict === "warn" ? "⚠️" : "✅";
  const grouped = groupFindings(findings.slice(0, MAX_FINDINGS_RENDER));
  const lines = [];

  if (forPrComment) lines.push(STICKY_MARKER);
  lines.push(`## ${verdictEmoji} AI Code Review: ${verdictLabel}`);
  lines.push("");
  lines.push(`**Assessment:** ${escapeMarkdown(summary || "No additional concerns.")}`);
  lines.push("");
  lines.push(`- Verdict: \`${verdict}\``);
  lines.push(`- Findings: \`${findings.length}\``);
  lines.push(`- Blocking findings: \`${blockingCount}\``);
  lines.push(`- Reviewed files: \`${includedFiles}/${totalChangedFiles}\`${omittedFiles > 0 ? ` (omitted ${omittedFiles})` : ""}`);
  lines.push(`- Blocking threshold: category in \`correctness|security\`, severity >= \`${minBlockSeverity}\`, confidence >= \`${minBlockConfidence}\``);
  lines.push("");

  if (findings.length === 0) {
    lines.push("No findings were identified in the bounded changed-code set.");
  } else {
    lines.push("### Findings");
    lines.push("");
    const orderedCategories = [
      "security",
      "correctness",
      "reliability",
      "performance",
      "maintainability",
      "testing",
    ];
    for (const category of orderedCategories) {
      const list = grouped.get(category) || [];
      if (list.length === 0) continue;
      lines.push(`**${category}** (${list.length})`);
      for (const finding of list) {
        const scope = `\`${escapeMarkdown(finding.path)}:${finding.line}\``;
        const level = `${finding.severity}/${finding.confidence}`;
        const blockingTag = finding.blocking ? " **[blocking]**" : "";
        lines.push(`- [${level}] ${scope} - **${escapeMarkdown(finding.title)}**${blockingTag}`);
        lines.push(`  - ${escapeMarkdown(finding.body)}`);
        if (finding.suggestion) {
          lines.push(`  - Suggested fix: ${escapeMarkdown(finding.suggestion)}`);
        }
      }
      lines.push("");
    }
    if (findings.length > MAX_FINDINGS_RENDER) {
      lines.push(`_Only the first ${MAX_FINDINGS_RENDER} findings are shown._`);
    }
  }

  return lines.join("\n");
}

async function upsertStickyPrComment({ token, owner, repo, prNumber, body }) {
  let comments = [];
  let page = 1;
  while (true) {
    const pageItems = await ghRequest({
      token,
      path: `/repos/${owner}/${repo}/issues/${prNumber}/comments?per_page=100&page=${page}`,
    });
    if (!Array.isArray(pageItems) || pageItems.length === 0) break;
    comments = comments.concat(pageItems);
    if (pageItems.length < 100) break;
    page += 1;
  }

  const existing = comments.find(
    (comment) =>
      comment?.user?.type === "Bot" &&
      typeof comment?.body === "string" &&
      comment.body.includes(STICKY_MARKER),
  );
  if (existing) {
    await ghRequest({
      token,
      method: "PATCH",
      path: `/repos/${owner}/${repo}/issues/comments/${existing.id}`,
      body: { body },
    });
    return "updated";
  }

  await ghRequest({
    token,
    method: "POST",
    path: `/repos/${owner}/${repo}/issues/${prNumber}/comments`,
    body: { body },
  });
  return "created";
}

async function runModelReview({
  apiBase,
  apiKey,
  model,
  repo,
  eventType,
  boundedFiles,
  extraReviewInstructions,
  httpReferer,
  xTitle,
}) {
  const systemPrompt = [
    "You are a senior code reviewer for CI.",
    "Review ONLY changed code provided in input.",
    "Prioritize correctness, security, reliability, performance, maintainability, and materially important testing gaps.",
    "Avoid style-only nits, avoid speculation, and prefer fewer high-confidence findings.",
    "Use only evidence from provided data.",
    "Return JSON only with the required schema.",
  ].join(" ");

  const requiredSchema = {
    summary: "short overall assessment",
    findings: [
      {
        path: "relative/file/path",
        line: 123,
        severity: "low|medium|high|critical",
        confidence: "low|medium|high",
        category: "correctness|security|reliability|performance|maintainability|testing",
        title: "short specific title",
        body: "grounded explanation",
        suggestion: "specific fix",
      },
    ],
  };

  const userPayload = {
    repo,
    event_type: eventType,
    changed_files: boundedFiles.files,
    limits: {
      total_changed_files: boundedFiles.total_changed_files,
      included_files: boundedFiles.included_files,
      omitted_files: boundedFiles.omitted_files,
      total_patch_chars_included: boundedFiles.total_patch_chars_included,
    },
    extra_review_instructions: extraReviewInstructions || "",
    required_output_schema: requiredSchema,
  };

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  if (httpReferer) {
    headers["HTTP-Referer"] = httpReferer;
  }
  if (xTitle) {
    headers["X-Title"] = xTitle;
  }

  const response = await fetch(`${apiBase.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Return ONLY valid JSON matching required_output_schema. Input:\n${JSON.stringify(userPayload)}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Model API call failed (${response.status}): ${text.slice(0, 500)}`);
  }

  const data = await response.json();
  const content = toChatContentString(data?.choices?.[0]?.message?.content);
  const parsed = parseModelJson(content);

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Model output JSON root must be an object.");
  }
  if (typeof parsed.summary !== "string") {
    throw new Error("Model output JSON must include string field: summary.");
  }
  if (!Array.isArray(parsed.findings)) {
    throw new Error("Model output JSON must include array field: findings.");
  }

  return parsed;
}

async function main() {
  const githubToken = getInput("github_token");
  const zhipuApiKey = getInput("zhipu_api_key");
  const openrouterApiKey = getInput("openrouter_api_key");
  const selectedApiKey = zhipuApiKey || openrouterApiKey;
  const rawModel = getInput("model", "");
  const model = rawModel || (openrouterApiKey ? "" : "glm-5");
  const apiBase = getInput("api_base", "https://api.z.ai/api/paas/v4");
  const maxFiles = parsePositiveInt(getInput("max_files", "25"), 25);
  const maxPatchChars = parsePositiveInt(getInput("max_patch_chars", "120000"), 120000);
... [chunk truncated]
```

### FILE: actions/glm-review-openrouter/action.yml
Lines 1043-1049
```markdown
## FILE: actions/glm-review-openrouter/action.yml
- Role: configuration
- Mode: full
- Language: yaml
- Lines: 85
- Characters: 2762
```

### Full Content
Lines 1050-1139
```markdown
### Full Content
```yaml
name: glm-review-openrouter
description: OpenRouter provider path for bounded AI code review.

inputs:
  github_token:
    description: GitHub token for API requests and PR comments.
    required: true
  openrouter_api_key:
    description: API key for OpenRouter API.
    required: true
  model:
    description: Exact OpenRouter model ID to call.
    required: true
  api_base:
    description: OpenRouter API base URL.
    required: false
    default: https://openrouter.ai/api/v1
  max_files:
    description: Maximum number of changed files to include.
    required: false
    default: "25"
  max_patch_chars:
    description: Maximum total patch characters to include.
    required: false
    default: "120000"
  post_pr_comment:
    description: Whether to post or update sticky PR comment.
    required: false
    default: "true"
  fail_on_blocking:
    description: Whether caller intends to fail on blocking findings.
    required: false
    default: "true"
  min_block_severity:
    description: Minimum severity threshold for blocking.
    required: false
    default: high
  min_block_confidence:
    description: Minimum confidence threshold for blocking.
    required: false
    default: high
  extra_review_instructions:
    description: Extra caller-provided instructions.
    required: false
    default: ""
  http_referer:
    description: Optional OpenRouter HTTP-Referer header.
    required: false
    default: ""
  x_title:
    description: Optional OpenRouter X-Title header.
    required: false
    default: ""

outputs:
  verdict:
    description: pass, warn, or fail.
    value: ${{ steps.run.outputs.verdict }}
  blocking_count:
    description: Number of blocking findings.
    value: ${{ steps.run.outputs.blocking_count }}
  findings_count:
    description: Number of normalized findings.
    value: ${{ steps.run.outputs.findings_count }}

runs:
  using: composite
  steps:
    - id: run
      shell: bash
      env:
        INPUT_GITHUB_TOKEN: ${{ inputs.github_token }}
        INPUT_OPENROUTER_API_KEY: ${{ inputs.openrouter_api_key }}
        INPUT_MODEL: ${{ inputs.model }}
        INPUT_API_BASE: ${{ inputs.api_base }}
        INPUT_MAX_FILES: ${{ inputs.max_files }}
        INPUT_MAX_PATCH_CHARS: ${{ inputs.max_patch_chars }}
        INPUT_POST_PR_COMMENT: ${{ inputs.post_pr_comment }}
        INPUT_FAIL_ON_BLOCKING: ${{ inputs.fail_on_blocking }}
        INPUT_MIN_BLOCK_SEVERITY: ${{ inputs.min_block_severity }}
        INPUT_MIN_BLOCK_CONFIDENCE: ${{ inputs.min_block_confidence }}
        INPUT_EXTRA_REVIEW_INSTRUCTIONS: ${{ inputs.extra_review_instructions }}
        INPUT_HTTP_REFERER: ${{ inputs.http_referer }}
        INPUT_X_TITLE: ${{ inputs.x_title }}
      run: node "${GITHUB_ACTION_PATH}/index.mjs"

```
```

### FILE: actions/glm-review-zhipu/action.yml
Lines 1140-1146
```markdown
## FILE: actions/glm-review-zhipu/action.yml
- Role: configuration
- Mode: full
- Language: yaml
- Lines: 76
- Characters: 2453
```

### Full Content
Lines 1147-1227
```markdown
### Full Content
```yaml
name: glm-review-zhipu
description: Zhipu provider path for bounded AI code review.

inputs:
  github_token:
    description: GitHub token for API requests and PR comments.
    required: true
  zhipu_api_key:
    description: API key for GLM-compatible chat-completions API.
    required: true
  model:
    description: GLM model name.
    required: false
    default: glm-5
  api_base:
    description: GLM-compatible API base URL.
    required: false
    default: https://api.z.ai/api/paas/v4
  max_files:
    description: Maximum number of changed files to include.
    required: false
    default: "25"
  max_patch_chars:
    description: Maximum total patch characters to include.
    required: false
    default: "120000"
  post_pr_comment:
    description: Whether to post or update sticky PR comment.
    required: false
    default: "true"
  fail_on_blocking:
    description: Whether caller intends to fail on blocking findings.
    required: false
    default: "true"
  min_block_severity:
    description: Minimum severity threshold for blocking.
    required: false
    default: high
  min_block_confidence:
    description: Minimum confidence threshold for blocking.
    required: false
    default: high
  extra_review_instructions:
    description: Extra caller-provided instructions.
    required: false
    default: ""

outputs:
  verdict:
    description: pass, warn, or fail.
    value: ${{ steps.run.outputs.verdict }}
  blocking_count:
    description: Number of blocking findings.
    value: ${{ steps.run.outputs.blocking_count }}
  findings_count:
    description: Number of normalized findings.
    value: ${{ steps.run.outputs.findings_count }}

runs:
  using: composite
  steps:
    - id: run
      shell: bash
      env:
        INPUT_GITHUB_TOKEN: ${{ inputs.github_token }}
        INPUT_ZHIPU_API_KEY: ${{ inputs.zhipu_api_key }}
        INPUT_MODEL: ${{ inputs.model }}
        INPUT_API_BASE: ${{ inputs.api_base }}
        INPUT_MAX_FILES: ${{ inputs.max_files }}
        INPUT_MAX_PATCH_CHARS: ${{ inputs.max_patch_chars }}
        INPUT_POST_PR_COMMENT: ${{ inputs.post_pr_comment }}
        INPUT_FAIL_ON_BLOCKING: ${{ inputs.fail_on_blocking }}
        INPUT_MIN_BLOCK_SEVERITY: ${{ inputs.min_block_severity }}
        INPUT_MIN_BLOCK_CONFIDENCE: ${{ inputs.min_block_confidence }}
        INPUT_EXTRA_REVIEW_INSTRUCTIONS: ${{ inputs.extra_review_instructions }}
      run: node "${GITHUB_ACTION_PATH}/index.mjs"

```
```

### FILE: actions/glm-review/action.yml
Lines 1228-1234
```markdown
## FILE: actions/glm-review/action.yml
- Role: configuration
- Mode: full
- Language: yaml
- Lines: 76
- Characters: 2468
```

### Full Content
Lines 1235-1315
```markdown
### Full Content
```yaml
name: glm-review
description: Legacy wrapper for Zhipu bounded AI code review.

inputs:
  github_token:
    description: GitHub token for API requests and PR comments.
    required: true
  zhipu_api_key:
    description: API key for GLM-compatible chat-completions API.
    required: true
  model:
    description: GLM model name.
    required: false
    default: glm-5
  api_base:
    description: GLM-compatible API base URL.
    required: false
    default: https://api.z.ai/api/paas/v4
  max_files:
    description: Maximum number of changed files to include.
    required: false
    default: "25"
  max_patch_chars:
    description: Maximum total patch characters to include.
    required: false
    default: "120000"
  post_pr_comment:
    description: Whether to post or update sticky PR comment.
    required: false
    default: "true"
  fail_on_blocking:
    description: Whether caller intends to fail on blocking findings.
    required: false
    default: "true"
  min_block_severity:
    description: Minimum severity threshold for blocking.
    required: false
    default: high
  min_block_confidence:
    description: Minimum confidence threshold for blocking.
    required: false
    default: high
  extra_review_instructions:
    description: Extra caller-provided instructions.
    required: false
    default: ""

outputs:
  verdict:
    description: pass, warn, or fail.
    value: ${{ steps.run.outputs.verdict }}
  blocking_count:
    description: Number of blocking findings.
    value: ${{ steps.run.outputs.blocking_count }}
  findings_count:
    description: Number of normalized findings.
    value: ${{ steps.run.outputs.findings_count }}

runs:
  using: composite
  steps:
    - id: run
      shell: bash
      env:
        INPUT_GITHUB_TOKEN: ${{ inputs.github_token }}
        INPUT_ZHIPU_API_KEY: ${{ inputs.zhipu_api_key }}
        INPUT_MODEL: ${{ inputs.model }}
        INPUT_API_BASE: ${{ inputs.api_base }}
        INPUT_MAX_FILES: ${{ inputs.max_files }}
        INPUT_MAX_PATCH_CHARS: ${{ inputs.max_patch_chars }}
        INPUT_POST_PR_COMMENT: ${{ inputs.post_pr_comment }}
        INPUT_FAIL_ON_BLOCKING: ${{ inputs.fail_on_blocking }}
        INPUT_MIN_BLOCK_SEVERITY: ${{ inputs.min_block_severity }}
        INPUT_MIN_BLOCK_CONFIDENCE: ${{ inputs.min_block_confidence }}
        INPUT_EXTRA_REVIEW_INSTRUCTIONS: ${{ inputs.extra_review_instructions }}
      run: node "${GITHUB_ACTION_PATH}/../glm-review-zhipu/index.mjs"

```
```

### FILE: examples/ai-review-caller-openrouter.yml
Lines 1316-1322
```markdown
## FILE: examples/ai-review-caller-openrouter.yml
- Role: configuration
- Mode: full
- Language: yaml
- Lines: 40
- Characters: 992
```

### Full Content
Lines 1323-1367
```markdown
### Full Content
```yaml
name: ai-code-review-openrouter

on:
  pull_request:
    types: [opened, synchronize, reopened]
  push:
    branches:
      - main
      - develop
      - "feature/**"

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
      # Set this to your exact OpenRouter GLM-5 model ID.
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
```

### FILE: examples/ai-review-caller-zhipu.yml
Lines 1368-1374
```markdown
## FILE: examples/ai-review-caller-zhipu.yml
- Role: configuration
- Mode: full
- Language: yaml
- Lines: 37
- Characters: 844
```

### Full Content
Lines 1375-1416
```markdown
### Full Content
```yaml
name: ai-code-review-zhipu

on:
  pull_request:
    types: [opened, synchronize, reopened]
  push:
    branches:
      - main
      - develop
      - "feature/**"

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
```

### FILE: examples/ai-review-caller.yml
Lines 1417-1423
```markdown
## FILE: examples/ai-review-caller.yml
- Role: configuration
- Mode: full
- Language: yaml
- Lines: 38
- Characters: 886
```

### Full Content
Lines 1424-1466
```markdown
### Full Content
```yaml
name: ai-code-review-legacy-zhipu

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
    # Legacy/backward-compatible path (Zhipu).
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
```

### FILE: gh-reusable-workflows_codebase.md
Lines 1467-1473
```markdown
## FILE: gh-reusable-workflows_codebase.md
- Role: documentation
- Mode: chunked
- Language: markdown
- Lines: 1039
- Characters: 31446
```

### Section Index
Lines 1474-1501
```markdown
### Section Index
- CODEBASE PACK: gh-reusable-workflows (1-2)
- MANIFEST (3-10)
- READING GUIDE (11-17)
- DIRECTORY TREE (18-26)
- FILE INDEX (27-34)
- SKIPPED ITEMS (35-39)
- FILE CONTENT (40-41)
- FILE: README.md (42-48)
- Full Content (49-50)
- gh-reusable-workflows (51-55)
- What this provides (56-64)
- Reusable workflow path (65-72)
- Required secrets (73-82)
- Required permissions (83-91)
- Supported inputs (92-109)
- Verdict semantics (110-125)
- Caller workflow example (126-171)
- Setup steps (caller repositories) (172-181)
- Notes on behavior (182-192)
- FILE: actions/glm-review/index.mjs (193-199)
- Full Content (200-900)
- FILE: actions/glm-review/action.yml (901-907)
- Full Content (908-988)
- FILE: examples/ai-review-caller.yml (989-995)
- Full Content (996-1037)
- HOW TO USE THIS PACK WITH AN LLM (1038-1039)
```

### CODEBASE PACK: gh-reusable-workflows
Lines 1502-1504
```markdown
### CODEBASE PACK: gh-reusable-workflows
Lines 1-2
```markdown
```

### CODEBASE PACK: gh-reusable-workflows
Lines 1505-1507
```markdown
# CODEBASE PACK: gh-reusable-workflows
```
```

### MANIFEST
Lines 1508-1510
```markdown
### MANIFEST
Lines 3-10
```markdown
```

### MANIFEST
Lines 1511-1519
```markdown
## MANIFEST
- Included files: 4
- Skipped files/directories: 3
- Total included lines: 948
- Full files: 4
- Chunked files: 0
- Summary files: 0
```
```

### READING GUIDE
Lines 1520-1522
```markdown
### READING GUIDE
Lines 11-17
```markdown
```

### READING GUIDE
Lines 1523-1530
```markdown
## READING GUIDE
Start with these files first:
1. `README.md` — project overview and setup [full]
2. `actions/glm-review/index.mjs` — entrypoint [full]
3. `actions/glm-review/action.yml` — configuration [full]
4. `examples/ai-review-caller.yml` — configuration [full]
```
```

### DIRECTORY TREE
Lines 1531-1533
```markdown
### DIRECTORY TREE
Lines 18-26
```markdown
```

### DIRECTORY TREE
Lines 1534-1543
```markdown
## DIRECTORY TREE
- actions/
  - glm-review/
    - action.yml
    - index.mjs
- examples/
  - ai-review-caller.yml
- README.md
```
```

### FILE INDEX
Lines 1544-1546
```markdown
### FILE INDEX
Lines 27-34
```markdown
```

### FILE INDEX
Lines 1547-1555
```markdown
## FILE INDEX
| Path | Role | Lines | Chars | Mode |
|---|---|---:|---:|---|
| `README.md` | project overview and setup | 139 | 4171 | full |
| `actions/glm-review/index.mjs` | entrypoint | 696 | 22166 | full |
| `actions/glm-review/action.yml` | configuration | 76 | 2452 | full |
| `examples/ai-review-caller.yml` | configuration | 37 | 826 | full |
```
```

### SKIPPED ITEMS
Lines 1556-1558
```markdown
### SKIPPED ITEMS
Lines 35-39
```markdown
```

### SKIPPED ITEMS
Lines 1559-1564
```markdown
## SKIPPED ITEMS
- `.DS_Store` — hidden
- `.git/` — skipped directory
- `.github/` — skipped directory
```
```

### FILE CONTENT
Lines 1565-1567
```markdown
### FILE CONTENT
Lines 40-41
```markdown
```

### FILE CONTENT
Lines 1568-1570
```markdown
## FILE CONTENT
```
```

### FILE: README.md
Lines 1571-1573
```markdown
### FILE: README.md
Lines 42-48
```markdown
```

### FILE: README.md
Lines 1574-1581
```markdown
## FILE: README.md
- Role: project overview and setup
- Mode: full
- Language: markdown
- Lines: 139
- Characters: 4171
```
```

### Full Content
Lines 1582-1584
```markdown
### Full Content
Lines 49-50
```markdown
```

### Full Content
Lines 1585-1588
```markdown
### Full Content
```markdown
```
```

### gh-reusable-workflows
Lines 1589-1591
```markdown
### gh-reusable-workflows
Lines 51-55
```markdown
```

### gh-reusable-workflows
Lines 1592-1597
```markdown
# gh-reusable-workflows

Reusable GitHub Actions workflows for repositories under your account.  
This repo currently provides a production-oriented AI code review workflow named `ai-code-review`.
```
```

### What this provides
Lines 1598-1600
```markdown
### What this provides
Lines 56-64
```markdown
```

### What this provides
Lines 1601-1610
```markdown
## What this provides

- Reusable workflow: `.github/workflows/ai-code-review.yml`
- Local composite action: `actions/glm-review/action.yml`
- Local Node implementation: `actions/glm-review/index.mjs`
- Sticky pull request summary comment (single updatable comment)
- Deterministic local verdict policy: `pass`, `warn`, `fail`
- Blocking decision made locally (never delegated to model)
```
```

### Reusable workflow path
Lines 1611-1613
```markdown
### Reusable workflow path
Lines 65-72
```markdown
```

### Reusable workflow path
Lines 1614-1622
```markdown
## Reusable workflow path

Use this workflow from caller repositories:

- `marcopared/gh-reusable-workflows/.github/workflows/ai-code-review.yml@v1`

Use a version tag (or commit SHA) in callers for stable rollout.
```
```

### Required secrets
Lines 1623-1625
```markdown
### Required secrets
Lines 73-82
```markdown
```

### Required secrets
Lines 1626-1636
```markdown
## Required secrets

Caller repositories must provide:

- `ZHIPU_API_KEY`: API key for the GLM-compatible endpoint.

The caller maps this secret into the reusable workflow as:

- `zhipu_api_key: ${{ secrets.ZHIPU_API_KEY }}`
```
```

### Required permissions
Lines 1637-1639
```markdown
### Required permissions
Lines 83-91
```markdown
```

### Required permissions
Lines 1640-1649
```markdown
## Required permissions

Caller workflow/job should grant:

- `contents: read` (read repo content and diff context)
- `pull-requests: write` (create/update sticky PR summary comment)

Without `pull-requests: write`, review still runs and step summary still appears, but PR comment update may be skipped with a warning.
```
```

### Supported inputs
Lines 1650-1652
```markdown
### Supported inputs
Lines 92-109
```markdown
```

### Supported inputs
Lines 1653-1671
```markdown
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
```
```

### Verdict semantics
Lines 1672-1674
```markdown
### Verdict semantics
Lines 110-125
```markdown
```

### Verdict semantics
Lines 1675-1691
```markdown
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
```
```

### Caller workflow example
Lines 1692-1694
```markdown
### Caller workflow example
Lines 126-171
```markdown
```

### Caller workflow example
Lines 1695-1741
```markdown
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
```
```

### Setup steps (caller repositories)
Lines 1742-1744
```markdown
### Setup steps (caller repositories)
Lines 172-181
```markdown
```

### Setup steps (caller repositories)
Lines 1745-1755
```markdown
## Setup steps (caller repositories)

1. Add repository secret `ZHIPU_API_KEY`.
2. Add the caller workflow (example above) and commit it.
3. Open a PR to verify:
   - workflow check runs
   - step summary is generated
   - sticky PR comment is created/updated once per PR
4. In GitHub branch protection rules, add this workflow check (`ai-code-review / ai-code-review`) as a required status check.
```
```

### Notes on behavior
Lines 1756-1758
```markdown
### Notes on behavior
Lines 182-192
```markdown
```

### Notes on behavior
Lines 1759-1770
```markdown
## Notes on behavior

- Supports `pull_request` and `push` events.
- Review payload is bounded by changed files and patch size caps.
- Push mode computes changed files from git diff between `before` and `after`.
- PR mode fetches changed files via GitHub API and includes limited head content.
- v1 intentionally does not post inline diff comments.
- `pull_request_target` is intentionally not used.

```
```
```

### FILE: actions/glm-review/index.mjs
Lines 1771-1773
```markdown
### FILE: actions/glm-review/index.mjs
Lines 193-199
```markdown
```

### FILE: actions/glm-review/index.mjs
Lines 1774-1781
```markdown
## FILE: actions/glm-review/index.mjs
- Role: entrypoint
- Mode: full
- Language: js
- Lines: 696
- Characters: 22166
```
```

### Full Content
Lines 1782-1784
```markdown
### Full Content
Lines 200-900
```markdown
```

### Full Content
Lines 1785-2365
```markdown
### Full Content
```js
import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";

const STICKY_MARKER = "<!-- ai-code-review:glm-review -->";

const ALLOWED_CATEGORIES = new Set([
  "correctness",
  "security",
  "reliability",
  "performance",
  "maintainability",
  "testing",
]);
const ALLOWED_SEVERITY = ["low", "medium", "high", "critical"];
const ALLOWED_CONFIDENCE = ["low", "medium", "high"];
const BLOCKABLE_CATEGORIES = new Set(["correctness", "security"]);

const GITHUB_API_BASE = "https://api.github.com";
const MAX_FILE_CONTENT_CHARS = 4000;
const MAX_FINDINGS_RENDER = 60;

function getInput(name, fallback = "") {
  const value = process.env[`INPUT_${name.toUpperCase()}`];
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  return value;
}

function parseBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "y", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "n", "off"].includes(normalized)) return false;
  return fallback;
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function clampEnum(value, allowedList, fallback) {
  const normalized = String(value ?? "").trim().toLowerCase();
  return allowedList.includes(normalized) ? normalized : fallback;
}

function writeOutput(name, value) {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (!outputPath) return;
  appendFileSync(outputPath, `${name}=${String(value)}\n`, "utf8");
}

function writeStepSummary(markdown) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) return;
  appendFileSync(summaryPath, `${markdown}\n`, "utf8");
}

function writeFailureSummary(reason) {
  const message = String(reason ?? "Unknown error");
  writeStepSummary([
    "## ❌ AI Code Review: Runtime Error",
    "",
    `The review job failed before producing a verdict.`,
    "",
    `- Error: \`${escapeMarkdown(message)}\``,
    "",
    "This usually indicates malformed model output, API failure, missing permissions, or invalid workflow inputs.",
  ].join("\n"));
}

function readJsonFile(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function runGit(args, options = {}) {
  try {
    return execFileSync("git", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 16 * 1024 * 1024,
      ...options,
    });
  } catch (error) {
    const stderr = error?.stderr ? String(error.stderr) : "";
    const message = `git ${args.join(" ")} failed${stderr ? `: ${stderr.trim()}` : ""}`;
    throw new Error(message);
  }
}

async function readHeadContent(path) {
  if (!path || !existsSync(path)) return "";
  try {
    const content = await readFile(path, "utf8");
    if (content.length <= MAX_FILE_CONTENT_CHARS) return content;
    return `${content.slice(0, MAX_FILE_CONTENT_CHARS)}\n...[truncated content]`;
  } catch {
    return "";
  }
}

async function ghRequest({ token, method = "GET", path, body }) {
  const response = await fetch(`${GITHUB_API_BASE}${path}`, {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "ai-code-review",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API ${method} ${path} failed (${response.status}): ${text.slice(0, 400)}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

async function getPullRequestChangedFiles({ token, owner, repo, prNumber }) {
  const files = [];
  let page = 1;

  while (true) {
    const pageItems = await ghRequest({
      token,
      path: `/repos/${owner}/${repo}/pulls/${prNumber}/files?per_page=100&page=${page}`,
    });

    if (!Array.isArray(pageItems) || pageItems.length === 0) break;
    files.push(...pageItems);
    if (pageItems.length < 100) break;
    page += 1;
  }

  const mapped = [];
  for (const file of files) {
    const status = file.status || "modified";
    const path = file.filename;
    const patch = typeof file.patch === "string" ? file.patch : "";
    const binary = typeof file.patch !== "string";
    const removed = status === "removed";
    const content = removed || binary ? "" : await readHeadContent(path);

    mapped.push({
      path,
      status,
      previous_path: file.previous_filename || "",
      patch,
      binary,
      content,
    });
  }

  return mapped;
}

function parseNameStatusLines(output) {
  const lines = output.split("\n").map((line) => line.trim()).filter(Boolean);
  const files = [];
  for (const line of lines) {
    const parts = line.split("\t");
    if (parts.length < 2) continue;
    const statusRaw = parts[0];
    if (statusRaw.startsWith("R") || statusRaw.startsWith("C")) {
      if (parts.length < 3) continue;
      files.push({
        status: "renamed",
        previous_path: parts[1],
        path: parts[2],
      });
    } else {
      const statusMap = {
        A: "added",
        M: "modified",
        D: "removed",
        T: "modified",
      };
      files.push({
        status: statusMap[statusRaw] || "modified",
        previous_path: "",
        path: parts[1],
      });
    }
  }
  return files;
}

async function getPushChangedFiles({ before, after }) {
  const isInitialPush = !before || /^0+$/.test(before);

  let nameStatusOutput = "";
  if (isInitialPush) {
    nameStatusOutput = runGit(["diff-tree", "--no-commit-id", "--name-status", "-r", after]);
  } else {
    nameStatusOutput = runGit(["diff", "--name-status", "--find-renames", before, after]);
  }

  const files = parseNameStatusLines(nameStatusOutput);
  const result = [];

  for (const file of files) {
    let patch = "";
    if (isInitialPush) {
      patch = runGit(["show", "--format=", "--unified=3", after, "--", file.path]);
    } else {
      patch = runGit(["diff", "--unified=3", before, after, "--", file.path]);
    }
    const binary = patch.includes("Binary files") || patch.includes("GIT binary patch");
    const removed = file.status === "removed";
    const content = removed || binary ? "" : await readHeadContent(file.path);
    result.push({
      ...file,
      patch,
      binary,
      content,
    });
  }

  return result;
}

function buildBoundedFiles(changedFiles, maxFiles, maxPatchChars) {
  const sorted = [...changedFiles].sort((a, b) => a.path.localeCompare(b.path));
  const selected = [];
  let totalPatchChars = 0;

  for (const file of sorted) {
    if (selected.length >= maxFiles) break;
    const safePatch = typeof file.patch === "string" ? file.patch : "";
    const remaining = Math.max(0, maxPatchChars - totalPatchChars);
    const includePatch = !file.binary && remaining > 0;
    let patch = "";
    let patch_truncated = false;

    if (includePatch) {
      if (safePatch.length <= remaining) {
        patch = safePatch;
        totalPatchChars += safePatch.length;
      } else {
        patch = `${safePatch.slice(0, remaining)}\n...[truncated patch]`;
        totalPatchChars += remaining;
        patch_truncated = true;
      }
    }

    selected.push({
      path: file.path,
      status: file.status,
      previous_path: file.previous_path || "",
      binary: Boolean(file.binary),
      patch,
      patch_truncated,
      content: file.content || "",
    });
  }

  return {
    total_changed_files: changedFiles.length,
    included_files: selected.length,
    files: selected,
    omitted_files: Math.max(0, changedFiles.length - selected.length),
    total_patch_chars_included: totalPatchChars,
  };
}

function toChatContentString(messageContent) {
  if (typeof messageContent === "string") return messageContent;
  if (Array.isArray(messageContent)) {
    return messageContent
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .join("\n")
      .trim();
  }
  return "";
}

function parseModelJson(raw) {
  const text = String(raw ?? "").trim();
  if (!text) throw new Error("Model returned empty content.");
  if (text.startsWith("```")) {
    throw new Error("Model output must be raw JSON without markdown code fences.");
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Model output is not valid JSON: ${error.message}`);
  }
}

function normalizeFinding(item) {
  if (!item || typeof item !== "object") return null;

  const path = String(item.path ?? "").trim();
  const title = String(item.title ?? "").trim();
  const body = String(item.body ?? "").trim();
  if (!path || !title || !body) return null;

  const lineRaw = Number.parseInt(String(item.line ?? "1"), 10);
  const line = Number.isFinite(lineRaw) && lineRaw > 0 ? lineRaw : 1;

  const severity = clampEnum(item.severity, ALLOWED_SEVERITY, "low");
  const confidence = clampEnum(item.confidence, ALLOWED_CONFIDENCE, "low");
  const category = clampEnum(item.category, [...ALLOWED_CATEGORIES], "maintainability");
  const suggestion = String(item.suggestion ?? "").trim();

  return { path, line, severity, confidence, category, title, body, suggestion };
}

function dedupeFindings(findings) {
  const seen = new Set();
  const unique = [];
  for (const finding of findings) {
    const key = [
      finding.path.toLowerCase(),
      finding.line,
      finding.category,
      finding.title.toLowerCase(),
      finding.body.toLowerCase().slice(0, 180),
    ].join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(finding);
  }
  return unique;
}

function rank(value, orderedValues) {
  return orderedValues.indexOf(value);
}

function isBlocking(finding, minSeverity, minConfidence) {
  if (!BLOCKABLE_CATEGORIES.has(finding.category)) return false;
  return (
    rank(finding.severity, ALLOWED_SEVERITY) >= rank(minSeverity, ALLOWED_SEVERITY) &&
    rank(finding.confidence, ALLOWED_CONFIDENCE) >= rank(minConfidence, ALLOWED_CONFIDENCE)
  );
}

function escapeMarkdown(text) {
  return String(text ?? "")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function groupFindings(findings) {
  const groups = new Map();
  for (const finding of findings) {
    if (!groups.has(finding.category)) groups.set(finding.category, []);
    groups.get(finding.category).push(finding);
  }
  for (const list of groups.values()) {
    list.sort((a, b) => {
      const sev = rank(b.severity, ALLOWED_SEVERITY) - rank(a.severity, ALLOWED_SEVERITY);
      if (sev !== 0) return sev;
      const conf = rank(b.confidence, ALLOWED_CONFIDENCE) - rank(a.confidence, ALLOWED_CONFIDENCE);
      if (conf !== 0) return conf;
      return `${a.path}:${a.line}`.localeCompare(`${b.path}:${b.line}`);
    });
  }
  return groups;
}

function buildReviewMarkdown({
  verdict,
  summary,
  findings,
  blockingCount,
  totalChangedFiles,
  includedFiles,
  omittedFiles,
  minBlockSeverity,
  minBlockConfidence,
  forPrComment,
}) {
  const verdictLabel = verdict === "fail" ? "FAIL" : verdict === "warn" ? "WARN" : "PASS";
  const verdictEmoji = verdict === "fail" ? "❌" : verdict === "warn" ? "⚠️" : "✅";
  const grouped = groupFindings(findings.slice(0, MAX_FINDINGS_RENDER));
  const lines = [];

  if (forPrComment) lines.push(STICKY_MARKER);
  lines.push(`## ${verdictEmoji} AI Code Review: ${verdictLabel}`);
  lines.push("");
  lines.push(`**Assessment:** ${escapeMarkdown(summary || "No additional concerns.")}`);
  lines.push("");
  lines.push(`- Verdict: \`${verdict}\``);
  lines.push(`- Findings: \`${findings.length}\``);
  lines.push(`- Blocking findings: \`${blockingCount}\``);
  lines.push(`- Reviewed files: \`${includedFiles}/${totalChangedFiles}\`${omittedFiles > 0 ? ` (omitted ${omittedFiles})` : ""}`);
  lines.push(`- Blocking threshold: category in \`correctness|security\`, severity >= \`${minBlockSeverity}\`, confidence >= \`${minBlockConfidence}\``);
  lines.push("");

  if (findings.length === 0) {
    lines.push("No findings were identified in the bounded changed-code set.");
  } else {
    lines.push("### Findings");
    lines.push("");
    const orderedCategories = [
      "security",
      "correctness",
      "reliability",
      "performance",
      "maintainability",
      "testing",
    ];
    for (const category of orderedCategories) {
      const list = grouped.get(category) || [];
      if (list.length === 0) continue;
      lines.push(`**${category}** (${list.length})`);
      for (const finding of list) {
        const scope = `\`${escapeMarkdown(finding.path)}:${finding.line}\``;
        const level = `${finding.severity}/${finding.confidence}`;
        const blockingTag = finding.blocking ? " **[blocking]**" : "";
        lines.push(`- [${level}] ${scope} - **${escapeMarkdown(finding.title)}**${blockingTag}`);
        lines.push(`  - ${escapeMarkdown(finding.body)}`);
        if (finding.suggestion) {
          lines.push(`  - Suggested fix: ${escapeMarkdown(finding.suggestion)}`);
        }
      }
      lines.push("");
    }
    if (findings.length > MAX_FINDINGS_RENDER) {
      lines.push(`_Only the first ${MAX_FINDINGS_RENDER} findings are shown._`);
    }
  }

  return lines.join("\n");
}

async function upsertStickyPrComment({ token, owner, repo, prNumber, body }) {
  let comments = [];
  let page = 1;
  while (true) {
    const pageItems = await ghRequest({
      token,
      path: `/repos/${owner}/${repo}/issues/${prNumber}/comments?per_page=100&page=${page}`,
    });
    if (!Array.isArray(pageItems) || pageItems.length === 0) break;
    comments = comments.concat(pageItems);
    if (pageItems.length < 100) break;
    page += 1;
  }

  const existing = comments.find(
    (comment) =>
      comment?.user?.type === "Bot" &&
      typeof comment?.body === "string" &&
      comment.body.includes(STICKY_MARKER),
  );
  if (existing) {
    await ghRequest({
      token,
      method: "PATCH",
      path: `/repos/${owner}/${repo}/issues/comments/${existing.id}`,
      body: { body },
    });
    return "updated";
  }

  await ghRequest({
    token,
    method: "POST",
    path: `/repos/${owner}/${repo}/issues/${prNumber}/comments`,
    body: { body },
  });
  return "created";
}

async function runModelReview({
  apiBase,
  apiKey,
  model,
  repo,
  eventType,
  boundedFiles,
  extraReviewInstructions,
}) {
  const systemPrompt = [
    "You are a senior code reviewer for CI.",
    "Review ONLY changed code provided in input.",
    "Prioritize correctness, security, reliability, performance, maintainability, and materially important testing gaps.",
    "Avoid style-only nits, avoid speculation, and prefer fewer high-confidence findings.",
    "Use only evidence from provided data.",
    "Return JSON only with the required schema.",
  ].join(" ");

  const requiredSchema = {
    summary: "short overall assessment",
    findings: [
      {
        path: "relative/file/path",
        line: 123,
        severity: "low|medium|high|critical",
        confidence: "low|medium|high",
        category: "correctness|security|reliability|performance|maintainability|testing",
        title: "short specific title",
        body: "grounded explanation",
        suggestion: "specific fix",
      },
    ],
  };

  const userPayload = {
    repo,
    event_type: eventType,
    changed_files: boundedFiles.files,
    limits: {
      total_changed_files: boundedFiles.total_changed_files,
      included_files: boundedFiles.included_files,
      omitted_files: boundedFiles.omitted_files,
      total_patch_chars_included: boundedFiles.total_patch_chars_included,
    },
    extra_review_instructions: extraReviewInstructions || "",
    required_output_schema: requiredSchema,
  };

  const response = await fetch(`${apiBase.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Return ONLY valid JSON matching required_output_schema. Input:\n${JSON.stringify(userPayload)}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Model API call failed (${response.status}): ${text.slice(0, 500)}`);
  }

  const data = await response.json();
  const content = toChatContentString(data?.choices?.[0]?.message?.content);
  const parsed = parseModelJson(content);

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Model output JSON root must be an object.");
  }
  if (typeof parsed.summary !== "string") {
    throw new Error("Model output JSON must include string field: summary.");
  }
  if (!Array.isArray(parsed.findings)) {
    throw new Error("Model output JSON must include array field: findings.");
  }

  return parsed;
}

async function main() {
  const githubToken = getInput("github_token");
  const zhipuApiKey = getInput("zhipu_api_key");
  const model = getInput("model", "glm-5");
  const apiBase = getInput("api_base", "https://api.z.ai/api/paas/v4");
  const maxFiles = parsePositiveInt(getInput("max_files", "25"), 25);
  const maxPatchChars = parsePositiveInt(getInput("max_patch_chars", "120000"), 120000);
  const postPrComment = parseBoolean(getInput("post_pr_comment", "true"), true);
  const failOnBlocking = parseBoolean(getInput("fail_on_blocking", "true"), true);
  const minBlockSeverity = clampEnum(getInput("min_block_severity", "high"), ALLOWED_SEVERITY, "high");
  const minBlockConfidence = clampEnum(getInput("min_block_confidenc
... [chunk truncated]
```

### FILE: actions/glm-review/action.yml
Lines 2366-2368
```markdown
### FILE: actions/glm-review/action.yml
Lines 901-907
```markdown
```

### FILE: actions/glm-review/action.yml
Lines 2369-2376
```markdown
## FILE: actions/glm-review/action.yml
- Role: configuration
- Mode: full
- Language: yaml
- Lines: 76
- Characters: 2452
```
```

### Full Content
Lines 2377-2379
```markdown
### Full Content
Lines 908-988
```markdown
```

### Full Content
Lines 2380-2461
```markdown
### Full Content
```yaml
name: glm-review
description: Bounded AI code review for pull requests and pushes.

inputs:
  github_token:
    description: GitHub token for API requests and PR comments.
    required: true
  zhipu_api_key:
    description: API key for GLM-compatible chat-completions API.
    required: true
  model:
    description: GLM model name.
    required: false
    default: glm-5
  api_base:
    description: GLM-compatible API base URL.
    required: false
    default: https://api.z.ai/api/paas/v4
  max_files:
    description: Maximum number of changed files to include.
    required: false
    default: "25"
  max_patch_chars:
    description: Maximum total patch characters to include.
    required: false
    default: "120000"
  post_pr_comment:
    description: Whether to post or update sticky PR comment.
    required: false
    default: "true"
  fail_on_blocking:
    description: Whether caller intends to fail on blocking findings.
    required: false
    default: "true"
  min_block_severity:
    description: Minimum severity threshold for blocking.
    required: false
    default: high
  min_block_confidence:
    description: Minimum confidence threshold for blocking.
    required: false
    default: high
  extra_review_instructions:
    description: Extra caller-provided instructions.
    required: false
    default: ""

outputs:
  verdict:
    description: pass, warn, or fail.
    value: ${{ steps.run.outputs.verdict }}
  blocking_count:
    description: Number of blocking findings.
    value: ${{ steps.run.outputs.blocking_count }}
  findings_count:
    description: Number of normalized findings.
    value: ${{ steps.run.outputs.findings_count }}

runs:
  using: composite
  steps:
    - id: run
      shell: bash
      env:
        INPUT_GITHUB_TOKEN: ${{ inputs.github_token }}
        INPUT_ZHIPU_API_KEY: ${{ inputs.zhipu_api_key }}
        INPUT_MODEL: ${{ inputs.model }}
        INPUT_API_BASE: ${{ inputs.api_base }}
        INPUT_MAX_FILES: ${{ inputs.max_files }}
        INPUT_MAX_PATCH_CHARS: ${{ inputs.max_patch_chars }}
        INPUT_POST_PR_COMMENT: ${{ inputs.post_pr_comment }}
        INPUT_FAIL_ON_BLOCKING: ${{ inputs.fail_on_blocking }}
        INPUT_MIN_BLOCK_SEVERITY: ${{ inputs.min_block_severity }}
        INPUT_MIN_BLOCK_CONFIDENCE: ${{ inputs.min_block_confidence }}
        INPUT_EXTRA_REVIEW_INSTRUCTIONS: ${{ inputs.extra_review_instructions }}
      run: node "${GITHUB_ACTION_PATH}/index.mjs"

```
```
```

### FILE: examples/ai-review-caller.yml
Lines 2462-2464
```markdown
### FILE: examples/ai-review-caller.yml
Lines 989-995
```markdown
```

### FILE: examples/ai-review-caller.yml
Lines 2465-2472
```markdown
## FILE: examples/ai-review-caller.yml
- Role: configuration
- Mode: full
- Language: yaml
- Lines: 37
- Characters: 826
```
```

### Full Content
Lines 2473-2475
```markdown
### Full Content
Lines 996-1037
```markdown
```

### Full Content
Lines 2476-2518
```markdown
### Full Content
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
```
```

### HOW TO USE THIS PACK WITH AN LLM
Lines 2519-2521
```markdown
### HOW TO USE THIS PACK WITH AN LLM
Lines 1038-1039
```markdown
```

### HOW TO USE THIS PACK WITH AN LLM
Lines 2522-2525
```markdown
## HOW TO USE THIS PACK WITH AN LLM
Ask the LLM to start from the manifest, reading guide, and file index, then inspect only the relevant files or chunk sections.
```
```

### HOW TO USE THIS PACK WITH AN LLM
Lines 2526-2527
```markdown
## HOW TO USE THIS PACK WITH AN LLM
Ask the LLM to start from the manifest, reading guide, and file index, then inspect only the relevant files or chunk sections.
```

## HOW TO USE THIS PACK WITH AN LLM
Ask the LLM to start from the manifest, reading guide, and file index, then inspect only the relevant files or chunk sections.
