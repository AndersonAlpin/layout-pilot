const toggleButton = document.getElementById('toggle-button')
const statusText = document.getElementById('status-text')
const statusDot = document.getElementById('status-dot')
const modeInspect = document.getElementById('mode-inspect')
const { MODE, MESSAGE_TYPE, CONTENT_CSS_FILES, CONTENT_SCRIPT_FILES } = window.LayoutPilotModules.constants
const { sendToTab } = window.LayoutPilotModules.messaging

const state = {
  enabled: false,
  mode: MODE.INSPECT
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  return tab
}

function isInspectableTab(tab) {
  return tab?.id && /^https?:\/\//.test(tab.url || '')
}

function setStatus(enabled, message, mode = MODE.INSPECT) {
  state.enabled = !!enabled
  state.mode = mode === MODE.REVIEW ? MODE.REVIEW : MODE.INSPECT

  statusDot.classList.toggle('active', !!enabled)
  statusText.textContent = message
  toggleButton.textContent = enabled ? 'Desativar' : 'Ativar'
  modeInspect.checked = state.mode === MODE.INSPECT
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
    setStatus(false, 'Abra uma página http/https para inspecionar.')
    return
  }

  toggleButton.disabled = false
  const response = await sendToTab(tab.id, { type: MESSAGE_TYPE.GET_STATE })
  const enabled = !!response?.enabled
  const mode = response?.mode || MODE.INSPECT
  const message = enabled ? 'Modo Inspeção ativo.' : 'LayoutPilot desativado.'
  setStatus(enabled, message, mode)
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
      mode: MODE.INSPECT
    })
    setStatus(
      !!response?.enabled,
      response?.enabled ? 'Modo Inspeção ativo.' : 'LayoutPilot desativado.',
      response?.mode || MODE.INSPECT
    )
    if (response?.enabled) {
      window.close()
    }
  } finally {
    toggleButton.disabled = false
  }
})

refreshStatus()
