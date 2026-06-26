import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { fmtMoney, fmtFull } from "@/lib/format";

interface Props {
  value: number;
  duration?: number;
  format?: "money" | "full" | "number" | "pct";
  className?: string;
}

export function AnimatedNumber({ value, duration = 800, format = "money", className }: Props) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      prev.current = value;
      return;
    }
    const from = prev.current;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (value - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else prev.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, reduced]);

  const text =
    format === "money"
      ? fmtMoney(display)
      : format === "full"
        ? fmtFull(display)
        : format === "pct"
          ? `${Math.round(display * 100)}%`
          : Math.round(display).toLocaleString();

  return (
    <motion.span className={className} aria-live="polite">
      {text}
    </motion.span>
  );
}
