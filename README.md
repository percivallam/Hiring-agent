# hireagent

agent-native recruiting operating system prototype. conversation is the primary interface; drawer and settings surfaces appear only when deep review or low-frequency configuration is needed.

## run

```bash
pnpm install
pnpm dev
```

open [http://localhost:3000](http://localhost:3000).

fallback:

```bash
npm install
npm run dev
```

## routes

- `/` — empty cli-first workspace, seeded sessions, drawer closed.
- `/c/agentic-pm-search` — active conversation with streamed agent output and inline candidate cards.
- `/c/agentic-pm-search?drawer=pipeline` — pipeline kanban drawer.
- `/c/agentic-pm-search?drawer=jd` — jd editor with ai diff.
- `/c/agentic-pm-search?drawer=diagnosis` — diagnosis charts.
- `/settings` — full-screen settings overlay over the current session.

## shortcuts

- `cmd+k` — command launcher.
- `cmd+\` — toggle drawer.
- `cmd+,` — settings.
- `cmd+b` — collapse left rail.
- `up/down` — browse cli history.
- `esc` — close overlay, launcher, or drawer.

## structure

- `app/` — next.js app router pages and global tokens.
- `components/app/` — product shell, chat stream, drawer, settings, command input.
- `components/ui/` — shadcn-style primitives.
- `lib/mock/` — candidates, jobs, sessions, diagnosis data.
- `docs/spec.md` — design tokens, shortcuts, drawer state machine, forbidden anti-patterns.

## verify

```bash
pnpm build
```
