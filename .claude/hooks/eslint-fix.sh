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
