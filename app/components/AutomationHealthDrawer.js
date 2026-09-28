"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, X, UserCog, Zap, Target } from "lucide-react";
import { getAutomationHealth } from "../lib/api";
import { useRange } from "../lib/range-context";
import { usePageScope } from "../lib/page-scope-context";

// Self-contained: owns its own trigger button + open state, so dropping this
// into Topbar doesn't require Topbar to manage anything. Same slide-in-drawer
// pattern as LeadDrawer — second-tier info an admin checks occasionally,
// reached with one click instead of permanent front-page real estate.
export default function AutomationHealthDrawer() {
  const { period } = useRange();
  const { pageId } = usePageScope();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!open) return;
    setData(null);
    getAutomationHealth(period, pageId).then(setData);
  }, [open, period, pageId]);

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const confidencePct = data && data.engaged ? Math.round((data.matched / data.engaged) * 100) : 0;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative h-9 w-9 rounded-lg bg-raised border border-line flex items-center justify-center text-mute hover:text-ink"
        aria-label="Automation health"
        title="Automation health"
      >
        <Activity size={16} />
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-30 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 bg-void/70 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="relative w-full max-w-md bg-panel border-l border-line h-full overflow-y-auto p-6"
            >
              <div className="flex items-start justify-between mb-1">
                <div>
                  <h2 className="font-display font-semibold text-lg text-ink">Automation health</h2>
                  <p className="text-xs text-mute mt-0.5">What the AI chatbot handled on its own vs. needed help with.</p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="h-8 w-8 rounded-lg bg-raised border border-line flex items-center justify-center text-mute hover:text-ink"
                  aria-label="Close"
                >
                  <X size={15} />
                </button>
              </div>

              {!data && (
                <div className="mt-6 space-y-4 animate-pulse">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-16 bg-raised rounded-lg" />
                  ))}
                </div>
              )}

              {data && (
                <div className="mt-6 space-y-3">
                  <div className="bg-raised/60 border border-line rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <UserCog size={14} className="text-amber" />
                      <p className="text-xs text-mute">Escalated to a human</p>
                    </div>
                    <p className="font-display text-xl font-semibold text-ink tabular-nums">
                      {data.escalations.toLocaleString()}
                    </p>
                    <p className="text-xs text-mute mt-1">
                      {data.escalationRate}% of {data.engaged.toLocaleString()} engaged conversations — the AI chatbot
                      couldn't close these on its own.
                    </p>
                  </div>

                  <div className="bg-raised/60 border border-line rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap size={14} className="text-signal" />
                      <p className="text-xs text-mute">Avg. comment → private reply</p>
                    </div>
                    <p className="font-display text-xl font-semibold text-ink tabular-nums">
                      {data.avgLatencySeconds}s
                    </p>
                  </div>

                  <div className="bg-raised/60 border border-line rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Target size={14} className="text-mint" />
                      <p className="text-xs text-mute">Attribution confidence</p>
                    </div>
                    <p className="font-display text-xl font-semibold text-ink tabular-nums">{confidencePct}%</p>
                    <p className="text-xs text-mute mt-1">
                      {data.matched.toLocaleString()} of {data.engaged.toLocaleString()} engaged conversations traced
                      back to the comment/post that started them.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
