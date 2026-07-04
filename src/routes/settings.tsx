import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app-shell";
import { usePlayerStore } from "@/lib/store";
import { signOut, useUser } from "@/lib/auth";
import type { PlayStyle, RiskLevel, SessionLength } from "@/lib/types";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — ScorePath" }] }),
  component: Settings,
});

function Settings() {
  const profile = usePlayerStore((s) => s.profile);
  const setProfile = usePlayerStore((s) => s.setProfile);
  const reset = usePlayerStore((s) => s.reset);
  const nav = useNavigate();
  const user = useUser();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out");
      nav({ to: "/login" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign out failed");
    }
  };

  const [currency, setCurrency] = useState("USD ($)");
  const [notifications, setNotifications] = useState(true);
  const [spoilers, setSpoilers] = useState(false);
  const [privateProfile, setPrivateProfile] = useState(false);

  return (
    <AppShell>
      <PageHeader title="Settings" subtitle="Manage your profile, preferences, and subscription." />
      <div className="px-6 grid gap-4 lg:grid-cols-2 pb-10">
        <Section title="Profile">
          <Field label="Display name">
            <input
              defaultValue="Operator"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-neon-pink"
            />
          </Field>
          <Field label="Play style">
            <div className="grid grid-cols-4 gap-1.5">
              {(["solo", "small-crew", "large-crew", "mixed"] as PlayStyle[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setProfile({ playStyle: v })}
                  className={`rounded-lg px-2 py-2 text-xs font-semibold capitalize transition ${profile.playStyle === v ? "gradient-primary text-white" : "border border-border bg-background hover:bg-surface-hover"}`}
                >
                  {v.replace("-", " ")}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Default session duration">
            <div className="grid grid-cols-5 gap-1.5">
              {([30, 60, 90, 120, 180] as SessionLength[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setProfile({ sessionLength: v })}
                  className={`rounded-lg px-2 py-2 text-xs font-semibold transition ${profile.sessionLength === v ? "gradient-primary text-white" : "border border-border bg-background hover:bg-surface-hover"}`}
                >
                  {v}m
                </button>
              ))}
            </div>
          </Field>
          <Field label="Preferred risk">
            <div className="grid grid-cols-3 gap-1.5">
              {(["low", "medium", "high"] as RiskLevel[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setProfile({ preferredRisk: v })}
                  className={`rounded-lg px-2 py-2 text-xs font-semibold capitalize transition ${profile.preferredRisk === v ? "gradient-primary text-white" : "border border-border bg-background hover:bg-surface-hover"}`}
                >
                  {v}
                </button>
              ))}
            </div>
          </Field>
        </Section>

        <Section title="Preferences">
          <Field label="Currency display">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
            >
              {["USD ($)", "EUR (€)", "GBP (£)"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Toggle
            label="Notification preferences"
            checked={notifications}
            onChange={setNotifications}
          />
          <Toggle label="Hide spoiler content" checked={spoilers} onChange={setSpoilers} />
          <Toggle
            label="Keep profile private"
            checked={privateProfile}
            onChange={setPrivateProfile}
          />
        </Section>

        <Section title="Subscription">
          <div className="rounded-xl border border-border bg-background p-4 text-sm flex items-center justify-between">
            <div>
              <div className="font-semibold">Free tier</div>
              <div className="text-xs text-text-muted">3 saved plans, basic database</div>
            </div>
            <button
              onClick={() => nav({ to: "/pricing" })}
              className="rounded-lg gradient-primary px-3 py-1.5 text-xs font-semibold text-white"
            >
              Upgrade
            </button>
          </div>
        </Section>

        {user && (
          <Section title="Account">
            <div className="rounded-xl border border-border bg-background p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">{user.email}</div>
                <div className="text-xs text-text-muted">Signed in</div>
              </div>
              <button
                onClick={handleSignOut}
                className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold hover:bg-surface-hover"
              >
                Sign out
              </button>
            </div>
          </Section>
        )}

        <Section title="Danger zone">
          <div className="rounded-xl border border-error/30 bg-error/5 p-4 space-y-3">
            <div className="text-sm">Reset all local data, profile, and saved plans.</div>
            <button
              onClick={() => {
                reset();
                toast.success("Local data reset");
              }}
              className="rounded-lg border border-error/40 bg-error/10 px-3 py-1.5 text-xs font-semibold text-error hover:bg-error/20"
            >
              Reset account
            </button>
          </div>
          <button
            onClick={() => toast.success("Account deletion requested (demo)")}
            className="rounded-lg border border-error/40 bg-error/10 px-3 py-2 text-xs font-semibold text-error hover:bg-error/20 w-full mt-3"
          >
            Delete account
          </button>
        </Section>
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
      <h3 className="font-display text-base font-bold">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-text-secondary mb-1.5">{label}</div>
      {children}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm text-text-secondary">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 rounded-full transition ${checked ? "gradient-primary" : "bg-white/10"}`}
        aria-pressed={checked}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${checked ? "translate-x-[18px]" : "translate-x-[2px]"}`}
        />
      </button>
    </label>
  );
}
