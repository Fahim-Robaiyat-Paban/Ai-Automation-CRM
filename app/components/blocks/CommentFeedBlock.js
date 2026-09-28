"use client";

import { MessageCircle, Bot, MousePointerClick } from "lucide-react";
import Panel from "../Panel";

// A plain, literal record — who commented, what the bot replied. This is
// NOT an AI-summarized view. It's pulled straight from stored automation
// logs, so it costs nothing to render — no model re-reads the comments.
export default function CommentFeedBlock({ log }) {
  return (
    <Panel className="h-full">
      <h2 className="font-display font-semibold text-ink mb-1">Comment log</h2>
      <p className="text-xs text-mute mb-4">
        Every comment and the bot's reply, straight from the log — not AI-summarized.
      </p>

      {!log && (
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 bg-raised rounded-lg" />
          ))}
        </div>
      )}

      {log && log.length === 0 && (
        <p className="text-sm text-mute">No comments logged for this page yet.</p>
      )}

      {log && log.length > 0 && (
        <div className="space-y-3 max-h-[22rem] overflow-y-auto pr-1">
          {log.map((entry) => (
            <div key={entry.id} className="bg-raised/60 border border-line rounded-lg p-3">
              <div className="flex items-center justify-between text-[11px] text-mute mb-2">
                <span>{entry.lead} · {entry.page} · {entry.post}</span>
                <span>{entry.time}</span>
              </div>
              <div className="flex items-start gap-2 mb-1.5">
                <MessageCircle size={13} className="text-mute mt-0.5 shrink-0" />
                <p className="text-xs text-ink flex-1">{entry.comment}</p>
                {/* Structured button/Icebreaker click instead of free text —
                    a higher-confidence intent signal than parsed NLU. */}
                {entry.viaQuickReply && (
                  <span
                    title="Replied via a quick-reply button, not free text"
                    className="flex items-center gap-1 text-[10px] text-wire bg-wire/10 border border-wire/30 rounded-full px-2 py-0.5 shrink-0"
                  >
                    <MousePointerClick size={10} />
                    Quick reply
                  </span>
                )}
              </div>
              <div className="flex items-start gap-2">
                <Bot size={13} className="text-wire mt-0.5 shrink-0" />
                <p className="text-xs text-mute flex-1">{entry.botReply}</p>
                {/* A free lead-temperature signal — the customer reacted to
                    the bot's message, no reply text required to read it. */}
                {entry.reaction && (
                  <span title="Customer reacted to this message" className="text-xs shrink-0">
                    {entry.reaction}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
