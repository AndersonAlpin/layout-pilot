(() => {
  const root = window.LayoutPilotModules ||= {}
  const locales = root.locales ||= {}

  locales['pt-BR'] = {
    app: {
      name: 'LayoutPilot',
      tagline: 'Inspeção e revisão visual'
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
        injectionFailed: 'Não foi possível iniciar o LayoutPilot nesta página.',
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
          description: 'Crie anotações visuais, marque áreas e exporte a revisão.'
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
      cancel: 'Cancelar',
      context: 'Contexto simples',
      pin: 'Fixar',
      details: 'Detalhes',
      toggleLayoutPilot: 'Ativar/desativar',
      reviewPanel: 'Painel de revisão',
      downloadImage: 'Baixar imagem',
      copyImage: 'Copiar imagem',
      generatePdf: 'Gerar PDF',
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
        kicker: 'Anotações',
        title: 'Revisão visual',
        count: '{count} anotações',
        close: 'Fechar painel de revisão',
        collapse: 'Recolher painel',
        expand: 'Expandir painel',
        clearReview: 'Limpar revisão',
        clearReviewEmpty: 'Nenhuma anotação para remover',
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
        freeMarksTitle: 'Marcações livres',
        freeMarksCount: '{count} marcações livres',
        freeMarkArea: 'Área',
        freeMarkPen: 'Caneta',
        freeMarkIndex: 'Marcação {index}',
        focusFreeMark: 'Focar marcação',
        addAnnotation: 'Adicionar anotação',
        removeFreeMark: 'Remover marcação',
        copyImage: 'Copiar imagem',
        downloadSnapshot: 'Baixar imagem',
        generatePdf: 'Gerar PDF'
      },
      colors: {
        settings: 'Configurar cores',
        title: 'Cores das marcações',
        modeAuto: 'Automático',
        modeDefault: 'Cor padrão',
        automaticToggle: 'Cores automáticas',
        confirm: 'Confirmar',
        noChanges: 'Nenhuma alteração realizada',
        autoConfirmTitle: 'Ativar cores automáticas?',
        autoConfirmDescription: 'As cores individuais serão removidas e as marcações atuais voltarão a receber cores automaticamente.',
        defaultConfirmTitle: 'Aplicar cor padrão?',
        defaultConfirmDescription: 'A cor escolhida será aplicada nas marcações atuais e usada nas próximas marcações.',
        applyAll: 'Aplicar a todas',
        applyAllConfirmTitle: 'Aplicar cor a todas as marcações?',
        applyAllConfirmDescription: 'Isso substitui as cores individuais e não pode ser desfeito.',
        applyAllConfirm: 'Aplicar cor',
        custom: 'Personalizada',
        hex: 'HEX',
        invalidColor: 'Cor inválida',
        swatch: 'Cor da marcação',
        defaultColor: 'Cor padrão',
        palette: 'Paleta',
        recent: 'Recentes',
        recentColor: 'Cor recente'
      },
      snapshot: {
        commentsTitle: 'Anotações'
      },
      printReport: {
        imageUnavailable: 'Imagem indisponível: anotação fora da viewport capturada',
        areaMarksTitle: 'Marcações sem anotação',
        printButton: 'Imprimir / Salvar PDF'
      },
      areaMark: {
        comment: 'Adicionar anotação',
        remove: 'Remover marcação'
      },
      toolbar: {
        review: 'LayoutPilot',
        tools: 'Ferramentas',
        actions: 'Ações',
        drag: 'Arrastar toolbar',
        collapse: 'Recolher toolbar',
        expand: 'Expandir toolbar',
        pin: 'Fixar toolbar',
        unpin: 'Desafixar toolbar',
        move: 'Visualizar',
        element: 'Elemento',
        area: 'Área',
        pen: 'Caneta',
        export: 'Exportar',
        copyImage: 'Copiar imagem',
        downloadImage: 'Baixar imagem',
        generatePdf: 'Gerar PDF'
      },
      clearConfirm: {
        title: 'Remover tudo da revisão?',
        description: 'Isso removerá todos os comentários, marcações de área e desenhos feitos nesta revisão.',
        cancel: 'Cancelar',
        confirm: 'Remover tudo'
      }
    },
    help: {
      title: 'LayoutPilot atalhos',
      close: 'Fechar ajuda',
      shortcuts: {
        inspect: 'Ativar/desativar inspeção',
        help: 'Mostrar/ocultar atalhos',
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
      help: 'D detalhes - C contexto simples - H atalhos - Esc cancelar',
      alignment: {
        label: 'Alinhamento',
        aligned: 'Alinhados',
        above: '{offset}px acima',
        below: '{offset}px abaixo',
        left: '{offset}px à esquerda',
        right: '{offset}px à direita',
        misaligned: 'Desalinhados'
      }
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
      annotationCreated: 'Anotação {id} criada',
      annotationSaved: 'Anotação {id} salva',
      annotationRemoved: 'Anotação {id} removida',
      draftSelected: 'Rascunho selecionado',
      draftCanceled: 'Rascunho cancelado',
      draftHasNote: 'O rascunho tem texto. Salve ou cancele antes de selecionar outro item.',
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
      reviewAreaToolReady: 'Arraste para selecionar uma área',
      reviewPenToolReady: 'Arraste para desenhar',
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
