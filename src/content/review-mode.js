(() => {
  const root = window.LayoutPilotModules ||= {}
  const { SHORTCUT } = root.constants
  const {
    createReviewState,
    clearReviewState,
    resetReviewState,
    addAnnotation,
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
  const { createElement } = root.dom
  const { collectElementInfo } = root.elementInspector
  const { createDraggablePanel } = root.draggablePanel
  const { getAnnotationViewportRect, renderReviewAnnotationBoxes, renderReviewMarkers } = root.reviewMarkers
  const { renderReviewPanel, renderClearReviewDialog } = root.reviewPanel
  const { downloadReviewSnapshot, copyReviewSnapshot } = root.reviewSnapshot
  const { generateReviewPrintReport } = root.reviewPrintReport

  function createReviewMode(options = {}) {
    const {
      showToast,
      t = key => key
    } = options
    const state = createReviewState()
    let suppressNextPageClick = false
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

    function ensureHoverOverlay() {
      state.hoverOverlay ||= createElement('layoutpilot-review-hover')
      return state.hoverOverlay
    }

    function ensurePanel() {
      state.panel ||= createElement('layoutpilot-review-panel')
      return state.panel
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

    function renderAnnotations() {
      ensureAnnotationLayer()
      ensureMarkerLayer()
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

    function showClearConfirmation() {
      const dialog = ensureConfirmDialog()
      dialog.innerHTML = renderClearReviewDialog(t)
      dialog.style.display = 'grid'
    }

    function hideClearConfirmation() {
      state.confirmDialog?.remove?.()
      state.confirmDialog = null
    }

    function renderUi({ panel = false } = {}) {
      ensureHitLayer()
      renderAnnotations()
      if (panel || state.panel) renderPanel()
    }

    function createDraftFromElement(element) {
      const existingAnnotation = findAnnotationForElement(element)
      if (existingAnnotation) {
        editAnnotation(existingAnnotation.id, { openPanel: true, scroll: false })
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
      renderUi({ panel: true })
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
      renderUi({ panel: options.openPanel || !!state.panel })
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

    async function downloadSnapshot() {
      return downloadReviewSnapshot(state, { showToast, t })
    }

    async function copySnapshot() {
      return copyReviewSnapshot(state, { showToast, t })
    }

    async function generatePdfReport() {
      return generateReviewPrintReport(state, { showToast, t })
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
      resetReviewState(state)
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
        return editAnnotation(target?.dataset?.layoutpilotReviewId)
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
    }

    function bindListeners() {
      document.addEventListener('pointermove', handlePointerMove, true)
      document.addEventListener('pointerdown', handleDocumentPointerDown, true)
      document.addEventListener('click', handleDocumentClick, true)
      document.addEventListener('input', handleNoteInput, true)
      document.addEventListener('wheel', handleScrollLockWheel, { capture: true, passive: false })
      document.addEventListener('touchmove', handleScrollLockTouchMove, { capture: true, passive: false })
      document.addEventListener('keydown', handleScrollLockKeyDown, true)
      window.addEventListener('scroll', handleViewportChange, true)
      window.addEventListener('resize', handleViewportChange)
    }

    function unbindListeners() {
      document.removeEventListener('pointermove', handlePointerMove, true)
      document.removeEventListener('pointerdown', handleDocumentPointerDown, true)
      document.removeEventListener('click', handleDocumentClick, true)
      document.removeEventListener('input', handleNoteInput, true)
      document.removeEventListener('wheel', handleScrollLockWheel, true)
      document.removeEventListener('touchmove', handleScrollLockTouchMove, true)
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
      panelDrag.stop()
      unlockPageScroll()
      clearReviewState(state)
    }

    function destroy() {
      unbindListeners()
      panelDrag.stop()
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

      if (normalizedKey === SHORTCUT.COPY_CONTEXT) {
        showToast?.(t('toast.reviewReportSoon'))
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

      if (normalizedKey === SHORTCUT.CANCEL && (state.isSelectingArea || state.draftSelection)) {
        state.draftSelection = null
        state.isSelectingArea = false
        state.pointerStart = null
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
