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
          description: 'Visual review foundation. Annotations coming next.'
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
      details: 'Details',
      toggleLayoutPilot: 'Activate/deactivate',
      reviewPanel: 'Review panel',
      copyReport: 'Copy report',
      reportSoon: 'Report coming soon',
      downloadImage: 'Download image',
      copyImage: 'Copy image',
      removeAnnotation: 'Remove annotation'
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
        kicker: 'Review Mode',
        title: 'Visual review',
        count: '{count} annotations',
        close: 'Close review panel',
        collapse: 'Collapse panel',
        expand: 'Expand panel',
        clearReview: 'Clear review',
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
        copyImage: 'Copy image',
        downloadSnapshot: 'Download image',
        generatePdf: 'Generate PDF'
      },
      printReport: {
        imageUnavailable: 'Image unavailable: annotation is outside the captured viewport',
        printButton: 'Print / Save PDF'
      },
      toolbar: {
        review: 'LayoutPilot',
        tools: 'Tools',
        actions: 'Actions',
        drag: 'Drag toolbar',
        collapse: 'Collapse toolbar',
        expand: 'Expand toolbar',
        move: 'Move',
        element: 'Element',
        area: 'Area',
        pen: 'Pen',
        copyImage: 'Copy image',
        downloadImage: 'Download image',
        generatePdf: 'Generate PDF'
      },
      clearConfirm: {
        title: 'Clear review?',
        description: 'This will remove all annotations and visual markings from this review.',
        cancel: 'Cancel',
        confirm: 'Clear review'
      }
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
        review: 'Review Mode: click an element to create an annotation.'
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
      reviewOn: 'Review mode on',
      reviewSoon: 'Review mode coming soon',
      annotationCreated: 'Annotation {id} created',
      annotationSaved: 'Annotation {id} saved',
      annotationRemoved: 'Annotation {id} removed',
      draftSelected: 'Draft selected',
      draftCanceled: 'Draft canceled',
      draftHasNote: 'Draft has text. Save or cancel before selecting another element.',
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
      reviewAreaToolReady: 'Area tool prepared',
      reviewPenToolReady: 'Pen tool prepared',
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
