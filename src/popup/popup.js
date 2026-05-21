const toggleButton = document.getElementById('toggle-button')
const statusText = document.getElementById('status-text')
const statusDot = document.getElementById('status-dot')

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  return tab
}

function isInspectableTab(tab) {
  return tab?.id && /^https?:\/\//.test(tab.url || '')
}

function setStatus(enabled, message) {
  statusDot.classList.toggle('active', !!enabled)
  statusText.textContent = message
  toggleButton.textContent = enabled ? 'Disable inspect mode' : 'Enable inspect mode'
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
    setStatus(false, 'Open an http/https page to inspect.')
    return
  }

  toggleButton.disabled = false
  const response = await sendToTab(tab.id, { type: 'layoutpilot:get-state' })
  setStatus(!!response?.enabled, response?.enabled ? 'Inspect mode is active.' : 'Inspect mode is off.')
}

toggleButton.addEventListener('click', async () => {
  const tab = await getActiveTab()
  if (!isInspectableTab(tab)) return

  toggleButton.disabled = true
  try {
    await ensureContentScript(tab.id)
    const response = await sendToTab(tab.id, { type: 'layoutpilot:toggle' })
    setStatus(!!response?.enabled, response?.enabled ? 'Inspect mode is active.' : 'Inspect mode is off.')
  } finally {
    toggleButton.disabled = false
  }
})

refreshStatus()
