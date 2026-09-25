# Potato Cannon Web UI

React-based web interface for the Potato Cannon ticket management system.

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 19 with React Compiler |
| Build | Vite 6 |
| Styling | Tailwind CSS 4 |
| Routing | TanStack Router |
| State (server) | TanStack Query |
| State (client) | Zustand |
| UI Components | Radix UI primitives |
| Icons | Lucide React |
| Drag & Drop | dnd-kit |
| Desktop | Electron (optional) |

## Project Structure

```
src/
├── api/          # API client functions
├── components/
│   ├── ui/       # Base UI components (shadcn-style)
│   ├── layout/   # App layout (sidebar, tabs)
│   ├── board/    # Kanban board components
│   ├── brainstorm/
│   ├── configure/ # Configuration UI components
│   ├── ticket-detail/
│   ├── sessions/
│   ├── logs/
│   └── templates/
├── hooks/        # Custom React hooks
├── lib/          # Utilities (cn, etc.)
├── routes/       # TanStack Router file-based routes
└── stores/       # Zustand stores
```

## Development

```bash
npm run dev        # Start dev server (proxies to daemon on :3131)
npm run build      # Type-check and build for production
npm run typecheck  # TypeScript check only
npm run lint       # ESLint
```

## Conventions

### Responsive Design

**Use container queries instead of media queries for responsive components.**

```css
/* PREFERRED - Container queries */
.component {
  container-type: inline-size;
}

@container (max-width: 640px) {
  .component__child {
    /* mobile styles */
  }
}

/* AVOID - Media queries for component-level responsiveness */
@media (max-width: 640px) {
  .component__child {
    /* don't do this */
  }
}
```

Container queries allow components to respond to their container's size rather than the viewport, making them more reusable and predictable in different layout contexts.

### Styling

- Use Tailwind CSS utility classes as the primary styling approach
- Custom CSS goes in `src/index.css` using CSS variables defined in `@theme`
- Use BEM-style naming for custom CSS classes (e.g., `.brand-logo__title`)
- Theme colors are defined as CSS variables: `--color-bg-primary`, `--color-text-primary`, `--color-accent`, etc.

### Components

- UI primitives in `components/ui/` follow shadcn/ui patterns
- Use Radix UI for accessible, unstyled primitives
- Compose complex components from smaller UI primitives
- Use `cn()` utility from `@/lib/utils` for conditional class merging

### State Management

- **Server state**: TanStack Query for API data fetching and caching
- **Client state**: Zustand for UI state (current project, modals, etc.)
- Hooks in `src/hooks/queries.ts` wrap TanStack Query for API calls

### Routing

- File-based routing with TanStack Router
- Routes defined in `src/routes/`
- Use `Link` component from `@tanstack/react-router` for navigation

### Path Aliases

Use `@/` alias for imports from `src/`:

```typescript
import { Button } from '@/components/ui/button'
import { useProjects } from '@/hooks/queries'
```

## API Integration

The dev server proxies `/api/*` and `/events/*` to the Potato Cannon daemon running on `localhost:3131`.

- REST API: `/api/*`
- Server-Sent Events: `/events/*`

## Known test failures

None, as of 2026-09-20. `pnpm -r test` is green: 604 daemon tests, 154 frontend
tests and 3 skipped.

**Run it on Node 22.** `engines` and `.nvmrc` both say so, and `vitest.setup.ts`
refuses the run with the reason on anything else. On Node 23 and later `localStorage`
is undefined without `--localstorage-file`, and vitest keeps that empty one over
jsdom's working one, so every persisted store throws from inside zustand and the
suite looks broken when it is not. That is still None; it is a fact about the runner,
not a failure, which is why it is a sentence here and not a list.

The note that stood here listed 32 frontend failures from 2026-08-04, across
`BrainstormCard.test.tsx`, `usePendingQuestions.test.ts`, `appStore.test.ts` and
`ActivityTab.test.tsx`. Thirty of them were fixed in the work that followed and
the note was never updated, so it went on telling every newcomer to expect a red
suite. The last two were in `ActivityTab.test.tsx`: they asserted that the box
was disabled and said "No agent is running for this phase" when no phase agent
was running, which the ticket-wide Q&A feature had already replaced. They were
not flaky and they were not someone else's problem; they described a component
that no longer existed, and they are now rewritten to assert what it does.

A red line in a suite that everyone has agreed to ignore stops being a signal,
which is the whole reason a suite exists. If this section grows a list again, the
list is the bug.
