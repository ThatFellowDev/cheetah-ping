<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Mobile-First Design (mandatory)

Every page and component must deliver a clean, high-end experience on mobile. Design for **360px minimum width** and scale up.

- **Write mobile-first Tailwind**: start with the base (mobile) styles, then layer on `sm:`, `md:`, `lg:` breakpoints for larger screens.
- **44px minimum touch targets**: all buttons, links, and interactive elements must be at least 44×44px on mobile.
- **No horizontal overflow**: nothing should cause a horizontal scrollbar. Use `truncate`, `overflow-hidden`, or `overflow-x-auto` (for tables) as needed.
- **Hide secondary info on mobile**: use `hidden sm:block` / `hidden md:flex` to hide non-essential details on small screens rather than letting them wrap or overflow.
- **Tables → cards on mobile**: large data tables must either scroll horizontally with `overflow-x-auto` or restructure into stacked cards on small screens.
- **Test at 375px**: mentally (or in DevTools) verify every layout works at 375px before shipping.

# Think in chains, not patches

Before declaring any fix, recommendation, or plan complete, run this 3-question check. It costs almost nothing and catches embarrassing misses that would otherwise need a second pass. Each question is paired with a real example from this project showing the wrong path and the right one. Pattern-match against the examples, not just the rules.

## 1. Instance or class?
Is this the whole problem, or one instance of a wider bug class? When fixing one hallucinated AI field, audit every AI field in the same response. When fixing one selector, look for siblings with the same validation gap. Fix the class, not just the instance.

*Wrong path:* User flags a `selectorSuggestions` contradiction where the AI labels a selector "Reliable" but the live validator shows 0 matches. I add server-side cheerio validation for that one array and ship. User comes back: "what about the other AI fields?" I audit and find the primary `selector`, `keyword`, `watchMode`, and `suggestedFrequencyMinutes` all had the identical unvalidated-AI-output bug in the same response block. Two passes where one would have sufficed.

*Right path:* User flags a `selectorSuggestions` contradiction. I fix that array, then immediately re-read the surrounding response block and grep for every other AI-sourced field. I validate each one against ground truth (DOM via cheerio, page text via substring match, enums via known value sets, numbers via clamping to known-valid options). I ship the whole class fix in one pass.

## 2. What assumed the old behavior?
Swapping a dependency (model, library, API, service) means every code path that relied on its old properties is now suspect. Swapping an AI model in particular implies re-auditing output validation, because hallucination modes differ per model. Library version bumps imply a breaking-change audit.

*Wrong path:* User asks to swap the Groq model from `llama-3.3-70b-versatile` to `openai/gpt-oss-120b` because it is smarter and cheaper. I change two lines and declare it done. Two turns later, the same conversation surfaces a hallucinated selector bug that would have been visible had I thought about the swap's downstream implications.

*Right path:* I change the two lines, then immediately ask "different model means different hallucination modes. What code paths consume AI output? Is the validation still adequate against the new model's failure patterns?" I trace the chain: model swap → new hallucination modes → existing output validation may have been tuned to the old model's tendencies → audit every AI-consuming code path now. I do the hallucination audit in the same turn as the swap.

## 3. Is the user's own tool the answer?
Before reaching for external infra (crons, GitHub Actions, Zapier, third-party services), check whether the user already owns a tool that solves the problem. Cheetah Ping is a webpage change monitor, so "watch this URL for changes" problems have an obvious in-house answer. Dogfood first.

*Wrong path:* User says "I want to keep up with Groq model changes over time." I propose (a) a 7-day Claude Code cron, (b) a GitHub Action that fetches Groq docs on a schedule, (c) a manual slash command the user runs on demand. I compare trade-offs of all three external solutions. User has to point out that Cheetah Ping is literally a webpage change monitor and this is a textbook dogfood case.

*Right path:* User says "I want to keep up with Groq model changes over time." I ask "is this a Cheetah Ping use case?" immediately. Yes, it is. I recommend creating a monitor on `https://console.groq.com/docs/models` with weekly frequency and an intent like "alert me when models change, prices drop, or deprecations happen." I flag the JS-rendering requirement (Browserless path) as a constraint. The user creates it in 60 seconds in their own app, which also surfaces real UX friction on a high-value URL.

## Why this works

These are cheap, fast questions. Ask them every time before shipping. They are the difference between patching symptoms and actually solving problems, and between suggesting external plumbing and recognising the product you already built. The worked examples above are not hypothetical. They are real misses from this project's session history and are the pattern-match hooks to avoid repeating them.

# Writing style

- **No em-dashes in user-facing copy.** UI strings, marketing text, page titles, alert summaries, button labels, tooltips, and placeholder examples use periods, commas, colons, or pipes instead. Em-dashes are a classic AI-writing tell and the product's voice should read as authentically human.
