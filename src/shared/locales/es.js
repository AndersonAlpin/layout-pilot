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
        injectionFailed: 'No se pudo iniciar LayoutPilot en esta página.',
        active: 'Modo Inspección activo.',
        inspectActive: 'Modo Inspección activo.',
        reviewActive: 'Modo Revisión activo.',
        compareActive: 'Comparación Figma activa.',
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
        },
        compare: {
          name: 'Comparar Figma',
          description: 'Pega un frame de Figma y compáralo con la pantalla renderizada.'
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
      cancel: 'Cancelar',
      context: 'Contexto simple',
      pin: 'Fijar',
      details: 'Detalles',
      toggleLayoutPilot: 'Activar/desactivar',
      reviewPanel: 'Panel de revisión',
      downloadImage: 'Descargar imagen',
      copyImage: 'Copiar imagen',
      generatePdf: 'Generar PDF',
      removeAnnotation: 'Eliminar anotación',
      pasteFigma: 'Pegar frame de Figma',
      toggleOverlay: 'Mostrar/ocultar overlay',
      toggleSkeleton: 'Alternar esqueleto'
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
        clearReview: 'Limpiar revisión',
        clearReviewEmpty: 'No hay anotaciones para eliminar',
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
      colors: {
        settings: 'Configurar colores',
        title: 'Colores de las anotaciones',
        modeAuto: 'Automático',
        modeDefault: 'Color predeterminado',
        automaticToggle: 'Colores automáticos',
        confirm: 'Confirmar',
        noChanges: 'No se realizaron cambios',
        autoConfirmTitle: '¿Activar colores automáticos?',
        autoConfirmDescription: 'Los colores individuales se eliminarán y las anotaciones actuales volverán a recibir colores automáticos.',
        defaultConfirmTitle: '¿Aplicar color predeterminado?',
        defaultConfirmDescription: 'El color elegido se aplicará a las anotaciones actuales y se usará en las próximas anotaciones.',
        applyAll: 'Aplicar a todas',
        applyAllConfirmTitle: '¿Aplicar color a todas las anotaciones?',
        applyAllConfirmDescription: 'Esto sustituye los colores individuales y no se puede deshacer.',
        applyAllConfirm: 'Aplicar color',
        custom: 'Personalizado',
        hex: 'HEX',
        invalidColor: 'Color inválido',
        swatch: 'Color de la anotación',
        defaultColor: 'Color predeterminado',
        palette: 'Paleta',
        recent: 'Recientes',
        recentColor: 'Color reciente'
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
        export: 'Exportar',
        copyImage: 'Copiar imagen',
        downloadImage: 'Descargar imagen',
        generatePdf: 'Generar PDF'
      },
      clearConfirm: {
        title: '¿Eliminar todo de esta revisión?',
        description: 'Esto eliminará todos los comentarios, marcas de área y dibujos a mano alzada de esta revisión.',
        cancel: 'Cancelar',
        confirm: 'Eliminar todo'
      }
    },
    help: {
      title: 'Atajos de LayoutPilot',
      close: 'Cerrar ayuda',
      shortcuts: {
        inspect: 'Activar/desactivar inspección',
        help: 'Mostrar/ocultar atajos',
        cancel: 'Cancelar acción actual',
        context: 'Copiar contexto simple',
        details: 'Abrir/cerrar detalles',
        pin: 'Fijar/desfijar elemento'
      },
      note: {
        inspect: 'I funciona después de activar esta pestaña desde el popup.',
        review: 'Modo Revisión: haz clic en un elemento para crear una anotación.',
        compare: 'Comparar Figma: copia un frame como SVG en Figma y pégalo aquí con Ctrl+V.'
      }
    },
    tooltip: {
      clickToPin: 'Clic para fijar.',
      clickToUnpin: 'Clic otra vez para desfijar.',
      help: 'D detalles - C contexto simple - H atajos - Esc cancelar',
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
    },
    figma: {
      panel: {
        title: 'Comparar Figma',
        clear: 'Limpiar comparación'
      },
      summary: {
        hint: 'Pega un frame de Figma (Ctrl+V) o importa/arrastra un SVG exportado.',
        counts: '{total} elementos, {divergent} divergentes',
        png: 'PNG pegado. Usa el diff de píxeles para comparar.'
      },
      warning: {
        capped: 'El escaneo del DOM se detuvo en {limit} elementos; el resultado puede ser parcial.'
      },
      controls: {
        opacity: 'Opacidad',
        scale: 'Escala',
        overlay: 'Overlay',
        overlayHint: 'Mostrar/ocultar el overlay del diseño',
        moveOn: 'Mover: on',
        moveOff: 'Mover: off',
        moveHint: 'Arrastra el overlay para reposicionarlo',
        blendOn: 'Mezcla: diff',
        blendOff: 'Mezcla: normal',
        blendHint: 'Alternar modo de mezcla difference',
        skeletonOn: 'Esqueleto: on',
        skeletonOff: 'Esqueleto: off',
        skeletonHint: 'Mostrar solo contornos del diseño',
        nudge: 'Ajustar alineación',
        recompute: 'Recalcular',
        recomputeHint: 'Rehacer correspondencia y diff',
        pixel: 'Diff de píxeles',
        pixelClear: 'Limpiar diff de píxeles',
        pixelHint: 'Comparar píxeles con la pantalla capturada',
        importSvg: 'Importar SVG/PNG'
      },
      checks: {
        position: 'Posición',
        size: 'Tamaño',
        color: 'Color',
        fontSize: 'Tam. fuente'
      },
      list: {
        empty: 'No se encontraron divergencias.',
        waiting: 'Esperando un frame de Figma.'
      },
      issue: {
        position: 'posición difiere en {dx}px / {dy}px',
        size: 'tamaño difiere en {dw}px / {dh}px',
        color: 'color {design} vs {actual}',
        fontSize: 'tamaño de fuente {design} vs {actual}',
        missing: 'ausente en la página',
        extra: 'sobra en la página'
      },
      type: {
        rect: 'Rectángulo',
        image: 'Imagen',
        icon: 'Icono',
        extra: 'Elemento extra'
      },
      pixel: {
        result: 'Diff de píxeles: {percent}% diferente'
      },
      toast: {
        ready: 'Comparar Figma listo. Pega un frame (Ctrl+V).',
        noContent: 'No hay SVG ni imagen de Figma en el portapapeles.',
        parseFailed: 'No se pudo leer el frame de Figma.',
        diffReady: 'Comparación lista: {count} divergentes.',
        pngReady: 'Overlay PNG listo. Usa el diff de píxeles.',
        pixelRunning: 'Ejecutando diff de píxeles...',
        pixelFailed: 'No se pudo ejecutar el diff de píxeles.'
      }
    }
  }
})()
