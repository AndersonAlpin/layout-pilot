(() => {
  const root = window.LayoutPilotModules ||= {}
  const locales = root.locales ||= {}

  locales.es = {
    app: {
      name: 'LayoutPilot',
      tagline: 'Inspección y revisión visual para frontend'
    },
    common: {
      activate: 'Activar',
      deactivate: 'Desactivar',
      close: 'Cerrar',
      cancel: 'Cancelar',
      copy: 'Copiar',
      copied: 'Copiado',
      enabled: 'Activo',
      disabled: 'Desactivado'
    },
    language: {
      title: 'Idioma',
      label: 'Idioma de la interfaz',
      auto: 'Auto',
      portuguese: 'Português',
      english: 'English',
      spanish: 'Español'
    },
    popup: {
      status: {
        checking: 'Comprobando pestaña actual...',
        unsupported: 'Abre una página http/https para inspeccionar.',
        active: 'Modo Inspección activo.',
        inspectActive: 'Modo Inspección activo.',
        reviewActive: 'Modo Revisión activo.',
        inactive: 'LayoutPilot desactivado.'
      },
      mode: {
        title: 'Modo',
        inspect: {
          name: 'Modo Inspección',
          description: 'Hover, pin, detalles y contexto simple.'
        },
        review: {
          name: 'Modo Revisión',
          description: 'Base de revisión visual. Las anotaciones vienen después.'
        }
      },
      shortcuts: {
        title: 'Atajos',
        note: 'I funciona después de activar esta pestaña desde el popup.'
      }
    },
    shortcuts: {
      inspect: 'Inspección',
      help: 'Atajos',
      quit: 'Desactivar',
      cancel: 'Cancelar',
      context: 'Contexto simple',
      pin: 'Fijar',
      details: 'Detalles',
      toggleLayoutPilot: 'Activar/desactivar',
      reviewPanel: 'Panel de revisión',
      copyReport: 'Copiar informe',
      reportSoon: 'Informe próximamente',
      downloadImage: 'Descargar imagen',
      copyImage: 'Copiar imagen',
      removeAnnotation: 'Eliminar anotación'
    },
    detail: {
      kicker: 'Modo Inspección',
      close: 'Cerrar detalles',
      actions: {
        simpleContext: 'Contexto simple',
        fullContext: 'Contexto completo'
      },
      simpleContextPreview: 'Contexto simple'
    },
    review: {
      panel: {
        kicker: 'Modo Revisión',
        title: 'Revisión visual',
        count: '{count} anotaciones',
        close: 'Cerrar panel de revisión',
        collapse: 'Contraer panel',
        expand: 'Expandir panel',
        clearReview: 'Limpiar revisión',
        emptyTitle: 'Aún no hay anotaciones',
        emptyDescription: 'Haz clic en un elemento de la página para seleccionarlo para anotación.',
        draft: 'Borrador',
        observation: 'Observación',
        notePlaceholder: 'Describe lo que parece incorrecto aquí',
        draftPlaceholder: 'Escribe una observación para guardar esta anotación',
        noNote: 'Sin observación',
        focusAnnotation: 'Enfocar anotación',
        highlightAnnotation: 'Destacar anotación',
        edit: 'Editar',
        save: 'Guardar',
        saveAnnotation: 'Guardar anotación',
        cancel: 'Cancelar',
        remove: 'Eliminar',
        copyImage: 'Copiar imagen',
        downloadSnapshot: 'Descargar imagen'
      },
      clearConfirm: {
        title: '¿Limpiar revisión?',
        description: 'Esto eliminará todas las anotaciones y marcas visuales de esta revisión.',
        cancel: 'Cancelar',
        confirm: 'Limpiar revisión'
      }
    },
    help: {
      title: 'Atajos de LayoutPilot',
      close: 'Cerrar ayuda',
      shortcuts: {
        inspect: 'Activar/desactivar inspección',
        help: 'Mostrar/ocultar atajos',
        quit: 'Desactivar LayoutPilot',
        cancel: 'Cancelar acción actual',
        context: 'Copiar contexto simple',
        details: 'Abrir/cerrar detalles',
        pin: 'Fijar/desfijar elemento'
      },
      note: {
        inspect: 'I funciona después de activar esta pestaña desde el popup.',
        review: 'Modo Revisión: haz clic en un elemento para crear una anotación.'
      }
    },
    tooltip: {
      clickToPin: 'Clic para fijar.',
      clickToUnpin: 'Clic otra vez para desfijar.',
      help: 'D detalles - C contexto simple - H atajos - Q salir'
    },
    context: {
      issue: {
        title: 'Problema',
        placeholder: '[Describe lo que parece incorrecto aquí]'
      },
      request: {
        title: 'Solicitud',
        compact: 'Sugiere el ajuste de CSS/layout más probable. Mantén el estilo visual existente salvo que sea necesario.',
        full: 'Usa este contexto para sugerir ajustes precisos de frontend/CSS. Mantén el estilo visual existente salvo que el problema requiera cambiarlo.'
      }
    },
    toast: {
      noElement: 'Ningún elemento seleccionado',
      inspectOn: 'Modo inspección activo',
      reviewOn: 'Modo revisión activo',
      reviewSoon: 'Modo revisión próximamente',
      annotationCreated: 'Anotación {id} creada',
      annotationSaved: 'Anotación {id} guardada',
      annotationRemoved: 'Anotación {id} eliminada',
      draftSelected: 'Borrador seleccionado',
      draftCanceled: 'Borrador cancelado',
      draftHasNote: 'El borrador tiene texto. Guarda o cancela antes de seleccionar otro elemento.',
      editHasChanges: 'Esta anotación tiene cambios sin guardar. Guarda o cancela antes de editar otro elemento.',
      reviewReportSoon: 'El informe de revisión entra en la próxima etapa',
      snapshotCaptureFailed: 'No se pudo capturar la pantalla',
      snapshotDownloaded: 'Imagen descargada',
      snapshotDownloadFailed: 'No fue posible descargar la imagen',
      snapshotCopied: 'Imagen copiada',
      snapshotCopyFailed: 'No fue posible copiar la imagen',
      elementPinned: 'Elemento fijado',
      elementUnpinned: 'Elemento desfijado',
      copyFailed: 'No se pudo copiar',
      copied: {
        simpleContext: 'Contexto simple copiado',
        fullContext: 'Contexto completo copiado',
        selector: 'Selector copiado',
        cssLayout: 'Resumen CSS/layout copiado'
      }
    }
  }
})()
