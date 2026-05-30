# LayoutPilot Architecture Notes

## Overview

LayoutPilot is a Manifest V3 browser extension with a background service worker, a popup UI, and content-script overlays injected into regular `http` and `https` pages.

The codebase intentionally uses vanilla JavaScript, HTML templates, and CSS. There is no framework and no bundler.

Runtime modules are exposed through `window.LayoutPilotModules` and loaded in the order declared in `src/shared/constants.js`.

## Main areas

`src/background.js`

- Owns background message handling.
- Responds to capture requests with `chrome.tabs.captureVisibleTab`.
- Stores temporary Review report payloads in memory and opens the extension report page for printing.
- Should stay small and avoid UI-specific logic.

`src/shared/`

- Shared constants, i18n, locale files, DOM helpers, messaging helpers, icons, and small UI render helpers.
- `constants.js` defines modes, message types, shortcuts, content script load order, and known UI classes.
- `icons.js` is the central source for inline SVG icons.
- `locales/` contains PT-BR, EN, and ES strings.

`src/popup/`

- Popup UI for enabling/disabling LayoutPilot, selecting Inspect/Review mode, viewing shortcuts, and choosing language.
- Persists selected language and last selected mode in Chrome storage.
- Uses custom flag-based language selection rather than a native select.

`src/content/`

- Main injected UI and behavior.
- `inspector.js` coordinates extension state, mode switching, popup messages, and shared shortcut dispatch.
- `inspector.css` contains all injected UI styles for both Inspect and Review.
- `shortcuts.js` handles contextual shortcut behavior.
- `draggable-panel.js` provides reusable drag behavior for floating panels/toolbars.

## Inspect Mode flow

Inspect Mode is the original inspection experience.

General flow:

1. Popup enables LayoutPilot in Inspect Mode.
2. Content scripts are injected if needed.
3. `inspector.js` starts the inspect mode controller.
4. Pointer movement finds the element under the cursor.
5. `element-inspector.js` collects computed layout/style data.
6. Tooltip/overlay render the current element context.
7. Pinning enables distance guides and detail panel workflows.

Important files:

- `src/content/inspector.js`
- `src/content/element-inspector.js`
- `src/content/detail-panel.js`
- `src/content/context-export.js`
- `src/content/css-export.js`
- `src/content/clipboard.js`

## Review Mode flow

Review Mode is the visual review workspace.

General flow:

1. Popup enables LayoutPilot in Review Mode.
2. `review-mode.js` starts Review state, scroll lock, context-menu blocking, toolbar, hit layer, and optional panel.
3. The active Review tool decides how pointer input behaves.
4. Structured annotations are stored in `state.annotations`.
5. Free visual marks are stored separately.
6. Renderers update annotation boxes, markers, connectors, free marks, toolbar, and panel.

Important files:

- `src/content/review-state.js`
- `src/content/review-mode.js`
- `src/content/review-colors.js`
- `src/content/review-color-controls.js`
- `src/content/review-toolbar.js`
- `src/content/review-panel.js`
- `src/content/review-markers.js`
- `src/content/review-snapshot.js`
- `src/content/review-print-report.js`

## Review tools

### Visualizar

Neutral viewing tool.

- Disables element hover selection.
- Does not create annotations.
- Lets the user look at the page without accidental creation.

### Elemento

Element annotation tool.

- Enables element hover.
- Click or `P` creates a draft annotation from the hovered/clicked element.
- Saved annotations get numbered markers, colored boxes, connectors when needed, and panel cards.

### Area

Free rectangle mark tool.

- Dragging draws a rectangle while the pointer moves.
- Releasing creates a free area mark.
- Area marks do not appear in the panel.
- Hover tools allow removing the mark or converting it into a structured annotation.
- Area marks currently use the fixed free-mark color.

### Caneta

Freehand mark tool.

- Dragging creates a red stroke.
- Pen strokes do not appear in the panel.
- Hover tools allow removing an individual stroke.
- Pen strokes are included in image/snapshot exports and in the final free-marks section of the print report.
- Pen strokes currently use the fixed free-mark color.

## Review colors

Structured annotations support automatic palette assignment, a default color mode, custom colors, recent custom colors, and individual card-level color changes.

Color behavior lives in:

- `src/content/review-colors.js`
- `src/content/review-color-controls.js`
- `src/content/review-markers.js`
- `src/content/review-panel.js`
- `src/content/review-snapshot.js`
- `src/content/review-print-report.js`

Color preferences are persisted in Chrome storage. Free visual marks are still visual-first and keep the fixed free-mark color until a future color workflow is added for them.

## Review state

`review-state.js` owns the state shape and mutation helpers.

Structured annotations:

- `annotations`
- `nextId`
- `selectedAnnotationId`
- `highlightedAnnotationId`
- `editingAnnotationId`
- `draftAnnotation`

Free visual marks:

- `areaMarks`
- `nextAreaMarkId`
- `penStrokes`
- `nextPenStrokeId`
- `activePenStrokeId`

UI/runtime state:

- layers, panel, toolbar, confirm dialog, toast, drag state, scroll lock, selection state, active tool, color settings.

Derived visual information should generally be calculated at render time instead of persisted.

## Review rendering layers

Review UI uses fixed-position injected layers:

- hit layer: pointer capture for tools;
- workspace frame: visual boundary for free tools;
- hover overlay: element preview;
- annotation layer: saved annotation boxes;
- area mark layer: free area marks;
- pen layer: freehand strokes;
- marker layer: numbered markers and connectors;
- panel: annotation list/editor;
- toolbar: floating Review tools/actions;
- confirm dialog and toast.

Layer ordering matters. Toolbars, panels, and transient action buttons must remain clickable above visual marks.

## Snapshot flow

`review-snapshot.js` handles:

- simple image download;
- simple image copy;
- composed snapshot download.

Capture flow:

1. Temporarily hide transient UI: panel, toolbar, workspace frame, dialogs, toasts, selection box, hover preview, draft box, free-mark action buttons.
2. Keep visible content marks: annotation boxes, markers, connectors, free area marks, pen strokes.
3. Ask background for `captureVisibleTab`.
4. Restore UI in `finally`.
5. For composed snapshots, draw the captured viewport on the left and an annotation sidebar on the right.

## Print report flow

`review-print-report.js` creates printable HTML.

It does not generate binary PDFs. The browser print dialog is used to save as PDF.

Flow:

1. Hide transient UI and free marks.
2. Capture a clean viewport.
3. Build one section per structured annotation.
4. Draw only the target annotation highlight on each section image.
5. If free visual marks exist, capture the viewport with those marks visible and append one final free-marks section.
6. Send the report payload to the background service worker.
7. Open `src/report/review-report.html` in a new tab and call `window.print()` from that extension page after images load.

## Popup flow

The popup:

- reads current extension state from the active tab/background;
- lets the user activate/deactivate LayoutPilot;
- lets the user choose Inspect or Review;
- shows contextual shortcuts;
- lets the user choose language.

Language behavior:

- manual language selection is persisted;
- when no manual language exists, browser language can be used as default;
- supported locales are PT-BR, EN, and ES.

## Storage

Known storage keys are in `src/shared/constants.js`:

- `layoutPilotInstalledAt`
- `layoutPilotLanguage`
- `layoutPilotLastMode`
- `layoutPilotReviewColorMode`
- `layoutPilotReviewDefaultColor`
- `layoutPilotReviewRecentColors`

Avoid new persisted state unless the behavior truly needs to survive reloads.

## Messaging

Message types are centralized in `src/shared/constants.js`.

When adding messages:

- update constants;
- update sender and receiver together;
- keep payloads small and serializable;
- return serialized errors where possible.

## Validation map

After architecture-impacting changes, validate:

- popup activation/deactivation;
- last mode persistence;
- language picker;
- Inspect hover/pin/detail/copy;
- Review toolbar and tool switching;
- Review panel editing/removal/clear behavior;
- image copy/download;
- composed snapshot;
- print/PDF report.
- release package with `npm run package`;
- privacy site in `site/dist`.
