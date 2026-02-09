import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { PLAYBOOK } from "../data/playbook.js";
import {
  runGitCommand,
  branchExists,
  getCommitCount,
  getCommitList,
} from "../utils/git.js";
import type { MergeInfo, ValidationCheck, ValidationCommand } from "../types.js";

// Get directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read instructions from markdown files (split for better context management)
const INSTRUCTIONS_CORE_PATH = join(__dirname, "../data/instructions-core.md");
const INSTRUCTIONS_DETAILED_PATH = join(__dirname, "../data/instructions-detailed.md");
const INSTRUCTIONS_PATTERNS_PATH = join(__dirname, "../data/instructions-patterns.md");

const MERGE_FORWARD_INSTRUCTIONS_CORE = readFileSync(INSTRUCTIONS_CORE_PATH, "utf-8");
const MERGE_FORWARD_INSTRUCTIONS_DETAILED = readFileSync(INSTRUCTIONS_DETAILED_PATH, "utf-8");
const MERGE_FORWARD_INSTRUCTIONS_PATTERNS = readFileSync(INSTRUCTIONS_PATTERNS_PATH, "utf-8");

type PackageManager = "pnpm" | "yarn" | "npm";

/**
 * Detect the package manager based on lock files in the project directory.
 * Returns pnpm, yarn, or npm (default) based on which lock file is present.
 */
function detectPackageManager(projectPath: string): PackageManager {
  if (existsSync(join(projectPath, "pnpm-lock.yaml"))) {
    return "pnpm";
  }
  if (existsSync(join(projectPath, "yarn.lock"))) {
    return "yarn";
  }
  return "npm";
}

/**
 * Run package install with auto-detected package manager.
 * For npm, falls back to --legacy-peer-deps if peer dependency errors occur.
 */
function runPackageInstall(cwd: string): PackageManager {
  const pm = detectPackageManager(cwd);

  if (pm === "pnpm") {
    execSync("pnpm install", {
      cwd,
      encoding: "utf-8",
      timeout: 300000,
      stdio: "pipe",
    });
    return pm;
  }

  if (pm === "yarn") {
    execSync("yarn install", {
      cwd,
      encoding: "utf-8",
      timeout: 300000,
      stdio: "pipe",
    });
    return pm;
  }

  // npm: try without --legacy-peer-deps first, fallback if needed
  try {
    execSync("npm install", {
      cwd,
      encoding: "utf-8",
      timeout: 300000,
      stdio: "pipe",
    });
  } catch (e) {
    const error = e as { stderr?: string; message?: string };
    const errorOutput = error.stderr || error.message || "";

    if (errorOutput.includes("ERESOLVE") || errorOutput.includes("peer dep") || errorOutput.includes("Could not resolve dependency")) {
      execSync("npm install --legacy-peer-deps", {
        cwd,
        encoding: "utf-8",
        timeout: 300000,
        stdio: "pipe",
      });
    } else {
      throw e;
    }
  }
  return pm;
}

/**
 * Tool execution handlers
 *
 * Each function handles the execution of a specific MCP tool.
 * All functions return MCP-compatible content blocks.
 */

export function handleGetInstructions() {
  return {
    content: [
      {
        type: "text" as const,
        text: MERGE_FORWARD_INSTRUCTIONS_CORE,
      },
    ],
  };
}

export function handleGetDetailedProcedures() {
  return {
    content: [
      {
        type: "text" as const,
        text: MERGE_FORWARD_INSTRUCTIONS_DETAILED,
      },
    ],
  };
}

export function handleGetCommonPatterns() {
  return {
    content: [
      {
        type: "text" as const,
        text: MERGE_FORWARD_INSTRUCTIONS_PATTERNS,
      },
    ],
  };
}

export function handleGetPlaybook() {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(PLAYBOOK, null, 2),
      },
    ],
  };
}

export function handlePlanMergeForward(args: {
  from_branch: string;
  to_branches: string[];
}) {
  const { from_branch, to_branches } = args;

  // Validate branches exist
  if (!branchExists(from_branch)) {
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            success: false,
            error: `Source branch '${from_branch}' does not exist`,
          }),
        },
      ],
    };
  }

  const invalidBranches = to_branches.filter((b) => !branchExists(b));
  if (invalidBranches.length > 0) {
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            success: false,
            error: `Target branches do not exist: ${invalidBranches.join(", ")}`,
          }),
        },
      ],
    };
  }

  // Get current branch for restoration
  const currentBranch = runGitCommand("git branch --show-current");

  // Build plan
  const plan = {
    success: true,
    source_branch: from_branch,
    target_branches: to_branches,
    current_branch: currentBranch,
    merges: [] as MergeInfo[],
  };

  // For each target, calculate what will be merged
  let sourceBranch = from_branch;
  for (const targetBranch of to_branches) {
    const commitCount = getCommitCount(sourceBranch, targetBranch);
    const commits = getCommitList(sourceBranch, targetBranch);

    plan.merges.push({
      into_branch: targetBranch,
      from_branch: sourceBranch,
      commit_count: commitCount,
      commits: commits,
    });

    // Next merge will be from this branch
    sourceBranch = targetBranch;
  }

  return {
    content: [{ type: "text" as const, text: JSON.stringify(plan, null, 2) }],
  };
}

export function handleGatherMergeContext(args: {
  into_branch: string;
  merge_branch: string;
  include_details?: boolean;
  max_commits?: number;
  max_files?: number;
}) {
  const {
    into_branch,
    merge_branch,
    include_details = false,
    max_commits = 10,
    max_files = 20
  } = args;

  // Validate branches
  if (!branchExists(into_branch) || !branchExists(merge_branch)) {
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            success: false,
            error: "One or both branches do not exist",
          }),
        },
      ],
    };
  }

  // Find merge base
  const mergeBase = runGitCommand(`git merge-base ${into_branch} ${merge_branch}`);

  // Get commits in source branch since divergence
  const sourceCommits = getCommitList(merge_branch, mergeBase);

  // Get commits in target branch since divergence
  const targetCommits = getCommitList(into_branch, mergeBase);

  // Get files changed in source branch
  const sourceFiles = runGitCommand(`git diff --name-only ${mergeBase}..${merge_branch}`)
    .split("\n")
    .filter(Boolean);

  // Get files changed in target branch
  const targetFiles = runGitCommand(`git diff --name-only ${mergeBase}..${into_branch}`)
    .split("\n")
    .filter(Boolean);

  // Find potential conflicts (files modified in both) - ALWAYS include these
  const potentialConflicts = sourceFiles.filter((f) => targetFiles.includes(f));

  // Get current branch
  const currentBranch = runGitCommand("git branch --show-current");

  // Build summary (always included)
  const summary = {
    source_commit_count: sourceCommits.length,
    target_commit_count: targetCommits.length,
    source_files_count: sourceFiles.length,
    target_files_count: targetFiles.length,
    conflict_count: potentialConflicts.length,
  };

  // Base result with summary and conflicts (approach #2 and #3)
  const result: any = {
    success: true,
    into_branch,
    merge_branch,
    current_branch: currentBranch,
    merge_base: mergeBase.substring(0, 8),
    summary,
    // Always include potential conflicts (approach #3 - prioritize what matters)
    potential_conflicts: potentialConflicts,
  };

  // Only include detailed lists if requested (approach #2 - summary first)
  if (include_details) {
    // Show recent commits only (approach #3 - prioritize recent)
    result.recent_source_commits = sourceCommits.slice(0, max_commits);
    result.recent_target_commits = targetCommits.slice(0, max_commits);

    // For files, separate conflicts from non-conflicts (approach #3)
    const sourceNonConflicting = sourceFiles
      .filter((f) => !potentialConflicts.includes(f))
      .slice(0, max_files);
    const targetNonConflicting = targetFiles
      .filter((f) => !potentialConflicts.includes(f))
      .slice(0, max_files);

    result.source_files_changed = {
      conflicting: potentialConflicts, // Already have these
      non_conflicting: sourceNonConflicting,
      truncated: sourceFiles.length - potentialConflicts.length > max_files,
    };

    result.target_files_changed = {
      conflicting: potentialConflicts, // Same files
      non_conflicting: targetNonConflicting,
      truncated: targetFiles.length - potentialConflicts.length > max_files,
    };

    // Add truncation warnings
    if (sourceCommits.length > max_commits) {
      result.note = `Showing ${max_commits} of ${sourceCommits.length} source commits and ${max_commits} of ${targetCommits.length} target commits. Use max_commits parameter to see more.`;
    }
  } else {
    // Summary mode - add helpful hint
    result.note = "Summary mode: showing counts and potential conflicts only. Set include_details=true to see commit and file lists.";
  }

  return {
    content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
  };
}

export function handleRunValidation(args: { profile: string }) {
  const { profile } = args;

  if (profile !== "auto") {
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            success: false,
            error: "Only 'auto' profile is supported",
          }),
        },
      ],
    };
  }

  const results = {
    success: true,
    profile: "auto",
    checks: [] as ValidationCheck[],
  };

  // Common build/test commands to try
  const commandsToTry: ValidationCommand[] = [
    { name: "npm test", command: "npm test", file: "package.json" },
    { name: "npm run build", command: "npm run build", file: "package.json" },
    { name: "cargo test", command: "cargo test", file: "Cargo.toml" },
    { name: "cargo build", command: "cargo build", file: "Cargo.toml" },
    { name: "make test", command: "make test", file: "Makefile" },
    { name: "make build", command: "make build", file: "Makefile" },
    { name: "gradle test", command: "./gradlew test", file: "gradlew" },
    { name: "maven test", command: "mvn test", file: "pom.xml" },
    { name: "go test", command: "go test ./...", file: "go.mod" },
  ];

  for (const cmd of commandsToTry) {
    // Check if the indicator file exists
    const indicatorPath = join(process.cwd(), cmd.file);
    if (!existsSync(indicatorPath)) {
      results.checks.push({
        name: cmd.name,
        command: cmd.command,
        status: "skipped",
      });
      continue;
    }

    // Try to run the command
    try {
      const output = execSync(cmd.command, {
        cwd: process.cwd(),
        encoding: "utf-8",
        timeout: 300000, // 5 minute timeout
        stdio: ["pipe", "pipe", "pipe"],
      });

      results.checks.push({
        name: cmd.name,
        command: cmd.command,
        status: "passed",
        output: output.trim().substring(0, 500), // Limit output
      });
    } catch (error: any) {
      results.checks.push({
        name: cmd.name,
        command: cmd.command,
        status: "failed",
        error: error.message.substring(0, 500),
      });
    }
  }

  // Summary
  const passed = results.checks.filter((c) => c.status === "passed").length;
  const failed = results.checks.filter((c) => c.status === "failed").length;
  const skipped = results.checks.filter((c) => c.status === "skipped").length;

  const finalResult = {
    ...results,
    summary: {
      total: results.checks.length,
      passed,
      failed,
      skipped,
      overall_status: failed > 0 ? "failed" : passed > 0 ? "passed" : "skipped",
    },
  };

  return {
    content: [{ type: "text" as const, text: JSON.stringify(finalResult, null, 2) }],
  };
}

interface Project {
  name: string;
  type: "npm" | "dotnet-core" | "dotnet-framework" | "mixed";
  path: string;
}

interface BuildResult {
  name: string;
  type: string;
  status: "passed" | "failed";
  command: string;
  output?: string;
  error?: string;
  duration_ms?: number;
}

export function handleBuildAffectedProjects(args: { projects: Project[] }) {
  const { projects } = args;

  if (!projects || projects.length === 0) {
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            success: false,
            error: "No projects specified. You must provide a list of affected projects to build.",
          }),
        },
      ],
    };
  }

  const results: BuildResult[] = [];
  const cwd = process.cwd();

  for (const project of projects) {
    const startTime = Date.now();
    let buildResult: BuildResult = {
      name: project.name,
      type: project.type,
      status: "failed",
      command: "",
    };

    try {
      switch (project.type) {
        case "npm": {
          // Build npm/pnpm/yarn project (auto-detected)
          const projectPath = join(cwd, project.path);
          let pm: PackageManager = "npm";

          // Run install first if package.json exists
          if (existsSync(join(projectPath, "package.json"))) {
            try {
              pm = runPackageInstall(projectPath);
            } catch (e) {
              // Continue even if install has warnings
              pm = detectPackageManager(projectPath);
            }
          }

          // Run build with detected package manager
          buildResult.command = `${pm} run build`;
          const output = execSync(buildResult.command, {
            cwd: projectPath,
            encoding: "utf-8",
            timeout: 600000, // 10 minute timeout for builds
            stdio: "pipe",
          });

          buildResult.status = "passed";
          buildResult.output = output.trim().substring(0, 1000);
          break;
        }

        case "dotnet-core": {
          // Build .NET Core/.NET 5+ project
          const projectFile = project.path.endsWith(".csproj") ? project.path : join(project.path, `${project.name}.csproj`);
          const fullPath = join(cwd, projectFile);

          if (!existsSync(fullPath)) {
            buildResult.error = `Project file not found: ${fullPath}`;
            break;
          }

          buildResult.command = `dotnet build "${fullPath}"`;
          const output = execSync(buildResult.command, {
            cwd: cwd,
            encoding: "utf-8",
            timeout: 600000,
            stdio: "pipe",
          });

          buildResult.status = "passed";
          buildResult.output = output.trim().substring(0, 1000);
          break;
        }

        case "dotnet-framework": {
          // Build .NET Framework project with MSBuild
          const projectFile = project.path.endsWith(".csproj") ? project.path : join(project.path, `${project.name}.csproj`);
          const fullPath = join(cwd, projectFile);

          if (!existsSync(fullPath)) {
            buildResult.error = `Project file not found: ${fullPath}`;
            break;
          }

          buildResult.command = `msbuild "${fullPath}" /p:Configuration=Release`;
          const output = execSync(buildResult.command, {
            cwd: cwd,
            encoding: "utf-8",
            timeout: 600000,
            stdio: "pipe",
          });

          buildResult.status = "passed";
          buildResult.output = output.trim().substring(0, 1000);
          break;
        }

        case "mixed": {
          // Mixed .NET Framework + npm/pnpm/yarn project
          const projectPath = join(cwd, project.path);
          const projectDir = projectPath.endsWith(".csproj") ? dirname(projectPath) : projectPath;
          let pm: PackageManager = "npm";

          // 1. Run package install first
          if (existsSync(join(projectDir, "package.json"))) {
            try {
              pm = runPackageInstall(projectDir);
            } catch (e) {
              // Continue even if install has warnings
              pm = detectPackageManager(projectDir);
            }
          }

          // 2. Build the .NET Framework project
          const projectFile = project.path.endsWith(".csproj") ? project.path : join(project.path, `${project.name}.csproj`);
          const fullPath = join(cwd, projectFile);

          if (!existsSync(fullPath)) {
            buildResult.error = `Project file not found: ${fullPath}`;
            break;
          }

          buildResult.command = `${pm} install && msbuild "${fullPath}" /p:Configuration=Release`;
          const output = execSync(`msbuild "${fullPath}" /p:Configuration=Release`, {
            cwd: cwd,
            encoding: "utf-8",
            timeout: 600000,
            stdio: "pipe",
          });

          buildResult.status = "passed";
          buildResult.output = output.trim().substring(0, 1000);
          break;
        }
      }
    } catch (error: any) {
      buildResult.status = "failed";
      buildResult.error = error.message.substring(0, 1000);
    }

    buildResult.duration_ms = Date.now() - startTime;
    results.push(buildResult);
  }

  // Calculate summary
  const passed = results.filter((r) => r.status === "passed").length;
  const failed = results.filter((r) => r.status === "failed").length;

  const finalResult = {
    success: failed === 0,
    total_projects: projects.length,
    passed,
    failed,
    results,
    message:
      failed === 0
        ? `✅ All ${passed} projects built successfully!`
        : `❌ ${failed} of ${projects.length} projects failed to build. Fix the errors before continuing.`,
  };

  return {
    content: [{ type: "text" as const, text: JSON.stringify(finalResult, null, 2) }],
  };
}

export function handleDecidePrOrMerge(args: {
  into_branch: string;
  from_branch: string;
  conflicts_resolved?: number;
  projects_built?: number;
}) {
  const { into_branch, from_branch, conflicts_resolved = 0, projects_built = 0 } = args;

  // This tool prompts the user for their choice
  // The response will guide the agent on what to do next
  const promptMessage = `
## 🔀 Merge Decision Required

**Merge:** ${from_branch} → ${into_branch}
**Conflicts Resolved:** ${conflicts_resolved}
**Projects Built:** ${projects_built}

**Please choose how to proceed:**

1. **Create PR** - Create a pull request for team review (recommended for complex merges)
2. **Direct Merge** - Commit and push directly to ${into_branch} (faster, for simple merges)

**What would you like to do?**
`.trim();

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({
          prompt: promptMessage,
          into_branch,
          from_branch,
          conflicts_resolved,
          projects_built,
          instructions: "User must respond with either 'pr' or 'merge'. Agent should wait for user response and follow their choice.",
        }, null, 2),
      },
    ],
  };
}
