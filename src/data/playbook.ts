import type { Playbook } from "../types.js";

export const PLAYBOOK: Playbook = {
  version: "2.0.0",
  core_principle: "Preserve bug fixes and behavior changes; refactors can be redone. Maintain consistency across related configuration files.",
  rules: [
    {
      number: 1,
      name: "Bug Fixes Take Priority",
      guidelines: [
        "If incoming change fixes a bug, keep the fix logic",
        "If target branch refactored the area, apply the fix to the new structure",
        "Never silently drop a fix",
      ],
    },
    {
      number: 2,
      name: "Behavior Changes Must Survive",
      guidelines: [
        "Security patches, validation, error handling → always keep",
        "Logic corrections, edge case handling → always keep",
        "If both sides changed behavior, keep incoming fix + document conflict",
      ],
    },
    {
      number: 3,
      name: "Refactors vs Fixes",
      guidelines: [
        "Pure refactors (renames, reorganization, style) → target branch wins",
        "Fix in old structure → adapt fix to new structure",
        "When in doubt, apply the fix logic explicitly",
      ],
    },
    {
      number: 4,
      name: "Code Structure Conflicts",
      guidelines: [
        "Target branch has newer architecture → use its structure",
        "Apply incoming logic changes within that structure",
        "Delete dead code; don't keep both versions",
      ],
    },
    {
      number: 5,
      name: "Test & Validation",
      guidelines: [
        "Always preserve test coverage for fixes",
        "Update test structure to match target branch patterns",
        "Add tests for merged fixes if missing",
        "CRITICAL: When resolving test file conflicts, verify referenced properties/methods/fields exist in target branch",
        "CRITICAL: Compare test parameters/values against target branch - don't add test cases for removed features",
        "Remove duplicate using/import statements introduced during merge conflict resolution",
        "CRITICAL: Build conflict-affected projects immediately after resolving conflicts (see instructions.md section 2e)",
        "Use incremental builds for fast feedback - only build affected projects, not entire solution",
        "Stop immediately if incremental builds fail - do not proceed to full validation",
        "Document build results: which projects built, any errors fixed, files modified",
        "CRITICAL: Verify conflict markers completely removed before staging (grep for <<<<<<<, =======, >>>>>>>)",
        "CRITICAL: Validate syntax before staging - JSON files with jq/node, XML with xmllint, code with tsc/node",
        "CRITICAL: Check for duplicate JSON keys, duplicate imports, duplicate using statements",
        "CRITICAL: Run prettier/formatter before staging, not after (formatting is part of conflict resolution)",
        "Use Section 2d-i checklist for EVERY resolved file - no exceptions",
        "If pre-staging validation fails, fix immediately and re-run checklist",
        "Never assume files are valid just because git merge succeeded",
      ],
    },
    {
      number: 6,
      name: "Documentation",
      guidelines: [
        "Log every non-trivial resolution decision",
        "Note any fix that required restructuring",
        "Flag anything that needs manual review",
      ],
    },
    {
      number: 7,
      name: "Dependency Consistency Across Files",
      guidelines: [
        "When package.json dependencies change, verify related files are consistent",
        "CRITICAL: Always regenerate lock files (package-lock.json, pnpm-lock.yaml, yarn.lock) after package.json changes",
        "Lock files must be regenerated before committing - npm ci in CI/CD will fail otherwise",
        ".NET projects: Check .csproj for node_modules file references matching package.json",
        "Webpack/bundler configs: Check entry points match available packages",
        "If package.json removes a dependency, remove all references to it in build files",
        "If package.json adds/replaces a dependency, update file references accordingly",
        "Common pairs to check: package.json ↔ lock files (ALWAYS), package.json ↔ .csproj, package.json ↔ webpack.config, package.json ↔ tsconfig paths",
        "CRITICAL: Validate JSON files after merging - check for duplicate keys that break parsers",
        "JSON duplicate keys are common when both branches add same property (e.g., volta, dependencies)",
        "Use jq or node to detect duplicate keys before staging package.json",
        "Duplicate key resolution: Keep target branch value (Rule #4) unless source has critical fix (Rule #1)",
        ".NET projects: Check test/dependent .csproj files when main project PackageReference versions change",
        "Transitive dependency conflicts: If ProjectA upgrades PackageX, all projects referencing ProjectA must use same or higher version",
        "Use dotnet restore to detect NU1605 package downgrade errors before committing",
        "Common NuGet conflicts: System.Text.Json, Newtonsoft.Json, Microsoft.Extensions.*, Swashbuckle.*",
        "Critical devDependencies check: If source has @angular-devkit/build-angular, typescript, webpack, or other build tools that target is missing, add them",
        "Incomplete framework upgrades: Target may have new framework version but missing required dev packages",
        "After package.json conflict resolution, compare devDependencies lists to catch missing build tools",
        "Verify build scripts in package.json have all required dev packages listed",
        "CRITICAL: Peer dependency versions must match framework version (Angular 19 needs @ngrx 19.x, not 21.x)",
        "Use npm info to check peer dependency requirements before installing",
        "Check @types/node compatibility with TypeScript version (TS 5.8 needs @types/node 20.x or 22.x)",
        "Old @types/node (12.x, 14.x) causes 'Interface Buffer cannot simultaneously extend' errors with TypeScript 5.x",
      ],
    },
  ],
  validation_policy: [
    "Run builds and tests automatically if available",
    "Skip missing tools gracefully (don't fail)",
    "Report what ran vs what was skipped",
    "Manual review required if validation unavailable",
  ],
  workflow_policy: [
    "After each merge, ask user: PR for review or direct merge?",
    "If PR chosen: Create PR branch, push, stop - user must merge PR first",
    "If direct merge: Commit to target branch, push, continue to next branch",
    "For merge trains (a->b->c): If PR created for a->b, STOP - don't continue to c",
    "Sequential PRs prevent cascading errors and enable team review",
  ],
  examples: [
    {
      id: "lock-file-drift-001",
      scenario: "Package version upgrade (Angular 15 → Angular 18) with out-of-sync lock file",
      tags: ["package.json", "build-breaking", "very-high-frequency", "critical", "lock-file"],
      files_affected: ["package.json", "package-lock.json"],
      symptoms: [
        "npm ci fails in CI/CD with 'lockfile mismatch' error",
        "CI/CD build fails at dependency installation step"
      ],
      detection_command: "npm ci",
      resolution_reference: "See Instructions Section 2d-ii Step 1 (MANDATORY after package.json changes)",
      playbook_rules: [7],
      decision_logic: "Keep target's Angular 18 versions (Rule #4), regenerate lock file immediately",
      time_to_fix: "30 seconds",
      skip_cost: "30-60 minutes CI/CD debugging",
      prevention: [
        "ALWAYS regenerate lock files after package.json changes",
        "Add lock file regeneration to todos",
        "Verify lock file staged before committing"
      ],
      pattern_link: "instructions.md#pattern-lock-file-drift"
    },
    {
      id: "cross-file-csproj-001",
      scenario: "Package dependency replacement (xlsx → exceljs)",
      tags: ["package.json", ".csproj", "build-breaking", "medium-frequency", "critical", "cross-file"],
      files_affected: ["package.json", "FPS.Dashboard.Web.csproj"],
      symptoms: [
        "MSBuild fails: 'Could not find file node_modules\\xlsx\\dist\\xlsx.full.min.js'",
        ".csproj references files from packages not in package.json"
      ],
      detection_command: "msbuild FPS.Dashboard.Web.csproj /p:Configuration=Release",
      resolution_reference: "See Instructions Section 2d-ii Step 2 (Check cross-file references)",
      playbook_rules: [7],
      decision_logic: "Keep target's exceljs (Rule #4), update .csproj references to match",
      time_to_fix: "3 minutes",
      skip_cost: "30 minutes MSBuild debugging",
      prevention: [
        "Check .csproj files when package.json dependencies change",
        "Use grep -r 'node_modules' **/*.csproj to find references",
        "Update references immediately after package.json conflicts"
      ],
      pattern_link: "instructions.md#pattern-cross-file-csproj"
    },
    {
      id: "bug-fix-refactor-001",
      scenario: "Bug fix in refactored code",
      tags: ["code-logic", "bug-fix", "refactor", "medium-frequency"],
      files_affected: ["src/auth/login.ts"],
      resolution_reference: "Apply Rule #1 and Rule #3",
      playbook_rules: [1, 3],
      decision_logic: "Apply XSS fix logic (Rule #1) to new architecture's login handler (Rule #3)",
      time_to_fix: "5-10 minutes",
      skip_cost: "Security vulnerability remains",
      pattern_link: "instructions.md#playbook-rules"
    },
    {
      id: "behavior-change-001",
      scenario: "Validation logic added in source branch",
      tags: ["code-logic", "validation", "behavior-change", "medium-frequency"],
      files_affected: ["src/api/endpoints.ts"],
      resolution_reference: "Apply Rule #2",
      playbook_rules: [2],
      decision_logic: "Add email validation middleware to new pattern, preserve validation logic (Rule #2)",
      time_to_fix: "5-10 minutes",
      skip_cost: "Data validation missing",
      pattern_link: "instructions.md#playbook-rules"
    },
    {
      id: "incremental-build-001",
      scenario: "Complete workflow: xlsx → exceljs with incremental build validation",
      tags: ["package.json", ".csproj", "build-validation", "workflow-example"],
      files_affected: ["FPS.Dashboard.Web/package.json", "FPS.Dashboard.Web/FPS.Dashboard.Web.csproj"],
      resolution_reference: "See Instructions Section 2d-ii (Cross-file) and Section 2e (Incremental builds)",
      playbook_rules: [5, 7],
      decision_logic: "Update .csproj (Rule #7), build immediately (Rule #5), document results",
      time_to_fix: "10 minutes (including build)",
      skip_cost: "30-60 minutes if issues found later",
      pattern_link: "instructions.md#2e-build-conflict-affected-projects"
    },
    {
      id: "test-mismatch-001",
      scenario: "Test file merge conflict with removed property reference",
      tags: ["test-files", "compile-error", "medium-frequency", "high-severity"],
      files_affected: ["Tests/FPS.Dashboard.IntegrationTests/Tests/CycleTime/WipFlushLotRepositoryTests.cs"],
      symptoms: [
        "CS0117 'WfParameters' does not contain a definition for 'CTDisplay'",
        "Test uses properties that don't exist in target branch"
      ],
      detection_command: "dotnet build Tests/FPS.Dashboard.IntegrationTests/...",
      resolution_reference: "See Playbook Rule #5 (Verify referenced properties exist in target branch)",
      playbook_rules: [5],
      decision_logic: "Check target branch WfParameters class, remove properties that don't exist",
      time_to_fix: "5 minutes",
      skip_cost: "30 minutes compile error debugging",
      prevention: [
        "Always compare test file against target branch's API",
        "Don't blindly keep source's test code",
        "Verify all referenced properties/methods exist"
      ],
      pattern_link: "instructions.md#pattern-test-mismatch"
    },
    {
      id: "duplicate-imports-001",
      scenario: "Duplicate import statements from merge conflict",
      tags: ["code-files", "warning", "low-frequency", "medium-severity"],
      files_affected: ["Dashboard.API/Controllers/Equipment/ToolStateHistoryApiController.cs"],
      symptoms: [
        "CS0105 'The using directive appeared previously in this namespace'",
        "Duplicate using statements in file"
      ],
      detection_command: "grep '^using ' <file> | sort | uniq -d",
      resolution_reference: "See Instructions Section 2d-i Step 3 (Check for duplicate imports)",
      playbook_rules: [5],
      decision_logic: "Remove duplicate using statements, keep only one instance",
      time_to_fix: "1 minute",
      skip_cost: "5 minutes (warning clutter)",
      prevention: [
        "Always run duplicate check in Section 2d-i Step 3",
        "Check for duplicates before staging"
      ],
      pattern_link: "instructions.md#pattern-duplicate-imports"
    },
    {
      id: "conflict-markers-001",
      scenario: "Unresolved conflict markers left in staged file",
      tags: ["conflict-resolution", "build-breaking", "low-frequency", "critical"],
      files_affected: ["FPS.Dashboard/Services/AppSettingsConfig.cs"],
      symptoms: [
        "File staged with <<<<<<< HEAD markers still present",
        "Build fails with syntax errors"
      ],
      detection_command: "grep -n '<<<<<<< HEAD' <file>",
      resolution_reference: "See Instructions Section 2d-i Step 1 (MANDATORY: Verify no conflict markers)",
      playbook_rules: [5],
      decision_logic: "Unstage file, manually resolve conflicts, verify no markers remain",
      time_to_fix: "2 minutes",
      skip_cost: "Hours (merge must be redone)",
      prevention: [
        "Always run Section 2d-i checklist before git add",
        "Never skip pre-staging verification"
      ],
      pattern_link: "instructions.md#detailed-2di-step1-conflict-markers"
    },
    {
      id: "duplicate-json-keys-001",
      scenario: "Invalid JSON with duplicate keys after merge",
      tags: ["json", "validation", "build-breaking", "high-frequency", "critical"],
      files_affected: ["FPS.Dashboard.Web/package.json", "FPS.Dashboard.Angular/package.json"],
      symptoms: [
        "Volta error: 'duplicate field `volta`'",
        "npm install fails with JSON parsing error",
        "package.json has duplicate 'volta' key (appears at multiple lines)"
      ],
      detection_command: "jq empty package.json",
      resolution_reference: "See Instructions Section 2d-i Step 2 (Validate syntax) and Section 2d-ii Step 3 (JSON integrity)",
      playbook_rules: [5, 7],
      decision_logic: "Keep one volta field (target branch version per Rule #4), remove duplicate",
      time_to_fix: "2 minutes",
      skip_cost: "Hours (cryptic error, hard to debug)",
      prevention: [
        "Run JSON validation in Section 2d-i Step 2 before staging",
        "Use jq or node to detect duplicates",
        "Never skip syntax validation"
      ],
      pattern_link: "instructions.md#pattern-duplicate-keys"
    },
    {
      id: "formatting-skipped-001",
      scenario: "Code not formatted before committing",
      tags: ["formatting", "pre-commit", "medium-frequency", "medium-severity"],
      files_affected: [
        "UI.Monorepo/libs/cycle-time/feature-core-flct/src/lib/main-chart/main-chart.component.ts",
        "FPS.Dashboard.Angular/src/app/areas/general/last-updated/last-updated.component.html"
      ],
      symptoms: [
        "Pre-commit hook fails",
        "CI/CD formatting check fails",
        "npx prettier --check reports 'Code style issues found'"
      ],
      detection_command: "npx prettier --check <files>",
      resolution_reference: "See Instructions Section 2d-i Step 4 (Run code formatter BEFORE staging)",
      playbook_rules: [5],
      decision_logic: "Run prettier --write on all conflict-resolved files, re-stage",
      time_to_fix: "2 minutes",
      skip_cost: "Build fails, must amend commit",
      prevention: [
        "Run formatting in Section 2d-i Step 4 BEFORE initial staging",
        "Formatting is part of conflict resolution, not deferred"
      ],
      pattern_link: "instructions.md#detailed-2di-step4-formatter"
    },
    {
      id: "nuget-transitive-001",
      scenario: "NuGet package version mismatch causing transitive dependency conflict",
      tags: [".csproj", "nuget", "compile-error", "medium-frequency", "high-severity"],
      files_affected: [
        "Dashboard.API/Dashboard.API.csproj",
        "Tests/FPS.Dashboard.UnitTest/FPS.Dashboard.UnitTest.csproj"
      ],
      symptoms: [
        "NU1605: Detected package downgrade: System.Text.Json from 8.0.5 to 6.0.10",
        "dotnet restore fails with version conflict error"
      ],
      detection_command: "dotnet restore Tests/FPS.Dashboard.UnitTest/FPS.Dashboard.UnitTest.csproj",
      resolution_reference: "See Instructions Section 2d-ii Step 5 (.NET/NuGet Package Version Consistency)",
      playbook_rules: [7],
      decision_logic: "Update test project to use same version as main project (8.0.5)",
      time_to_fix: "5 minutes",
      skip_cost: "30-60 minutes NuGet debugging",
      prevention: [
        "Check ALL projects that reference modified .csproj",
        "Use dotnet restore to detect NU1605 before committing",
        "Document NuGet version updates"
      ],
      pattern_link: "instructions.md#pattern-nuget-transitive"
    },
    {
      id: "missing-devdeps-001",
      scenario: "Missing critical devDependency after package.json conflict resolution",
      tags: ["package.json", "devdependencies", "build-breaking", "high-frequency", "critical"],
      files_affected: ["FPS.Dashboard.Angular/package.json"],
      symptoms: [
        "Could not find the '@angular-devkit/build-angular:browser' builder's node package",
        "npm run build fails with missing package error"
      ],
      detection_command: "npm run build",
      resolution_reference: "See Instructions Section 2d-ii Step 4 (Check for missing critical devDependencies)",
      playbook_rules: [7],
      decision_logic: "Add @angular-devkit/build-angular matching target's Angular version (19.2.14, not source's 15.x)",
      time_to_fix: "3 minutes",
      skip_cost: "30-60 minutes build failure debugging",
      prevention: [
        "Compare source and target devDependencies after package.json conflicts",
        "Check package.json scripts to identify required packages",
        "Verify build tools are in devDependencies"
      ],
      pattern_link: "instructions.md#pattern-missing-devdeps"
    },
    {
      id: "peer-deps-mismatch-001",
      scenario: "Wrong peer dependency versions causing ERESOLVE conflicts",
      tags: ["package.json", "peer-dependencies", "build-breaking", "high-frequency", "critical"],
      files_affected: ["FPS.Dashboard.Angular/package.json"],
      symptoms: [
        "ERESOLVE could not resolve - @angular-architects/ngrx-toolkit@21.0.0 requires @angular/common ^21.0.0",
        "npm install fails with 'Conflicting peer dependency' messages"
      ],
      detection_command: "npm install --legacy-peer-deps",
      resolution_reference: "See Instructions Section 2d-ii Step 6 (Verify and install peer dependencies)",
      playbook_rules: [7],
      decision_logic: "Install @ngrx 19.x to match Angular 19, not @ngrx 21.x (check framework version first)",
      time_to_fix: "5 minutes",
      skip_cost: "30-60 minutes ERESOLVE debugging",
      prevention: [
        "Always check framework version before installing peer deps",
        "Use npm info <package>@<version> peerDependencies to verify",
        "Match peer dep major version to framework major version"
      ],
      pattern_link: "instructions.md#pattern-peer-deps"
    },
    {
      id: "types-node-incompatible-001",
      scenario: "@types/node incompatibility with TypeScript version",
      tags: ["package.json", "typescript", "compile-error", "medium-frequency", "high-severity"],
      files_affected: ["FPS.Dashboard.Angular/package.json"],
      symptoms: [
        "TS2320 Interface 'Buffer' cannot simultaneously extend types 'Uint8Array<ArrayBuffer>' and 'Uint8Array<ArrayBufferLike>'",
        "Error location: node_modules/@types/node/globals.d.ts:242:11"
      ],
      detection_command: "npm run build (TypeScript compilation errors)",
      resolution_reference: "See Instructions Section 2d-ii Step 4 (@types/* compatibility check)",
      playbook_rules: [7],
      decision_logic: "Update @types/node to version compatible with TypeScript 5.8 (20.x or 22.x, not 12.x)",
      time_to_fix: "3 minutes",
      skip_cost: "30 minutes TypeScript error debugging",
      prevention: [
        "Always verify @types/node matches TypeScript major version",
        "TypeScript 5.8 needs @types/node 20.x or 22.x minimum"
      ],
      pattern_link: "instructions.md#detailed-2dii-devdeps"
    }
  ],
};
