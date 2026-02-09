# 4. Detailed Procedures

## Detailed: Conflict Resolution {#detailed-conflict-resolution}

[Content from original instructions for detailed conflict resolution steps]

This section provides expanded explanations for agents that need more context.

---

## Detailed 2d-i: Pre-Staging Verification

### Step 1: Conflict Markers {#detailed-2di-step1-conflict-markers}

**Command:**
```bash
grep -n "<<<<<<< HEAD\|=======\|>>>>>>> " <file>
```

**Expected output:** (nothing)

**If markers found:**
1. Open the file in editor
2. Manually resolve the conflict
3. Re-run grep test
4. Only proceed when grep returns nothing

**Why this is critical:**
- Conflict markers cause build failures
- Indicate incomplete resolution
- Will break CI/CD pipeline

**Common locations for missed markers:**
- End of files (easy to miss during resolution)
- Middle of large files
- After complex multi-section conflicts

---

### Step 2: Syntax Validation {#detailed-2di-step2-syntax}

#### For JSON files (package.json, tsconfig.json, etc.)

**Command:**
```bash
# Method 1: Using jq
jq empty <file> 2>&1

# Method 2: Using node
node -e "require('./<file>')" 2>&1
```

**Expected output:** (nothing)

**If syntax error:**
1. Read the error message for line number
2. Open file and fix syntax error
3. Common issues: trailing commas, missing brackets, unquoted strings
4. Re-run validation
5. Only proceed when validation passes

**Check for duplicate JSON keys:**
```bash
# Using node (works on Windows)
node -e "const fs=require('fs'); const content=fs.readFileSync('<file>','utf8'); const keys={}; JSON.parse(content,(key,val)=>{if(key&&keys[key])console.error('Duplicate:',key); keys[key]=1; return val})"

# Expected output: (nothing)
```

**If duplicates found:**
1. Identify which duplicate to keep:
   - Rule #4: Target branch (newer architecture) wins
   - Unless Rule #1: Source has critical bug fix
2. Remove the other duplicate
3. Re-validate with jq/node
4. Document which version kept and why

**Common duplicate keys:**
- `volta` (appears with different node versions)
- `dependencies` or `devDependencies` (both branches added section)
- Properties defined in both source and target

**Why this is critical:**
- Duplicate keys break JSON parsers
- Volta, npm, and other tools will fail
- Error messages are cryptic (just says "duplicate field")
- Blocks entire build pipeline

---

### Step 3: Duplicate Imports/Using {#detailed-2di-step3-duplicates}

**For C# files:**
```bash
grep "^using " <file> | sort | uniq -d
# Expected output: (nothing)
```

**For TypeScript/JavaScript files:**
```bash
grep "^import " <file> | sort | uniq -d
# Expected output: (nothing)
```

**If duplicates found:**
1. Open the file
2. Remove duplicate import/using statements
3. Keep only one instance
4. Re-run the grep test

**Common duplicate patterns:**
- `using System.Linq;` appears twice
- `using System.Threading.Tasks;` appears twice
- `import { Component } from '@angular/core';` appears twice

**Why this matters:**
- Build warnings (CS0105 for C#)
- Code clutter
- Indicates sloppy conflict resolution

---

### Step 4: Formatter {#detailed-2di-step4-formatter}

**For TypeScript/JavaScript/HTML/SCSS files:**
```bash
cd <project-directory>

# Check if prettier is available
if [ -f ".prettierrc" ] || grep -q "prettier" package.json; then
  # Run prettier on the specific file
  npx prettier --write <file>

  # Verify formatting worked
  npx prettier --check <file>
fi
```

**For C# files (if dotnet format is available):**
```bash
dotnet format <file> --verify-no-changes
```

**Why critical:**
- Formatter failures in CI/CD block merges
- Formatting should be part of conflict resolution, not deferred to build phase
- Pre-commit hooks will fail if code isn't formatted

**If formatting fails:**
1. Review the error message
2. Fix formatting issues manually
3. Re-run formatter
4. Only proceed when formatter succeeds

---

### Step 5: Inspect Staged Changes {#detailed-2di-step5-inspect}

```bash
# Stage the file first
git add <file>

# Then inspect exactly what will be committed
git diff --cached <file>

# Verify:
# ✓ No conflict markers (<<<, ===, >>>)
# ✓ Changes look reasonable
# ✓ No unexpected modifications
# ✓ Formatting is clean

# If anything looks wrong:
git reset <file>  # Unstage
# Fix the issue
git add <file>    # Re-stage
```

**What to look for:**
- Conflict markers (<<<<<<< HEAD, =======, >>>>>>>)
- Unexpected code deletions
- Duplicate code blocks
- Formatting inconsistencies
- Logic errors introduced during merge

**Why this step matters:**
- Final sanity check before committing
- Catches issues that automated checks miss
- Ensures merge quality

---

## Detailed 2d-ii: Cross-File Consistency

### Lock Files {#detailed-2dii-lock-files}

[Expanded explanation of lock file regeneration, common issues, troubleshooting]

### Cross-File References {#detailed-2dii-cross-file}

[Expanded explanation of checking .csproj, webpack configs, tsconfig, etc.]

### JSON Integrity {#detailed-2dii-json-integrity}

[Expanded explanation of duplicate key detection and resolution]

### Missing devDependencies {#detailed-2dii-devdeps}

[Expanded explanation of comparing devDependencies, identifying missing packages]

### NuGet Consistency {#detailed-2dii-nuget}

[Expanded explanation of transitive dependency conflicts, NU1605 errors]

### Peer Dependencies {#detailed-2dii-peer-deps}

[Expanded explanation of peer dependency version matching, ERESOLVE errors]

---

## Detailed 2e: Build Commands

[Expanded build command examples for each project type, troubleshooting common build errors]

---
