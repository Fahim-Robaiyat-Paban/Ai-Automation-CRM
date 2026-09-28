"use client";

import { useEffect, useState } from "react";
import Topbar from "./components/Topbar";
import RangeSwitch from "./components/RangeSwitch";
import TrendChart from "./components/TrendChart";
import Movable from "./components/Movable";
import StatStripBlock from "./components/blocks/StatStripBlock";
import GhostedRecoveryBlock from "./components/blocks/GhostedRecoveryBlock";
import PagesOverviewBlock from "./components/blocks/PagesOverviewBlock";
import CommentsChatsBlock from "./components/blocks/CommentsChatsBlock";
import { getStats, getGhostedRecovery, getPagesOverview, getEngagementDetails } from "./lib/api";
import { useRange } from "./lib/range-context";
import { usePageScope } from "./lib/page-scope-context";
import { useDashboardLayout } from "./lib/dashboard-layout-context";

const SALES_KEYS = ["estimatedRevenue", "adAttributedRevenue", "ordersPlaced", "conversionRate"];

export default function DashboardPage() {
  const { period } = useRange();
  const { pageId, setPageId, pages: pageOptions } = usePageScope();
  const { order } = useDashboardLayout();

  const [stats, setStats] = useState(null);
  const [ghostedRecovery, setGhostedRecovery] = useState(null);
  const [pagesOverview, setPagesOverview] = useState(null);
  const [details, setDetails] = useState(null);

  // Everything re-fetches when the period or the selected page changes —
  // same simulated-network pattern as the rest of the app.
  useEffect(() => {
    setStats(null);
    setGhostedRecovery(null);
    getStats(period, pageId).then(setStats);
    getGhostedRecovery(period, pageId).then(setGhostedRecovery);
    setDetails(null);
    getEngagementDetails(period, pageId).then(setDetails);
  }, [period, pageId]);

  // The Pages card always compares the whole account, so it only follows the
  // period, not the selected page.
  useEffect(() => {
    setPagesOverview(null);
    getPagesOverview(period).then(setPagesOverview);
  }, [period]);

  function switchToPage(id) {
    setPageId(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // The one metric that moved the most this period gets the standout treatment.
  const highlightKey = stats
    ? stats
        .filter((s) => SALES_KEYS.includes(s.key))
        .reduce(
          (best, s) => {
            const magnitude = Math.abs(parseInt(s.delta, 10)) || 0;
            return magnitude > best.magnitude ? { key: s.key, magnitude } : best;
          },
          { key: null, magnitude: -1 }
        ).key
    : null;

  const sections = {
    sales: (
      <Movable id="sales" label="Sales">
        <StatStripBlock stats={stats} keys={SALES_KEYS} highlightKey={highlightKey} className="grid-cols-2 lg:grid-cols-4" />
      </Movable>
    ),
    activity: (
      <Movable id="activity" label="Comments & chats">
        <CommentsChatsBlock stats={stats} details={details} />
      </Movable>
    ),
    ghosted: (
      <Movable id="ghosted">
        <GhostedRecoveryBlock data={ghostedRecovery} />
      </Movable>
    ),
    revenue: (
      <Movable id="revenue">
        <TrendChart />
      </Movable>
    ),
    // Only worth showing when there's more than one page to compare.
    pages: pageOptions.length > 1 && (
      <Movable id="pages">
        <PagesOverviewBlock pages={pagesOverview} selectedId={pageId} onSwitch={switchToPage} />
      </Movable>
    ),
  };

  return (
    <>
      <Topbar
        title="Signal Feed"
        subtitle="Everything your automations did, as it happens."
        actions={<RangeSwitch />}
      />

      <div className="p-4 md:p-8 space-y-8">
        {order.map((id) => (
          <div key={id}>{sections[id]}</div>
        ))}
      </div>
    </>
  );
}
