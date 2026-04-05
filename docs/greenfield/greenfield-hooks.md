# Claude Code Hooks - Ready to Copy

Battle-tested hook scripts for Claude Code safety, code quality, and auditing. Copy these into your project's `.claude/hooks/` directory.

For theory on why hooks matter (and token math), see `greenfield-claude-optimization-2026.md` > "Hooks vs Rules" section.

---

## Installation

```bash
mkdir -p .claude/hooks
# Copy each script below into .claude/hooks/
# Copy settings.json template to .claude/settings.json
chmod +x .claude/hooks/*.sh
git add .claude/
git commit -m "Add Claude Code safety hooks"
```

---

## Universal Hooks (Every Project)

These three have zero downside and prevent catastrophic mistakes.

### 1. block-dangerous.sh

Blocks destructive commands before they execute. PreToolUse hook on Bash.

```bash
#!/usr/bin/env bash
set -euo pipefail

# Read JSON input from stdin
INPUT=$(cat)
CMD=$(echo "$INPUT" | node -e "
  let d='';
  process.stdin.on('data', c => d += c);
  process.stdin.on('end', () => {
    try { console.log(JSON.parse(d).tool_input.command || ''); }
    catch { console.log(''); }
  });
")

# Patterns that are almost always catastrophic mistakes
PATTERNS='(rm\s+-rf\s+[/~.]|git\s+reset\s+--hard|git\s+push\s+.*--force|git\s+clean\s+-fd|DROP\s+(TABLE|DATABASE)|TRUNCATE\s+TABLE|curl\s.*\|\s*(ba)?sh|wget\s.*\|\s*(ba)?sh)'

if echo "$CMD" | grep -qiE "$PATTERNS"; then
  echo "BLOCKED: Dangerous command detected." >&2
  echo "Command: $CMD" >&2
  echo "Propose a safer alternative." >&2
  exit 2
fi

exit 0
```

### 2. protect-files.sh

Hard-blocks writes to sensitive files. PreToolUse hook on Write/Edit.

```bash
#!/usr/bin/env bash
set -euo pipefail

# Read JSON input from stdin
INPUT=$(cat)
FILE=$(echo "$INPUT" | node -e "
  let d='';
  process.stdin.on('data', c => d += c);
  process.stdin.on('end', () => {
    try {
      const o = JSON.parse(d);
      console.log(o.tool_input.file_path || o.tool_input.filePath || '');
    } catch { console.log(''); }
  });
")

BASENAME=$(basename "$FILE")

# Hard-block env files
case "$BASENAME" in
  .env|.env.production|.env.local|.env.development|.env.staging)
    echo "BLOCKED: Cannot write to $BASENAME. Edit environment files manually." >&2
    exit 2 ;;
esac

# Hard-block certificates and keys
case "$FILE" in
  *.pem|*.key)
    echo "BLOCKED: Cannot write to certificate/key files." >&2
    exit 2 ;;
esac

# Hard-block settings.json (prevent hooks from modifying themselves)
case "$FILE" in
  */.claude/settings.json|*\\.claude\\settings.json)
    echo "BLOCKED: Cannot modify .claude/settings.json via hooks. Edit it manually." >&2
    exit 2 ;;
esac

exit 0
```

### 3. log-commands.sh

Timestamps every command to an audit log outside the repo. PreToolUse hook on Bash (async).

```bash
#!/usr/bin/env bash

# Read JSON input from stdin
INPUT=$(cat)
CMD=$(echo "$INPUT" | node -e "
  let d='';
  process.stdin.on('data', c => d += c);
  process.stdin.on('end', () => {
    try { console.log(JSON.parse(d).tool_input.command || ''); }
    catch { console.log(''); }
  });
")

# Append timestamped command to log file (outside repo)
LOG_DIR="$HOME/.claude"
mkdir -p "$LOG_DIR"
printf '%s %s\n' "$(date -Is)" "$CMD" >> "$LOG_DIR/command-log.txt"

exit 0
```

---

## Stack-Specific Hooks

Add these based on your project's stack.

### 4. eslint-fix.sh

Auto-fixes JS/TS files after Claude edits them. PostToolUse hook on Write/Edit.

```bash
#!/usr/bin/env bash

# Read JSON input from stdin
INPUT=$(cat)
FILE=$(echo "$INPUT" | node -e "
  let d='';
  process.stdin.on('data', c => d += c);
  process.stdin.on('end', () => {
    try { console.log(JSON.parse(d).tool_input.file_path || ''); }
    catch { console.log(''); }
  });
")

# Only lint JS/TS files
case "$FILE" in
  *.ts|*.tsx|*.js|*.jsx|*.mjs)
    # Auto-fix what we can
    npx eslint --fix "$FILE" 2>/dev/null || true

    # Report remaining errors back to Claude
    ERRORS=$(npx eslint "$FILE" 2>/dev/null || true)
    if [ -n "$ERRORS" ]; then
      echo "ESLint errors remaining in $FILE:"
      echo "$ERRORS" | tail -15
    fi
    ;;
esac

exit 0
```

### 5. drizzle-generate.sh

Auto-generates Drizzle migration files when the schema is edited. PostToolUse hook on Write/Edit.

> **Safety note:** This runs `drizzle-kit generate` which creates local migration SQL files. It does NOT run `drizzle-kit push` (which modifies the database). You push manually when ready.

```bash
#!/usr/bin/env bash

# Read JSON input from stdin
INPUT=$(cat)
FILE=$(echo "$INPUT" | node -e "
  let d='';
  process.stdin.on('data', c => d += c);
  process.stdin.on('end', () => {
    try { console.log(JSON.parse(d).tool_input.file_path || ''); }
    catch { console.log(''); }
  });
")

# Only trigger on Drizzle schema file edits
case "$FILE" in
  */database/schema.ts|*/database/schema/*.ts)
    npx drizzle-kit generate 2>&1
    if [ $? -eq 0 ]; then
      echo "Drizzle migration generated. Run 'pnpm drizzle-kit push' when ready to apply."
    else
      echo "WARNING: Drizzle generate failed. Check schema for errors."
    fi
    ;;
esac

exit 0
```

---

## Starter settings.json

Copy this to `.claude/settings.json` in your project root:

```json
{
  "attribution": {
    "commit": "",
    "pr": ""
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR/.claude/hooks/block-dangerous.sh\"",
            "timeout": 5
          },
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR/.claude/hooks/log-commands.sh\"",
            "timeout": 5,
            "async": true
          }
        ]
      },
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR/.claude/hooks/protect-files.sh\"",
            "timeout": 5
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR/.claude/hooks/eslint-fix.sh\"",
            "timeout": 30
          },
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR/.claude/hooks/drizzle-generate.sh\"",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

---

## Hook Reference

| Script | Event | Matcher | What It Does |
|--------|-------|---------|-------------|
| `block-dangerous.sh` | PreToolUse | Bash | Blocks rm -rf, force push, DROP TABLE, pipe-to-shell |
| `protect-files.sh` | PreToolUse | Write/Edit | Blocks writes to .env*, *.pem, *.key, settings.json |
| `log-commands.sh` | PreToolUse (async) | Bash | Timestamps commands to ~/.claude/command-log.txt |
| `eslint-fix.sh` | PostToolUse | Write/Edit | Auto-fixes JS/TS files, reports remaining errors |
| `drizzle-generate.sh` | PostToolUse | Write/Edit | Generates migration files on schema.ts changes |

---

## Customization

**To add Biome instead of ESLint:** Replace `npx eslint --fix` with `npx biome check --write` in `eslint-fix.sh`.

**To add Vitest after edits:** Create a new PostToolUse hook that runs `npx vitest run --reporter=verbose` on test file changes. Only viable if tests run in <5 seconds.

**To add Prettier:** Chain with ESLint: `npx eslint --fix "$FILE" && npx prettier --write "$FILE"`.

---

*Last updated: April 2026*
*Companion to: greenfield-stack-2026.md, greenfield-claude-optimization-2026.md*
