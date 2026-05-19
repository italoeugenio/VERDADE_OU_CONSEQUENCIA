export type Tier = "leve" | "+18";
export type Category =
  | "verdade_padrao"
  | "mais_provavel"
  | "mimica"
  | "fogo_no_parquinho";

export type BaseItem = { id: string; tier: Tier; category: Category };
export type TruthItem = BaseItem & {
  category: "verdade_padrao" | "mais_provavel";
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