import { motion } from "framer-motion";
import type { ConfidenceLevel } from "@/lib/types";
import { ShieldCheck, ShieldQuestion, Video, BadgeCheck, Crown } from "lucide-react";

const map: Record<ConfidenceLevel, { label: string; icon: typeof ShieldCheck; color: string }> = {
  unverified: { label: "Unverified", icon: ShieldQuestion, color: "text-text-muted bg-white/5 border-white/10" },
  community: { label: "Community", icon: ShieldCheck, color: "text-lavender bg-purple/10 border-purple/30" },
  "video-confirmed": { label: "Video Confirmed", icon: Video, color: "text-electric-blue bg-electric-blue/10 border-electric-blue/30" },
  "independently-verified": { label: "Independently Verified", icon: BadgeCheck, color: "text-success bg-success/10 border-success/30" },
  "officially-confirmed": { label: "Official", icon: Crown, color: "text-neon-pink bg-neon-pink/10 border-neon-pink/30" },
};

export function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  const v = map[level];
  const Icon = v.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${v.color}`}>
      <Icon className="h-3 w-3" />
      {v.label}
    </span>
  );
}

export function WeeklyBadge({ multiplier }: { multiplier: number }) {
  if (multiplier <= 1) return null;
  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="inline-flex items-center gap-1 rounded-full border border-neon-pink/40 bg-neon-pink/10 px-2 py-0.5 text-[11px] font-semibold text-neon-pink"
    >
      {multiplier}x Weekly
    </motion.span>
  );
}

export function SampleDataBadge() {
  return (
    <span className="inline-flex items-center rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-warning">
      Sample Data
    </span>
  );
}
