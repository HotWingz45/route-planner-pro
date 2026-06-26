import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Compass,
  Boxes,
  ListChecks,
  ShoppingBag,
  CalendarRange,
  Settings,
  Tag,
  ShieldCheck,
  Sparkles,
  ChevronLeft,
} from "lucide-react";
import { useState } from "react";
import { usePlayerStore } from "@/lib/store";
import { fmtMoney } from "@/lib/format";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/planner", label: "Planner", icon: Compass },
  { to: "/inventory", label: "Inventory", icon: Boxes },
  { to: "/activities", label: "Activities", icon: ListChecks },
  { to: "/purchases", label: "Purchases", icon: ShoppingBag },
  { to: "/weekly", label: "Weekly", icon: CalendarRange },
  { to: "/pricing", label: "Pricing", icon: Tag },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/admin", label: "Admin", icon: ShieldCheck },
] as const;

export function Sidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [collapsed, setCollapsed] = useState(false);
  const balance = usePlayerStore((s) => s.profile.currentBalance);

  return (
    <aside
      className={`relative hidden md:flex shrink-0 flex-col border-r border-border bg-[color:var(--void)]/80 backdrop-blur-xl transition-[width] duration-300 ${collapsed ? "w-[72px]" : "w-[248px]"}`}
    >
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl gradient-primary shadow-[var(--shadow-glow-pink)]">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="font-display text-lg font-bold leading-none">ScorePath</div>
            <div className="text-[10px] uppercase tracking-wider text-text-muted mt-1">Progression Planner</div>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {NAV.map((item) => {
          const active = path === item.to || (item.to !== "/dashboard" && path.startsWith(item.to));
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active ? "text-white" : "text-text-secondary hover:text-white hover:bg-white/5"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-xl gradient-primary opacity-90"
                  transition={{ type: "spring", stiffness: 260, damping: 26 }}
                />
              )}
              <Icon className={`relative z-10 h-4 w-4 shrink-0 ${active ? "text-white" : ""}`} />
              {!collapsed && <span className="relative z-10 truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border space-y-2">
        {!collapsed && (
          <div className="rounded-xl border border-border bg-surface px-3 py-2.5">
            <div className="text-[10px] uppercase tracking-wider text-text-muted">Current Balance</div>
            <div className="font-display text-lg font-bold gradient-text">{fmtMoney(balance)}</div>
          </div>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex w-full items-center justify-center rounded-lg border border-border bg-surface py-1.5 text-xs text-text-muted hover:text-white hover:bg-surface-hover transition"
          aria-label="Toggle sidebar"
        >
          <ChevronLeft className={`h-3.5 w-3.5 transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const items = [
    { to: "/dashboard", label: "Home", icon: LayoutDashboard },
    { to: "/planner", label: "Planner", icon: Compass },
    { to: "/inventory", label: "Inventory", icon: Boxes },
    { to: "/weekly", label: "Weekly", icon: CalendarRange },
    { to: "/settings", label: "Profile", icon: Settings },
  ] as const;
  return (
    <>
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b border-border bg-[color:var(--void)]/85 px-4 py-3 backdrop-blur-xl">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg gradient-primary">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-display text-base font-bold">ScorePath</span>
        </Link>
      </header>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-[color:var(--void)]/95 backdrop-blur-xl">
        <div className="grid grid-cols-5">
          {items.map((it) => {
            const active = path === it.to || (it.to !== "/dashboard" && path.startsWith(it.to));
            const Icon = it.icon;
            return (
              <Link
                key={it.to}
                to={it.to}
                className={`flex flex-col items-center gap-1 py-2.5 text-[10px] ${active ? "text-neon-pink" : "text-text-muted"}`}
              >
                <Icon className="h-5 w-5" />
                {it.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
