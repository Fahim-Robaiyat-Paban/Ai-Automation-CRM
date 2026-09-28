# Signalboard — Facebook/Instagram page automation dashboard (frontend)

## The vision (read this before touching anything)

Signalboard is **not a generic CRM**. It's an operations dashboard for the
two things that actually happen behind a Facebook/Instagram page once
content is posted:

1. **Replying to comments** — an automation catches every comment and
   auto-replies to it. This is not optional and not partial: the bot
   replies to 100% of comments, so "comments caught" and "comments
   replied" are never two different numbers. Don't build them as two
   stats.
2. **Pulling people into the inbox and keeping them talking** — the bot's
   reply tries to move the person into DMs, where an AI chatbot actually
   converses with them (answers questions, gives price, etc.), instead of
   the old assumption of "ask for an email, send a checkout link." Most
   customers pay cash-on-delivery, so there is **no checkout system** and
   there will not be one soon.

The one question this app answers for the page admin: **"what did my
page's automation actually do today, and how many of the people it talked
to turned into orders?"**

### What is real vs. what was a placeholder guess
The original build assumed an email-capture + checkout-link funnel
(`Commented → DM opened → Email captured → Checkout sent → Paid`). That
was wrong for how this business actually works and is being walked back:
- **Email capture and checkout links are not real** — cut as tracked
  stages. Orders happen through conversation + COD, not a checkout flow.
- **"DM opened" is not something we can detect.** What we *can* track is
  whether a comment turned into an actual back-and-forth conversation
  with the AI chatbot in the inbox — that's the real second stage, not
  "opened."
- The funnel keeps its shape (a sequence people fall out of) but its
  stages get relabeled to match what's actually trackable: **Commented →
  Engaged (talked with the bot in inbox) → Paid.** Treat the old 5-stage
  version as retired, not as a target to rebuild toward.

### The metrics that actually belong on Signal Feed (front page)
Agreed and locked in — build these, not the old stat strip:
- **Comments handled** — one number (not two). Every comment gets an
  auto-reply, so there's nothing to compare it against.
- **Engaged leads** — how many people actually had a conversation with the
  AI chatbot in the inbox (replaces "reply rate" — a rate implies some
  comments don't get replies, which isn't true here).
- **Orders placed** — out of engaged leads, how many actually placed an
  order. This is the real conversion event, not "checkout sent."
- **Conversion rate** — engaged leads → orders.
- **Estimated revenue** — this depends on knowing which product a given
  post/comment was about. The plan: tag each post with the product it's
  selling (post ID → product/price mapping in the database), then
  attribute an order back to the post its conversation started from to
  estimate revenue. Still being designed — treat as directional, not a
  finished spec, until the mapping exists.
- **Ghosted & recovery — promoted to a full section, not a small card.**
  Track the whole follow-up lifecycle, not just "ghosted count":
  - Ghosted (went quiet after engaging)
  - Followed up (we sent a re-engagement message)
  - Continued (they replied to the follow-up and kept talking)
  - Recovered orders (of those who continued after follow-up, how many
    actually placed an order because of it)
- **Raw comment feed** — a plain, literal list of who commented and what
  the bot replied, pulled straight from stored automation logs. This is
  **not** an AI-summarized or AI-reprocessed view — it must not spend
  tokens re-reading every comment through a model. It's just the record.

### Cut from the front page (demoted or dropped, don't rebuild these)
- **Peak activity heatmap** — cut. Not useful for a single-page operator,
  too much surface for not enough insight.
- **Automation performance deep-dive** (per-step reply rate + latency
  breakdown) — cut in its current form. Too in-depth for a front page,
  and the underlying reply-rate numbers were fabricated demo math, not
  something meant to ship as-is.
- **Page comparison widget** — deprioritized, not deleted. This product
  isn't built around running many pages at once; a single-page admin is
  the primary case. Can stay available, just not core real estate.
- **Top asked-about products** — keep the underlying idea (post→product
  interest) but it now feeds estimated revenue instead of being its own
  standalone widget.

The frontend is fully wired against a dummy API layer (`app/lib/api.js`) —
every function simulates a real network call (delay + promise). Swapping in
the real backend later means rewriting that one file; no component changes.
**When rebuilding Signal Feed, the demo data in `api.js` needs to change
shape to match the metrics above** — it currently still reflects the old
5-stage funnel and will need new fields for engaged/ghosted/follow-up/
recovered/orders, plus the post→product revenue attribution.


## Latest changes

- **Rolling time windows.** Hourly = last 24 hours, Daily = last 7 days, Weekly = last 6 weeks, Monthly = last 12 months, Yearly = last 5 years, all ending "now". **Custom** (calendar pill in the range switch) takes a from/to date, with quick picks; the chart picks its own bar size from the span (hours / days / weeks / months). The whole page (stat cards, ghosted, pages, engagement) follows the custom range. API functions take a preset name or `{from, to}` (`metaFor` / `bucketsFor` / `seriesFor` in `app/lib/api.js`) — that's the shape the real query needs too.
- **Comments & chats section** redesigned: comments-by-time-of-day histogram, chat-source donut (regular / boosted / story replies), mini metrics, and a "More insight" expand (what people ask about, top posts by comments, most common words).
- **Dark mode refresh** (light mode untouched): deeper indigo palette, brighter accents, per-card colour glows and borders, softer background glows.
- **Pages rows** use fixed columns so metrics line up across pages.

### For n8n (needed to make the new insight real)
- **Topics** ("what people ask about") and **common words** need each comment tagged with a topic at reply time (price / stock / delivery / sizes / other) via plain keyword matching — no AI tokens, no re-reading comments.
- Chat source (regular / boosted / story) comes from the post's ad tag and the story-reply webhook. Messages-per-chat needs the chatbot to log message counts (currently a placeholder constant).
- Each post needs a stored comment count (`commentCount` in the dummy data); "comments replied to" is the sum over posts in scope.

## Signal Feed layout (current)

Top to bottom: **Sales** (estimated sales, sales from boosted posts, orders, chat → order rate) → **Comments & chats** (comments replied to, people who chatted with the bot) → **Ghosted & recovery** (click "Ghosted" for seen / never-seen) → **Revenue trend** (full width: organic vs boosted sales as stacked bars, orders as a line, plus total / best / average / boosted-share tiles) → **Pages** (full width: share-of-sales donut, chat → order bars, comments/chats/orders bars, then one row per page with a sparkline; expand a row for its COD-outcome donut and extra metrics; hover a row for "Switch to this page", which selects it and scrolls to the top).

- Every section has a "⋯" menu to move it up or down. Order persists in localStorage (`app/lib/dashboard-layout-context.js`, validated on read).
- The funnel card was cut (it repeated the stat cards). Attribution confidence and bot response time live only in the Automation health drawer (Activity icon in the Topbar).
- Live activity + Comment log moved to their own page: `/comments` ("Comment activity").
- `/orders` tracks COD outcome (pending / out for delivery / delivered / returned).
- Light theme palette and card shadows were reworked; cards carry per-section gradient washes.
- Pages now all have tagged posts, so estimated sales is $7,188 (was $5,880 when only two pages had posts). The Pages card's chat → order rate is computed, not hand-set.

### README vs code
The sections below describe a block registry / customizer / density system (`dashboard-blocks.js`, `DashboardCustomizer.js`, `density-context.js`) that does not exist in this codebase. Section reordering above is the lightweight version of that idea.

## Working right now (pre-existing, from before this pivot)

**Signal Feed (`/`) — a customizable dashboard, not a fixed page.**
- Density modes — Compact / Comfortable / Spread — via a shared `Panel`
  component (`app/components/Panel.js`) and `app/lib/density-context.js`.
- Block registry + presets (`app/lib/dashboard-blocks.js`), customizer
  drawer (`app/components/DashboardCustomizer.js`) with visibility/width/
  reorder controls, layout persisted to `localStorage`
  (`app/lib/dashboard-layout-context.js`, schema-validated on read).
- Hourly / Daily / Weekly / Monthly / Yearly range switch.
- **This block/customizer machinery stays** — what changes is *which*
  blocks exist and what data they show, per the metrics list above.

**Everything from before, unchanged:**
- Leads (`/leads`) — live search, stage filter chips, sortable columns, row
  click opens the lead's conversation drawer.
- Posts & Comments (`/posts`) — click a post to load its comments, click a
  comment to load that lead's conversation.
- Dark/light mode, persisted, no flash on load.
- Motion throughout (`framer-motion`), smooth scroll (`lenis`), fully
  responsive.

## Architecture notes for whoever picks this up next

- **State pattern**: plain React Context + `useState` + `useEffect` +
  `localStorage`, matching the existing `theme-context.js` /
  `range-context.js` — deliberately *not* Zustand, to stay consistent with
  what this codebase already established rather than mixing patterns.
- **Block registry** (`app/lib/dashboard-blocks.js`) is the single source of
  truth for what blocks exist and what the presets look like. Adding a new
  block: write the component in `app/components/blocks/`, add one entry to
  `BLOCK_DEFS`, map its id in `page.js`'s `BLOCK_COMPONENTS`. Nothing else
  needs to change.
- **Why the block grid is a 2-column CSS grid, not manual row-pairing**:
  each block wrapper is `lg:col-span-2` (full) or `lg:col-span-1` (half)
  inside one `grid-cols-2` container — the grid's own auto-placement handles
  pairing consecutive half-blocks, no row-bookkeeping code needed.
- **Density scope**: currently wired into the Signal Feed dashboard blocks
  + `StatCard` only (that's where the customization surfaces, per what was
  asked for). Leads/Posts pages still use their original fixed padding.
  Extending density to them is a small job — swap their panel `div`s for
  the shared `Panel` component — deliberately left out to keep this change
  scoped to the dashboard.

## Deferred on purpose (discussed and agreed, not forgotten)

- **True drag-and-drop reordering.** The agreed plan was: ship the
  block-based preset/toggle/width/reorder-by-arrow system first (covers
  ~90% of the customization ask), add real drag-and-drop later only if
  that's not enough. Swapping the up/down arrows in
  `DashboardCustomizer.js` for a drag handle (e.g. `@dnd-kit/sortable`) is
  the natural next step — the underlying `layout` array in
  `dashboard-layout-context.js` already supports arbitrary reordering, so
  this is a UI-layer change, not a data-model change.
- **Admin-created, separately-named custom presets** (save *my own* layout
  as a new named template, beyond the 7 built-in ones). Right now there's
  exactly one live "Custom" layout that persists automatically. Multiple
  saved custom presets would mean keying `localStorage` by preset name
  instead of one fixed key — straightforward, just not built yet.
- No backend, no real network calls, no auth — same as before. Orders and
  Pages (the *page*, not the widget) are still inert "coming next" stubs in
  the sidebar.
- The range switch still only drives dashboard analytics — Leads/Posts stay
  full historical tables.

## Setup

```
npm install
npm run dev
```

Built to `/my-coding-style` conventions: Next.js App Router + Tailwind, no
TypeScript. Deps: `framer-motion`, `recharts`, `lenis`, `lucide-react`.

Verified this session: `npm run build` compiles clean, and `next start`
serves `/`, `/leads`, and `/posts` all at 200 with the new dashboard
markup present.
