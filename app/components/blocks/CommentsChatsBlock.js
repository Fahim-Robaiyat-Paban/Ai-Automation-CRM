"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChevronDown, MessageSquareText, Users } from "lucide-react";
import Panel from "../Panel";
import ChartTip from "../ChartTip";
import { AnimatedValue } from "../StatCard";

const cssVar = (name) => `rgb(var(--c-${name}))`;
const SOURCE_COLORS = { "Regular posts": "signal", "Boosted posts": "amber", "Story replies": "wire" };
const TOPIC_COLORS = ["signal", "wire", "amber", "mint", "rose"];
const tick = { fill: "rgb(var(--c-mute))", fontSize: 10 };

function Mini({ label, value }) {
  return (
    <div>
      <p className="text-[11px] text-mute">{label}</p>
      <p className="font-display font-semibold text-ink tabular-nums">{value}</p>
    </div>
  );
}

// One big number + change on the left, a small chart on the right, two extra
// metrics along the bottom.
function InsightCard({ accent, Icon, gradient, stat, chart, minis }) {
  return (
    <Panel accent={accent} className="overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs text-mute">{stat.label}</p>
        <span className={`h-8 w-8 rounded-lg ${gradient} flex items-center justify-center text-void shrink-0`}>
          <Icon size={15} />
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-[auto_minmax(0,1fr)] gap-4 items-center mt-2">
        <div>
          <p className="font-display text-3xl font-semibold text-ink tabular-nums">
            <AnimatedValue value={stat.value} />
          </p>
          <p className={`text-xs font-medium mt-1 ${stat.delta.startsWith("-") ? "text-rose" : "text-mint"}`}>{stat.delta}</p>
        </div>
        <div className="h-28 min-w-0">{chart}</div>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-line">
        {minis.map((m) => <Mini key={m.label} {...m} />)}
      </div>
    </Panel>
  );
}

export default function CommentsChatsBlock({ stats, details }) {
  const [expanded, setExpanded] = useState(false);
  const comments = stats?.find((s) => s.key === "commentsHandled");
  const chats = stats?.find((s) => s.key === "engagedLeads");

  if (!stats || !details || !comments || !chats) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-pulse">
        {[0, 1].map((i) => <div key={i} className="h-56 bg-panel border border-line rounded-xl" />)}
      </div>
    );
  }

  const perPost = details.chatsPerPost;
  const histogram = (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={details.byHour} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <XAxis dataKey="label" tick={tick} axisLine={false} tickLine={false} interval={1} />
        <YAxis hide />
        <Tooltip cursor={{ fill: "rgb(var(--c-raised) / 0.6)" }} content={<ChartTip />} />
        <Bar dataKey="count" name="Comments" fill={cssVar("signal")} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
  const donut = (
    <div className="flex items-center gap-3 h-full">
      <div className="h-full w-28 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={details.chatSources} dataKey="count" nameKey="name" innerRadius={30} outerRadius={50} paddingAngle={3} stroke="none">
              {details.chatSources.map((s) => <Cell key={s.name} fill={cssVar(SOURCE_COLORS[s.name])} />)}
            </Pie>
            <Tooltip content={<ChartTip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="space-y-1.5 min-w-0">
        {details.chatSources.map((s) => (
          <li key={s.name} className="flex items-center gap-2 text-[11px] text-mute">
            <span className="h-2 w-2 rounded-full shrink-0" style={{ background: cssVar(SOURCE_COLORS[s.name]) }} />
            <span className="truncate">{s.name}</span>
            <span className="text-ink font-medium tabular-nums">{s.count.toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <InsightCard
          accent="signal" Icon={MessageSquareText} gradient="bg-grad-signal" stat={comments}
          chart={histogram}
          minis={[
            { label: "Price questions", value: details.priceQuestions.toLocaleString() },
            { label: "Comment → chat rate", value: `${details.commentToChatRate}%` },
          ]}
        />
        <InsightCard
          accent="wire" Icon={Users} gradient="bg-grad-wire" stat={chats}
          chart={donut}
          minis={[
            { label: "Chats per post", value: perPost >= 10 ? Math.round(perPost).toLocaleString() : perPost.toFixed(1) },
            { label: "Avg. messages per chat", value: details.avgMessagesPerChat.toFixed(1) },
          ]}
        />
      </div>

      <button
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="mx-auto mt-3 flex items-center gap-1.5 text-xs text-mute hover:text-ink transition-colors"
      >
        {expanded ? "Show less" : "More insight"}
        <ChevronDown size={13} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-3">
              <Panel accent="amber">
                <p className="text-xs text-mute mb-2">What people ask about</p>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={details.topics} layout="vertical" margin={{ top: 4, right: 28, left: 0, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="topic" width={60} tick={{ ...tick, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: "rgb(var(--c-raised) / 0.6)" }} content={<ChartTip />} />
                      <Bar dataKey="count" name="Comments" radius={[0, 6, 6, 0]} barSize={16} label={{ position: "right", fill: "rgb(var(--c-mute))", fontSize: 11 }}>
                        {details.topics.map((t, i) => <Cell key={t.topic} fill={cssVar(TOPIC_COLORS[i % TOPIC_COLORS.length])} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Panel>

              <Panel accent="mint">
                <p className="text-xs text-mute mb-3">Top posts by comments</p>
                <ol className="space-y-3">
                  {details.topPosts.map((p, i) => (
                    <li key={p.label} className="flex items-center gap-3">
                      <span className="h-6 w-6 rounded-md bg-raised border border-line text-[11px] text-mute flex items-center justify-center">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-ink truncate">{p.label}</p>
                        <p className="text-[11px] text-mute truncate">{p.product}</p>
                      </div>
                      <span className="text-sm font-medium text-ink tabular-nums">{p.comments.toLocaleString()}</span>
                    </li>
                  ))}
                </ol>
              </Panel>

              <Panel accent="rose">
                <p className="text-xs text-mute mb-3">Most common words</p>
                <div className="flex flex-wrap gap-2">
                  {details.commonWords.map((w) => (
                    <span key={w.word} className="flex items-center gap-1.5 text-xs bg-raised border border-line rounded-full px-2.5 py-1 text-ink">
                      {w.word}
                      <span className="text-mute tabular-nums">{w.count.toLocaleString()}</span>
                    </span>
                  ))}
                </div>
              </Panel>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
