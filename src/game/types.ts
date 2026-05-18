export type Tier = "leve" | "+18";
export type Category =
  | "truth_general"
  | "most_likely"
  | "mimica"
  | "fogo_no_parquinho";

export type BaseItem = { id: string; tier: Tier; category: Category };
export type TruthItem = BaseItem & {
  category: "truth_general" | "most_likely";
  text: string;
};
export type MimicaItem = BaseItem & { category: "mimica"; text: string };
export type FogoItem = BaseItem & {
  category: "fogo_no_parquinho";
  base: string;
  complementos: [string, string, string];
};
export type Item = TruthItem | MimicaItem | FogoItem;

export type Player = { id: string; name: string; truthLives: number };
export type TierMode = "leve" | "both";

export type DrawnItem =
  | { kind: "truth"; item: TruthItem }
  | { kind: "mimica"; item: MimicaItem }
  | { kind: "fogo"; item: FogoItem };