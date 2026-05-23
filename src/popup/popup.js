const toggleButton = document.getElementById('toggle-button')
const statusText = document.getElementById('status-text')
const statusDot = document.getElementById('status-dot')
const modeInspect = document.getElementById('mode-inspect')
const modeReview = document.getElementById('mode-review')
const languageSelect = document.getElementById('language-select')
const { MODE, MESSAGE_TYPE, CONTENT_CSS_FILES, CONTENT_SCRIPT_FILES } = window.LayoutPilotModules.constants
const { sendToTab } = window.LayoutPilotModules.messaging
const {
  AUTO_LANGUAGE,
  loadLanguagePreference,
  setLanguagePreference,
  getCurrentPreference,
  getCurrentLanguage,
  t
} = window.LayoutPilotModules.i18n

const state = {
  enabled: false,
  mode: MODE.INSPECT,
  statusKey: 'popup.status.checking'
}

const textBindings = {
  'tagline-text': 'app.tagline',
  'mode-title': 'popup.mode.title',
  'mode-inspect-name': 'popup.mode.inspect.name',
  'mode-inspect-description': 'popup.mode.inspect.description',
  'mode-review-name': 'popup.mode.review.name',
  'mode-review-description': 'popup.mode.review.description',
  'shortcuts-title': 'popup.shortcuts.title',
  'shortcut-inspect': 'shortcuts.inspect',
  'shortcut-help': 'shortcuts.help',
  'shortcut-quit': 'shortcuts.quit',
  'shortcut-cancel': 'shortcuts.cancel',
  'shortcut-context': 'shortcuts.context',
  'shortcut-pin': 'shortcuts.pin',
  'shortcut-details': 'shortcuts.details',
  'shortcut-note': 'popup.shortcuts.note',
  'language-title': 'language.title',
  'language-label': 'language.label'
}

const languageOptionLabels = {
  auto: 'language.auto',
  'pt-BR': 'language.portuguese',
  en: 'language.english',
  es: 'language.spanish'
}

function normalizeMode(mode) {
  return mode === MODE.REVIEW ? MODE.REVIEW : MODE.INSPECT
}

function getActiveStatusKey(mode) {
  return normalizeMode(mode) === MODE.REVIEW ? 'popup.status.reviewActive' : 'popup.status.inspectActive'
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  return tab
}

function isInspectableTab(tab) {
  return tab?.id && /^https?:\/\//.test(tab.url || '')
}

function setElementText(id, value) {
  const element = document.getElementById(id)
  if (element) element.textContent = value
}

function renderLanguageOptions() {
  for (const option of Array.from(languageSelect.options)) {
    option.textContent = t(languageOptionLabels[option.value] || option.textContent)
  }
  languageSelect.value = getCurrentPreference() || AUTO_LANGUAGE
  document.documentElement.lang = getCurrentLanguage()
}

function renderPopupTexts() {
  for (const [id, key] of Object.entries(textBindings)) {
    setElementText(id, t(key))
  }

  renderLanguageOptions()
  statusText.textContent = t(state.statusKey)
  toggleButton.textContent = state.enabled ? t('common.deactivate') : t('common.activate')
}

function renderModeSelection() {
  modeInspect.checked = state.mode === MODE.INSPECT
  modeReview.checked = state.mode === MODE.REVIEW
}

function setStatus(enabled, statusKey, mode = MODE.INSPECT) {
  state.enabled = !!enabled
  state.mode = normalizeMode(mode)
  state.statusKey = statusKey

  statusDot.classList.toggle('active', !!enabled)
  statusText.textContent = t(statusKey)
  toggleButton.textContent = enabled ? t('common.deactivate') : t('common.activate')
  renderModeSelection()
}

async function ensureContentScript(tabId) {
  const ping = await sendToTab(tabId, { type: MESSAGE_TYPE.PING })
  if (ping?.ok) return

  await chrome.scripting.insertCSS({
    target: { tabId },
    files: CONTENT_CSS_FILES
  })

  for (const file of CONTENT_SCRIPT_FILES) {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: [file]
    })
  }
}

async function refreshStatus() {
  const tab = await getActiveTab()

  if (!isInspectableTab(tab)) {
    toggleButton.disabled = true
    setStatus(false, 'popup.status.unsupported', state.mode)
    return
  }

  toggleButton.disabled = false
  const response = await sendToTab(tab.id, { type: MESSAGE_TYPE.GET_STATE })
  const enabled = !!response?.enabled
  const mode = response?.mode || state.mode
  setStatus(enabled, enabled ? getActiveStatusKey(mode) : 'popup.status.inactive', mode)
}

toggleButton.addEventListener('click', async () => {
  const tab = await getActiveTab()
  if (!isInspectableTab(tab)) return

  toggleButton.disabled = true
  try {
    await ensureContentScript(tab.id)
    const response = await sendToTab(tab.id, {
      type: MESSAGE_TYPE.SET_ENABLED,
      enabled: !state.enabled,
      mode: state.mode
    })
    if (!response) {
      setStatus(false, 'popup.status.inactive', state.mode)
      return
    }

    const mode = response?.mode || state.mode
    setStatus(
      !!response?.enabled,
      response?.enabled ? getActiveStatusKey(mode) : 'popup.status.inactive',
      mode
    )
    if (response?.enabled) {
      window.close()
    }
  } finally {
    toggleButton.disabled = false
  }
})

async function handleModeChange(mode) {
  state.mode = normalizeMode(mode)
  renderModeSelection()

  if (!state.enabled) return

  const tab = await getActiveTab()
  if (!isInspectableTab(tab)) return

  const response = await sendToTab(tab.id, {
    type: MESSAGE_TYPE.SET_ENABLED,
    enabled: true,
    mode: state.mode
  })
  if (!response) {
    setStatus(false, 'popup.status.inactive', state.mode)
    return
  }

  const responseMode = response?.mode || state.mode
  setStatus(!!response?.enabled, response?.enabled ? getActiveStatusKey(responseMode) : 'popup.status.inactive', responseMode)
}

modeInspect.addEventListener('change', () => {
  if (modeInspect.checked) handleModeChange(MODE.INSPECT)
})

modeReview.addEventListener('change', () => {
  if (modeReview.checked) handleModeChange(MODE.REVIEW)
})

languageSelect.addEventListener('change', async () => {
  const result = await setLanguagePreference(languageSelect.value)
  renderPopupTexts()

  const tab = await getActiveTab()
  if (isInspectableTab(tab)) {
    await sendToTab(tab.id, {
      type: MESSAGE_TYPE.SET_LANGUAGE,
      preference: result.preference,
      language: result.language
    })
  }
})

async function initializePopup() {
  await loadLanguagePreference()
  renderPopupTexts()
  await refreshStatus()
}

initializePopup()
