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
