"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { getTrend } from "../lib/api";
import { useRange } from "../lib/range-context";
import { usePageScope } from "../lib/page-scope-context";
import Panel from "./Panel";
import ChartTip from "./ChartTip";

const money = (v) => `$${Math.round(v).toLocaleString()}`;

// Sales split into organic vs. boosted-post sales (stacked bars) with the
// order count riding on top as a line — so one chart answers "how much,
// where did it come from, and how many orders was that".
export default function TrendChart() {
  const { period } = useRange();
  const { pageId } = usePageScope();
  const [data, setData] = useState(null);

  useEffect(() => {
    let active = true;
    setData(null);
    getTrend(period, pageId).then((res) => active && setData(res));
    return () => {
      active = false;
    };
  }, [period, pageId]);

  const summary = useMemo(() => {
    if (!data) return null;
    const total = data.points.reduce((s, p) => s + p.value, 0);
    const boosted = data.points.reduce((s, p) => s + p.boosted, 0);
    const best = data.points.reduce((a, b) => (b.value > a.value ? b : a));
    return {
      total,
      best,
      average: total / data.points.length,
      boostedPct: total ? Math.round((boosted / total) * 100) : 0,
    };
  }, [data]);

  const tiles = summary && [
    { label: "Total sales", value: money(summary.total) },
    { label: `Best ${(data?.grain || "day")}`, value: money(summary.best.value), sub: summary.best.label },
    { label: `Average per ${(data?.grain || "day")}`, value: money(summary.average) },
    { label: "From boosted posts", value: `${summary.boostedPct}%` },
  ];

  return (
    <Panel accent="signal" className="h-full">
      <div className="pr-9">
        <h2 className="font-display font-semibold text-ink">Revenue trend</h2>
        <p className="text-xs text-mute mt-0.5">{data?.unit || "Loading…"}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        {(tiles || Array.from({ length: 4 })).map((t, i) => (
          <div key={t?.label || i} className="bg-raised/60 border border-line rounded-lg px-3 py-2.5">
            {t ? (
              <>
                <p className="text-[11px] text-mute">{t.label}</p>
                <p className="font-display font-semibold text-ink tabular-nums">
                  {t.value}
                  {t.sub && <span className="text-xs text-mute font-normal ml-1.5">{t.sub}</span>}
                </p>
              </>
            ) : (
              <div className="h-9 animate-pulse" />
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 mt-5 text-[11px] text-mute">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-signal" />Organic sales</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-amber" />Boosted-post sales</span>
        <span className="flex items-center gap-1.5"><span className="h-0.5 w-3 bg-wire rounded" />Orders</span>
      </div>

      <div className="h-72 mt-3">
        {!data ? (
          <div className="h-full w-full bg-raised rounded-lg animate-pulse" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data.points} margin={{ top: 8, right: 0, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="organicFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(var(--c-signal))" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="rgb(var(--c-signal))" stopOpacity={0.45} />
                </linearGradient>
                <linearGradient id="boostedFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(var(--c-amber))" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="rgb(var(--c-amber))" stopOpacity={0.5} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgb(var(--c-line))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "rgb(var(--c-mute))", fontSize: 11 }} axisLine={{ stroke: "rgb(var(--c-line))" }} tickLine={false} />
              <YAxis yAxisId="sales" tick={{ fill: "rgb(var(--c-mute))", fontSize: 11 }} axisLine={false} tickLine={false} width={48} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)} />
              <YAxis yAxisId="orders" orientation="right" tick={{ fill: "rgb(var(--c-mute))", fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
              <Tooltip
                cursor={{ fill: "rgb(var(--c-raised) / 0.6)" }}
                content={<ChartTip format={(v, p) => (p.dataKey === "orders" ? v.toLocaleString() : money(v))} />}
              />
              <Bar yAxisId="sales" dataKey="organic" name="Organic" stackId="s" fill="url(#organicFill)" maxBarSize={44} />
              <Bar yAxisId="sales" dataKey="boosted" name="Boosted" stackId="s" fill="url(#boostedFill)" radius={[6, 6, 0, 0]} maxBarSize={44} />
              <Line yAxisId="orders" type="monotone" dataKey="orders" name="Orders" stroke="rgb(var(--c-wire))" strokeWidth={2.5} dot={{ r: 3, fill: "rgb(var(--c-wire))", strokeWidth: 0 }} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </Panel>
  );
}
