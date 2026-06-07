(() => {
  const root = window.LayoutPilotModules ||= {}

  const RELEASE_NOTES = [
    {
      version: '1.1.0',
      showInApp: true,
      chromeWebStoreShortNotes: {
        'pt-BR': {
          highlight: 'Visualização responsiva chegou',
          description: 'Teste páginas em diferentes tamanhos de tela sem redimensionar a janela.',
          bullets: [
            'Use presets, tamanhos personalizados e zoom.',
            'Capture o preview como PNG.',
            'Arraste previews grandes no zoom manual.'
          ],
          extra: 'Também melhoramos o popup e a detecção de alinhamento no inspector.'
        },
        en: {
          highlight: 'Responsive Preview is here',
          description: 'Test pages across different screen sizes without resizing the browser window.',
          bullets: [
            'Use presets, custom sizes, and zoom.',
            'Capture the preview as a PNG.',
            'Pan large previews in manual zoom.'
          ],
          extra: 'We also improved the popup and inspector alignment detection.'
        },
        es: {
          highlight: 'La vista responsiva llegó',
          description: 'Prueba páginas en diferentes tamaños de pantalla sin redimensionar la ventana.',
          bullets: [
            'Usa presets, tamaños personalizados y zoom.',
            'Captura la vista previa como PNG.',
            'Mueve vistas grandes en zoom manual.'
          ],
          extra: 'También mejoramos el popup y la detección de alineación en el inspector.'
        }
      }
    }
  ]

  function getReleaseNote(version) {
    return RELEASE_NOTES.find(note => note.version === version && note.showInApp) || null
  }

  root.releaseNotes = {
    RELEASE_NOTES,
    getReleaseNote
  }
})()
