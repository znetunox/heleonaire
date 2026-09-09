# HELEONAIRE — AI DEVELOPMENT INSTRUCTIONS

## 1. PROJECT OVERVIEW

Heleonaire is an MMORPG currently under active development.

The project is NOT a greenfield project.

The project is inspired by Ragnarok Online and rAthena, but it is
a custom implementation and must not be assumed to have the same
architecture or implementation as the original rAthena project.

The game is designed for the web/browser and uses WebGL/browser
technologies.

The project may contain:

- Client
- Server
- Shared code
- REST API
- WebSocket networking
- PostgreSQL
- Prisma
- TypeScript
- JavaScript
- WebGL rendering
- Tiled maps
- Ragnarok/rAthena-inspired data
- Characters
- Classes
- Skills
- Combat
- Monsters
- Items
- Inventory
- NPCs
- Maps
- Player movement
- Authentication
- UI

The exact implementation must always be determined from the
current repository.

DO NOT assume that a technology, system, file or architecture
exists just because it is mentioned in this document.

The repository is the source of truth.

---

# 2. EXISTING PROJECT — CRITICAL RULE

IMPORTANT:

This project is ALREADY BEING DEVELOPED.

There are existing systems, partial implementations,
experimental implementations and potentially unfinished features.

The development roadmap does NOT represent the current state
of the repository.

The roadmap represents the intended final direction.

Before implementing anything:

1. Inspect the existing implementation.
2. Determine what already exists.
3. Determine what is complete.
4. Determine what is partially implemented.
5. Determine what is broken.
6. Determine what is missing.
7. Determine what can be reused.
8. Determine what must actually be changed.

NEVER recreate an existing system simply because the roadmap
marks it as [NEW].

NEVER assume an existing implementation is missing.

NEVER replace working code unnecessarily.

---

# 3. SOURCE OF TRUTH

Use the following priority when determining project state:

1. Current source code
2. Current database/schema/migrations
3. Current configuration
4. Current tests
5. Current assets/data
6. PROJECT_STATE.md, if present
7. ROADMAP.md
8. Previous conversation/context

The actual repository has priority over documentation.

If documentation conflicts with the current implementation,
inspect the code and report the discrepancy.

Do not blindly force the code to match the roadmap.

---

# 4. PROJECT ROADMAP

The development roadmap is stored in:

ROADMAP.md

ROADMAP.md describes intended functionality and development order.

It does NOT guarantee that a feature is currently missing.

Before implementing a roadmap item, compare the roadmap with
the current repository.

Classify the current state as:

- COMPLETE
- PARTIAL
- MISSING
- BROKEN
- UNKNOWN

Only implement what is actually necessary.

---

# 5. PROJECT STATE

If PROJECT_STATE.md exists, use it as a quick reference.

However, PROJECT_STATE.md is not authoritative.

If it appears outdated:

1. Inspect the actual code.
2. Determine the current state.
3. Update PROJECT_STATE.md when appropriate.

Do not assume that a previous agent session completed a task
just because PROJECT_STATE.md says so.

Verify important work in the repository.

---

# 6. CONTEXT MANAGEMENT — CRITICAL

The model has a limited context window.

Optimize context usage aggressively.

The goal is NOT to maximize the amount of code read.

The goal is to read the smallest amount of code necessary to
correctly solve the current task.

DO NOT:

- read the entire repository without a specific reason;
- repeatedly read the same files;
- dump complete files into responses;
- copy large source files into the conversation;
- analyze unrelated systems;
- inspect every package when only one is relevant;
- repeat previously established information;
- generate unnecessarily long explanations;
- implement multiple unrelated features in one request.

DO:

- search for relevant files first;
- identify entry points;
- inspect dependencies only when necessary;
- read relevant sections;
- edit files directly;
- verify changes;
- summarize briefly;
- stop when the current block is complete.

---

# 6.1 — NO UNSOLICITED PROJECT AUDITS

NEVER perform a broad project audit when the user has not
requested one.

If the user starts a session without specifying a development
task, do NOT:

- scan the entire repository;
- inspect every package;
- analyze all systems;
- generate a project-wide summary;
- enumerate all files;
- speculate about future work;
- continue exploring after finding enough information.

Instead:

1. Read only CLAUDE.md and relevant state documentation.
2. Check whether the user provided a specific task.
3. If no task was provided, respond with a SHORT message asking
   what the user wants to implement, fix or analyze.
4. STOP.

Example:

"The project is ready. What should we work on?"

Do not perform additional repository exploration until the user
provides a concrete task.

---

# 6.2 — OUTPUT LIMIT

Responses must be proportional to the requested task.

NEVER generate a large response merely because there is more
repository information available.

For implementation tasks:

- Prefer concise summaries.
- Do not dump source files.
- Do not enumerate unrelated files.
- Do not describe every discovered system.
- Do not provide speculative analysis.
- Stop after completing the requested block.

If the task cannot reasonably fit into one implementation block,
divide it into blocks and execute only the first block.

NEVER continue generating output simply because the context
contains additional information.

---

# 7. NEVER TRY TO SOLVE THE ENTIRE PROJECT AT ONCE

Never attempt to analyze, modify and test the entire MMORPG
in a single request.

Large features must be divided into smaller implementation blocks.

Example:

FEATURE
↓
Architecture analysis
↓
Data/model
↓
Server
↓
Shared
↓
Client
↓
Integration
↓
Testing

Each stage should be independently verified.

---

# 8. BLOCK-BASED DEVELOPMENT

Every significant task must be divided into blocks.

A block should have:

- one clear objective;
- limited scope;
- limited files;
- a clear verification step.

Preferred implementation scope:

1–5 files per sub-block.

This is a guideline, not an absolute restriction.

If a tightly coupled change requires more files,
explain why they are required.

Do not modify unrelated files simply to keep a feature
"consistent".

---

# AGENT EXPLORATION LIMIT — CRITICAL

The repository is large and the model has limited context.

For every investigation task:

1. Do NOT enter broad exploration mode.
2. Do NOT recursively follow references.
3. Do NOT attempt to fully understand the entire subsystem.
4. Search for the specific entry point first.
5. Read only the minimum files required.
6. Maximum target: 5 relevant files per investigation step.
7. Maximum: 15 tool/search/read operations per task.
8. After enough evidence is found, STOP investigating.
9. Do NOT create a plan unless explicitly requested.
10. Do NOT enter plan mode during an audit.
11. Do NOT continue investigating after identifying the likely root cause.
12. Do NOT provide a "complete understanding" of the project.

If the required information cannot be determined within the limit,
STOP and report what is known and what file should be inspected next.

Never compensate for uncertainty by reading more and more files.

# 9. TASK EXECUTION PROCESS

For every implementation task:

## STEP 1 — UNDERSTAND

Identify:

- requested feature;
- affected package;
- affected system;
- existing implementation;
- dependencies.

## STEP 2 — INSPECT

Search the repository.

Read only the relevant files.

Do not modify anything yet if the architecture is unclear.

## STEP 3 — PLAN

Determine:

- what already works;
- what is missing;
- what needs modification;
- what files are affected;
- how the change interacts with existing systems.

## STEP 4 — IMPLEMENT

Make the smallest coherent change.

Reuse existing systems whenever possible.

## STEP 5 — VERIFY

Run appropriate checks/tests/builds.

Look for:

- compilation errors;
- type errors;
- broken imports;
- broken references;
- runtime issues;
- protocol inconsistencies;
- regressions.

## STEP 6 — REPORT

Summarize:

- what changed;
- files changed;
- verification performed;
- remaining issues.

## STEP 7 — STOP

Do not automatically continue into the next block.

---

# 10. EXPLORATION MODE

When the user asks for analysis only:

DO NOT modify files.

Perform only investigation.

Report:

1. Current implementation.
2. Relevant files.
3. Dependencies.
4. Problems.
5. Missing functionality.
6. Recommended next block.

Then STOP.

---

# 11. IMPLEMENTATION MODE

When the user explicitly asks for implementation:

Implement only the requested block.

Do not automatically implement future roadmap items.

Do not expand scope without permission.

If another system must be changed to complete the requested
block, determine whether the dependency is:

- required;
- optional;
- unrelated.

Only modify required dependencies.

---

# 12. STOP CONDITIONS

STOP and ask before continuing if:

- requirements are ambiguous;
- a major architectural decision is required;
- an existing system must be substantially rewritten;
- destructive changes appear necessary;
- database data could be lost;
- protocol compatibility could break;
- unrelated systems become involved;
- the requested change conflicts with existing architecture;
- the implementation would require a large uncontrolled refactor.

Do not guess when the consequences are significant.

---

# 13. EXISTING WORK — DO NOT DESTROY

The repository may contain:

- uncommitted changes;
- experimental code;
- partially implemented features;
- temporary implementations;
- unfinished systems.

These changes may be intentional.

Do not assume they are obsolete.

Do not delete, revert or rewrite them without understanding
their purpose.

Preserve existing functionality whenever possible.

---

# 14. NO UNSOLICITED REFACTORING

Do not refactor unrelated code.

Do not rename files, classes, functions or variables merely
because you prefer a different naming convention.

Do not reorganize folders without a concrete reason.

Do not replace a working architecture with another architecture
because it appears cleaner.

If refactoring is required for the current task:

1. Explain why.
2. Keep the refactor as small as possible.
3. Avoid mixing unrelated cleanup into the same change.

---

# 15. SERVER AUTHORITATIVE ARCHITECTURE

The server is authoritative.

The client must not be trusted for authoritative game state.

The server must validate important gameplay operations.

This includes, when applicable:

- player position;
- movement;
- HP;
- SP/MP;
- damage;
- experience;
- level;
- inventory;
- item quantity;
- equipment;
- skills;
- cooldowns;
- rewards;
- drops;
- combat results;
- character state.

The client may send intentions/actions.

The server validates those actions and determines the result.

Never move authoritative gameplay logic to the client merely
because it is easier to implement.

---

# 16. CLIENT

The client is primarily responsible for:

- rendering;
- UI;
- input;
- visual effects;
- animations;
- audio;
- presenting server state;
- sending player intentions/actions.

Client-side prediction or interpolation may be used when
appropriate, but must not bypass server authority.

---

# 17. SERVER

The server is responsible for authoritative gameplay state.

When modifying server systems, consider:

- validation;
- concurrency;
- race conditions;
- persistence;
- synchronization;
- network reliability;
- cheating;
- malformed client messages;
- state consistency.

Never assume that client input is valid.

---

# 18. WEBSOCKET

Before modifying WebSocket communication, inspect:

- message definitions;
- packet/message types;
- serialization;
- deserialization;
- server handlers;
- client listeners;
- synchronization;
- error handling;
- reconnection behavior.

If changing a message structure:

Search for all producers and consumers.

Do not change a protocol message in isolation.

Maintain client/server compatibility.

---

# 19. REST API

Before modifying REST APIs, inspect:

- routers;
- middleware;
- authentication;
- validation;
- controllers/handlers;
- database access;
- error handling;
- client API calls.

Reuse existing API infrastructure.

Do not create duplicate authentication,
validation or database layers.

---

# 20. AUTHENTICATION

Authentication must be handled securely.

Never store plaintext passwords.

Never expose password hashes to the client.

Never trust account/character IDs supplied by the client
without authorization checks.

Authentication tokens must be validated server-side.

---

# 21. DATABASE / PRISMA

Before changing Prisma:

Inspect:

- current schema;
- migrations;
- models;
- database access;
- seed scripts;
- existing relationships.

Prefer additive changes.

Do not destroy existing data.

Do not reset the database unless explicitly authorized.

Do not delete migrations.

Do not modify production-sensitive database behavior
without explicit confirmation.

---

# 22. RATHENA / RAGNAROK DATA

rAthena/Ragnarok is a reference for game mechanics and data.

The project is NOT a direct copy of rAthena.

Before using rAthena concepts:

1. Search the existing implementation.
2. Determine how the project represents the data.
3. Adapt the concept to the existing architecture.

Do not blindly copy rAthena implementation patterns.

Do not assume that every rAthena system is required.

Do not duplicate data structures that already exist.

---

# 23. GAME FORMULAS

When implementing Ragnarok-inspired formulas:

First locate:

- existing formula implementations;
- shared calculations;
- stat definitions;
- level calculations;
- damage systems;
- hit/flee systems;
- attack speed;
- defense;
- elemental systems.

Reuse existing formula infrastructure.

Do not create duplicate formulas.

If the project intentionally differs from rAthena,
preserve the project's current design unless the user
explicitly requests compatibility with rAthena.

---

# 24. WEBGL / BROWSER PERFORMANCE

This is a browser MMORPG.

Always consider:

- JavaScript execution;
- memory usage;
- garbage collection;
- asset size;
- texture memory;
- draw calls;
- batching;
- network bandwidth;
- serialization cost;
- loading time;
- browser compatibility;
- bundle size;
- caching.

Avoid solutions that are unnecessarily expensive for WebGL.

Prefer incremental loading for large assets when appropriate.

Do not load the entire game world if only a small region is required.

---

# 25. RENDERING

Before modifying rendering:

Determine the current rendering technology.

Inspect:

- renderer;
- scene/world architecture;
- asset loading;
- sprite/model rendering;
- camera;
- culling;
- batching;
- shaders;
- texture handling.

Do not introduce a new rendering engine or major rendering
library without explicit approval.

Reuse the current renderer whenever possible.

---

# 26. MAP SYSTEM

Before modifying maps, inspect the actual implementation.

Determine:

- map format;
- tile format;
- layers;
- collision;
- walkability;
- height/elevation;
- objects;
- NPCs;
- mobs;
- map loading;
- map streaming.

The roadmap may mention Tiled, but do not assume that
Tiled is currently implemented.

Verify the repository first.

---

# 27. MOVEMENT

Movement must remain compatible with server authority.

When modifying movement, consider:

- client input;
- server validation;
- collision;
- walkability;
- speed;
- acceleration;
- interpolation;
- prediction;
- reconciliation;
- anti-cheat;
- network latency.

Do not introduce client-authoritative movement.

---

# 28. COMBAT

Combat results must be determined by the server.

The server should validate, where applicable:

- attacker;
- target;
- distance;
- line of sight;
- attack range;
- attack speed;
- cooldown;
- resource cost;
- hit chance;
- damage;
- status effects;
- death;
- experience;
- drops.

Client-side combat effects are presentation.

---

# 29. MONSTERS

Before implementing monster AI:

Inspect:

- current mob model;
- mob database;
- spawn system;
- movement;
- target selection;
- combat;
- drops;
- persistence;
- synchronization.

Do not assume the rAthena mob database can be used directly.

Adapt it to the existing data structures.

---

# 30. INVENTORY

Before modifying inventory:

Inspect:

- item model;
- inventory model;
- database;
- equip system;
- item usage;
- item stacking;
- item quantity;
- packets;
- synchronization;
- UI.

Inventory ownership and quantity must be authoritative
on the server.

Never trust client-provided item quantities.

---

# 31. SKILLS

Before implementing a skill:

1. Find similar existing skills.
2. Inspect the skill system.
3. Inspect shared definitions.
4. Inspect server execution.
5. Inspect client synchronization.
6. Reuse existing infrastructure.

Do not create a separate skill framework for individual skills.

---

# 32. UI

When modifying UI:

Inspect existing:

- components;
- styling;
- routing;
- state management;
- API hooks;
- reusable controls.

Reuse existing components.

Do not introduce a second UI architecture unnecessarily.

---

# 33. ASSETS

Respect the project's current asset pipeline.

Before adding assets:

Check:

- format;
- dimensions;
- compression;
- loading method;
- naming convention;
- directory structure.

For WebGL, avoid unnecessarily large assets.

---

# 34. GIT SAFETY

Before significant modifications:

Run:

git status

Treat existing modifications as intentional user work.

NEVER use destructive commands without explicit authorization.

Do not use:

git reset --hard
git clean
git checkout -- .
git restore .
force push

unless explicitly authorized.

Do not overwrite unrelated user changes.

---

# 35. TESTING

Every implementation block must be verified.

Use the project's available checks, such as:

- TypeScript compilation;
- lint;
- unit tests;
- integration tests;
- client build;
- server build;
- server startup;
- API tests;
- WebSocket tests.

If a test cannot be executed:

State that clearly.

Never claim that something works without verification.

---

# 36. ERROR HANDLING

When encountering an error:

Do not immediately rewrite the affected system.

First determine:

1. Root cause.
2. Affected component.
3. Whether the problem existed before the current change.
4. Whether the current change caused it.
5. Smallest safe fix.

Fix the root cause when possible.

Do not hide errors merely to make the build pass.

---

# 37. DEPENDENCY MANAGEMENT

Before adding a package:

Check whether an existing dependency already provides
the required functionality.

Avoid adding dependencies for small problems.

Consider:

- bundle size;
- browser compatibility;
- maintenance;
- security;
- license;
- performance.

Do not install packages without a clear reason.

---

# 38. RESPONSE SIZE

Keep responses concise.

The model should spend tokens on implementation and reasoning,
not unnecessary prose.

After completing a block, report:

## COMPLETED

What changed.

## FILES

Files modified/created.

## VERIFICATION

Tests/checks performed.

## ISSUES

Remaining problems or limitations.

## NEXT

Recommended next block.

Do not paste complete files unless explicitly requested.

Do not repeat large code sections.

---

# 39. LARGE TASKS

If the user asks for a large task such as:

"Implement the entire combat system."

Do NOT implement everything immediately.

First divide it.

Example:

1. Analyze existing combat architecture.
2. Analyze formulas.
3. Implement hit chance.
4. Implement damage.
5. Implement server attack.
6. Implement validation.
7. Implement death/XP/drop.
8. Implement client feedback.
9. Integration testing.

Execute one block at a time.

---

# 40. ROADMAP EXECUTION

The roadmap is executed sequentially unless the user explicitly
requests a different order.

However, before starting any roadmap block:

Perform a state check.

Example:

ROADMAP:

[NEW] authRouter.ts

Actual repository:

authRouter.ts already exists.

Result:

Do NOT create authRouter.ts.

Inspect the existing implementation and determine
what remains incomplete.

---

# 41. CURRENT ROADMAP

The current roadmap is stored in:

ROADMAP.md

The roadmap currently targets:

BLOCK 1 — Authentication and screen flow

BLOCK 2 — World map

BLOCK 3 — Character

BLOCK 4 — Monsters and AI

BLOCK 5 — Combat

BLOCK 6 — HUD

BLOCK 7 — Items and inventory

The detailed roadmap must be read from ROADMAP.md.

Do not duplicate the entire roadmap here.

---

# 42. SESSION RECOVERY

A new agent session may not have the previous conversation context.

When starting a new session:

1. Read CLAUDE.md.
2. Read ROADMAP.md when relevant.
3. Check git status.
4. Read PROJECT_STATE.md if it exists.
5. Inspect the actual implementation.
6. Determine what has already been completed.

Never assume previous conversational context exists.

Never redo work merely because the previous conversation
is no longer available.

Verify the repository first.

---

# 43. PROJECT STATE UPDATES

When a meaningful roadmap item is completed, update
PROJECT_STATE.md if that file exists.

Keep PROJECT_STATE.md concise.

Record:

- completed systems;
- partially completed systems;
- known problems;
- current development block.

Do not store huge code dumps or detailed implementation
documentation in PROJECT_STATE.md.

---

# 44. AGENT BEHAVIOR

The agent should behave as a senior software engineer
working on an existing production-oriented game project.

Priorities:

1. Correctness
2. Existing architecture
3. Security
4. Stability
5. Performance
6. Maintainability
7. Minimal changes
8. Development speed

Do not prioritize speed over correctness.

---

# 45. CONTEXT SAFETY — MANDATORY

For investigation tasks, NEVER recursively explore the repository.

Follow this rule:

REQUEST
↓
Identify relevant subsystem
↓
Find entry point
↓
Read directly related files
↓
Trace only required dependencies
↓
Determine root cause/state
↓
STOP

Maximum investigation scope:
- one subsystem per request;
- preferably 3–8 relevant files;
- do not follow unrelated references;
- do not perform project-wide discovery.

If more files are required, stop and explain which dependency
requires further inspection instead of continuing indefinitely.

Never continue repository exploration merely because more files
are available.

Never produce a project-wide summary unless explicitly requested.

---

# 46. FINAL PRINCIPLE

THINK BEFORE EDITING.

SEARCH BEFORE CREATING.

INSPECT BEFORE REWRITING.

READ ONLY WHAT IS NECESSARY.

MODIFY ONLY WHAT IS NECESSARY.

TEST AFTER MODIFYING.

PRESERVE EXISTING WORK.

WORK IN SMALL BLOCKS.

KEEP CONTEXT UNDER CONTROL.

THE REPOSITORY IS THE SOURCE OF TRUTH.

DO NOT TRY TO BUILD THE ENTIRE MMORPG IN ONE REQUEST.

