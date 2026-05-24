chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ layoutPilotInstalledAt: new Date().toISOString() })
})

const MESSAGE_TYPE = {
  CAPTURE_VISIBLE_TAB: 'layoutpilot:capture-visible-tab'
}

function serializeCaptureError(error) {
  const message = typeof error === 'string'
    ? error
    : error?.message || 'Unable to capture the visible tab.'

  return { message }
}

function captureVisibleTabForSender(sender, sendResponse) {
  const windowId = Number.isInteger(sender?.tab?.windowId) ? sender.tab.windowId : null
  const options = { format: 'png' }

  const handleCaptured = dataUrl => {
    const runtimeError = chrome.runtime.lastError
    if (runtimeError) {
      sendResponse({ ok: false, error: serializeCaptureError(runtimeError.message) })
      return
    }

    if (!dataUrl) {
      sendResponse({ ok: false, error: serializeCaptureError('Chrome did not return a capture image.') })
      return
    }

    sendResponse({ ok: true, dataUrl })
  }

  try {
    if (windowId != null) {
      chrome.tabs.captureVisibleTab(windowId, options, handleCaptured)
    } else {
      chrome.tabs.captureVisibleTab(options, handleCaptured)
    }
  } catch (error) {
    sendResponse({ ok: false, error: serializeCaptureError(error) })
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== MESSAGE_TYPE.CAPTURE_VISIBLE_TAB) return false

  captureVisibleTabForSender(sender, sendResponse)
  return true
})
