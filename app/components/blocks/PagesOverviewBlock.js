"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Area, AreaChart, Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChevronDown, ArrowRightLeft, Check } from "lucide-react";
import Panel from "../Panel";
import ChartTip from "../ChartTip";

// Each page keeps the same colour in every chart and row below.
const PAGE_COLORS = ["signal", "wire", "amber", "mint", "rose"];
const OUTCOME_COLORS = { "Pending confirmation": "amber", "Out for delivery": "wire", Delivered: "mint", Returned: "rose" };
const cssVar = (name) => `rgb(var(--c-${name}))`;
const money = (v) => `$${Math.round(v).toLocaleString()}`;

function Metric({ label, value }) {
  return (
    <div>
      <p className="text-[11px] text-mute">{label}</p>
      <p className="font-display font-semibold text-ink tabular-nums">{value}</p>
    </div>
  );
}

function PageRow({ page, color, selected, onSwitch }) {
  const [open, setOpen] = useState(false);
  const outcomes = page.outcomes.filter((o) => o.count > 0);

  return (
    <div className={`group bg-raised/50 border rounded-xl transition-colors ${selected ? "border-signal/40" : "border-line hover:border-line/80"}`}>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 p-4 lg:grid lg:grid-cols-[200px_112px_repeat(4,112px)_1fr]">
        <div className="flex items-center gap-2.5 w-full sm:w-44 lg:w-auto">
          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: cssVar(color) }} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink truncate">{page.name}</p>
            <p className={`text-[11px] ${page.status === "Healthy" ? "text-mint" : "text-amber"}`}>{page.status}</p>
          </div>
        </div>

        <div className="h-10 w-28 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={page.spark} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`spark-${page.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={cssVar(color)} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={cssVar(color)} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="value" stroke={cssVar(color)} strokeWidth={2} fill={`url(#spark-${page.id})`} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="contents">
          <Metric label="Sales" value={money(page.sales)} />
          <Metric label="Orders" value={page.orders.toLocaleString()} />
          <Metric label="People chatted" value={page.chats.toLocaleString()} />
          <Metric label="Chat → order" value={`${page.rate}%`} />
        </div>

        <div className="flex items-center gap-2 ml-auto lg:justify-self-end">
          {selected ? (
            <span className="flex items-center gap-1 text-xs text-signal"><Check size={13} />Viewing</span>
          ) : (
            <button
              onClick={() => onSwitch(page.id)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-gradient-to-br from-signal to-wire text-void font-medium opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
            >
              <ArrowRightLeft size={12} />
              Switch to this page
            </button>
          )}
          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Hide details" : "Show more details"}
            className="h-8 w-8 rounded-lg border border-line flex items-center justify-center text-mute hover:text-ink"
          >
            <ChevronDown size={15} className={`transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-line p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-mute mb-2">What happened to their COD orders</p>
                {outcomes.length === 0 ? (
                  <p className="text-sm text-mute">No orders yet.</p>
                ) : (
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={outcomes} dataKey="count" nameKey="status" innerRadius={34} outerRadius={56} paddingAngle={3} stroke="none">
                          {outcomes.map((o) => <Cell key={o.status} fill={cssVar(OUTCOME_COLORS[o.status])} />)}
                        </Pie>
                        <Tooltip content={<ChartTip />} />
                        <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-mute">{v}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 content-start">
                <Metric label="Comments replied to" value={page.comments.toLocaleString()} />
                <Metric label="Went quiet" value={page.ghosted.toLocaleString()} />
                <Metric label="Won back with follow-up" value={page.recovered.toLocaleString()} />
                <Metric label="Sales from boosted posts" value={money(page.boostedSales)} />
                <Metric label="Total leads" value={page.leads.toLocaleString()} />
                <Metric label="Best post" value={page.topPost ? page.topPost.label : "—"} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PagesOverviewBlock({ pages, selectedId, onSwitch }) {
  const colorOf = (i) => PAGE_COLORS[i % PAGE_COLORS.length];
  const totalSales = pages ? pages.reduce((s, p) => s + p.sales, 0) : 0;

  return (
    <Panel accent="wire">
      <div className="pr-9">
        <h2 className="font-display font-semibold text-ink">Pages</h2>
        <p className="text-xs text-mute mt-0.5">How each connected page is doing. Hover a page to switch into it.</p>
      </div>

      {!pages ? (
        <div className="mt-5 space-y-3 animate-pulse">
          <div className="h-52 bg-raised rounded-xl" />
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-20 bg-raised rounded-xl" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-5">
            <div className="bg-raised/50 border border-line rounded-xl p-4">
              <p className="text-xs text-mute">Share of sales</p>
              <div className="h-48 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pages} dataKey="sales" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={3} stroke="none">
                      {pages.map((p, i) => <Cell key={p.id} fill={cssVar(colorOf(i))} />)}
                    </Pie>
                    <Tooltip content={<ChartTip format={money} />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="font-display font-semibold text-ink tabular-nums">{money(totalSales)}</span>
                  <span className="text-[11px] text-mute">all pages</span>
                </div>
              </div>
            </div>

            <div className="bg-raised/50 border border-line rounded-xl p-4">
              <p className="text-xs text-mute">Chat → order rate</p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pages} layout="vertical" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <XAxis type="number" hide domain={[0, 100]} />
                    <YAxis type="category" dataKey="name" width={96} tick={{ fill: "rgb(var(--c-mute))", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: "rgb(var(--c-raised) / 0.6)" }} content={<ChartTip format={(v) => `${v}%`} />} />
                    <Bar dataKey="rate" name="Chat → order" radius={[0, 6, 6, 0]} barSize={16} label={{ position: "right", fill: "rgb(var(--c-mute))", fontSize: 11, formatter: (v) => `${v}%` }}>
                      {pages.map((p, i) => <Cell key={p.id} fill={cssVar(colorOf(i))} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-raised/50 border border-line rounded-xl p-4">
              <p className="text-xs text-mute">Comments → chats → orders</p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pages} margin={{ top: 8, right: 0, left: -24, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fill: "rgb(var(--c-mute))", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => v.split(" ")[0]} />
                    <YAxis tick={{ fill: "rgb(var(--c-mute))", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: "rgb(var(--c-raised) / 0.6)" }} content={<ChartTip />} />
                    <Bar dataKey="comments" name="Comments" fill={cssVar("signal")} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="chats" name="Chatted" fill={cssVar("wire")} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="orders" name="Orders" fill={cssVar("mint")} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="space-y-3 mt-4">
            {pages.map((p, i) => (
              <PageRow key={p.id} page={p} color={colorOf(i)} selected={selectedId === p.id} onSwitch={onSwitch} />
            ))}
          </div>
        </>
      )}
    </Panel>
  );
}
