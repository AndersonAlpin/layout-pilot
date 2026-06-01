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
    draggablePanel
  } = window.LayoutPilotModules
  const { SHORTCUT } = constants
  const {
    createElement,
    px,
    getAnchoredTooltipPosition,
    getContainedTooltipPosition,
    getDistanceLabelPosition,
    getElementBandAlignment,
    getContainedRectPair,
    getContainedDistanceSegments,
    isLayoutPilotElement,
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
  const { consumeShortcut } = shortcuts
  const { renderDetailPanelContent } = detailPanel
  const { createDraggablePanel } = draggablePanel

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

  function createInspectMode(options = {}) {
    const {
      showToast,
      t,
      getElementAtPoint: getCustomElementAtPoint,
      mapElementInfo
    } = options
    const state = {
      enabled: false,
      hoveredElement: null,
      selectedElement: null,
      overlay: null,
      selectedOverlay: null,
      hitShield: null,
      tooltip: null,
      distanceLayer: null,
      detailPanel: null,
      lastPointerEvent: null,
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

    function ensureUi() {
      state.hitShield ||= createElement('layoutpilot-hit-shield')
      state.overlay ||= createElement('layoutpilot-overlay')
      state.selectedOverlay ||= createElement('layoutpilot-selected-overlay')
      state.tooltip ||= createElement('layoutpilot-tooltip')
      state.distanceLayer ||= createElement('layoutpilot-distance-layer')
    }

    function ensureDetailPanel() {
      state.detailPanel ||= createElement('layoutpilot-detail-panel')
      return state.detailPanel
    }

    function removeElement(key) {
      if (state[key]) {
        state[key].remove()
        state[key] = null
      }
    }

    function hideTransientUi() {
      for (const element of [state.overlay, state.selectedOverlay, state.tooltip, state.distanceLayer]) {
        if (element) element.style.display = 'none'
      }
    }

    function hideUi() {
      for (const key of ['hitShield', 'overlay', 'selectedOverlay', 'tooltip', 'distanceLayer', 'detailPanel']) {
        removeElement(key)
      }
      state.hoveredElement = null
      state.selectedElement = null
      state.lastPointerEvent = null
    }

    function isOwnElement(element) {
      return isLayoutPilotElement(element)
    }

    function isInspectHitShieldTarget(element) {
      return element === state.hitShield
    }

    function isBlockedOwnTarget(element) {
      return isOwnElement(element) && !isInspectHitShieldTarget(element)
    }

    function getElementAtPoint(event) {
      const customElement = getCustomElementAtPoint?.(event)
      if (customElement !== undefined) return customElement

      const elements = document.elementsFromPoint(event.clientX, event.clientY)
      return elements.find(element => element instanceof Element && !isOwnElement(element) && element !== document.documentElement && element !== document.body) || null
    }

    function getElementInfo(element) {
      const info = collectElementInfo(element)
      return mapElementInfo?.(info, element) || info
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

    function formatAlignmentText(alignment) {
      if (!alignment) return ''
      if (alignment.direction === 'aligned') return t('tooltip.alignment.aligned')
      if (alignment.direction === 'above') return t('tooltip.alignment.above', { offset: alignment.offset })
      if (alignment.direction === 'below') return t('tooltip.alignment.below', { offset: alignment.offset })
      if (alignment.direction === 'left') return t('tooltip.alignment.left', { offset: alignment.offset })
      if (alignment.direction === 'right') return t('tooltip.alignment.right', { offset: alignment.offset })
      return t('tooltip.alignment.misaligned')
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

    function positionTooltip(event, elementRect, options = {}) {
      state.tooltip.style.display = 'block'
      state.tooltip.style.visibility = 'hidden'
      state.tooltip.style.left = '0px'
      state.tooltip.style.top = '0px'

      const tooltipRect = state.tooltip.getBoundingClientRect()
      const pointer = { x: event.clientX, y: event.clientY }
      const viewport = { width: window.innerWidth, height: window.innerHeight }
      const position = options.containedInnerRect
        ? getContainedTooltipPosition(pointer, options.containedInnerRect, tooltipRect, viewport)
        : getAnchoredTooltipPosition(pointer, elementRect, tooltipRect, viewport)

      state.tooltip.style.left = px(position.left)
      state.tooltip.style.top = px(position.top)
      state.tooltip.style.visibility = 'visible'
    }

    function renderTooltip(event, element, info = getElementInfo(element)) {
      const selectedInfo = state.selectedElement?.isConnected ? getElementInfo(state.selectedElement) : null
      const selectedRect = selectedInfo?.rect || null
      const containedPair = selectedRect && state.selectedElement !== element ? getContainedRectPair(selectedRect, info.rect) : null
      const containedSegments = containedPair ? getContainedDistanceSegments(selectedRect, info.rect) : null
      const spacing = selectedRect && state.selectedElement !== element && !containedSegments ? getSpacingBetween(selectedRect, info.rect) : null
      const alignment = selectedRect && state.selectedElement !== element && !containedSegments
        ? getElementBandAlignment(selectedRect, info.rect, { baseInfo: selectedInfo, targetInfo: info })
        : null
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
          ${alignment ? `
            <span class="layoutpilot-label">${escapeHtml(t('tooltip.alignment.label'))}</span>
            <span class="layoutpilot-value ${alignment.aligned ? 'layoutpilot-alignment-ok' : 'layoutpilot-alignment-miss'}">${escapeHtml(formatAlignmentText(alignment))}</span>
          ` : ''}
        </div>
        <div class="layoutpilot-divider"></div>
        <div class="layoutpilot-help">${escapeHtml(isPinned ? t('tooltip.clickToUnpin') : t('tooltip.clickToPin'))} ${escapeHtml(t('tooltip.help'))}</div>
      `

      positionTooltip(event, info.rect, { containedInnerRect: containedPair?.innerRect })
    }

    function renderSelectedOverlay() {
      if (!state.selectedElement?.isConnected) {
        state.selectedElement = null
        if (state.selectedOverlay) state.selectedOverlay.style.display = 'none'
        return
      }

      ensureUi()
      setBox(state.selectedOverlay, getElementInfo(state.selectedElement).rect)
    }

    function addDistanceLine(className, left, top, width, height, label, options = {}) {
      const line = document.createElement('div')
      line.className = `layoutpilot-distance-line ${className}`
      if (options.aligned) line.classList.add('layoutpilot-distance-line--aligned')
      line.style.left = px(left)
      line.style.top = px(top)
      line.style.width = px(width)
      line.style.height = px(height)
      state.distanceLayer.appendChild(line)

      const labelElement = document.createElement('div')
      labelElement.className = `layoutpilot-distance-label layoutpilot-distance-label--${className}`
      if (options.aligned) labelElement.classList.add('layoutpilot-distance-label--aligned')
      labelElement.textContent = label
      state.distanceLayer.appendChild(labelElement)

      const labelPosition = getDistanceLabelPosition(
        className,
        { left, top, width, height },
        labelElement.getBoundingClientRect(),
        { width: window.innerWidth, height: window.innerHeight }
      )

      labelElement.classList.add(`layoutpilot-distance-label--${labelPosition.placement}`)
      labelElement.style.left = px(labelPosition.left)
      labelElement.style.top = px(labelPosition.top)
    }

    function renderDistances(element, targetInfo = getElementInfo(element)) {
      ensureUi()
      state.distanceLayer.innerHTML = ''

      if (!state.selectedElement?.isConnected || state.selectedElement === element) {
        state.distanceLayer.style.display = 'none'
        return
      }

      const selectedInfo = getElementInfo(state.selectedElement)
      const a = selectedInfo.rect
      const b = targetInfo.rect
      const containedSegments = getContainedDistanceSegments(a, b)
      if (containedSegments) {
        for (const segment of containedSegments) {
          addDistanceLine(segment.orientation, segment.left, segment.top, segment.width, segment.height, `${segment.distance}px`)
        }
        state.distanceLayer.style.display = containedSegments.length ? 'block' : 'none'
        return
      }

      const spacing = getSpacingBetween(a, b)
      const alignment = getElementBandAlignment(a, b, {
        baseInfo: selectedInfo,
        targetInfo,
        includeReference: true
      })
      let hasDistance = false

      if (spacing.horizontal > 0) {
        const left = b.left > a.right ? a.right : b.right
        const right = b.left > a.right ? b.left : a.left
        const referenceY = alignment?.axis === 'y' ? alignment.reference : a.top + a.height / 2
        const y = Math.max(Math.min(referenceY, b.bottom), b.top)
        addDistanceLine('horizontal', left, y, right - left, 2, `${spacing.horizontal}px`, { aligned: alignment?.aligned })
        hasDistance = true
      }

      if (spacing.vertical > 0) {
        const top = b.top > a.bottom ? a.bottom : b.bottom
        const bottom = b.top > a.bottom ? b.top : a.top
        const referenceX = alignment?.axis === 'x' ? alignment.reference : a.left + a.width / 2
        const x = Math.max(Math.min(referenceX, b.right), b.left)
        addDistanceLine('vertical', x, top, 2, bottom - top, `${spacing.vertical}px`, { aligned: alignment?.aligned })
        hasDistance = true
      }

      state.distanceLayer.style.display = hasDistance ? 'block' : 'none'
    }

    function openDetailPanel(element = getActiveElement()) {
      if (!element?.isConnected) {
        showToast?.(t('toast.noElement'))
        return
      }

      state.selectedElement = element
      renderSelectedOverlay()

      const info = getElementInfo(element)
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

    function copyAiContext(element = getActiveElement()) {
      if (!element?.isConnected) {
        showToast?.(t('toast.noElement'))
        return
      }
      copyText(createTranslatedCompactContext(getElementInfo(element)), 'Simple context', showToast, {
        success: t('toast.copied.simpleContext'),
        failure: t('toast.copyFailed')
      })
    }

    function copyFullAiContext(element = getActiveElement()) {
      if (!element?.isConnected) {
        showToast?.(t('toast.noElement'))
        return
      }
      copyText(createTranslatedFullContext(getElementInfo(element)), 'Full context', showToast, {
        success: t('toast.copied.fullContext'),
        failure: t('toast.copyFailed')
      })
    }

    function copySelector(element = getActiveElement()) {
      if (!element?.isConnected) {
        showToast?.(t('toast.noElement'))
        return
      }
      copyText(getElementInfo(element).selector, 'Selector', showToast, {
        success: t('toast.copied.selector'),
        failure: t('toast.copyFailed')
      })
    }

    function copyCssSummary(element = getActiveElement()) {
      if (!element?.isConnected) {
        showToast?.(t('toast.noElement'))
        return
      }
      copyText(createCssSummary(getElementInfo(element)), 'CSS/layout summary', showToast, {
        success: t('toast.copied.cssLayout'),
        failure: t('toast.copyFailed')
      })
    }

    function inspectAtEvent(event) {
      if (!state.enabled || isBlockedOwnTarget(event.target)) return

      const element = getElementAtPoint(event)
      if (!element) return

      state.hoveredElement = element
      state.lastPointerEvent = event
      ensureUi()
      const info = getElementInfo(element)
      setBox(state.overlay, info.rect)
      renderSelectedOverlay()
      renderDistances(element, info)
      renderTooltip(event, element, info)
    }

    function togglePin(element = getActiveElement()) {
      if (!element?.isConnected) {
        showToast?.(t('toast.noElement'))
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
        showToast?.(t('toast.elementUnpinned'))
        return
      }

      state.selectedElement = element
      renderSelectedOverlay()
      renderDistances(element)
      if (state.detailPanel) openDetailPanel(element)
      showToast?.(t('toast.elementPinned'))
    }

    function handleClick(event) {
      if (!state.enabled) return
      if (isBlockedOwnTarget(event.target)) return

      const element = getElementAtPoint(event)
      if (!element) return

      event.preventDefault()
      event.stopPropagation()

      if (event.detail > 1) return
      togglePin(element)
      if (state.lastPointerEvent) renderTooltip(state.lastPointerEvent, element)
    }

    function handleDoubleClick(event) {
      if (!state.enabled) return
      if (isBlockedOwnTarget(event.target)) return

      const element = getElementAtPoint(event)
      if (!element) return

      event.preventDefault()
      event.stopPropagation()
      state.selectedElement = element
      openDetailPanel(element)
    }

    function handleUiClick(event) {
      const action = event.target?.closest?.('[data-layoutpilot-action]')?.dataset?.layoutpilotAction
      if (!action) return false

      if (action === 'close-detail') closeDetailPanel()
      if (action === 'copy-ai') copyAiContext()
      if (action === 'copy-ai-full') copyFullAiContext()
      if (action === 'copy-selector') copySelector()
      if (action === 'copy-css') copyCssSummary()

      return ['close-detail', 'copy-ai', 'copy-ai-full', 'copy-selector', 'copy-css'].includes(action)
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

    function bindListeners() {
      document.addEventListener('mousemove', inspectAtEvent, true)
      document.addEventListener('click', handleClick, true)
      document.addEventListener('dblclick', handleDoubleClick, true)
      window.addEventListener('scroll', handleViewportChange, true)
      window.addEventListener('resize', handleViewportChange)
      window.addEventListener('blur', handleWindowBlur)
      window.addEventListener('focus', handleWindowFocus)
      document.addEventListener('visibilitychange', handlePageVisibilityChange)
    }

    function unbindListeners() {
      document.removeEventListener('mousemove', inspectAtEvent, true)
      document.removeEventListener('click', handleClick, true)
      document.removeEventListener('dblclick', handleDoubleClick, true)
      window.removeEventListener('scroll', handleViewportChange, true)
      window.removeEventListener('resize', handleViewportChange)
      window.removeEventListener('blur', handleWindowBlur)
      window.removeEventListener('focus', handleWindowFocus)
      document.removeEventListener('visibilitychange', handlePageVisibilityChange)
    }

    function start() {
      if (state.enabled) return
      state.enabled = true
      ensureUi()
      bindListeners()
      showToast?.(t('toast.inspectOn'))
    }

    function stop() {
      if (!state.enabled) return
      state.enabled = false
      unbindListeners()
      detailPanelDrag.stop()
      hideUi()
    }

    function destroy() {
      unbindListeners()
      detailPanelDrag.stop()
      state.enabled = false
      hideUi()
    }

    function handleKeyDown(event, normalizedKey) {
      if (!state.enabled) return false

      if (normalizedKey === SHORTCUT.CANCEL) {
        if (state.detailPanel) {
          closeDetailPanel()
          return true
        }
        if (state.selectedElement) {
          togglePin(state.selectedElement)
          return true
        }
        return false
      }

      if (normalizedKey === SHORTCUT.COPY_CONTEXT) {
        copyAiContext()
        return true
      }

      if (normalizedKey === SHORTCUT.DETAILS) {
        toggleDetailPanel()
        return true
      }

      if (normalizedKey === SHORTCUT.PIN) {
        togglePin(getPinShortcutElement())
        return true
      }

      return false
    }

    function refreshLanguage() {
      if (state.detailPanel && getActiveElement()) openDetailPanel(getActiveElement())
      if (state.lastPointerEvent && state.hoveredElement?.isConnected) {
        renderTooltip(state.lastPointerEvent, state.hoveredElement)
      }
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

  window.LayoutPilotModules.inspectMode = {
    createInspectMode
  }
})()
