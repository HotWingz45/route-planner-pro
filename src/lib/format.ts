export const fmtMoney = (n: number): string => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
};

export const fmtFull = (n: number): string => `$${Math.round(n).toLocaleString()}`;

export const fmtTime = (mins: number): string => {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
};

export const fmtDate = (iso: string): string =>
  new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });

export const fmtRelative = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const day = 86400000;
  if (diff < 0) {
    const d = Math.ceil(-diff / day);
    return `in ${d}d`;
  }
  const d = Math.floor(diff / day);
  if (d === 0) return "today";
  if (d === 1) return "yesterday";
  return `${d}d ago`;
};
