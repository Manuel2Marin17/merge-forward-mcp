
# 5. Common Patterns & Troubleshooting

## Pattern Catalog (Quick Lookup)

### By Frequency
- 🔥 **Very High:** [Lock file drift](#pattern-lock-file-drift), [Duplicate JSON keys](#pattern-duplicate-keys)
- 🔶 **High:** [Peer dep version mismatch](#pattern-peer-deps), [Missing devDeps](#pattern-missing-devdeps)
- 🔵 **Medium:** [NuGet transitive conflicts](#pattern-nuget-transitive), [Test parameter mismatch](#pattern-test-mismatch)

### By Severity
- 🔴 **Critical (Build Breaking):** Lock file drift, Duplicate JSON keys, Peer deps, Missing devDeps
- 🟡 **High (Compile Error):** NuGet transitive, Test parameter mismatch, Formatting
- 🟢 **Medium (Warning):** Duplicate imports

### By File Type
- **package.json:** [Lock file drift](#pattern-lock-file-drift), [Duplicate keys](#pattern-duplicate-keys), [Peer deps](#pattern-peer-deps)
- **.csproj:** [Cross-file refs](#pattern-cross-file-csproj), [NuGet transitive](#pattern-nuget-transitive)
- **Test files:** [Parameter mismatch](#pattern-test-mismatch), [Duplicate imports](#pattern-duplicate-imports)

---

## Pattern: Lock File Drift {#pattern-lock-file-drift}

**Tags:** `package.json`, `build-breaking`, `very-high-frequency`, `critical`

**Symptoms:**
- npm ci fails in CI/CD with "lockfile mismatch"
- Package versions in node_modules don't match package.json

**Root Cause:**
- package.json changed during merge
- Lock file not regenerated
- CI/CD uses `npm ci` which requires exact sync

**Detection:**
```bash
npm ci  # Fails with lockfile error
```

**Resolution:**
See [Section 2d-ii Step 1](#mandatory-step-1-regenerate-lock-files--critical) (MANDATORY after package.json changes)

**Prevention:**
- ALWAYS regenerate lock files after package.json changes
- Add lock file regeneration to your todos
- Verify lock file staged before committing

**Time Impact:**
- Fix time: 30 seconds
- Skip cost: 30-60 minutes CI/CD debugging

**Related Patterns:** [Cross-file .csproj refs](#pattern-cross-file-csproj)

**Example from playbook:** See playbook example "Package version upgrade with out-of-sync lock file"

---

## Pattern: Duplicate JSON Keys {#pattern-duplicate-keys}

**Tags:** `json`, `validation`, `build-breaking`, `high-frequency`, `critical`

**Symptoms:**
- Volta fails: "duplicate field `volta`"
- npm install fails with parsing error
- Build tools fail to read config files

**Root Cause:**
- Both branches added same property during conflict
- Conflict resolution didn't validate JSON syntax
- Common with: volta, dependencies, devDependencies

**Detection:**
```bash
jq empty package.json  # Shows "duplicate key" error
node -e "const keys={}; JSON.parse(require('fs').readFileSync('package.json','utf8'),(key,val)=>{if(key&&keys[key])console.error('Duplicate:',key); keys[key]=1; return val})"
```

**Resolution:**
See [Section 2d-ii Step 3](#step-3-verify-json-integrity-if-packagejson-had-conflicts) (MANDATORY before staging)

**Decision Logic:**
- Keep target branch value (Rule #4: newer architecture)
- Unless source has critical fix (Rule #1)
- Document decision in merge commit

**Example:**
```json
// BEFORE (invalid - duplicate "volta")
{
  "volta": { "node": "16.20.2" },
  "dependencies": {...},
  "volta": { "node": "20.18.1" }  // Duplicate!
}

// AFTER (valid - kept target's newer version)
{
  "volta": { "node": "20.18.1" },
  "dependencies": {...}
}
```

**Prevention:**
- Always run JSON validation in Section 2d-i Step 2
- Use jq or node to detect duplicates
- Never skip syntax validation

**Time Impact:**
- Fix time: 2 minutes
- Skip cost: Hours (cryptic error, hard to debug)

**Related Patterns:** [Lock file drift](#pattern-lock-file-drift)

**Example from playbook:** See playbook example "Invalid JSON with duplicate keys after merge"

---

## Pattern: Peer Dependency Version Mismatch {#pattern-peer-deps}

**Tags:** `package.json`, `build-breaking`, `high-frequency`, `critical`

**Symptoms:**
- npm ERESOLVE errors during install
- "Conflicting peer dependency" messages
- Build fails with "Can't resolve '@ngrx/signals'"

**Root Cause:**
- Installed peer deps for wrong framework version
- Example: Angular 19 project but installed @ngrx 21.x packages
- Peer deps require Angular 21 but project has Angular 19

**Detection:**
```bash
npm install --legacy-peer-deps
# Fails with: ERESOLVE could not resolve - @angular-architects/ngrx-toolkit@21.0.0 requires @angular/common ^21.0.0
```

**Resolution:**
See [Section 2d-ii Step 6](#step-6-verify-and-install-peer-dependencies) (Check framework version, install matching peer deps)

**Decision Logic:**
- Check framework version in package.json
- Find peer dep versions that match framework major version
- Install matching versions, not latest

**Example:**
```bash
# WRONG: Installed @ngrx 21.x with Angular 19
npm install @ngrx/signals@21.0.1 @angular-architects/ngrx-toolkit@21.0.0

# RIGHT: Installed @ngrx 19.x to match Angular 19
npm install @ngrx/signals@19.0.0 @angular-architects/ngrx-toolkit@19.4.3
```

**Prevention:**
- Always check framework version before installing peer deps
- Use `npm info <package>@<version> peerDependencies` to verify compatibility
- Match peer dep major version to framework major version

**Time Impact:**
- Fix time: 5 minutes
- Skip cost: 30-60 minutes debugging ERESOLVE errors

**Related Patterns:** [Missing devDeps](#pattern-missing-devdeps), [Lock file drift](#pattern-lock-file-drift)

**Example from playbook:** See playbook example "Wrong peer dependency versions causing ERESOLVE conflicts"

---

## Pattern: Missing Critical devDependencies {#pattern-missing-devdeps}

**Tags:** `package.json`, `build-breaking`, `high-frequency`, `critical`

**Symptoms:**
- Build fails: "Could not find the '@angular-devkit/build-angular:browser' builder's node package"
- Commands in package.json scripts fail: "ng: command not found"

**Root Cause:**
- Target branch has incomplete framework upgrade
- Example: Angular 19 but missing @angular-devkit/build-angular
- Lock file regeneration removed package from node_modules

**Detection:**
```bash
npm run build
# Fails with: Could not find builder's node package
```

**Resolution:**
See [Section 2d-ii Step 4](#step-4-check-for-missing-critical-devdependencies) (Compare source/target devDeps, add missing packages)

**Decision Logic:**
- Compare source and target devDependencies
- If source has build tool and target doesn't: Add it
- Match target's framework version, not source's version

**Example:**
```
Source (2503.1.0): "@angular-devkit/build-angular": "^15.2.11"
Target (2509.1.0): (missing)
Resolution: Add "@angular-devkit/build-angular": "19.2.14" (match Angular 19, not source's 15.x)
```

**Prevention:**
- Always compare source/target devDependencies after package.json conflicts
- Check package.json "scripts" to identify required packages
- Verify build tools are in devDependencies, not just node_modules

**Time Impact:**
- Fix time: 3 minutes
- Skip cost: 30-60 minutes debugging build failures

**Related Patterns:** [Peer deps](#pattern-peer-deps), [Lock file drift](#pattern-lock-file-drift)

**Example from playbook:** See playbook example "Missing critical devDependency after package.json conflict resolution"

---

## Pattern: NuGet Transitive Dependency Conflict {#pattern-nuget-transitive}

**Tags:** `.csproj`, `compile-error`, `medium-frequency`, `high-severity`

**Symptoms:**
- dotnet restore fails: "NU1605: Detected package downgrade: System.Text.Json from 8.0.5 to 6.0.10"
- Build fails with NuGet version conflict errors

**Root Cause:**
- Main project upgraded package to 8.0.5
- Test project still references 6.0.10
- NuGet sees this as package downgrade via transitive dependency

**Detection:**
```bash
dotnet restore Tests/MyApp.UnitTest/MyApp.UnitTest.csproj
# Fails with: NU1605 error
```

**Resolution:**
See [Section 2d-ii Step 5](#step-5-netnuget-package-version-consistency-if-csproj-changed) (Find dependent projects, update package versions)

**Decision Logic:**
- Find all projects that reference the modified project
- Update their PackageReference to match or exceed modified project's version
- Use highest version across all projects

**Example:**
```
MyApp.API.csproj: System.Text.Json 8.0.5 (upgraded during merge)
MyApp.UnitTest.csproj: System.Text.Json 6.0.10 (existing)
→ Update test project to 8.0.5
```

**Prevention:**
- Always check dependent projects after .csproj PackageReference changes
- Use `dotnet restore` to detect NU1605 errors before committing
- Document NuGet version updates in merge commit

**Time Impact:**
- Fix time: 5 minutes
- Skip cost: 30-60 minutes debugging NuGet errors

**Related Patterns:** [Cross-file .csproj refs](#pattern-cross-file-csproj)

**Example from playbook:** See playbook example "NuGet package version mismatch causing transitive dependency conflict"

---

## Pattern: Test Parameter Mismatch {#pattern-test-mismatch}

**Tags:** `test-files`, `compile-error`, `medium-frequency`, `high-severity`

**Symptoms:**
- Compile error: "CS0117 'WfParameters' does not contain a definition for 'CTDisplay'"
- Test uses properties/methods that don't exist in target branch

**Root Cause:**
- Target branch refactored and removed properties
- Source branch test still uses old properties
- Conflict resolution kept source's test code without checking target's API

**Detection:**
```bash
dotnet build Tests/MyApp.IntegrationTests/...
# Fails with: CS0117 error
```

**Resolution:**
See Playbook Rule #5 (Test & Validation - Verify referenced properties exist in target branch)

**Decision Logic:**
- Check target branch version of the class being tested
- Remove property/method references that don't exist in target
- Update test parameters to match target's API

**Example:**
```csharp
// Source branch test
var params = new WfParameters { CTDisplay = "DUMMY", curr_facility = "X" };

// Target branch: WfParameters doesn't have CTDisplay or curr_facility

// Resolution: Remove those properties
var params = new WfParameters { /* only properties that exist in target */ };
```

**Prevention:**
- Always compare test file against target branch's API
- Don't blindly keep source's test code
- Verify all referenced properties/methods exist in target

**Time Impact:**
- Fix time: 5 minutes
- Skip cost: 30 minutes debugging compile errors

**Related Patterns:** [Duplicate imports](#pattern-duplicate-imports)

**Example from playbook:** See playbook example "Test file merge conflict with removed property reference"

---

## Pattern: Cross-File .csproj References {#pattern-cross-file-csproj}

**Tags:** `.csproj`, `build-breaking`, `medium-frequency`, `critical`

**Symptoms:**
- MSBuild fails: "Could not find file node_modules\xlsx\dist\xlsx.full.min.js"
- .csproj references files from packages not in package.json

**Root Cause:**
- package.json replaced dependency (e.g., xlsx → exceljs)
- .csproj still references old package's files
- MSBuild can't find files during build

**Detection:**
```bash
msbuild MyApp.Web/MyApp.Web.csproj /p:Configuration=Release
# Fails with: Could not find file
```

**Resolution:**
See [Section 2d-ii Step 2](#step-2-check-cross-file-references) (Check .csproj for node_modules refs, update to match package.json)

**Decision Logic:**
- If package.json has exceljs but .csproj references xlsx: Update .csproj
- Verify file paths exist after npm install
- Stage both package.json and .csproj changes together

**Example:**
```xml
<!-- BEFORE (references old package) -->
<Content Include="node_modules\xlsx\dist\xlsx.full.min.js" />

<!-- AFTER (references new package) -->
<Content Include="node_modules\exceljs\dist\exceljs.min.js" />
```

**Prevention:**
- Always check .csproj files when package.json dependencies change
- Use `grep -r "node_modules" **/*.csproj` to find references
- Update references immediately after resolving package.json conflicts

**Time Impact:**
- Fix time: 3 minutes
- Skip cost: 30 minutes debugging MSBuild errors

**Related Patterns:** [Lock file drift](#pattern-lock-file-drift), [Missing devDeps](#pattern-missing-devdeps)

**Example from playbook:** See playbook example "Package dependency replacement (xlsx → exceljs)"

---

## Pattern: Duplicate Imports {#pattern-duplicate-imports}

**Tags:** `code-files`, `warning`, `low-frequency`, `medium-severity`

**Symptoms:**
- Build warning: "CS0105 'The using directive appeared previously in this namespace'"
- Duplicate import/using statements in file

**Root Cause:**
- Conflict resolution created duplicate imports
- Both sides of conflict had same import
- Agent didn't check for duplicates before staging

**Detection:**
```bash
grep "^using " <file> | sort | uniq -d
# OR
grep "^import " <file> | sort | uniq -d
```

**Resolution:**
See [Section 2d-i Step 3](#step-3-check-for-duplicate-importsusing-blocking) (Check for duplicates, remove extras)

**Decision Logic:**
- Keep only one instance of each import/using
- Remove duplicates immediately after resolving conflict

**Example:**
```csharp
// BEFORE (duplicate)
using MyApp.Extensions;
using System.Linq;
using MyApp.Extensions;  // Duplicate!

// AFTER (cleaned)
using MyApp.Extensions;
using System.Linq;
```

**Prevention:**
- Always run duplicate check in Section 2d-i Step 3
- Check for duplicates before staging

**Time Impact:**
- Fix time: 1 minute
- Skip cost: 5 minutes (warning clutter)

**Related Patterns:** [Test parameter mismatch](#pattern-test-mismatch)

**Example from playbook:** See playbook example "Duplicate import statements from merge conflict"

---

## Top 10 Mistakes Summary

Based on real merge-forward experiences:

1. 🔴 **Not regenerating lock files after package.json changes** → Guaranteed CI/CD failure
2. 🔴 **Not checking for duplicate JSON keys** → Cryptic Volta/npm errors
3. 🔴 **Wrong peer dependency versions** (e.g., @ngrx 21.x with Angular 19) → ERESOLVE errors
4. 🔴 **Missing critical devDependencies after merge** → Build failures
5. 🔴 **Not updating .csproj when package.json dependencies change** → MSBuild failures
6. 🟡 **Skipping formatter before committing** → Pre-commit hook failures
7. 🟡 **Not checking test parameters against target branch** → Compile errors
8. 🟡 **@types/node incompatible with TypeScript version** → TS2320 errors
9. 🟡 **NuGet package version mismatches in dependent projects** → NU1605 errors
10. 🟡 **Not removing duplicate using/import statements** → CS0105 warnings

---

# 6. Playbook Rules Reference

## Rule #1: Bug Fixes Take Priority
- If incoming change fixes a bug, keep the fix logic
- If target branch refactored the area, apply the fix to the new structure
- Never silently drop a fix

## Rule #2: Behavior Changes Must Survive
- Security patches, validation, error handling → always keep
- Logic corrections, edge case handling → always keep
- If both sides changed behavior, keep incoming fix + document conflict

## Rule #3: Refactors vs Fixes
- Pure refactors (renames, reorganization, style) → target branch wins
- Fix in old structure → adapt fix to new structure
- When in doubt, apply the fix logic explicitly

## Rule #4: Code Structure Conflicts
- Target branch has newer architecture → use its structure
- Apply incoming logic changes within that structure
- Delete dead code; don't keep both versions

## Rule #5: Test & Validation
- Always preserve test coverage for fixes
- Update test structure to match target branch patterns
- Verify referenced properties/methods/fields exist in target branch
- Build conflict-affected projects immediately after resolving conflicts
- Never skip pre-staging verification checklist

## Rule #6: Documentation
- Log every non-trivial resolution decision
- Note any fix that required restructuring
- Flag anything that needs manual review

## Rule #7: Dependency Consistency Across Files
- Always regenerate lock files after package.json changes
- Check .csproj for node_modules references matching package.json
- Validate JSON files for duplicate keys
- Check test/dependent .csproj when main project PackageReference changes
- Verify peer dependency versions match framework version
- Compare devDependencies to catch missing build tools

---

# Appendix: Migration from Old Instructions

**For agents familiar with the old instructions:**

The content is the same, just reorganized:

- **Quick Reference Card:** New - use this for fast lookup
- **Agent Philosophy:** New - explains why process compliance matters
- **Pre-Flight Checklist:** New - commitment before starting
- **TL;DR sections:** New - quick summaries at start of each step
- **STOP gates:** New - verification points before proceeding
- **Anti-Skip Warnings:** New - catches rationalization traps
- **Common Patterns:** New - searchable troubleshooting guide
- **Detailed Procedures:** Same content as old instructions, just moved to separate section
- **Playbook examples:** Same examples, now cross-referenced to instructions

**Navigation:**
- Use Quick Reference Card for commands
- Read TL;DR for quick understanding
- Jump to Detailed Procedures when needed
- Check Common Patterns when stuck
