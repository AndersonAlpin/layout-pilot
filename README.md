# LayoutPilot

LayoutPilot is a lightweight Chrome extension for inspecting layout details directly on live web pages. It helps designers and frontend developers understand spacing, sizing, colors, typography, and class names without opening DevTools panels or digging through the DOM manually.

## What it does

- Highlights the element under the cursor
- Shows width, height, position, padding, margin, and border radius
- Displays text color, background color, border colors, and font info
- Lists the element classes
- Lets you pin one element and compare spacing against another
- Draws distance guides for horizontal and vertical gaps
- Works on regular `http` and `https` pages

## How it works

Once inspect mode is enabled, LayoutPilot injects a content script into the current tab and renders a visual overlay on top of the page. As you move the mouse, the extension reads computed styles from the hovered element and shows the most relevant layout information in a floating tooltip.

Clicking an element pins it in place so you can hover another one and measure the spacing between them. Press `Esc` at any time to leave inspect mode.

## Installation

Because this project is currently set up as an unpacked Chrome extension, the easiest way to run it locally is:

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select this project folder: `layout-pilot`

After loading the extension, click the LayoutPilot icon in Chrome and enable inspect mode on any `http` or `https` page.

## Usage

1. Open a website you want to inspect
2. Click the LayoutPilot extension icon
3. Press **Enable inspect mode**
4. Move the mouse over elements to inspect them
5. Click an element to pin it
6. Hover another element to compare spacing
7. Press `Esc` to disable inspect mode

## Project structure

```text
layout-pilot/
├── manifest.json
├── icons/
└── src/
    ├── background.js
    ├── content/
    │   ├── inspector.css
    │   └── inspector.js
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

Current extension version: `0.3.0`

## License

No license has been added yet. If this project is going to be open source, adding a license file is recommended.
