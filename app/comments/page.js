"use client";

import { useEffect, useState } from "react";
import Topbar from "../components/Topbar";
import LeadDrawer from "../components/LeadDrawer";
import LiveActivityBlock from "../components/blocks/LiveActivityBlock";
import CommentFeedBlock from "../components/blocks/CommentFeedBlock";
import { getFeed, getCommentFeed, getLeadById } from "../lib/api";
import { usePageScope } from "../lib/page-scope-context";

// The live activity stream and the raw comment log — moved off Signal Feed so
// the front page stays about numbers, and this page is where you read along.
export default function CommentActivityPage() {
  const { pageId } = usePageScope();
  const [feed, setFeed] = useState(null);
  const [log, setLog] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setFeed(null);
    setLog(null);
    getFeed(pageId).then(setFeed);
    getCommentFeed(pageId).then(setLog);
  }, [pageId]);

  function openLead(leadId) {
    getLeadById(leadId).then((lead) => {
      if (lead) setSelected(lead);
    });
  }

  return (
    <>
      <Topbar
        title="Comment activity"
        subtitle="Every comment the bot caught, what it replied, and what happened next."
      />
      <div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LiveActivityBlock feed={feed} onOpenLead={openLead} />
        <CommentFeedBlock log={log} />
      </div>
      <LeadDrawer lead={selected} onClose={() => setSelected(null)} />
    </>
  );
}
