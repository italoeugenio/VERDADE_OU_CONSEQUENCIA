import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "motion/react";
import { useGame } from "@/game/store";
import { fetchItemsFromSheet } from "@/lib/items.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Verdade ou Consequência — Neon Edition" },
      {
        name: "description",
        content:
          "Jogo de Verdade ou Consequência com visual neon. Cadastre os jogadores, escolha o modo e comece a partida.",
      },
    ],
  }),
  component: Setup,
});

function Setup() {
  const navigate = useNavigate();
  const players = useGame((s) => s.players);
  const tier = useGame((s) => s.tier);
  const itemsSource = useGame((s) => s.itemsSource);
  const setItems = useGame((s) => s.setItems);
  const addPlayer = useGame((s) => s.addPlayer);
  const removePlayer = useGame((s) => s.removePlayer);
  const setTier = useGame((s) => s.setTier);
  const startGame = useGame((s) => s.startGame);

  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const loadItems = useServerFn(fetchItemsFromSheet);

  useEffect(() => {
    let alive = true;
    loadItems()
      .then((res) => {
        if (!alive) return;
        setItems(res.items, res.source === "sheet" ? "sheet" : "fallback");
      })
      .catch(() => {
        if (!alive) return;
        setItems([], "fallback");
      });
    return () => {
      alive = false;
    };
  }, [loadItems, setItems]);

  const canStart = players.length >= 2;

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const err = addPlayer(name);
    if (err) setError(err);
    else {
      setError(null);
      setName("");
    }
  }

  function begin() {
    if (!canStart) return;
    startGame();
    navigate({ to: "/play" });
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 pb-10 pt-[max(2rem,env(safe-area-inset-top))]">
      <header className="text-center">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-4xl leading-tight neon-text-magenta sm:text-5xl"
        >
          Verdade
          <br />
          <span className="neon-text-cyan">ou</span> Consequência
        </motion.h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Edição neon · prepare a roda
        </p>
        <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
          {itemsSource === "loading" && "carregando perguntas…"}
          {itemsSource === "sheet" && "perguntas ao vivo da planilha"}
          {itemsSource === "fallback" && "perguntas locais (offline)"}
        </p>
      </header>

      <section className="mt-8">
        <h2 className="font-display text-sm uppercase tracking-widest neon-text-cyan">
          Jogadores
        </h2>
        <form onSubmit={submit} className="mt-3 flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do jogador"
            maxLength={24}
            className="flex-1 rounded-lg bg-input/60 px-4 py-3 text-base text-foreground placeholder:text-muted-foreground neon-border-cyan focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground neon-border-cyan active:scale-95"
          >
            Adicionar
          </button>
        </form>
        {error && (
          <p className="mt-2 text-xs text-destructive">{error}</p>
        )}

        <ul className="mt-4 flex flex-wrap gap-2">
          <AnimatePresence>
            {players.map((p) => (
              <motion.li
                key={p.id}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                className="flex items-center gap-2 rounded-full bg-card/70 px-3 py-1.5 text-sm neon-border-magenta"
              >
                <span className="neon-text-magenta font-medium">{p.name}</span>
                <button
                  onClick={() => removePlayer(p.id)}
                  aria-label={`Remover ${p.name}`}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
          {players.length === 0 && (
            <li className="text-xs text-muted-foreground">
              Adicione pelo menos 2 jogadores.
            </li>
          )}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-sm uppercase tracking-widest neon-text-cyan">
          Conteúdo
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <TierButton
            active={tier === "leve"}
            onClick={() => setTier("leve")}
            label="Leve"
            sub="Pra todos"
            color="cyan"
          />
          <TierButton
            active={tier === "both"}
            onClick={() => setTier("both")}
            label="Leve + 18"
            sub="Conteúdo adulto"
            color="magenta"
          />
        </div>
        {tier === "both" && (
          <p className="mt-2 text-xs text-muted-foreground">
            ⚠ Inclui perguntas e desafios +18. Confirme que todos têm 18+.
          </p>
        )}
      </section>

      <div className="mt-auto pt-10">
        <button
          onClick={begin}
          disabled={!canStart}
          className="w-full rounded-2xl bg-secondary px-6 py-5 font-display text-lg uppercase tracking-widest text-secondary-foreground neon-border-magenta transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Começar partida
        </button>
      </div>
    </main>
  );
}

function TierButton({
  active,
  onClick,
  label,
  sub,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  sub: string;
  color: "cyan" | "magenta";
}) {
  const border = color === "cyan" ? "neon-border-cyan" : "neon-border-magenta";
  const text = color === "cyan" ? "neon-text-cyan" : "neon-text-magenta";
  return (
    <button
      onClick={onClick}
      className={`rounded-xl bg-card/60 px-4 py-4 text-left transition ${border} ${
        active ? "opacity-100" : "opacity-60"
      }`}
    >
      <div className={`font-display text-base ${text}`}>{label}</div>
      <div className="text-xs text-muted-foreground">{sub}</div>
    </button>
  );
}
