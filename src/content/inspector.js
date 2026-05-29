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
    reviewMode,
    ui,
    i18n
  } = window.LayoutPilotModules
  const { INSTANCE_KEY, MODE, MESSAGE_TYPE, SHORTCUT, SHORTCUTS_BY_MODE, UI_SELECTOR } = constants
  const {
    createElement,
    px,
    getAnchoredTooltipPosition,
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
  const { createReviewMode } = reviewMode
  const { renderCloseButton, renderShortcutList } = ui
  const {
    loadLanguagePreference,
    setCurrentLanguage,
    resolveLanguage,
    t
  } = i18n

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

  const reviewController = createReviewMode({
    showToast,
    t
  })

  const TECHNICAL_TOOLTIP_LABEL = {
    size: 'Size',
    position: 'Position',
    padding: 'Padding',
    margin: 'Margin',
    layout: 'Layout',
    lineHeight: 'Line height',
    font: 'Font',
    color: 'Color',
    background: 'Background',
    border: 'Border',
    classes: 'Classes',
    spacing: 'Spacing'
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

  loadLanguagePreference().then(() => {
    refreshTranslatedUi()
  })

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

  function hideInspectUi() {
    for (const key of ['overlay', 'selectedOverlay', 'tooltip', 'distanceLayer', 'detailPanel']) {
      removeElement(key)
    }
    state.hoveredElement = null
    state.selectedElement = null
    state.lastPointerEvent = null
  }

  function hasLayoutPilotClass(element) {
    return element instanceof Element &&
      Array.from(element.classList || []).some(className => className.startsWith('layoutpilot-'))
  }

  function isOwnElement(element) {
    if (!(element instanceof Element)) return false
    return hasLayoutPilotClass(element) || !!element.closest?.('[class*="layoutpilot-"]')
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

  function getHelpShortcuts() {
    const shortcuts = SHORTCUTS_BY_MODE[state.mode] || SHORTCUTS_BY_MODE[MODE.INSPECT]
    return shortcuts.map(shortcut => ({
      key: shortcut.key,
      label: t(shortcut.labelKey)
    }))
  }

  function getHelpNote() {
    return state.mode === MODE.REVIEW ? t('help.note.review') : t('help.note.inspect')
  }

  function getContextPrompt() {
    return {
      issueTitle: t('context.issue.title'),
      issuePlaceholder: t('context.issue.placeholder'),
      requestTitle: t('context.request.title'),
      compactRequest: t('context.request.compact'),
      fullRequest: t('context.request.full')
    }
  }

  function createTranslatedCompactContext(info) {
    return createCompactAiContext(info, { prompt: getContextPrompt() })
  }

  function createTranslatedFullContext(info) {
    return createAiContext(info, { prompt: getContextPrompt() })
  }

  function refreshTranslatedUi() {
    reviewController.refreshLanguage()
    if (state.helpPanel) renderHelpPanel()
    if (state.detailPanel && getActiveElement()) openDetailPanel(getActiveElement())
    if (state.lastPointerEvent && state.hoveredElement?.isConnected) {
      renderTooltip(state.lastPointerEvent, state.hoveredElement)
    }
  }

  function positionTooltip(event, elementRect) {
    state.tooltip.style.display = 'block'
    state.tooltip.style.visibility = 'hidden'
    state.tooltip.style.left = '0px'
    state.tooltip.style.top = '0px'

    const tooltipRect = state.tooltip.getBoundingClientRect()
    const position = getAnchoredTooltipPosition(
      { x: event.clientX, y: event.clientY },
      elementRect,
      tooltipRect,
      { width: window.innerWidth, height: window.innerHeight }
    )

    state.tooltip.style.left = px(position.left)
    state.tooltip.style.top = px(position.top)
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
        <span class="layoutpilot-label">${TECHNICAL_TOOLTIP_LABEL.size}</span>
        <span class="layoutpilot-value">${info.width} x ${info.height}px</span>
        <span class="layoutpilot-label">${TECHNICAL_TOOLTIP_LABEL.position}</span>
        <span class="layoutpilot-value">x ${info.x}, y ${info.y}</span>
        <span class="layoutpilot-label">${TECHNICAL_TOOLTIP_LABEL.padding}</span>
        <span class="layoutpilot-value">${escapeHtml(info.padding)}</span>
        <span class="layoutpilot-label">${TECHNICAL_TOOLTIP_LABEL.margin}</span>
        <span class="layoutpilot-value">${escapeHtml(info.margin)}</span>
        <span class="layoutpilot-label">${TECHNICAL_TOOLTIP_LABEL.layout}</span>
        <span class="layoutpilot-value">${escapeHtml(layoutExtra)}</span>
        <span class="layoutpilot-label layoutpilot-line-label">${TECHNICAL_TOOLTIP_LABEL.lineHeight}</span>
        <span class="layoutpilot-value layoutpilot-line-value">${escapeHtml(formatLineHeightText(info))}</span>
        <span class="layoutpilot-label">${TECHNICAL_TOOLTIP_LABEL.font}</span>
        <span class="layoutpilot-value">${escapeHtml(`${info.fontSize} ${info.fontFamily}`)}</span>
        <span class="layoutpilot-label">${TECHNICAL_TOOLTIP_LABEL.color}</span>
        <span class="layoutpilot-value">${formatColorMarkup(info.color)}</span>
        ${info.background !== '—' ? `
          <span class="layoutpilot-label">${TECHNICAL_TOOLTIP_LABEL.background}</span>
          <span class="layoutpilot-value">${formatColorMarkup(info.background)}</span>
        ` : ''}
        ${info.borderColors.length ? `
          <span class="layoutpilot-label">${TECHNICAL_TOOLTIP_LABEL.border}</span>
          <span class="layoutpilot-value">${formatColorsMarkup(info.borderColors)}</span>
        ` : ''}
        <span class="layoutpilot-label">${TECHNICAL_TOOLTIP_LABEL.classes}</span>
        <span class="layoutpilot-value layoutpilot-code">${escapeHtml(info.classes)}</span>
        ${spacing ? `
          <span class="layoutpilot-label">${TECHNICAL_TOOLTIP_LABEL.spacing}</span>
          <span class="layoutpilot-value">H ${spacing.horizontal}px - V ${spacing.vertical}px</span>
        ` : ''}
      </div>
      <div class="layoutpilot-divider"></div>
      <div class="layoutpilot-help">${escapeHtml(isPinned ? t('tooltip.clickToUnpin') : t('tooltip.clickToPin'))} ${escapeHtml(t('tooltip.help'))}</div>
    `

    positionTooltip(event, info.rect)
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
      showToast(t('toast.noElement'))
      return
    }

    state.selectedElement = element
    renderSelectedOverlay()

    const info = collectElementInfo(element)
    const panel = ensureDetailPanel()
    panel.innerHTML = renderDetailPanelContent(info, {
      createCompactContext: createTranslatedCompactContext,
      formatColorMarkup,
      t
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
        <strong>${escapeHtml(t('help.title'))}</strong>
        ${renderCloseButton({ action: 'close-help', label: t('help.close') })}
      </div>
      ${renderShortcutList(getHelpShortcuts())}
      <p>${escapeHtml(getHelpNote())}</p>
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
      showToast(t('toast.noElement'))
      return
    }
    copyText(createTranslatedCompactContext(collectElementInfo(element)), 'Simple context', showToast, {
      success: t('toast.copied.simpleContext'),
      failure: t('toast.copyFailed')
    })
  }

  function copyFullAiContext(element = getActiveElement()) {
    if (!element?.isConnected) {
      showToast(t('toast.noElement'))
      return
    }
    copyText(createTranslatedFullContext(collectElementInfo(element)), 'Full context', showToast, {
      success: t('toast.copied.fullContext'),
      failure: t('toast.copyFailed')
    })
  }

  function copySelector(element = getActiveElement()) {
    if (!element?.isConnected) {
      showToast(t('toast.noElement'))
      return
    }
    copyText(collectElementInfo(element).selector, 'Selector', showToast, {
      success: t('toast.copied.selector'),
      failure: t('toast.copyFailed')
    })
  }

  function copyCssSummary(element = getActiveElement()) {
    if (!element?.isConnected) {
      showToast(t('toast.noElement'))
      return
    }
    copyText(createCssSummary(collectElementInfo(element)), 'CSS/layout summary', showToast, {
      success: t('toast.copied.cssLayout'),
      failure: t('toast.copyFailed')
    })
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
      showToast(t('toast.noElement'))
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
      showToast(t('toast.elementUnpinned'))
      return
    }

    state.selectedElement = element
    renderSelectedOverlay()
    renderDistances(element)
    if (state.detailPanel) openDetailPanel(element)
    showToast(t('toast.elementPinned'))
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

    if (state.enabled && state.mode === MODE.REVIEW && reviewController.blocksGlobalShortcuts?.()) {
      consumeShortcut(event)
      reviewController.handleKeyDown(event, normalized)
      return
    }

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
      if (state.enabled) {
        setEnabled(false)
        return
      }
      setMode(MODE.INSPECT)
      setEnabled(true)
      return
    }

    if (normalized === SHORTCUT.CANCEL && state.helpPanel) {
      consumeShortcut(event)
      removeElement('helpPanel')
      return
    }

    if (!state.enabled) return

    if (state.mode === MODE.REVIEW) {
      if (reviewController.handleKeyDown(event, normalized)) {
        consumeShortcut(event)
        return
      }

      if (normalized === SHORTCUT.CANCEL) {
        consumeShortcut(event)
      }
      return
    }

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

  function startMode(mode) {
    if (mode === MODE.REVIEW) {
      reviewController.start()
      return
    }

    ensureUi()
    bindInspectListeners()
    showToast(t('toast.inspectOn'))
  }

  function stopMode(mode) {
    if (mode === MODE.REVIEW) {
      reviewController.stop()
      return
    }

    unbindInspectListeners()
    detailPanelDrag.stop()
    hideInspectUi()
  }

  function setMode(mode) {
    const nextMode = mode === MODE.REVIEW ? MODE.REVIEW : MODE.INSPECT
    if (state.mode === nextMode) return

    const previousMode = state.mode
    if (state.enabled) stopMode(previousMode)

    state.mode = nextMode

    if (state.enabled) startMode(state.mode)
    if (state.helpPanel) renderHelpPanel()
  }

  function setEnabled(enabled) {
    if (state.enabled === enabled) return
    state.enabled = enabled

    if (enabled) {
      startMode(state.mode)
      return
    }

    stopMode(state.mode)
    removeElement('helpPanel')
    removeElement('toast')
    cleanupOrphanUi()
  }

  function destroy() {
    stopHealthCheck()
    reviewController.destroy()
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

    if (message?.type === MESSAGE_TYPE.SET_LANGUAGE) {
      setCurrentLanguage(message.language || resolveLanguage(message.preference), message.preference)
      refreshTranslatedUi()
      sendResponse({ ok: true })
      return true
    }

    return false
  })

  window[INSTANCE_KEY] = { setEnabled, setMode, destroy, state }
})()
