(() => {
  const root = window.LayoutPilotModules ||= {}
  const { MESSAGE_TYPE } = root.constants
  const { ensureAnnotationColors, getAnnotationColor } = root.reviewMarkers

  const CAPTURE_HIDDEN_SELECTOR = [
    '.layoutpilot-review-panel',
    '.layoutpilot-review-toolbar',
    '.layoutpilot-review-workspace-frame',
    '.layoutpilot-review-confirm',
    '.layoutpilot-review-hover',
    '.layoutpilot-review-selection-box',
    '.layoutpilot-review-area-mark-tools',
    '.layoutpilot-review-pen-tools',
    '.layoutpilot-review-draft-box',
    '.layoutpilot-toast'
  ].join(', ')
  const MAX_CANVAS_HEIGHT = 30000

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value))
  }

  function serializeError(error) {
    return {
      message: error?.message || String(error || 'Unknown snapshot error')
    }
  }

  function hideTransientUiForCapture() {
    return Array.from(document.querySelectorAll(CAPTURE_HIDDEN_SELECTOR)).map(element => {
      const previousVisibility = element.style.visibility
      element.style.visibility = 'hidden'
      return { element, previousVisibility }
    })
  }

  function restoreTransientUi(records = []) {
    for (const record of records) {
      if (!record?.element?.isConnected) continue
      record.element.style.visibility = record.previousVisibility
    }
  }

  function getTimestampForFilename(date = new Date()) {
    const pad = value => String(value).padStart(2, '0')
    return [
      date.getFullYear(),
      pad(date.getMonth() + 1),
      pad(date.getDate())
    ].join('-') + '-' + [
      pad(date.getHours()),
      pad(date.getMinutes())
    ].join('-')
  }

  function loadImage(dataUrl) {
    return new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('Could not load captured image.'))
      image.src = dataUrl
    })
  }

  function canvasToPngBlob(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (!blob) {
          reject(new Error('Could not export snapshot canvas.'))
          return
        }
        resolve(blob)
      }, 'image/png')
    })
  }

  async function pngDataUrlToBlob(dataUrl) {
    const response = await fetch(dataUrl)
    const blob = await response.blob()
    if (blob.type !== 'image/png') {
      return new Blob([blob], { type: 'image/png' })
    }
    return blob
  }

  function downloadPngBlob(blob, filenamePrefix) {
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.className = 'layoutpilot-review-download-link'
    link.href = objectUrl
    link.download = `${filenamePrefix}-${getTimestampForFilename()}.png`
    link.style.display = 'none'
    document.documentElement.append(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
  }

  async function writePngBlobToClipboard(blob) {
    if (!navigator.clipboard?.write || typeof ClipboardItem !== 'function') {
      throw new Error('Image clipboard is not supported in this browser.')
    }

    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob })
    ])
  }

  function requestVisibleTabCapture() {
    return new Promise((resolve, reject) => {
      try {
        chrome.runtime.sendMessage({ type: MESSAGE_TYPE.CAPTURE_VISIBLE_TAB }, response => {
          const runtimeError = chrome.runtime.lastError
          if (runtimeError) {
            reject(new Error(runtimeError.message))
            return
          }

          if (!response?.ok) {
            reject(new Error(response?.error?.message || 'Unable to capture the visible tab.'))
            return
          }

          if (typeof response.dataUrl !== 'string' || !response.dataUrl.startsWith('data:image/png')) {
            reject(new Error('The visible tab capture did not return a PNG data URL.'))
            return
          }

          resolve(response.dataUrl)
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  async function captureAnnotatedViewport(state) {
    let hiddenRecords = []

    try {
      hiddenRecords = hideTransientUiForCapture()
      const dataUrl = await requestVisibleTabCapture()

      state.lastSnapshotCapture = {
        capturedAt: new Date().toISOString(),
        dataUrlLength: dataUrl.length
      }
      state.lastSnapshotCaptureError = null

      return { ok: true, dataUrl }
    } catch (error) {
      const serializedError = serializeError(error)
      state.lastSnapshotCaptureError = serializedError
      return { ok: false, error: serializedError }
    } finally {
      restoreTransientUi(hiddenRecords)
    }
  }

  function getSidebarScale(captureImage) {
    const viewportWidth = Math.max(1, window.innerWidth || captureImage.width)
    return clamp(captureImage.width / viewportWidth, 1, 2)
  }

  function getSidebarWidth(captureImage) {
    const scale = getSidebarScale(captureImage)
    return clamp(Math.round(460 * scale), 420, 760)
  }

  function setFont(ctx, size, weight = 600, scale = 1) {
    ctx.font = `${weight} ${Math.round(size * scale)}px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
  }

  function breakLongToken(ctx, token, maxWidth) {
    const parts = []
    let current = ''

    for (const char of token) {
      if (current && ctx.measureText(current + char).width > maxWidth) {
        parts.push(current)
        current = char
      } else {
        current += char
      }
    }

    if (current) parts.push(current)
    return parts
  }

  function wrapText(ctx, value, maxWidth) {
    const text = String(value || '').replace(/\s+/g, ' ').trim()
    if (!text) return ['']

    const lines = []
    let current = ''

    for (const token of text.split(' ')) {
      const candidates = ctx.measureText(token).width > maxWidth ? breakLongToken(ctx, token, maxWidth) : [token]

      for (const candidate of candidates) {
        const next = current ? `${current} ${candidate}` : candidate
        if (current && ctx.measureText(next).width > maxWidth) {
          lines.push(current)
          current = candidate
        } else {
          current = next
        }
      }
    }

    if (current) lines.push(current)
    return lines
  }

  function drawLines(ctx, lines, x, y, lineHeight, draw) {
    if (draw) {
      for (const line of lines) {
        ctx.fillText(line, x, y)
        y += lineHeight
      }
      return y
    }

    return y + lines.length * lineHeight
  }

  function getAnnotationComment(annotation, t) {
    return annotation?.note?.trim() || t('review.panel.noNote')
  }

  function getSidebarDetails(state, t) {
    return {
      eyebrow: 'LayoutPilot Review',
      title: t('review.snapshot.commentsTitle'),
      annotations: state.annotations.map(annotation => ({
        number: annotation.id,
        hasComment: Boolean(annotation?.note?.trim()),
        comment: getAnnotationComment(annotation, t),
        color: getAnnotationColor(annotation)
      }))
    }
  }

  function drawRoundedRect(ctx, x, y, width, height, radius) {
    const resolvedRadius = Math.min(radius, width / 2, height / 2)
    ctx.beginPath()
    ctx.moveTo(x + resolvedRadius, y)
    ctx.lineTo(x + width - resolvedRadius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + resolvedRadius)
    ctx.lineTo(x + width, y + height - resolvedRadius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - resolvedRadius, y + height)
    ctx.lineTo(x + resolvedRadius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - resolvedRadius)
    ctx.lineTo(x, y + resolvedRadius)
    ctx.quadraticCurveTo(x, y, x + resolvedRadius, y)
    ctx.closePath()
  }

  function drawSidebarHeader(ctx, sidebar, details, draw) {
    const { x, yStart, width, padding, scale } = sidebar
    let y = yStart

    setFont(ctx, 11, 900, scale)
    ctx.fillStyle = '#67E8F9'
    if (draw) ctx.fillText(details.eyebrow, x + padding, y)
    y += Math.round(24 * scale)

    setFont(ctx, 20, 900, scale)
    ctx.fillStyle = '#F8FAFC'
    if (draw) ctx.fillText(details.title, x + padding, y)
    y += Math.round(24 * scale)

    if (draw) {
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)'
      ctx.lineWidth = Math.max(1, Math.round(scale))
      ctx.beginPath()
      ctx.moveTo(x + padding, y)
      ctx.lineTo(x + width - padding, y)
      ctx.stroke()
    }

    return y + Math.round(18 * scale)
  }

  function drawAnnotationItem(ctx, sidebar, item, draw) {
    const { x, width, padding, contentWidth, scale } = sidebar
    const cardX = x + padding
    const cardWidth = contentWidth
    const cardPadding = Math.round(14 * scale)
    const badgeSize = Math.round(28 * scale)
    const gap = Math.round(12 * scale)
    const textX = cardX + cardPadding + badgeSize + gap
    const textWidth = cardWidth - cardPadding * 2 - badgeSize - gap
    let y = sidebar.currentY

    setFont(ctx, 13, 650, scale)
    const commentLines = wrapText(ctx, item.comment, textWidth)

    const lineHeightComment = Math.round(18 * scale)
    const textHeight = commentLines.length * lineHeightComment
    const cardHeight = Math.max(badgeSize + cardPadding * 2, textHeight + cardPadding * 2)

    if (draw) {
      ctx.save()
      ctx.shadowColor = 'rgba(0, 0, 0, 0.28)'
      ctx.shadowBlur = Math.round(16 * scale)
      ctx.shadowOffsetY = Math.round(8 * scale)
      drawRoundedRect(ctx, cardX, y, cardWidth, cardHeight, Math.round(10 * scale))
      ctx.fillStyle = '#0B1220'
      ctx.fill()
      ctx.restore()

      drawRoundedRect(ctx, cardX, y, cardWidth, cardHeight, Math.round(10 * scale))
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.24)'
      ctx.lineWidth = Math.max(1, Math.round(scale))
      ctx.stroke()

      ctx.fillStyle = item.color.color
      ctx.fillRect(cardX, y + Math.round(10 * scale), Math.round(4 * scale), cardHeight - Math.round(20 * scale))

      ctx.beginPath()
      ctx.arc(cardX + cardPadding + badgeSize / 2, y + cardPadding + badgeSize / 2, badgeSize / 2, 0, Math.PI * 2)
      ctx.fillStyle = item.color.color
      ctx.fill()
      ctx.strokeStyle = 'rgba(248, 250, 252, 0.82)'
      ctx.lineWidth = Math.max(1, Math.round(2 * scale))
      ctx.stroke()

      setFont(ctx, 12, 900, scale)
      ctx.fillStyle = item.color.text
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(String(item.number), cardX + cardPadding + badgeSize / 2, y + cardPadding + badgeSize / 2)
      ctx.textAlign = 'left'
      ctx.textBaseline = 'alphabetic'
    }

    if (draw) {
      setFont(ctx, 13, 650, scale)
      ctx.fillStyle = item.hasComment ? '#E5EDF7' : '#94A3B8'
      ctx.textBaseline = 'middle'

      const firstLineY = sidebar.currentY + cardHeight / 2 -
        (commentLines.length - 1) * lineHeightComment / 2
      for (let index = 0; index < commentLines.length; index += 1) {
        ctx.fillText(commentLines[index], textX, firstLineY + index * lineHeightComment)
      }

      ctx.textBaseline = 'alphabetic'
    }

    sidebar.currentY = sidebar.currentY + cardHeight + Math.round(12 * scale)
    return sidebar.currentY
  }

  function renderSnapshotSidebar(ctx, options) {
    const { x, width, image, state, t, draw = false } = options
    const scale = getSidebarScale(image)
    const padding = Math.round(24 * scale)
    const sidebar = {
      x,
      width,
      padding,
      contentWidth: width - padding * 2,
      scale,
      yStart: padding,
      currentY: padding
    }
    const details = getSidebarDetails(state, t)

    if (draw) {
      ctx.fillStyle = '#08111F'
      ctx.fillRect(x, 0, width, options.height)

      ctx.fillStyle = 'rgba(148, 163, 184, 0.18)'
      ctx.fillRect(x, 0, Math.max(1, Math.round(scale)), options.height)
    }

    sidebar.currentY = drawSidebarHeader(ctx, sidebar, details, draw)
    for (const item of details.annotations) {
      drawAnnotationItem(ctx, sidebar, item, draw)
    }

    return sidebar.currentY + padding
  }

  function assertCanvasHeight(height) {
    if (height > MAX_CANVAS_HEIGHT) {
      throw new Error(`Snapshot canvas is too tall (${height}px).`)
    }
  }

  async function createComposedSnapshotBlob(dataUrl, state, options = {}) {
    const {
      t = key => key
    } = options
    const image = await loadImage(dataUrl)
    const sidebarWidth = getSidebarWidth(image)
    const measureCanvas = document.createElement('canvas')
    const measureCtx = measureCanvas.getContext('2d')
    const measuredSidebarHeight = renderSnapshotSidebar(measureCtx, {
      x: 0,
      width: sidebarWidth,
      image,
      state,
      t,
      draw: false
    })
    const canvasHeight = Math.max(image.height, Math.ceil(measuredSidebarHeight))
    assertCanvasHeight(canvasHeight)

    const canvas = document.createElement('canvas')
    canvas.width = image.width + sidebarWidth
    canvas.height = canvasHeight

    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#08111F'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(image, 0, 0)
    renderSnapshotSidebar(ctx, {
      x: image.width,
      width: sidebarWidth,
      image,
      state,
      t,
      height: canvas.height,
      draw: true
    })

    return canvasToPngBlob(canvas)
  }

  async function downloadReviewSnapshot(state, options = {}) {
    const {
      showToast,
      t = key => key
    } = options

    if (state?.annotations?.length) ensureAnnotationColors(state.annotations)
    const capture = await captureAnnotatedViewport(state)
    if (!capture.ok) {
      showToast?.(t('toast.snapshotDownloadFailed'))
      return capture
    }

    try {
      const blob = state?.annotations?.length
        ? await createComposedSnapshotBlob(capture.dataUrl, state, { t })
        : await pngDataUrlToBlob(capture.dataUrl)
      downloadPngBlob(blob, 'layoutpilot-review-image')
      showToast?.(t('toast.snapshotDownloaded'))
      return { ...capture, blob }
    } catch (error) {
      const serializedError = serializeError(error)
      state.lastSnapshotCaptureError = serializedError
      showToast?.(t('toast.snapshotDownloadFailed'))
      return { ok: false, error: serializedError }
    }
  }

  async function copyReviewSnapshot(state, options = {}) {
    const {
      showToast,
      t = key => key
    } = options

    if (state?.annotations?.length) ensureAnnotationColors(state.annotations)
    const capture = await captureAnnotatedViewport(state)
    if (!capture.ok) {
      showToast?.(t('toast.snapshotCopyFailed'))
      return capture
    }

    try {
      const blob = state?.annotations?.length
        ? await createComposedSnapshotBlob(capture.dataUrl, state, { t })
        : await pngDataUrlToBlob(capture.dataUrl)
      await writePngBlobToClipboard(blob)
      showToast?.(t('toast.snapshotCopied'))
      return { ...capture, blob }
    } catch (error) {
      const serializedError = serializeError(error)
      state.lastSnapshotCaptureError = serializedError
      showToast?.(t('toast.snapshotCopyFailed'))
      return { ok: false, error: serializedError }
    }
  }

  root.reviewSnapshot = {
    captureAnnotatedViewport,
    downloadReviewSnapshot,
    copyReviewSnapshot,
    createComposedSnapshotBlob,
    requestVisibleTabCapture
  }
})()
