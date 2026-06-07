(() => {
  const root = window.LayoutPilotModules ||= {}
  const locales = root.locales ||= {}

  locales.en = {
    app: {
      name: 'LayoutPilot',
      tagline: 'Visual inspection and review'
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
        injectionFailed: 'Could not start LayoutPilot on this page.',
        active: 'Inspect Mode active.',
        inspectActive: 'Inspect Mode active.',
        reviewActive: 'Review Mode active.',
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
          description: 'Create visual annotations, mark areas and export the review.'
        }
      },
      shortcuts: {
        title: 'Shortcuts',
        note: 'I works after activating this tab from the popup.'
      },
      breakpoint: {
        description: 'View the page at device sizes without shrinking the browser window.',
        current: 'Current',
        activate: 'Enable preview',
        deactivate: 'Disable preview'
      }
    },
    shortcuts: {
      inspect: 'Inspect',
      help: 'Shortcuts',
      cancel: 'Cancel',
      context: 'Simple context',
      pin: 'Pin',
      details: 'Details',
      toggleLayoutPilot: 'Activate/deactivate',
      reviewPanel: 'Review panel',
      downloadImage: 'Download image',
      copyImage: 'Copy image',
      generatePdf: 'Generate PDF',
      removeAnnotation: 'Remove annotation',
      breakpointPanel: 'Responsive panel',
      breakpointToggle: 'Responsive view'
    },
    breakpoint: {
      title: 'Responsive view',
      frameTitle: 'Responsive view',
      statusActive: 'Responsive view active.',
      statusInspectActive: 'Responsive view + Inspect active.',
      interaction: {
        label: 'Mode',
        navigate: 'Browse',
        inspect: 'Inspect'
      },
      reviewUnavailable: 'Review is not available in Responsive view yet.',
      fields: {
        preset: 'Device',
        width: 'Width',
        height: 'Height',
        zoom: 'Zoom'
      },
      presetGroups: {
        essential: 'Essentials',
        applePhones: 'Apple phones',
        androidPhones: 'Android phones',
        tablets: 'Tablets',
        computers: 'Computers',
        custom: 'Custom'
      },
      presets: {
        custom: 'Custom'
      },
      zoom: {
        fit: 'Fit'
      },
      actions: {
        close: 'Exit',
        center: 'Center preview',
        move: 'Move view',
        collapse: 'Collapse panel',
        expand: 'Expand panel',
        rotate: 'Toggle orientation'
      },
      blocked: {
        title: 'Preview blocked',
        description: 'This page blocks iframe loading (X-Frame-Options or CSP). Open it in a tab and use the DevTools responsive mode to test this viewport.'
      },
      toast: {
        enabled: 'Responsive view on',
        disabled: 'Responsive view off'
      }
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
    review: {
      panel: {
        kicker: 'Annotations',
        title: 'Visual review',
        count: '{count} annotations',
        close: 'Close review panel',
        collapse: 'Collapse panel',
        expand: 'Expand panel',
        clearReview: 'Clear review',
        clearReviewEmpty: 'No annotations to remove',
        emptyTitle: 'No annotations yet',
        emptyDescription: 'Click an element on the page to select it for annotation.',
        draft: 'Draft',
        observation: 'Observation',
        notePlaceholder: 'Describe what looks wrong here',
        draftPlaceholder: 'Write an observation to save this annotation',
        noNote: 'No observation',
        focusAnnotation: 'Focus annotation',
        highlightAnnotation: 'Highlight annotation',
        edit: 'Edit',
        save: 'Save',
        saveAnnotation: 'Save annotation',
        cancel: 'Cancel',
        remove: 'Remove',
        freeMarksTitle: 'Free marks',
        freeMarksCount: '{count} free marks',
        freeMarkArea: 'Area',
        freeMarkPen: 'Pen',
        freeMarkIndex: 'Mark {index}',
        focusFreeMark: 'Focus mark',
        addAnnotation: 'Add annotation',
        removeFreeMark: 'Remove mark',
        copyImage: 'Copy image',
        downloadSnapshot: 'Download image',
        generatePdf: 'Generate PDF'
      },
      colors: {
        settings: 'Configure colors',
        title: 'Annotation colors',
        modeAuto: 'Automatic',
        modeDefault: 'Default color',
        automaticToggle: 'Automatic colors',
        confirm: 'Confirm',
        noChanges: 'No changes made',
        autoConfirmTitle: 'Enable automatic colors?',
        autoConfirmDescription: 'Individual colors will be removed and current annotations will receive automatic colors again.',
        defaultConfirmTitle: 'Apply default color?',
        defaultConfirmDescription: 'The selected color will be applied to current annotations and used for new annotations.',
        applyAll: 'Apply to all',
        applyAllConfirmTitle: 'Apply color to all annotations?',
        applyAllConfirmDescription: 'This replaces individual colors and cannot be undone.',
        applyAllConfirm: 'Apply color',
        custom: 'Custom',
        hex: 'HEX',
        invalidColor: 'Invalid color',
        swatch: 'Annotation color',
        defaultColor: 'Default color',
        palette: 'Palette',
        recent: 'Recent',
        recentColor: 'Recent color'
      },
      snapshot: {
        commentsTitle: 'Annotations'
      },
      printReport: {
        imageUnavailable: 'Image unavailable: annotation is outside the captured viewport',
        areaMarksTitle: 'Marks without annotations',
        printButton: 'Print / Save PDF'
      },
      areaMark: {
        comment: 'Add annotation',
        remove: 'Remove mark'
      },
      toolbar: {
        review: 'LayoutPilot',
        tools: 'Tools',
        actions: 'Actions',
        drag: 'Drag toolbar',
        collapse: 'Collapse toolbar',
        expand: 'Expand toolbar',
        pin: 'Pin toolbar',
        unpin: 'Unpin toolbar',
        move: 'View',
        element: 'Element',
        area: 'Area',
        pen: 'Pen',
        export: 'Export',
        copyImage: 'Copy image',
        downloadImage: 'Download image',
        generatePdf: 'Generate PDF'
      },
      clearConfirm: {
        title: 'Remove everything from this review?',
        description: 'This will remove every comment, area mark, and freehand drawing from this review.',
        cancel: 'Cancel',
        confirm: 'Remove everything'
      }
    },
    help: {
      title: 'LayoutPilot shortcuts',
      close: 'Close help',
      shortcuts: {
        inspect: 'Activate/deactivate inspect',
        help: 'Show/hide shortcuts',
        cancel: 'Cancel current action',
        context: 'Copy simple context',
        details: 'Open/close details',
        pin: 'Pin/unpin element'
      },
      note: {
        inspect: 'I works after activating this tab from the popup.',
        review: 'Review Mode: click an element to create an annotation.'
      }
    },
    tooltip: {
      clickToPin: 'Click to pin.',
      clickToUnpin: 'Click again to unpin.',
      help: 'D details - C simple context - H help - Esc cancel',
      alignment: {
        label: 'Alignment',
        aligned: 'Aligned',
        above: '{offset}px above',
        below: '{offset}px below',
        left: '{offset}px left',
        right: '{offset}px right',
        misaligned: 'Misaligned'
      }
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
      reviewOn: 'Review mode on',
      annotationCreated: 'Annotation {id} created',
      annotationSaved: 'Annotation {id} saved',
      annotationRemoved: 'Annotation {id} removed',
      draftSelected: 'Draft selected',
      draftCanceled: 'Draft canceled',
      draftHasNote: 'Draft has text. Save or cancel before selecting another item.',
      editHasChanges: 'This annotation has unsaved changes. Save or cancel before editing another item.',
      reviewReportSoon: 'Review report comes in the next step',
      snapshotCaptureFailed: 'Could not capture the screen',
      snapshotDownloaded: 'Image downloaded',
      snapshotDownloadFailed: 'Could not download image',
      snapshotCopied: 'Image copied',
      snapshotCopyFailed: 'Could not copy image',
      printReportGenerating: 'Generating PDF...',
      printReportNoAnnotations: 'No annotations to generate PDF',
      printReportFailed: 'Could not generate PDF',
      reviewAreaToolReady: 'Drag to select an area',
      reviewPenToolReady: 'Drag to draw',
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
