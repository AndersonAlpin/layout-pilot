(() => {
  const root = window.LayoutPilotModules ||= {}

  async function sendToTab(tabId, message) {
    try {
      return await chrome.tabs.sendMessage(tabId, message)
    } catch {
      return null
    }
  }

  root.messaging = {
    sendToTab
  }
})()
