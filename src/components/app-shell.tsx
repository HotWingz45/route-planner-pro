import type { ReactNode } from "react";
import { Sidebar, MobileNav } from "./sidebar";
import { ChatBar } from "./chat-bar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex w-full">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileNav />
        <main className="flex-1 min-w-0 pb-20 md:pb-0">{children}</main>
        <Footer />
      </div>
      <ChatBar />
    </div>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border px-6 py-6 text-center text-[11px] text-text-muted">
      ScorePath is an independent, unofficial companion platform and is not affiliated with or
      endorsed by Rockstar Games or Take-Two Interactive.
    </footer>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 px-6 pt-8 pb-6 sm:flex sm:flex-wrap sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-text-secondary max-w-2xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
