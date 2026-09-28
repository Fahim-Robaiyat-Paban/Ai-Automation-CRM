"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { UserX, Send, MessagesSquare, ShoppingBag, ChevronDown, Eye, EyeOff } from "lucide-react";
import Panel from "../Panel";

// The whole follow-up lifecycle, not a single "ghosted" count — this is
// deliberately its own promoted section (see README), not a small card:
// went quiet → we followed up → they came back and kept talking → some of
// those actually placed an order because of the follow-up.
const TILES = [
  { key: "ghosted", label: "Ghosted", Icon: UserX, color: "text-rose" },
  { key: "followedUp", label: "Followed up", Icon: Send, color: "text-wire" },
  { key: "continued", label: "Continued talking", Icon: MessagesSquare, color: "text-signal" },
  { key: "recoveredOrders", label: "Recovered orders", Icon: ShoppingBag, color: "text-mint" },
];

export default function GhostedRecoveryBlock({ data }) {
  // Expands in place — the seen/never-seen breakdown behind "Ghosted" lives
  // inside this same card instead of becoming a 5th tile or a new panel.
  const [expanded, setExpanded] = useState(false);

  return (
    <Panel accent="rose" className="h-full">
      <div className="pr-9 mb-5">
        <h2 className="font-display font-semibold text-ink mb-1">Ghosted & recovery</h2>
        <p className="text-xs text-mute">
          The full follow-up lifecycle — who went quiet, who we won back, and how many of them ordered because of it.
        </p>
      </div>

      {!data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-raised rounded-lg" />
          ))}
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {TILES.map(({ key, label, Icon, color }) => {
              const isGhosted = key === "ghosted";
              const Tile = isGhosted ? "button" : "div";
              return (
                <Tile
                  key={key}
                  onClick={isGhosted ? () => setExpanded((v) => !v) : undefined}
                  className={`bg-raised/60 border rounded-lg p-3 text-left transition-colors ${
                    isGhosted
                      ? `hover:border-line/80 ${expanded ? "border-rose/40" : "border-line"}`
                      : "border-line"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon size={14} className={color} />
                    {isGhosted && (
                      <ChevronDown
                        size={12}
                        className={`text-mute transition-transform ${expanded ? "rotate-180" : ""}`}
                      />
                    )}
                  </div>
                  <p className="font-display font-semibold text-ink tabular-nums text-lg">
                    {data[key].toLocaleString()}
                  </p>
                  <p className="text-[11px] text-mute mt-0.5">{label}</p>
                </Tile>
              );
            })}
          </div>

          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="bg-raised/40 border border-line rounded-lg p-3">
                    <Eye size={13} className="text-amber mb-1.5" />
                    <p className="font-display font-semibold text-ink tabular-nums">
                      {data.seenNoReply.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-mute mt-0.5">Seen, no reply</p>
                  </div>
                  <div className="bg-raised/40 border border-line rounded-lg p-3">
                    <EyeOff size={13} className="text-mute mb-1.5" />
                    <p className="font-display font-semibold text-ink tabular-nums">
                      {data.neverSeen.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-mute mt-0.5">Never seen</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-4 pt-4 border-t border-line flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-mute">Reply rate on follow-up</span>
              <span className="text-sm font-medium text-signal tabular-nums">
                {data.continueRate}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-mute">Orders won back</span>
              <span className="text-sm font-medium text-mint tabular-nums">
                {data.recoveredRate}%
              </span>
            </div>
          </div>
        </>
      )}
    </Panel>
  );
}
