import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, Plus, Star, Trash2, X, Check } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { SampleDataBadge } from "@/components/badges";
import { usePlayerStore } from "@/lib/store";
import { MOCK_INVENTORY } from "@/lib/mock-data";
import { fmtMoney } from "@/lib/format";
import type { InventoryItem, ItemCategory } from "@/lib/types";

export const Route = createFileRoute("/inventory")({
  head: () => ({ meta: [{ title: "Inventory — ScorePath" }] }),
  component: Inventory,
});

const CATS: (ItemCategory | "all")[] = ["all", "property", "business", "vehicle", "weapon", "equipment"];

function Inventory() {
  const profile = usePlayerStore((s) => s.profile);
  const customInventory = usePlayerStore((s) => s.customInventory);
  const toggleOwned = usePlayerStore((s) => s.toggleOwned);
  const toggleFavorite = usePlayerStore((s) => s.toggleFavorite);
  const addCustomItem = usePlayerStore((s) => s.addCustomItem);
  const removeCustomItem = usePlayerStore((s) => s.removeCustomItem);

  const [q, setQ] = useState("");
  const [cat, setCat] = useState<ItemCategory | "all">("all");
  const [addOpen, setAddOpen] = useState(false);

  const all: InventoryItem[] = [...MOCK_INVENTORY, ...customInventory];
  const filtered = useMemo(() => all.filter(
    (i) => (cat === "all" || i.category === cat) && i.name.toLowerCase().includes(q.toLowerCase()),
  ), [all, cat, q]);
  const owned = filtered.filter((i) => profile.inventory.ownedItemIds.includes(i.id));
  const totalValue = owned.reduce((s, i) => s + i.estimatedValue, 0);

  return (
    <AppShell>
      <PageHeader
        title="Inventory"
        subtitle="Track every property, business, vehicle, weapon, and piece of equipment you own."
        actions={
          <>
            <SampleDataBadge />
            <button onClick={() => setAddOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg gradient-primary px-3.5 py-2 text-sm font-semibold text-white shadow-[var(--shadow-glow-pink)]">
              <Plus className="h-3.5 w-3.5" /> Add custom item
            </button>
          </>
        }
      />

      <div className="px-6 grid gap-4 md:grid-cols-[1fr_auto_auto] items-center mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search inventory…" className="w-full rounded-lg border border-border bg-surface pl-9 pr-3 py-2 text-sm outline-none focus:border-neon-pink" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CATS.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${cat === c ? "gradient-primary text-white" : "border border-border bg-surface text-text-secondary hover:bg-surface-hover"}`}>
              {c}
            </button>
          ))}
        </div>
        <div className="text-right text-xs text-text-muted">
          <div>{owned.length} owned · {filtered.length - owned.length} not owned</div>
          <div className="text-sm font-semibold text-white">Total value {fmtMoney(totalValue)}</div>
        </div>
      </div>

      <div className="px-6 pb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {filtered.map((it) => {
            const isOwned = profile.inventory.ownedItemIds.includes(it.id);
            const isFav = profile.inventory.favoriteItemIds.includes(it.id);
            const isCustom = customInventory.some((c) => c.id === it.id);
            return (
              <motion.div
                key={it.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`rounded-2xl border bg-surface p-4 ${isOwned ? "border-neon-pink/30" : "border-border"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-wider text-text-muted">{it.category}</div>
                    <div className="font-display text-base font-bold truncate">{it.name}</div>
                  </div>
                  <button onClick={() => toggleFavorite(it.id)} aria-label="Favorite" className={isFav ? "text-warning" : "text-text-muted hover:text-warning"}>
                    <Star className="h-4 w-4" fill={isFav ? "currentColor" : "none"} />
                  </button>
                </div>
                <p className="text-xs text-text-secondary mt-2 line-clamp-2">{it.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-sm font-semibold gradient-text">{fmtMoney(it.estimatedValue)}</div>
                  <div className="flex items-center gap-1.5">
                    {isCustom && (
                      <button onClick={() => { removeCustomItem(it.id); toast.success("Removed"); }} className="rounded-lg border border-border bg-background p-1.5 text-text-muted hover:text-error" aria-label="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => { toggleOwned(it.id); toast.success(isOwned ? "Marked unowned" : "Marked owned"); }}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${isOwned ? "gradient-primary text-white" : "border border-border bg-background hover:bg-surface-hover"}`}
                    >
                      {isOwned ? <Check className="h-3.5 w-3.5 inline" /> : "Mark owned"}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-border bg-surface p-12 text-center text-sm text-text-muted">
            No items match your filters.
          </div>
        )}
      </div>

      <AnimatePresence>
        {addOpen && <AddDialog onClose={() => setAddOpen(false)} onAdd={(it) => { addCustomItem(it); toast.success("Custom item added"); setAddOpen(false); }} />}
      </AnimatePresence>
    </AppShell>
  );
}

function AddDialog({ onClose, onAdd }: { onClose: () => void; onAdd: (it: InventoryItem) => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ItemCategory>("vehicle");
  const [value, setValue] = useState(100000);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md rounded-2xl border border-purple/30 bg-surface p-6 shadow-[var(--shadow-glow-purple)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-bold">Add custom item</h3>
          <button onClick={onClose}><X className="h-4 w-4 text-text-muted hover:text-white" /></button>
        </div>
        <div className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Item name" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-neon-pink" />
          <select value={category} onChange={(e) => setCategory(e.target.value as ItemCategory)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-neon-pink">
            {["property", "business", "vehicle", "weapon", "equipment", "upgrade"].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} placeholder="Estimated value" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-neon-pink" />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-border bg-background px-4 py-2 text-sm hover:bg-surface-hover">Cancel</button>
          <button
            disabled={!name}
            onClick={() => onAdd({ id: `custom-${Date.now()}`, name, category, description: "Custom item.", estimatedValue: value, unlocksActivityIds: [], tags: ["custom"] })}
            className="rounded-lg gradient-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
