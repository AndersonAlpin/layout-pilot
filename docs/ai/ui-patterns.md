# LayoutPilot UI Patterns

## Product feel

LayoutPilot should feel like a quiet, precise frontend tool.

Visual direction:

- dark, compact, technical, and polished;
- restrained blue/cyan highlights;
- no decorative gradients/orbs;
- no marketing-style layout inside tool surfaces;
- controls should be compact but readable;
- floating UI must not block page interaction more than necessary.

## Core surfaces

### Popup

The popup is the control center.

It should contain:

- product header;
- status;
- activate/deactivate action;
- mode selection;
- shortcuts;
- top-right language picker.

Rules:

- Keep it compact.
- Avoid unnecessary scroll.
- Keep action button spacing stable.
- Prefer custom controls already used in the popup over native controls when visual consistency matters.
- The language picker uses flag assets in `src/assets/flags/`.

### Inspect overlays

Inspect Mode overlays should remain lightweight.

Use:

- cyan/blue highlight for hover/selection;
- readable tooltip;
- distance guides for pinned comparisons;
- details panel for dense information.

Do not let Inspect overlays interfere with Review Mode visuals.

### Review toolbar

The Review toolbar is the main workspace control.

It contains:

- brand/grip area;
- tool group: Visualizar, Elemento, Area, Caneta;
- action group: Copiar imagem, Baixar imagem, Gerar PDF;
- pin/unpin icon button.

Rules:

- Actions live in the toolbar, not in the annotation panel.
- Active tool must be visually clear.
- Toolbar can be dragged when pinned.
- Toolbar can be unpinned and collapse to a small top tab.
- Hover/focus expands the collapsed toolbar.
- Collapsed toolbar should stay small, centered, and visible without fighting the viewport frame.
- Keep toolbar z-index above the Review panel and visual marks.

### Review panel

The Review panel is for structured annotations.

It should show:

- title: Anotacoes / Annotations / Anotaciones;
- annotation count;
- saved annotation cards;
- draft/edit card when needed;
- collapse and clear/close controls.

Rules:

- Do not place image/PDF actions in the panel.
- Do not show selectors, tags, classes, title, URL, viewport, position, or technical metadata by default.
- Closed cards show only number, annotation text/fallback, edit, and remove.
- Draft/edit cards show number or draft state, text area, and relevant actions.
- Empty/technical annotation state can remain internal for future exports.

## Review tools

### Visualizar

Use this label instead of "Mover".

Behavior:

- no element hover;
- no accidental annotation creation;
- used to observe the page and interact with existing Review UI.

### Elemento

Behavior:

- hover highlights page elements;
- click creates a draft annotation;
- `P` creates a draft from the hovered element;
- saved annotations appear in panel and exports.

### Area

Behavior:

- drag draws rectangle live from the initial pointer point;
- release creates a free area mark;
- small rectangles are allowed, except pure click/no drag;
- free area marks do not appear in the panel;
- hover actions: add annotation, remove;
- converting an area mark creates a structured annotation and removes the free mark.

Visual:

- fixed red border for now;
- no permanent fill/background;
- hover action buttons must remain above marks.

### Caneta

Behavior:

- drag draws a freehand stroke;
- no comment flow;
- no panel card;
- hover action: remove stroke;
- strokes are included in image/snapshot/PDF visual output.

Visual:

- fixed red stroke for now;
- no background;
- hover delete action should be near the stroke origin and above marks.

## Annotation visuals

Structured annotations:

- numbered marker;
- color per annotation;
- annotation box;
- connector when the marker is displaced;
- panel number uses the same color;
- card number click focuses/highlights the annotation.

Nested annotations:

- parent/outer annotations should remain visually clear.
- parent border can be visually stronger/outside without changing saved rect.
- child annotations should remain above parent when needed.
- do not use strong permanent fill.

Free visual marks:

- area marks and pen strokes stay separate from structured annotations.
- they use fixed red styling for now.
- they are preserved when clearing structured annotations from the panel.

## Export UI rules

### Copy image

- Copies the current viewport image.
- Works with or without annotations.
- Includes structured annotations and free visual marks.
- Does not download automatically.

### Download image

- Downloads the current viewport PNG.
- Works with or without annotations.
- Includes structured annotations and free visual marks.
- Does not copy automatically.

### Snapshot

- Composed PNG: viewport on the left, annotation sidebar on the right.
- Sidebar should show only structured annotations.
- Sidebar should not show URL, title, viewport, DPR, selector, position, size, or other technical metadata.
- Sidebar title should use i18n and current annotation terminology.
- Transient UI controls must be hidden before capture.

### Generate PDF

- Opens printable HTML for browser Save as PDF.
- Structured annotations get one section each.
- Free visual marks get one final section together.
- Do not show technical metadata by default.

## Shortcuts

Review Mode shortcuts:

- `I`: activate/deactivate LayoutPilot.
- `H`: help.
- `Q`: deactivate.
- `Esc`: cancel current action.
- `D`: Review panel.
- `Delete`: remove selected annotation.
- `P`: create/pin annotation from hovered element in Elemento.
- `S`: copy image.
- `Shift+S`: download image.
- `G`: generate PDF.

Rules:

- Do not use `Ctrl+C` or `Ctrl+S` for Review actions.
- Do not trigger shortcuts inside input, textarea, select, contenteditable, or role textbox.
- Keep shortcut help readable; increase popup width or improve layout before allowing text overlap.

## i18n

Visible text should use `src/shared/i18n.js` and `src/shared/locales/`.

When adding labels:

- Add PT-BR, EN, and ES.
- Keep terminology aligned across popup, toolbar, panel, snapshot, and print report.
- Prefer "annotation" terminology for structured Review items.
- Avoid mixing comments/anotacoes in new UI.

## Icons

Use `src/shared/icons.js`.

Rules:

- Add reusable icons centrally.
- Do not scatter manual inline SVG across feature modules.
- Keep icons simple, stroked, and visually consistent.
- Icon-only buttons need `title` and `aria-label`.

## Buttons and action hierarchy

Use compact buttons inside tool surfaces.

Guidelines:

- Primary actions: activate, save.
- Secondary/actions: copy image, download image, generate PDF.
- Danger actions: remove, clear annotations.
- Icon buttons: edit, remove, pin/unpin, collapse.

Avoid oversized buttons in dense tool surfaces.

## Capture hygiene

Before screenshots/export captures:

- Hide panel, toolbar, dialogs, toasts, hover preview, selection box, draft box, and transient mark controls.
- Keep visible annotation boxes, markers, connectors, area marks, and pen strokes.
- Always restore UI in `finally`.

Controls that should not appear in captures:

- area mark hover buttons;
- pen stroke hover buttons;
- panel/toolbar;
- confirm dialog;
- toast.

## Accessibility and interaction

Rules:

- Buttons need clear labels or `aria-label`.
- Tool buttons should use `aria-pressed`.
- Draggable areas must not conflict with button clicks.
- Floating controls must not trap page interaction unexpectedly.
- Review hit layers must not block panel textareas or toolbar buttons.

## Things to avoid

- Reintroducing technical selectors in visual annotation cards.
- Putting export actions back into the Review panel.
- Clearing free visual marks when the user only clears structured annotations.
- Adding PDF libraries without explicit scope.
- Adding page-wide scroll capture without a plan.
- Adding new browser permissions without explicit scope.
