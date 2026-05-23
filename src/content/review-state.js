(() => {
  const root = window.LayoutPilotModules ||= {}

  function createReviewState() {
    return {
      enabled: false,
      annotations: [],
      nextId: 1,
      selectedAnnotationId: null,
      draftSelection: null,
      isSelectingArea: false,
      pointerStart: null,
      overlay: null,
      markerLayer: null,
      selectionBox: null,
      panel: null,
      toast: null,
      panelPosition: null,
      panelDrag: null
    }
  }

  function clearReviewState(state) {
    for (const key of ['overlay', 'markerLayer', 'selectionBox', 'panel', 'toast']) {
      state[key]?.remove?.()
      state[key] = null
    }

    state.enabled = false
    state.annotations = []
    state.nextId = 1
    state.selectedAnnotationId = null
    state.draftSelection = null
    state.isSelectingArea = false
    state.pointerStart = null
    state.panelPosition = null
    state.panelDrag = null
  }

  function resetReviewState(state) {
    state.annotations = []
    state.nextId = 1
    state.selectedAnnotationId = null
    state.draftSelection = null
    state.isSelectingArea = false
    state.pointerStart = null
  }

  root.reviewState = {
    createReviewState,
    clearReviewState,
    resetReviewState
  }
})()
