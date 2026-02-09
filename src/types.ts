/**
 * Type definitions for the release_train MCP server
 */

export interface Commit {
  hash: string;
  message: string;
}

export interface MergeInfo {
  into_branch: string;
  from_branch: string;
  commit_count: number;
  commits: Commit[];
}

export interface PlaybookRule {
  number: number;
  name: string;
  guidelines: string[];
}

export interface PlaybookExample {
  id?: string; // Unique identifier for the example
  scenario: string;
  tags?: string[]; // Searchable tags (e.g., "package.json", "build-breaking", "critical")
  files_affected: string[];
  symptoms?: string[]; // Observable symptoms
  detection_command?: string; // Command to detect this issue
  resolution?: string[]; // Detailed resolution steps (old format)
  resolution_reference?: string; // Cross-reference to instructions.md section
  rule_applied?: string; // Old format: single string
  playbook_rules?: number[]; // New format: array of rule numbers
  decision_logic?: string; // How to decide the resolution
  time_to_fix?: string; // Estimated time to fix
  skip_cost?: string; // Cost of skipping this step
  prevention?: string[]; // How to prevent this issue
  pattern_link?: string; // Link to pattern in instructions.md
}

export interface Playbook {
  version: string;
  core_principle: string;
  rules: PlaybookRule[];
  validation_policy: string[];
  workflow_policy: string[];
  examples?: PlaybookExample[];
}

export interface ValidationCheck {
  name: string;
  command: string;
  status: "passed" | "failed" | "skipped";
  output?: string;
  error?: string;
}

export interface ValidationCommand {
  name: string;
  command: string;
  file: string;
}
