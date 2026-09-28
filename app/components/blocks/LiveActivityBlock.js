"use client";

import { motion } from "framer-motion";
import Panel from "../Panel";
import { eventStyle } from "../../lib/style";

export default function LiveActivityBlock({ feed, onOpenLead }) {
  return (
    <Panel className="h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display font-semibold text-ink">Live activity</h2>
        <span className="flex items-center gap-1.5 text-xs text-signal">
          <span className="h-1.5 w-1.5 rounded-full bg-signal animate-pulse" />
          Streaming
        </span>
      </div>

      {!feed && (
        <div className="space-y-6 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 bg-raised rounded-lg" />
          ))}
        </div>
      )}

      {feed && feed.length === 0 && (
        <p className="text-sm text-mute">No activity for this page yet.</p>
      )}

      {feed && feed.length > 0 && (
        <div className="rail pl-6 space-y-6">
          {feed.map((item, i) => {
            const { Icon, color, dot } = eventStyle[item.type];
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="relative"
              >
                <span className={`rail-dot ${dot}`} />
                <button
                  onClick={() => onOpenLead(item.leadId)}
                  className="w-full flex items-start justify-between gap-4 text-left rounded-lg -mx-2 px-2 py-1 hover:bg-raised/40 transition-colors"
                >
                  <div className="flex items-start gap-2.5">
                    <Icon size={15} className={`${color} mt-0.5 shrink-0`} />
                    <div>
                      <p className="text-sm text-ink leading-snug">{item.text}</p>
                      <p className="text-xs text-mute mt-1">
                        {item.page} · {item.lead}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-mute whitespace-nowrap shrink-0">
                    {item.time}
                  </span>
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
