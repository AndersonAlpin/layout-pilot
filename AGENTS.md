# LayoutPilot Agent Guide

## Product overview

LayoutPilot is a Chrome/Edge Manifest V3 extension for frontend layout inspection and visual review.

It has two main modes:

- Inspect: hover, inspect, pin, compare spacing, view details, and copy layout context.
- Review: create visual annotations, free area marks, pen marks, screenshots, snapshots, and printable PDF reports.

The product is aimed at frontend developers, designers, and QA reviewers who need quick visual feedback directly on live pages without opening DevTools.

## Repository path

Current repository path:

`D:\Biblioteca\Development\GitHub\Anderson\layout-pilot`

## Stack

- Vanilla JavaScript, HTML, and CSS.
- No React or Vue.
- No bundler.
- Chrome/Edge Manifest V3.
- Background service worker.
- Content-script UI rendered on top of the inspected page.
- Popup UI for activation, mode selection, language, and shortcuts.
- Shared helpers live in `src/shared`.

## Architecture map

`src/background.js`

- Service worker entry.
- Handles extension messages.
- Captures the visible tab through `chrome.tabs.captureVisibleTab`.

`src/shared/`

- Constants, i18n, icons, messaging, DOM helpers, and small UI render helpers.
- Locale files live in `src/shared/locales/`.
- Shared UI primitives live in `src/shared/ui/`.
- Icons are centralized in `src/shared/icons.js`.

`src/popup/`

- Extension popup for activation, mode selection, shortcuts, and language selection.
- Persists language and last selected mode.
- Uses a custom flag-based language picker.

`src/content/`

- Content-script modules loaded in the order defined by `CONTENT_SCRIPT_FILES`.
- `inspector.js`: main content controller and mode orchestration.
- `inspector.css`: all injected UI styles for Inspect and Review.
- `element-inspector.js`: element information and computed-style extraction.
- `detail-panel.js`: Inspect Mode detail panel.
- `shortcuts.js`: contextual shortcut handling.
- `review-state.js`: Review Mode state.
- `review-mode.js`: Review Mode orchestration.
- `review-colors.js`: annotation palette, default/custom colors, and color references.
- `review-color-controls.js`: color popovers and annotation color controls.
- `review-toolbar.js`: floating Review toolbar.
- `review-panel.js`: annotation panel.
- `review-markers.js`: annotation boxes, markers, connectors, colors, and nesting behavior.
- `review-snapshot.js`: simple image copy/download and composed snapshot image.
- `review-print-report.js`: printable HTML report for saving as PDF.

## Modes

### Inspect Mode

Inspect Mode is for inspecting live layout details.

It supports:

- hover overlay;
- tooltip with layout/style details;
- pinning an element;
- distance guides;
- details panel;
- context/CSS export.

Use Inspect terminology for this mode. Do not mix it with Review terminology.

### Review Mode

Review Mode is a visual review workspace.

It contains subtools:

- Visualizar: neutral viewing tool; no hover selection and no creation.
- Elemento: element annotation tool.
- Area: free rectangle mark tool; can be converted to an annotation.
- Caneta: freehand visual mark tool; does not create comments.

Review Mode also includes actions:

- Copiar imagem.
- Baixar imagem.
- Gerar PDF.

The Review panel is for structured annotations only. Free area marks and pen marks are visual marks and should not appear as panel cards unless explicitly converted to annotations.

## Review terminology

Use "annotation" / "anotacao" as the canonical concept for structured review items.

Structured annotations:

- have a number;
- have a color;
- appear in the Review panel;
- may contain a user note;
- appear in snapshot sidebars and PDF sections.
- support automatic palette colors, a default color, custom colors, recent colors, and individual card-level changes.

Free visual marks:

- area marks and pen strokes;
- do not require comments;
- do not appear in the Review panel;
- should appear in screenshots, copied images, snapshots, and the final free-marks section of the print report.
- currently use the fixed free-mark color.

Avoid mixing "comments" and "annotations" in new UI copy. Prefer annotations in UI surfaces that manage structured review items.

## Exports

### Simple image

- Copy image: copies the current annotated viewport to the clipboard.
- Download image: downloads the current annotated viewport as PNG.
- These actions must work even when there are no annotations.

### Snapshot image

- Downloads a composed PNG with the captured viewport on the left and an annotation sidebar on the right.
- Sidebar should show only structured annotations.
- Free visual marks should remain visible in the captured viewport.

### Print/PDF report

- Generates printable HTML, not a binary PDF.
- The browser print dialog is used to save as PDF.
- The report opens in `src/report/review-report.html` after the background worker stores a temporary payload.
- Each structured annotation gets its own section with comment and full-viewport image highlighting only that annotation.
- Free area/pen marks are shown together in a final section when present.

## Release and site artifacts

- `npm run package` creates `dist/layout-pilot.zip` through `tools/package-extension.js`.
- The package script validates manifest references and copies only production extension files into a temporary staging folder before zipping.
- `site/dist` contains the static privacy policy site in EN, PT-BR, and ES.
- Do not include `docs/plans` in release commits or extension packages unless the user explicitly asks.

## UI terminology

Core PT labels:

- Modo Inspecao
- Modo Revisao
- Visualizar
- Elemento
- Area
- Caneta
- Anotacoes
- Copiar imagem
- Baixar imagem
- Gerar PDF

Core EN labels:

- Inspect Mode
- Review Mode
- View
- Element
- Area
- Pen
- Annotations
- Copy image
- Download image
- Generate PDF

Core ES labels:

- Modo Inspeccion
- Modo Revision
- Visualizar
- Elemento
- Area
- Lapiz
- Anotaciones
- Copiar imagen
- Descargar imagen
- Generar PDF

## Shared UI and icons

Shared UI helpers already exist in `src/shared/ui/`:

- `render`
- `button`
- `panel-section`
- `shortcut-key`

Rules:

- Keep helpers pure.
- Return HTML strings.
- Do not call Chrome APIs from shared UI helpers.
- Use `escapeHtml` for dynamic content.
- Use `data-*` attributes for event delegation.
- Keep icons centralized in `src/shared/icons.js`.
- Do not add ad hoc inline SVG in feature modules when a shared icon exists.

## Coding conventions

- Use 2 spaces.
- Use single quotes.
- Do not add semicolons unless the surrounding file already requires them.
- Preserve the existing module pattern: IIFEs writing to `window.LayoutPilotModules`.
- Use i18n for visible text.
- Use event delegation when it fits the existing pattern.
- Preserve `data-*` attributes used by action handlers.
- Keep Review state in `review-state.js` when it is shared across render/actions.
- Keep transient DOM rendering in content modules and CSS.
- Keep release tooling local and explicit; avoid adding a bundler just to package the extension.

## Validation

Common validation:

- `node --check` on changed JavaScript files.
- `git diff --check`.
- `npm test` when behavior or shared helpers change.
- `npm run package` before release/package commits.
- Manual UI validation for Review/Inspect changes.

Review validation examples:

- Inspect Mode still hovers, pins, shows details, and copies context.
- Review Mode toolbar still appears and tool switching works.
- Panel remains usable and does not get blocked by hit layers.
- Copy/download image still include visual marks.
- Snapshot still hides transient UI controls.
- PDF report still hides transient UI controls and includes free visual marks in the final section.

## Do not do without asking

- Do not migrate the stack.
- Do not add a framework.
- Do not add a bundler.
- Do not add large dependencies.
- Do not add new permissions to `manifest.json` unless explicitly scoped.
- Do not implement PDF with a binary PDF library unless explicitly requested.
- Do not remove technical annotation state such as selector, target, rect, position, or element metadata.
- Do not turn free visual marks into structured annotations unless the user explicitly chooses that action.
- Do not commit without an explicit request.

## Current known caveats

- Page-wide/full-scroll capture is not implemented.
- Print/PDF report supports the current viewport and uses browser print.
- Off-viewport annotations may not have an image in the print report.
- Free area and pen marks are visual-first and currently use a fixed red style.
- `docs/plans` may contain historical or exploratory decisions and should not be treated as the current source of truth when they conflict with code or `docs/ai`.
