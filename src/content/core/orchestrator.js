(() => {
  const {
    constants,
    dom,
    inspectMode,
    modalShield,
    reviewMode,
    figmaDiffMode,
    shortcuts,
    ui,
    i18n
  } = window.LayoutPilotModules
  const { INSTANCE_KEY, MODE, MESSAGE_TYPE, SHORTCUT, SHORTCUTS_BY_MODE, UI_SELECTOR } = constants
  const { createElement, isLayoutPilotElement, escapeHtml } = dom
  const { createInspectMode } = inspectMode
  const { createModalShield } = modalShield
  const { createReviewMode } = reviewMode
  const { createFigmaDiffMode } = figmaDiffMode
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
    healthCheckTimer: null
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

  const controllers = {
    [MODE.INSPECT]: createInspectMode({
      showToast,
      t
    }),
    [MODE.REVIEW]: createReviewMode({
      showToast,
      t
    }),
    [MODE.COMPARE]: createFigmaDiffMode({
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
    const noteKeyByMode = {
      [MODE.INSPECT]: 'help.note.inspect',
      [MODE.REVIEW]: 'help.note.review',
      [MODE.COMPARE]: 'help.note.compare'
    }
    return t(noteKeyByMode[state.mode] || 'help.note.inspect')
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

    getController().handleUiClick?.(event)
  }

  function handleKeyDown(event) {
    const normalized = normalizeKey(event)
    const isNonInspectMode = state.enabled && state.mode !== MODE.INSPECT
    const allowModeCancel = isNonInspectMode && normalized === SHORTCUT.CANCEL

    if (shouldIgnoreShortcut(event) && !allowModeCancel) return

    const activeController = getController()
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

    if (normalized === SHORTCUT.INSPECT) {
      consumeShortcut(event)
      if (isNonInspectMode) return

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

  function startMode(mode) {
    getController(mode).start()
  }

  function stopMode(mode) {
    getController(mode).stop()
  }

  function setMode(mode) {
    const nextMode = controllers[mode] ? mode : MODE.INSPECT
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
    for (const controller of Object.values(controllers)) {
      controller.destroy?.()
    }
    document.removeEventListener('keydown', handleKeyDown, true)
    document.removeEventListener('click', handleUiClick, true)
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
