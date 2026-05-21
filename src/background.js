chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ layoutPilotInstalledAt: new Date().toISOString() })
})
