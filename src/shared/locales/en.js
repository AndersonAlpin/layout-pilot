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
      reviewSoon: 'Review mode coming soon',
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
