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
        inspectActive: 'Modo Inspeção ativo.',
        reviewActive: 'Modo Revisão ativo.',
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
          description: 'Base de revisão visual. Anotações vêm a seguir.'
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
      details: 'Detalhes',
      toggleLayoutPilot: 'Ativar/desativar',
      reviewPanel: 'Painel de revisão',
      copyReport: 'Copiar relatório',
      reportSoon: 'Relatório em breve',
      downloadImage: 'Baixar imagem',
      copyImage: 'Copiar imagem',
      removeAnnotation: 'Remover anotação'
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
    review: {
      panel: {
        kicker: 'Modo Revisão',
        title: 'Revisão visual',
        count: '{count} anotações',
        close: 'Fechar painel de revisão',
        collapse: 'Recolher painel',
        expand: 'Expandir painel',
        clearReview: 'Limpar revisão',
        emptyTitle: 'Nenhuma anotação ainda',
        emptyDescription: 'Clique em um elemento da página para selecioná-lo para anotação.',
        draft: 'Rascunho',
        observation: 'Observação',
        notePlaceholder: 'Descreva o que parece errado aqui',
        draftPlaceholder: 'Escreva uma observação para salvar esta anotação',
        noNote: 'Sem observação',
        focusAnnotation: 'Focar anotação',
        highlightAnnotation: 'Destacar anotação',
        edit: 'Editar',
        save: 'Salvar',
        saveAnnotation: 'Salvar anotação',
        cancel: 'Cancelar',
        remove: 'Remover',
        copyImage: 'Copiar imagem',
        downloadSnapshot: 'Baixar imagem',
        generatePdf: 'Gerar PDF'
      },
      printReport: {
        imageUnavailable: 'Imagem indisponível: anotação fora da viewport capturada',
        printButton: 'Imprimir / Salvar PDF'
      },
      toolbar: {
        review: 'LayoutPilot',
        tools: 'Ferramentas',
        actions: 'Ações',
        drag: 'Arrastar toolbar',
        collapse: 'Recolher toolbar',
        expand: 'Expandir toolbar',
        move: 'Mover',
        element: 'Elemento',
        area: 'Área',
        pen: 'Caneta',
        copyImage: 'Copiar imagem',
        downloadImage: 'Baixar imagem',
        generatePdf: 'Gerar PDF'
      },
      clearConfirm: {
        title: 'Limpar revisão?',
        description: 'Isso removerá todas as anotações e marcações visuais desta revisão.',
        cancel: 'Cancelar',
        confirm: 'Limpar revisão'
      }
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
        review: 'Modo Revisão: clique em um elemento para criar uma anotação.'
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
      reviewOn: 'Modo revisão ativo',
      reviewSoon: 'Modo revisão em breve',
      annotationCreated: 'Anotação {id} criada',
      annotationSaved: 'Anotação {id} salva',
      annotationRemoved: 'Anotação {id} removida',
      draftSelected: 'Rascunho selecionado',
      draftCanceled: 'Rascunho cancelado',
      draftHasNote: 'O rascunho tem texto. Salve ou cancele antes de selecionar outro elemento.',
      editHasChanges: 'Esta anotação tem alterações não salvas. Salve ou cancele antes de editar outro item.',
      reviewReportSoon: 'Relatório de revisão entra na próxima etapa',
      snapshotCaptureFailed: 'Não foi possível capturar a tela',
      snapshotDownloaded: 'Imagem baixada',
      snapshotDownloadFailed: 'Não foi possível baixar a imagem',
      snapshotCopied: 'Imagem copiada',
      snapshotCopyFailed: 'Não foi possível copiar a imagem',
      printReportGenerating: 'Gerando PDF...',
      printReportNoAnnotations: 'Nenhuma anotação para gerar PDF',
      printReportFailed: 'Não foi possível gerar PDF',
      reviewAreaToolReady: 'Ferramenta de área preparada',
      reviewPenToolReady: 'Ferramenta caneta preparada',
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
