# Verdade ou Consequência — Neon Edition

App mobile-first, em memória, com visual neon. Sem backend nesta fase (Lovable Cloud + Google Sheets ficam para a v2).

## Fluxo do jogo

1. **Tela inicial (Setup) — obrigatório cadastrar jogadores**
   - Título neon + subtítulo.
   - **Cadastro de jogadores (obrigatório):** input "Nome do jogador" + botão "Adicionar". Cada nome vira um chip na lista, com botão remover. Mínimo 2 jogadores para liberar "Começar". Enter no input adiciona. Nomes duplicados bloqueados.
   - Seletor de modo de conteúdo: `Leve` ou `Leve + 18` (com aviso "conteúdo adulto, +18").
   - Botão "Começar partida" (desabilitado até ter ≥2 nomes e tier escolhido).

2. **Tela de partida**
   - Header mostra **o nome do jogador da vez** em destaque neon (rotaciona na ordem em que foram cadastrados).
   - Mostra "vidas de verdade" do jogador atual (3 corações neon). Cada Verdade consome 1 vida. Ao cumprir uma Consequência, recupera as 3.
   - Dois botões grandes: **Verdade** e **Consequência**.
     - Se vidas = 0, botão Verdade desabilitado com aviso "cumpra uma consequência primeiro".
   - Ao tocar:
     - **Verdade** → sorteia entre `truth_general` ou `most_likely` (50/50).
     - **Consequência** → sorteia entre `mimica` ou `fogo_no_parquinho`.
   - Card exibe a pergunta/desafio com o nome do jogador no topo. Botão "Próximo jogador" avança o turno.

3. **Subtipos**
   - `truth_general`: pergunta única.
   - `most_likely`: "Quem é mais provável de…" — UI sinaliza que a votação acontece na roda (sem voto in-app).
   - `mimica`: ação para mimicar.
   - `fogo_no_parquinho`: ação base (ex.: "grave um story") + 3 complementos sorteados; o jogador escolhe um (ex.: "dizendo que sente saudade do ex").

## Regras de sorteio

- **Sem repetição com limite** apenas para verdades (`truth_general` e `most_likely`): Set de IDs já usados. Quando atinge ~80% do total ou esgota, reseta.
- Consequências podem repetir livremente.
- Filtro de tier: `leve` sorteia só itens `leve`; `+18` sorteia de `leve` + `+18` juntos.

## Modelo de dados (TypeScript, em memória)

```ts
type Tier = 'leve' | '+18';
type Category = 'truth_general' | 'most_likely' | 'mimica' | 'fogo_no_parquinho';

type BaseItem = { id: string; tier: Tier; category: Category };
type TruthItem  = BaseItem & { category: 'truth_general' | 'most_likely'; text: string };
type MimicaItem = BaseItem & { category: 'mimica'; text: string };
type FogoItem   = BaseItem & { category: 'fogo_no_parquinho'; base: string; complementos: [string,string,string] };
type Item = TruthItem | MimicaItem | FogoItem;

type Player = { id: string; name: string; truthLives: number };
type GameState = {
  players: Player[];        // cadastrados no Setup, define a ordem dos turnos
  turnIdx: number;          // índice do jogador da vez
  tier: 'leve' | 'both';
  usedTruths: Set<string>;
};
```

Bancos em `src/data/items.ts`, ~15–25 itens por categoria para iniciar.

## Arquitetura técnica

- TanStack Start, mobile-first, sem backend.
- Rotas:
  - `src/routes/index.tsx` — Setup (cadastro de jogadores + tier).
  - `src/routes/play.tsx` — Partida. Se acessada sem jogadores no estado, redireciona para `/`.
- Estado global: **Zustand** para players, turnIdx, tier, usedTruths.
- Componentes: `PlayerSetup`, `PlayerList`, `TierToggle`, `TurnHeader`, `LivesIndicator`, `ChoiceButtons`, `QuestionCard`, `FogoComplementos`.
- Tokens neon em `src/styles.css`; animações com Motion.
- Mobile-first: botões 44px+, safe-area-inset, sem hover-only.

## Design (neon)

- Paleta: fundo near-black, acentos magenta + ciano, secundário violeta. Texto branco com leve glow.
- Tipografia: display futurista (Audiowide/Orbitron) em títulos, Inter no corpo.
- Cards com borda gradiente neon e sombra colorida.
- Verdade = ciano, Consequência = magenta.

## Fora do escopo desta v1

- Login / autenticação.
- Persistência (localStorage, Cloud, Google Sheets).
- Edição/adição de perguntas pelo usuário.
- Votação in-app do "quem é mais provável".

## Próximos passos pós-v1

- Lovable Cloud + Google Sheets como banco de perguntas editável.
- localStorage para lembrar últimos nomes e tier.
