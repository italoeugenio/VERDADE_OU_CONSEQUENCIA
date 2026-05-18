import { create } from "zustand";
import { ITEMS as FALLBACK_ITEMS } from "./items";
import type {
  Item,
  DrawnItem,
  FogoItem,
  MimicaItem,
  Player,
  TierMode,
  TruthItem,
} from "./types";

const MAX_LIVES = 3;

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

type State = {
  players: Player[];
  turnIdx: number;
  tier: TierMode;
  usedTruths: Set<string>;
  current: DrawnItem | null;
  items: Item[];
  itemsSource: "sheet" | "fallback" | "loading";

  setItems: (items: Item[], source: "sheet" | "fallback") => void;

  addPlayer: (name: string) => string | null;
  removePlayer: (id: string) => void;
  setTier: (t: TierMode) => void;
  startGame: () => void;
  resetGame: () => void;

  drawTruth: () => void;
  drawConsequence: () => void;
  completeConsequence: () => void; // restores lives + advances turn
  nextTurn: () => void;
};

function tierFilter(tier: TierMode) {
  return (it: { tier: "leve" | "+18" }) =>
    tier === "leve" ? it.tier === "leve" : true;
}

export const useGame = create<State>((set, get) => ({
  players: [],
  turnIdx: 0,
  tier: "leve",
  usedTruths: new Set<string>(),
  current: null,
  items: FALLBACK_ITEMS,
  itemsSource: "loading",

  setItems: (items, source) =>
    set({
      items: items.length > 0 ? items : FALLBACK_ITEMS,
      itemsSource: items.length > 0 ? source : "fallback",
    }),

  addPlayer: (rawName) => {
    const name = rawName.trim();
    if (!name) return "Digite um nome";
    const exists = get().players.some(
      (p) => p.name.toLowerCase() === name.toLowerCase(),
    );
    if (exists) return "Esse nome já está na lista";
    set((s) => ({
      players: [...s.players, { id: uid(), name, truthLives: MAX_LIVES }],
    }));
    return null;
  },

  removePlayer: (id) =>
    set((s) => ({ players: s.players.filter((p) => p.id !== id) })),

  setTier: (tier) => set({ tier }),

  startGame: () =>
    set((s) => ({
      turnIdx: 0,
      usedTruths: new Set(),
      current: null,
      players: s.players.map((p) => ({ ...p, truthLives: MAX_LIVES })),
    })),

  resetGame: () =>
    set({
      players: [],
      turnIdx: 0,
      tier: "leve",
      usedTruths: new Set(),
      current: null,
    }),

  drawTruth: () => {
    const { tier, usedTruths, players, turnIdx, items } = get();
    const player = players[turnIdx];
    if (!player || player.truthLives <= 0) return;

    const pool = items.filter(
      (it) =>
        (it.category === "truth_general" || it.category === "most_likely") &&
        tierFilter(tier)(it),
    ) as TruthItem[];

    let used = usedTruths;
    // reset if 80%+ already used or pool exhausted
    const remaining = pool.filter((p) => !used.has(p.id));
    if (remaining.length === 0 || used.size >= Math.floor(pool.length * 0.8)) {
      used = new Set();
    }
    const candidates = pool.filter((p) => !used.has(p.id));
    const item = pickRandom(candidates);
    const newUsed = new Set(used);
    newUsed.add(item.id);

    set({
      current: { kind: "truth", item },
      usedTruths: newUsed,
      players: players.map((p, i) =>
        i === turnIdx ? { ...p, truthLives: p.truthLives - 1 } : p,
      ),
    });
  },

  drawConsequence: () => {
    const { tier, items } = get();
    const mimicas = items.filter(
      (it) => it.category === "mimica" && tierFilter(tier)(it),
    ) as MimicaItem[];
    const fogos = items.filter(
      (it) => it.category === "fogo_no_parquinho" && tierFilter(tier)(it),
    ) as FogoItem[];

    const pickMimica = Math.random() < 0.5;
    if (pickMimica && mimicas.length) {
      set({ current: { kind: "mimica", item: pickRandom(mimicas) } });
    } else if (fogos.length) {
      set({ current: { kind: "fogo", item: pickRandom(fogos) } });
    } else if (mimicas.length) {
      set({ current: { kind: "mimica", item: pickRandom(mimicas) } });
    }
  },

  completeConsequence: () => {
    const { players, turnIdx } = get();
    set({
      players: players.map((p, i) =>
        i === turnIdx ? { ...p, truthLives: MAX_LIVES } : p,
      ),
    });
    get().nextTurn();
  },

  nextTurn: () => {
    const { players, turnIdx } = get();
    if (!players.length) return;
    set({
      turnIdx: (turnIdx + 1) % players.length,
      current: null,
    });
  },
}));

export const MAX_TRUTH_LIVES = MAX_LIVES;