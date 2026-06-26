import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Log in — ScorePath" }] }),
  component: Login,
});

function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Welcome back");
    nav({ to: "/dashboard" });
  };
  return (
    <AuthShell title="Welcome back" subtitle="Log in to continue planning your route.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="auth-input" placeholder="you@scorepath.gg" />
        </Field>
        <Field label="Password">
          <input type="password" required value={pw} onChange={(e) => setPw(e.target.value)} className="auth-input" placeholder="••••••••" />
        </Field>
        <button type="submit" className="w-full rounded-xl gradient-primary px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-glow-pink)] hover:opacity-95 transition active:scale-[0.98]">
          Log in
        </button>
        <button type="button" onClick={() => { toast.message("Demo mode active"); nav({ to: "/dashboard" }); }} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold hover:bg-surface-hover transition">
          Continue as demo
        </button>
        <div className="text-center text-xs text-text-muted">
          New here?{" "}
          <Link to="/signup" className="text-neon-pink hover:underline">Create an account</Link>
        </div>
      </form>
    </AuthShell>
  );
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="min-h-screen grid place-items-center px-4 py-12 relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -top-32 -right-32 h-[400px] w-[400px] rounded-full bg-purple/30 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-neon-pink/20 blur-3xl" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md rounded-3xl border border-purple/25 bg-[color:var(--surface)]/90 backdrop-blur-xl p-8 shadow-[var(--shadow-glow-purple)]"
      >
        <Link to="/" className="flex items-center gap-2 mb-6">
          <div className="grid h-8 w-8 place-items-center rounded-lg gradient-primary">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-display text-lg font-bold">ScorePath</span>
        </Link>
        <h1 className="font-display text-2xl font-bold">{title}</h1>
        <p className="mt-1.5 text-sm text-text-secondary">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </motion.div>
      <style>{`.auth-input { width: 100%; border-radius: 0.75rem; border: 1px solid var(--border); background: var(--background); padding: 0.625rem 0.875rem; font-size: 0.875rem; color: var(--foreground); outline: none; transition: border-color .15s, box-shadow .15s; }
.auth-input:focus { border-color: var(--neon-pink); box-shadow: 0 0 0 3px rgba(255,45,170,0.18); }`}</style>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-text-secondary">{label}</span>
      {children}
    </label>
  );
}

export function SubmitArrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {children}
      <ArrowRight className="h-3.5 w-3.5" />
    </span>
  );
}
