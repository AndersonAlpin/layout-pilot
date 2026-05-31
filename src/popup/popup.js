const toggleButton = document.getElementById('toggle-button')
const statusText = document.getElementById('status-text')
const statusDot = document.getElementById('status-dot')
const modeInspect = document.getElementById('mode-inspect')
const modeReview = document.getElementById('mode-review')
const modeCompare = document.getElementById('mode-compare')
const languagePicker = document.getElementById('language-picker')
const languageToggle = document.getElementById('language-toggle')
const languageMenu = document.getElementById('language-menu')
const languageCurrentFlag = document.getElementById('language-current-flag')
const shortcutGrid = document.getElementById('shortcut-grid')
const { MODE, MESSAGE_TYPE, CONTENT_CSS_FILES, CONTENT_SCRIPT_FILES, SHORTCUTS_BY_MODE, STORAGE_KEYS } = window.LayoutPilotModules.constants
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
let languageCloseTimer = null

const textBindings = {
  'mode-title': 'popup.mode.title',
  'mode-inspect-name': 'popup.mode.inspect.name',
  'mode-inspect-description': 'popup.mode.inspect.description',
  'mode-review-name': 'popup.mode.review.name',
  'mode-review-description': 'popup.mode.review.description',
  'mode-compare-name': 'popup.mode.compare.name',
  'mode-compare-description': 'popup.mode.compare.description',
  'shortcuts-title': 'popup.shortcuts.title',
  'shortcut-note': 'popup.shortcuts.note'
}

const languageOptions = {
  auto: { labelKey: 'language.auto' },
  'pt-BR': { flagSrc: '../assets/flags/pt-BR.png', labelKey: 'language.portuguese' },
  en: { flagSrc: '../assets/flags/en.png', labelKey: 'language.english' },
  es: { flagSrc: '../assets/flags/es.png', labelKey: 'language.spanish' }
}

for (const language of Object.values(languageOptions)) {
  if (!language.flagSrc) continue
  const image = new Image(20, 14)
  image.decoding = 'sync'
  image.loading = 'eager'
  image.src = language.flagSrc
}

function normalizeMode(mode) {
  return Object.values(MODE).includes(mode) ? mode : MODE.INSPECT
}

function getActiveStatusKey(mode) {
  const normalizedMode = normalizeMode(mode)
  if (normalizedMode === MODE.REVIEW) return 'popup.status.reviewActive'
  if (normalizedMode === MODE.COMPARE) return 'popup.status.compareActive'
  return 'popup.status.inspectActive'
}

async function loadModePreference() {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.LAST_MODE)
    state.mode = normalizeMode(result?.[STORAGE_KEYS.LAST_MODE])
  } catch {
    state.mode = MODE.INSPECT
  }
}

async function setModePreference(mode) {
  const normalizedMode = normalizeMode(mode)
  state.mode = normalizedMode

  try {
    await chrome.storage.local.set({ [STORAGE_KEYS.LAST_MODE]: normalizedMode })
  } catch {
    // Keep the popup usable even if storage is temporarily unavailable.
  }

  return normalizedMode
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

function closeLanguageMenu() {
  window.clearTimeout(languageCloseTimer)
  if (languageMenu.hidden) {
    languagePicker.classList.remove('is-open')
    languageToggle.setAttribute('aria-expanded', 'false')
    return
  }

  languagePicker.classList.remove('is-open')
  languageToggle.setAttribute('aria-expanded', 'false')
  languageCloseTimer = window.setTimeout(() => {
    languageMenu.hidden = true
    languageCloseTimer = null
  }, 160)
}

function toggleLanguageMenu() {
  const isOpen = !languagePicker.classList.contains('is-open')
  if (!isOpen) {
    closeLanguageMenu()
    return
  }

  window.clearTimeout(languageCloseTimer)
  languageMenu.hidden = false
  languageToggle.setAttribute('aria-expanded', 'true')
  window.requestAnimationFrame(() => {
    languagePicker.classList.add('is-open')
  })
}

async function chooseLanguagePreference(preference) {
  const result = await setLanguagePreference(preference)
  closeLanguageMenu()
  renderPopupTexts()

  const tab = await getActiveTab()
  if (isInspectableTab(tab)) {
    await sendToTab(tab.id, {
      type: MESSAGE_TYPE.SET_LANGUAGE,
      preference: result.preference,
      language: result.language
    })
  }
}

function getLanguageOptionIcon(language, className) {
  if (language.flagSrc) {
    const image = document.createElement('img')
    image.className = className
    image.width = 20
    image.height = 14
    image.decoding = 'sync'
    image.loading = 'eager'
    image.draggable = false
    image.src = language.flagSrc
    image.alt = ''
    image.setAttribute('aria-hidden', 'true')
    return image
  }

  const span = document.createElement('span')
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
  const horizontal = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  const vertical = document.createElementNS('http://www.w3.org/2000/svg', 'path')

  span.className = className
  span.setAttribute('aria-hidden', 'true')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('width', '14')
  svg.setAttribute('height', '14')
  svg.setAttribute('fill', 'none')
  svg.setAttribute('stroke', 'currentColor')
  svg.setAttribute('stroke-width', '2')
  svg.setAttribute('stroke-linecap', 'round')
  svg.setAttribute('stroke-linejoin', 'round')
  circle.setAttribute('cx', '12')
  circle.setAttribute('cy', '12')
  circle.setAttribute('r', '9')
  horizontal.setAttribute('d', 'M3 12h18')
  vertical.setAttribute('d', 'M12 3c2.3 2.6 3.5 5.6 3.5 9S14.3 18.4 12 21c-2.3-2.6-3.5-5.6-3.5-9S9.7 5.6 12 3Z')
  svg.append(circle, horizontal, vertical)
  span.append(svg)
  return span
}

function renderLanguageOptions() {
  const currentPreference = getCurrentPreference() || AUTO_LANGUAGE
  languageCurrentFlag.src = languageOptions[getCurrentLanguage()]?.flagSrc || languageOptions['pt-BR'].flagSrc
  languageToggle.setAttribute('aria-label', t('language.label'))
  languageMenu.replaceChildren()

  for (const [value, language] of Object.entries(languageOptions)) {
    const button = document.createElement('button')
    const label = document.createElement('span')
    button.type = 'button'
    button.className = 'language-option'
    button.dataset.languagePreference = value
    button.setAttribute('role', 'option')
    button.setAttribute('aria-selected', String(value === currentPreference))
    button.append(getLanguageOptionIcon(language, language.flagSrc ? 'language-option-flag' : 'language-option-auto'))
    label.textContent = t(language.labelKey)
    button.append(label)
    languageMenu.append(button)
  }

  document.documentElement.lang = getCurrentLanguage()
}

function renderShortcuts() {
  const shortcuts = SHORTCUTS_BY_MODE[normalizeMode(state.mode)] || SHORTCUTS_BY_MODE[MODE.INSPECT]
  const fragment = document.createDocumentFragment()

  for (const shortcut of shortcuts) {
    const item = document.createElement('div')
    const key = document.createElement('kbd')
    const label = document.createElement('span')
    item.className = 'shortcut-item'
    key.textContent = shortcut.key
    label.textContent = t(shortcut.labelKey)
    item.append(key, label)
    fragment.append(item)
  }

  shortcutGrid.replaceChildren(fragment)
}

function renderPopupTexts() {
  for (const [id, key] of Object.entries(textBindings)) {
    setElementText(id, t(key))
  }

  renderShortcuts()
  renderLanguageOptions()
  statusText.textContent = t(state.statusKey)
  toggleButton.textContent = state.enabled ? t('common.deactivate') : t('common.activate')
}

function renderModeSelection() {
  modeInspect.checked = state.mode === MODE.INSPECT
  modeReview.checked = state.mode === MODE.REVIEW
  modeCompare.checked = state.mode === MODE.COMPARE
  renderShortcuts()
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
  const mode = enabled ? response?.mode || state.mode : state.mode
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
    if (response?.enabled) {
      await setModePreference(mode)
    }
    setStatus(
      !!response?.enabled,
      response?.enabled ? getActiveStatusKey(mode) : 'popup.status.inactive',
      mode
    )
    if (response?.enabled) {
      window.close()
    }
  } catch {
    setStatus(false, 'popup.status.injectionFailed', state.mode)
  } finally {
    toggleButton.disabled = false
  }
})

async function handleModeChange(mode) {
  await setModePreference(mode)
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

modeCompare.addEventListener('change', () => {
  if (modeCompare.checked) handleModeChange(MODE.COMPARE)
})

languageToggle.addEventListener('click', event => {
  event.preventDefault()
  toggleLanguageMenu()
})

languageMenu.addEventListener('click', event => {
  const option = event.target?.closest?.('[data-language-preference]')
  if (!option) return
  chooseLanguagePreference(option.dataset.languagePreference)
})

document.addEventListener('click', event => {
  if (languagePicker.contains(event.target)) return
  closeLanguageMenu()
})

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeLanguageMenu()
})

async function initializePopup() {
  await loadLanguagePreference()
  await loadModePreference()
  renderPopupTexts()
  await refreshStatus()
}

initializePopup()
