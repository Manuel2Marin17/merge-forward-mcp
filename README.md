# Merge-Forward Assistant

A Model Context Protocol (MCP) server that helps safely carry bug fixes forward across release branches using merge-forward strategy.

## Overview

This tool helps teams maintain multiple release branches by safely merging fixes from older branches into newer ones, following a clear playbook to avoid dropping bug fixes during conflict resolution.

### What This Tool DOES

This MCP server is designed to **facilitate and reduce bottleneck time** during merge-forward operations by:

- Providing structured guidance through the merge-forward workflow
- Offering a consistent conflict resolution playbook
- Automating project build verification across multiple project types
- Reducing repetitive manual work and cognitive load
- Surfacing common conflict patterns and troubleshooting tips

### What This Tool Is

This tool will **NOT**:

- Automatically resolve all conflicts without human oversight
- Guarantee zero merge conflicts or issues
- Replace developer judgment and expertise
- Eliminate all merge-forward complexity
- Work perfectly for every edge case on day one

**This is a productivity tool that assists and accelerates the process**, but developers are still responsible for:

- Reviewing conflict resolutions for correctness
- Understanding the changes being merged
- Making final decisions on complex conflicts
- Validating that merged code meets requirements

### Key Features
- Automated merge-forward workflow with intelligent conflict resolution
- Built-in playbook prioritizing bug fixes over refactors
- Multi-project build verification (npm, .NET Core, .NET Framework)
- Comprehensive documentation tools (core workflow, detailed procedures, troubleshooting patterns)
- Interactive PR vs. direct merge decision with user approval
- Best-effort validation (build/test) with graceful failures
- Sequential PR workflow for team review
- Git safety constraints (no force push, no destructive commands)

## Installation

### 1. Build the MCP Server

```bash
npm install
npm run build
```

### 2. Register MCP with AI tooling

Claude Code example:

```bash
claude mcp add merge_forward --scope user -- node "/path/to/merge-forward-mcp/dist/index.js"
```

**Note:** Replace the path with your actual installation directory.

### 3. Verify Installation

```bash
claude mcp list
```

You should see `merge_forward` in the list of configured MCP servers.

## Usage

In Claude Code, navigate to your git repository and run:


merge-forward <from_branch> <to_branch_1> [to_branch_2] 



### Workflow

1. **Plan** - Analyzes commits and potential conflicts
2. **Merge** - Performs merge on target branch
3. **Resolve** - Applies playbook rules to resolve conflicts
4. **Build** - Builds all conflict-affected projects to verify resolution
5. **Validate** - Runs additional build/test checks if available
6. **Ask** - Prompts: "Create PR for review or continue with direct merge?"
   - **PR:** Creates `merge-forward/<source>-to-<target>` branch, pushes, creates PR, **STOPS**
   - **Direct:** Commits to target branch, pushes, continues to next branch

### Merge Trains (a → b → c)

If you create a PR for the first merge (a → b), the workflow **stops** - you must merge the PR before continuing to the next branch (b → c). This prevents cascading errors and enables team review.

### Understanding PR Workflow

**When you choose "Create PR":**
1. Claude creates a branch `merge-forward/<source>-to-<target>` from the target branch
2. Performs the merge with conflict resolution on that PR branch
3. Commits the merge and pushes the PR branch
4. Creates a pull request for team review
5. **The PR already contains the complete merge** - no need to merge again!

**To complete the merge:**
- Simply review and merge the PR normally
- The merge commit from the PR branch will be added to the target branch
- For merge trains, run `/merge-forward` again with the next branch pair after merging the PR

**Example for merge train 2408.0.4 → 2503.0.1 → 2509.0.0:**
```bash
# Step 1: Start merge-forward
/merge-forward 2408.0.4 2503.0.1 2509.0.0

# Step 2: Choose "Create PR" → PR created, workflow STOPS
# Step 3: Review and merge the PR (2408.0.4 → 2503.0.1)
# Step 4: Continue with next merge
/merge-forward 2503.0.1 2509.0.0
```

### Re-running Merge-Forward (Incremental Merges)

**You can safely re-run merge-forward on the same branches multiple times.**

Git intelligently handles this by only merging **new commits** that aren't already in the target branch.

**Example scenario:**
1. You already merged `2408.0.4 → 2503.0.1` (3 commits)
2. New bug fixes are added to `2408.0.4` (2 more commits)
3. Run `/merge-forward 2408.0.4 2503.0.1` again
4. Git will **only merge the 2 new commits**, skipping the 3 already merged

**If no new commits exist:**
- Git reports "Already up-to-date"
- No merge is needed or performed

**This is the intended workflow** for maintaining release branches - keep bringing forward new fixes as they're added to older branches!

### Supported Project Types

The `build_affected_projects` tool supports multiple project types:

- **npm** - Node.js projects with package.json
- **dotnet-core** - .NET 5+ projects (.csproj)
- **dotnet-framework** - .NET Framework 4.x projects (.csproj)
- **mixed** - .NET Framework projects with npm dependencies

The tool automatically detects build commands and runs appropriate validation for each project type.

## Conflict Resolution Playbook

The playbook prioritizes **preserving bug fixes and behavior changes** over structural refactors:

1. **Bug Fixes Take Priority** - Never drop a fix
2. **Behavior Changes Must Survive** - Security, validation, error handling always preserved
3. **Refactors vs Fixes** - Apply fix logic to new structure
4. **Code Structure** - Use target branch's newer architecture
5. **Test & Validation** - Preserve and update test coverage
6. **Documentation** - Log all non-trivial resolutions

See `src/data/playbook.ts` for complete rules. Workflow instructions are split across multiple files:
- `src/data/instructions-core.md` - Core workflow and quick reference
- `src/data/instructions-detailed.md` - Detailed procedures and verification steps
- `src/data/instructions-patterns.md` - Common conflict patterns and troubleshooting

## MCP Server Tools

The server provides nine tools that Claude uses during merge operations:

**Documentation Tools:**
- `get_merge_forward_instructions` - Core workflow instructions with quick reference and pre-flight checklist
- `get_detailed_procedures` - Detailed step-by-step procedures and verification checks
- `get_common_patterns` - Common conflict patterns and troubleshooting guide
- `get_playbook` - Conflict resolution rules and guidelines

**Workflow Tools:**
- `plan_merge_forward` - Plans merge-forward operation across multiple branches
- `gather_merge_context` - Analyzes commits and potential conflicts before merging
- `run_validation` - Runs build/test checks in best-effort auto mode
- `build_affected_projects` - Builds specific projects affected by conflicts (npm, .NET Core, .NET Framework)
- `decide_pr_or_merge` - Prompts user to choose between creating a PR or direct merge

## Safety Constraints

- Merge-forward only (no rebase)
- No destructive git commands
- No force push to main/master branches
- Preserves all commits and history
- Documents all conflict resolutions
- Builds affected projects before finalizing merge
- User approval required for PR vs. direct merge decision
- Stops on build/validation failure

## Development

### Running Locally

```bash
cd merge-forward-mcp
npm run dev
```

### Building

```bash
cd merge-forward-mcp
npm run build
```

### Testing MCP Tools

You can test individual MCP tools using the MCP CLI:

```bash
# Test planning a merge
npx @modelcontextprotocol/cli call merge_forward plan_merge_forward \
  '{"from_branch": "main", "to_branches": ["release-1.0"]}'

# Get workflow instructions
npx @modelcontextprotocol/cli call merge_forward get_merge_forward_instructions '{}'

# Get playbook rules
npx @modelcontextprotocol/cli call merge_forward get_playbook '{}'
```

## Troubleshooting

**MCP Server Not Found:**
- Verify the path in `claude mcp add` command is absolute and correct
- Check that `dist/index.js` exists after building
- Run `claude mcp list` to see configured servers

**Slash Command Not Available:**
- Verify `merge-forward.md` is in `~/.claude/commands/` (or `%USERPROFILE%\.claude\commands\` on Windows)
- Restart Claude Code

**Build Failures:**
- The `build_affected_projects` tool will stop the merge if builds fail
- Fix the build errors and re-run the merge-forward command
- Common issues are listed in the patterns guide (use `get_common_patterns` tool)

**Validation Skipped:**
- This is normal if your repository doesn't have standard build/test commands
- The validation is best-effort and skips unavailable tools gracefully

**Need Help During Merge:**
- Use `get_common_patterns` for troubleshooting common conflict scenarios
- Use `get_detailed_procedures` for step-by-step guidance on specific workflow steps
- Use `get_playbook` to review conflict resolution rules

## License

MIT
