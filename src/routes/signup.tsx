import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AuthShell, Field } from "./login";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign up — ScorePath" }] }),
  component: Signup,
});

function Signup() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [name, setName] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Account created");
    nav({ to: "/onboarding" });
  };
  return (
    <AuthShell title="Create your account" subtitle="Build personalized routes in under a minute.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Display name">
          <input value={name} onChange={(e) => setName(e.target.value)} required className="auth-input" placeholder="NeonRider" />
        </Field>
        <Field label="Email">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="auth-input" placeholder="you@scorepath.gg" />
        </Field>
        <Field label="Password">
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} required minLength={8} className="auth-input" placeholder="At least 8 characters" />
        </Field>
        <button className="w-full rounded-xl gradient-primary px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-glow-pink)] transition active:scale-[0.98]">
          Continue
        </button>
        <div className="text-center text-xs text-text-muted">
          Already have an account?{" "}
          <Link to="/login" className="text-neon-pink hover:underline">Log in</Link>
        </div>
      </form>
    </AuthShell>
  );
}
