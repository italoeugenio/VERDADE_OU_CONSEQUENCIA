import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useGame, MAX_TRUTH_LIVES } from "@/game/store";

export const Route = createFileRoute("/play")({
  head: () => ({
    meta: [
      { title: "Partida — Verdade ou Consequência Neon" },
      { name: "description", content: "Em partida — escolha verdade ou consequência." },
    ],
  }),
  component: Play,
});

function Play() {
  const navigate = useNavigate();
  const players = useGame((s) => s.players);
  const turnIdx = useGame((s) => s.turnIdx);
  const current = useGame((s) => s.current);
  const drawTruth = useGame((s) => s.drawTruth);
  const drawConsequence = useGame((s) => s.drawConsequence);
  const completeConsequence = useGame((s) => s.completeConsequence);
  const nextTurn = useGame((s) => s.nextTurn);
  const resetGame = useGame((s) => s.resetGame);

  useEffect(() => {
    if (players.length < 2) navigate({ to: "/" });
  }, [players.length, navigate]);

  const player = players[turnIdx];
  if (!player) return null;

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]">
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            resetGame();
            navigate({ to: "/" });
          }}
          className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← Sair
        </button>
        <span className="text-xs text-muted-foreground">
          Rodada de {player.name}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.section
          key={player.id + "-header"}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mt-6 text-center"
        >
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Vez de
          </p>
          <h1 className="mt-1 font-display text-4xl neon-text-magenta">
            {player.name}
          </h1>
          <Lives count={player.truthLives} />
        </motion.section>
      </AnimatePresence>

      <div className="mt-8 flex-1">
        <AnimatePresence mode="wait">
          {!current ? (
            <Choice
              key="choice"
              onTruth={drawTruth}
              onConsequence={drawConsequence}
              canTruth={player.truthLives > 0}
            />
          ) : (
            <QuestionCard
              key="card"
              onNextTurn={nextTurn}
              onCompleteConsequence={completeConsequence}
            />
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

function Lives({ count }: { count: number }) {
  return (
    <div className="mt-3 flex items-center justify-center gap-2">
      {Array.from({ length: MAX_TRUTH_LIVES }).map((_, i) => {
        const on = i < count;
        return (
          <span
            key={i}
            className={`text-xl transition ${on ? "neon-text-cyan" : "opacity-25"}`}
            aria-label={on ? "vida disponível" : "vida usada"}
          >
            ♥
          </span>
        );
      })}
      <span className="ml-2 text-[10px] uppercase tracking-widest text-muted-foreground">
        verdades
      </span>
    </div>
  );
}

function Choice({
  onTruth,
  onConsequence,
  canTruth,
}: {
  onTruth: () => void;
  onConsequence: () => void;
  canTruth: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex flex-col gap-4"
    >
      <button
        onClick={onTruth}
        disabled={!canTruth}
        className="rounded-2xl bg-card/40 py-10 font-display text-3xl uppercase tracking-widest neon-text-cyan neon-border-cyan transition active:scale-[0.98] disabled:opacity-30"
      >
        Verdade
      </button>
      {!canTruth && (
        <p className="-mt-2 text-center text-xs text-muted-foreground">
          Sem vidas — cumpra uma consequência primeiro
        </p>
      )}
      <button
        onClick={onConsequence}
        className="rounded-2xl bg-card/40 py-10 font-display text-3xl uppercase tracking-widest neon-text-magenta neon-border-magenta transition active:scale-[0.98]"
      >
        Consequência
      </button>
    </motion.div>
  );
}

function QuestionCard({
  onNextTurn,
  onCompleteConsequence,
}: {
  onNextTurn: () => void;
  onCompleteConsequence: () => void;
}) {
  const current = useGame((s) => s.current);
  const [chosenComplement, setChosenComplement] = useState<number | null>(null);

  // pick 3 complementos shown — already the trio in the data
  const complementos = useMemo(() => {
    if (current?.kind === "fogo") return current.item.complementos;
    return null;
  }, [current]);

  if (!current) return null;

  const isTruth = current.kind === "truth";
  const accent = isTruth ? "cyan" : "magenta";
  const accentText = isTruth ? "neon-text-cyan" : "neon-text-magenta";
  const accentBorder = isTruth ? "neon-border-cyan" : "neon-border-magenta";

  const subtitle =
    current.kind === "truth"
      ? current.item.category === "most_likely"
        ? "Quem é mais provável"
        : "Verdade"
      : current.kind === "mimica"
        ? "Mímica"
        : "Fogo no parquinho";

  const body =
    current.kind === "fogo" ? current.item.base : (current.item as any).text;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className={`flex h-full flex-col rounded-3xl bg-card/60 p-6 ${accentBorder}`}
    >
      <p className={`font-display text-xs uppercase tracking-[0.3em] ${accentText}`}>
        {subtitle}
      </p>
      <p className="mt-4 text-2xl leading-snug">{body}</p>

      {current.kind === "truth" && current.item.category === "most_likely" && (
        <p className="mt-3 text-xs text-muted-foreground">
          Votem na roda quem se encaixa melhor.
        </p>
      )}

      {complementos && (
        <div className="mt-6">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Escolha um complemento
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {complementos.map((c, i) => (
              <button
                key={i}
                onClick={() => setChosenComplement(i)}
                className={`rounded-xl px-4 py-3 text-left text-sm transition ${
                  chosenComplement === i
                    ? "neon-border-magenta bg-secondary/15"
                    : "border border-border bg-card/40"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-auto pt-8">
        {current.kind === "truth" ? (
          <button
            onClick={onNextTurn}
            className={`w-full rounded-2xl bg-card/60 py-4 font-display text-base uppercase tracking-widest ${accentText} ${accentBorder} active:scale-[0.98]`}
          >
            Próximo jogador
          </button>
        ) : (
          <button
            onClick={onCompleteConsequence}
            disabled={current.kind === "fogo" && chosenComplement === null}
            className={`w-full rounded-2xl bg-card/60 py-4 font-display text-base uppercase tracking-widest ${accentText} ${accentBorder} active:scale-[0.98] disabled:opacity-40`}
          >
            Cumpri — próximo
          </button>
        )}
      </div>
    </motion.div>
  );
}
