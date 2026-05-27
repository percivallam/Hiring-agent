# hireagent prototype spec

## tokens

- typography: `Inter` for ui, `JetBrains Mono` for commands, ids, scores, metrics, and structured fields.
- density: base text `13px`, line-height `1.5`, compact controls, no viewport-scaled type.
- dark theme default: `#0A0A0A`, `#111111`, `#1A1A1A`, text `#EDEDED`, `#A1A1A1`, `#6B6B6B`, border `#262626`.
- light theme: `#FFFFFF`, `#FAFAFA`, `#F0F0F0`, text `#0A0A0A`, `#525252`, `#A3A3A3`, border `#E5E5E5`.
- accent: only `#00D9A3`. it is used for command focus, scores, active state, and chart emphasis.
- radius: `4px`, `5px`, `6px`. no large friendly cards.
- borders: one-pixel hairlines. shadows only on drawers and overlays.

## shortcuts

- `cmd+k`: open global command launcher.
- `cmd+\`: toggle right drawer between `closed` and `peek`.
- `cmd+,`: open settings overlay.
- `cmd+b`: collapse or expand the left rail.
- `up/down`: browse command history in the cli input.
- `esc`: close command launcher, settings overlay, or drawer.

## drawer state machine

```text
closed -> peek: inline card click, slash command, query drawer param, cmd+\
peek -> pinned: pin button
pinned -> peek: unpin button
peek -> popout: pop out button
pinned -> popout: pop out button
popout -> peek: pop out button again
any -> closed: esc, close button, cmd+\
```

- `closed`: no right drawer is rendered. this is the default on `/` and `/c/[sessionId]`.
- `peek`: drawer slides in at `480-720px`, resizable.
- `pinned`: same surface, marked as persistent while the user keeps working.
- `popout`: detached drawer panel with the same content and controls.

motion uses `200ms cubic-bezier(0.2, 0, 0, 1)` for drawer and overlay transitions.

## routes

- `/`: empty cli-first workspace with seeded sessions and no drawer.
- `/c/[sessionId]`: active conversation, streamed agent output, thinking trace, handoff markers, inline candidate cards.
- `/c/[sessionId]?drawer=pipeline`: opens pipeline kanban drawer.
- `/c/[sessionId]?drawer=jd`: opens jd editor with chunk-level accept and reject controls.
- `/c/[sessionId]?drawer=diagnosis`: opens diagnosis charts.
- `/settings`: renders settings as a full-screen overlay over the current session.

## persistence

- existing `hireagent-*` localStorage key formats are preserved.
- initialization never overwrites existing `hireagent-msgs-*` values.
- current session is stored in `hireagent-current-session`.
- disk sync is intentionally not implemented in this backendless prototype, but the storage contract remains compatible.

## anti-patterns

1. forbidden: left-side multi-level tree navigation.
2. forbidden: business-blue palettes or secondary accent colors.
3. forbidden: gradient backgrounds, glassmorphism, decorative blobs, or large decorative shadows.
4. forbidden: form-first flows for primary tasks like finding candidates.
5. forbidden: opening the right drawer by default.
6. forbidden: hiding ids, scores, metrics, or fields in proportional fonts.
7. forbidden: rounded 12px-plus friendly enterprise cards.
8. forbidden: emoji as functional icons.
9. forbidden: settings as a primary navigation destination above the fold.
10. forbidden: agent failures that render empty states or raw technical errors without next action.
