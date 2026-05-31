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
        compareActive: 'Figma Compare active.',
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
        },
        compare: {
          name: 'Figma Compare',
          description: 'Paste a Figma frame and compare it with the rendered screen.'
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
      removeAnnotation: 'Remove annotation',
      pasteFigma: 'Paste Figma frame',
      toggleOverlay: 'Show/hide overlay',
      toggleSkeleton: 'Toggle skeleton'
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
        review: 'Review Mode: click an element to create an annotation.',
        compare: 'Figma Compare: copy a frame as SVG in Figma and paste it here with Ctrl+V.'
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
    },
    figma: {
      panel: {
        title: 'Figma Compare',
        clear: 'Clear comparison'
      },
      summary: {
        hint: 'Paste a Figma frame (Ctrl+V) or import/drop an exported SVG.',
        counts: '{total} elements, {divergent} divergent',
        png: 'PNG pasted. Use pixel diff to compare.'
      },
      warning: {
        capped: 'DOM scan stopped at {limit} elements; results may be partial.'
      },
      controls: {
        opacity: 'Opacity',
        scale: 'Scale',
        overlay: 'Overlay',
        overlayHint: 'Show/hide the design overlay',
        moveOn: 'Move: on',
        moveOff: 'Move: off',
        moveHint: 'Drag the overlay to reposition it',
        blendOn: 'Blend: diff',
        blendOff: 'Blend: normal',
        blendHint: 'Toggle difference blend mode',
        skeletonOn: 'Skeleton: on',
        skeletonOff: 'Skeleton: off',
        skeletonHint: 'Show only design outlines',
        nudge: 'Nudge alignment',
        recompute: 'Recompute',
        recomputeHint: 'Re-run matching and diff',
        pixel: 'Pixel diff',
        pixelClear: 'Clear pixel diff',
        pixelHint: 'Compare pixels against the captured screen',
        importSvg: 'Import SVG/PNG'
      },
      checks: {
        position: 'Position',
        size: 'Size',
        color: 'Color',
        fontSize: 'Font size'
      },
      list: {
        empty: 'No divergences found.',
        waiting: 'Waiting for a Figma frame.'
      },
      issue: {
        position: 'position off by {dx}px / {dy}px',
        size: 'size off by {dw}px / {dh}px',
        color: 'color {design} vs {actual}',
        fontSize: 'font-size {design} vs {actual}',
        missing: 'missing on the page',
        extra: 'extra on the page'
      },
      type: {
        rect: 'Rectangle',
        image: 'Image',
        icon: 'Icon',
        extra: 'Extra element'
      },
      pixel: {
        result: 'Pixel diff: {percent}% different'
      },
      toast: {
        ready: 'Figma Compare ready. Paste a frame (Ctrl+V).',
        noContent: 'No Figma SVG or image found in the clipboard.',
        parseFailed: 'Could not read the Figma frame.',
        diffReady: 'Comparison ready: {count} divergent.',
        pngReady: 'PNG overlay ready. Use pixel diff.',
        pixelRunning: 'Running pixel diff...',
        pixelFailed: 'Could not run pixel diff.'
      }
    }
  }
})()
