(() => {
  const root = window.LayoutPilotModules ||= {}

  function createReviewState() {
    return {
      enabled: false,
      activeTool: 'element',
      annotations: [],
      nextId: 1,
      areaMarks: [],
      nextAreaMarkId: 1,
      penStrokes: [],
      nextPenStrokeId: 1,
      activePenStrokeId: null,
      selectedAnnotationId: null,
      selectedFreeMark: null,
      highlightedAnnotationId: null,
      editingAnnotationId: null,
      editingNote: '',
      draftAnnotation: null,
      draftSelection: null,
      isSelectingArea: false,
      isDrawingPen: false,
      pointerStart: null,
      overlay: null,
      hoverElement: null,
      hoverOverlay: null,
      annotationLayer: null,
      areaMarkLayer: null,
      penLayer: null,
      markerLayer: null,
      selectionBox: null,
      panel: null,
      panelCollapsed: false,
      confirmDialog: null,
      toolbar: null,
      toolbarPosition: null,
      toolbarDrag: null,
      toolbarPinned: true,
      toolbarAutoVisible: false,
      toast: null,
      panelPosition: null,
      panelDrag: null,
      scrollLock: null,
      lastSnapshotCapture: null,
      lastSnapshotCaptureError: null
    }
  }

  function clearReviewState(state) {
    for (const key of ['overlay', 'hoverOverlay', 'annotationLayer', 'areaMarkLayer', 'penLayer', 'markerLayer', 'selectionBox', 'panel', 'confirmDialog', 'toolbar', 'toast']) {
      state[key]?.remove?.()
      state[key] = null
    }

    state.enabled = false
    state.activeTool = 'element'
    state.annotations = []
    state.nextId = 1
    state.areaMarks = []
    state.nextAreaMarkId = 1
    state.penStrokes = []
    state.nextPenStrokeId = 1
    state.activePenStrokeId = null
    state.selectedAnnotationId = null
    state.selectedFreeMark = null
    state.highlightedAnnotationId = null
    state.editingAnnotationId = null
    state.editingNote = ''
    state.draftAnnotation = null
    state.draftSelection = null
    state.isSelectingArea = false
    state.isDrawingPen = false
    state.pointerStart = null
    state.hoverElement = null
    state.panelCollapsed = false
    state.panelPosition = null
    state.panelDrag = null
    state.toolbarPosition = null
    state.toolbarDrag = null
    state.toolbarPinned = true
    state.toolbarAutoVisible = false
    state.scrollLock = null
    state.lastSnapshotCapture = null
    state.lastSnapshotCaptureError = null
  }

  function resetReviewState(state, options = {}) {
    const { keepAreaMarks = false, keepPenStrokes = false } = options
    state.annotations = []
    state.nextId = 1
    if (!keepAreaMarks) {
      state.areaMarks = []
      state.nextAreaMarkId = 1
    }
    if (!keepPenStrokes) {
      state.penStrokes = []
      state.nextPenStrokeId = 1
    }
    state.activePenStrokeId = null
    state.activeTool = 'element'
    state.selectedAnnotationId = null
    state.selectedFreeMark = null
    state.highlightedAnnotationId = null
    state.editingAnnotationId = null
    state.editingNote = ''
    state.draftAnnotation = null
    state.draftSelection = null
    state.isSelectingArea = false
    state.isDrawingPen = false
    state.pointerStart = null
    state.hoverElement = null
    state.panelCollapsed = false
    state.toolbarPinned = true
    state.toolbarAutoVisible = false
    state.lastSnapshotCapture = null
    state.lastSnapshotCaptureError = null
  }

  function addAnnotation(state, annotation) {
    const nextAnnotation = {
      ...annotation,
      id: state.nextId++
    }
    state.annotations.push(nextAnnotation)
    state.selectedAnnotationId = nextAnnotation.id
    state.selectedFreeMark = null
    state.editingAnnotationId = null
    state.editingNote = ''
    state.draftAnnotation = null
    return nextAnnotation
  }

  function addAreaMark(state, mark) {
    const nextMark = {
      ...mark,
      id: state.nextAreaMarkId++
    }
    state.areaMarks.push(nextMark)
    return nextMark
  }

  function restoreAreaMark(state, mark) {
    if (!mark) return null
    const id = Number(mark.id)
    const existing = state.areaMarks.find(item => item.id === id)
    if (existing) {
      state.selectedFreeMark = { type: 'area', id }
      state.selectedAnnotationId = null
      state.highlightedAnnotationId = null
      return existing
    }

    const restored = {
      ...mark,
      id
    }
    state.areaMarks.push(restored)
    state.nextAreaMarkId = Math.max(state.nextAreaMarkId, id + 1)
    state.selectedFreeMark = { type: 'area', id }
    state.selectedAnnotationId = null
    state.highlightedAnnotationId = null
    return restored
  }

  function getAreaMark(state, markId) {
    const id = Number(markId)
    return state.areaMarks.find(mark => mark.id === id) || null
  }

  function removeAreaMark(state, markId) {
    const id = Number(markId)
    const index = state.areaMarks.findIndex(mark => mark.id === id)
    if (index < 0) return null

    const [removed] = state.areaMarks.splice(index, 1)
    if (state.selectedFreeMark?.type === 'area' && state.selectedFreeMark.id === id) {
      state.selectedFreeMark = null
    }
    return removed
  }

  function startPenStroke(state, point) {
    const stroke = {
      id: state.nextPenStrokeId++,
      createdAt: new Date().toISOString(),
      points: [point]
    }
    state.penStrokes.push(stroke)
    state.activePenStrokeId = stroke.id
    state.isDrawingPen = true
    return stroke
  }

  function getActivePenStroke(state) {
    return state.penStrokes.find(stroke => stroke.id === state.activePenStrokeId) || null
  }

  function appendPenStrokePoint(state, point, minDistance = 0) {
    const stroke = getActivePenStroke(state)
    if (!stroke) return null

    const previousPoint = stroke.points[stroke.points.length - 1]
    if (
      previousPoint &&
      minDistance > 0 &&
      Math.hypot(point.x - previousPoint.x, point.y - previousPoint.y) < minDistance
    ) {
      return stroke
    }

    stroke.points.push(point)
    return stroke
  }

  function finishPenStroke(state) {
    const stroke = getActivePenStroke(state)
    state.activePenStrokeId = null
    state.isDrawingPen = false
    return stroke
  }

  function cancelPenStroke(state) {
    const id = state.activePenStrokeId
    state.activePenStrokeId = null
    state.isDrawingPen = false
    if (id == null) return null

    const index = state.penStrokes.findIndex(stroke => stroke.id === id)
    if (index < 0) return null

    const [removed] = state.penStrokes.splice(index, 1)
    return removed
  }

  function removePenStroke(state, strokeId) {
    const id = Number(strokeId)
    const index = state.penStrokes.findIndex(stroke => stroke.id === id)
    if (index < 0) return null

    const [removed] = state.penStrokes.splice(index, 1)
    if (state.activePenStrokeId === id) {
      state.activePenStrokeId = null
      state.isDrawingPen = false
    }
    if (state.selectedFreeMark?.type === 'pen' && state.selectedFreeMark.id === id) {
      state.selectedFreeMark = null
    }
    return removed
  }

  function getSelectedAnnotation(state) {
    return state.annotations.find(annotation => annotation.id === state.selectedAnnotationId) || null
  }

  function selectAnnotation(state, annotationId) {
    const id = Number(annotationId)
    state.selectedAnnotationId = state.annotations.some(annotation => annotation.id === id) ? id : null
    if (state.selectedAnnotationId) state.selectedFreeMark = null
    return getSelectedAnnotation(state)
  }

  function selectFreeMark(state, type, markId) {
    const id = Number(markId)
    if (state.selectedFreeMark?.type === type && state.selectedFreeMark.id === id) {
      state.selectedFreeMark = null
      return null
    }

    const list = type === 'area'
      ? state.areaMarks
      : type === 'pen'
        ? state.penStrokes
        : []
    const exists = list.some(mark => mark.id === id)
    state.selectedFreeMark = exists ? { type, id } : null
    if (state.selectedFreeMark) {
      state.selectedAnnotationId = null
      state.highlightedAnnotationId = null
    }
    return state.selectedFreeMark
  }

  function clearSelectedFreeMark(state) {
    state.selectedFreeMark = null
  }

  function setHighlightedAnnotation(state, annotationId) {
    const id = Number(annotationId)
    state.highlightedAnnotationId = state.annotations.some(annotation => annotation.id === id) ? id : null
    return state.highlightedAnnotationId
  }

  function toggleHighlightedAnnotation(state, annotationId) {
    const id = Number(annotationId)
    if (state.highlightedAnnotationId === id) {
      state.highlightedAnnotationId = null
      return null
    }

    return setHighlightedAnnotation(state, id)
  }

  function getEditingAnnotation(state) {
    return state.annotations.find(annotation => annotation.id === state.editingAnnotationId) || null
  }

  function startEditingAnnotation(state, annotationId) {
    const selected = selectAnnotation(state, annotationId)
    if (!selected) return null

    state.draftAnnotation = null
    state.editingAnnotationId = selected.id
    state.editingNote = selected.note || ''
    return selected
  }

  function updateEditingNote(state, note) {
    if (!getEditingAnnotation(state)) return null
    state.editingNote = String(note || '')
    return state.editingNote
  }

  function hasUnsavedEditingChanges(state) {
    const annotation = getEditingAnnotation(state)
    return Boolean(annotation && String(annotation.note || '') !== String(state.editingNote || ''))
  }

  function saveEditingAnnotation(state) {
    const annotation = getEditingAnnotation(state)
    if (!annotation) return null

    annotation.note = String(state.editingNote || '')
    state.editingAnnotationId = null
    state.editingNote = ''
    return annotation
  }

  function cancelEditingAnnotation(state) {
    state.editingAnnotationId = null
    state.editingNote = ''
  }

  function updateAnnotationNote(state, annotationId, note) {
    const annotation = state.annotations.find(item => item.id === Number(annotationId))
    if (!annotation) return null
    annotation.note = String(note || '')
    return annotation
  }

  function setDraftAnnotation(state, annotation) {
    state.draftAnnotation = annotation
    state.selectedAnnotationId = null
    state.selectedFreeMark = null
    state.editingAnnotationId = null
    state.editingNote = ''
    return state.draftAnnotation
  }

  function updateDraftNote(state, note) {
    if (!state.draftAnnotation) return null
    state.draftAnnotation.note = String(note || '')
    return state.draftAnnotation
  }

  function clearDraftAnnotation(state) {
    state.draftAnnotation = null
  }

  function removeAnnotation(state, annotationId) {
    const id = Number(annotationId)
    const index = state.annotations.findIndex(annotation => annotation.id === id)
    if (index < 0) return null

    const [removed] = state.annotations.splice(index, 1)
    if (state.selectedAnnotationId === id) {
      state.selectedAnnotationId = state.annotations[index]?.id || state.annotations[index - 1]?.id || null
    }
    if (state.highlightedAnnotationId === id) {
      state.highlightedAnnotationId = null
    }
    if (state.editingAnnotationId === id) {
      state.editingAnnotationId = null
      state.editingNote = ''
    }

    return removed
  }

  root.reviewState = {
    createReviewState,
    clearReviewState,
    resetReviewState,
    addAnnotation,
    addAreaMark,
    restoreAreaMark,
    getAreaMark,
    removeAreaMark,
    startPenStroke,
    appendPenStrokePoint,
    finishPenStroke,
    cancelPenStroke,
    removePenStroke,
    getSelectedAnnotation,
    selectAnnotation,
    selectFreeMark,
    clearSelectedFreeMark,
    setHighlightedAnnotation,
    toggleHighlightedAnnotation,
    getEditingAnnotation,
    startEditingAnnotation,
    updateEditingNote,
    hasUnsavedEditingChanges,
    saveEditingAnnotation,
    cancelEditingAnnotation,
    updateAnnotationNote,
    setDraftAnnotation,
    updateDraftNote,
    clearDraftAnnotation,
    removeAnnotation
  }
})()
