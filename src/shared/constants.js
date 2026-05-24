(() => {
  const root = window.LayoutPilotModules ||= {}

  const MODE = {
    INSPECT: 'inspect',
    REVIEW: 'review'
  }

  const MESSAGE_TYPE = {
    PING: 'layoutpilot:ping',
    GET_STATE: 'layoutpilot:get-state',
    TOGGLE: 'layoutpilot:toggle',
    SET_ENABLED: 'layoutpilot:set-enabled',
    SET_LANGUAGE: 'layoutpilot:set-language',
    CAPTURE_VISIBLE_TAB: 'layoutpilot:capture-visible-tab'
  }

  const SHORTCUT = {
    INSPECT: 'i',
    HELP: 'h',
    QUIT: 'q',
    CANCEL: 'Escape',
    COPY_CONTEXT: 'c',
    PIN: 'p',
    DETAILS: 'd',
    SNAPSHOT_IMAGE: 's',
    PDF_REPORT: 'g'
  }

  const SHORTCUTS_BY_MODE = {
    [MODE.INSPECT]: [
      { key: 'I', labelKey: 'shortcuts.inspect' },
      { key: 'H', labelKey: 'shortcuts.help' },
      { key: 'Q', labelKey: 'shortcuts.quit' },
      { key: 'Esc', labelKey: 'shortcuts.cancel' },
      { key: 'C', labelKey: 'shortcuts.context' },
      { key: 'P', labelKey: 'shortcuts.pin' },
      { key: 'D', labelKey: 'shortcuts.details' }
    ],
    [MODE.REVIEW]: [
      { key: 'I', labelKey: 'shortcuts.toggleLayoutPilot' },
      { key: 'H', labelKey: 'shortcuts.help' },
      { key: 'Q', labelKey: 'shortcuts.quit' },
      { key: 'Esc', labelKey: 'shortcuts.cancel' },
      { key: 'D', labelKey: 'shortcuts.reviewPanel' },
      { key: 'Delete', labelKey: 'shortcuts.removeAnnotation' },
      { key: 'P', labelKey: 'shortcuts.pin' },
      { key: 'S', labelKey: 'shortcuts.copyImage' },
      { key: 'Shift+S', labelKey: 'shortcuts.downloadImage' },
      { key: 'G', labelKey: 'shortcuts.generatePdf' }
    ]
  }

  const CONTENT_CSS_FILES = [
    'src/content/inspector.css'
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
    'src/shared/ui/button.js',
    'src/shared/ui/panel-section.js',
    'src/shared/ui/shortcut-key.js',
    'src/content/selector-utils.js',
    'src/content/element-inspector.js',
    'src/content/context-export.js',
    'src/content/css-export.js',
    'src/content/clipboard.js',
    'src/content/shortcuts.js',
    'src/content/detail-panel.js',
    'src/content/draggable-panel.js',
    'src/content/review-state.js',
    'src/content/review-markers.js',
    'src/content/review-panel.js',
    'src/content/review-toolbar.js',
    'src/content/review-snapshot.js',
    'src/content/review-print-report.js',
    'src/content/review-mode.js',
    'src/content/inspector.js'
  ]

  const UI_CLASSES = [
    'layoutpilot-overlay',
    'layoutpilot-selected-overlay',
    'layoutpilot-tooltip',
    'layoutpilot-distance-layer',
    'layoutpilot-detail-panel',
    'layoutpilot-help-panel',
    'layoutpilot-review-hit-layer',
    'layoutpilot-review-selection-box',
    'layoutpilot-review-hover',
    'layoutpilot-review-annotation-layer',
    'layoutpilot-review-area-mark-layer',
    'layoutpilot-review-marker-layer',
    'layoutpilot-review-panel',
    'layoutpilot-review-toolbar',
    'layoutpilot-review-workspace-frame',
    'layoutpilot-review-confirm',
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
      LAST_MODE: 'layoutPilotLastMode'
    }
  }
})()
