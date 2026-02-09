#!/usr/bin/env node

/**
 * Merge Forward MCP Server
 *
 * Entry point for the merge_forward MCP server.
 * Provides tools for safe merge-forward operations across git release branches.
 *
 * @version 1.0.0
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { TOOL_DEFINITIONS } from "./tools/definitions.js";
import {
  handleGetInstructions,
  handleGetDetailedProcedures,
  handleGetCommonPatterns,
  handleGetPlaybook,
  handlePlanMergeForward,
  handleGatherMergeContext,
  handleRunValidation,
  handleBuildAffectedProjects,
  handleDecidePrOrMerge,
} from "./tools/handlers.js";

// Initialize MCP server
const server = new Server(
  {
    name: "merge_forward",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tool list handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOL_DEFINITIONS,
  };
});

// Register tool execution handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "get_merge_forward_instructions":
        return handleGetInstructions();

      case "get_detailed_procedures":
        return handleGetDetailedProcedures();

      case "get_common_patterns":
        return handleGetCommonPatterns();

      case "get_playbook":
        return handleGetPlaybook();

      case "plan_merge_forward":
        return handlePlanMergeForward(args as { from_branch: string; to_branches: string[] });

      case "gather_merge_context":
        return handleGatherMergeContext(args as { into_branch: string; merge_branch: string });

      case "run_validation":
        return handleRunValidation(args as { profile: string });

      case "build_affected_projects":
        return handleBuildAffectedProjects(args as { projects: any[] });

      case "decide_pr_or_merge":
        return handleDecidePrOrMerge(args as {
          into_branch: string;
          from_branch: string;
          conflicts_resolved?: number;
          projects_built?: number;
        });

      default:
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ success: false, error: `Unknown tool: ${name}` }),
            },
          ],
        };
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            success: false,
            error: error.message,
          }),
        },
      ],
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
