# AGENTS.md

## Project Overview

Gilter is a client-side Gmail filter editor. It imports, views, edits, and exports Gmail filter configurations via XML files, and optionally syncs filters directly with Gmail via the Google Gmail API. There is no backend — all data stays in the browser (localStorage) or goes directly to/from the Google API.

**Live deployment:** https://gilter.kwielogorski.workers.dev/

## Tech Stack

- **Language:** TypeScript 6.0.3 (strict mode, locked version)
- **Bundler:** Vite 6.4.3 (locked version)
- **Runtime:** Browser-only (vanilla TS, no framework)
- **Hosting:** Cloudflare Workers Static Assets (auto-deploys on push to `develop`)
- **Auth:** Google Identity Services (GIS) token model — OAuth 2.0 implicit flow, no backend

## Commands

| Command | Purpose |
|---------|---------|
| `npm run build` | Typecheck (`tsc --noEmit`) + Vite production build |
| `npm run dev` | Vite dev server (default: http://localhost:5173) |
| `npm run dev -- --host 0.0.0.0` | Dev server accessible externally |
| `npm run typecheck` | TypeScript typecheck only |
| `npm run preview` | Preview production build locally |

Always run `npm run build` before committing to verify both typecheck and build pass.

## Architecture

Layered architecture with clear separation of concerns:

```
src/
  domain/       Pure domain logic (no side effects, no DOM)
    types.ts        Filter, FilterCriteria, FilterActions, FeedMeta types
    schema.ts       Field metadata (single source of truth for all fields)
    parser.ts       Gmail XML → domain objects
    serializer.ts   Domain objects → Gmail-compatible XML
    gmail-types.ts  Gmail REST API response types
    api-mapper.ts   Bidirectional mapping: Gmail API model ↔ internal model

  store/        State management (observable store + event bus)
    event-bus.ts     Typed pub/sub event system
    filter-store.ts  Central filter state with CRUD operations
    history.ts       Undo/redo snapshot stack (max 50)
    selection.ts     Bulk selection state
    label-cache.ts   Gmail label name cache for autocomplete

  infra/        Infrastructure adapters
    storage.ts       localStorage persistence with auto-save
    file-io.ts       File upload, drag-drop, paste, download
    google-auth.ts   Google OAuth via GIS (sign-in, sign-out, token mgmt)
    gmail-api.ts     Gmail REST API client (filters + labels CRUD)

  ui/           UI components (vanilla DOM, Component base class)
    component.ts     Base class: element creation, event binding, cleanup
    toolbar.ts       Top bar: add filter, import/export, undo/redo, theme toggle
    import-panel.ts  File upload / drag-drop / paste import area
    gmail-panel.ts   Google sign-in, pull/push filters
    search-bar.ts    Text search + action-type filter dropdown
    filter-list.ts   Renders FilterCard list, bulk ops, drag-reorder
    filter-card.ts   Single filter row: badges, edit/dup/delete controls
    filter-editor.ts Inline form: text fields, checkboxes, select, tag input
    toast.ts         Notification toasts

  app.ts        Boot sequence: auto-save, auth config, restore, mount UI
  style.css     All styles (CSS custom properties for dark/light theming)
```

### Key Patterns

- **Observable store:** `filter-store.ts` emits `FILTERS_CHANGED` events; UI components subscribe and re-render
- **Component base class:** `Component` provides `listen()` (DOM events) and `subscribe()` (event bus) with automatic cleanup on `destroy()`
- **Schema-driven forms:** `schema.ts` defines field metadata; the editor, parser, serializer, and search all derive behavior from it
- **Field types:** `string`, `boolean`, `select` (dropdown), `tags` (chip/tag input for multi-value fields like labels)
- **No framework:** Pure TypeScript + DOM APIs. No React, Vue, Angular, etc.

### Gmail API Integration

- OAuth scopes: `gmail.settings.basic` (filter CRUD) + `gmail.labels` (label names)
- Client ID is baked in at build time via `VITE_GOOGLE_CLIENT_ID` env var (set in `wrangler.jsonc` build command)
- Gmail API has no filter update endpoint — edits require delete + recreate
- `api-mapper.ts` handles the model differences between XML export format and REST API format (e.g., `shouldTrash: true` ↔ `addLabelIds: ["TRASH"]`)
- Label names ↔ label IDs resolved via `users.labels.list`

### Data Model

- `FilterActions.label` is `string[]` (array) — a filter can apply multiple labels
- In Gmail XML, each label is a separate `<apps:property name='label' value='...'/>`
- `smartLabelToApply` uses internal values (`^smartlabel_personal`, `^smartlabel_promo`, etc.) but displays human-readable names (Personal, Promotions, etc.)
- `localStorage` migration: old `label: "string"` format is auto-converted to `label: ["string"]` on load

## Deployment

- **Platform:** Cloudflare Workers (Static Assets mode via `wrangler.jsonc`)
- **Auto-deploy trigger:** Push to `develop` branch
- **Build command (in Cloudflare):** Defined in `wrangler.jsonc` — runs `npm run build` with `VITE_GOOGLE_CLIENT_ID` env var
- **Output directory:** `dist/`
- **Static files:** `public/` directory contents are copied as-is to `dist/` (privacy.html, terms.html, logo files, sample.xml)

## Branching

- `develop` — primary branch, auto-deploys to production
- Feature branches: `devin/<timestamp>-<description>` off `develop`
- PRs target `develop`

## Code Style

- TypeScript strict mode with `noUnusedLocals` and `noUnusedParameters`
- No external UI frameworks or runtime dependencies (zero `dependencies`, only `devDependencies`)
- BEM-style CSS class naming: `block__element--modifier`
- CSS custom properties for theming (dark/light mode via `data-theme` attribute)
- Minimal comments — prefer clear naming over documentation
- Imports at top of file, grouped by layer (domain, store, infra, ui)

## Legal / Compliance

- Privacy policy: `/privacy.html`
- Terms of service: `/terms.html`
- Copyright: wielo.co
- Google API usage adheres to [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy)
- No data is sent to any backend server — all processing is client-side
