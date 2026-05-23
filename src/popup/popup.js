const toggleButton = document.getElementById('toggle-button')
const statusText = document.getElementById('status-text')
const statusDot = document.getElementById('status-dot')
const modeInspect = document.getElementById('mode-inspect')

const state = {
  enabled: false,
  mode: 'inspect'
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  return tab
}

function isInspectableTab(tab) {
  return tab?.id && /^https?:\/\//.test(tab.url || '')
}

function setStatus(enabled, message, mode = 'inspect') {
  state.enabled = !!enabled
  state.mode = mode === 'review' ? 'review' : 'inspect'

  statusDot.classList.toggle('active', !!enabled)
  statusText.textContent = message
  toggleButton.textContent = enabled ? 'Desativar' : 'Ativar'
  modeInspect.checked = state.mode === 'inspect'
}

async function sendToTab(tabId, message) {
  try {
    return await chrome.tabs.sendMessage(tabId, message)
  } catch {
    return null
  }
}

async function ensureContentScript(tabId) {
  const ping = await sendToTab(tabId, { type: 'layoutpilot:ping' })
  if (ping?.ok) return

  await chrome.scripting.insertCSS({
    target: { tabId },
    files: ['src/content/inspector.css']
  })

  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['src/content/inspector.js']
  })
}

async function refreshStatus() {
  const tab = await getActiveTab()

  if (!isInspectableTab(tab)) {
    toggleButton.disabled = true
    setStatus(false, 'Abra uma página http/https para inspecionar.')
    return
  }

  toggleButton.disabled = false
  const response = await sendToTab(tab.id, { type: 'layoutpilot:get-state' })
  const enabled = !!response?.enabled
  const mode = response?.mode || 'inspect'
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
      type: 'layoutpilot:set-enabled',
      enabled: !state.enabled,
      mode: 'inspect'
    })
    setStatus(
      !!response?.enabled,
      response?.enabled ? 'Modo Inspeção ativo.' : 'LayoutPilot desativado.',
      response?.mode || 'inspect'
    )
    if (response?.enabled) {
      window.close()
    }
  } finally {
    toggleButton.disabled = false
  }
})

refreshStatus()
