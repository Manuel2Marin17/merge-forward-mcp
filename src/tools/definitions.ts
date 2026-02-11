/**
 * MCP Tool Definitions
 *
 * Defines the schema for all tools exposed by the release_train server.
 * These are returned by the ListToolsRequestSchema handler.
 */

export const TOOL_DEFINITIONS = [
  {
    name: "get_merge_forward_instructions",
    description:
      "Get CORE workflow instructions (~4k tokens): Quick Reference, Agent Philosophy, Pre-Flight Checklist, and Steps 0-3 with TL;DR sections, STOP gates, and Anti-Skip Warnings. Call this FIRST. For detailed procedures or troubleshooting, use get_detailed_procedures or get_common_patterns.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_detailed_procedures",
    description:
      "Get DETAILED procedures (~5k tokens): Expanded explanations for each workflow step, including pre-staging verification, cross-file consistency checks, and build commands. Call this when you need more detailed guidance on a specific step.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_common_patterns",
    description:
      "Get COMMON PATTERNS & TROUBLESHOOTING (~5k tokens): Pattern catalog searchable by frequency/severity/file type, including lock file drift, duplicate JSON keys, peer dependency mismatches, NuGet conflicts, test mismatches, and more. Call this when you encounter an issue or need troubleshooting help.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_playbook",
    description:
      "Get the merge-forward conflict resolution playbook with all rules and guidelines. Call this to fetch playbook rules before resolving conflicts.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "plan_merge_forward",
    description:
      "Plan a merge-forward operation from a source branch to multiple target branches",
    inputSchema: {
      type: "object",
      properties: {
        from_branch: {
          type: "string",
          description: "Source branch containing fixes to merge forward",
        },
        to_branches: {
          type: "array",
          items: { type: "string" },
          description: "Target branches to merge into, in ascending order",
        },
      },
      required: ["from_branch", "to_branches"],
    },
  },
  {
    name: "gather_merge_context",
    description: "Gather context about changes and potential conflicts before merging",
    inputSchema: {
      type: "object",
      properties: {
        into_branch: {
          type: "string",
          description: "Target branch to merge into",
        },
        merge_branch: {
          type: "string",
          description: "Source branch to merge from",
        },
        include_details: {
          type: "boolean",
          description: "Include full commit and file lists (default: false, returns summary only)",
        },
        max_commits: {
          type: "number",
          description: "Maximum number of commits to show from each branch (default: 10)",
        },
        max_files: {
          type: "number",
          description: "Maximum number of non-conflicting files to show (default: 20)",
        },
      },
      required: ["into_branch", "merge_branch"],
    },
  },
  {
    name: "run_validation",
    description: "Run validation checks (build/test) in best-effort auto mode",
    inputSchema: {
      type: "object",
      properties: {
        profile: {
          type: "string",
          enum: ["auto"],
          description: "Validation profile (currently only 'auto' is supported)",
        },
      },
      required: ["profile"],
    },
  },
  {
    name: "build_affected_projects",
    description:
      "🔴 REQUIRED after resolving conflicts: Build ALL conflict-affected projects to verify conflicts were resolved correctly. This tool actually executes the builds and verifies all pass. You CANNOT skip this - it's a required tool call, not optional. The instructions will tell you when to call this.",
    inputSchema: {
      type: "object",
      properties: {
        projects: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "Project name (e.g., 'MyApp.API')",
              },
              type: {
                type: "string",
                enum: ["npm", "dotnet-core", "dotnet-framework", "mixed"],
                description:
                  "Project type: npm (package.json), dotnet-core (.NET 5+), dotnet-framework (.NET 4.x), mixed (.NET Framework + npm)",
              },
              path: {
                type: "string",
                description:
                  "Relative path to project directory or .csproj file (e.g., 'MyApp.API/' or 'MyApp.Web/MyApp.Web.csproj')",
              },
            },
            required: ["name", "type", "path"],
          },
          description: "List of all affected projects to build",
        },
      },
      required: ["projects"],
    },
  },
  {
    name: "decide_pr_or_merge",
    description:
      "🔴 REQUIRED after successful builds: Ask user whether to create a PR for review or proceed with direct merge. This tool prompts the user and waits for their response. You MUST call this tool and follow the user's choice - you cannot decide this yourself.",
    inputSchema: {
      type: "object",
      properties: {
        into_branch: {
          type: "string",
          description: "Target branch being merged into",
        },
        from_branch: {
          type: "string",
          description: "Source branch being merged from",
        },
        conflicts_resolved: {
          type: "number",
          description: "Number of conflicts that were resolved",
        },
        projects_built: {
          type: "number",
          description: "Number of projects that were built",
        },
      },
      required: ["into_branch", "from_branch"],
    },
  },
];
