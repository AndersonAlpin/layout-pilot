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
      selectedAnnotationId: null,
      highlightedAnnotationId: null,
      editingAnnotationId: null,
      editingNote: '',
      draftAnnotation: null,
      draftSelection: null,
      isSelectingArea: false,
      pointerStart: null,
      overlay: null,
      hoverElement: null,
      hoverOverlay: null,
      annotationLayer: null,
      areaMarkLayer: null,
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
      workspaceFrame: null,
      toast: null,
      panelPosition: null,
      panelDrag: null,
      scrollLock: null,
      lastSnapshotCapture: null,
      lastSnapshotCaptureError: null
    }
  }

  function clearReviewState(state) {
    for (const key of ['overlay', 'hoverOverlay', 'annotationLayer', 'areaMarkLayer', 'markerLayer', 'selectionBox', 'panel', 'confirmDialog', 'toolbar', 'workspaceFrame', 'toast']) {
      state[key]?.remove?.()
      state[key] = null
    }

    state.enabled = false
    state.activeTool = 'element'
    state.annotations = []
    state.nextId = 1
    state.areaMarks = []
    state.nextAreaMarkId = 1
    state.selectedAnnotationId = null
    state.highlightedAnnotationId = null
    state.editingAnnotationId = null
    state.editingNote = ''
    state.draftAnnotation = null
    state.draftSelection = null
    state.isSelectingArea = false
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

  function resetReviewState(state) {
    state.annotations = []
    state.nextId = 1
    state.areaMarks = []
    state.nextAreaMarkId = 1
    state.activeTool = 'element'
    state.selectedAnnotationId = null
    state.highlightedAnnotationId = null
    state.editingAnnotationId = null
    state.editingNote = ''
    state.draftAnnotation = null
    state.draftSelection = null
    state.isSelectingArea = false
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

  function getAreaMark(state, markId) {
    const id = Number(markId)
    return state.areaMarks.find(mark => mark.id === id) || null
  }

  function removeAreaMark(state, markId) {
    const id = Number(markId)
    const index = state.areaMarks.findIndex(mark => mark.id === id)
    if (index < 0) return null

    const [removed] = state.areaMarks.splice(index, 1)
    return removed
  }

  function getSelectedAnnotation(state) {
    return state.annotations.find(annotation => annotation.id === state.selectedAnnotationId) || null
  }

  function selectAnnotation(state, annotationId) {
    const id = Number(annotationId)
    state.selectedAnnotationId = state.annotations.some(annotation => annotation.id === id) ? id : null
    return getSelectedAnnotation(state)
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
    getAreaMark,
    removeAreaMark,
    getSelectedAnnotation,
    selectAnnotation,
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
