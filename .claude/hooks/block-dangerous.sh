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
