import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PlayerProfile, SavedPlan, InventoryItem } from "./types";
import { DEFAULT_PROFILE, MOCK_SAVED_PLANS } from "./mock-data";

interface State {
  profile: PlayerProfile;
  plans: SavedPlan[];
  customInventory: InventoryItem[];
  setProfile: (p: Partial<PlayerProfile>) => void;
  toggleOwned: (id: string) => void;
  toggleFavorite: (id: string) => void;
  addCustomItem: (item: InventoryItem) => void;
  removeCustomItem: (id: string) => void;
  savePlan: (plan: SavedPlan) => void;
  deletePlan: (id: string) => void;
  markPlanComplete: (id: string) => void;
  reset: () => void;
}

export const usePlayerStore = create<State>()(
  persist(
    (set) => ({
      profile: DEFAULT_PROFILE,
      plans: MOCK_SAVED_PLANS,
      customInventory: [],
      setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
      toggleOwned: (id) =>
        set((s) => {
          const owned = s.profile.inventory.ownedItemIds.includes(id);
          return {
            profile: {
              ...s.profile,
              inventory: {
                ...s.profile.inventory,
                ownedItemIds: owned
                  ? s.profile.inventory.ownedItemIds.filter((x) => x !== id)
                  : [...s.profile.inventory.ownedItemIds, id],
              },
            },
          };
        }),
      toggleFavorite: (id) =>
        set((s) => {
          const fav = s.profile.inventory.favoriteItemIds.includes(id);
          return {
            profile: {
              ...s.profile,
              inventory: {
                ...s.profile.inventory,
                favoriteItemIds: fav
                  ? s.profile.inventory.favoriteItemIds.filter((x) => x !== id)
                  : [...s.profile.inventory.favoriteItemIds, id],
              },
            },
          };
        }),
      addCustomItem: (item) =>
        set((s) => ({
          customInventory: [...s.customInventory, item],
          profile: {
            ...s.profile,
            inventory: {
              ...s.profile.inventory,
              ownedItemIds: [...s.profile.inventory.ownedItemIds, item.id],
            },
          },
        })),
      removeCustomItem: (id) =>
        set((s) => ({
          customInventory: s.customInventory.filter((c) => c.id !== id),
          profile: {
            ...s.profile,
            inventory: {
              ...s.profile.inventory,
              ownedItemIds: s.profile.inventory.ownedItemIds.filter((x) => x !== id),
            },
          },
        })),
      savePlan: (plan) => set((s) => ({ plans: [plan, ...s.plans] })),
      deletePlan: (id) => set((s) => ({ plans: s.plans.filter((p) => p.id !== id) })),
      markPlanComplete: (id) =>
        set((s) => ({
          plans: s.plans.map((p) => (p.id === id ? { ...p, completed: true } : p)),
        })),
      reset: () => set({ profile: DEFAULT_PROFILE, plans: MOCK_SAVED_PLANS, customInventory: [] }),
    }),
    { name: "scorepath-store" },
  ),
);
