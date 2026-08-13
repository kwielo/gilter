gilter
======

Gmail filter editor — import, view, edit, and export Gmail filters XML.

## Features

- **Import** filters from Gmail's XML export (file upload, drag-and-drop, or paste)
- **View** all filters with criteria and action badges
- **Edit** filter criteria and actions inline
- **Add / Delete / Duplicate** filters
- **Export** valid Gmail-compatible XML for re-import
- **Persist** filter state in localStorage across sessions

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

```bash
npm test          # run unit tests once
npm run test:watch
```

## How to use

1. Go to Gmail → Settings → Filters and Blocked Addresses → Export
2. Drop the `mailFilters.xml` file into gilter (or paste the XML)
3. Edit your filters
4. Click "Export XML" to download the modified filters
5. Import the file back into Gmail

## Tech stack

- Vanilla JS (ES modules)
- Vite (dev server + build)
- No runtime dependencies

## Build for production

```bash
npm run build
```

Output goes to `dist/`.
