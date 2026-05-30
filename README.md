# LayoutPilot

LayoutPilot is a lightweight Chrome and Edge extension for inspecting layout details and creating visual review notes directly on live web pages. It helps designers, frontend developers, and QA reviewers understand spacing, sizing, colors, typography, class names, annotations, screenshots, and printable review reports without opening DevTools panels or moving work into a separate design tool.

## What it does

- Inspect Mode highlights the element under the cursor.
- Shows width, height, position, padding, margin, border radius, color, background, border, typography, and class information.
- Lets you pin one element and compare spacing against another.
- Draws distance guides for horizontal and vertical gaps.
- Review Mode creates structured annotations, free area marks, and pen marks.
- Copies or downloads annotated viewport images.
- Generates printable review reports that can be saved as PDF from the browser print dialog.
- Supports English, Portuguese, and Spanish UI text.
- Works on regular `http` and `https` pages.

## How it works

Once LayoutPilot is enabled, it injects content scripts into the current tab and renders visual overlays on top of the page. Inspect Mode reads computed styles from hovered elements and shows relevant layout information in a floating tooltip.

Review Mode keeps its own toolbar and annotation panel. It can mark elements, draw free rectangles, draw pen strokes, capture the visible tab, and open a printable report page inside the extension. Processing stays local in the browser.

## Installation

Because this project is currently set up as an unpacked Chrome extension, the easiest way to run it locally is:

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select this project folder: `layout-pilot`

After loading the extension, click the LayoutPilot icon in Chrome and activate it on any `http` or `https` page.

## Usage

1. Open a website you want to inspect
2. Click the LayoutPilot extension icon
3. Choose **Inspect Mode** or **Review Mode**
4. Press **Activate**
5. Use the active mode tools on the page
6. Press `Esc` to cancel the current panel/selection or deactivate when nothing else is active

Shortcuts:

- `H`: show/hide shortcuts
- `Esc`: cancel the current action, close panels, or clear selection
- `I`: return to Inspect Mode
- `C`: copy simple context
- `P`: pin/unpin the current element
- `D`: open/close element details
- `S`: copy image in Review Mode
- `Shift+S`: download image in Review Mode
- `G`: generate a printable PDF report in Review Mode

## Packaging

Install dependencies once:

```bash
npm install
```

Run tests:

```bash
npm test
```

Create a Chrome Web Store zip:

```bash
npm run package
```

The package command writes `dist/layout-pilot.zip`. The generated `dist/` directory is ignored by git.

## Privacy site

The static privacy policy site lives in `site/dist` and includes:

- English: `site/dist/index.html`
- Portuguese: `site/dist/pt-br/index.html`
- Spanish: `site/dist/es/index.html`

## Project structure

```text
layout-pilot/
├── manifest.json
├── package.json
├── tools/
│   └── package-extension.js
├── site/
│   └── dist/
├── icons/
└── src/
    ├── background.js
    ├── content/
    │   ├── core/
    │   ├── inspect/
    │   └── review/
    ├── report/
    ├── shared/
    └── popup/
        ├── popup.html
        ├── popup.css
        └── popup.js
```

## Permissions

The extension uses a small set of Chrome permissions:

- `activeTab` to interact with the currently selected page
- `scripting` to inject the inspector UI and behavior
- `storage` to persist lightweight local extension data

## Current stack

- Chrome Extension Manifest V3
- Plain JavaScript
- Plain CSS
- Static HTML

## Version

Current extension version: `1.0.0`

## License

No license has been added yet. If this project is going to be open source, adding a license file is recommended.
