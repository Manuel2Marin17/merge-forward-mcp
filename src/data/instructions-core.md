# Merge-Forward Workflow Instructions

---

## 📋 Quick Reference Card

**Print this mentally at the start of every merge**

### Critical Rules (Never Skip)
1. 🔴 Build ALL affected projects before validation (not just one)
2. 🔴 Regenerate lock files after package.json changes
3. 🔴 Check for duplicate JSON keys before staging
4. 🔴 Verify peer dep versions match framework version
5. 🔴 Use TodoWrite to track every major step

### Pre-Staging Checklist (Every File)
```bash
# 1. Conflict markers
grep -n "<<<<<<< HEAD" <file>  # Must be empty

# 2. Syntax validation
jq empty <file>  # For JSON
node --check <file>  # For JS/TS

# 3. Duplicates
# Check for duplicate JSON keys, imports, using statements

# 4. Format
npx prettier --write <file>  # Run before staging

# 5. Inspect
git diff --cached <file>  # Verify staged changes
```

### After package.json Changes
```bash
npm install --legacy-peer-deps  # Regenerate lock
grep -r "node_modules" **/*.csproj  # Check .csproj refs
npm info <package> peerDependencies  # Verify peer deps
```

### Section Jump Links
- [Agent Philosophy](#1-agent-execution-philosophy)
- [Pre-Flight Checklist](#2-pre-flight-checklist)
- [Step 2d-i: Pre-Staging Verification](#2d-i-pre-staging-verification-critical)
- [Step 2d-ii: Cross-File Consistency](#2d-ii-cross-file-consistency-check)
- [Step 2e: Build Affected Projects](#2e-build-conflict-affected-projects)
- [Common Patterns](#5-common-patterns-troubleshooting)

---

# 1. Agent Execution Philosophy

## Your Mission
**Follow the process exactly, even when it feels redundant.**

### User Priority Order
1. ✅ **Slow + Correct** (all steps followed)
2. ❌ **Fast + Skipped steps** (even if nothing breaks)

### Common Rationalization Traps (Don't Fall For These)
- ❌ "One project built successfully, others will too"
- ❌ "This step seems obvious, I can skip it"
- ❌ "I'll save time by skipping verification"
- ❌ "The full validation will catch issues anyway"

### What "Following Process" Means
- ✅ Use TodoWrite for every major section
- ✅ Complete ALL items in checklists (not just some)
- ✅ Provide required outputs in specified formats
- ✅ Answer self-check questions honestly
- ✅ Build ALL affected projects (not just one)
- ✅ Stop at STOP gates and verify completion

### Time Investment Reality
- **Skipping steps:** Saves 5 minutes, costs 30-60 minutes in rework
- **Following steps:** Costs 5 minutes, saves hours of debugging

**Remember: The user can see when you skip steps. Process compliance builds trust.**

---

# 2. Pre-Flight Checklist

**🔴 MANDATORY: Complete this before starting Step 0**

Copy this checklist into your response and check all boxes:

```markdown
## Agent Pre-Flight Commitment

I understand and commit to:
- [ ] Using TodoWrite to track ALL major steps (not just some)
- [ ] Building ALL affected projects (not just one or two)
- [ ] Completing every STOP gate verification
- [ ] Providing required output formats
- [ ] Running pre-staging checklist for EVERY resolved file
- [ ] Regenerating lock files after ANY package.json change
- [ ] Not rationalizing shortcuts even when confident
- [ ] Answering all self-check questions before proceeding
- [ ] Reading Anti-Skip Warnings and confirming I didn't skip

**I acknowledge that skipping steps wastes user time and breaks trust.**

Agent signature: [Your model name and timestamp]
```

**Paste this completed checklist before proceeding to Step 0.**

---

# 3. Core Workflow

## Arguments Provided
The user invoked: /merge-forward <from_branch> <to_branch_1> [to_branch_2] ...

Extract the branches from the user's command:
- from_branch: Source branch containing fixes
- to_branches: Array of target branches in ascending order

---

## Step 0: Fetch Playbook

### TL;DR (15 seconds)
Get conflict resolution rules and store them for the entire workflow.

Call get_playbook() to retrieve conflict resolution rules. Store these rules and apply them throughout.

**The 7 Core Rules:**
1. Bug Fixes Take Priority
2. Behavior Changes Must Survive
3. Refactors vs Fixes
4. Code Structure Conflicts
5. Test & Validation
6. Documentation
7. Dependency Consistency Across Files

[See detailed rules in playbook](#playbook-rules)

---

## Step 1: Plan the Merge

### TL;DR (30 seconds)
Validate branches and build execution plan.

Call plan_merge_forward(from_branch, to_branches) to:
- Validate branches exist
- Calculate commits to be merged
- Build execution plan

---

## Step 2: Execute Each Merge

For each target branch in sequence:

### 2a. Gather Context

### TL;DR (30 seconds)
Get divergence info and potential conflicts.

Call gather_merge_context(into_branch, merge_branch) to get:
- Divergence point
- Changes in both branches
- Potential conflicts
- File modifications

---

### 2b. Checkout Target Branch

```bash
git checkout <target_branch>
```

---

### 2c. Perform Merge

```bash
git merge --no-ff <source_branch>
```

---

### 2d. Resolve Conflicts (if any)

### TL;DR (1 minute)
Apply playbook rules → Verify syntax → Check cross-file consistency → Stage

**Critical Success Factors:**
- 🔴 No conflict markers in staged files
- 🔴 Lock files regenerated if package.json changed
- 🔴 Cross-file dependencies consistent

---

**🔴 MANDATORY TODO SETUP**

**Before resolving any conflicts, call TodoWrite:**

Required todos:
```json
{
  "todos": [
    {"content": "Resolve conflicts in [file1]", "status": "pending", "activeForm": "Resolving conflicts in [file1]"},
    {"content": "Resolve conflicts in [file2]", "status": "pending", "activeForm": "Resolving conflicts in [file2]"},
    {"content": "Run pre-staging verification for [file1]", "status": "pending", "activeForm": "Running pre-staging verification for [file1]"},
    {"content": "Run pre-staging verification for [file2]", "status": "pending", "activeForm": "Running pre-staging verification for [file2]"},
    {"content": "Check cross-file consistency", "status": "pending", "activeForm": "Checking cross-file consistency"},
    {"content": "Build affected projects", "status": "pending", "activeForm": "Building affected projects"}
  ]
}
```

**Do not proceed without creating these todos.**

---

#### Conflict Resolution Process

**CRITICAL: Apply the playbook rules from Step 0**
**Primary Rules: #1 (Bug Fixes Take Priority), #2 (Behavior Changes), #3 (Refactors vs Fixes), #4 (Code Structure)**

For each conflict:
1. Read the conflicting files carefully
2. Identify what changed on each side
3. Determine conflict type:
   - Bug fix vs refactor → Rule #1, #3
   - Security/validation change → Rule #2
   - Structural change → Rule #4
   - Test conflicts → Rule #5
   - Dependency changes → Rule #7
4. Apply the appropriate playbook rule
5. **Do NOT stage yet** - proceed to 2d-i first
6. Document your reasoning:
   - File path
   - Issue description
   - Playbook rule applied
   - Resolution explanation

[See detailed conflict resolution procedures](#detailed-conflict-resolution)

---

### 2d-i. Pre-Staging Verification ⚠️ CRITICAL

**Purpose:** Catch syntax errors before CI/CD
**When:** After resolving EVERY file, before git add
**Time cost:** 30 sec/file
**Skip cost:** Hours of CI/CD debugging

---

**🔴 MANDATORY: Complete for EVERY resolved file**

[See Quick Reference Card](#quick-reference-card) for quick command lookup.

**5-Step Verification Process:**

#### Step 1: Verify No Conflict Markers Remain ❌ BLOCKING

```bash
grep -n "<<<<<<< HEAD\|=======\|>>>>>>> " <file>
```

**Expected:** No output
**If fails:** Fix immediately, do not stage

[See detailed procedure](#detailed-2di-step1-conflict-markers)

#### Step 2: Validate Syntax ❌ BLOCKING

**For JSON files:**
```bash
# Validate JSON syntax
jq empty <file> 2>&1
# OR
node -e "require('./<file>')" 2>&1

# Check for duplicate JSON keys
node -e "const fs=require('fs'); const content=fs.readFileSync('<file>','utf8'); const keys={}; JSON.parse(content,(key,val)=>{if(key&&keys[key])console.error('Duplicate:',key); keys[key]=1; return val})"
```

**For TypeScript/JavaScript:**
```bash
node --check <file>
```

**Expected:** No output
**If fails:** Fix immediately, do not stage

[See detailed procedure](#detailed-2di-step2-syntax)

#### Step 3: Check for Duplicate Imports/Using ❌ BLOCKING

**For C# files:**
```bash
grep "^using " <file> | sort | uniq -d
```

**For TypeScript/JavaScript:**
```bash
grep "^import " <file> | sort | uniq -d
```

**Expected:** No output
**If fails:** Remove duplicates

[See detailed procedure](#detailed-2di-step3-duplicates)

#### Step 4: Run Code Formatter ❌ BLOCKING

```bash
# For TypeScript/JavaScript/HTML/SCSS
cd <project-directory>
npx prettier --write <file>
npx prettier --check <file>  # Verify

# For C#
dotnet format <file> --verify-no-changes
```

**Expected:** Formatting succeeds
**If fails:** Fix formatting errors

[See detailed procedure](#detailed-2di-step4-formatter)

#### Step 5: Inspect Staged Changes ❌ BLOCKING

```bash
# Stage the file
git add <file>

# Inspect
git diff --cached <file>

# Verify:
# ✓ No conflict markers (<<<, ===, >>>)
# ✓ Changes look reasonable
# ✓ No unexpected modifications
# ✓ Formatting is clean

# If anything looks wrong:
git reset <file>  # Unstage, fix, re-stage
```

[See detailed procedure](#detailed-2di-step5-inspect)

---

**Complete Checklist Template**

**Required Output Format:**
```markdown
### Pre-Staging Verification Results

**Files Verified:** X

1. ✓ path/to/file1.json
   - Conflict markers: ✓ None found
   - Syntax: ✓ Valid JSON (jq test passed)
   - Duplicates: ✓ None found
   - Formatting: ✓ Prettier applied
   - Inspection: ✓ git diff --cached reviewed

2. ✓ path/to/file2.ts
   - Conflict markers: ✓ None found
   - Syntax: ✓ Valid TypeScript (node --check passed)
   - Duplicates: ✓ None found
   - Formatting: ✓ Prettier applied
   - Inspection: ✓ git diff --cached reviewed

[Repeat for each file]

**Summary:** All X files passed verification.
```

**Paste this output before proceeding to Section 2d-ii.**

---

⚠️ **ANTI-SKIP WARNING** ⚠️

**Did you just skip pre-staging verification?**

Common rationalizations:
- ❌ "The file looks fine, no need to verify"
- ❌ "I'll catch issues during build"
- ❌ "This is taking too long"

**If you didn't complete the checklist above for EVERY file: GO BACK NOW.**

**Self-Check Questions:**
- How many files did you resolve? ___
- How many files did you verify? ___
- **If these numbers don't match: GO BACK.**

---

**ONLY AFTER COMPLETING THIS CHECKLIST FOR ALL FILES:** Proceed to Section 2d-ii.

---

### 2d-ii. Cross-File Consistency Check

### TL;DR (1 minute)
package.json ↔ lock files ↔ .csproj ↔ peer deps must align

**Critical Success Factors:**
- 🔴 Lock files regenerated if package.json changed
- 🔴 .csproj references match package.json
- 🔴 Peer deps match framework version
- 🔴 No missing devDependencies

---

**🛑 STOP GATE: Did package.json change?**
- **YES** → Continue with this section (MANDATORY)
- **NO** → Skip to [Section 2e](#2e-build-conflict-affected-projects)

---

**CRITICAL: Apply Rule #7 (Dependency Consistency Across Files)**
**This subsection handles the most common cause of CI/CD build failures after merges**

---

#### MANDATORY STEP 1: Regenerate Lock Files 🔴 CRITICAL

**CRITICAL: Do this FIRST, before anything else.**

```bash
cd [project-directory]

# For npm projects
if [ -f package-lock.json ]; then
  echo "Regenerating package-lock.json for $(pwd)"
  npm install --legacy-peer-deps
  git add package-lock.json
fi

# For pnpm projects
if [ -f pnpm-lock.yaml ]; then
  echo "Regenerating pnpm-lock.yaml for $(pwd)"
  pnpm install
  git add pnpm-lock.yaml
fi

# For yarn projects
if [ -f yarn.lock ]; then
  echo "Regenerating yarn.lock for $(pwd)"
  yarn install
  git add yarn.lock
fi
```

**Why this is mandatory:**
- npm ci (CI/CD) requires exact sync between package.json and lock files
- Skipping this = guaranteed CI/CD failure
- Takes 30 seconds now, saves 30 minutes later

**Verification:**
```bash
# Check lock file was actually regenerated
git diff --cached package-lock.json | head -20
# Should show version changes matching package.json
```

**Required Confirmation:**
```markdown
✓ Lock file regenerated: [package-lock.json / pnpm-lock.yaml / yarn.lock]
✓ Lock file staged: git add completed
✓ Lock file verified: git diff --cached shows updates
```

**Paste confirmation before proceeding.**

[See detailed lock file procedures](#detailed-2dii-lock-files)

---

#### Step 2: Check Cross-File References

**Common patterns to check:**
- `package.json` ↔ `*.csproj` (for .NET + npm projects)
- `package.json` ↔ `webpack.config.*`
- `package.json` ↔ `tsconfig.json` (paths section)
- `package.json` ↔ `*.html` (hardcoded script/style tags)

```bash
# Search for node_modules references in .csproj files
grep -r "node_modules" **/*.csproj

# Search for node_modules references in HTML files
grep -r "node_modules" **/*.html
```

**Identify dependency changes:**
- Compare source and target package.json
- Note any packages that were added, removed, or replaced
- Pay special attention to package name changes (e.g., xlsx → exceljs)

**Verify consistency:**
- Every `<Content Include="node_modules\...">` must have corresponding package in package.json
- If package.json replaced a dependency (e.g., xlsx → exceljs), update all .csproj references
- Check that referenced file paths exist after `npm install`

**Fix inconsistencies immediately:**
```bash
# Example: If package.json has exceljs but .csproj references xlsx
# 1. Read the .csproj file
# 2. Replace node_modules\xlsx\* references with node_modules\exceljs\*
# 3. Verify correct file paths (dist/exceljs.min.js not dist/xlsx.full.min.js)
# 4. Stage the changes: git add *.csproj
```

[See detailed cross-file procedures](#detailed-2dii-cross-file)

---

#### Step 3: Verify JSON Integrity (if package.json had conflicts)

**Check for duplicate keys that can break Volta, npm, etc.**

```bash
cd <project-directory>

# Using node (works on Windows without jq)
node -e "const fs=require('fs'); const content=fs.readFileSync('package.json','utf8'); const keys={}; let hasDups=false; JSON.parse(content,(key,val)=>{if(key&&keys[key]){console.error('Duplicate key:',key); hasDups=true;} keys[key]=1; return val}); if(hasDups) process.exit(1);"

# If duplicates found:
# - Open package.json
# - Identify which duplicate key to keep (usually target branch = newer per Rule #4)
# - Remove the incorrect duplicate
# - Re-validate: node -e "require('./package.json'); console.log('Valid')"
# - Re-stage: git add package.json
```

**Common duplicate key patterns:**
- `"volta"` appears twice with different node versions
- `"dependencies"` section duplicated
- `"scripts"` section duplicated

**Resolution strategy:**
- Keep target branch version (Rule #4: newer architecture wins)
- Unless source branch has critical fix (Rule #1: bug fixes take priority)
- Document which version you kept in merge commit message

[See detailed JSON integrity procedures](#detailed-2dii-json-integrity)

---

#### Step 4: Check for Missing Critical devDependencies

```bash
# Compare devDependencies between source and target
# Show source devDependencies
git show <source-branch>:path/to/package.json | grep -A100 '"devDependencies"' | grep "@angular-devkit\|typescript\|webpack"

# Show target devDependencies
grep -A100 '"devDependencies"' path/to/package.json | grep "@angular-devkit\|typescript\|webpack"

# Look for packages in source but missing in target
```

**Critical devDependencies to check:**
- `@angular-devkit/build-angular` - Required for Angular builds (`ng build`)
- `@angular/compiler-cli` - Required for Angular compilation
- `typescript` - Required for TypeScript compilation (`tsc`)
- `webpack`, `webpack-cli` - Required for Webpack builds
- Any package referenced in package.json "scripts" section

**If critical build tool is in source but missing in target:**
```bash
# Add it to target's package.json devDependencies with target's framework version
# Example: Target has Angular 19, source had @angular-devkit/build-angular ^15.x
# Add: "@angular-devkit/build-angular": "19.2.14" (match target Angular version)

# Edit package.json to add the missing devDependency
# Regenerate lock file:
npm install --legacy-peer-deps

# Verify the package was installed:
ls node_modules/@angular-devkit/build-angular

# Re-stage:
git add package.json package-lock.json
```

**Also verify @types/* package compatibility with TypeScript:**
```bash
# Check TypeScript version
grep '"typescript"' package.json  # Example: "5.8.3"

# Check @types/node version
grep '"@types/node"' package.json  # Example: "12.11.1"

# TypeScript version → Minimum compatible @types/node version:
# TypeScript 5.0-5.4: @types/node 18.x or 20.x
# TypeScript 5.5-5.8: @types/node 20.x or 22.x
# TypeScript 5.9+: @types/node 22.x

# If @types/node is too old (e.g., 12.x with TypeScript 5.8):
npm install @types/node@22 --save-dev --legacy-peer-deps

# Regenerate lock file and re-stage
git add package.json package-lock.json
```

[See detailed devDependencies procedures](#detailed-2dii-devdeps)

---

#### Step 5: .NET/NuGet Package Version Consistency (if .csproj changed)

**This handles transitive dependency conflicts that cause NU1605 errors in CI/CD.**

```bash
# 1. Identify which packages were added or version-bumped
git diff HEAD <modified.csproj> | grep "PackageReference"

# 2. Find all projects that reference the modified project
grep -r "ProjectReference.*MyApp.API.csproj" **/*.csproj

# 3. Check if dependent projects also have the same PackageReference
grep "PackageReference Include=\"System.Text.Json\"" Tests/MyApp.UnitTest/MyApp.UnitTest.csproj

# 4. Update dependent projects to use same or higher version
# - Open dependent project .csproj
# - Update PackageReference to match or exceed the modified project's version
# - Stage changes: git add <dependent.csproj>

# 5. Verify no package downgrade errors
dotnet restore <dependent.csproj>
# Look for: error NU1605: Detected package downgrade
```

**Common packages to check:**
- System.Text.Json
- Newtonsoft.Json
- Microsoft.Extensions.*
- Swashbuckle.*

[See detailed NuGet procedures](#detailed-2dii-nuget)

---

#### Step 6: Verify and Install Peer Dependencies

**CRITICAL: Peer dependency versions must match your framework version (e.g., Angular 19 packages need @ngrx 19.x, not 21.x)**

```bash
# Step 1: Check peer dependencies of main packages
npm info @myorg/components peerDependencies
npm info @myorg/shared peerDependencies
npm info @angular/core peerDependencies

# Step 2: Determine your framework version
grep '"@angular/core"' package.json  # Example: "19.2.14"
# This means you need @ngrx packages version 19.x, NOT 21.x

# Step 3: Check what versions are available for the peer dep
npm info @angular-architects/ngrx-toolkit versions | grep "^19\."

# Step 4: Install peer deps matching YOUR framework version
npm install @ngrx/signals@19.0.0 @angular-architects/ngrx-toolkit@19.4.3 camelcase-keys@^10.0.1 @ngrx/operators@19.0.0 --save-dev --legacy-peer-deps

# Step 5: Verify they're now in package.json devDependencies
grep -A30 '"devDependencies"' package.json | grep "@ngrx/signals\|@angular-architects\|camelcase-keys"

# Step 6: Verify NO version conflicts
npm install --legacy-peer-deps
# Should succeed without ERESOLVE errors

# Step 7: Re-stage
git add package.json package-lock.json
```

**How to find compatible versions:**
```bash
# Method 1: Check peer dependency requirements
npm info @angular-architects/ngrx-toolkit peerDependencies
# Shows: { "@angular/common": "^21.0.0" } ← Means it needs Angular 21!

# If peer deps show ^21.0.0 but you have Angular 19:
# → This version is TOO NEW, find older version

# Method 2: Find version compatible with your framework
npm info @angular-architects/ngrx-toolkit versions | grep "^19\."

# Method 3: Check what peer dep version matches
npm view @angular-architects/ngrx-toolkit@19.4.3 peerDependencies
# Shows: { "@angular/common": "^19.0.0" } ← Compatible with Angular 19!
```

**Common peer dependency packages:**
- `@ngrx/signals` - Required by @myorg packages
- `@angular-architects/ngrx-toolkit` - Required by @myorg state management
- `camelcase-keys` - Required by @myorg util packages
- `@ngrx/operators` - Required by @ngrx/signals/rxjs-interop

**Red flags indicating wrong peer dep version:**
- npm ERESOLVE errors during install
- "Conflicting peer dependency" messages
- Peer dep requires different framework version

[See detailed peer dependency procedures](#detailed-2dii-peer-deps)

---

**Required Output Format:**
```markdown
### Cross-File Consistency Results

**Lock Files:**
- ✓ package-lock.json regenerated and staged (or N/A)

**Cross-File Checks:**
- ✓ .csproj references: [X files checked, Y updates needed, Y updates made]
- ✓ Peer dependencies: [All match framework version XX]
- ✓ Missing devDeps: [None / Added: list]
- ✓ @types/* compatibility: [All compatible with TypeScript X.Y]
- ✓ NuGet consistency: [Z projects checked, W updates made]

**Issues Fixed:**
1. [Description] - [Files affected]
2. ...

**Summary:** All cross-file dependencies are consistent.
```

**Paste this output before proceeding to Section 2e.**

---

## 2e. Build Conflict-Affected Projects

### TL;DR (1 minute)
Call build_affected_projects() tool → It will build ALL projects and verify they pass

---

⚠️ **ANTI-SKIP WARNING** ⚠️

**This is the most commonly skipped step.**

**In the past, agents have rationalized:**
- ❌ "I built one project and it worked, others should be fine"
- ❌ "I'll save time and let full validation handle it"
- ❌ "This seems redundant"

**This is why this step is now a REQUIRED TOOL CALL.**

---

### 🔴 MANDATORY TOOL CALL: build_affected_projects

**STEP 1: Identify ALL Affected Projects**

Review all conflicted file paths and identify which projects contain those files.

For each project, determine:
- **name:** Project name (e.g., "MyApp.API")
- **type:** Project type (npm, dotnet-core, dotnet-framework, or mixed)
- **path:** Relative path to project directory or .csproj file

**Project type mapping:**
- `npm` - Pure Node.js/Angular/React projects with package.json
- `dotnet-core` - .NET 5+ or .NET Core projects
- `dotnet-framework` - .NET Framework 4.x projects
- `mixed` - .NET Framework + npm projects (e.g., MyApp.Web)

---

### STEP 2: Call build_affected_projects Tool

**🔴 YOU MUST CALL THIS TOOL - DO NOT SKIP**

```typescript
build_affected_projects({
  projects: [
    {
      name: "MyApp.API",
      type: "dotnet-core",
      path: "MyApp.API/MyApp.API.csproj"
    },
    {
      name: "MyApp.Web",
      type: "mixed",
      path: "MyApp.Web/"
    },
    {
      name: "Frontend.UI",
      type: "npm",
      path: "modules/frontend/Frontend.UI/"
    }
    // ... ALL affected projects ...
  ]
})
```

**The tool will:**
1. Build ALL projects in the list
2. Run npm install for npm/mixed projects
3. Return success/failure for EACH project
4. Return overall success only if ALL projects pass

**You CANNOT proceed until:**
- You call this tool
- The tool returns success: true
- All projects passed

**If any project fails:**

**🛑 STOP IMMEDIATELY - DO NOT PROCEED**

You MUST follow this exact process:

1. **Read the tool output carefully**
   - The tool returns detailed error for each failed project
   - Error message shows exactly what went wrong
   - Example: "CS0117: 'WfParameters' does not contain a definition for 'CTDisplay'"

2. **Fix the build errors**
   - Use Read tool to examine the failing files
   - Fix the specific errors reported
   - Common fixes:
     - Remove test parameters that don't exist in target branch
     - Update .csproj references to match package.json
     - Fix duplicate imports/using statements
     - Fix syntax errors from conflict resolution

3. **Call build_affected_projects tool AGAIN**
   - Use the EXACT SAME project list
   - The tool will rebuild ALL projects (including ones that passed before)
   - This verifies your fixes didn't break anything

4. **Repeat until success: true**
   - Keep fixing errors and re-calling the tool
   - Do NOT proceed until the tool returns success: true

**🔴 CRITICAL: You CANNOT skip to Section 2f if even ONE project failed.**

Even if 99 out of 100 projects pass, you must fix the 1 failure.

---

### 🛑 STOP GATE: Build Success Required

**The build_affected_projects tool MUST return:**
```json
{
  "success": true,
  "passed": X,
  "failed": 0
}
```

**Acceptable result:** ✅ success: true, failed: 0
**NOT acceptable:** ❌ success: false (even if only 1 project failed)
**NOT acceptable:** ❌ Skipping the tool call entirely

**If you see success: false: STOP and go back to fix errors.**
**If you see failed > 0: STOP and go back to fix errors.**

**You CANNOT proceed to Section 2f until you receive success: true with failed: 0.**

---

**Why this is now a tool (not manual steps):**
- You cannot skip it - it's a required tool call
- Tool verifies ALL projects built, not just one
- Tool returns hard success/failure - no ambiguity
- Saves 30-60 minutes of debugging later

---

## 2f. Run Full Build Validation

### TL;DR (30 seconds)
Run automated build/test validation if available.

Call run_validation(profile="auto") to:
- Attempt build/test commands
- Report results (passed/failed/skipped)

**STOP if validation fails.** Do not continue to next branch.

---

## 2g. Ask User: Create PR or Continue?

### 🔴 MANDATORY TOOL CALL: decide_pr_or_merge

**🔴 YOU MUST CALL THIS TOOL - DO NOT SKIP**

**You cannot decide this yourself. You MUST ask the user via this tool.**

```typescript
decide_pr_or_merge({
  into_branch: "<target_branch>",
  from_branch: "<source_branch>",
  conflicts_resolved: <number>,
  projects_built: <number>
})
```

**The tool will:**
1. Display a prompt to the user
2. Wait for user response ("pr" or "merge")
3. Return the user's choice

**You MUST:**
1. Call this tool
2. Wait for the response
3. Follow the user's choice exactly

---

### If User Responds "pr" (Create PR):

1. Abort the current merge:
```bash
git merge --abort
```

2. Create PR branch with TeamCity-compatible name and re-do the merge:

**IMPORTANT: Branch name must follow TeamCity pattern: `<target_branch>/feature/merge-forward-<sanitized_source>`**

```bash
# Create TeamCity-compatible feature branch name
# Pattern: <target_branch>/feature/merge-forward-<source_with_periods_replaced>
# Example: 2509.1.0/feature/merge-forward-2503-1-0

# Replace periods with hyphens in source branch for feature name
SOURCE_SANITIZED=$(echo "<source_branch>" | sed 's/\./-/g')
PR_BRANCH="<target_branch>/feature/merge-forward-${SOURCE_SANITIZED}"

# Create and checkout the feature branch
git checkout -b "$PR_BRANCH"
git merge --no-ff <source_branch>
```

**Example:**
- Source: `2503.1.0`
- Target: `2509.1.0`
- PR branch: `2509.1.0/feature/merge-forward-2503-1-0` ✅ (TeamCity compatible)

3. Re-apply conflict resolutions (if any were needed)

4. Commit the merge:
```bash
git commit -m "Merge <source> into <target>"
```

5. Push and create PR:
```bash
git push -u origin "$PR_BRANCH"
gh pr create --base <target_branch> --head "$PR_BRANCH" --title "Merge forward: <source_branch> → <target_branch>" --body "<PR_BODY>"
```

The PR body should include:
- Summary of commits being merged
- Conflict resolutions with playbook rules applied
- Validation results
- Manual review items (if any)

6. **STOP HERE** - Do not continue to next branch. User must merge PR first.

---

### If User Responds "merge" (Direct Merge):

1. Complete the merge commit:
```bash
git commit -m "Merge <source> into <target>"
```

2. Push to target branch:
```bash
git push origin <target_branch>
```

3. Continue to next branch in the sequence

---

**Why this is now a tool:**
- Agent cannot skip asking the user
- User makes the decision, not the agent
- No ambiguity about what to do next

---

## Step 3: Generate Report

After merges complete (or PR created), provide:

```markdown
## Merge-Forward Report

**Source Branch:** <from_branch>
**Target Branches:** <list>

### Results
For each branch attempted:
- **Branch:** <target_branch>
- **Action:** ✓ Direct merge completed | 📋 PR created | ⚠ Stopped for review
- **Commits:** N commits merged
- **Conflicts:** K conflicts resolved
- **PR URL:** <url> (if PR created)

### Conflict Resolutions
For each conflict resolved:
- **File:** path/to/file.ext
- **Issue:** Description of conflict
- **Rule Applied:** Playbook Rule #X - <name>
- **Resolution:** How it was resolved

### Validation Results
Per branch:
- Build: ✓ Passed / ⚠ Skipped / ✗ Failed
- Tests: ✓ Passed / ⚠ Skipped / ✗ Failed

### Next Steps

**If PR Created:**
- [ ] Review PR with team: <pr_url>
- [ ] Approve and merge PR
- [ ] Run `/merge-forward` again for remaining branches
- [ ] Manual review items (if any)

**If Direct Merge:**
- [ ] Verify merges on remote
- [ ] Manual review items (if any)
- [ ] Additional testing needed (if any)
```

---

## Safety Constraints
- Merge-forward ONLY (no rebase)
- No force push or destructive git commands
- No `--no-verify` flags
- Preserve all commits and history
- Document all conflict resolutions
- Stop on validation failure

## Error Handling
- If a merge fails, stop and report the issue
- Don't continue to next branch if current merge incomplete
- Ask user for guidance if playbook rules are ambiguous
- Validate after each successful merge before proceeding
- If user chooses PR, STOP after creating PR - don't continue train
- User must manually merge PR before continuing to next branch

---

