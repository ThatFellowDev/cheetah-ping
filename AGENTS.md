<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Mobile-First Design (mandatory)

Every page and component must deliver a clean, high-end experience on mobile. Design for **360px minimum width** and scale up.

- **Write mobile-first Tailwind** — start with the base (mobile) styles, then layer on `sm:`, `md:`, `lg:` breakpoints for larger screens.
- **44px minimum touch targets** — all buttons, links, and interactive elements must be at least 44×44px on mobile.
- **No horizontal overflow** — nothing should cause a horizontal scrollbar. Use `truncate`, `overflow-hidden`, or `overflow-x-auto` (for tables) as needed.
- **Hide secondary info on mobile** — use `hidden sm:block` / `hidden md:flex` to hide non-essential details on small screens rather than letting them wrap or overflow.
- **Tables → cards on mobile** — large data tables must either scroll horizontally with `overflow-x-auto` or restructure into stacked cards on small screens.
- **Test at 375px** — mentally (or in DevTools) verify every layout works at 375px before shipping.
