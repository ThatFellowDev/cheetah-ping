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
