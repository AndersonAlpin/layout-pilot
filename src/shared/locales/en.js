(() => {
  const root = window.LayoutPilotModules ||= {}
  const locales = root.locales ||= {}

  locales.en = {
    app: {
      name: 'LayoutPilot',
      tagline: 'Visual inspect and review for frontend'
    },
    common: {
      activate: 'Activate',
      deactivate: 'Deactivate',
      close: 'Close',
      cancel: 'Cancel',
      copy: 'Copy',
      copied: 'Copied',
      enabled: 'Active',
      disabled: 'Disabled'
    },
    language: {
      title: 'Language',
      label: 'Interface language',
      auto: 'Auto',
      portuguese: 'Português',
      english: 'English',
      spanish: 'Español'
    },
    popup: {
      status: {
        checking: 'Checking current tab...',
        unsupported: 'Open an http/https page to inspect.',
        active: 'Inspect Mode active.',
        inactive: 'LayoutPilot disabled.'
      },
      mode: {
        title: 'Mode',
        inspect: {
          name: 'Inspect Mode',
          description: 'Hover, pin, details and simple context.'
        },
        review: {
          name: 'Review Mode',
          description: 'Coming soon: marks and Markdown report.'
        }
      },
      shortcuts: {
        title: 'Shortcuts',
        note: 'I works after activating this tab from the popup.'
      }
    },
    shortcuts: {
      inspect: 'Inspect',
      help: 'Shortcuts',
      quit: 'Deactivate',
      cancel: 'Cancel',
      context: 'Simple context',
      pin: 'Pin',
      details: 'Details'
    },
    detail: {
      kicker: 'Inspect Mode',
      close: 'Close details',
      actions: {
        simpleContext: 'Simple context',
        fullContext: 'Full context'
      },
      simpleContextPreview: 'Simple Context'
    },
    help: {
      title: 'LayoutPilot shortcuts',
      close: 'Close help',
      shortcuts: {
        inspect: 'Activate/deactivate inspect',
        help: 'Show/hide shortcuts',
        quit: 'Deactivate LayoutPilot',
        cancel: 'Cancel current action',
        context: 'Copy simple context',
        details: 'Open/close details',
        pin: 'Pin/unpin element'
      },
      note: {
        inspect: 'I works after activating this tab from the popup.',
        review: 'Review Mode: coming soon.'
      }
    },
    tooltip: {
      clickToPin: 'Click to pin.',
      clickToUnpin: 'Click again to unpin.',
      help: 'D details - C simple context - H help - Q quit'
    },
    context: {
      issue: {
        title: 'Issue',
        placeholder: '[Describe what looks wrong here]'
      },
      request: {
        title: 'Request',
        compact: 'Suggest the most likely CSS/layout adjustment. Keep the existing visual style unless needed.',
        full: 'Use this context to suggest precise frontend/CSS adjustments. Keep the existing visual style unless the issue requires changing it.'
      }
    },
    toast: {
      noElement: 'No element selected',
      inspectOn: 'Inspect mode on',
      reviewSoon: 'Review mode coming soon',
      elementPinned: 'Element pinned',
      elementUnpinned: 'Element unpinned',
      copyFailed: 'Could not copy',
      copied: {
        simpleContext: 'Simple context copied',
        fullContext: 'Full context copied',
        selector: 'Selector copied',
        cssLayout: 'CSS/layout summary copied'
      }
    }
  }
})()
