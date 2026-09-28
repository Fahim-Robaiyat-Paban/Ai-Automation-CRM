import { addDays, daysBetween, fmtShort, fromISO } from "./dates";

// Dummy API layer. Every function mimics a real network call (latency + promise)
// so swapping in the real backend later is a one-line change per function —
// nothing in the components needs to know the difference.

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// Base numbers are "daily" figures. Every other range is a deterministic
// scale of these — deterministic so flipping the range switch back and forth
// doesn't jitter the numbers around, the way a real backend re-query would
// still return a stable answer for a stable window.
//
// The bot replies to every comment it catches, so there's no separate
// "caught vs replied" pair — "comments handled" is the one honest number.
// "Engaged leads" and "orders placed" are the two real funnel checkpoints;
// conversion rate is derived from those two, not stored on its own.
const BASE_STATS = [
  // computed from each post's comment count (see commentsFor), like the revenue stats
  { key: "commentsHandled", label: "Comments replied to", value: undefined },
  { key: "engagedLeads", label: "People who chatted with the bot", value: 612 },
  { key: "ordersPlaced", label: "Orders", value: 184 },
  // No longer estimated from a generic base number — see estimatedRevenueFor
  // below, which sums (price × orders) per post now that posts carry a real
  // product/price tag. `value` here is unused for this key; kept undefined
  // so a future stat that forgets the special case fails loudly, not silently.
  { key: "estimatedRevenue", label: "Estimated sales", value: undefined },
  // Same shape as estimatedRevenue above — computed from which posts are
  // ad-boosted (see adAttributedRevenueFor), not scaled off a base number.
  { key: "adAttributedRevenue", label: "Sales from boosted posts", value: undefined },
];

// Keyed by stat key instead of a positional array — adding a stat used to
// mean inserting a number into the right index of five parallel arrays and
// hoping nothing drifted. Keyed lookup means a missing key just reads as
// "no reported change" (see deltaFor in getStats) instead of silently
// pointing at the wrong stat.
export const RANGE_META = {
  hourly: {
    mult: 0.055,
    suffix: "this hour",
    deltas: {
      commentsHandled: 3, engagedLeads: 1, ordersPlaced: -1,
      estimatedRevenue: 6, adAttributedRevenue: 9, conversionRate: 2,
    },
  },
  daily: {
    mult: 1,
    suffix: "today",
    deltas: {
      commentsHandled: 12, engagedLeads: 4, ordersPlaced: -2,
      estimatedRevenue: 18, adAttributedRevenue: 21, conversionRate: 3,
    },
  },
  weekly: {
    mult: 6.4,
    suffix: "this week",
    deltas: {
      commentsHandled: 9, engagedLeads: 7, ordersPlaced: 3,
      estimatedRevenue: 22, adAttributedRevenue: 26, conversionRate: 5,
    },
  },
  monthly: {
    mult: 26,
    suffix: "this month",
    deltas: {
      commentsHandled: 15, engagedLeads: 11, ordersPlaced: 6,
      estimatedRevenue: 31, adAttributedRevenue: 35, conversionRate: 4,
    },
  },
  yearly: {
    mult: 305,
    suffix: "this year",
    deltas: {
      commentsHandled: 28, engagedLeads: 19, ordersPlaced: 14,
      estimatedRevenue: 44, adAttributedRevenue: 52, conversionRate: 7,
    },
  },
};

// A range is either a preset name ("daily") or, for a custom range, a
// {from, to} object of "YYYY-MM-DD" strings. Custom ranges scale the daily
// base figures by how many days they span. Deltas are placeholders, same as
// every preset's (nothing here diffs against a previous period).
function metaFor(range) {
  if (typeof range === "string") return RANGE_META[range] || RANGE_META.daily;
  const days = Math.max(1, daysBetween(fromISO(range.from), fromISO(range.to)) + 1);
  return { mult: days, suffix: "in this range", deltas: RANGE_META.monthly.deltas };
}

const presetKey = (range) => (typeof range === "string" ? range : "monthly");

// Comment→private-reply time, per range. This is an average, not a count,
// so it deliberately does NOT run through the mult-based scaling every
// count stat uses below — a "yearly average" isn't 305x a daily one.
const LATENCY_BY_RANGE = {
  hourly: 44,
  daily: 47,
  weekly: 52,
  monthly: 58,
  yearly: 63,
};

// Of engaged (real inbox) conversations, how many we can trace back to the
// specific comment/post that started them, vs. an untraceable cold DM.
// `matched` is a base "daily" figure like everything else in BASE_STATS —
// it scales with the same factor as engagedLeads, so the ratio between them
// (attribution confidence) holds steady across ranges instead of drifting.
const BASE_ATTRIBUTION = { matched: 502 };

// How many engaged conversations the AI chatbot couldn't handle and handed
// to a human — its own health signal, surfaced in the automation health
// drawer rather than as a front-page stat (see getAutomationHealth below).
const BASE_ESCALATIONS = 27;


const FEED = [
  { id: 1, leadId: "meherun-n", type: "paid", page: "Aurora Skincare", lead: "Meherun N.", text: "Placed an order for the Matte Finish Kit (COD)", time: "2m ago" },
  { id: 2, leadId: "tanvir-r", type: "engaged", page: "Aurora Skincare", lead: "Tanvir R.", text: "Talking with the bot about sizing and colors", time: "6m ago" },
  { id: 3, leadId: "priya-d", type: "engaged", page: "Nova Fitness", lead: "Priya D.", text: "Asked the bot if vanilla is back in stock", time: "9m ago" },
  { id: 4, leadId: "fahim-k", type: "engaged", page: "Aurora Skincare", lead: "Fahim K.", text: "Replying to the bot after commenting \"PRICE\" on Reel #482", time: "14m ago" },
  { id: 5, leadId: "samira-h", type: "ghosted", page: "Nova Fitness", lead: "Samira H.", text: "Went quiet after 120 min — follow-up queued", time: "22m ago" },
  { id: 6, leadId: "rakib-a", type: "comment", page: "Nova Fitness", lead: "Rakib A.", text: "Commented \"how much for the black one\" on Reel #119", time: "27m ago" },
  // Story replies are a real webhook event distinct from a feed/comment event
  // (tagging on a regular post does not fire one, only a reply or mention
  // does) — same "comment" tier styling, no new UI needed, just a new source.
  { id: 7, leadId: "arif-k", type: "comment", page: "Nova Fitness", lead: "Arif K.", text: "Replied to a story asking if restock is back for good", time: "34m ago" },
];

const PAGES = [
  { id: "aurora-skincare", name: "Aurora Skincare", status: "Healthy", leads: 512, color: "bg-mint" },
  { id: "nova-fitness", name: "Nova Fitness", status: "Healthy", leads: 388, color: "bg-mint" },
  { id: "urban-threads", name: "Urban Threads", status: "Throttled", leads: 96, color: "bg-amber" },
  { id: "bloom-co", name: "Bloom & Co.", status: "Healthy", leads: 220, color: "bg-mint" },
];

// Synchronous — the page switcher needs the id/name list before any network
// delay resolves. Everything else about a page (status, leads, conversion)
// still only comes from getPagesOverview() below.
export const PAGE_LIST = PAGES.map(({ id, name }) => ({ id, name }));

const TOTAL_LEADS = PAGES.reduce((sum, p) => sum + p.leads, 0);

// A page-scoped request is still one admin's whole account today (this demo
// ships four pages), so there's no separate per-page backend yet — this is
// the one place that fakes it: an "all pages" request passes everything
// through unscaled, a specific page scales aggregate numbers by that page's
// share of total leads and filters logs/lists down to just that page's name.
// Swapping in a real per-page backend later means deleting this helper, not
// touching the components that call it.
function pageById(pageId) {
  return PAGES.find((p) => p.id === pageId) || null;
}

function pageShare(pageId) {
  if (!pageId || pageId === "all") return 1;
  const page = pageById(pageId);
  return page ? page.leads / TOTAL_LEADS : 1;
}

function filterByPage(rows, pageId, pageField = "page") {
  if (!pageId || pageId === "all") return rows;
  const page = pageById(pageId);
  if (!page) return rows;
  return rows.filter((r) => r[pageField] === page.name);
}

// The real revenue attribution model from the README: a post is tagged with
// the product it sells, an order traces back to the post its conversation
// started from, so revenue = sum(price × orders) per post — not a guess
// scaled off an unrelated base number. Untagged posts (no price) contribute
// nothing rather than a made-up amount.
function estimatedRevenueFor(pageId, meta) {
  const posts = filterByPage(POSTS, pageId);
  const dailyRevenue = posts.reduce(
    (sum, p) => sum + (p.price || 0) * (p.orders || 0),
    0
  );
  return dailyRevenue * meta.mult;
}

// Same model as estimatedRevenueFor, filtered to posts that carry an `ad`
// tag (see POSTS below) — i.e. revenue traceable to a specific boosted post/
// ad, not organic reach. estimatedRevenue (all posts) minus this figure is
// the organic split; there's no need to store that separately.
function adAttributedRevenueFor(pageId, meta) {
  const posts = filterByPage(POSTS, pageId).filter((p) => p.ad);
  const dailyRevenue = posts.reduce(
    (sum, p) => sum + (p.price || 0) * (p.orders || 0),
    0
  );
  return dailyRevenue * meta.mult;
}

// Comments the bot replied to — every comment gets a reply, so this is just
// the comment count of the posts in scope.
function commentsFor(pageId, meta) {
  const daily = filterByPage(POSTS, pageId).reduce((sum, p) => sum + (p.commentCount || 0), 0);
  return daily * meta.mult;
}

// Ghosted & recovery is its own full lifecycle, not a single count — see
// README. Went quiet → we followed up → they came back and kept talking →
// some of those actually placed an order because of the follow-up.
// Base "daily" figures, scaled by RANGE_META.mult like everything else.
const BASE_GHOSTED_RECOVERY = {
  ghosted: 168,
  // Split of the ghosted total: read the message and stopped replying, vs.
  // never opened it at all. Same total (112 + 56 = 168), just broken down —
  // this is what the "Ghosted" tile expands to reveal, not a separate stat.
  seenNoReply: 112,
  neverSeen: 56,
  followedUp: 124,
  continued: 58,
  recoveredOrders: 21,
};

export async function getGhostedRecovery(range = "daily", pageId = "all") {
  await delay(300);
  const meta = metaFor(range);
  const scale = meta.mult * pageShare(pageId);
  const ghosted = Math.max(0, Math.round(BASE_GHOSTED_RECOVERY.ghosted * scale));
  const seenNoReply = Math.max(0, Math.round(BASE_GHOSTED_RECOVERY.seenNoReply * scale));
  const neverSeen = Math.max(0, Math.round(BASE_GHOSTED_RECOVERY.neverSeen * scale));
  const followedUp = Math.max(0, Math.round(BASE_GHOSTED_RECOVERY.followedUp * scale));
  const continued = Math.max(0, Math.round(BASE_GHOSTED_RECOVERY.continued * scale));
  const recoveredOrders = Math.max(0, Math.round(BASE_GHOSTED_RECOVERY.recoveredOrders * scale));
  return {
    ghosted,
    seenNoReply,
    neverSeen,
    followedUp,
    continued,
    recoveredOrders,
    continueRate: followedUp ? Math.round((continued / followedUp) * 100) : 0,
    recoveredRate: followedUp ? Math.round((recoveredOrders / followedUp) * 100) : 0,
  };
}

// Raw automation log — literally who commented and what the bot replied,
// straight from stored logs. Deliberately NOT AI-summarized: re-reading
// every comment through a model to produce this view would burn tokens
// for no reason, since it's just a record, not an analysis.
const COMMENT_LOG = [
  // reaction: an emoji reaction the lead left on the bot's message — a free
  // lead-temperature signal (message_reactions webhook), not something we
  // asked them for. viaQuickReply: they tapped a structured button/Icebreaker
  // option instead of typing free text — higher-confidence intent than NLU.
  { id: "cl-1", lead: "Meherun N.", page: "Aurora Skincare", post: "Reel #482", comment: "how much for the black one?", botReply: "It's $42 — want me to send you the details in DM?", time: "2m ago", reaction: "❤️" },
  { id: "cl-2", lead: "Tanvir R.", page: "Aurora Skincare", post: "Reel #482", comment: "PRICE", botReply: "Sent you a DM with pricing!", time: "6m ago", reaction: "👍" },
  { id: "cl-3", lead: "Priya D.", page: "Nova Fitness", post: "Post #77", comment: "is the vanilla one back?", botReply: "Yes! Just restocked — I've DMed you to help with sizing.", time: "9m ago", viaQuickReply: true },
  { id: "cl-4", lead: "Fahim K.", page: "Aurora Skincare", post: "Reel #482", comment: "is this available in Dhaka?", botReply: "Yes, we deliver nationwide — check your DMs!", time: "14m ago" },
  { id: "cl-5", lead: "Samira H.", page: "Nova Fitness", post: "Story #12", comment: "price?", botReply: "Sent you the price in DM — let me know if you have questions!", time: "22m ago" },
  { id: "cl-6", lead: "Rakib A.", page: "Nova Fitness", post: "Reel #119", comment: "how much for the black one", botReply: "$28 for the set — DMed you the link to order!", time: "27m ago" },
];

export async function getCommentFeed(pageId = "all") {
  await delay(300);
  return filterByPage(COMMENT_LOG, pageId);
}

const CONVERSATIONS = {
  "meherun-n": [
    { icon: "comment", text: "\"how much for the black one?\"", meta: "Comment on Reel #482" },
    { icon: "engaged", text: "Talked with the bot about shade + size, gave delivery address", meta: "Inbox conversation" },
    { icon: "paid", text: "Placed order — SKU-PRO-MAX-BLK, $42.00 (COD)", meta: "Order complete" },
  ],
  "tanvir-r": [
    { icon: "comment", text: "\"PRICE\"", meta: "Comment on Reel #482" },
    { icon: "engaged", text: "Asking the bot about sizing and colors", meta: "Inbox conversation — ongoing" },
  ],
  "fahim-k": [
    { icon: "comment", text: "\"is this available in Dhaka?\"", meta: "Comment on Reel #482" },
    { icon: "engaged", text: "Bot confirmed nationwide delivery, waiting on reply", meta: "Inbox conversation — ongoing" },
  ],
  "nusrat-j": [
    { icon: "comment", text: "\"price pls\"", meta: "Comment on Reel #482" },
    { icon: "engaged", text: "Bot replied with price, waiting on reply", meta: "Inbox conversation — ongoing" },
  ],
  "imran-h": [
    { icon: "comment", text: "\"what's the price for 2 pieces\"", meta: "Comment on Reel #482" },
  ],
  "arif-k": [
    { icon: "comment", text: "\"is this back for good or just a restock?\"", meta: "Reply to Story mention" },
  ],
  "farhana-t": [
    { icon: "engaged", text: "Talked with the bot about band resistance levels", meta: "Inbox conversation" },
    { icon: "paid", text: "Placed order — Resistance Band Set, $28.00 (COD)", meta: "Order complete" },
  ],
  "jubayer-h": [
    { icon: "engaged", text: "Asked the bot about protein flavors", meta: "Inbox conversation" },
    { icon: "paid", text: "Placed order — Protein Bundle, $35.00 (COD)", meta: "Order complete" },
  ],
  "nadia-r": [
    { icon: "engaged", text: "Confirmed delivery address with the bot", meta: "Inbox conversation" },
    { icon: "paid", text: "Placed order — Protein Bundle, $35.00 (COD)", meta: "Order complete" },
  ],
  "sabbir-a": [
    { icon: "engaged", text: "Asked the bot about jacket sizing", meta: "Inbox conversation" },
    { icon: "paid", text: "Placed order — Denim Jacket, $54.00 (COD)", meta: "Order complete" },
  ],
  "tania-k": [
    { icon: "engaged", text: "Talked with the bot about delivery timing", meta: "Inbox conversation" },
    { icon: "paid", text: "Placed order — Spring Bouquet, $30.00 (COD)", meta: "Order complete" },
  ],
  "rezaul-k": [
    { icon: "engaged", text: "Asked the bot for a size exchange before ordering", meta: "Inbox conversation" },
    { icon: "paid", text: "Placed order — Denim Jacket, $54.00 (COD)", meta: "Order complete" },
  ],
};

const LEADS = [
  // reaction: mirrors the same field on that lead's COMMENT_LOG entry —
  // kept on both records the way a real webhook payload would attach it to
  // the message, not the lead; repeat: how many separate times this exact
  // person has ordered before, for the repeat-customer/LTV badge below.
  { id: "meherun-n", name: "Meherun N.", page: "Aurora Skincare", stage: "Paid", source: "Reel #482", email: "meherun@domain.com", last: "2m ago", reaction: "❤️", repeat: 3 },
  { id: "tanvir-r", name: "Tanvir R.", page: "Aurora Skincare", stage: "Engaged", source: "Reel #482", email: "tanvir@domain.com", last: "6m ago", reaction: "👍" },
  { id: "priya-d", name: "Priya D.", page: "Nova Fitness", stage: "Engaged", source: "Post #77", email: "priya@domain.com", last: "9m ago" },
  { id: "fahim-k", name: "Fahim K.", page: "Aurora Skincare", stage: "Engaged", source: "Reel #482", email: "—", last: "14m ago" },
  { id: "samira-h", name: "Samira H.", page: "Nova Fitness", stage: "Ghosted", source: "Story #12", email: "samira@domain.com", last: "22m ago" },
  { id: "rakib-a", name: "Rakib A.", page: "Nova Fitness", stage: "Commented", source: "Reel #119", email: "—", last: "27m ago" },
  // Story reply — a new acquisition channel (see FEED above), flowing
  // through the exact same Leads table / drawer with no new UI.
  { id: "arif-k", name: "Arif K.", page: "Nova Fitness", stage: "Commented", source: "Story reply", email: "—", last: "34m ago" },
  // The rest below exist so every row in the new Orders page (see ORDERS
  // further down) opens to a real lead in the drawer instead of a dead
  // click — nusrat-j/imran-h were already referenced from Reel #482's
  // comments but were missing here; the others are Orders-only customers
  // with no separate comment/post record, hence source "—".
  { id: "nusrat-j", name: "Nusrat J.", page: "Aurora Skincare", stage: "Paid", source: "Reel #482", email: "—", last: "38m ago" },
  { id: "imran-h", name: "Imran H.", page: "Aurora Skincare", stage: "Paid", source: "Reel #482", email: "—", last: "51m ago" },
  { id: "farhana-t", name: "Farhana T.", page: "Nova Fitness", stage: "Paid", source: "—", email: "—", last: "1h ago" },
  { id: "jubayer-h", name: "Jubayer H.", page: "Nova Fitness", stage: "Paid", source: "—", email: "—", last: "3h ago" },
  { id: "nadia-r", name: "Nadia R.", page: "Nova Fitness", stage: "Paid", source: "—", email: "—", last: "5h ago" },
  { id: "sabbir-a", name: "Sabbir A.", page: "Urban Threads", stage: "Paid", source: "—", email: "—", last: "6h ago" },
  { id: "tania-k", name: "Tania K.", page: "Bloom & Co.", stage: "Paid", source: "—", email: "—", last: "8h ago" },
  { id: "rezaul-k", name: "Rezaul K.", page: "Urban Threads", stage: "Paid", source: "—", email: "—", last: "1d ago" },
];

const POSTS = [
  {
    id: "reel-482",
    commentCount: 520,
    label: "Reel #482",
    page: "Aurora Skincare",
    caption: "New matte finish drop — swipe to see shades",
    product: "Matte Finish Kit — SKU-PRO-MAX-BLK",
    price: 42,
    orders: 90,
    // Present only on boosted/ads posts — arrives on the feed webhook
    // automatically when someone comments on an ad post (ad_id + ad_title),
    // no extra API call needed. Powers adAttributedRevenueFor above.
    ad: { id: "6123456789012345", title: "Matte Finish Kit — Carousel Ad" },
    comments: [
      { leadId: "meherun-n", name: "Meherun N.", text: "how much for the black one?", stage: "Paid" },
      { leadId: "tanvir-r", name: "Tanvir R.", text: "PRICE", stage: "Engaged" },
      { leadId: "fahim-k", name: "Fahim K.", text: "is this available in Dhaka?", stage: "Engaged" },
      { leadId: "nusrat-j", name: "Nusrat J.", text: "price pls", stage: "Engaged" },
      { leadId: "imran-h", name: "Imran H.", text: "what's the price for 2 pieces", stage: "Commented" },
    ],
    priceAsks: 87,
  },
  {
    id: "reel-119",
    commentCount: 240,
    label: "Reel #119",
    page: "Nova Fitness",
    caption: "Resistance band set, 3-day flash sale",
    product: "Resistance Band Set",
    price: 28,
    orders: 40,
    comments: [
      { leadId: "rakib-a", name: "Rakib A.", text: "how much for the black one", stage: "Commented" },
    ],
    priceAsks: 41,
  },
  {
    id: "post-77",
    commentCount: 180,
    label: "Post #77",
    page: "Nova Fitness",
    caption: "Protein bundle restock announcement",
    product: "Protein Bundle",
    price: 35,
    orders: 28,
    comments: [
      { leadId: "priya-d", name: "Priya D.", text: "is the vanilla one back?", stage: "Engaged" },
    ],
    priceAsks: 22,
  },
  {
    id: "story-12",
    commentCount: 54,
    label: "Story #12",
    page: "Nova Fitness",
    caption: "24hr story — new arrivals teaser",
    product: "New Arrivals (unspecified)",
    // Not yet tagged with a real product/price — deliberately left out of
    // revenue attribution below until someone maps it, instead of guessing.
    price: null,
    orders: 0,
    comments: [
      { leadId: "samira-h", name: "Samira H.", text: "price?", stage: "Ghosted" },
    ],
    priceAsks: 6,
  },
  {
    id: "post-31",
    commentCount: 110,
    label: "Post #31",
    page: "Urban Threads",
    caption: "Relaxed-fit denim jacket — two sizes left",
    product: "Denim Jacket — Relaxed Fit",
    price: 54,
    orders: 12,
    comments: [{ leadId: "sabbir-a", name: "Sabbir A.", text: "is size M available?", stage: "Paid" }],
    priceAsks: 9,
  },
  {
    id: "reel-207",
    commentCount: 180,
    label: "Reel #207",
    page: "Bloom & Co.",
    caption: "Spring bouquets — same-day delivery",
    product: "Spring Bouquet — Medium",
    price: 30,
    orders: 22,
    comments: [{ leadId: "tania-k", name: "Tania K.", text: "same-day in Dhaka?", stage: "Paid" }],
    priceAsks: 15,
  },
];

function formatValue(key, n) {
  const rounded = Math.max(0, Math.round(n));
  if (key === "estimatedRevenue" || key === "adAttributedRevenue") {
    return `$${rounded.toLocaleString()}`;
  }
  return rounded.toLocaleString();
}

export async function getStats(range = "daily", pageId = "all") {
  await delay(350);
  const meta = metaFor(range);
  const scale = meta.mult * pageShare(pageId);

  // Keyed lookup instead of a positional index — a stat with no entry in
  // this range's deltas just reports no change, rather than reading
  // whatever the next stat over happens to have.
  function deltaFor(key) {
    const d = meta.deltas[key] ?? 0;
    return `${d >= 0 ? "+" : ""}${d}%`;
  }

  const stats = BASE_STATS.map((s) => {
    // Estimated + ad-attributed revenue come from the post→product
    // attribution model, not the generic page-share scale every count
    // stat uses.
    const raw =
      s.key === "estimatedRevenue"
        ? estimatedRevenueFor(pageId, meta)
        : s.key === "adAttributedRevenue"
        ? adAttributedRevenueFor(pageId, meta)
        : s.key === "commentsHandled"
        ? commentsFor(pageId, meta)
        : s.value * scale;
    return {
      key: s.key,
      label: `${s.label} ${meta.suffix}`,
      value: formatValue(s.key, raw),
      delta: deltaFor(s.key),
      // raw scaled number, used below to derive rates — not shown as-is
      _raw: raw,
    };
  });

  const engagedRaw = stats.find((s) => s.key === "engagedLeads")._raw;
  const ordersRaw = stats.find((s) => s.key === "ordersPlaced")._raw;
  const conversionRate = engagedRaw ? Math.round((ordersRaw / engagedRaw) * 100) : 0;

  return [
    ...stats.map(({ _raw, ...s }) => s),
    {
      key: "conversionRate",
      label: `Chat → order rate ${meta.suffix}`,
      value: `${conversionRate}%`,
      delta: deltaFor("conversionRate"),
    },
  ];
}

// Escalations + attribution + response time, in one place — the
// automation health drawer's data, kept out of the front-page stat strip
// since it's a "check when you want it" health signal, not a headline
// number (see AutomationHealthDrawer.js).
export async function getAutomationHealth(range = "daily", pageId = "all") {
  await delay(250);
  const meta = metaFor(range);
  const scale = meta.mult * pageShare(pageId);

  const engaged = Math.max(0, Math.round(BASE_STATS.find((s) => s.key === "engagedLeads").value * scale));
  const matched = Math.max(0, Math.round(BASE_ATTRIBUTION.matched * scale));
  const escalations = Math.max(0, Math.round(BASE_ESCALATIONS * scale));

  return {
    escalations,
    escalationRate: engaged ? Math.round((escalations / engaged) * 100) : 0,
    matched,
    engaged,
    avgLatencySeconds: LATENCY_BY_RANGE[presetKey(range)] ?? LATENCY_BY_RANGE.daily,
  };
}

export async function getFeed(pageId = "all") {
  await delay(450);
  return filterByPage(FEED, pageId);
}

// ---- Rolling time windows -------------------------------------------------
// Every chart window ends "now" instead of on a calendar boundary: the last
// 24 hours, 7 days, 6 weeks, 12 months, 5 years — or a custom {from, to}.
// Values are deterministic (same bucket -> same number) so the demo doesn't
// jitter on refresh; the real backend replaces seriesFor() with a query.
const HOUR_MS = 3600000;
const normalize = (arr) => {
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  return arr.map((v) => v / mean);
};
// evenings peak, with a smaller lunchtime bump
const HOUR_CURVE = normalize(
  Array.from({ length: 24 }, (_, h) => 0.3 + 1.5 * Math.exp(-((h - 19) ** 2) / 16) + 0.6 * Math.exp(-((h - 12.5) ** 2) / 9))
);
const WEEKDAY_CURVE = normalize([1.05, 0.85, 0.9, 0.95, 1.0, 1.2, 1.25]); // Sun..Sat

const hourLabel = (h) => `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? "am" : "pm"}`;
const monthLabel = (d) => `${d.toLocaleDateString("en-US", { month: "short" })} ’${String(d.getFullYear()).slice(2)}`;
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

function wobble(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return 0.88 + 0.24 * (x - Math.floor(x));
}

// Older buckets are a bit smaller — the business is growing.
function growth(date, now) {
  const daysAgo = Math.max(0, (now - date) / 86400000);
  return Math.max(0.3, 0.9992 ** daysAgo);
}

function bucketsFor(range, now) {
  const today = startOfDay(now);

  if (typeof range === "string") {
    if (range === "hourly") {
      const thisHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
      return {
        unit: "Last 24 hours, by hour",
        grain: "hour",
        buckets: Array.from({ length: 24 }, (_, i) => {
          const start = new Date(thisHour.getTime() - (23 - i) * HOUR_MS);
          return { start, hours: 1, label: hourLabel(start.getHours()) };
        }),
      };
    }
    if (range === "weekly") {
      return {
        unit: "Last 6 weeks, by week (labelled by first day)",
        grain: "week",
        buckets: Array.from({ length: 6 }, (_, i) => {
          const start = addDays(today, -7 * (5 - i) - 6);
          return { start, hours: 168, label: fmtShort(start) };
        }),
      };
    }
    if (range === "monthly") {
      return {
        unit: "Last 12 months, by month",
        grain: "month",
        buckets: Array.from({ length: 12 }, (_, i) => {
          const start = new Date(today.getFullYear(), today.getMonth() - (11 - i), 1);
          const days = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
          return { start, hours: days * 24, label: monthLabel(start) };
        }),
      };
    }
    if (range === "yearly") {
      return {
        unit: "Last 5 years, by year",
        grain: "year",
        buckets: Array.from({ length: 5 }, (_, i) => {
          const year = today.getFullYear() - (4 - i);
          const days = (new Date(year + 1, 0, 1) - new Date(year, 0, 1)) / 86400000;
          return { start: new Date(year, 0, 1), hours: days * 24, label: String(year) };
        }),
      };
    }
    // daily (and any unknown key): last 7 days
    return {
      unit: "Last 7 days, by day",
      grain: "day",
      buckets: Array.from({ length: 7 }, (_, i) => {
        const start = addDays(today, i - 6);
        return { start, hours: 24, label: start.toLocaleDateString("en-US", { weekday: "short", day: "numeric" }) };
      }),
    };
  }

  // custom {from, to}: the bar size follows how long the span is
  let from = fromISO(range.from);
  let to = fromISO(range.to);
  if (from > to) [from, to] = [to, from];
  const days = daysBetween(from, to) + 1;
  const title = `${fmtShort(from)} – ${fmtShort(to)}`;

  if (days <= 3) {
    return {
      unit: `${title}, by hour`,
      grain: "hour",
      buckets: Array.from({ length: days * 24 }, (_, i) => {
        const start = new Date(from.getFullYear(), from.getMonth(), from.getDate(), i);
        return { start, hours: 1, label: days === 1 ? hourLabel(start.getHours()) : `${start.getDate()} ${hourLabel(start.getHours())}` };
      }),
    };
  }
  if (days <= 45) {
    return {
      unit: `${title}, by day`,
      grain: "day",
      buckets: Array.from({ length: days }, (_, i) => {
        const start = addDays(from, i);
        return { start, hours: 24, label: fmtShort(start) };
      }),
    };
  }
  if (days <= 200) {
    const count = Math.ceil(days / 7);
    return {
      unit: `${title}, by week`,
      grain: "week",
      buckets: Array.from({ length: count }, (_, i) => {
        const start = addDays(from, i * 7);
        return { start, hours: Math.min(7, days - i * 7) * 24, label: fmtShort(start) };
      }),
    };
  }
  const months = (to.getFullYear() - from.getFullYear()) * 12 + to.getMonth() - from.getMonth() + 1;
  return {
    unit: `${title}, by month`,
    grain: "month",
    buckets: Array.from({ length: months }, (_, i) => {
      const start = new Date(from.getFullYear(), from.getMonth() + i, 1);
      const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
      return { start, hours: daysInMonth * 24, label: monthLabel(start) };
    }),
  };
}

// dailyBase = what this slice of the business sells on an average day.
function seriesFor(range, dailyBase, now = new Date()) {
  const { unit, grain, buckets } = bucketsFor(range, now);
  const points = buckets.map((b) => {
    const shape =
      grain === "hour" ? HOUR_CURVE[b.start.getHours()] : grain === "day" ? WEEKDAY_CURVE[b.start.getDay()] : 1;
    const value = dailyBase * (b.hours / 24) * shape * wobble(b.start.getTime() / HOUR_MS) * growth(b.start, now);
    return { label: b.label, value: Math.max(0, Math.round(value)) };
  });
  return { unit, grain, points };
}

export async function getTrend(range = "daily", pageId = "all") {
  await delay(300);
  const daily = { mult: 1 };
  const total = estimatedRevenueFor(pageId, daily);
  const boostedShare = total ? adAttributedRevenueFor(pageId, daily) / total : 0;
  const avgOrder = estimatedRevenueFor("all", daily) / BASE_STATS.find((s) => s.key === "ordersPlaced").value;
  const { unit, grain, points } = seriesFor(range, total);
  return {
    unit,
    grain,
    points: points.map(({ label, value }) => {
      const boosted = Math.round(value * boostedShare);
      return { label, value, boosted, organic: value - boosted, orders: Math.round(value / avgOrder) };
    }),
  };
}

// One row per connected page for the full-width Pages card. Always the whole
// account (it's the comparison view), never scoped to the selected page.
// Everything is derived from the same post/order data the other blocks use,
// so the chat → order rate here is computed, not a hand-picked number.
export async function getPagesOverview(range = "daily") {
  await delay(400);
  const meta = metaFor(range);
  const salesOf = (posts) => posts.reduce((sum, p) => sum + (p.price || 0) * (p.orders || 0), 0);
  const round = (n) => Math.max(0, Math.round(n));

  return PAGES.map((p) => {
    const share = p.leads / TOTAL_LEADS;
    const posts = POSTS.filter((x) => x.page === p.name);
    const salesDaily = salesOf(posts);
    const chats = round(BASE_STATS.find((x) => x.key === "engagedLeads").value * share * meta.mult);
    const orders = round(posts.reduce((sum, x) => sum + (x.orders || 0), 0) * meta.mult);
    const topPost = [...posts].sort((a, b) => (b.price || 0) * b.orders - (a.price || 0) * a.orders)[0];
    const pageOrders = ORDERS.filter((o) => o.page === p.name);

    return {
      id: p.id,
      name: p.name,
      status: p.status,
      color: p.color,
      leads: p.leads,
      comments: round(commentsFor(p.id, meta)),
      chats,
      orders,
      sales: round(salesDaily * meta.mult),
      boostedSales: round(salesOf(posts.filter((x) => x.ad)) * meta.mult),
      rate: chats ? Math.round((orders / chats) * 100) : 0,
      ghosted: round(BASE_GHOSTED_RECOVERY.ghosted * share * meta.mult),
      recovered: round(BASE_GHOSTED_RECOVERY.recoveredOrders * share * meta.mult),
      topPost: topPost ? { label: topPost.label, product: topPost.product } : null,
      // last 7 days of this page's sales, same generator as the revenue trend
      spark: seriesFor("daily", salesDaily).points,
      // what actually happened to this page's COD orders (see Orders page)
      outcomes: ORDER_STATUSES.map((status) => ({
        status,
        count: pageOrders.filter((o) => o.status === status).length,
      })),
    };
  });
}

// Everything inside the Comments & chats section: the time-of-day histogram,
// where chats came from, the mini metrics and the expanded insight strip.
// Topics and common words need n8n to tag each comment with simple keyword
// matching at reply time (plain text matching — no AI tokens); the rest is
// derived from data the automations already record. See README.
const TOPIC_WEIGHTS = [["Price", 1], ["Stock", 0.58], ["Delivery", 0.45], ["Sizes", 0.32], ["Other", 0.25]];
const BASE_WORDS = [["price", 212], ["available", 148], ["delivery", 96], ["size", 84], ["black", 71], ["restock", 52]];
const HOUR_BLOCK_LABELS = ["12a", "2a", "4a", "6a", "8a", "10a", "12p", "2p", "4p", "6p", "8p", "10p"];
const BASE_MESSAGES_PER_CHAT = 7.2; // placeholder until the chatbot logs message counts

export async function getEngagementDetails(range = "daily", pageId = "all") {
  await delay(350);
  const meta = metaFor(range);
  const scale = meta.mult * pageShare(pageId);
  const posts = filterByPage(POSTS, pageId);
  const round = (n) => Math.max(0, Math.round(n));

  const comments = round(commentsFor(pageId, meta));
  const chats = round(BASE_STATS.find((x) => x.key === "engagedLeads").value * scale);
  const priceQuestions = round(posts.reduce((sum, p) => sum + (p.priceAsks || 0), 0) * meta.mult);

  // 2-hour blocks of the day, weighted by the same evening-heavy curve as the trend
  const byHour = HOUR_BLOCK_LABELS.map((label, i) => ({
    label,
    count: round((comments * (HOUR_CURVE[i * 2] + HOUR_CURVE[i * 2 + 1])) / 24),
  }));

  // Chats by entry point: boosted share follows the ad-tagged posts, stories
  // are a small fixed slice, everything else is regular posts.
  const daily = { mult: 1 };
  const totalSales = estimatedRevenueFor(pageId, daily);
  const boostedShare = totalSales ? adAttributedRevenueFor(pageId, daily) / totalSales : 0;
  const stories = round(chats * 0.06);
  const boosted = round((chats - stories) * boostedShare);
  const chatSources = [
    { name: "Regular posts", count: Math.max(0, chats - stories - boosted) },
    { name: "Boosted posts", count: boosted },
    { name: "Story replies", count: stories },
  ];

  return {
    comments,
    chats,
    byHour,
    chatSources,
    priceQuestions,
    commentToChatRate: comments ? Math.round((chats / comments) * 100) : 0,
    chatsPerPost: posts.length ? chats / posts.length : 0,
    avgMessagesPerChat: BASE_MESSAGES_PER_CHAT,
    topics: TOPIC_WEIGHTS.map(([topic, w]) => ({ topic, count: round(priceQuestions * w) })),
    topPosts: [...posts]
      .sort((a, b) => b.commentCount - a.commentCount)
      .slice(0, 3)
      .map((p) => ({ label: p.label, product: p.product, comments: round(p.commentCount * meta.mult) })),
    commonWords: BASE_WORDS.map(([word, n]) => ({ word, count: round((n * comments) / 1284) })),
  };
}

export async function getLeads(pageId = "all") {
  await delay(400);
  return filterByPage(LEADS, pageId);
}

export async function getPosts(pageId = "all") {
  await delay(400);
  return filterByPage(POSTS, pageId);
}

export async function getConversation(leadId) {
  await delay(250);
  return CONVERSATIONS[leadId] || [];
}

export async function getLeadById(leadId) {
  await delay(150);
  return LEADS.find((l) => l.id === leadId) || null;
}

// The one thing Facebook itself can't tell us: for a cash-on-delivery
// business, "orders placed" (the Paid stage above) isn't "revenue collected"
// — a courier still has to actually deliver it and the customer has to
// actually accept it. This is that missing outcome, its own page rather
// than another front-page card (see README + Orders sidebar link).
export const ORDER_STATUSES = [
  "Pending confirmation",
  "Out for delivery",
  "Delivered",
  "Returned",
];

const ORDERS = [
  { id: "ord-1042", leadId: "meherun-n", lead: "Meherun N.", page: "Aurora Skincare", product: "Matte Finish Kit — SKU-PRO-MAX-BLK", amount: 42, status: "Delivered", placed: "2m ago" },
  { id: "ord-1041", leadId: "nusrat-j", lead: "Nusrat J.", page: "Aurora Skincare", product: "Matte Finish Kit — SKU-PRO-MAX-BLK", amount: 42, status: "Out for delivery", placed: "38m ago" },
  { id: "ord-1040", leadId: "imran-h", lead: "Imran H.", page: "Aurora Skincare", product: "Matte Finish Kit ×2 — SKU-PRO-MAX-BLK", amount: 84, status: "Pending confirmation", placed: "51m ago" },
  { id: "ord-1039", leadId: "farhana-t", lead: "Farhana T.", page: "Nova Fitness", product: "Resistance Band Set", amount: 28, status: "Delivered", placed: "1h ago" },
  { id: "ord-1038", leadId: "jubayer-h", lead: "Jubayer H.", page: "Nova Fitness", product: "Protein Bundle", amount: 35, status: "Returned", placed: "3h ago" },
  { id: "ord-1037", leadId: "nadia-r", lead: "Nadia R.", page: "Nova Fitness", product: "Protein Bundle", amount: 35, status: "Delivered", placed: "5h ago" },
  { id: "ord-1036", leadId: "sabbir-a", lead: "Sabbir A.", page: "Urban Threads", product: "Denim Jacket — Relaxed Fit", amount: 54, status: "Out for delivery", placed: "6h ago" },
  { id: "ord-1035", leadId: "tania-k", lead: "Tania K.", page: "Bloom & Co.", product: "Spring Bouquet — Medium", amount: 30, status: "Delivered", placed: "8h ago" },
  { id: "ord-1034", leadId: "rezaul-k", lead: "Rezaul K.", page: "Urban Threads", product: "Denim Jacket — Relaxed Fit", amount: 54, status: "Returned", placed: "1d ago" },
];

export async function getOrders(pageId = "all") {
  await delay(400);
  return filterByPage(ORDERS, pageId);
}

// Confirmed revenue (Delivered only) vs. pending COD still in flight vs.
// what came back — the real close-the-loop numbers "Est. revenue" on
// Signal Feed can't provide on its own, since that figure only knows an
// order was placed, not whether it was ever actually collected.
export async function getOrderSummary(pageId = "all") {
  await delay(300);
  const orders = filterByPage(ORDERS, pageId);
  const confirmedRevenue = orders
    .filter((o) => o.status === "Delivered")
    .reduce((sum, o) => sum + o.amount, 0);
  const pendingRevenue = orders
    .filter((o) => o.status === "Pending confirmation" || o.status === "Out for delivery")
    .reduce((sum, o) => sum + o.amount, 0);
  const returned = orders.filter((o) => o.status === "Returned").length;
  return {
    confirmedRevenue,
    pendingRevenue,
    returned,
    returnRate: orders.length ? Math.round((returned / orders.length) * 100) : 0,
    total: orders.length,
  };
}
