(() => {
  const root = window.LayoutPilotModules ||= {}
  const { escapeHtml } = root.dom
  const { ensureAnnotationColors, getAnnotationColor, getAnnotationViewportRect } = root.reviewMarkers
  const { requestVisibleTabCapture } = root.reviewSnapshot

  const REPORT_HIDDEN_SELECTORS = [
    '.layoutpilot-review-panel',
    '.layoutpilot-review-toolbar',
    '.layoutpilot-review-confirm',
    '.layoutpilot-review-hover',
    '.layoutpilot-review-selection-box',
    '.layoutpilot-review-area-mark-tools',
    '.layoutpilot-review-pen-tools',
    '.layoutpilot-review-draft-box',
    '.layoutpilot-review-annotation-layer',
    '.layoutpilot-review-marker-layer',
    '.layoutpilot-toast'
  ]
  const REPORT_HIDDEN_SELECTOR = REPORT_HIDDEN_SELECTORS.join(', ')
  const REPORT_HIDDEN_WITH_AREA_MARKS_SELECTOR = [
    ...REPORT_HIDDEN_SELECTORS,
    '.layoutpilot-review-area-mark-layer',
    '.layoutpilot-review-pen-layer'
  ].join(', ')
  const MAX_REPORT_IMAGE_WIDTH = 1800

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value))
  }

  function serializeError(error) {
    return {
      message: error?.message || String(error || 'Unknown print report error')
    }
  }

  function hideReportUiForCapture({ hideAreaMarks = true } = {}) {
    const selector = hideAreaMarks ? REPORT_HIDDEN_WITH_AREA_MARKS_SELECTOR : REPORT_HIDDEN_SELECTOR
    return Array.from(document.querySelectorAll(selector)).map(element => {
      const previousVisibility = element.style.visibility
      element.style.visibility = 'hidden'
      return { element, previousVisibility }
    })
  }

  function restoreReportUi(records = []) {
    for (const record of records) {
      if (!record?.element?.isConnected) continue
      record.element.style.visibility = record.previousVisibility
    }
  }

  function loadImage(dataUrl) {
    return new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('Could not load captured image.'))
      image.src = dataUrl
    })
  }

  function isRectInViewport(rect) {
    if (!rect || rect.width <= 0 || rect.height <= 0) return false

    return rect.x < window.innerWidth &&
      rect.y < window.innerHeight &&
      rect.x + rect.width > 0 &&
      rect.y + rect.height > 0
  }

  function getAnnotationComment(annotation, t) {
    return annotation?.note?.trim() || t('review.panel.noNote')
  }

  function drawAnnotationHighlight(ctx, options) {
    const { annotation, rect, scaleX, scaleY, outputScale } = options
    const color = getAnnotationColor(annotation)
    const highlightX = rect.x * scaleX * outputScale
    const highlightY = rect.y * scaleY * outputScale
    const highlightWidth = rect.width * scaleX * outputScale
    const highlightHeight = rect.height * scaleY * outputScale

    ctx.save()
    ctx.strokeStyle = 'rgba(2, 6, 23, 0.78)'
    ctx.lineWidth = Math.max(1, Math.round(1 * outputScale))
    ctx.strokeRect(highlightX, highlightY, highlightWidth, highlightHeight)

    ctx.strokeStyle = color.color
    ctx.lineWidth = Math.max(3, Math.round(4 * outputScale))
    ctx.strokeRect(highlightX, highlightY, highlightWidth, highlightHeight)
    ctx.restore()
  }

  function createAnnotationViewportImage(captureImage, annotation, rect) {
    if (!isRectInViewport(rect)) return null

    const scaleX = captureImage.width / Math.max(1, window.innerWidth)
    const scaleY = captureImage.height / Math.max(1, window.innerHeight)
    const outputScale = Math.min(1, MAX_REPORT_IMAGE_WIDTH / captureImage.width)
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(captureImage.width * outputScale))
    canvas.height = Math.max(1, Math.round(captureImage.height * outputScale))

    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(captureImage, 0, 0, captureImage.width, captureImage.height, 0, 0, canvas.width, canvas.height)
    drawAnnotationHighlight(ctx, {
      annotation,
      rect,
      scaleX,
      scaleY,
      outputScale
    })

    return canvas.toDataURL('image/png')
  }

  function createViewportImage(captureImage) {
    const outputScale = Math.min(1, MAX_REPORT_IMAGE_WIDTH / captureImage.width)
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(captureImage.width * outputScale))
    canvas.height = Math.max(1, Math.round(captureImage.height * outputScale))

    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(captureImage, 0, 0, captureImage.width, captureImage.height, 0, 0, canvas.width, canvas.height)

    return canvas.toDataURL('image/png')
  }

  function buildReportSections(captureImage, state, t) {
    return state.annotations.map(annotation => {
      const rect = getAnnotationViewportRect(annotation)
      return {
        number: annotation.id,
        color: getAnnotationColor(annotation),
        comment: getAnnotationComment(annotation, t),
        imageDataUrl: createAnnotationViewportImage(captureImage, annotation, rect)
      }
    })
  }

  function buildPrintableHtml(sections, t) {
    const unavailableMessage = t('review.printReport.imageUnavailable')
    const printButton = t('review.printReport.printButton')

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>LayoutPilot Review</title>
  <style>
    :root {
      color: #111827;
      background: #ffffff;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      background: #ffffff;
      color: #111827;
    }

    main {
      width: min(920px, calc(100% - 48px));
      margin: 0 auto;
      padding: 36px 0 48px;
    }

    header {
      margin-bottom: 28px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e5e7eb;
    }

    h1 {
      margin: 0;
      color: #0f172a;
      font-size: 28px;
      line-height: 1.15;
      font-weight: 900;
      letter-spacing: 0;
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      margin: 0 0 20px;
    }

    .actions button {
      min-height: 36px;
      padding: 8px 13px;
      border: 1px solid #0ea5e9;
      border-radius: 7px;
      color: #075985;
      background: #e0f2fe;
      font: 800 13px/1.2 ui-sans-serif, system-ui, sans-serif;
      cursor: pointer;
    }

    .annotation {
      break-inside: avoid;
      page-break-inside: avoid;
      margin: 0 0 32px;
      padding: 0 0 28px;
      border-bottom: 1px solid #e5e7eb;
    }

    .annotation-heading {
      margin-bottom: 12px;
    }

    .comment {
      margin: 0;
      color: #1f2937;
      font-size: 15px;
      font-weight: 400;
      line-height: 1.55;
      overflow-wrap: anywhere;
      white-space: pre-wrap;
    }

    .comment strong {
      color: #0f172a;
      font-weight: 900;
    }

    .capture {
      display: block;
      max-width: 100%;
      height: auto;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      background: #ffffff;
    }

    .unavailable {
      padding: 14px 16px;
      border: 1px dashed #cbd5e1;
      border-radius: 8px;
      color: #64748b;
      background: #f8fafc;
      font-size: 13px;
      font-weight: 700;
    }

    @media print {
      main {
        width: 100%;
        padding: 0;
      }

      .actions {
        display: none;
      }

      .annotation {
        margin-bottom: 24px;
        padding-bottom: 24px;
      }

      .capture {
        border-color: #cbd5e1;
      }
    }
  </style>
</head>
<body>
  <main>
    <div class="actions">
      <button type="button" onclick="window.print()">${escapeHtml(printButton)}</button>
    </div>
    <header>
      <h1>LayoutPilot Review</h1>
    </header>
    ${sections.map(section => `
      <section class="annotation">
        <div class="annotation-heading">
          <p class="comment">${section.type === 'areaMarks'
            ? `<strong>${escapeHtml(section.title)}</strong>`
            : `<strong>${escapeHtml(section.number)}.</strong> ${escapeHtml(section.comment)}`}</p>
        </div>
        ${section.imageDataUrl
          ? `<img class="capture" src="${section.imageDataUrl}" alt="">`
          : `<div class="unavailable">${escapeHtml(unavailableMessage)}</div>`}
      </section>
    `).join('')}
  </main>
  <script>
    window.addEventListener('load', () => {
      window.setTimeout(() => window.print(), 350)
    })
  </script>
</body>
</html>`
  }

  function openPrintableReport(html) {
    const blob = new Blob([html], { type: 'text/html' })
    const objectUrl = URL.createObjectURL(blob)
    let opened = window.open(objectUrl, '_blank')

    if (!opened) {
      const link = document.createElement('a')
      link.href = objectUrl
      link.target = '_blank'
      link.rel = 'noopener'
      link.style.display = 'none'
      document.documentElement.append(link)
      link.click()
      link.remove()
      opened = true
    }

    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000)
  }

  async function generateReviewPrintReport(state, options = {}) {
    const {
      showToast,
      t = key => key
    } = options

    const hasFreeMarks = Boolean(state?.areaMarks?.length || state?.penStrokes?.length)

    if (!state?.annotations?.length && !hasFreeMarks) {
      showToast?.(t('toast.printReportNoAnnotations'))
      return { ok: false, error: { message: 'No annotations to generate PDF.' } }
    }

    ensureAnnotationColors(state.annotations)
    showToast?.(t('toast.printReportGenerating'))

    let hiddenRecords = []
    try {
      hiddenRecords = hideReportUiForCapture({ hideAreaMarks: true })
      const dataUrl = await requestVisibleTabCapture()
      const captureImage = await loadImage(dataUrl)
      const sections = buildReportSections(captureImage, state, t)
      restoreReportUi(hiddenRecords)
      hiddenRecords = []

      if (hasFreeMarks) {
        hiddenRecords = hideReportUiForCapture({ hideAreaMarks: false })
        const areaMarksDataUrl = await requestVisibleTabCapture()
        const areaMarksCaptureImage = await loadImage(areaMarksDataUrl)
        sections.push({
          type: 'areaMarks',
          title: t('review.printReport.areaMarksTitle'),
          imageDataUrl: createViewportImage(areaMarksCaptureImage)
        })
      }

      openPrintableReport(buildPrintableHtml(sections, t))
      return { ok: true, sections }
    } catch (error) {
      const serializedError = serializeError(error)
      showToast?.(t('toast.printReportFailed'))
      return { ok: false, error: serializedError }
    } finally {
      restoreReportUi(hiddenRecords)
    }
  }

  root.reviewPrintReport = {
    generateReviewPrintReport
  }
})()
