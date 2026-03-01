# Totem — Project Rules

## Project Overview

This is a game prototype with a codename **Totem**, built with TypeScript. All code must follow strict type checking and validation workflows.

### Libraries

- **TypeScript** — strict-mode language for all source code
- **Vite** — dev server and production bundler
- **Prettier** — code formatter

The project has **no runtime dependencies** — only dev dependencies listed above.

### Game Characteristics

- **Platform**: Web
- **Rendering**: Canvas 2D API — no DOM elements for game rendering

### File Structure

- `src/` — Source code
  - `src/main.ts` — Application entry point
- `index.html` — HTML shell
- Configuration files in project root (`tsconfig.json`, etc.)

## TypeScript Configuration

- Module resolution: `bundler` (Vite-compatible)
- Strict mode is enabled — all strict checks must pass
- No unused locals or parameters allowed
- Environment variables use `import.meta.env` (Vite convention)

## Type Safety

- Use proper TypeScript types for all variables, parameters, and return values
- Prefer optional properties (with `?`) and `undefined` when possible
- Only use `null` when there is no other option, e.g. when interfacing with external APIs that require `null`
- Generic type parameters MUST have descriptive names starting with `T` (e.g., `TData`, `TObject`, `TKey`) — NEVER use single-letter generics like `T`, `K`, `V`

## Code Style

### Formatting

- Run `yarn format` to format code with Prettier before committing
- Follow the Prettier configuration in `.prettierrc`

### Comments

- Only add comments if doing something unconventional or non-obvious
- NEVER comment things that are obvious from the context of variable names or function names
- Code should be self-documenting through clear naming
- Comments should explain "why" not "what" when necessary

### Naming Conventions

- Variable names should match their type name in camelCase (e.g., `const world = createWorld()` where type is `World`)
- Add adjectives when context requires differentiation (e.g., `newWorld`, `initialPlayer`, `updatedPosition`)
- NEVER shorten or abbreviate variable names, even in callbacks
- Always use full, descriptive names even when the meaning could be inferred from context (e.g., use `creatureId` not `id`, `tileCoords` not `coords`)
- The only exception is `i`, `j`, `k` for index variables in loops or array iterators
- Function names MUST start with a verb (e.g., `createPlayer`, `updateScore`, `getTileNeighbours4`, `tickWorld`)
- Boolean properties MUST NOT use `is`/`has` prefix (e.g., `locked`, `completed`). Only boolean-returning functions use prefixes like `is`/`has`.

### Map Keys

- Use `Vector2` for grid coordinates and call `.toString()` on it to produce map keys (e.g., `const gridPosition: Vector2 = [gridX, gridY]; map.get(gridPosition.toString())`). Do not create custom key-building helpers.

### Vectors

- Always use `Vector2` when passing or storing positions, coordinates, 2D points, or sizes — never use separate `x`/`y` or `width`/`height` variables for paired values
- Always use `Vector4` when passing rectangles or regions as `[x, y, width, height]` — never pass origin and size as separate arguments
- Use `position` for pixel positions and `gridPosition` for grid coordinates

### Control Flow

- Don't use early `return` or `continue` unless it significantly reduces indentation depth — for short blocks (a few lines), use normal `if`/`else` or ternary instead

### Whitespace

- Always add empty lines before and after multi-line code blocks (e.g., `if`, `for`, `switch`, multi-line expressions) when they are adjacent to other blocks or statements

## Import and Export Rules

- If a module has several files, put them in a directory with an `index.ts` file
- Use `export * from './filename'` syntax in `index.ts` files to re-export module contents
- Keep `index.ts` files minimal — only re-exports, no logic
- Do NOT automatically add all module files to barrel (`index.ts`) files — only add a re-export when it is actually needed by an external consumer, and remove it when no longer used
- File name should match the "main" export name (e.g., `createPlayer.ts` exports `createPlayer`)
- If a file has many exports of similar importance, use a generic name (e.g., `vector2.ts` for multiple Vector2 operations)

## Validation Workflow

Before considering any task complete:

1. **Write Code** → Make the necessary code changes
2. **Type Check** → Run `yarn typecheck` → Fix any type errors
3. **Format Code** → Run `yarn format` → Ensure consistent formatting

Never skip validation steps. All code must pass type checking and must be properly formatted before work is considered complete.

## Available Scripts

- `yarn dev` — Start development server
- `yarn build` — Build for production (includes type checking)
- `yarn typecheck` — Run TypeScript compiler without emitting files
- `yarn format` — Format code with Prettier

## Commit Guidelines

- Use imperative mood: "Add feature" not "Added feature" or "Adds feature"
- Keep first line under 70 characters
- Start with a type prefix: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`
- All messages should be one-liners, not extended descriptions
- One logical change per commit — separate refactoring from feature changes, don't mix formatting-only changes with functional changes

## Package Management

- NEVER run `yarn add`, `yarn install`, `yarn remove`, or similar package management commands automatically
- If a task requires installing, adding, or removing packages: stop, inform the user, ask them to run the command manually, and wait for confirmation

## Rules Management

- `CLAUDE.md` is the single source of truth for all project rules, AI instructions, and personal preferences
- When asked to add, change, or update any rules or preferences, ALWAYS edit this file — NEVER write to `.claude/`, `AGENTS.md`, memory files, or any other location unless directly instructed
- When asked a "why" question, just answer it — do not assume the user wants to make changes
