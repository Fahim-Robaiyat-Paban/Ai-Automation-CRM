"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, ArrowRight } from "lucide-react";
import Topbar from "../components/Topbar";
import { getPosts, getConversation } from "../lib/api";
import { eventStyle, stageStyle } from "../lib/style";
import { usePageScope } from "../lib/page-scope-context";

export default function PostsPage() {
  const { pageId } = usePageScope();
  const [posts, setPosts] = useState(null);
  const [search, setSearch] = useState("");
  const [activePostId, setActivePostId] = useState(null);
  const [activeLeadId, setActiveLeadId] = useState(null);
  const [conversation, setConversation] = useState(null);

  useEffect(() => {
    setPosts(null);
    setActivePostId(null);
    setActiveLeadId(null);
    getPosts(pageId).then((data) => {
      setPosts(data);
      if (data[0]) {
        setActivePostId(data[0].id);
        const firstComment = data[0].comments[0];
        if (firstComment) setActiveLeadId(firstComment.leadId);
      }
    });
  }, [pageId]);

  useEffect(() => {
    if (!activeLeadId) return;
    setConversation(null);
    getConversation(activeLeadId).then(setConversation);
  }, [activeLeadId]);

  const activePost = posts?.find((p) => p.id === activePostId);
  const activeComment = activePost?.comments.find(
    (c) => c.leadId === activeLeadId
  );

  const filteredPosts = posts?.filter(
    (p) =>
      !search.trim() ||
      p.label.toLowerCase().includes(search.toLowerCase()) ||
      p.page.toLowerCase().includes(search.toLowerCase()) ||
      p.caption.toLowerCase().includes(search.toLowerCase())
  );

  function selectPost(post) {
    setActivePostId(post.id);
    const firstComment = post.comments[0];
    setActiveLeadId(firstComment ? firstComment.leadId : null);
  }

  return (
    <>
      <Topbar
        title="Posts & Comments"
        subtitle="Every comment, traced to the lead and conversation behind it."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search posts by page or caption…"
      />

      <div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          {!posts &&
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-20 bg-panel border border-line rounded-xl animate-pulse"
              />
            ))}

          {posts && filteredPosts.length === 0 && (
            <p className="text-sm text-mute px-1">No posts match that search.</p>
          )}

          {posts &&
            filteredPosts.map((p, i) => (
              <motion.button
                key={p.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => selectPost(p)}
                className={`w-full text-left rounded-xl border p-4 transition-colors ${
                  p.id === activePostId
                    ? "bg-raised border-wire/40"
                    : "bg-panel border-line hover:border-line/80"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-ink">{p.label}</span>
                  <span className="text-xs text-mute">{p.page}</span>
                </div>
                <p className="text-xs text-mute mt-1.5 line-clamp-1">
                  {p.caption}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  {p.price ? (
                    <span className="text-[11px] text-mint">
                      {p.product} — ${p.price}
                    </span>
                  ) : (
                    <span className="text-[11px] text-amber">Not priced yet — excluded from revenue</span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs">
                  <span className="flex items-center gap-1 text-mute">
                    <MessageCircle size={12} /> {p.comments.length}
                  </span>
                  <span className="text-signal">{p.priceAsks} price asks</span>
                </div>
              </motion.button>
            ))}
        </div>

        <div className="lg:col-span-2 bg-panel border border-line rounded-xl p-6">
          {!activePost && (
            <p className="text-sm text-mute">Pick a post to see its comments.</p>
          )}

          <AnimatePresence mode="wait">
            {activePost && (
              <motion.div
                key={activePost.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
              >
                <div className="flex items-center justify-between mb-1">
                  <h2 className="font-display font-semibold text-ink">
                    {activePost.label} — comments asking about price
                  </h2>
                  <span className="text-xs text-mute">
                    {activePost.priceAsks} of {activePost.comments.length} comments
                  </span>
                </div>
                <p className="text-xs text-mute mb-6">
                  {activePost.page} · {activePost.caption}
                </p>

                <div className="space-y-4">
                  {activePost.comments.map((c) => (
                    <button
                      key={c.leadId}
                      onClick={() => setActiveLeadId(c.leadId)}
                      className={`w-full flex items-center justify-between border-b border-line/70 pb-4 last:border-0 last:pb-0 text-left rounded-lg -mx-2 px-2 transition-colors ${
                        c.leadId === activeLeadId ? "bg-raised/60" : "hover:bg-raised/30"
                      }`}
                    >
                      <p className="text-sm text-ink">
                        <span className="font-medium">{c.name}</span>
                        <span className="text-mute"> — "{c.text}"</span>
                      </p>
                      <div className="flex items-center gap-3 shrink-0 pl-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${stageStyle[c.stage]}`}>
                          {c.stage}
                        </span>
                        <ArrowRight size={14} className="text-mute" />
                      </div>
                    </button>
                  ))}
                </div>

                {activeComment && (
                  <div className="mt-6 pt-5 border-t border-line">
                    <p className="text-xs text-mute mb-3">
                      Conversation with {activeComment.name} — {activeComment.stage}
                    </p>

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
                            <div key={i} className="h-8 bg-raised rounded-lg" />
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
                          No further conversation recorded yet.
                        </motion.p>
                      )}

                      {conversation && conversation.length > 0 && (
                        <motion.div
                          key={activeLeadId}
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
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
