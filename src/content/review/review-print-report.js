(() => {
  const root = window.LayoutPilotModules ||= {}
  const { MESSAGE_TYPE } = root.constants
  const { ensureAnnotationColors, getAnnotationColor, getAnnotationViewportRect } = root.reviewMarkers
  const { requestVisibleTabCapture } = root.reviewSnapshot

  const REPORT_HIDDEN_SELECTORS = [
    '.layoutpilot-review-panel',
    '.layoutpilot-review-toolbar',
    '.layoutpilot-review-confirm',
    '.layoutpilot-review-popover',
    '.layoutpilot-review-menu',
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

  function openPrintableReport(sections, t) {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
    const payload = {
      title: 'LayoutPilot Review',
      printButton: t('review.printReport.printButton'),
      unavailableMessage: t('review.printReport.imageUnavailable'),
      sections
    }

    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        type: MESSAGE_TYPE.STORE_REVIEW_REPORT,
        id,
        payload
      }, response => {
        const runtimeError = chrome.runtime.lastError
        if (runtimeError) {
          reject(new Error(runtimeError.message))
          return
        }

        if (!response?.ok) {
          reject(new Error(response?.error?.message || 'Unable to open review report.'))
          return
        }

        resolve(response)
      })
    })
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

      await openPrintableReport(sections, t)
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
