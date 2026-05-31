(() => {
  const root = window.LayoutPilotModules ||= {}

  const MODE = {
    INSPECT: 'inspect',
    REVIEW: 'review',
    COMPARE: 'compare'
  }

  const MESSAGE_TYPE = {
    PING: 'layoutpilot:ping',
    GET_STATE: 'layoutpilot:get-state',
    TOGGLE: 'layoutpilot:toggle',
    SET_ENABLED: 'layoutpilot:set-enabled',
    SET_LANGUAGE: 'layoutpilot:set-language',
    CAPTURE_VISIBLE_TAB: 'layoutpilot:capture-visible-tab',
    STORE_REVIEW_REPORT: 'layoutpilot:store-review-report',
    GET_REVIEW_REPORT: 'layoutpilot:get-review-report',
    CLEAR_REVIEW_REPORT: 'layoutpilot:clear-review-report'
  }

  const SHORTCUT = {
    INSPECT: 'i',
    HELP: 'h',
    CANCEL: 'Escape',
    COPY_CONTEXT: 'c',
    PIN: 'p',
    DETAILS: 'd',
    SNAPSHOT_IMAGE: 's',
    PDF_REPORT: 'g',
    TOGGLE_OVERLAY: 'o',
    TOGGLE_SKELETON: 'k'
  }

  const SHORTCUTS_BY_MODE = {
    [MODE.INSPECT]: [
      { key: 'H', labelKey: 'shortcuts.help' },
      { key: 'Esc', labelKey: 'shortcuts.cancel' },
      { key: 'D', labelKey: 'shortcuts.details' },
      { key: 'I', labelKey: 'shortcuts.inspect' },
      { key: 'C', labelKey: 'shortcuts.context' },
      { key: 'P', labelKey: 'shortcuts.pin' }
    ],
    [MODE.REVIEW]: [
      { key: 'H', labelKey: 'shortcuts.help' },
      { key: 'Esc', labelKey: 'shortcuts.cancel' },
      { key: 'D', labelKey: 'shortcuts.reviewPanel' },
      { key: 'Delete', labelKey: 'shortcuts.removeAnnotation' },
      { key: 'S', labelKey: 'shortcuts.copyImage' },
      { key: 'Shift+S', labelKey: 'shortcuts.downloadImage' },
      { key: 'G', labelKey: 'shortcuts.generatePdf' }
    ],
    [MODE.COMPARE]: [
      { key: 'Ctrl+V', labelKey: 'shortcuts.pasteFigma' },
      { key: 'O', labelKey: 'shortcuts.toggleOverlay' },
      { key: 'K', labelKey: 'shortcuts.toggleSkeleton' },
      { key: 'H', labelKey: 'shortcuts.help' },
      { key: 'Esc', labelKey: 'shortcuts.cancel' }
    ]
  }

  const CONTENT_CSS_FILES = [
    'src/content/base.css',
    'src/content/inspect/inspect.css',
    'src/content/review/review.css',
    'src/content/figma/figma.css'
  ]

  const CONTENT_SCRIPT_FILES = [
    'src/shared/constants.js',
    'src/shared/locales/en.js',
    'src/shared/locales/pt-BR.js',
    'src/shared/locales/es.js',
    'src/shared/i18n.js',
    'src/shared/dom.js',
    'src/shared/icons.js',
    'src/shared/ui/render.js',
    'src/shared/ui/tooltip.js',
    'src/shared/ui/button.js',
    'src/shared/ui/toggle.js',
    'src/shared/ui/panel-section.js',
    'src/shared/ui/shortcut-key.js',
    'src/content/core/selector-utils.js',
    'src/content/core/element-inspector.js',
    'src/content/core/draggable-panel.js',
    'src/content/core/clipboard.js',
    'src/content/core/shortcuts.js',
    'src/content/core/modal-shield.js',
    'src/content/inspect/context-export.js',
    'src/content/inspect/css-export.js',
    'src/content/inspect/detail-panel.js',
    'src/content/inspect/inspect-mode.js',
    'src/content/review/review-state.js',
    'src/content/review/review-colors.js',
    'src/content/review/review-markers.js',
    'src/content/review/review-color-controls.js',
    'src/content/review/review-panel.js',
    'src/content/review/review-toolbar.js',
    'src/content/review/review-snapshot.js',
    'src/content/review/review-print-report.js',
    'src/content/review/review-mode.js',
    'src/content/figma/figma-clipboard.js',
    'src/content/figma/figma-svg-parser.js',
    'src/content/figma/figma-align.js',
    'src/content/figma/figma-match.js',
    'src/content/figma/figma-diff.js',
    'src/content/figma/pixelmatch.js',
    'src/content/figma/figma-pixel.js',
    'src/content/figma/figma-overlay.js',
    'src/content/figma/figma-diff-mode.js',
    'src/content/core/orchestrator.js'
  ]

  const UI_CLASSES = [
    'layoutpilot-overlay',
    'layoutpilot-selected-overlay',
    'layoutpilot-hit-shield',
    'layoutpilot-tooltip',
    'layoutpilot-distance-layer',
    'layoutpilot-detail-panel',
    'layoutpilot-help-panel',
    'layoutpilot-review-hit-layer',
    'layoutpilot-review-selection-box',
    'layoutpilot-review-hover',
    'layoutpilot-review-annotation-layer',
    'layoutpilot-review-area-mark-layer',
    'layoutpilot-review-pen-layer',
    'layoutpilot-review-marker-layer',
    'layoutpilot-review-panel',
    'layoutpilot-review-toolbar',
    'layoutpilot-review-workspace-frame',
    'layoutpilot-review-confirm',
    'layoutpilot-review-popover',
    'layoutpilot-review-menu',
    'layoutpilot-figma-overlay',
    'layoutpilot-figma-marker-layer',
    'layoutpilot-figma-pixel-layer',
    'layoutpilot-figma-panel',
    'layoutpilot-ui-tooltip',
    'layoutpilot-toast'
  ]

  root.constants = {
    INSTANCE_KEY: '__layoutPilot',
    MODE,
    MESSAGE_TYPE,
    SHORTCUT,
    SHORTCUTS_BY_MODE,
    CONTENT_CSS_FILES,
    CONTENT_SCRIPT_FILES,
    UI_CLASSES,
    UI_SELECTOR: UI_CLASSES.map(className => `.${className}`).join(', '),
    STORAGE_KEYS: {
      INSTALLED_AT: 'layoutPilotInstalledAt',
      LANGUAGE: 'layoutPilotLanguage',
      LAST_MODE: 'layoutPilotLastMode',
      REVIEW_COLOR_MODE: 'layoutPilotReviewColorMode',
      REVIEW_DEFAULT_COLOR: 'layoutPilotReviewDefaultColor',
      REVIEW_RECENT_COLORS: 'layoutPilotReviewRecentColors'
    }
  }
})()
