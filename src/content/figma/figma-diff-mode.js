(() => {
  const {
    constants,
    dom,
    elementInspector,
    draggablePanel,
    ui,
    figmaClipboard,
    figmaSvgParser,
    figmaAlign,
    figmaMatch,
    figmaDiff,
    figmaOverlay,
    figmaPixel
  } = window.LayoutPilotModules
  const { SHORTCUT } = constants
  const { createElement, px, escapeHtml, isLayoutPilotElement } = dom
  const { collectElementInfo } = elementInspector
  const { createDraggablePanel } = draggablePanel
  const { renderButton, renderCloseButton, getTooltipAttrs } = ui
  const { readFromClipboardData } = figmaClipboard
  const { parseFigmaSvg } = figmaSvgParser
  const { computeTransform, projectRect } = figmaAlign
  const { matchByText, matchByGeometry } = figmaMatch
  const { diffPair, missingResult, summarize } = figmaDiff
  const { createFigmaOverlay } = figmaOverlay

  const DOM_SCAN_LIMIT = 6000

  function createFigmaDiffMode(options = {}) {
    const { showToast, t } = options

    const state = {
      enabled: false,
      overlay: createFigmaOverlay(),
      markerLayer: null,
      pixelLayer: null,
      panel: null,
      panelPosition: null,
      panelDrag: null,
      source: null,
      parsed: null,
      transform: null,
      baseScale: 1,
      scaleFactor: 1,
      dragMode: false,
      dragStart: null,
      matches: [],
      results: [],
      summary: null,
      domCapped: false,
      pixelResult: null,
      checks: { position: true, size: true, color: true, fontSize: true, extra: false }
    }

    const panelDrag = createDraggablePanel({
      getPanel: () => state.panel,
      getPosition: () => state.panelPosition,
      setPosition: position => {
        state.panelPosition = position
      },
      getDrag: () => state.panelDrag,
      setDrag: drag => {
        state.panelDrag = drag
      }
    })

    function ensurePanel() {
      if (state.panel) return state.panel
      state.panel = createElement('layoutpilot-figma-panel')
      state.panel.addEventListener('input', handlePanelInput)
      state.panel.addEventListener('change', handlePanelChange)
      return state.panel
    }

    function ensureMarkerLayer() {
      state.markerLayer ||= createElement('layoutpilot-figma-marker-layer')
      return state.markerLayer
    }

    function ensurePixelLayer() {
      state.pixelLayer ||= createElement('layoutpilot-figma-pixel-layer')
      return state.pixelLayer
    }

    function removeElement(key) {
      if (state[key]) {
        state[key].remove()
        state[key] = null
      }
    }

    function currentTolerances() {
      return {
        checkPosition: state.checks.position,
        checkSize: state.checks.size,
        checkColor: state.checks.color,
        checkFontSize: state.checks.fontSize
      }
    }

    function getDirectText(element) {
      let text = ''
      for (const node of element.childNodes) {
        if (node.nodeType === 3) text += node.textContent
      }
      return text.replace(/\s+/g, ' ').trim()
    }

    function hasIconClass(element) {
      return element.classList && Array.from(element.classList).some(className => /icon/i.test(className))
    }

    function collectDomData() {
      const textEntries = []
      const geometry = []
      const all = document.body ? document.body.querySelectorAll('*') : []
      let scanned = 0
      let capped = false

      for (const element of all) {
        if (scanned >= DOM_SCAN_LIMIT) {
          capped = true
          break
        }
        scanned += 1
        if (isLayoutPilotElement(element)) continue
        const tag = element.tagName.toLowerCase()
        if (tag === 'script' || tag === 'style' || tag === 'noscript') continue

        const rect = element.getBoundingClientRect()
        if (rect.width <= 0 || rect.height <= 0) continue

        const text = getDirectText(element)
        if (text && text.length <= 120) {
          textEntries.push({ element, rect, text })
        }

        if (tag === 'img' || tag === 'svg' || hasIconClass(element)) {
          geometry.push({ element, rect })
        } else if (tag !== 'body') {
          const backgroundImage = getComputedStyle(element).backgroundImage
          if (backgroundImage && backgroundImage !== 'none' && backgroundImage.includes('url(')) {
            geometry.push({ element, rect })
          }
        }
      }

      return { textEntries, geometry, capped }
    }

    function buildResults(transform) {
      const nodes = state.parsed?.nodes || []
      const textNodes = nodes.filter(node => node.type === 'text')
      const geometryNodes = nodes.filter(node => node.type !== 'text')
      const domData = collectDomData()
      state.domCapped = domData.capped

      const textMatch = matchByText(textNodes, domData.textEntries, transform)
      const geometryMatch = matchByGeometry(geometryNodes, domData.geometry, transform)

      const matches = [...textMatch.matches, ...geometryMatch.matches]
      const results = []

      for (const pair of matches) {
        pair.domEntry.info = collectElementInfo(pair.domEntry.element)
        const normalized = {
          rect: {
            left: pair.domEntry.rect.left,
            top: pair.domEntry.rect.top,
            width: pair.domEntry.rect.width,
            height: pair.domEntry.rect.height
          },
          info: pair.domEntry.info,
          element: pair.domEntry.element
        }
        results.push(diffPair(pair.designNode, normalized, transform, currentTolerances()))
      }

      for (const designNode of [...textMatch.unmatchedDesign, ...geometryMatch.unmatchedDesign]) {
        results.push(missingResult(designNode))
      }

      state.matches = matches
      state.results = results
      state.summary = summarize(results)
    }

    function redoDiffOnly() {
      if (!state.transform) return
      const results = []
      for (const pair of state.matches) {
        pair.domEntry.info ||= collectElementInfo(pair.domEntry.element)
        const normalized = {
          rect: {
            left: pair.domEntry.rect.left,
            top: pair.domEntry.rect.top,
            width: pair.domEntry.rect.width,
            height: pair.domEntry.rect.height
          },
          info: pair.domEntry.info,
          element: pair.domEntry.element
        }
        results.push(diffPair(pair.designNode, normalized, state.transform, currentTolerances()))
      }
      for (const result of state.results) {
        if (result.issues.some(issue => issue.kind === 'missing')) results.push(result)
      }
      state.results = results
      state.summary = summarize(results)
    }

    function computeAndRender() {
      const frame = state.parsed?.frame || { width: 0, height: 0 }
      const textNodes = (state.parsed?.nodes || []).filter(node => node.type === 'text')
      const domForAnchors = collectDomData()
      const anchorMatch = matchByText(textNodes, domForAnchors.textEntries, null)
      const transform = computeTransform(anchorMatch.anchors, {
        frameWidth: frame.width,
        domWidth: document.documentElement.clientWidth || window.innerWidth,
        originX: 0,
        originY: 0
      })

      state.transform = transform
      state.baseScale = transform.scale
      state.scaleFactor = 1
      state.overlay.setFrame(frame.width, frame.height)
      state.overlay.applyTransform(transform)
      buildResults(transform)
      renderMarkers()
      renderPanel()
    }

    function ingestSvg(svgText) {
      const parsed = parseFigmaSvg(svgText)
      if (!parsed.frame.width || !parsed.nodes.length) {
        showToast?.(t('figma.toast.parseFailed'))
        return
      }
      state.source = { kind: 'svg', svgText }
      state.parsed = parsed
      state.pixelResult = null
      clearPixelLayer()
      state.overlay.setFrame(parsed.frame.width, parsed.frame.height)
      state.overlay.setSvg(svgText)
      state.overlay.setSkeletonNodes(parsed.nodes)
      state.overlay.setVisible(true)
      computeAndRender()
      showToast?.(t('figma.toast.diffReady', { count: state.summary.divergent }))
    }

    function ingestPng(blob) {
      const url = URL.createObjectURL(blob)
      const image = new Image()
      image.onload = () => {
        const frame = { width: image.naturalWidth, height: image.naturalHeight }
        URL.revokeObjectURL(url)
        state.source = { kind: 'png', blob }
        state.parsed = { frame, nodes: [] }
        state.matches = []
        state.results = []
        state.summary = null
        state.pixelResult = null
        clearPixelLayer()
        const transform = computeTransform([], {
          frameWidth: frame.width,
          domWidth: document.documentElement.clientWidth || window.innerWidth,
          originX: 0,
          originY: 0
        })
        state.transform = transform
        state.baseScale = transform.scale
        state.scaleFactor = 1
        state.overlay.setFrame(frame.width, frame.height)
        state.overlay.setImage(blob)
        state.overlay.setSkeletonNodes([])
        state.overlay.applyTransform(transform)
        state.overlay.setVisible(true)
        renderMarkers()
        renderPanel()
        showToast?.(t('figma.toast.pngReady'))
      }
      image.onerror = () => {
        URL.revokeObjectURL(url)
        showToast?.(t('figma.toast.parseFailed'))
      }
      image.src = url
    }

    function handlePaste(event) {
      if (!state.enabled) return
      // Prevent the default paste synchronously; clipboardData items are read
      // synchronously inside readFromClipboardData (getAsString is kicked off
      // before this handler returns).
      event.preventDefault()
      readFromClipboardData(event.clipboardData).then(payload => {
        if (!payload) {
          showToast?.(t('figma.toast.noContent'))
          return
        }
        if (payload.kind === 'svg') ingestSvg(payload.svgText)
        else ingestPng(payload.blob)
      })
    }

    // File import is the fallback for large Figma frames that exceed the
    // clipboard limit ("selection too large to copy"): export the frame as SVG
    // and drop it / pick it here.
    function ingestFile(file) {
      if (!file) return
      if (file.type === 'image/svg+xml' || /\.svg$/i.test(file.name || '')) {
        file.text()
          .then(text => ingestSvg(text))
          .catch(() => showToast?.(t('figma.toast.parseFailed')))
      } else if (file.type && file.type.startsWith('image/')) {
        ingestPng(file)
      } else {
        showToast?.(t('figma.toast.noContent'))
      }
    }

    function handleDragOver(event) {
      if (!state.enabled) return
      if (Array.from(event.dataTransfer?.types || []).includes('Files')) {
        event.preventDefault()
      }
    }

    function handleDrop(event) {
      if (!state.enabled) return
      const file = event.dataTransfer?.files?.[0]
      if (!file) return
      event.preventDefault()
      ingestFile(file)
    }

    function rectLeftTop(rect) {
      return {
        left: rect.left ?? rect.x ?? 0,
        top: rect.top ?? rect.y ?? 0,
        width: rect.width,
        height: rect.height
      }
    }

    function describeIssue(issue) {
      if (issue.kind === 'position') return t('figma.issue.position', { dx: issue.dx, dy: issue.dy })
      if (issue.kind === 'size') return t('figma.issue.size', { dw: issue.dw, dh: issue.dh })
      if (issue.kind === 'color') return t('figma.issue.color', { design: issue.design, actual: issue.actual })
      if (issue.kind === 'font-size') return t('figma.issue.fontSize', { design: issue.design, actual: issue.actual })
      if (issue.kind === 'missing') return t('figma.issue.missing')
      if (issue.kind === 'extra') return t('figma.issue.extra')
      return ''
    }

    function resultLabel(result) {
      if (result.designNode?.type === 'text') return `"${result.designNode.text}"`
      if (result.designNode) return t(`figma.type.${result.designNode.type}`)
      return t('figma.type.extra')
    }

    function renderMarkers() {
      ensureMarkerLayer()
      state.markerLayer.replaceChildren()
      if (!state.transform) return

      let index = 0
      for (const result of state.results) {
        if (!result.issues.length) continue
        index += 1
        const isMissing = result.issues.some(issue => issue.kind === 'missing')
        const sourceRect = result.domEntry
          ? result.domEntry.rect
          : projectRect(state.transform, result.designNode.rect)
        const rect = rectLeftTop(sourceRect)

        const marker = document.createElement('div')
        marker.className = `layoutpilot-figma-marker${isMissing ? ' layoutpilot-figma-marker--missing' : ''}`
        marker.style.left = px(rect.left)
        marker.style.top = px(rect.top)
        marker.style.width = px(Math.max(4, rect.width))
        marker.style.height = px(Math.max(4, rect.height))

        const badge = document.createElement('div')
        badge.className = 'layoutpilot-figma-marker-badge'
        badge.textContent = String(index)
        const label = `${resultLabel(result)} - ${result.issues.map(describeIssue).join(' / ')}`
        badge.setAttribute('data-layoutpilot-tooltip', label)
        marker.append(badge)
        state.markerLayer.append(marker)
      }
    }

    function renderControlButton(action, iconLabel, title) {
      return renderButton({
        label: iconLabel,
        className: 'layoutpilot-figma-button',
        action,
        title
      })
    }

    function renderCheck(key, label) {
      const checked = state.checks[key] ? 'checked' : ''
      return `
        <label class="layoutpilot-figma-check">
          <input type="checkbox" data-layoutpilot-control="check" data-check="${key}" ${checked} />
          <span>${escapeHtml(label)}</span>
        </label>
      `
    }

    function renderSummaryText() {
      if (state.source?.kind === 'png') return t('figma.summary.png')
      if (!state.summary) return t('figma.summary.hint')
      return t('figma.summary.counts', {
        total: state.summary.total,
        divergent: state.summary.divergent
      })
    }

    function renderList() {
      const divergent = state.results.filter(result => result.issues.length)
      if (!divergent.length) {
        return `<p class="layoutpilot-figma-empty">${escapeHtml(state.summary ? t('figma.list.empty') : t('figma.list.waiting'))}</p>`
      }

      const items = divergent.map((result, index) => `
        <li class="layoutpilot-figma-item">
          <span class="layoutpilot-figma-item-index">${index + 1}</span>
          <span class="layoutpilot-figma-item-body">
            <strong>${escapeHtml(resultLabel(result))}</strong>
            <small>${escapeHtml(result.issues.map(describeIssue).join(' / '))}</small>
          </span>
        </li>
      `).join('')

      return `<ul class="layoutpilot-figma-list-items">${items}</ul>`
    }

    function renderPanel() {
      const panel = ensurePanel()
      const overlayState = state.overlay.getState()
      const pixelLine = state.pixelResult?.ok
        ? `<div class="layoutpilot-figma-pixel-line">${escapeHtml(t('figma.pixel.result', { percent: (state.pixelResult.diffRatio * 100).toFixed(1) }))}</div>`
        : ''
      const cappedLine = state.domCapped
        ? `<div class="layoutpilot-figma-warning">${escapeHtml(t('figma.warning.capped', { limit: DOM_SCAN_LIMIT }))}</div>`
        : ''

      panel.innerHTML = `
        <div class="layoutpilot-figma-header">
          <strong>${escapeHtml(t('figma.panel.title'))}</strong>
          ${renderCloseButton({ action: 'figma-clear', label: t('figma.panel.clear') })}
        </div>
        <div class="layoutpilot-figma-summary">${escapeHtml(renderSummaryText())}</div>
        ${cappedLine}
        <div class="layoutpilot-figma-control-row">
          <label class="layoutpilot-figma-button layoutpilot-figma-import">
            <input type="file" accept=".svg,image/svg+xml,image/png" data-layoutpilot-control="import" hidden />
            ${escapeHtml(t('figma.controls.importSvg'))}
          </label>
        </div>
        <div class="layoutpilot-figma-control-row">
          <label class="layoutpilot-figma-opacity">
            <span>${escapeHtml(t('figma.controls.opacity'))}</span>
            <input type="range" min="0" max="100" value="${Math.round(overlayState.opacity * 100)}" data-layoutpilot-control="opacity" />
          </label>
        </div>
        <div class="layoutpilot-figma-control-row">
          <label class="layoutpilot-figma-opacity">
            <span>${escapeHtml(t('figma.controls.scale'))} ${Math.round(state.scaleFactor * 100)}%</span>
            <input type="range" min="5" max="300" value="${Math.round(state.scaleFactor * 100)}" data-layoutpilot-control="scale" ${state.transform ? '' : 'disabled'} />
          </label>
        </div>
        <div class="layoutpilot-figma-control-row">
          ${renderControlButton('figma-toggle-visible', t('figma.controls.overlay'), t('figma.controls.overlayHint'))}
          ${renderControlButton('figma-toggle-drag', t(state.dragMode ? 'figma.controls.moveOn' : 'figma.controls.moveOff'), t('figma.controls.moveHint'))}
          ${renderControlButton('figma-toggle-blend', t(overlayState.blend === 'difference' ? 'figma.controls.blendOn' : 'figma.controls.blendOff'), t('figma.controls.blendHint'))}
          ${state.source?.kind === 'svg' ? renderControlButton('figma-toggle-skeleton', t(overlayState.skeletonOn ? 'figma.controls.skeletonOn' : 'figma.controls.skeletonOff'), t('figma.controls.skeletonHint')) : ''}
        </div>
        <div class="layoutpilot-figma-control-row">
          ${renderControlButton('figma-nudge-left', '←', t('figma.controls.nudge'))}
          ${renderControlButton('figma-nudge-up', '↑', t('figma.controls.nudge'))}
          ${renderControlButton('figma-nudge-down', '↓', t('figma.controls.nudge'))}
          ${renderControlButton('figma-nudge-right', '→', t('figma.controls.nudge'))}
          ${state.parsed?.nodes?.length ? renderControlButton('figma-recompute', t('figma.controls.recompute'), t('figma.controls.recomputeHint')) : ''}
          ${renderControlButton('figma-pixel', t(pixelShown() ? 'figma.controls.pixelClear' : 'figma.controls.pixel'), t('figma.controls.pixelHint'))}
        </div>
        ${state.parsed?.nodes?.length ? `
          <div class="layoutpilot-figma-checks">
            ${renderCheck('position', t('figma.checks.position'))}
            ${renderCheck('size', t('figma.checks.size'))}
            ${renderCheck('color', t('figma.checks.color'))}
            ${renderCheck('fontSize', t('figma.checks.fontSize'))}
          </div>
        ` : ''}
        ${pixelLine}
        <div class="layoutpilot-figma-list">${renderList()}</div>
      `
      panel.style.display = 'flex'
      panelDrag.applyPosition()
      panel.querySelector('.layoutpilot-figma-header')?.addEventListener('pointerdown', panelDrag.handleStart)
    }

    function clearPixelLayer() {
      if (state.pixelLayer) state.pixelLayer.replaceChildren()
    }

    function pixelShown() {
      return !!(state.pixelResult?.ok && state.pixelLayer && state.pixelLayer.childElementCount)
    }

    function clearPixel() {
      clearPixelLayer()
      state.pixelResult = null
      renderPanel()
    }

    function nudge(dx, dy) {
      if (!state.transform) return
      state.transform = figmaAlign.nudge(state.transform, dx, dy)
      state.overlay.applyTransform(state.transform)
      if (state.parsed?.nodes?.length) redoDiffOnly()
      renderMarkers()
      renderPanel()
    }

    function applyScaleFactor(factor) {
      if (!state.transform) return
      state.scaleFactor = Math.max(0.05, Math.min(3, factor))
      state.transform = { ...state.transform, scale: state.baseScale * state.scaleFactor }
      state.overlay.applyTransform(state.transform)
      if (state.parsed?.nodes?.length) redoDiffOnly()
      renderMarkers()
    }

    function toggleDragMode() {
      state.dragMode = !state.dragMode
      state.overlay.setInteractive(state.dragMode)
      renderPanel()
    }

    function handleOverlayPointerDown(event) {
      if (!state.enabled || !state.dragMode || !state.transform) return
      event.preventDefault()
      event.stopPropagation()
      state.dragStart = {
        x: event.clientX,
        y: event.clientY,
        offsetX: state.transform.offsetX,
        offsetY: state.transform.offsetY
      }
      document.addEventListener('pointermove', handleOverlayPointerMove, true)
      document.addEventListener('pointerup', handleOverlayPointerUp, true)
    }

    function handleOverlayPointerMove(event) {
      if (!state.dragStart) return
      state.transform = {
        ...state.transform,
        offsetX: state.dragStart.offsetX + (event.clientX - state.dragStart.x),
        offsetY: state.dragStart.offsetY + (event.clientY - state.dragStart.y)
      }
      state.overlay.applyTransform(state.transform)
    }

    function handleOverlayPointerUp() {
      document.removeEventListener('pointermove', handleOverlayPointerMove, true)
      document.removeEventListener('pointerup', handleOverlayPointerUp, true)
      if (!state.dragStart) return
      state.dragStart = null
      if (state.parsed?.nodes?.length) redoDiffOnly()
      renderMarkers()
    }

    async function runPixel() {
      if (!state.source) {
        showToast?.(t('figma.toast.noContent'))
        return
      }
      showToast?.(t('figma.toast.pixelRunning'))
      const result = await figmaPixel.runPixelDiff({
        frame: state.parsed.frame,
        transform: state.transform,
        designSvgText: state.source.kind === 'svg' ? state.source.svgText : undefined,
        designBlob: state.source.kind === 'png' ? state.source.blob : undefined
      })
      state.pixelResult = result
      if (!result.ok) {
        showToast?.(t('figma.toast.pixelFailed'))
        renderPanel()
        return
      }

      ensurePixelLayer()
      state.pixelLayer.replaceChildren()
      const image = document.createElement('img')
      image.className = 'layoutpilot-figma-pixel-image'
      image.src = result.dataUrl
      image.style.left = px(result.region.left)
      image.style.top = px(result.region.top)
      image.style.width = px(result.region.width)
      image.style.height = px(result.region.height)
      state.pixelLayer.append(image)
      renderPanel()
    }

    function clearComparison() {
      state.source = null
      state.parsed = null
      state.transform = null
      state.matches = []
      state.results = []
      state.summary = null
      state.pixelResult = null
      state.overlay.setVisible(false)
      state.overlay.setSvg('')
      if (state.markerLayer) state.markerLayer.replaceChildren()
      clearPixelLayer()
      renderPanel()
    }

    function handlePanelInput(event) {
      const control = event.target?.dataset?.layoutpilotControl
      if (control === 'opacity') {
        state.overlay.setOpacity(Number(event.target.value) / 100)
      } else if (control === 'scale') {
        applyScaleFactor(Number(event.target.value) / 100)
        const label = event.target.closest('.layoutpilot-figma-opacity')?.querySelector('span')
        if (label) label.textContent = `${t('figma.controls.scale')} ${Math.round(state.scaleFactor * 100)}%`
      }
    }

    function handlePanelChange(event) {
      const control = event.target?.dataset?.layoutpilotControl
      if (control === 'import') {
        const file = event.target.files && event.target.files[0]
        ingestFile(file)
        event.target.value = ''
        return
      }
      if (control === 'check') {
        const key = event.target.dataset.check
        if (key in state.checks) {
          state.checks[key] = event.target.checked
          if (state.parsed?.nodes?.length) {
            redoDiffOnly()
            renderMarkers()
            renderPanel()
          }
        }
      }
    }

    function handleUiClick(event) {
      const action = event.target?.closest?.('[data-layoutpilot-action]')?.dataset?.layoutpilotAction
      if (!action || !action.startsWith('figma-')) return false

      if (action === 'figma-clear') clearComparison()
      else if (action === 'figma-toggle-visible') { state.overlay.toggleVisible(); renderPanel() }
      else if (action === 'figma-toggle-drag') toggleDragMode()
      else if (action === 'figma-toggle-blend') { state.overlay.toggleBlend(); renderPanel() }
      else if (action === 'figma-toggle-skeleton') { state.overlay.toggleSkeleton(); renderPanel() }
      else if (action === 'figma-recompute') computeAndRender()
      else if (action === 'figma-pixel') { if (pixelShown()) clearPixel(); else runPixel() }
      else if (action === 'figma-nudge-left') nudge(-1, 0)
      else if (action === 'figma-nudge-right') nudge(1, 0)
      else if (action === 'figma-nudge-up') nudge(0, -1)
      else if (action === 'figma-nudge-down') nudge(0, 1)

      return true
    }

    function handleViewportChange() {
      if (!state.enabled || !state.transform || !state.parsed?.nodes?.length) return
      renderMarkers()
    }

    function bindListeners() {
      document.addEventListener('paste', handlePaste, true)
      document.addEventListener('dragover', handleDragOver, true)
      document.addEventListener('drop', handleDrop, true)
      window.addEventListener('scroll', handleViewportChange, true)
      window.addEventListener('resize', handleViewportChange)
    }

    function unbindListeners() {
      document.removeEventListener('paste', handlePaste, true)
      document.removeEventListener('dragover', handleDragOver, true)
      document.removeEventListener('drop', handleDrop, true)
      window.removeEventListener('scroll', handleViewportChange, true)
      window.removeEventListener('resize', handleViewportChange)
    }

    function start() {
      if (state.enabled) return
      state.enabled = true
      state.overlay.ensure()
      state.overlay.setVisible(false)
      state.overlay.getElement().addEventListener('pointerdown', handleOverlayPointerDown, true)
      ensureMarkerLayer()
      renderPanel()
      bindListeners()
      showToast?.(t('figma.toast.ready'))
    }

    function stop() {
      if (!state.enabled) return
      state.enabled = false
      unbindListeners()
      handleOverlayPointerUp()
      panelDrag.stop()
      state.overlay.destroy()
      state.overlay = createFigmaOverlay()
      removeElement('markerLayer')
      removeElement('pixelLayer')
      removeElement('panel')
      state.source = null
      state.parsed = null
      state.transform = null
      state.dragMode = false
      state.dragStart = null
      state.matches = []
      state.results = []
      state.summary = null
      state.pixelResult = null
    }

    function destroy() {
      unbindListeners()
      panelDrag.stop()
      state.overlay.destroy()
      removeElement('markerLayer')
      removeElement('pixelLayer')
      removeElement('panel')
      state.enabled = false
    }

    function handleKeyDown(event, normalizedKey) {
      if (!state.enabled) return false

      if (normalizedKey === SHORTCUT.CANCEL) {
        if (state.source) {
          clearComparison()
          return true
        }
        return false
      }

      if (normalizedKey === SHORTCUT.TOGGLE_OVERLAY) {
        state.overlay.toggleVisible()
        renderPanel()
        return true
      }

      if (normalizedKey === SHORTCUT.TOGGLE_SKELETON) {
        if (state.source?.kind === 'svg') {
          state.overlay.toggleSkeleton()
          renderPanel()
          return true
        }
      }

      return false
    }

    function refreshLanguage() {
      if (state.panel) renderPanel()
    }

    function getState() {
      return state
    }

    return {
      start,
      stop,
      destroy,
      handleKeyDown,
      handleUiClick,
      refreshLanguage,
      getState
    }
  }

  window.LayoutPilotModules.figmaDiffMode = {
    createFigmaDiffMode
  }
})()
