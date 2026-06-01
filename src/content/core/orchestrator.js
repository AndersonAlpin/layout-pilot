(() => {
  const {
    constants,
    dom,
    inspectMode,
    breakpointMode,
    breakpointPresets,
    modalShield,
    reviewMode,
    shortcuts,
    ui,
    i18n
  } = window.LayoutPilotModules
  const { INSTANCE_KEY, MODE, MESSAGE_TYPE, SHORTCUT, SHORTCUTS_BY_MODE, UI_SELECTOR } = constants
  const { createElement, isLayoutPilotElement, escapeHtml } = dom
  const { createInspectMode } = inspectMode
  const { createBreakpointMode } = breakpointMode
  const { resolveActiveControllers } = breakpointPresets
  const { createModalShield } = modalShield
  const { createReviewMode } = reviewMode
  const { normalizeKey, shouldIgnoreShortcut, consumeShortcut } = shortcuts
  const { initTooltips, teardownTooltips, renderCloseButton, renderShortcutList } = ui
  const {
    loadLanguagePreference,
    setCurrentLanguage,
    resolveLanguage,
    t
  } = i18n

  const state = {
    enabled: false,
    mode: MODE.INSPECT,
    helpPanel: null,
    toast: null,
    healthCheckTimer: null,
    breakpointStandalone: false
  }

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

  const breakpointController = createBreakpointMode({
    showToast,
    t,
    onEnabledChange: () => applyActiveState(),
    onInteractionChange: () => applyActiveState(),
    onViewportChange: () => controllers[MODE.INSPECT].resetVisualState?.(),
    onClose: () => setBreakpointEnabled(false)
  })
  const controllers = {
    [MODE.INSPECT]: createInspectMode({
      showToast,
      t,
      getElementAtPoint: breakpointController.getElementAtPoint,
      mapElementInfo: breakpointController.mapElementInfo
    }),
    [MODE.REVIEW]: createReviewMode({
      showToast,
      t
    })
  }
  const rekaModalShield = createModalShield()

  loadLanguagePreference().then(() => {
    refreshTranslatedUi()
  })

  function getController(mode = state.mode) {
    return controllers[mode] || controllers[MODE.INSPECT]
  }

  // The controller that is actually intercepting input right now. With
  // Breakpoint on, that is Inspect (when interaction = inspect) regardless of
  // the classic `mode`, so its shortcuts/detail clicks route correctly.
  function getActiveController() {
    const bp = breakpointController.getState()
    const desired = resolveActiveControllers({
      enabled: state.enabled,
      mode: state.mode,
      breakpointEnabled: bp.enabled,
      interaction: bp.interaction
    })
    if (desired.review) return controllers[MODE.REVIEW]
    return controllers[MODE.INSPECT]
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
    for (const key of ['helpPanel', 'toast']) {
      removeElement(key)
    }
    cleanupOrphanUi()
  }

  function getHelpShortcuts() {
    const modeShortcuts = SHORTCUTS_BY_MODE[state.mode] || SHORTCUTS_BY_MODE[MODE.INSPECT]
    return modeShortcuts.map(shortcut => ({
      key: shortcut.key,
      label: t(shortcut.labelKey)
    }))
  }

  function getHelpNote() {
    return state.mode === MODE.REVIEW ? t('help.note.review') : t('help.note.inspect')
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

  function showToast(message) {
    const toast = ensureToast()
    toast.textContent = message
    toast.style.display = 'block'
    window.clearTimeout(showToast.timeout)
    showToast.timeout = window.setTimeout(() => {
      if (state.toast) state.toast.style.display = 'none'
    }, 1600)
  }

  function refreshTranslatedUi() {
    breakpointController.refreshLanguage?.()
    for (const controller of Object.values(controllers)) {
      controller.refreshLanguage?.()
    }
    if (state.helpPanel) renderHelpPanel()
  }

  function handleUiClick(event) {
    if (!isLayoutPilotElement(event.target)) return

    const action = event.target?.closest?.('[data-layoutpilot-action]')?.dataset?.layoutpilotAction
    if (action === 'close-help') {
      removeElement('helpPanel')
      return
    }

    if (breakpointController.handleUiClick?.(event)) return

    getActiveController().handleUiClick?.(event)
  }

  function handleUiChange(event) {
    if (!isLayoutPilotElement(event.target)) return
    breakpointController.handleFieldChange?.(event)
  }

  function handleKeyDown(event) {
    if (isLayoutPilotElement(event.target) && breakpointController.handleFieldKeyDown?.(event)) return

    const normalized = normalizeKey(event)
    // Review is only the active interceptor in classic mode; with Breakpoint on
    // the interceptor is Inspect (or none), never Review.
    const isReviewMode = state.enabled && !breakpointController.getState().enabled && state.mode === MODE.REVIEW
    const allowReviewCancel = isReviewMode && normalized === SHORTCUT.CANCEL

    if (shouldIgnoreShortcut(event) && !allowReviewCancel) return

    const activeController = getActiveController()
    if (state.enabled && activeController.blocksGlobalShortcuts?.()) {
      consumeShortcut(event)
      activeController.handleKeyDown(event, normalized)
      return
    }

    if (normalized === SHORTCUT.HELP) {
      consumeShortcut(event)
      toggleHelpPanel()
      return
    }

    if (state.enabled && normalized === SHORTCUT.BREAKPOINT_PANEL) {
      consumeShortcut(event)
      if (event.shiftKey) {
        setBreakpointEnabled(!breakpointController.getState().enabled)
      } else {
        breakpointController.togglePanel()
      }
      return
    }

    if (normalized === SHORTCUT.INSPECT) {
      consumeShortcut(event)
      if (isReviewMode) return

      if (breakpointController.getState().enabled) {
        breakpointController.toggleInteraction()
        return
      }

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

    if (activeController.handleKeyDown?.(event, normalized)) {
      consumeShortcut(event)
      return
    }

    if (normalized === SHORTCUT.CANCEL) {
      consumeShortcut(event)
      setEnabled(false)
    }
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

  function applyActiveState() {
    const bp = breakpointController.getState()
    const desired = resolveActiveControllers({
      enabled: state.enabled,
      mode: state.mode,
      breakpointEnabled: bp.enabled,
      interaction: bp.interaction
    })

    if (desired.inspect) controllers[MODE.INSPECT].start()
    else controllers[MODE.INSPECT].stop()

    if (desired.review) controllers[MODE.REVIEW].start()
    else controllers[MODE.REVIEW].stop()

    // Keep the breakpoint panel above the freshly-mounted inspect hit-shield.
    if (bp.enabled) breakpointController.raisePanel()
  }

  function setMode(mode) {
    const nextMode = mode === MODE.REVIEW ? MODE.REVIEW : MODE.INSPECT
    if (nextMode === MODE.REVIEW && breakpointController.getState().enabled) {
      showToast(t('breakpoint.reviewUnavailable'))
      return
    }
    if (state.mode === nextMode) return
    state.mode = nextMode
    applyActiveState()
    if (state.helpPanel) renderHelpPanel()
  }

  function setEnabled(enabled) {
    const nextEnabled = !!enabled
    if (!nextEnabled) {
      state.enabled = false
      state.breakpointStandalone = false
      breakpointController.setEnabled(false)
      removeElement('helpPanel')
      removeElement('toast')
      applyActiveState()
      cleanupOrphanUi()
      return
    }

    if (state.enabled === nextEnabled) return
    state.enabled = nextEnabled

    applyActiveState()
  }

  function setBreakpointEnabled(enabled) {
    const nextEnabled = !!enabled
    if (nextEnabled) {
      state.breakpointStandalone = !state.enabled
      if (!state.enabled) state.enabled = true
      // breakpointController.setEnabled triggers onEnabledChange -> applyActiveState.
      breakpointController.setEnabled(true)
      return
    }

    const shouldDisableAll = state.breakpointStandalone
    state.breakpointStandalone = false
    if (shouldDisableAll) {
      setEnabled(false)
      return
    }

    // breakpointController.setEnabled triggers onEnabledChange -> applyActiveState.
    breakpointController.setEnabled(false)
  }

  function destroy() {
    stopHealthCheck()
    for (const controller of Object.values(controllers)) {
      controller.destroy?.()
    }
    breakpointController.destroy?.()
    document.removeEventListener('keydown', handleKeyDown, true)
    document.removeEventListener('click', handleUiClick, true)
    document.removeEventListener('change', handleUiChange, true)
    rekaModalShield.stop()
    teardownTooltips()
    window.removeEventListener('pagehide', handleLifecycleCleanup)
    window.removeEventListener('beforeunload', handleLifecycleCleanup)
    state.enabled = false
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

  function handleLifecycleCleanup() {
    destroy()
  }

  document.addEventListener('keydown', handleKeyDown, true)
  document.addEventListener('click', handleUiClick, true)
  document.addEventListener('change', handleUiChange, true)
  rekaModalShield.start()
  window.addEventListener('pagehide', handleLifecycleCleanup)
  window.addEventListener('beforeunload', handleLifecycleCleanup)
  initTooltips()
  startHealthCheck()

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === MESSAGE_TYPE.PING) {
      sendResponse({ ok: true })
      return true
    }

    if (message?.type === MESSAGE_TYPE.GET_STATE) {
      sendResponse({ enabled: state.enabled, mode: state.mode, breakpoint: breakpointController.getState() })
      return true
    }

    if (message?.type === MESSAGE_TYPE.TOGGLE) {
      setMode(message.mode || MODE.INSPECT)
      setEnabled(!state.enabled)
      sendResponse({ enabled: state.enabled, mode: state.mode, breakpoint: breakpointController.getState() })
      return true
    }

    if (message?.type === MESSAGE_TYPE.SET_ENABLED) {
      setMode(message.mode || MODE.INSPECT)
      setEnabled(!!message.enabled)
      sendResponse({ enabled: state.enabled, mode: state.mode, breakpoint: breakpointController.getState() })
      return true
    }

    if (message?.type === MESSAGE_TYPE.SET_BREAKPOINT) {
      if (message.toggle) {
        setBreakpointEnabled(!breakpointController.getState().enabled)
      } else {
        setBreakpointEnabled(!!message.enabled)
      }
      sendResponse({ enabled: state.enabled, mode: state.mode, breakpoint: breakpointController.getState() })
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
