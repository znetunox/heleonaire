# Heleonaire — Plano de Implementação: Base Jogável Completa

Transformar o protótipo atual (quadrado se movendo) numa experiência jogável completa com as mecânicas da base do rAthena e sprites autorais.

> [!IMPORTANT]
> Este é um plano de **múltiplas semanas** de desenvolvimento. A execução será feita em etapas confirmadas. Cada bloco pode ser aprovado e implementado individualmente.

---

## Bloco 1 — Telas de Fluxo (Login, Char Selection, Loading)

### Client (`@heleonaire/client`)

#### [NEW] `src/screens/LoginScreen.tsx`
- Formulário de login (username + password)
- Botão de registro
- Efeito visual dark medieval (background animado, partículas, gradiente)
- Chamada REST para `POST /api/auth/login`

#### [NEW] `src/screens/RegisterScreen.tsx`
- Formulário de registro (username, email, password)
- Chamada REST para `POST /api/auth/register`

#### [NEW] `src/screens/CharacterSelectScreen.tsx`
- Lista de personagens da conta (até 3 slots)
- Preview 2D do personagem selecionado
- Botão de criar novo personagem / deletar
- Chamada REST para `GET /api/characters`

#### [NEW] `src/screens/CharacterCreateScreen.tsx`
- Seleção de classe (Cavaleiro, Assassino, Arqueiro, Mago, Clérigo) com preview
- Seleção de facção (Ordem dos Heleonaire / Pacto Sombrio)
- Input de nome do personagem
- Chamada REST para `POST /api/characters`

#### [NEW] `src/screens/LoadingScreen.tsx`
- Barra de progresso animada
- Fundo temático dark medieval
- Citações de lore do mundo Aethermor

#### [MODIFY] `src/App.tsx`
- Gerenciador de fluxo de telas (Router): `login → char_select → loading → game`
- Estado global de sessão (JWT token + personagem ativo)

### Server (`@heleonaire/server`)

#### [NEW] `src/api/authRouter.ts`
- `POST /api/auth/login` → gera JWT
- `POST /api/auth/register` → cria conta no PostgreSQL

#### [NEW] `src/api/characterRouter.ts`
- `GET /api/characters` → lista personagens da conta
- `POST /api/characters` → cria personagem
- `DELETE /api/characters/:id` → deleta personagem

#### [NEW] `prisma/schema.prisma`
- Model `Account` (username, email, password hash, created_at)
- Model `Character` (name, class, faction, level, stats, position, accountId)
- Model `Inventory` (characterId, itemId, quantity, slot)

---

## Bloco 2 — Mapa do Mundo (Planícies de Ash)

### Client (`@heleonaire/client`)

#### [NEW] `src/game/scenes/WorldScene.ts`
- Carrega tilemap gerado em Tiled (JSON) — zona "Planícies de Ash" (Nível 1-15)
- Camadas: Chão, Decorações, Paredes (colisões), Topo
- Câmera que segue o personagem
- Limites do mapa (bounds)

#### [NEW] `public/assets/maps/plains_of_ash.json`
- Tilemap inicial com zona de tutorial
- Paredes, grama, ruínas, caminhos

#### [NEW] `public/assets/tilesets/world_tiles.png`
- Tileset dark medieval (gerado com pixel art)

### Server (`@heleonaire/server`)

#### [NEW] `src/systems/mapSystem.ts`
- Dados de colisão do mapa (grid de bloqueio)
- Validação server-side de movimento (cheater prevention)
- Zonas de spawn de monstros

---

## Bloco 3 — Personagem Animado

### Client

#### [NEW] `public/assets/sprites/knight.png` (e demais classes)
- Spritesheet 32x64 com animações: Idle, Walk (4 direções), Attack, Hurt, Die
- Gerado com pixel art (sem assets do RO)

#### [MODIFY] `src/game/scenes/WorldScene.ts`
- Substituir retângulo por sprite animado
- Física de colisão com o tilemap
- Sistema de câmera seguindo o personagem

---

## Bloco 4 — Monstros com AI (base rAthena)

### Server

#### [NEW] `src/systems/mobSystem.ts`
- Spawn de monstros usando dados do `rathenaDb` (mob_db.yml)
- AI states: Idle → Patrol → Aggro → Attack → Return
- Hitpoints, Attack, Defense vindos do rAthena
- Drop de itens ao morrer (rollDrop das fórmulas)
- Respawn após cooldown

#### [MODIFY] `src/rooms/schema/WorldState.ts`
- Adicionar `MapSchema<MobInstance>` ao WorldState
- Sincronizar posição e HP dos mobs para o cliente

### Client

#### [NEW] `src/game/entities/MobEntity.ts`
- Renderiza monstro com sprite (skeleton, etc.)
- Barra de HP acima do mob
- Nome do mob (do rAthena)

---

## Bloco 5 — Combate

### Shared

#### [MODIFY] `src/formulas.ts`
- Adicionar `calcHitChance(attacker, defender)` — determina se hit acerta
- Adicionar `calcMeleeDamage(attacker, weapon, defender)` — dano final

### Server

#### [NEW] `src/systems/combatSystem.ts`
- `attackMob(player, mobId)` — Player ataca mob
- Verificação de alcance (AttackRange do rAthena)
- Cálculo de dano com fórmulas do `@heleonaire/shared`
- Aplicar dano, registrar damage done, verificar morte
- Drop de itens, conceder XP, level up

#### [MODIFY] `src/rooms/WorldRoom.ts`
- Novo handler de mensagem `attack` (target: mobId)

### Client

#### [NEW] `src/game/systems/CombatUI.ts`
- Números de dano flutuantes
- Efeito de hit (flash vermelho no mob)
- Target lock (clicar em mob para selecionar)

---

## Bloco 6 — HUD / Interface

### Client

#### [NEW] `src/ui/HUD.tsx`
- **Barra de HP** (verde → vermelho conforme perde vida)
- **Barra de MP** (azul)
- **Barra de XP** (progresso de nível)
- **Level e nome do personagem**
- **Skill bar** (8 slots + 2 de poção)
- **Minimap** (top-right, mostra posição no mapa)
- **Chat** (bottom-left, canais: local, global)
- **Target frame** (quando selecionar mob/player: mostra HP do alvo)

---

## Bloco 7 — Itens e Inventário

### Server

#### [NEW] `src/systems/inventorySystem.ts`
- `pickupItem(character, itemDrop)` — adiciona item ao inventário
- `equipItem(character, itemId)` — equipa item, recalcula stats
- `dropItem(character, itemId)` — larga item no chão

### Client

#### [NEW] `src/ui/Inventory.tsx`
- Grid de inventário (4x8 slots)
- Tooltip de item ao hover (nome, stats, tipo, nível)
- Arrasta e solta para equipar / usar

---

## Ordem de Execução (Priorizada)

| # | Bloco | Estimativa |
|---|-------|-----------|
| 1 | Prisma DB + Auth API (Login/Register) | 1-2 dias |
| 2 | Telas de Login + Char Selection (UI) | 1-2 dias |
| 3 | Tilemap + Mapa Planícies de Ash | 1-2 dias |
| 4 | Personagem animado com sprite | 1 dia |
| 5 | Monstros com AI (rAthena mob_db) | 2-3 dias |
| 6 | Combate (attack + damage + drop) | 1-2 dias |
| 7 | HUD completo | 1-2 dias |
| 8 | Inventário | 1-2 dias |

**Total estimado: 10-17 dias de desenvolvimento**

---

## Verificação

### Testes Manuais
- Fazer login → selecionar personagem → entrar no jogo
- Andar pelo mapa com colisão funcionando
- Matar um skeleton, receber XP e loot
- Equipe um item, ver stats mudarem no HUD

> [!NOTE]
> Começamos pelo **Bloco 1** (DB + Auth + Telas de fluxo) e avançamos em sequência. Confirme para iniciar.
