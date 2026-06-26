import { motion } from "framer-motion";

interface Props {
  value: number; // 0..1
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
}

export function GoalRing({ value, size = 160, stroke = 12, label, sublabel }: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="goal-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8B3DFF" />
            <stop offset="50%" stopColor="#E936FF" />
            <stop offset="100%" stopColor="#FF2DAA" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#goal-grad)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - clamped) }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="font-display text-3xl font-bold">{Math.round(clamped * 100)}%</div>
        {label && <div className="text-xs text-text-muted mt-0.5">{label}</div>}
        {sublabel && <div className="text-[11px] text-text-muted">{sublabel}</div>}
      </div>
    </div>
  );
}
