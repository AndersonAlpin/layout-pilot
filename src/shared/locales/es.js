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
          description: 'Próximamente: marcas e informe Markdown.'
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
      details: 'Detalles'
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
        review: 'Modo Revisión: próximamente.'
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
      reviewSoon: 'Modo revisión próximamente',
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
