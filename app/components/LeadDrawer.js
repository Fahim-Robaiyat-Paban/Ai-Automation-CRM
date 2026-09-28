"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { getConversation } from "../lib/api";
import { eventStyle, stageStyle } from "../lib/style";

export default function LeadDrawer({ lead, onClose }) {
  const [conversation, setConversation] = useState(null);

  useEffect(() => {
    if (!lead) return;
    setConversation(null);
    getConversation(lead.id).then(setConversation);
  }, [lead]);

  useEffect(() => {
    if (!lead) return;
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lead, onClose]);

  return (
    <AnimatePresence>
      {lead && (
        <div className="fixed inset-0 z-30 flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 bg-void/70 backdrop-blur-sm"
            onClick={onClose}
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
                <h2 className="font-display font-semibold text-lg text-ink">
                  {lead.name}
                </h2>
                <p className="text-xs text-mute mt-0.5">
                  {lead.page} · {lead.email}
                </p>
              </div>
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-lg bg-raised border border-line flex items-center justify-center text-mute hover:text-ink"
                aria-label="Close"
              >
                <X size={15} />
              </button>
            </div>

            <span
              className={`inline-block text-xs px-2.5 py-1 rounded-full border mt-3 ${stageStyle[lead.stage]}`}
            >
              {lead.stage}
            </span>

            <div className="mt-6 pt-6 border-t border-line">
              <p className="text-xs text-mute mb-4">Full conversation</p>

              <AnimatePresence mode="wait">
                {conversation === null && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4 animate-pulse"
                  >
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="h-10 bg-raised rounded-lg" />
                    ))}
                  </motion.div>
                )}

                {conversation && conversation.length === 0 && (
                  <motion.p
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm text-mute"
                  >
                    No conversation recorded for this lead yet.
                  </motion.p>
                )}

                {conversation && conversation.length > 0 && (
                  <motion.div
                    key="rail"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="rail pl-6 space-y-4"
                  >
                    {conversation.map((step, i) => {
                      const { dot } = eventStyle[step.icon] || eventStyle.comment;
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: 8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="relative"
                        >
                          <span className={`rail-dot ${dot}`} />
                          <p className="text-sm text-ink">{step.text}</p>
                          <p className="text-xs text-mute">{step.meta}</p>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
