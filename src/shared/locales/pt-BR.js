(() => {
  const root = window.LayoutPilotModules ||= {}
  const locales = root.locales ||= {}

  locales['pt-BR'] = {
    app: {
      name: 'LayoutPilot',
      tagline: 'Inspect e review visual para frontend'
    },
    common: {
      activate: 'Ativar',
      deactivate: 'Desativar',
      close: 'Fechar',
      cancel: 'Cancelar',
      copy: 'Copiar',
      copied: 'Copiado',
      enabled: 'Ativo',
      disabled: 'Desativado'
    },
    language: {
      title: 'Idioma',
      label: 'Idioma da interface',
      auto: 'Auto',
      portuguese: 'Português',
      english: 'English',
      spanish: 'Español'
    },
    popup: {
      status: {
        checking: 'Verificando aba atual...',
        unsupported: 'Abra uma página http/https para inspecionar.',
        active: 'Modo Inspeção ativo.',
        inactive: 'LayoutPilot desativado.'
      },
      mode: {
        title: 'Modo',
        inspect: {
          name: 'Modo Inspeção',
          description: 'Hover, pin, detalhes e contexto simples.'
        },
        review: {
          name: 'Modo Revisão',
          description: 'Em breve: marcações e relatório Markdown.'
        }
      },
      shortcuts: {
        title: 'Atalhos',
        note: 'I funciona depois de ativar nesta aba pelo popup.'
      }
    },
    shortcuts: {
      inspect: 'Inspeção',
      help: 'Atalhos',
      quit: 'Desativar',
      cancel: 'Cancelar',
      context: 'Contexto simples',
      pin: 'Fixar',
      details: 'Detalhes'
    },
    detail: {
      kicker: 'Modo Inspeção',
      close: 'Fechar detalhes',
      actions: {
        simpleContext: 'Contexto simples',
        fullContext: 'Contexto completo'
      },
      simpleContextPreview: 'Contexto simples'
    },
    help: {
      title: 'LayoutPilot atalhos',
      close: 'Fechar ajuda',
      shortcuts: {
        inspect: 'Ativar/desativar inspeção',
        help: 'Mostrar/ocultar atalhos',
        quit: 'Desativar LayoutPilot',
        cancel: 'Cancelar ação atual',
        context: 'Copiar contexto simples',
        details: 'Abrir/fechar detalhes',
        pin: 'Fixar/desfixar elemento'
      },
      note: {
        inspect: 'I funciona depois de ativar a extensão nesta aba pelo popup.',
        review: 'Modo Revisão: em breve.'
      }
    },
    tooltip: {
      clickToPin: 'Clique para fixar.',
      clickToUnpin: 'Clique de novo para desfixar.',
      help: 'D detalhes - C contexto simples - H atalhos - Q sair'
    },
    context: {
      issue: {
        title: 'Problema',
        placeholder: '[Descreva o que parece errado aqui]'
      },
      request: {
        title: 'Solicitação',
        compact: 'Sugira o ajuste de CSS/layout mais provável. Mantenha o estilo visual existente, a menos que seja necessário.',
        full: 'Use este contexto para sugerir ajustes precisos de frontend/CSS. Mantenha o estilo visual existente, a menos que o problema exija mudança.'
      }
    },
    toast: {
      noElement: 'Nenhum elemento selecionado',
      inspectOn: 'Modo inspeção ativo',
      reviewSoon: 'Modo revisão em breve',
      elementPinned: 'Elemento fixado',
      elementUnpinned: 'Elemento desfixado',
      copyFailed: 'Não foi possível copiar',
      copied: {
        simpleContext: 'Contexto simples copiado',
        fullContext: 'Contexto completo copiado',
        selector: 'Selector copiado',
        cssLayout: 'Resumo CSS/layout copiado'
      }
    }
  }
})()
