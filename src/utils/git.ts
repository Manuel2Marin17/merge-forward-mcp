import { execSync } from "child_process";
import type { Commit } from "../types.js";

/**
 * Git utility functions for safe git operations
 *
 * All functions are read-only and do not modify the repository.
 */

/**
 * Execute a git command safely
 * @throws Error if command fails
 */
export function runGitCommand(command: string, cwd?: string): string {
  try {
    return execSync(command, {
      cwd: cwd || process.cwd(),
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch (error: any) {
    throw new Error(`Git command failed: ${error.message}`);
  }
}

/**
 * Check if a branch exists in the repository
 */
export function branchExists(branch: string): boolean {
  try {
    runGitCommand(`git rev-parse --verify ${branch}`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the number of commits between two branches
 */
export function getCommitCount(from: string, to: string): number {
  try {
    const output = runGitCommand(`git rev-list --count ${to}..${from}`);
    return parseInt(output, 10);
  } catch {
    return 0;
  }
}

/**
 * Get the list of commits between two branches
 */
export function getCommitList(from: string, to: string): Commit[] {
  try {
    const output = runGitCommand(`git log --oneline ${to}..${from}`);
    if (!output) return [];

    return output.split("\n").map((line) => {
      const [hash, ...messageParts] = line.split(" ");
      return {
        hash: hash,
        message: messageParts.join(" "),
      };
    });
  } catch {
    return [];
  }
}
