import { createServerFn } from "@tanstack/react-start";
import type { Item } from "@/game/types";

const SPREADSHEET_ID = "1HWhCAufhKWoGijHYptl4t5xPzgoHEMO8ryxzpvk4puM";
const RANGE = "items!A2:H";
const GATEWAY = "https://connector-gateway.lovable.dev/google_sheets/v4";

function parseRow(row: string[]): Item | null {
  const [id, category, tier, text, base, c1, c2, c3] = row;
  if (!id || !category || !tier) return null;
  if (tier !== "leve" && tier !== "+18") return null;

  if (category === "fogo_no_parquinho") {
    if (!base || !c1 || !c2 || !c3) return null;
    return {
      id,
      category,
      tier,
      base,
      complementos: [c1, c2, c3],
    };
  }
  if (
    category === "truth_general" ||
    category === "most_likely" ||
    category === "mimica"
  ) {
    if (!text) return null;
    return { id, category, tier, text } as Item;
  }
  return null;
}

export const fetchItemsFromSheet = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ items: Item[]; source: "sheet" | "fallback"; error?: string }> => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    const GOOGLE_SHEETS_API_KEY = process.env.GOOGLE_SHEETS_API_KEY;

    if (!LOVABLE_API_KEY || !GOOGLE_SHEETS_API_KEY) {
      return { items: [], source: "fallback", error: "missing credentials" };
    }

    try {
      const url = `${GATEWAY}/spreadsheets/${SPREADSHEET_ID}/values/${RANGE}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": GOOGLE_SHEETS_API_KEY,
        },
      });
      const data = (await res.json()) as { values?: string[][] };
      if (!res.ok) {
        return { items: [], source: "fallback", error: `sheets ${res.status}` };
      }
      const rows = data.values ?? [];
      const items = rows
        .map((r) => parseRow(r))
        .filter((x): x is Item => x !== null);
      return { items, source: "sheet" };
    } catch (e) {
      return {
        items: [],
        source: "fallback",
        error: e instanceof Error ? e.message : "unknown",
      };
    }
  },
);