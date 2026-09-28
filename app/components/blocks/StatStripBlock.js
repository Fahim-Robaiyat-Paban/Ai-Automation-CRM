"use client";

import StatCard from "../StatCard";

function StatSkeleton() {
  return (
    <div className="bg-panel border border-line rounded-xl p-5 animate-pulse">
      <div className="h-3 w-28 bg-raised rounded" />
      <div className="h-7 w-16 bg-raised rounded mt-4" />
    </div>
  );
}

// One themed row of stat cards ("Sales", "Comments & chats") — picks its own
// cards out of the full stats list by key, so the page decides the grouping.
export default function StatStripBlock({ stats, keys, highlightKey, className }) {
  return (
    <div className={`grid gap-4 ${className}`}>
      {!stats
        ? keys.map((k) => <StatSkeleton key={k} />)
        : keys.map((k, i) => {
            const stat = stats.find((s) => s.key === k);
            return stat ? (
              <StatCard key={k} stat={stat} index={i} highlight={k === highlightKey} />
            ) : null;
          })}
    </div>
  );
}
