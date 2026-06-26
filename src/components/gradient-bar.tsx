import { motion } from "framer-motion";

export function GradientBar({ value, className }: { value: number; className?: string }) {
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-white/5 ${className ?? ""}`}>
      <motion.div
        className="h-full rounded-full gradient-primary"
        initial={{ width: 0 }}
        animate={{ width: `${v * 100}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
  );
}
