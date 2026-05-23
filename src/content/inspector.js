(() => {
  const {
    constants,
    dom,
    elementInspector,
    contextExport,
    cssExport,
    clipboard,
    shortcuts,
    detailPanel,
    draggablePanel,
    ui
  } = window.LayoutPilotModules
  const { INSTANCE_KEY, MODE, MESSAGE_TYPE, SHORTCUT, UI_SELECTOR } = constants
  const {
    createElement,
    px,
    setBox,
    escapeHtml,
    formatColor
  } = dom
  const {
    collectElementInfo,
    getSpacingBetween,
    formatLineHeightText
  } = elementInspector
  const {
    createCompactAiContext,
    createAiContext
  } = contextExport
  const { createCssSummary } = cssExport
  const { copyText } = clipboard
  const { normalizeKey, shouldIgnoreShortcut, consumeShortcut } = shortcuts
  const { renderDetailPanelContent } = detailPanel
  const { createDraggablePanel } = draggablePanel
  const { renderCloseButton, renderShortcutList } = ui

  function cleanupOrphanUi() {
    document.querySelectorAll(UI_SELECTOR).forEach(element => element.remove())
  }

  if (window[INSTANCE_KEY]?.destroy) {
    window[INSTANCE_KEY].destroy()
  } else if (window[INSTANCE_KEY]?.setEnabled) {
    window[INSTANCE_KEY].setEnabled(false)
    cleanupOrphanUi()
  } else {
    cleanupOrphanUi()
  }

  const state = {
    enabled: false,
    mode: MODE.INSPECT,
    hoveredElement: null,
    selectedElement: null,
    overlay: null,
    selectedOverlay: null,
    tooltip: null,
    distanceLayer: null,
    detailPanel: null,
    helpPanel: null,
    toast: null,
    lastPointerEvent: null,
    healthCheckTimer: null,
    detailPanelPosition: null,
    detailPanelDrag: null
  }

  const detailPanelDrag = createDraggablePanel({
    getPanel: () => state.detailPanel,
    getPosition: () => state.detailPanelPosition,
    setPosition: position => {
      state.detailPanelPosition = position
    },
    getDrag: () => state.detailPanelDrag,
    setDrag: drag => {
      state.detailPanelDrag = drag
    }
  })

  const HELP_SHORTCUTS = [
    { key: 'I', label: 'Ativar/desativar inspecao' },
    { key: 'H', label: 'Mostrar/ocultar atalhos' },
    { key: 'Q', label: 'Desativar LayoutPilot' },
    { key: 'Esc', label: 'Cancelar acao atual' },
    { key: 'C', label: 'Copiar contexto simples' },
    { key: 'D', label: 'Abrir/fechar detalhes' },
    { key: 'P', label: 'Fixar/desfixar elemento' }
  ]

  function ensureUi() {
    state.overlay ||= createElement('layoutpilot-overlay')
    state.selectedOverlay ||= createElement('layoutpilot-selected-overlay')
    state.tooltip ||= createElement('layoutpilot-tooltip')
    state.distanceLayer ||= createElement('layoutpilot-distance-layer')
  }

  function ensureDetailPanel() {
    state.detailPanel ||= createElement('layoutpilot-detail-panel')
    return state.detailPanel
  }

  function ensureHelpPanel() {
    state.helpPanel ||= createElement('layoutpilot-help-panel')
    return state.helpPanel
  }

  function ensureToast() {
    state.toast ||= createElement('layoutpilot-toast')
    return state.toast
  }

  function removeElement(key) {
    if (state[key]) {
      state[key].remove()
      state[key] = null
    }
  }

  function hideUi() {
    for (const key of ['overlay', 'selectedOverlay', 'tooltip', 'distanceLayer', 'detailPanel', 'helpPanel', 'toast']) {
      removeElement(key)
    }
    cleanupOrphanUi()
  }

  function hideTransientUi() {
    for (const element of [state.overlay, state.selectedOverlay, state.tooltip, state.distanceLayer]) {
      if (element) element.style.display = 'none'
    }
  }

  function isOwnElement(element) {
    if (!(element instanceof Element)) return false
    return element.classList?.contains('layoutpilot-overlay') ||
      element.classList?.contains('layoutpilot-selected-overlay') ||
      element.classList?.contains('layoutpilot-tooltip') ||
      element.classList?.contains('layoutpilot-distance-layer') ||
      element.classList?.contains('layoutpilot-detail-panel') ||
      element.classList?.contains('layoutpilot-help-panel') ||
      element.classList?.contains('layoutpilot-toast') ||
      !!element.closest?.('.layoutpilot-tooltip, .layoutpilot-distance-layer, .layoutpilot-detail-panel, .layoutpilot-help-panel, .layoutpilot-toast')
  }

  function getElementAtPoint(event) {
    const elements = document.elementsFromPoint(event.clientX, event.clientY)
    return elements.find(element => element instanceof Element && !isOwnElement(element) && element !== document.documentElement && element !== document.body) || null
  }

  function getActiveElement() {
    if (state.selectedElement?.isConnected) return state.selectedElement
    if (state.hoveredElement?.isConnected) return state.hoveredElement
    return null
  }

  function getPinShortcutElement() {
    if (state.hoveredElement?.isConnected) return state.hoveredElement
    return getActiveElement()
  }

  function formatColorMarkup(colorValue) {
    const value = formatColor(colorValue)
    if (value === '—') return value
    return createColorChipMarkup([value])
  }

  function formatColorsMarkup(colors) {
    if (!colors?.length) return '—'
    return createColorChipMarkup(colors)
  }

  function createColorChipMarkup(colors) {
    const uniqueColors = Array.from(new Set(colors.filter(Boolean)))
    if (!uniqueColors.length) return '—'

    const background = uniqueColors.length === 1
      ? uniqueColors[0]
      : `linear-gradient(90deg, ${uniqueColors.join(', ')})`

    return `
      <span class="layoutpilot-color-chip">
        <span class="layoutpilot-color-swatch" style="background: ${escapeHtml(background)}"></span>
        <span>${escapeHtml(uniqueColors.join(' / '))}</span>
      </span>
    `
  }

  function positionTooltip(event) {
    const offset = 14
    state.tooltip.style.display = 'block'
    state.tooltip.style.visibility = 'hidden'
    state.tooltip.style.left = '0px'
    state.tooltip.style.top = '0px'

    const tooltipRect = state.tooltip.getBoundingClientRect()
    const left = Math.min(event.clientX + offset, window.innerWidth - tooltipRect.width - offset)
    const top = Math.min(event.clientY + offset, window.innerHeight - tooltipRect.height - offset)

    state.tooltip.style.left = px(Math.max(12, left))
    state.tooltip.style.top = px(Math.max(12, top))
    state.tooltip.style.visibility = 'visible'
  }

  function renderTooltip(event, element) {
    const info = collectElementInfo(element)
    const selectedRect = state.selectedElement?.isConnected ? state.selectedElement.getBoundingClientRect() : null
    const spacing = selectedRect && state.selectedElement !== element ? getSpacingBetween(selectedRect, info.rect) : null
    const isPinned = state.selectedElement === element
    const layoutExtra = info.gap !== '—' ? info.gap : `${info.display} / ${info.position}`

    state.tooltip.innerHTML = `
      <strong>${escapeHtml(info.name)}</strong>
      <div class="layoutpilot-grid">
        <span class="layoutpilot-label">Size</span>
        <span class="layoutpilot-value">${info.width} x ${info.height}px</span>
        <span class="layoutpilot-label">Position</span>
        <span class="layoutpilot-value">x ${info.x}, y ${info.y}</span>
        <span class="layoutpilot-label">Padding</span>
        <span class="layoutpilot-value">${escapeHtml(info.padding)}</span>
        <span class="layoutpilot-label">Margin</span>
        <span class="layoutpilot-value">${escapeHtml(info.margin)}</span>
        <span class="layoutpilot-label">Layout</span>
        <span class="layoutpilot-value">${escapeHtml(layoutExtra)}</span>
        <span class="layoutpilot-label layoutpilot-line-label">Line height</span>
        <span class="layoutpilot-value layoutpilot-line-value">${escapeHtml(formatLineHeightText(info))}</span>
        <span class="layoutpilot-label">Font</span>
        <span class="layoutpilot-value">${escapeHtml(`${info.fontSize} ${info.fontFamily}`)}</span>
        <span class="layoutpilot-label">Color</span>
        <span class="layoutpilot-value">${formatColorMarkup(info.color)}</span>
        ${info.background !== '—' ? `
          <span class="layoutpilot-label">Background</span>
          <span class="layoutpilot-value">${formatColorMarkup(info.background)}</span>
        ` : ''}
        ${info.borderColors.length ? `
          <span class="layoutpilot-label">Border</span>
          <span class="layoutpilot-value">${formatColorsMarkup(info.borderColors)}</span>
        ` : ''}
        <span class="layoutpilot-label">Classes</span>
        <span class="layoutpilot-value layoutpilot-code">${escapeHtml(info.classes)}</span>
        ${spacing ? `
          <span class="layoutpilot-label">Spacing</span>
          <span class="layoutpilot-value">H ${spacing.horizontal}px - V ${spacing.vertical}px</span>
        ` : ''}
      </div>
      <div class="layoutpilot-divider"></div>
      <div class="layoutpilot-help">${isPinned ? 'Click again to unpin.' : 'Click to pin.'} D details - C simple context - H help - Q quit</div>
    `

    positionTooltip(event)
  }

  function renderSelectedOverlay() {
    if (!state.selectedElement?.isConnected) {
      state.selectedElement = null
      if (state.selectedOverlay) state.selectedOverlay.style.display = 'none'
      return
    }

    ensureUi()
    setBox(state.selectedOverlay, state.selectedElement.getBoundingClientRect())
  }

  function addDistanceLine(className, left, top, width, height, label) {
    const line = document.createElement('div')
    line.className = `layoutpilot-distance-line ${className}`
    line.style.left = px(left)
    line.style.top = px(top)
    line.style.width = px(width)
    line.style.height = px(height)
    state.distanceLayer.appendChild(line)

    const labelElement = document.createElement('div')
    labelElement.className = 'layoutpilot-distance-label'
    labelElement.textContent = label
    labelElement.style.left = px(left + width / 2)
    labelElement.style.top = px(top + height / 2)
    state.distanceLayer.appendChild(labelElement)
  }

  function renderDistances(element) {
    ensureUi()
    state.distanceLayer.innerHTML = ''

    if (!state.selectedElement?.isConnected || state.selectedElement === element) {
      state.distanceLayer.style.display = 'none'
      return
    }

    const a = state.selectedElement.getBoundingClientRect()
    const b = element.getBoundingClientRect()
    const spacing = getSpacingBetween(a, b)
    let hasDistance = false

    if (spacing.horizontal > 0) {
      const left = b.left > a.right ? a.right : b.right
      const right = b.left > a.right ? b.left : a.left
      const y = Math.max(Math.min(a.top + a.height / 2, b.bottom), b.top)
      addDistanceLine('horizontal', left, y, right - left, 2, `${spacing.horizontal}px`)
      hasDistance = true
    }

    if (spacing.vertical > 0) {
      const top = b.top > a.bottom ? a.bottom : b.bottom
      const bottom = b.top > a.bottom ? b.top : a.top
      const x = Math.max(Math.min(a.left + a.width / 2, b.right), b.left)
      addDistanceLine('vertical', x, top, 2, bottom - top, `${spacing.vertical}px`)
      hasDistance = true
    }

    state.distanceLayer.style.display = hasDistance ? 'block' : 'none'
  }

  function openDetailPanel(element = getActiveElement()) {
    if (!element?.isConnected) {
      showToast('No element selected')
      return
    }

    state.selectedElement = element
    renderSelectedOverlay()

    const info = collectElementInfo(element)
    const panel = ensureDetailPanel()
    panel.innerHTML = renderDetailPanelContent(info, {
      createCompactContext: createCompactAiContext,
      formatColorMarkup
    })
    panel.style.display = 'flex'
    detailPanelDrag.applyPosition()
    panel.querySelector('.layoutpilot-detail-header')?.addEventListener('pointerdown', detailPanelDrag.handleStart)
  }

  function closeDetailPanel() {
    removeElement('detailPanel')
  }

  function toggleDetailPanel() {
    if (state.detailPanel) {
      closeDetailPanel()
      return
    }

    openDetailPanel()
  }

  function renderHelpPanel() {
    const panel = ensureHelpPanel()
    panel.innerHTML = `
      <div class="layoutpilot-help-header">
        <strong>LayoutPilot atalhos</strong>
        ${renderCloseButton({ action: 'close-help', label: 'Close help' })}
      </div>
      ${renderShortcutList(HELP_SHORTCUTS)}
      <p>I funciona depois de ativar a extensao nesta aba pelo popup.</p>
      <p>Modo Revisao: em breve.</p>
    `
    panel.style.display = 'block'
  }

  function toggleHelpPanel() {
    if (state.helpPanel) {
      removeElement('helpPanel')
      return
    }

    renderHelpPanel()
  }

  function quitLayoutPilot() {
    if (state.enabled) {
      setEnabled(false)
      return
    }

    state.hoveredElement = null
    state.selectedElement = null
    state.lastPointerEvent = null
    hideUi()
  }

  function showToast(message) {
    const toast = ensureToast()
    toast.textContent = message
    toast.style.display = 'block'
    window.clearTimeout(showToast.timeout)
    showToast.timeout = window.setTimeout(() => {
      if (state.toast) state.toast.style.display = 'none'
    }, 1600)
  }

  function copyAiContext(element = getActiveElement()) {
    if (!element?.isConnected) {
      showToast('No element selected')
      return
    }
    copyText(createCompactAiContext(collectElementInfo(element)), 'Simple context', showToast)
  }

  function copyFullAiContext(element = getActiveElement()) {
    if (!element?.isConnected) {
      showToast('No element selected')
      return
    }
    copyText(createAiContext(collectElementInfo(element)), 'Full context', showToast)
  }

  function copySelector(element = getActiveElement()) {
    if (!element?.isConnected) {
      showToast('No element selected')
      return
    }
    copyText(collectElementInfo(element).selector, 'Selector', showToast)
  }

  function copyCssSummary(element = getActiveElement()) {
    if (!element?.isConnected) {
      showToast('No element selected')
      return
    }
    copyText(createCssSummary(collectElementInfo(element)), 'CSS/layout summary', showToast)
  }

  function inspectAtEvent(event) {
    if (!state.enabled || state.mode !== MODE.INSPECT || isOwnElement(event.target)) return

    const element = getElementAtPoint(event)
    if (!element) return

    state.hoveredElement = element
    state.lastPointerEvent = event
    ensureUi()
    setBox(state.overlay, element.getBoundingClientRect())
    renderSelectedOverlay()
    renderDistances(element)
    renderTooltip(event, element)
  }

  function togglePin(element = getActiveElement()) {
    if (!element?.isConnected) {
      showToast('No element selected')
      return
    }

    ensureUi()
    if (state.selectedElement === element) {
      state.selectedElement = null
      if (state.selectedOverlay) state.selectedOverlay.style.display = 'none'
      if (state.distanceLayer) {
        state.distanceLayer.innerHTML = ''
        state.distanceLayer.style.display = 'none'
      }
      showToast('Element unpinned')
      return
    }

    state.selectedElement = element
    renderSelectedOverlay()
    renderDistances(element)
    if (state.detailPanel) openDetailPanel(element)
    showToast('Element pinned')
  }

  function handleClick(event) {
    if (!state.enabled || state.mode !== MODE.INSPECT) return
    if (isOwnElement(event.target)) return

    const element = getElementAtPoint(event)
    if (!element) return

    event.preventDefault()
    event.stopPropagation()

    if (event.detail > 1) return
    togglePin(element)
    if (state.lastPointerEvent) renderTooltip(state.lastPointerEvent, element)
  }

  function handleDoubleClick(event) {
    if (!state.enabled || state.mode !== MODE.INSPECT) return
    if (isOwnElement(event.target)) return

    const element = getElementAtPoint(event)
    if (!element) return

    event.preventDefault()
    event.stopPropagation()
    state.selectedElement = element
    openDetailPanel(element)
  }

  function handleUiClick(event) {
    if (!isOwnElement(event.target)) return

    const action = event.target?.closest?.('[data-layoutpilot-action]')?.dataset?.layoutpilotAction
    if (!action) return

    if (action === 'close-detail') closeDetailPanel()
    if (action === 'close-help') removeElement('helpPanel')
    if (action === 'copy-ai') copyAiContext()
    if (action === 'copy-ai-full') copyFullAiContext()
    if (action === 'copy-selector') copySelector()
    if (action === 'copy-css') copyCssSummary()
  }

  function handleKeyDown(event) {
    if (shouldIgnoreShortcut(event)) return

    const normalized = normalizeKey(event)

    if (normalized === SHORTCUT.HELP) {
      consumeShortcut(event)
      toggleHelpPanel()
      return
    }

    if (normalized === SHORTCUT.QUIT) {
      consumeShortcut(event)
      quitLayoutPilot()
      return
    }

    if (normalized === SHORTCUT.INSPECT) {
      consumeShortcut(event)
      setMode(MODE.INSPECT)
      setEnabled(!state.enabled)
      return
    }

    if (normalized === SHORTCUT.CANCEL && state.helpPanel) {
      consumeShortcut(event)
      removeElement('helpPanel')
      return
    }

    if (!state.enabled) return

    if (normalized === SHORTCUT.CANCEL) {
      consumeShortcut(event)
      if (state.detailPanel) {
        closeDetailPanel()
        return
      }
      if (state.helpPanel) {
        removeElement('helpPanel')
        return
      }
      if (state.selectedElement) {
        togglePin(state.selectedElement)
        return
      }
      setEnabled(false)
      return
    }

    if (normalized === SHORTCUT.COPY_CONTEXT) {
      consumeShortcut(event)
      copyAiContext()
      return
    }

    if (normalized === SHORTCUT.DETAILS) {
      consumeShortcut(event)
      toggleDetailPanel()
      return
    }

    if (normalized === SHORTCUT.PIN) {
      consumeShortcut(event)
      togglePin(getPinShortcutElement())
    }
  }

  function handleViewportChange(event) {
    if (!state.enabled) return
    if (event?.target instanceof Element && isOwnElement(event.target)) return
    if (state.selectedElement) renderSelectedOverlay()
    if (state.detailPanel && getActiveElement()) openDetailPanel(getActiveElement())
    if (state.detailPanelPosition) detailPanelDrag.applyPosition()
  }

  function handlePageVisibilityChange() {
    if (!state.enabled) return

    if (document.hidden) {
      hideTransientUi()
      return
    }

    renderSelectedOverlay()
  }

  function handleWindowBlur() {
    if (!state.enabled) return
    hideTransientUi()
  }

  function handleWindowFocus() {
    if (!state.enabled) return
    renderSelectedOverlay()
  }

  function handleLifecycleCleanup() {
    destroy()
  }

  function bindInspectListeners() {
    document.addEventListener('mousemove', inspectAtEvent, true)
    document.addEventListener('click', handleClick, true)
    document.addEventListener('dblclick', handleDoubleClick, true)
    window.addEventListener('scroll', handleViewportChange, true)
    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('blur', handleWindowBlur)
    window.addEventListener('focus', handleWindowFocus)
    document.addEventListener('visibilitychange', handlePageVisibilityChange)
  }

  function unbindInspectListeners() {
    document.removeEventListener('mousemove', inspectAtEvent, true)
    document.removeEventListener('click', handleClick, true)
    document.removeEventListener('dblclick', handleDoubleClick, true)
    window.removeEventListener('scroll', handleViewportChange, true)
    window.removeEventListener('resize', handleViewportChange)
    window.removeEventListener('blur', handleWindowBlur)
    window.removeEventListener('focus', handleWindowFocus)
    document.removeEventListener('visibilitychange', handlePageVisibilityChange)
  }

  function startHealthCheck() {
    if (state.healthCheckTimer) return

    state.healthCheckTimer = window.setInterval(() => {
      try {
        if (!chrome?.runtime?.id) destroy()
      } catch {
        destroy()
      }
    }, 3000)
  }

  function stopHealthCheck() {
    if (!state.healthCheckTimer) return
    window.clearInterval(state.healthCheckTimer)
    state.healthCheckTimer = null
  }

  function setMode(mode) {
    state.mode = mode === MODE.REVIEW ? MODE.REVIEW : MODE.INSPECT
  }

  function setEnabled(enabled) {
    if (state.enabled === enabled) return
    state.enabled = enabled

    if (enabled) {
      ensureUi()
      bindInspectListeners()
      showToast(state.mode === MODE.INSPECT ? 'Inspect mode on' : 'Review mode coming soon')
      return
    }

    unbindInspectListeners()
    detailPanelDrag.stop()
    state.hoveredElement = null
    state.selectedElement = null
    state.lastPointerEvent = null
    hideUi()
  }

  function destroy() {
    stopHealthCheck()
    detailPanelDrag.stop()
    unbindInspectListeners()
    document.removeEventListener('keydown', handleKeyDown, true)
    document.removeEventListener('click', handleUiClick, true)
    window.removeEventListener('pagehide', handleLifecycleCleanup)
    window.removeEventListener('beforeunload', handleLifecycleCleanup)
    state.enabled = false
    state.hoveredElement = null
    state.selectedElement = null
    state.lastPointerEvent = null
    window.clearTimeout(showToast.timeout)
    hideUi()

    if (window[INSTANCE_KEY]?.state === state) {
      try {
        delete window[INSTANCE_KEY]
      } catch {
        window[INSTANCE_KEY] = null
      }
    }
  }

  document.addEventListener('keydown', handleKeyDown, true)
  document.addEventListener('click', handleUiClick, true)
  window.addEventListener('pagehide', handleLifecycleCleanup)
  window.addEventListener('beforeunload', handleLifecycleCleanup)
  startHealthCheck()

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === MESSAGE_TYPE.PING) {
      sendResponse({ ok: true })
      return true
    }

    if (message?.type === MESSAGE_TYPE.GET_STATE) {
      sendResponse({ enabled: state.enabled, mode: state.mode })
      return true
    }

    if (message?.type === MESSAGE_TYPE.TOGGLE) {
      setMode(message.mode || MODE.INSPECT)
      setEnabled(!state.enabled)
      sendResponse({ enabled: state.enabled, mode: state.mode })
      return true
    }

    if (message?.type === MESSAGE_TYPE.SET_ENABLED) {
      setMode(message.mode || MODE.INSPECT)
      setEnabled(!!message.enabled)
      sendResponse({ enabled: state.enabled, mode: state.mode })
      return true
    }

    return false
  })

  window[INSTANCE_KEY] = { setEnabled, setMode, destroy, state }
})()
