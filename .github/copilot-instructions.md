# Copilot Instructions for raid-illustrator

## Project Overview

- This is a Next.js-based frontend for visualizing raid mechanics, with a focus on FFXIV encounters.
- It is inspired by professional animation tools such as Adobe After Effects.

## Key Architectural Patterns

- **Component Structure:**
    - The UI is organized under `src/app/`, with reusable components in `src/components/` and domain models in `src/models/`.
    - Single-use components live in `_components` directories such as `src/app/raid/_components/`.
- **State Management:**
    - Centralized state is managed in `src/store.ts` and accessed primarily via hooks.
- **Raids:**
    - A "raid" is the top-level structure, containing multiple scenes, steps, and entities.
- **Scenes:**
    - A "scene" represents an independent visualization within a raid, containing steps and entities.
- **Steps:**
    - A "step" is a discrete moment in a scene, defining the state of entities at that time.
    - A scene can have multiple steps, which are somewhat analogous to frames in a video.
- **Entities:**
    - "Entities" represent objects within a scene, and can be shapes, groups of entities, or other future types.
    - Many properties of entities can be "keyed" to change over steps (e.g., position, rotation).
    - Entities can have visual effects applied to them, which are defined in subdirectories of `src/visual-effects/` and registered in `src/visual-effects/index.ts`.
- **Domain Models:**
    - Domain models are defined in `src/models/`.
    - There are currently two top level models: `raids` and `workspaces`.
    - The `raids` model contains the contents of a raid, including scenes, steps, and entities.
    - The `workspaces` model contains user-specific data such as preferences and UI state.
    - These models contain types, utils, and selectors in files such as `src/models/raids/types.ts`, `src/models/raids/utils.ts`, and `src/models/raids/selectors.ts`.

## Developer Workflows

- **Development:**
    - Start the dev server with `npm run dev` (see README.md).
- **Build/Test:**
    - No explicit test/build scripts found; use standard Next.js commands (`npm run build`, `npm run start`).
- **Debugging:**
    - Use browser devtools; inspect state via React DevTools.

## Project-Specific Conventions

- **File Naming:**
    - Underscore prefix (`_components/`) for internal-only modules.
- **TypeScript:**
    - All logic and components are written in TypeScript.
- **CSS:**
    - Global styles in `src/app/globals.css`; component styles are inline or imported.
- **Assets:**
    - Assets (images, icons) are under `public/images/`. FFXIV-specific assets are in `public/images/ffxiv/`.

## Integration Points

- **No backend integration** is present in this repo; all logic is client-side.
- **Visual effect modules** are extensible—add new effects in `src/visual-effects/ffxiv/` and register them in `src/visual-effects/index.ts`.

---

For questions about conventions or architecture, see the README or review the structure in `src/app/raid/` and `src/models/`.
