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
    SET_ENABLED: 'layoutpilot:set-enabled'
  }

  const SHORTCUT = {
    INSPECT: 'i',
    HELP: 'h',
    QUIT: 'q',
    CANCEL: 'Escape',
    COPY_CONTEXT: 'c',
    PIN: 'p',
    DETAILS: 'd'
  }

  const CONTENT_CSS_FILES = [
    'src/content/inspector.css'
  ]

  const CONTENT_SCRIPT_FILES = [
    'src/shared/constants.js',
    'src/shared/dom.js',
    'src/content/selector-utils.js',
    'src/content/element-inspector.js',
    'src/content/context-export.js',
    'src/content/css-export.js',
    'src/content/clipboard.js',
    'src/content/shortcuts.js',
    'src/content/detail-panel.js',
    'src/content/draggable-panel.js',
    'src/content/inspector.js'
  ]

  const UI_CLASSES = [
    'layoutpilot-overlay',
    'layoutpilot-selected-overlay',
    'layoutpilot-tooltip',
    'layoutpilot-distance-layer',
    'layoutpilot-detail-panel',
    'layoutpilot-help-panel',
    'layoutpilot-toast'
  ]

  root.constants = {
    INSTANCE_KEY: '__layoutPilot',
    MODE,
    MESSAGE_TYPE,
    SHORTCUT,
    CONTENT_CSS_FILES,
    CONTENT_SCRIPT_FILES,
    UI_CLASSES,
    UI_SELECTOR: UI_CLASSES.map(className => `.${className}`).join(', '),
    STORAGE_KEYS: {
      INSTALLED_AT: 'layoutPilotInstalledAt'
    }
  }
})()
