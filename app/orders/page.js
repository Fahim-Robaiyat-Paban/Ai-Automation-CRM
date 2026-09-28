"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { PackageCheck, Truck, RotateCcw } from "lucide-react";
import Topbar from "../components/Topbar";
import LeadDrawer from "../components/LeadDrawer";
import Panel from "../components/Panel";
import { getOrders, getOrderSummary, getLeadById, ORDER_STATUSES } from "../lib/api";
import { orderStatusStyle } from "../lib/style";
import { usePageScope } from "../lib/page-scope-context";

const STATUS_FILTERS = ["All", ...ORDER_STATUSES];

const SUMMARY_TILES = [
  { key: "confirmedRevenue", label: "Confirmed revenue", Icon: PackageCheck, color: "text-mint", money: true },
  { key: "pendingRevenue", label: "Pending COD", Icon: Truck, color: "text-wire", money: true },
  { key: "returned", label: "Returned orders", Icon: RotateCcw, color: "text-rose", money: false },
];

export default function OrdersPage() {
  const { pageId } = usePageScope();
  const [orders, setOrders] = useState(null);
  const [summary, setSummary] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setOrders(null);
    setSummary(null);
    getOrders(pageId).then(setOrders);
    getOrderSummary(pageId).then(setSummary);
  }, [pageId]);

  const visible = useMemo(() => {
    if (!orders) return [];
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      const matchesStatus = status === "All" || o.status === status;
      const matchesSearch =
        !q ||
        o.lead.toLowerCase().includes(q) ||
        o.product.toLowerCase().includes(q) ||
        o.page.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [orders, search, status]);

  function openLead(leadId) {
    getLeadById(leadId).then((lead) => {
      if (lead) setSelected(lead);
    });
  }

  return (
    <>
      <Topbar
        title="Orders"
        subtitle="What actually happened after a COD order was placed — not just that it was."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by lead, product, page…"
      />

      <div className="p-4 md:p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {SUMMARY_TILES.map(({ key, label, Icon, color, money }) => (
            <Panel key={key}>
              <div className="flex items-start justify-between">
                <p className="text-xs text-mute">{label}</p>
                <Icon size={15} className={color} />
              </div>
              <p className="font-display text-2xl font-semibold text-ink tabular-nums mt-3">
                {!summary ? (
                  <span className="inline-block h-7 w-16 bg-raised rounded animate-pulse" />
                ) : money ? (
                  `$${summary[key].toLocaleString()}`
                ) : (
                  summary[key].toLocaleString()
                )}
              </p>
              {summary && key === "returned" && (
                <p className="text-xs text-mute mt-1">{summary.returnRate}% of {summary.total} orders</p>
              )}
            </Panel>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_FILTERS.map((s) => {
            const active = status === s;
            return (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`relative text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  active ? "border-wire/50 text-ink" : "border-line text-mute hover:text-ink"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="order-status-pill"
                    className="absolute inset-0 rounded-full bg-wire/15"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="relative z-10">{s}</span>
              </button>
            );
          })}
        </div>

        <div className="bg-panel border border-line rounded-xl overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b border-line text-left text-xs text-mute">
                <th className="px-6 py-4 font-medium">Order</th>
                <th className="px-6 py-4 font-medium">Lead</th>
                <th className="px-6 py-4 font-medium">Page</th>
                <th className="px-6 py-4 font-medium">Product</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Placed</th>
              </tr>
            </thead>
            <tbody>
              {!orders &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-line last:border-0">
                    <td colSpan={7} className="px-6 py-4">
                      <div className="h-4 bg-raised rounded animate-pulse" />
                    </td>
                  </tr>
                ))}

              {orders && visible.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-mute text-sm">
                    No orders match this search or filter.
                  </td>
                </tr>
              )}

              {orders &&
                visible.map((o, i) => (
                  <motion.tr
                    key={o.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i, 8) * 0.03 }}
                    onClick={() => openLead(o.leadId)}
                    className="border-b border-line last:border-0 hover:bg-raised/50 cursor-pointer"
                  >
                    <td className="px-6 py-4 text-mute">{o.id}</td>
                    <td className="px-6 py-4 text-ink font-medium">{o.lead}</td>
                    <td className="px-6 py-4 text-mute">{o.page}</td>
                    <td className="px-6 py-4 text-mute">{o.product}</td>
                    <td className="px-6 py-4 text-ink tabular-nums">${o.amount}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full border whitespace-nowrap ${orderStatusStyle[o.status]}`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-mute whitespace-nowrap">{o.placed}</td>
                  </motion.tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <LeadDrawer lead={selected} onClose={() => setSelected(null)} />
    </>
  );
}
