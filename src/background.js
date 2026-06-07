chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ layoutPilotInstalledAt: new Date().toISOString() })
})

const MESSAGE_TYPE = {
  CAPTURE_VISIBLE_TAB: 'layoutpilot:capture-visible-tab',
  STORE_REVIEW_REPORT: 'layoutpilot:store-review-report',
  GET_REVIEW_REPORT: 'layoutpilot:get-review-report',
  CLEAR_REVIEW_REPORT: 'layoutpilot:clear-review-report',
  SET_FRAME_UNBLOCK: 'layoutpilot:set-frame-unblock'
}

// Pages that send X-Frame-Options / CSP frame-ancestors refuse to load in the
// preview iframe. While breakpoint mode is active we strip those response
// headers for sub-frame requests in the previewed tab only, using a session
// declarativeNetRequest rule scoped by tabId (auto-removed when the rule is
// cleared, the tab closes, or the browser session ends).
const FRAME_UNBLOCK_RULE_OFFSET = 1_000_000

function frameUnblockRuleId(tabId) {
  return FRAME_UNBLOCK_RULE_OFFSET + tabId
}

function setFrameUnblock(tabId, enabled, sendResponse) {
  if (!Number.isInteger(tabId)) {
    sendResponse({ ok: false, error: serializeCaptureError('No tab id for frame unblock.') })
    return
  }

  const ruleId = frameUnblockRuleId(tabId)
  const addRules = enabled
    ? [
        {
          id: ruleId,
          priority: 1,
          action: {
            type: 'modifyHeaders',
            responseHeaders: [
              { header: 'x-frame-options', operation: 'remove' },
              { header: 'content-security-policy', operation: 'remove' },
              { header: 'content-security-policy-report-only', operation: 'remove' }
            ]
          },
          condition: {
            tabIds: [tabId],
            resourceTypes: ['sub_frame']
          }
        }
      ]
    : []

  chrome.declarativeNetRequest.updateSessionRules({ addRules, removeRuleIds: [ruleId] }, () => {
    const runtimeError = chrome.runtime.lastError
    if (runtimeError) {
      sendResponse({ ok: false, error: serializeCaptureError(runtimeError.message) })
      return
    }
    sendResponse({ ok: true })
  })
}

// Drop the per-tab rule if the previewed tab is closed without disabling first.
chrome.tabs.onRemoved.addListener(tabId => {
  if (!Number.isInteger(tabId)) return
  chrome.declarativeNetRequest.updateSessionRules(
    { removeRuleIds: [frameUnblockRuleId(tabId)] },
    () => void chrome.runtime.lastError
  )
})

const reviewReports = new Map()
const REVIEW_REPORT_TTL_MS = 10 * 60 * 1000

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

function storeReviewReport(message, sendResponse) {
  const id = typeof message.id === 'string' && message.id ? message.id : crypto.randomUUID()
  const payload = message.payload && typeof message.payload === 'object' ? message.payload : null

  if (!payload) {
    sendResponse({ ok: false, error: serializeCaptureError('Missing review report payload.') })
    return
  }

  const previousRecord = reviewReports.get(id)
  if (previousRecord?.timeoutId) clearTimeout(previousRecord.timeoutId)

  const timeoutId = setTimeout(() => {
    reviewReports.delete(id)
  }, REVIEW_REPORT_TTL_MS)

  reviewReports.set(id, { payload, timeoutId })
  chrome.tabs.create({ url: chrome.runtime.getURL(`src/report/review-report.html?id=${encodeURIComponent(id)}`) }, tab => {
    const runtimeError = chrome.runtime.lastError
    if (runtimeError) {
      reviewReports.delete(id)
      clearTimeout(timeoutId)
      sendResponse({ ok: false, error: serializeCaptureError(runtimeError.message) })
      return
    }

    sendResponse({ ok: true, id, tabId: tab?.id })
  })
}

function getReviewReport(message, sendResponse) {
  const id = typeof message.id === 'string' ? message.id : ''
  const record = reviewReports.get(id)

  if (!record) {
    sendResponse({ ok: false, error: serializeCaptureError('Review report payload not found.') })
    return
  }

  sendResponse({ ok: true, payload: record.payload })
}

function clearReviewReport(message, sendResponse) {
  const id = typeof message.id === 'string' ? message.id : ''
  const record = reviewReports.get(id)

  if (record?.timeoutId) clearTimeout(record.timeoutId)
  reviewReports.delete(id)
  sendResponse({ ok: true })
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === MESSAGE_TYPE.CAPTURE_VISIBLE_TAB) {
    captureVisibleTabForSender(sender, sendResponse)
    return true
  }

  if (message?.type === MESSAGE_TYPE.STORE_REVIEW_REPORT) {
    storeReviewReport(message, sendResponse)
    return true
  }

  if (message?.type === MESSAGE_TYPE.GET_REVIEW_REPORT) {
    getReviewReport(message, sendResponse)
    return true
  }

  if (message?.type === MESSAGE_TYPE.CLEAR_REVIEW_REPORT) {
    clearReviewReport(message, sendResponse)
    return true
  }

  if (message?.type === MESSAGE_TYPE.SET_FRAME_UNBLOCK) {
    setFrameUnblock(sender?.tab?.id, !!message.enabled, sendResponse)
    return true
  }

  return false
})
