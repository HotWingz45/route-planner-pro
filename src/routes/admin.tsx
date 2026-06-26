import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import { Check, X, Plus, FileText, History, Database, ShieldCheck, ListChecks } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { ConfidenceBadge, SampleDataBadge } from "@/components/badges";
import { MOCK_ACTIVITIES, MOCK_INVENTORY, MOCK_SUBMISSIONS, MOCK_CHANGES, MOCK_WEEKLY } from "@/lib/mock-data";
import { fmtDate } from "@/lib/format";
import type { CommunitySubmission, ConfidenceLevel } from "@/lib/types";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — ScorePath" }] }),
  component: Admin,
});

type Tab = "activities" | "inventory" | "weekly" | "submissions" | "history";

function Admin() {
  const [tab, setTab] = useState<Tab>("activities");
  const [subs, setSubs] = useState<CommunitySubmission[]>(MOCK_SUBMISSIONS);

  const decide = (id: string, status: "approved" | "rejected") => {
    setSubs((s) => s.map((x) => x.id === id ? { ...x, status } : x));
    toast.success(`Submission ${status}`);
  };

  const tabs: { key: Tab; label: string; icon: typeof Database }[] = [
    { key: "activities", label: "Activities", icon: ListChecks },
    { key: "inventory", label: "Inventory", icon: Database },
    { key: "weekly", label: "Weekly modifiers", icon: ShieldCheck },
    { key: "submissions", label: "Submissions", icon: FileText },
    { key: "history", label: "Change history", icon: History },
  ];

  return (
    <AppShell>
      <PageHeader title="Admin Console" subtitle="Manage structured game data with sourcing, confidence levels, and audit history." actions={<SampleDataBadge />} />

      <div className="px-6 pb-10">
        <div className="flex flex-wrap gap-1.5 mb-4">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${tab === t.key ? "gradient-primary text-white" : "border border-border bg-surface text-text-secondary hover:bg-surface-hover"}`}>
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          ))}
        </div>

        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-surface p-5 overflow-x-auto">
          {tab === "activities" && (
            <Table headers={["Name", "Category", "Payout", "Confidence", "Verified", ""]}>
              {MOCK_ACTIVITIES.map((a) => (
                <tr key={a.id} className="border-t border-border">
                  <td className="px-3 py-2 font-semibold">{a.name}</td>
                  <td className="px-3 py-2 text-text-secondary">{a.category}</td>
                  <td className="px-3 py-2 text-text-secondary">${a.minPayout.toLocaleString()}–${a.maxPayout.toLocaleString()}</td>
                  <td className="px-3 py-2"><ConfidenceBadge level={a.confidence} /></td>
                  <td className="px-3 py-2 text-text-muted">{fmtDate(a.lastVerified)}</td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => toast.success("Edit dialog opened")} className="text-xs text-neon-pink hover:underline">Edit</button>
                  </td>
                </tr>
              ))}
            </Table>
          )}

          {tab === "inventory" && (
            <Table headers={["Name", "Category", "Value", "Tags", ""]}>
              {MOCK_INVENTORY.map((i) => (
                <tr key={i.id} className="border-t border-border">
                  <td className="px-3 py-2 font-semibold">{i.name}</td>
                  <td className="px-3 py-2 text-text-secondary capitalize">{i.category}</td>
                  <td className="px-3 py-2 text-text-secondary">${i.estimatedValue.toLocaleString()}</td>
                  <td className="px-3 py-2 text-text-muted text-xs">{i.tags.join(", ")}</td>
                  <td className="px-3 py-2 text-right"><button onClick={() => toast.success("Archived")} className="text-xs text-text-muted hover:text-error">Archive</button></td>
                </tr>
              ))}
            </Table>
          )}

          {tab === "weekly" && (
            <div>
              <div className="flex justify-end mb-3">
                <button onClick={() => toast.success("New modifier draft")} className="inline-flex items-center gap-1.5 rounded-lg gradient-primary px-3 py-1.5 text-xs font-semibold text-white"><Plus className="h-3.5 w-3.5" /> New modifier</button>
              </div>
              <Table headers={["Title", "Type", "Multiplier", "Expires", ""]}>
                {MOCK_WEEKLY.map((w) => (
                  <tr key={w.id} className="border-t border-border">
                    <td className="px-3 py-2 font-semibold">{w.title}</td>
                    <td className="px-3 py-2 text-text-secondary capitalize">{w.type}</td>
                    <td className="px-3 py-2 text-text-secondary">{w.multiplier ? `${w.multiplier}x` : w.discountPct ? `-${w.discountPct}%` : "—"}</td>
                    <td className="px-3 py-2 text-text-muted">{fmtDate(w.expiresAt)}</td>
                    <td className="px-3 py-2 text-right">
                      <button onClick={() => toast.success("Published")} className="text-xs text-success hover:underline">Publish</button>
                    </td>
                  </tr>
                ))}
              </Table>
            </div>
          )}

          {tab === "submissions" && (
            <Table headers={["Submitter", "Type", "Payload", "Status", ""]}>
              {subs.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="px-3 py-2">{s.submittedBy}</td>
                  <td className="px-3 py-2 text-text-secondary capitalize">{s.type}</td>
                  <td className="px-3 py-2 text-text-muted text-xs">{JSON.stringify(s.payload)}</td>
                  <td className="px-3 py-2"><ConfidenceBadge level={statusToConfidence(s.status)} /></td>
                  <td className="px-3 py-2 text-right">
                    {s.status === "pending" ? (
                      <span className="inline-flex gap-1">
                        <button onClick={() => decide(s.id, "approved")} className="rounded-md bg-success/10 border border-success/30 px-2 py-1 text-success text-xs"><Check className="h-3 w-3" /></button>
                        <button onClick={() => decide(s.id, "rejected")} className="rounded-md bg-error/10 border border-error/30 px-2 py-1 text-error text-xs"><X className="h-3 w-3" /></button>
                      </span>
                    ) : <span className="text-xs text-text-muted capitalize">{s.status}</span>}
                  </td>
                </tr>
              ))}
            </Table>
          )}

          {tab === "history" && (
            <Table headers={["When", "By", "Action", "Entity", "Notes"]}>
              {MOCK_CHANGES.map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="px-3 py-2 text-text-muted">{fmtDate(c.at)}</td>
                  <td className="px-3 py-2 text-text-secondary">{c.by}</td>
                  <td className="px-3 py-2 capitalize">{c.action}</td>
                  <td className="px-3 py-2 text-text-secondary">{c.entityType} · {c.entityId}</td>
                  <td className="px-3 py-2 text-text-muted text-xs">{c.notes ?? "—"}</td>
                </tr>
              ))}
            </Table>
          )}
        </motion.div>

        <p className="text-xs text-text-muted mt-4">Records must include a source name and confidence level before publication.</p>
      </div>
    </AppShell>
  );
}

function statusToConfidence(s: CommunitySubmission["status"]): ConfidenceLevel {
  if (s === "approved") return "independently-verified";
  if (s === "rejected") return "unverified";
  return "community";
}

function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <table className="w-full text-sm min-w-[640px]">
      <thead>
        <tr className="text-left text-[10px] uppercase tracking-wider text-text-muted">
          {headers.map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}
