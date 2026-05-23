(() => {
  const root = window.LayoutPilotModules ||= {}
  const { SHORTCUT } = root.constants
  const { createReviewState, clearReviewState } = root.reviewState

  function createReviewMode(options = {}) {
    const {
      showToast,
      t = key => key
    } = options
    const state = createReviewState()

    function start() {
      if (state.enabled) return
      state.enabled = true
      showToast?.(t('toast.reviewOn'))
    }

    function stop() {
      if (!state.enabled) return
      clearReviewState(state)
    }

    function destroy() {
      clearReviewState(state)
    }

    function handleKeyDown(event, normalizedKey) {
      if (!state.enabled) return false

      if (normalizedKey === SHORTCUT.CANCEL && (state.isSelectingArea || state.draftSelection)) {
        state.draftSelection = null
        state.isSelectingArea = false
        state.pointerStart = null
        return true
      }

      return false
    }

    function refreshLanguage() {
      // Review Mode has no rendered UI in this foundation lot.
    }

    function getState() {
      return state
    }

    return {
      start,
      stop,
      destroy,
      handleKeyDown,
      refreshLanguage,
      getState
    }
  }

  root.reviewMode = {
    createReviewMode
  }
})()
