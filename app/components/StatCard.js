"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { MessageSquareText, Users, ShoppingBag, TrendingUp, Percent, Megaphone } from "lucide-react";

// Each stat owns a colour: `gradient` fills the icon chip and corner glow,
// `tint` washes the whole card so the row reads as a set of distinct things.
const META = {
  estimatedRevenue: { Icon: TrendingUp, gradient: "bg-grad-mint", tint: "from-mint/15" },
  adAttributedRevenue: { Icon: Megaphone, gradient: "bg-grad-warm", tint: "from-amber/15" },
  ordersPlaced: { Icon: ShoppingBag, gradient: "bg-grad-wire", tint: "from-wire/15" },
  conversionRate: { Icon: Percent, gradient: "bg-grad-signal", tint: "from-signal/15" },
  commentsHandled: { Icon: MessageSquareText, gradient: "bg-grad-signal", tint: "from-signal/15" },
  engagedLeads: { Icon: Users, gradient: "bg-grad-wire", tint: "from-wire/15" },
};

// Which corner the glow sits in, per card index — so four cards in a row
// don't all wear the identical "blob in the top-right" tell.
const CORNERS = ["-top-8 -right-8", "-bottom-8 -left-8", "-top-8 -left-8", "-bottom-8 -right-8"];

// Splits "$1,234" / "30%" / "47s" into prefix, number and suffix so the
// number can count up while its unit stays put.
function parseValue(str) {
  const match = String(str).match(/^(\D*)([\d,]+)(\D*)$/);
  if (!match) return { prefix: "", suffix: "", num: 0 };
  const [, prefix, digits, suffix] = match;
  return { prefix, suffix, num: parseInt(digits.replace(/,/g, ""), 10) || 0 };
}

function useCountUp(target, duration = 650) {
  const [value, setValue] = useState(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    const from = prevTarget.current;
    const to = target;
    if (from === to) return;
    const start = performance.now();

    let raf;
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out-cubic
      setValue(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else prevTarget.current = to;
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

export function AnimatedValue({ value }) {
  const { prefix, suffix, num } = parseValue(value);
  const animated = useCountUp(num);
  return <>{prefix}{animated.toLocaleString()}{suffix}</>;
}

export default function StatCard({ stat, index, highlight }) {
  const { prefix, suffix, num } = parseValue(stat.value);
  const animated = useCountUp(num);
  const { Icon, gradient, tint } = META[stat.key] || META.commentsHandled;
  const corner = CORNERS[index % CORNERS.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: "easeOut" }}
      whileHover={{ y: -3 }}
      data-tint={tint.slice(5, tint.indexOf("/"))} data-highlight={highlight ? "true" : undefined} className={`group relative bg-panel bg-gradient-to-br ${tint} to-transparent border rounded-xl p-5 overflow-hidden transition-colors ${
        highlight ? "border-signal/40" : "border-line"
      }`}
    >
      <div
        className={`absolute ${corner} h-24 w-24 rounded-full ${gradient} blur-xl transition-opacity ${
          highlight ? "opacity-40 stat-highlight" : "opacity-[0.08] group-hover:opacity-20"
        }`}
      />
      <div className="relative flex items-start justify-between">
        <p className="text-xs text-mute">{stat.label}</p>
        <span className={`h-7 w-7 rounded-lg ${gradient} flex items-center justify-center text-void shrink-0`}>
          <Icon size={13} strokeWidth={2.25} />
        </span>
      </div>
      <div className="relative flex items-end justify-between mt-3">
        <span className="font-display text-2xl font-semibold text-ink tabular-nums">
          {prefix}
          {animated.toLocaleString()}
          {suffix}
        </span>
        <span
          className={`text-xs font-medium ${
            stat.delta.startsWith("-") ? "text-rose" : "text-mint"
          }`}
        >
          {stat.delta}
        </span>
      </div>
    </motion.div>
  );
}
