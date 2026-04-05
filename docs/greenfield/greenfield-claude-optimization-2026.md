# Claude Code Optimization Guide - 2026

How to get higher quality output, less troubleshooting, and more efficient token usage from Claude Code. Companion to `greenfield-stack-2026.md` and `greenfield-launch-playbook-2026.md`.

---

## Core Principle

Every token spent should either produce code or prevent a mistake. Tokens spent troubleshooting, re-reading files, re-explaining context, or recovering from preventable errors are waste. The goal: idea to implementation in the fewest turns possible.

---

## 1. Context Loading - What Burns Tokens Automatically

Every Claude Code session auto-loads these into context before you say anything:

| Source | Loaded When | Token Impact |
|--------|------------|--------------|
| `CLAUDE.md` | Every session | Always loaded. Keep concise. |
| `AGENTS.md` | Every session (if referenced by CLAUDE.md) | Minimal if short |
| `MEMORY.md` index | Every session | One line per memory entry |
| Memory files | When relevant to the conversation | Loaded on demand by Claude |
| `.claude/settings.json` | Every session (permissions + hooks config) | Structural, not large |
| Git status | Start of session | Snapshot, small |
| Skills | Loaded as system reminders listing available skills | Names only until invoked |
| MCP servers | Tool definitions loaded at start | Schema only, tools invoked on demand |

**What is NOT auto-loaded (read on demand):**
- Reference docs (e.g., `docs/brain/*.md`) - only loaded when Claude reads them
- Source code files - only loaded when read
- Package.json, config files - only loaded when read

### Optimization: Keep CLAUDE.md Under 150 Lines

CLAUDE.md is loaded every single session. Every line costs tokens every time. Rules should be:
- **Concise** - one line per rule where possible, not paragraphs
- **Actionable** - "Use Zod for validation" not "We believe in type safety and have chosen Zod because..."
- **Non-redundant** - if a rule is enforced by a hook, it doesn't need to be in CLAUDE.md too
- **Reference, don't inline** - point to docs (`see docs/brain/api-surface.md`) instead of duplicating content

**Bad (wastes tokens every session):**
```markdown
## API Validation
When building API routes, always use Zod schemas for input validation. 
This ensures type safety and prevents invalid data from reaching your 
database. Zod integrates well with our stack and provides excellent 
error messages. Never trust client input without validation.
```

**Good (same rule, fewer tokens):**
```markdown
- **Validation**: Zod schemas for all API input. No exceptions.
```

### Optimization: Reference Docs On Demand

Structure your documentation so detailed references are in separate files:
```
CLAUDE.md          <- Rules only (~100-150 lines, always loaded)
docs/brain/        <- Detailed references (loaded when needed)
  entity-map.md    <- Only loaded when working on data models
  api-surface.md   <- Only loaded when working on API routes
  ui-map.md        <- Only loaded when working on frontend
```

In CLAUDE.md, point to them:
```markdown
## Codebase Reference (read on demand, NOT auto-loaded)
- `docs/brain/entity-map.md` - Entity relationships, status lifecycles
- `docs/brain/api-surface.md` - Complete API endpoint reference
```

This way Claude only loads the 200-line entity map when actually working on data models, not on every session about CSS tweaks.

---

## 2. Hooks vs Rules - Mechanical Enforcement Saves Tokens

Every CLAUDE.md rule that Claude forgets costs a correction cycle:
1. Claude makes the mistake (tokens spent writing wrong code)
2. You notice and tell Claude (tokens spent on your message)
3. Claude re-reads the file and fixes it (tokens spent re-reading + rewriting)

That's 3x the token cost of doing it right the first time.

**Hooks eliminate entire categories of correction cycles:**

| Rule in CLAUDE.md | Enforced by Hook | Correction cycles saved |
|---|---|---|
| "Always run ESLint" | `eslint-fix.sh` (PostToolUse) | Auto-fixes on every edit. Zero conversation. |
| "Never edit .env files" | `protect-files.sh` (PreToolUse) | Hard-blocked. No discussion needed. |
| "No AI attribution in commits" | `attribution` setting | Mechanical. Can't forget. |
| "Run drizzle-kit generate after schema changes" | `drizzle-generate.sh` (PostToolUse) | Auto-runs. No reminder needed. |

> See `greenfield-hooks.md` for complete, ready-to-copy hook scripts and starter `settings.json` template.

**Token math example:**
- Without hook: Claude writes file (500 tokens) + you say "run eslint" (20 tokens) + Claude reads file again (500 tokens) + fixes (200 tokens) = **1,220 tokens**
- With hook: Claude writes file (500 tokens) + hook auto-fixes (0 conversation tokens) = **500 tokens**
- Savings: **~60% per edit cycle**

**Rules that SHOULD stay in CLAUDE.md** (can't be mechanically enforced):
- Design philosophy ("inline editing, no /edit pages")
- Architecture decisions ("scope all queries with organizationId")
- UX patterns ("use ConfirmDialog for deletes")
- Business logic ("snapshot client name on invoice creation")

These require judgment, not automation. Keep them as rules.

---

## 3. Prompt Patterns - Specificity Reduces Waste

The #1 cause of wasted tokens is vague prompts that lead to false starts.

### Be Specific About Location

**Expensive (vague):**
> "The login is broken, fix it"
> Claude reads 5 files searching for the issue, tries 2 wrong approaches, then finds it. ~5,000 tokens wasted exploring.

**Cheap (specific):**
> "The magic link auth in src/modules/auth/auth.ts is returning 500 when the token expires. Fix the expiry check."
> Claude reads 1 file, fixes the exact issue. ~800 tokens.

### Be Specific About Scope

**Expensive (open-ended):**
> "Improve the dashboard"
> Claude explores 10 files, proposes 8 changes, you only wanted 2. ~8,000 tokens, mostly wasted.

**Cheap (scoped):**
> "Add a revenue chart to the dashboard using the existing invoice data. Use Recharts, match the card style in the rest of the page."
> Claude reads 2 files, implements exactly what you want. ~2,000 tokens.

### Reference Files and Lines

When you know where the problem is, say so:
- "In `src/shared/lib/status-colors.ts`, add a color for the new CANCELLED status"
- "The API route at `src/app/api/invoices/route.ts:45` is missing org scoping"
- "Match the card layout from `src/app/(dashboard)/clients/page.tsx`"

Every file path you provide is a file Claude doesn't have to search for.

### Use Plan Mode for Big Tasks

For multi-file features, use `/plan` before implementing. Plan mode:
1. Explores the codebase (read-only, cheaper than trial-and-error)
2. Designs the approach (you review before tokens are spent coding)
3. Gets your approval (catches misunderstandings before implementation)

Without plan mode: Claude implements the wrong approach (2,000 tokens), you correct it, Claude re-implements (2,000 more tokens). With plan mode: Claude plans (500 tokens), you correct the plan (50 tokens), Claude implements correctly (2,000 tokens). **Net savings: ~1,500 tokens.**

---

## 4. Memory System - Avoid Re-Learning

Claude's memory system (`~/.claude/projects/<project>/memory/`) persists across sessions. Every lesson saved to memory is a lesson that doesn't need to be re-discovered.

### What to Save

- **Feedback corrections** - "Don't mock the database in tests" saves a wrong approach + correction cycle in every future session
- **Project decisions** - "We chose polling over WebSockets because..." prevents Claude from suggesting WebSockets again
- **User preferences** - "User prefers terse responses" prevents verbose explanations burning tokens

### What NOT to Save

- **Code patterns** - Claude can read the code. Don't store "we use Zod for validation" when it's visible in every API route.
- **File locations** - The codebase is the source of truth. Don't store "auth is in src/modules/auth/" when `find` is instant.
- **Things in CLAUDE.md** - CLAUDE.md is already loaded every session. Don't duplicate rules into memory.

### Token Math

Without memory: Claude re-discovers a pattern (200 tokens exploring) + you correct (50 tokens) + Claude re-reads and fixes (300 tokens) = **550 tokens per session**

With memory: Claude reads 1-line memory entry (10 tokens) + gets it right first time = **10 tokens per session**

Over 20 sessions, that's **10,800 tokens saved** per lesson stored in memory.

---

## 5. Agent/Subagent Patterns

Subagents (the Agent tool) are powerful but have token implications:

### When Subagents SAVE Tokens
- **Parallel exploration** - 3 agents searching different areas simultaneously vs 1 agent searching sequentially
- **Scoped research** - Agent explores and returns a summary (200 tokens) vs loading 10 full files into main context (5,000 tokens)
- **Isolation** - Agent's full exploration context is discarded after it reports back, keeping main context clean

### When Subagents WASTE Tokens
- **Simple lookups** - Using an Explore agent to find one file when `Glob` would do it in 1 call
- **Duplicate work** - Launching an agent to research something, then also researching it yourself
- **Trivial tasks** - Agent overhead (~500 tokens for setup) isn't worth it for a 100-token task

### Rule of Thumb
Use direct tools (Glob, Grep, Read) for targeted lookups. Use agents for open-ended exploration that might require 5+ searches.

---

## 6. Conversation Hygiene

### Start Fresh When Context Is Stale

After ~50 turns of conversation, the context window fills with old file reads, outdated diffs, and resolved discussions. Starting a new session with a specific prompt is often cheaper than continuing a stale conversation where Claude has to mentally filter through thousands of tokens of history.

**When to start fresh:**
- Switching to a completely different feature/area
- After a long debugging session (the resolution is in the code now, not the conversation)
- When Claude starts repeating itself or referencing outdated context

**When to continue:**
- Multi-step implementation of the same feature
- Iterating on a design or approach
- Debugging a specific issue (context of failed attempts is valuable)

### Don't Re-Read Files Unnecessarily

If Claude read a file 5 turns ago and nothing has changed, don't ask it to read it again. Claude retains file contents in context until they're compressed. If you're not sure whether Claude remembers a file, ask "do you still have the contents of X in context?" - cheaper than re-reading.

### Batch Related Changes

**Expensive (separate conversations):**
1. "Add the Invoice model" (reads schema, adds model)
2. "Add the Invoice API routes" (re-reads schema, reads existing routes, adds routes)
3. "Add the Invoice dashboard page" (re-reads everything, adds page)

**Cheap (one conversation):**
1. "Add the full Invoice feature: model, API routes, and dashboard page. Reference existing patterns from the Client entity."
Claude reads the relevant files once and implements all three. One read of `schema.ts` instead of three.

---

## 7. Skills and MCP - Load What You Need

### Skills
Skills are loaded as one-line descriptions in system reminders. They only add significant tokens when actually invoked. Having 8 skills available costs ~200 tokens of descriptions. Only invoked skills load their full prompt.

**Optimization:** Remove skills you never use. Each unused skill is ~25 tokens of dead weight per session.

### MCP Servers
MCP tool definitions are loaded at session start. Each MCP server adds tool schemas to context.

**Optimization:** Only configure MCP servers you actively use. The Vercel MCP with 6 tools adds ~300 tokens of schema. If you only use `list_deployments` and `get_runtime_logs`, that's fine - the unused tool definitions are small. But don't add MCP servers "just in case."

---

## 8. Output Settings

### Attribution Setting
```json
{ "attribution": { "commit": "", "pr": "" } }
```
Setting attribution to empty strings means Claude doesn't append "Co-Authored-By" trailers to commits or PRs. This saves ~30 tokens per commit and prevents hook-based blocking of attribution (which would cost more tokens in the block/retry cycle).

---

## Quick Reference: Token Cost Estimates

| Action | Approximate Tokens |
|--------|-------------------|
| CLAUDE.md loaded (100 lines) | ~400 |
| Memory index loaded (20 entries) | ~200 |
| Reading a 200-line file | ~800 |
| Writing a 50-line file | ~200 |
| One correction cycle (mistake + feedback + fix) | ~1,000-2,000 |
| One hook block message | ~50 |
| One ESLint hook output (clean) | ~0 |
| One ESLint hook output (errors) | ~100-200 |
| Agent setup overhead | ~500 |
| Plan mode exploration | ~1,000-3,000 |
| Plan mode saves (vs wrong implementation) | ~1,500-5,000 |

## Summary: The 80/20 of Token Efficiency

1. **Keep CLAUDE.md under 150 lines** - it's loaded every session
2. **Use hooks for enforceable rules** - prevents correction cycles
3. **Be specific in prompts** - file paths, line numbers, exact scope
4. **Save lessons to memory** - prevents re-discovery across sessions
5. **Use plan mode for big tasks** - catch mistakes before implementation
6. **Batch related work** - one conversation instead of three
7. **Reference docs on demand** - don't auto-load what you don't need
8. **Start fresh when context is stale** - cheaper than carrying dead weight

---

*Last updated: April 2026*
*Companion to: greenfield-stack-2026.md, greenfield-launch-playbook-2026.md*
