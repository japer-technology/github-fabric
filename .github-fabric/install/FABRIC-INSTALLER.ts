/**
 * FABRIC-INSTALLER.ts — Setup script for GitHub Fabric.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * PURPOSE
 * ─────────────────────────────────────────────────────────────────────────────
 * Copies the GitHub Actions workflow and issue templates from the
 * `.github-fabric/install/` directory into the correct
 * locations under `.github/` so that the agent is ready to run.
 *
 * Run once after adding the `.github-fabric/` folder to a repo:
 *
 *   bun .github-fabric/install/FABRIC-INSTALLER.ts
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHAT IT DOES
 * ─────────────────────────────────────────────────────────────────────────────
 *   1. Creates `.github/workflows/` and `.github/ISSUE_TEMPLATE/` if missing.
 *   2. Copies the agent workflow template into `.github/workflows/`.
 *   3. Copies the hatch and chat issue templates into `.github/ISSUE_TEMPLATE/`.
 *   4. Initialises the `AGENTS.md` identity file if one does not exist.
 *   5. Initialises `.pi/settings.json` with default provider config if not customised.
 *   6. Installs runtime dependencies via `bun install`.
 */

import { existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync } from "fs";
import { resolve, basename } from "path";

// ─── Paths ────────────────────────────────────────────────────────────────────
// `import.meta.dir` resolves to `.github-fabric/install/`.
const installDir = import.meta.dir;
const fabricDir = resolve(installDir, "..");
const repoRoot = resolve(fabricDir, "..");

const workflowsDir = resolve(repoRoot, ".github", "workflows");
const issueTemplateDir = resolve(repoRoot, ".github", "ISSUE_TEMPLATE");

// Source templates inside install/
const workflowSrc = resolve(installDir, "github-fabric-agent.yml");
const hatchSrc = resolve(installDir, "github-fabric-hatch.md");
const chatSrc = resolve(installDir, "github-fabric-chat.md");
const agentsSrc = resolve(installDir, "FABRIC-AGENTS.md");
const settingsSrc = resolve(installDir, "settings.json");

// Destination paths
const workflowDest = resolve(workflowsDir, "github-fabric-agent.yml");
const hatchDest = resolve(issueTemplateDir, "github-fabric-hatch.md");
const chatDest = resolve(issueTemplateDir, "github-fabric-chat.md");
const agentsDest = resolve(fabricDir, "AGENTS.md");
const settingsDest = resolve(fabricDir, ".pi", "settings.json");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    console.log(`  created ${dir.replace(repoRoot + "/", "")}/`);
  }
}

function copyTemplate(src: string, dest: string, overwrite = false): void {
  const relSrc = src.replace(repoRoot + "/", "");
  const relDest = dest.replace(repoRoot + "/", "");
  if (existsSync(dest) && !overwrite) {
    console.log(`  skip    ${relDest} (already exists)`);
    return;
  }
  copyFileSync(src, dest);
  console.log(`  copy    ${relSrc} → ${relDest}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log("\n🧠 GitHub Fabric Installer\n");

// 1. Create target directories
ensureDir(workflowsDir);
ensureDir(issueTemplateDir);

// 2. Copy workflow template
copyTemplate(workflowSrc, workflowDest);

// 3. Copy issue templates
copyTemplate(hatchSrc, hatchDest);
copyTemplate(chatSrc, chatDest);

// 4. Initialise AGENTS.md if it does not already contain an identity
if (existsSync(agentsDest)) {
  const existing = readFileSync(agentsDest, "utf-8");
  if (existing.includes("## Identity")) {
    console.log(`  skip    AGENTS.md (identity already configured)`);
  } else {
    console.log(`  keep    AGENTS.md (exists but no identity yet — use 🥚 Hatch to create one)`);
  }
} else {
  copyTemplate(agentsSrc, agentsDest);
}

// 5. Initialise .pi/settings.json with defaults if not already customised
copyTemplate(settingsSrc, settingsDest);

// 6. Install runtime dependencies
console.log("\n  Installing dependencies...\n");
const install = Bun.spawnSync(["bun", "install"], {
  cwd: fabricDir,
  stdout: "inherit",
  stderr: "inherit",
});
if (install.exitCode !== 0) {
  console.error("\n❌ bun install failed. Check the output above.\n");
  process.exit(1);
}

console.log("\n✅ GitHub Fabric is installed.\n");
console.log("Next steps:");
console.log("  1. Add your LLM API key as a GitHub repository secret");
console.log("     (e.g. OPENAI_API_KEY — see README.md for all providers)");
console.log("  2. Commit and push:");
console.log("       git add -A && git commit -m 'Add fabric' && git push");
console.log("  3. Open an issue in your repo to start chatting with the agent\n");
