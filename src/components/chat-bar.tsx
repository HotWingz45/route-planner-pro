import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X, Send, Loader2, Sparkles, Clock, Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { useUser } from "@/lib/auth";
import { sendChatMessage } from "@/lib/actions/chat";
import { fmtMoney, fmtTime } from "@/lib/format";
import { GradientBar } from "./gradient-bar";
import type { Recommendation } from "@/lib/types";
import { Link } from "@tanstack/react-router";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  recommendation?: Recommendation | null;
}

export function ChatBar() {
  const user = useUser();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [limitReached, setLimitReached] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    if (!user) {
      toast.error("Log in to chat with ScorePath AI");
      return;
    }
    setInput("");
    setMessages((m) => [...m, { id: `u-${Date.now()}`, role: "user", content: text }]);
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("No active session");

      const result = await sendChatMessage({
        data: { message: text, conversationId, accessToken },
      });

      setConversationId(result.conversationId ?? undefined);
      setLimitReached(result.limitReached);
      setMessages((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: result.reply,
          recommendation: result.recommendation as Recommendation | null,
        },
      ]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setMessages((m) => [
        ...m,
        {
          id: `a-err-${Date.now()}`,
          role: "assistant",
          content: "I couldn't process that — try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full gradient-primary shadow-[var(--shadow-glow-pink)] active:scale-95 transition"
        aria-label="Open ScorePath AI chat"
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="x"
              initial={{ rotate: -45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 45, opacity: 0 }}
            >
              <X className="h-6 w-6 text-white" />
            </motion.span>
          ) : (
            <motion.span
              key="chat"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
            >
              <MessageCircle className="h-6 w-6 text-white" />
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-5 z-50 w-[min(400px,calc(100vw-2.5rem))] h-[min(560px,calc(100vh-8rem))] rounded-2xl border border-purple/25 bg-[color:var(--surface)]/95 backdrop-blur-xl shadow-[var(--shadow-glow-purple)] flex flex-col overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
              <div className="grid h-8 w-8 place-items-center rounded-lg gradient-primary">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0">
                <div className="font-display text-sm font-bold">ScorePath AI</div>
                <div className="text-[11px] text-text-muted">
                  Tell me your situation, get a route.
                </div>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {!user && (
                <div className="rounded-xl border border-border bg-background p-4 text-center">
                  <Lock className="h-5 w-5 mx-auto text-text-muted" />
                  <p className="mt-2 text-xs text-text-secondary">
                    Log in to chat with ScorePath AI and get a personalized route.
                  </p>
                  <Link
                    to="/login"
                    className="mt-3 inline-block rounded-lg gradient-primary px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Log in
                  </Link>
                </div>
              )}

              {user && messages.length === 0 && (
                <div className="rounded-xl border border-dashed border-border p-4 text-center">
                  <p className="text-xs text-text-secondary">
                    Try:{" "}
                    <span className="text-text-primary">
                      "I've got $900k, 90 minutes, solo, want the nightclub"
                    </span>
                  </p>
                </div>
              )}

              {messages.map((m) => (
                <div
                  key={m.id}
                  className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
                >
                  <div
                    className={
                      m.role === "user"
                        ? "max-w-[85%] rounded-2xl rounded-br-sm gradient-primary px-3.5 py-2 text-sm text-white"
                        : "max-w-[90%] rounded-2xl rounded-bl-sm border border-border bg-background px-3.5 py-2 text-sm"
                    }
                  >
                    <p>{m.content}</p>
                    {m.recommendation && <InlineRouteCard rec={m.recommendation} />}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-sm border border-border bg-background px-3.5 py-2.5 flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-neon-pink" />
                    <span className="text-xs text-text-muted">Calculating…</span>
                  </div>
                </div>
              )}

              {limitReached && (
                <div className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-center">
                  <p className="text-xs text-warning">Weekly free AI limit reached.</p>
                  <Link
                    to="/pricing"
                    className="mt-1.5 inline-block text-xs font-semibold text-neon-pink hover:underline"
                  >
                    Upgrade to Pro for unlimited →
                  </Link>
                </div>
              )}
            </div>

            <div className="border-t border-border p-3 shrink-0">
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder={user ? "Describe your situation…" : "Log in to chat"}
                  disabled={!user || limitReached}
                  rows={1}
                  className="flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-neon-pink disabled:opacity-50"
                />
                <button
                  onClick={send}
                  disabled={!user || loading || !input.trim() || limitReached}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl gradient-primary text-white disabled:opacity-40 active:scale-95 transition"
                  aria-label="Send"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function InlineRouteCard({ rec }: { rec: Recommendation }) {
  return (
    <div className="mt-2.5 rounded-xl border border-neon-pink/25 bg-surface p-3">
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-muted uppercase tracking-wider">Expected payout</span>
        <span className="font-display font-bold gradient-text">{fmtMoney(rec.expectedPayout)}</span>
      </div>
      <div className="mt-1 flex items-center justify-between text-[11px] text-text-muted">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" /> {fmtTime(rec.totalMinutes)}
        </span>
        <span>{rec.steps.length} activities</span>
      </div>
      <div className="mt-2">
        <GradientBar value={rec.goalProgressAfter} />
      </div>
      <ol className="mt-2.5 space-y-1.5">
        {rec.steps.slice(0, 3).map((s, i) => (
          <li key={s.activity.id} className="flex items-center justify-between text-[11px]">
            <span className="truncate">
              {i + 1}. {s.activity.name}
            </span>
            <span className="text-success font-semibold shrink-0 ml-2">
              {fmtMoney(s.estimatedPayoutMin)}–{fmtMoney(s.estimatedPayoutMax)}
            </span>
          </li>
        ))}
        {rec.steps.length > 3 && (
          <li className="text-[11px] text-text-muted">+{rec.steps.length - 3} more steps</li>
        )}
      </ol>
      <Link
        to="/planner"
        className="mt-2 inline-block text-[11px] font-semibold text-neon-pink hover:underline"
      >
        View full route →
      </Link>
    </div>
  );
}
