(() => {
  const root = window.LayoutPilotModules ||= {}
  const { SHORTCUT } = root.constants
  const {
    createReviewState,
    clearReviewState,
    resetReviewState,
    addAnnotation,
    addAreaMark,
    getAreaMark,
    removeAreaMark,
    startPenStroke,
    appendPenStrokePoint,
    finishPenStroke,
    cancelPenStroke,
    removePenStroke,
    getSelectedAnnotation,
    selectAnnotation,
    setHighlightedAnnotation,
    toggleHighlightedAnnotation,
    startEditingAnnotation,
    updateEditingNote,
    hasUnsavedEditingChanges,
    saveEditingAnnotation,
    cancelEditingAnnotation,
    setDraftAnnotation,
    updateDraftNote,
    clearDraftAnnotation,
    removeAnnotation
  } = root.reviewState
  const { createElement, escapeHtml } = root.dom
  const { icon } = root.icons
  const { collectElementInfo } = root.elementInspector
  const { createDraggablePanel } = root.draggablePanel
  const { getAnnotationViewportRect, renderReviewAnnotationBoxes, renderReviewMarkers } = root.reviewMarkers
  const { renderReviewPanel, renderClearReviewDialog } = root.reviewPanel
  const { renderReviewToolbar } = root.reviewToolbar
  const { downloadReviewSnapshot, copyReviewSnapshot } = root.reviewSnapshot
  const { generateReviewPrintReport } = root.reviewPrintReport

  function createReviewMode(options = {}) {
    const {
      showToast,
      t = key => key
    } = options
    const state = createReviewState()
    let suppressNextPageClick = false
    let toolbarAutoHideTimer = null
    let penToolsHideTimer = null
    const MIN_AREA_SELECTION_SIZE = 2
    const MIN_PEN_POINT_DISTANCE = 2
    const AREA_MARK_TOOLS_WIDTH = 64
    const AREA_MARK_TOOLS_HEIGHT = 30
    const PEN_STROKE_TOOLS_SIZE = 30
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
    const toolbarDrag = createDraggablePanel({
      getPanel: () => state.toolbar,
      getPosition: () => state.toolbarPosition,
      setPosition: position => {
        state.toolbarPosition = position
      },
      getDrag: () => state.toolbarDrag,
      setDrag: drag => {
        state.toolbarDrag = drag
      }
    })

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
      return elements.find(element =>
        element instanceof Element &&
        !isOwnElement(element) &&
        element !== document.documentElement &&
        element !== document.body
      ) || null
    }

    function isDisabledLike(element) {
      return Boolean(
        element?.disabled ||
        element?.readOnly ||
        element?.getAttribute?.('aria-disabled') === 'true'
      )
    }

    function isEditableTypingTarget(target) {
      if (!(target instanceof Element)) return false

      const field = target.closest?.('input, textarea, select, [contenteditable="true"], [role="textbox"]')
      if (!field || isOwnElement(field)) return false
      if (isDisabledLike(field)) return false

      return true
    }

    function lockPageScroll() {
      if (state.scrollLock) return

      const doc = document.documentElement
      const body = document.body
      state.scrollLock = {
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        documentOverflow: doc.style.overflow,
        documentOverscrollBehavior: doc.style.overscrollBehavior,
        bodyOverflow: body?.style?.overflow || '',
        bodyOverscrollBehavior: body?.style?.overscrollBehavior || ''
      }

      doc.style.overflow = 'hidden'
      doc.style.overscrollBehavior = 'none'
      if (body) {
        body.style.overflow = 'hidden'
        body.style.overscrollBehavior = 'none'
      }
    }

    function unlockPageScroll() {
      if (!state.scrollLock) return

      const doc = document.documentElement
      const body = document.body
      const scrollLock = state.scrollLock
      doc.style.overflow = scrollLock.documentOverflow
      doc.style.overscrollBehavior = scrollLock.documentOverscrollBehavior
      if (body) {
        body.style.overflow = scrollLock.bodyOverflow
        body.style.overscrollBehavior = scrollLock.bodyOverscrollBehavior
      }
      window.scrollTo(scrollLock.scrollX, scrollLock.scrollY)
      state.scrollLock = null
    }

    function shouldAllowReviewUiScroll(target) {
      return target instanceof Element && isOwnElement(target)
    }

    function isReviewInteractiveUiTarget(target) {
      return target instanceof Element && Boolean(target.closest?.([
        '.layoutpilot-review-panel',
        '.layoutpilot-review-toolbar',
        '.layoutpilot-review-confirm',
        '.layoutpilot-toast'
      ].join(',')))
    }

    function handleScrollLockWheel(event) {
      if (!state.enabled) return
      if (shouldAllowReviewUiScroll(event.target)) return

      event.preventDefault()
      event.stopPropagation()
    }

    function handleScrollLockTouchMove(event) {
      if (!state.enabled) return
      if (shouldAllowReviewUiScroll(event.target)) return

      event.preventDefault()
      event.stopPropagation()
    }

    function handleContextMenu(event) {
      if (!state.enabled) return
      if (isReviewInteractiveUiTarget(event.target)) return

      event.preventDefault()
      event.stopPropagation()
    }

    function handleScrollLockKeyDown(event) {
      if (!state.enabled) return
      if (shouldAllowReviewUiScroll(event.target) || isEditableTypingTarget(event.target)) return

      const scrollKeys = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End', ' '])
      if (!scrollKeys.has(event.key)) return

      event.preventDefault()
      event.stopPropagation()
    }

    function ensureMarkerLayer() {
      state.markerLayer ||= createElement('layoutpilot-review-marker-layer')
      return state.markerLayer
    }

    function ensureHitLayer() {
      state.overlay ||= createElement('layoutpilot-review-hit-layer')
      return state.overlay
    }

    function ensureAnnotationLayer() {
      state.annotationLayer ||= createElement('layoutpilot-review-annotation-layer')
      return state.annotationLayer
    }

    function ensureAreaMarkLayer() {
      state.areaMarkLayer ||= createElement('layoutpilot-review-area-mark-layer')
      return state.areaMarkLayer
    }

    function ensurePenLayer() {
      state.penLayer ||= createElement('layoutpilot-review-pen-layer')
      return state.penLayer
    }

    function ensureHoverOverlay() {
      state.hoverOverlay ||= createElement('layoutpilot-review-hover')
      return state.hoverOverlay
    }

    function ensurePanel() {
      state.panel ||= createElement('layoutpilot-review-panel')
      return state.panel
    }

    function ensureToolbar() {
      state.toolbar ||= createElement('layoutpilot-review-toolbar')
      return state.toolbar
    }

    function ensureSelectionBox() {
      state.selectionBox ||= createElement('layoutpilot-review-selection-box')
      return state.selectionBox
    }

    function ensureConfirmDialog() {
      state.confirmDialog ||= createElement('layoutpilot-review-confirm')
      return state.confirmDialog
    }

    function buildElementAnnotation(element) {
      const info = collectElementInfo(element)
      const rect = info.rect

      return {
        type: 'element',
        note: '',
        createdAt: new Date().toISOString(),
        element,
        page: {
          url: location.href,
          title: document.title || '—'
        },
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
          scrollX: Math.round(window.scrollX),
          scrollY: Math.round(window.scrollY),
          devicePixelRatio: window.devicePixelRatio || 1
        },
        target: {
          selector: info.selector,
          name: info.name,
          tag: info.tag,
          classes: info.classes,
          text: info.text,
          disabled: Boolean(element.disabled),
          readonly: Boolean(element.readOnly),
          ariaDisabled: element.getAttribute?.('aria-disabled') || ''
        },
        rect: {
          viewport: {
            x: info.x,
            y: info.y,
            width: info.width,
            height: info.height
          },
          page: {
            x: Math.round(rect.left + window.scrollX),
            y: Math.round(rect.top + window.scrollY),
            width: info.width,
            height: info.height
          }
        }
      }
    }

    function buildAreaAnnotation(rect) {
      return {
        type: 'area',
        note: '',
        createdAt: new Date().toISOString(),
        page: {
          url: location.href,
          title: document.title || '—'
        },
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
          scrollX: Math.round(window.scrollX),
          scrollY: Math.round(window.scrollY),
          devicePixelRatio: window.devicePixelRatio || 1
        },
        target: {
          selector: '',
          name: 'Area',
          tag: '',
          classes: [],
          text: ''
        },
        rect: {
          viewport: {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          },
          page: {
            x: Math.round(rect.x + window.scrollX),
            y: Math.round(rect.y + window.scrollY),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          }
        }
      }
    }

    function buildAreaMark(rect) {
      return {
        createdAt: new Date().toISOString(),
        rect: {
          viewport: {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          },
          page: {
            x: Math.round(rect.x + window.scrollX),
            y: Math.round(rect.y + window.scrollY),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          }
        }
      }
    }

    function buildPenPoint(event) {
      return {
        x: Math.round(event.clientX + window.scrollX),
        y: Math.round(event.clientY + window.scrollY)
      }
    }

    function getAreaMarkViewportRect(mark) {
      if (mark?.rect?.page) {
        return {
          x: Math.round(mark.rect.page.x - window.scrollX),
          y: Math.round(mark.rect.page.y - window.scrollY),
          width: mark.rect.page.width,
          height: mark.rect.page.height
        }
      }

      return mark?.rect?.viewport || { x: 0, y: 0, width: 0, height: 0 }
    }

    function getAreaMarkToolsStyle(rect) {
      const placeBelow = rect.y < AREA_MARK_TOOLS_HEIGHT + 8
      const alignLeft = rect.x < AREA_MARK_TOOLS_WIDTH - rect.width
      const alignRight = !alignLeft && rect.x + rect.width + AREA_MARK_TOOLS_WIDTH > window.innerWidth
      const vertical = placeBelow
        ? `top: ${Math.round(rect.height + 6)}px;`
        : `top: -${AREA_MARK_TOOLS_HEIGHT + 6}px;`
      const horizontal = alignRight
        ? 'right: -2px; left: auto;'
        : alignLeft
          ? 'left: -2px; right: auto;'
          : 'right: -2px; left: auto;'

      return `${vertical} ${horizontal}`
    }

    function getPenStrokeViewportPoints(stroke) {
      return (stroke?.points || []).map(point => ({
        x: Math.round(point.x - window.scrollX),
        y: Math.round(point.y - window.scrollY)
      }))
    }

    function getPenStrokePath(points) {
      if (!points.length) return ''
      return points.map((point, index) =>
        `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
      ).join(' ')
    }

    function getPenStrokeToolsPosition(points) {
      const origin = points[0] || { x: 0, y: 0 }
      const x = Math.max(4, Math.min(window.innerWidth - PEN_STROKE_TOOLS_SIZE - 4, origin.x + 8))
      const y = Math.max(4, Math.min(window.innerHeight - PEN_STROKE_TOOLS_SIZE - 4, origin.y - PEN_STROKE_TOOLS_SIZE - 6))
      return { x: Math.round(x), y: Math.round(y) }
    }

    function renderPenStrokes() {
      const layer = ensurePenLayer()
      const strokes = state.penStrokes || []
      if (!strokes.length) {
        clearPenToolsHideTimer()
        layer.innerHTML = ''
        return
      }

      const strokeItems = []
      const toolItems = []
      for (const stroke of strokes) {
        const points = getPenStrokeViewportPoints(stroke)
        if (!points.length) continue

        const toolsPosition = getPenStrokeToolsPosition(points)
        toolItems.push(renderPenStrokeTools(stroke.id, toolsPosition))

        if (points.length === 1) {
          const [point] = points
          strokeItems.push(`
            <g class="layoutpilot-review-pen-stroke-wrap" data-layoutpilot-review-pen-stroke-id="${escapeHtml(stroke.id)}">
              <circle class="layoutpilot-review-pen-dot" cx="${point.x}" cy="${point.y}" r="2.5"></circle>
              <circle class="layoutpilot-review-pen-hit-dot" cx="${point.x}" cy="${point.y}" r="10"></circle>
            </g>
          `)
          continue
        }

        const path = getPenStrokePath(points)
        strokeItems.push(`
          <g class="layoutpilot-review-pen-stroke-wrap" data-layoutpilot-review-pen-stroke-id="${escapeHtml(stroke.id)}">
            <path class="layoutpilot-review-pen-stroke" d="${path}"></path>
            <path class="layoutpilot-review-pen-hit-stroke" d="${path}"></path>
          </g>
        `)
      }

      layer.innerHTML = `
        <svg viewBox="0 0 ${window.innerWidth} ${window.innerHeight}">
          ${strokeItems.join('')}
          <g class="layoutpilot-review-pen-tools-layer">
            ${toolItems.join('')}
          </g>
        </svg>
      `

      layer.querySelectorAll('.layoutpilot-review-pen-stroke-wrap, .layoutpilot-review-pen-tools')
        .forEach(element => {
          const strokeId = element.dataset.layoutpilotReviewPenStrokeId
          element.addEventListener('pointerenter', () => showPenStrokeTools(strokeId))
          element.addEventListener('pointerleave', scheduleHidePenStrokeTools)
        })
    }

    function renderPenStrokeTools(strokeId, position) {
      return `
        <foreignObject
          class="layoutpilot-review-pen-tools"
          data-layoutpilot-review-pen-stroke-id="${escapeHtml(strokeId)}"
          x="${position.x}"
          y="${position.y}"
          width="${PEN_STROKE_TOOLS_SIZE}"
          height="${PEN_STROKE_TOOLS_SIZE}"
        >
          <button
            xmlns="http://www.w3.org/1999/xhtml"
            type="button"
            class="layoutpilot-review-pen-button layoutpilot-review-pen-button--danger"
            data-layoutpilot-action="review-remove-pen-stroke"
            data-layoutpilot-review-pen-stroke-id="${escapeHtml(strokeId)}"
            title="${escapeHtml(t('review.areaMark.remove'))}"
            aria-label="${escapeHtml(t('review.areaMark.remove'))}"
          >${icon('trash', 14)}</button>
        </foreignObject>
      `
    }

    function renderAreaMarks() {
      const layer = ensureAreaMarkLayer()

      layer.innerHTML = state.areaMarks.map(mark => {
        const rect = getAreaMarkViewportRect(mark)
        const toolsStyle = getAreaMarkToolsStyle(rect)
        return `
          <div
            class="layoutpilot-review-area-mark-wrap"
            data-layoutpilot-review-area-mark-id="${escapeHtml(mark.id)}"
            style="
              left: ${Math.round(rect.x)}px;
              top: ${Math.round(rect.y)}px;
              width: ${Math.round(rect.width)}px;
              height: ${Math.round(rect.height)}px;
            "
          >
            <div class="layoutpilot-review-area-mark" aria-hidden="true"></div>
            <div class="layoutpilot-review-area-mark-tools" style="${toolsStyle}">
              <button
                type="button"
                class="layoutpilot-review-area-mark-button"
                data-layoutpilot-action="review-comment-area-mark"
                data-layoutpilot-review-area-mark-id="${escapeHtml(mark.id)}"
                title="${escapeHtml(t('review.areaMark.comment'))}"
                aria-label="${escapeHtml(t('review.areaMark.comment'))}"
              >${icon('edit', 14)}</button>
              <button
                type="button"
                class="layoutpilot-review-area-mark-button layoutpilot-review-area-mark-button--danger"
                data-layoutpilot-action="review-remove-area-mark"
                data-layoutpilot-review-area-mark-id="${escapeHtml(mark.id)}"
                title="${escapeHtml(t('review.areaMark.remove'))}"
                aria-label="${escapeHtml(t('review.areaMark.remove'))}"
              >${icon('trash', 14)}</button>
            </div>
          </div>
        `
      }).join('')
    }

    function syncCanvasLayerTool() {
      const annotationLayer = ensureAnnotationLayer()
      const areaMarkLayer = ensureAreaMarkLayer()
      const penLayer = ensurePenLayer()
      const markerLayer = ensureMarkerLayer()

      annotationLayer.dataset.layoutpilotReviewTool = state.activeTool
      areaMarkLayer.dataset.layoutpilotReviewTool = state.activeTool
      penLayer.dataset.layoutpilotReviewTool = state.activeTool
      markerLayer.dataset.layoutpilotReviewTool = state.activeTool

      if (state.activeTool !== 'move') {
        clearPenToolsHideTimer()
      }
    }

    function renderAnnotations() {
      ensureAnnotationLayer()
      ensureMarkerLayer()
      syncCanvasLayerTool()
      renderAreaMarks()
      renderPenStrokes()
      renderReviewAnnotationBoxes(state)
      renderReviewMarkers(state)
    }

    function hideHoverPreview() {
      state.hoverElement = null
      if (state.hoverOverlay) state.hoverOverlay.style.display = 'none'
    }

    function renderHoverPreview(element) {
      if (!element?.isConnected) {
        hideHoverPreview()
        return
      }

      state.hoverElement = element
      const rect = element.getBoundingClientRect()
      const hover = ensureHoverOverlay()
      hover.style.display = 'block'
      hover.style.left = `${Math.round(rect.left)}px`
      hover.style.top = `${Math.round(rect.top)}px`
      hover.style.width = `${Math.round(rect.width)}px`
      hover.style.height = `${Math.round(rect.height)}px`
    }

    function getAreaSelectionRect(start, current) {
      const startX = Math.max(0, Math.min(window.innerWidth, start.x))
      const startY = Math.max(0, Math.min(window.innerHeight, start.y))
      const currentX = Math.max(0, Math.min(window.innerWidth, current.x))
      const currentY = Math.max(0, Math.min(window.innerHeight, current.y))
      const x = Math.min(startX, currentX)
      const y = Math.min(startY, currentY)

      return {
        x,
        y,
        width: Math.abs(currentX - startX),
        height: Math.abs(currentY - startY)
      }
    }

    function renderAreaSelection(rect) {
      const box = ensureSelectionBox()
      box.style.display = 'block'
      box.style.left = `${Math.round(rect.x)}px`
      box.style.top = `${Math.round(rect.y)}px`
      box.style.width = `${Math.round(rect.width)}px`
      box.style.height = `${Math.round(rect.height)}px`
    }

    function clearAreaSelection() {
      state.isSelectingArea = false
      state.pointerStart = null
      state.draftSelection = null
      if (state.selectionBox) state.selectionBox.style.display = 'none'
    }

    function cancelPenDrawing() {
      if (!state.isDrawingPen) return
      cancelPenStroke(state)
      renderPenStrokes()
    }

    function renderPanel() {
      const panel = ensurePanel()
      const previousRect = state.panelPosition ? panel.getBoundingClientRect() : null
      const previousBottomGap = previousRect?.height ? window.innerHeight - previousRect.bottom : null
      const shouldPreserveBottom = previousRect?.height && previousBottomGap < previousRect.top

      panel.classList.toggle('layoutpilot-review-panel--collapsed', Boolean(state.panelCollapsed))
      panel.innerHTML = renderReviewPanel(state, { t })
      panel.style.display = 'flex'
      if (shouldPreserveBottom) {
        const nextRect = panel.getBoundingClientRect()
        panelDrag.updatePosition(previousRect.left, window.innerHeight - previousBottomGap - nextRect.height)
      } else {
        panelDrag.applyPosition()
      }
      panel.querySelector('.layoutpilot-review-header')?.addEventListener('pointerdown', panelDrag.handleStart)
    }

    function focusPanelNote() {
      const field = state.panel?.querySelector?.('[data-layoutpilot-review-autofocus="true"]')
      if (!field) return

      field.focus?.({ preventScroll: true })
      const valueLength = typeof field.value === 'string' ? field.value.length : 0
      field.setSelectionRange?.(valueLength, valueLength)
    }

    function applyToolbarPosition() {
      const toolbar = ensureToolbar()
      if (state.toolbarPinned === false) {
        toolbar.style.left = '50%'
        toolbar.style.top = '-2px'
        toolbar.style.right = 'auto'
        toolbar.style.bottom = 'auto'
        toolbar.style.transform = 'translateX(-50%)'
        return
      }

      toolbar.style.right = 'auto'
      toolbar.style.bottom = 'auto'
      toolbar.style.transform = 'none'

      if (state.toolbarPosition) {
        toolbarDrag.applyPosition()
        return
      }

      toolbar.style.left = `${Math.max(14, Math.round((window.innerWidth - toolbar.offsetWidth) / 2))}px`
      toolbar.style.top = '18px'
    }

    function clearToolbarAutoHideTimer() {
      if (!toolbarAutoHideTimer) return
      clearTimeout(toolbarAutoHideTimer)
      toolbarAutoHideTimer = null
    }

    function clearPenToolsHideTimer() {
      if (!penToolsHideTimer) return
      clearTimeout(penToolsHideTimer)
      penToolsHideTimer = null
    }

    function showPenStrokeTools(strokeId) {
      if (state.activeTool !== 'move') return
      clearPenToolsHideTimer()
      state.penLayer?.querySelectorAll?.('.layoutpilot-review-pen-tools')
        .forEach(element => {
          element.classList.toggle(
            'layoutpilot-review-pen-tools--visible',
            element.dataset.layoutpilotReviewPenStrokeId === String(strokeId)
          )
        })
    }

    function scheduleHidePenStrokeTools() {
      clearPenToolsHideTimer()
      penToolsHideTimer = setTimeout(() => {
        state.penLayer?.querySelectorAll?.('.layoutpilot-review-pen-tools--visible')
          .forEach(element => element.classList.remove('layoutpilot-review-pen-tools--visible'))
        penToolsHideTimer = null
      }, 650)
    }

    function setToolbarAutoVisible(visible) {
      if (state.toolbarPinned !== false) return
      state.toolbarAutoVisible = visible
      state.toolbar?.classList.toggle('layoutpilot-review-toolbar--peek', visible)
    }

    function showToolbarTemporarily() {
      clearToolbarAutoHideTimer()
      setToolbarAutoVisible(true)
    }

    function scheduleToolbarAutoHide() {
      if (state.toolbarPinned !== false) return
      clearToolbarAutoHideTimer()
      toolbarAutoHideTimer = setTimeout(() => {
        state.toolbarAutoVisible = false
        state.toolbar?.classList.remove('layoutpilot-review-toolbar--peek')
        toolbarAutoHideTimer = null
      }, 1400)
    }

    function renderToolbar() {
      const toolbar = ensureToolbar()
      toolbar.classList.toggle('layoutpilot-review-toolbar--unpinned', state.toolbarPinned === false)
      toolbar.classList.toggle('layoutpilot-review-toolbar--peek', Boolean(state.toolbarAutoVisible))
      toolbar.innerHTML = renderReviewToolbar(state, { t })
      toolbar.style.display = 'block'
      applyToolbarPosition()
      toolbar.removeEventListener('pointerdown', toolbarDrag.handleStart)
      if (state.toolbarPinned !== false) {
        toolbar.addEventListener('pointerdown', toolbarDrag.handleStart)
      } else {
        toolbarDrag.stop()
      }
      toolbar.onpointerenter = showToolbarTemporarily
      toolbar.onfocusin = showToolbarTemporarily
      toolbar.onpointerleave = scheduleToolbarAutoHide
      toolbar.onfocusout = scheduleToolbarAutoHide
    }

    function showClearConfirmation() {
      const dialog = ensureConfirmDialog()
      dialog.innerHTML = renderClearReviewDialog(t)
      dialog.style.display = 'grid'
    }

    function hideClearConfirmation() {
      state.confirmDialog?.remove?.()
      state.confirmDialog = null
    }

    function renderUi({ panel = false, focusNote = false } = {}) {
      const hitLayer = ensureHitLayer()
      hitLayer.dataset.layoutpilotReviewTool = state.activeTool
      renderToolbar()
      renderAnnotations()
      if (panel || state.panel) renderPanel()
      if (focusNote) focusPanelNote()
    }

    function createDraftFromElement(element) {
      const existingAnnotation = findAnnotationForElement(element)
      if (existingAnnotation) {
        editAnnotation(existingAnnotation.id, { openPanel: true, scroll: false, focusNote: true })
        return existingAnnotation
      }

      if (state.draftAnnotation?.note?.trim()) {
        showToast?.(t('toast.draftHasNote'))
        return state.draftAnnotation
      }
      if (hasUnsavedEditingChanges(state)) {
        showToast?.(t('toast.editHasChanges'))
        return null
      }

      const draft = setDraftAnnotation(state, buildElementAnnotation(element))
      hideHoverPreview()
      renderUi({ panel: true, focusNote: true })
      showToast?.(t('toast.draftSelected'))
      return draft
    }

    function canReplaceDraft() {
      if (!state.draftAnnotation?.note?.trim()) return true
      showToast?.(t('toast.draftHasNote'))
      return false
    }

    function canSwitchEditing(annotationId) {
      if (!state.editingAnnotationId || state.editingAnnotationId === Number(annotationId)) return true
      if (!hasUnsavedEditingChanges(state)) return true

      showToast?.(t('toast.editHasChanges'))
      return false
    }

    function saveDraftAnnotation() {
      if (!state.draftAnnotation) return false

      const annotation = addAnnotation(state, state.draftAnnotation)
      renderUi({ panel: true })
      showToast?.(t('toast.annotationCreated', { id: annotation.id }))
      return true
    }

    function editAnnotation(annotationId, options = {}) {
      if (!canReplaceDraft()) return true
      if (!canSwitchEditing(annotationId)) return true

      clearDraftAnnotation(state)
      startEditingAnnotation(state, annotationId)
      if (options.openPanel) state.panelCollapsed = false
      if (options.scroll) {
        const annotation = getSelectedAnnotation(state)
        if (annotation) scrollAnnotationIntoView(annotation)
      }
      renderUi({ panel: options.openPanel || !!state.panel, focusNote: Boolean(options.focusNote) })
      return true
    }

    function saveEditing() {
      const annotation = saveEditingAnnotation(state)
      if (!annotation) return false

      renderUi({ panel: !!state.panel })
      showToast?.(t('toast.annotationSaved', { id: annotation.id }))
      return true
    }

    function cancelEditing() {
      if (!state.editingAnnotationId) return false

      cancelEditingAnnotation(state)
      renderUi({ panel: !!state.panel })
      return true
    }

    function cancelDraftAnnotation() {
      if (!state.draftAnnotation) return false

      clearDraftAnnotation(state)
      renderUi({ panel: !!state.panel })
      showToast?.(t('toast.draftCanceled'))
      return true
    }

    function removeReviewAnnotation(annotationId) {
      const id = annotationId != null ? Number(annotationId) : getSelectedAnnotation(state)?.id
      const selected = state.annotations.find(annotation => annotation.id === id)
      if (!selected) return false

      removeAnnotation(state, selected.id)
      renderUi({ panel: !!state.panel })
      showToast?.(t('toast.annotationRemoved', { id: selected.id }))
      return true
    }

    function commentAreaMark(markId) {
      const mark = getAreaMark(state, markId)
      if (!mark) return false
      if (!canReplaceDraft()) return true
      if (!canSwitchEditing()) return true

      const rect = getAreaMarkViewportRect(mark)
      removeAreaMark(state, mark.id)
      setDraftAnnotation(state, buildAreaAnnotation(rect))
      state.panelCollapsed = false
      hideHoverPreview()
      renderUi({ panel: true, focusNote: true })
      showToast?.(t('toast.draftSelected'))
      return true
    }

    function removeFreeAreaMark(markId) {
      const removed = removeAreaMark(state, markId)
      if (!removed) return false

      renderUi({ panel: !!state.panel })
      return true
    }

    function removeFreePenStroke(strokeId) {
      const removed = removePenStroke(state, strokeId)
      if (!removed) return false

      renderUi({ panel: !!state.panel })
      return true
    }

    async function downloadSnapshot() {
      return downloadReviewSnapshot(state, { showToast, t })
    }

    async function copySnapshot() {
      return copyReviewSnapshot(state, { showToast, t })
    }

    async function generatePdfReport() {
      return generateReviewPrintReport(state, { showToast, t })
    }

    function setActiveTool(tool) {
      const nextTool = ['move', 'element', 'area', 'pen'].includes(tool) ? tool : 'element'
      if (state.draftAnnotation?.note?.trim()) {
        showToast?.(t('toast.draftHasNote'))
        return true
      }
      if (hasUnsavedEditingChanges(state)) {
        showToast?.(t('toast.editHasChanges'))
        return true
      }

      if (state.draftAnnotation) clearDraftAnnotation(state)
      if (state.editingAnnotationId) cancelEditingAnnotation(state)

      state.activeTool = nextTool
      clearAreaSelection()
      cancelPenDrawing()
      hideHoverPreview()
      renderUi({ panel: !!state.panel })
      if (nextTool === 'area') showToast?.(t('toast.reviewAreaToolReady'))
      if (nextTool === 'pen') showToast?.(t('toast.reviewPenToolReady'))
      return true
    }

    function toggleToolbarPinned() {
      state.toolbarPinned = state.toolbarPinned === false
      state.toolbarAutoVisible = false
      clearToolbarAutoHideTimer()
      renderToolbar()
      return true
    }

    function isRectVisible(rect) {
      return rect.x >= 0 &&
        rect.y >= 0 &&
        rect.x + rect.width <= window.innerWidth &&
        rect.y + rect.height <= window.innerHeight
    }

    function rectDistance(rectA, rectB) {
      const centerAX = rectA.x + rectA.width / 2
      const centerAY = rectA.y + rectA.height / 2
      const centerBX = rectB.x + rectB.width / 2
      const centerBY = rectB.y + rectB.height / 2
      return Math.hypot(centerAX - centerBX, centerAY - centerBY)
    }

    function isSimilarRect(rectA, rectB) {
      if (!rectA || !rectB) return false
      const distance = rectDistance(rectA, rectB)
      const sizeDelta = Math.abs(rectA.width - rectB.width) + Math.abs(rectA.height - rectB.height)
      return distance <= 8 && sizeDelta <= 12
    }

    function findAnnotationForElement(element) {
      const info = collectElementInfo(element)
      const clickedRect = {
        x: info.x,
        y: info.y,
        width: info.width,
        height: info.height
      }

      const matches = state.annotations.filter(annotation => {
        if (annotation.element?.isConnected && annotation.element === element) return true
        if (annotation.target?.selector && annotation.target.selector === info.selector) return true
        if (
          annotation.target?.tag === info.tag &&
          annotation.target?.classes === info.classes &&
          annotation.target?.name === info.name &&
          isSimilarRect(getAnnotationViewportRect(annotation), clickedRect)
        ) {
          return true
        }
        return isSimilarRect(getAnnotationViewportRect(annotation), clickedRect)
      })

      return matches.sort((a, b) =>
        rectDistance(getAnnotationViewportRect(a), clickedRect) - rectDistance(getAnnotationViewportRect(b), clickedRect)
      )[0] || null
    }

    function scrollAnnotationIntoView(annotation) {
      const rect = getAnnotationViewportRect(annotation)
      if (isRectVisible(rect)) return

      if (annotation.element?.isConnected) {
        annotation.element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
        return
      }

      if (annotation.rect?.page) {
        window.scrollTo({
          top: Math.max(0, annotation.rect.page.y - window.innerHeight / 2 + annotation.rect.page.height / 2),
          left: Math.max(0, annotation.rect.page.x - window.innerWidth / 2 + annotation.rect.page.width / 2),
          behavior: 'smooth'
        })
      }
    }

    function focusAnnotation(annotationId, options = {}) {
      const annotation = selectAnnotation(state, annotationId)
      if (!annotation) return false

      if (options.toggleHighlight) {
        toggleHighlightedAnnotation(state, annotation.id)
      } else if (options.highlight) {
        setHighlightedAnnotation(state, annotation.id)
      }

      if (options.scroll !== false) scrollAnnotationIntoView(annotation)
      renderUi({ panel: !!state.panel })
      return true
    }

    function closePanel() {
      state.panel?.remove?.()
      state.panel = null
      panelDrag.stop()
    }

    function togglePanel() {
      if (state.panel) {
        closePanel()
        return
      }

      renderPanel()
    }

    function togglePanelCollapsed() {
      state.panelCollapsed = !state.panelCollapsed
      renderPanel()
    }

    function clearReviewAnnotations() {
      resetReviewState(state, { keepAreaMarks: true, keepPenStrokes: true })
      clearAreaSelection()
      cancelPenDrawing()
      hideHoverPreview()
      hideClearConfirmation()
      renderAnnotations()
      closePanel()
    }

    function hasReviewContent() {
      return Boolean(state.annotations.length || state.draftAnnotation)
    }

    function handleReviewAction(action, target) {
      if (action === 'review-request-clear') {
        if (!hasReviewContent()) {
          closePanel()
          return true
        }
        showClearConfirmation()
        return true
      }

      if (action === 'review-cancel-clear') {
        hideClearConfirmation()
        return true
      }

      if (action === 'review-confirm-clear') {
        clearReviewAnnotations()
        return true
      }

      if (action === 'review-toggle-collapse') {
        togglePanelCollapsed()
        return true
      }

      if (action === 'review-download-snapshot') {
        downloadSnapshot()
        return true
      }

      if (action === 'review-copy-image') {
        copySnapshot()
        return true
      }

      if (action === 'review-generate-pdf') {
        generatePdfReport()
        return true
      }

      if (action === 'review-set-tool') {
        return setActiveTool(target?.dataset?.layoutpilotReviewTool)
      }

      if (action === 'review-toggle-toolbar-pin') {
        return toggleToolbarPinned()
      }

      if (action === 'review-comment-area-mark') {
        return commentAreaMark(target?.dataset?.layoutpilotReviewAreaMarkId)
      }

      if (action === 'review-remove-area-mark') {
        return removeFreeAreaMark(target?.dataset?.layoutpilotReviewAreaMarkId)
      }

      if (action === 'review-remove-pen-stroke') {
        return removeFreePenStroke(target?.dataset?.layoutpilotReviewPenStrokeId)
      }

      if (action === 'review-select') {
        const annotationId = Number(target?.dataset?.layoutpilotReviewId)
        if (!canReplaceDraft()) return true
        if (!canSwitchEditing(annotationId)) return true
        clearDraftAnnotation(state)
        if (state.editingAnnotationId !== annotationId) cancelEditingAnnotation(state)
        selectAnnotation(state, annotationId)
        renderUi({ panel: !!state.panel })
        return true
      }

      if (action === 'review-focus') {
        const annotationId = Number(target?.dataset?.layoutpilotReviewId)
        if (!canSwitchEditing(annotationId)) return true
        if (state.editingAnnotationId && state.editingAnnotationId !== annotationId) cancelEditingAnnotation(state)
        focusAnnotation(annotationId, {
          toggleHighlight: target?.dataset?.layoutpilotReviewToggleHighlight === 'true'
        })
        return true
      }

      if (action === 'review-edit') {
        return editAnnotation(target?.dataset?.layoutpilotReviewId, { openPanel: true, focusNote: true })
      }

      if (action === 'review-save-draft') {
        saveDraftAnnotation()
        return true
      }

      if (action === 'review-cancel-draft') {
        cancelDraftAnnotation()
        return true
      }

      if (action === 'review-save-edit') {
        saveEditing()
        return true
      }

      if (action === 'review-cancel-edit') {
        cancelEditing()
        return true
      }

      if (action === 'review-remove') {
        removeReviewAnnotation(target?.dataset?.layoutpilotReviewId)
        return true
      }

      if (action === 'review-remove-selected') {
        removeReviewAnnotation()
        return true
      }

      return false
    }

    function handleNoteInput(event) {
      const textarea = event.target?.closest?.('[data-layoutpilot-review-note]')
      if (!textarea) return

      if (textarea.dataset.layoutpilotReviewDraft === 'true') {
        updateDraftNote(state, textarea.value)
      } else if (textarea.dataset.layoutpilotReviewEdit === 'true') {
        updateEditingNote(state, textarea.value)
      } else {
        updateEditingNote(state, textarea.value)
      }
      renderAnnotations()
    }

    function handlePointerMove(event) {
      if (!state.enabled) return
      if (state.activeTool === 'pen' && state.isDrawingPen) {
        appendPenStrokePoint(state, buildPenPoint(event), MIN_PEN_POINT_DISTANCE)
        renderPenStrokes()
        event.preventDefault()
        event.stopPropagation()
        return
      }

      if (state.activeTool === 'area' && state.isSelectingArea && state.pointerStart) {
        const rect = getAreaSelectionRect(state.pointerStart, {
          x: event.clientX,
          y: event.clientY
        })
        state.draftSelection = rect
        renderAreaSelection(rect)
        event.preventDefault()
        event.stopPropagation()
        return
      }

      if (state.activeTool === 'pen') {
        hideHoverPreview()
        return
      }

      if (state.activeTool !== 'element') {
        hideHoverPreview()
        return
      }
      const isHitLayerEvent = event.target === state.overlay

      if (!isHitLayerEvent && (isOwnElement(event.target) || isEditableTypingTarget(event.target))) {
        hideHoverPreview()
        return
      }

      const element = getElementAtPoint(event)
      if (!element) {
        hideHoverPreview()
        return
      }

      renderHoverPreview(element)
    }

    function handleDocumentPointerDown(event) {
      if (!state.enabled) return
      if (event.button !== undefined && event.button !== 0) return

      if (state.activeTool === 'area') {
        const isHitLayerEvent = event.target === state.overlay
        if (!isHitLayerEvent && isOwnElement(event.target)) return
        if (!isHitLayerEvent && isEditableTypingTarget(event.target)) return
        if (!canReplaceDraft() || hasUnsavedEditingChanges(state)) {
          if (hasUnsavedEditingChanges(state)) showToast?.(t('toast.editHasChanges'))
          return
        }

        suppressNextPageClick = true
        state.isSelectingArea = true
        state.pointerStart = {
          x: event.clientX,
          y: event.clientY
        }
        state.draftSelection = {
          x: event.clientX,
          y: event.clientY,
          width: 0,
          height: 0
        }
        renderAreaSelection(state.draftSelection)
        event.preventDefault()
        event.stopPropagation()
        return
      }

      if (state.activeTool === 'pen') {
        const isHitLayerEvent = event.target === state.overlay
        const isPenStrokeEvent = event.target?.closest?.('.layoutpilot-review-pen-stroke-wrap')
        const isPenToolEvent = event.target?.closest?.('.layoutpilot-review-pen-tools')
        if (isPenToolEvent) return
        if (!isHitLayerEvent && isOwnElement(event.target) && !isPenStrokeEvent) return
        if (!isHitLayerEvent && isEditableTypingTarget(event.target)) return
        if (!canReplaceDraft() || hasUnsavedEditingChanges(state)) {
          if (hasUnsavedEditingChanges(state)) showToast?.(t('toast.editHasChanges'))
          return
        }

        suppressNextPageClick = true
        startPenStroke(state, buildPenPoint(event))
        renderPenStrokes()
        event.preventDefault()
        event.stopPropagation()
        return
      }

      if (state.activeTool !== 'element') return

      const isHitLayerEvent = event.target === state.overlay
      if (!isHitLayerEvent && isOwnElement(event.target)) return
      if (!isHitLayerEvent && isEditableTypingTarget(event.target)) return

      const element = getElementAtPoint(event)
      if (!element) return

      suppressNextPageClick = true
      event.preventDefault()
      event.stopPropagation()
      createDraftFromElement(element)
    }

    function handleDocumentPointerUp(event) {
      if (!state.enabled) return
      if (state.activeTool === 'pen' && state.isDrawingPen) {
        appendPenStrokePoint(state, buildPenPoint(event), MIN_PEN_POINT_DISTANCE)
        finishPenStroke(state)
        renderPenStrokes()
        event.preventDefault()
        event.stopPropagation()
        return true
      }

      if (state.activeTool !== 'area' || !state.isSelectingArea || !state.pointerStart) return

      const rect = getAreaSelectionRect(state.pointerStart, {
        x: event.clientX,
        y: event.clientY
      })
      clearAreaSelection()
      event.preventDefault()
      event.stopPropagation()

      if (rect.width < MIN_AREA_SELECTION_SIZE && rect.height < MIN_AREA_SELECTION_SIZE) {
        renderAnnotations()
        return
      }

      addAreaMark(state, buildAreaMark(rect))
      hideHoverPreview()
      renderUi({ panel: !!state.panel })
      return true
    }

    function handleDocumentPointerCancel() {
      if (!state.enabled) return
      if (state.isDrawingPen) {
        cancelPenDrawing()
        return
      }

      if (!state.isSelectingArea) return
      clearAreaSelection()
      renderAnnotations()
    }

    function handleDocumentClick(event) {
      if (!state.enabled) return

      const actionTarget = event.target?.closest?.('[data-layoutpilot-action]')
      const action = actionTarget?.dataset?.layoutpilotAction
      if (action && handleReviewAction(action, actionTarget)) {
        event.preventDefault()
        event.stopPropagation()
        return
      }

      if (suppressNextPageClick) {
        suppressNextPageClick = false
        event.preventDefault()
        event.stopPropagation()
        return
      }

      if (isOwnElement(event.target)) return
      if (isEditableTypingTarget(event.target)) return
      if (event.detail > 1) return
      if (state.activeTool !== 'element') return

      const element = getElementAtPoint(event)
      if (!element) return

      event.preventDefault()
      event.stopPropagation()
      createDraftFromElement(element)
    }

    function handleViewportChange(event) {
      if (!state.enabled) return
      if (event?.target instanceof Element && isOwnElement(event.target)) return
      renderAnnotations()
      if (state.hoverElement?.isConnected) renderHoverPreview(state.hoverElement)
      if (state.panelPosition) panelDrag.applyPosition()
      if (state.toolbarPosition && state.toolbarPinned !== false) toolbarDrag.applyPosition()
      if (state.toolbar && (state.toolbarPinned === false || !state.toolbarPosition)) applyToolbarPosition()
    }

    function bindListeners() {
      document.addEventListener('pointermove', handlePointerMove, true)
      document.addEventListener('pointerdown', handleDocumentPointerDown, true)
      document.addEventListener('pointerup', handleDocumentPointerUp, true)
      document.addEventListener('pointercancel', handleDocumentPointerCancel, true)
      document.addEventListener('click', handleDocumentClick, true)
      document.addEventListener('input', handleNoteInput, true)
      document.addEventListener('wheel', handleScrollLockWheel, { capture: true, passive: false })
      document.addEventListener('touchmove', handleScrollLockTouchMove, { capture: true, passive: false })
      document.addEventListener('contextmenu', handleContextMenu, true)
      document.addEventListener('keydown', handleScrollLockKeyDown, true)
      window.addEventListener('scroll', handleViewportChange, true)
      window.addEventListener('resize', handleViewportChange)
    }

    function unbindListeners() {
      document.removeEventListener('pointermove', handlePointerMove, true)
      document.removeEventListener('pointerdown', handleDocumentPointerDown, true)
      document.removeEventListener('pointerup', handleDocumentPointerUp, true)
      document.removeEventListener('pointercancel', handleDocumentPointerCancel, true)
      document.removeEventListener('click', handleDocumentClick, true)
      document.removeEventListener('input', handleNoteInput, true)
      document.removeEventListener('wheel', handleScrollLockWheel, true)
      document.removeEventListener('touchmove', handleScrollLockTouchMove, true)
      document.removeEventListener('contextmenu', handleContextMenu, true)
      document.removeEventListener('keydown', handleScrollLockKeyDown, true)
      window.removeEventListener('scroll', handleViewportChange, true)
      window.removeEventListener('resize', handleViewportChange)
    }

    function start() {
      if (state.enabled) return
      state.enabled = true
      lockPageScroll()
      bindListeners()
      renderUi()
      showToast?.(t('toast.reviewOn'))
    }

    function stop() {
      if (!state.enabled) return
      unbindListeners()
      clearToolbarAutoHideTimer()
      clearPenToolsHideTimer()
      panelDrag.stop()
      toolbarDrag.stop()
      unlockPageScroll()
      clearReviewState(state)
    }

    function destroy() {
      unbindListeners()
      clearToolbarAutoHideTimer()
      clearPenToolsHideTimer()
      panelDrag.stop()
      toolbarDrag.stop()
      unlockPageScroll()
      clearReviewState(state)
    }

    function handleKeyDown(event, normalizedKey) {
      if (!state.enabled) return false

      if (state.confirmDialog) {
        if (normalizedKey === SHORTCUT.CANCEL) hideClearConfirmation()
        return true
      }

      if (normalizedKey === SHORTCUT.DETAILS) {
        togglePanel()
        return true
      }

      if (normalizedKey === SHORTCUT.PIN) {
        if (state.activeTool !== 'element') return true
        if (!state.hoverElement?.isConnected) {
          showToast?.(t('toast.noElement'))
          return true
        }

        createDraftFromElement(state.hoverElement)
        return true
      }

      if (normalizedKey === SHORTCUT.PDF_REPORT) {
        generatePdfReport()
        return true
      }

      if (
        normalizedKey === SHORTCUT.SNAPSHOT_IMAGE &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        if (event.shiftKey) {
          downloadSnapshot()
        } else {
          copySnapshot()
        }
        return true
      }

      if (normalizedKey === 'Delete' || normalizedKey === 'Backspace') {
        return removeReviewAnnotation()
      }

      if (normalizedKey === SHORTCUT.CANCEL && state.isDrawingPen) {
        cancelPenDrawing()
        return true
      }

      if (normalizedKey === SHORTCUT.CANCEL && (state.isSelectingArea || state.draftSelection)) {
        clearAreaSelection()
        return true
      }

      if (normalizedKey === SHORTCUT.CANCEL && state.draftAnnotation) {
        return cancelDraftAnnotation()
      }

      if (normalizedKey === SHORTCUT.CANCEL && state.editingAnnotationId) {
        return cancelEditing()
      }

      if (normalizedKey === SHORTCUT.CANCEL && state.selectedAnnotationId) {
        state.selectedAnnotationId = null
        renderUi({ panel: !!state.panel })
        return true
      }

      return false
    }

    function refreshLanguage() {
      if (state.panel) renderPanel()
      if (state.toolbar) renderToolbar()
      if (state.confirmDialog) showClearConfirmation()
    }

    function getState() {
      return state
    }

    function blocksGlobalShortcuts() {
      return Boolean(state.confirmDialog)
    }

    return {
      start,
      stop,
      destroy,
      handleKeyDown,
      refreshLanguage,
      getState,
      downloadSnapshot,
      copySnapshot,
      generatePdfReport,
      blocksGlobalShortcuts
    }
  }

  root.reviewMode = {
    createReviewMode
  }
})()
