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
