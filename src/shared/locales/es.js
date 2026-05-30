(() => {
  const root = window.LayoutPilotModules ||= {}
  const locales = root.locales ||= {}

  locales.es = {
    app: {
      name: 'LayoutPilot',
      tagline: 'Inspección y revisión visual'
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
          description: 'Crea anotaciones visuales, marca áreas y exporta la revisión.'
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
      downloadImage: 'Descargar imagen',
      copyImage: 'Copiar imagen',
      generatePdf: 'Generar PDF',
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
        kicker: 'Anotaciones',
        title: 'Revisión visual',
        count: '{count} anotaciones',
        close: 'Cerrar panel de revisión',
        collapse: 'Contraer panel',
        expand: 'Expandir panel',
        clearReview: 'Limpiar anotaciones',
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
        freeMarksTitle: 'Marcas libres',
        freeMarksCount: '{count} marcas libres',
        freeMarkArea: 'Área',
        freeMarkPen: 'Lápiz',
        freeMarkIndex: 'Marca {index}',
        focusFreeMark: 'Enfocar marca',
        addAnnotation: 'Añadir anotación',
        removeFreeMark: 'Eliminar marca',
        copyImage: 'Copiar imagen',
        downloadSnapshot: 'Descargar imagen',
        generatePdf: 'Generar PDF'
      },
      snapshot: {
        commentsTitle: 'Anotaciones'
      },
      printReport: {
        imageUnavailable: 'Imagen no disponible: la anotación está fuera de la viewport capturada',
        areaMarksTitle: 'Marcas sin anotación',
        printButton: 'Imprimir / Guardar PDF'
      },
      areaMark: {
        comment: 'Añadir anotación',
        remove: 'Eliminar marca'
      },
      toolbar: {
        review: 'LayoutPilot',
        tools: 'Herramientas',
        actions: 'Acciones',
        drag: 'Arrastrar toolbar',
        collapse: 'Contraer toolbar',
        expand: 'Expandir toolbar',
        pin: 'Fijar toolbar',
        unpin: 'Desfijar toolbar',
        move: 'Visualizar',
        element: 'Elemento',
        area: 'Área',
        pen: 'Lápiz',
        copyImage: 'Copiar imagen',
        downloadImage: 'Descargar imagen',
        generatePdf: 'Generar PDF'
      },
      clearConfirm: {
        title: '¿Limpiar anotaciones?',
        description: 'Esto eliminará las anotaciones de esta revisión.',
        cancel: 'Cancelar',
        confirm: 'Limpiar anotaciones'
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
      help: 'D detalles - C contexto simple - H atajos - Q salir',
      alignment: {
        label: 'Alineación',
        aligned: 'Alineados',
        above: '{offset}px arriba',
        below: '{offset}px abajo',
        left: '{offset}px a la izquierda',
        right: '{offset}px a la derecha',
        misaligned: 'Desalineados'
      }
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
      draftHasNote: 'El borrador tiene texto. Guarda o cancela antes de seleccionar otro ítem.',
      editHasChanges: 'Esta anotación tiene cambios sin guardar. Guarda o cancela antes de editar otro elemento.',
      reviewReportSoon: 'El informe de revisión entra en la próxima etapa',
      snapshotCaptureFailed: 'No se pudo capturar la pantalla',
      snapshotDownloaded: 'Imagen descargada',
      snapshotDownloadFailed: 'No fue posible descargar la imagen',
      snapshotCopied: 'Imagen copiada',
      snapshotCopyFailed: 'No fue posible copiar la imagen',
      printReportGenerating: 'Generando PDF...',
      printReportNoAnnotations: 'No hay anotaciones para generar PDF',
      printReportFailed: 'No fue posible generar PDF',
      reviewAreaToolReady: 'Arrastra para seleccionar un área',
      reviewPenToolReady: 'Arrastra para dibujar',
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
