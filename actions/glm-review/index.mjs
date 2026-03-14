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
