import {
  MessageCircle,
  MessagesSquare,
  CheckCircle2,
  Clock,
} from "lucide-react";

// Three real stages: a comment came in, the bot got a real back-and-forth
// conversation going in the inbox ("engaged"), or the lead went quiet
// ("ghosted"). Paid is the terminal success state off of "engaged".
export const eventStyle = {
  paid: { Icon: CheckCircle2, color: "text-mint", dot: "bg-mint" },
  engaged: { Icon: MessagesSquare, color: "text-wire", dot: "bg-wire" },
  ghosted: { Icon: Clock, color: "text-rose", dot: "bg-rose" },
  comment: { Icon: MessageCircle, color: "text-mute", dot: "bg-mute" },
};

export const stageToEvent = {
  Commented: "comment",
  Engaged: "engaged",
  Paid: "paid",
  Ghosted: "ghosted",
};

export const stageStyle = {
  Commented: "text-mute bg-mute/10 border-mute/30",
  Engaged: "text-wire bg-wire/10 border-wire/30",
  Paid: "text-mint bg-mint/10 border-mint/30",
  Ghosted: "text-rose bg-rose/10 border-rose/30",
};

// COD delivery outcome — separate from the funnel's "Paid" stage above,
// which only means an order was placed. This is what actually happened to
// it afterward (see the Orders page / getOrderSummary in api.js).
export const orderStatusStyle = {
  "Pending confirmation": "text-amber bg-amber/10 border-amber/30",
  "Out for delivery": "text-wire bg-wire/10 border-wire/30",
  Delivered: "text-mint bg-mint/10 border-mint/30",
  Returned: "text-rose bg-rose/10 border-rose/30",
};
