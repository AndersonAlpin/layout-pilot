(() => {
  const root = window.LayoutPilotModules ||= {}
  const { createElement, escapeHtml } = root.dom
  const { MESSAGE_TYPE, STORAGE_KEYS } = root.constants
  const { icon } = root.icons
  const { createPopoverMenu, getTooltipAttrs, renderAttrs } = root.ui
  const BRAND_LOGO_URL = chrome.runtime.getURL('src/assets/brand/logo-horizontal.png')
  const {
    BREAKPOINT_PRESET_GROUPS,
    DEFAULT_PRESET_ID,
    getBreakpointPreset,
    normalizeCustomBreakpointPresets,
    createCustomBreakpointPreset,
    findBreakpointPreset,
    resolveBreakpointPresetBySize,
    hasBreakpointPresetDimensions,
    renameCustomBreakpointPreset,
    removeCustomBreakpointPreset,
    normalizeBreakpointDimension,
    rotateBreakpointViewport,
    classifyFrameProbe,
    resolveBreakpointNavigationUrl,
    normalizeBreakpointInteraction,
    frameToInternalPoint,
    internalRectToViewport
  } = root.breakpointPresets

  const FRAME_LOAD_TIMEOUT_MS = 12000
  const FRAME_URL_SYNC_INTERVAL_MS = 300
  const PAN_THRESHOLD = 4

  function tip(text) {
    return renderAttrs(getTooltipAttrs(text, { delayMs: 400 }))
  }

  function getTimestampForFilename(date = new Date()) {
    const pad = value => String(value).padStart(2, '0')
    return [
      date.getFullYear(),
      pad(date.getMonth() + 1),
      pad(date.getDate())
    ].join('-') + '-' + [
      pad(date.getHours()),
      pad(date.getMinutes())
    ].join('-')
  }

  function slugFilenamePart(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  function loadImage(dataUrl) {
    return new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('Could not load captured image.'))
      image.src = dataUrl
    })
  }

  function canvasToPngBlob(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (!blob) {
          reject(new Error('Could not export preview canvas.'))
          return
        }
        resolve(blob)
      }, 'image/png')
    })
  }

  function downloadPngBlob(blob, filename) {
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = filename
    link.style.display = 'none'
    document.documentElement.append(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
  }

  function waitForCaptureRepaint() {
    return new Promise(resolve => {
      if (typeof window.requestAnimationFrame !== 'function') {
        window.setTimeout(resolve, 50)
        return
      }

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => window.setTimeout(resolve, 0))
      })
    })
  }

  async function requestVisibleTabCapture() {
    await waitForCaptureRepaint()

    return new Promise((resolve, reject) => {
      try {
        chrome.runtime.sendMessage({ type: MESSAGE_TYPE.CAPTURE_VISIBLE_TAB }, response => {
          const runtimeError = chrome.runtime.lastError
          if (runtimeError) {
            reject(new Error(runtimeError.message))
            return
          }

          if (!response?.ok) {
            reject(new Error(response?.error?.message || 'Unable to capture the visible tab.'))
            return
          }

          if (typeof response.dataUrl !== 'string' || !response.dataUrl.startsWith('data:image/png')) {
            reject(new Error('The visible tab capture did not return a PNG data URL.'))
            return
          }

          resolve(response.dataUrl)
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  function createBreakpointMode(options = {}) {
    const {
      showToast,
      t = key => key,
      onInteractionChange,
      onEnabledChange,
      onViewportChange,
      onClose
    } = options
    const defaultPreset = getBreakpointPreset(DEFAULT_PRESET_ID)
    const state = {
      enabled: false,
      interaction: 'navigate',
      workspace: null,
      panel: null,
      stage: null,
      frame: null,
      iframe: null,
      width: defaultPreset?.width || 402,
      height: defaultPreset?.height || 874,
      zoom: 'fit',
      presetId: defaultPreset?.id || DEFAULT_PRESET_ID,
      customPresets: [],
      panelCollapsed: false,
      panToolPinned: false,
      panToolTemporary: false,
      savePresetDialogOpen: false,
      savePresetDialogMode: 'create',
      savePresetId: '',
      savePresetName: '',
      savePresetError: '',
      captureBusy: false,
      panOverlay: null,
      frameBlocked: false,
      frameReady: false,
      // Gates iframe creation until the background confirms the X-Frame-Options /
      // CSP strip rule is active for this tab (the iframe request must be made
      // after the rule exists, since DNR only applies to subsequent requests).
      frameUnblockReady: false,
      frameLoadTimer: null,
      frameLoadNonce: 0,
      frameUrl: '',
      entryUrl: '',
      lastSyncedFrameUrl: '',
      frameUrlSyncTimer: null,
      resizeObserver: null,
      pan: null,
      centerTimer: null,
      preferenceDirty: false
    }

    const presetMenu = createPopoverMenu({ onSelect: value => applyPreset(value) })
    const zoomMenu = createPopoverMenu({ onSelect: value => setZoom(value) })

    loadViewportPreference()

    function getPresetLabel() {
      if (state.presetId === 'custom') return t('breakpoint.presets.custom')
      return findBreakpointPreset(state.presetId, state.customPresets)?.label || t('breakpoint.presets.custom')
    }

    function getState() {
      return {
        enabled: state.enabled,
        interaction: state.interaction,
        width: state.width,
        height: state.height,
        zoom: state.zoom,
        presetId: state.presetId,
        presetLabel: getPresetLabel(),
        panelCollapsed: state.panelCollapsed,
        panToolActive: isPanToolActive(),
        panToolPinned: state.panToolPinned,
        frameBlocked: state.frameBlocked
      }
    }

    function notifyViewportChange() {
      onViewportChange?.(getState())
    }

    function getCurrentUrl() {
      return window.location.href
    }

    function readFrameUrl() {
      try {
        const href = state.iframe?.contentWindow?.location?.href || ''
        return href && href !== 'about:blank' ? href : ''
      } catch {
        return ''
      }
    }

    function syncBrowserUrlToFrame(frameUrl) {
      try {
        const nextUrl = new URL(frameUrl, getCurrentUrl())
        if (nextUrl.origin !== window.location.origin) return
        if (nextUrl.href === getCurrentUrl()) return
        window.history.replaceState(window.history.state, document.title, nextUrl.href)
      } catch {}
    }

    function syncFrameUrl() {
      if (!state.enabled || !state.iframe) return
      const frameUrl = readFrameUrl()
      if (!frameUrl || frameUrl === state.lastSyncedFrameUrl) return
      state.frameUrl = frameUrl
      state.lastSyncedFrameUrl = frameUrl
      syncBrowserUrlToFrame(frameUrl)
    }

    function startFrameUrlSync() {
      if (state.frameUrlSyncTimer) return
      state.frameUrlSyncTimer = window.setInterval(syncFrameUrl, FRAME_URL_SYNC_INTERVAL_MS)
    }

    function stopFrameUrlSync() {
      window.clearInterval(state.frameUrlSyncTimer)
      state.frameUrlSyncTimer = null
    }

    function getFrameExitUrl() {
      const result = resolveBreakpointNavigationUrl(state.entryUrl, state.frameUrl)
      return result.shouldNavigate ? result.url : ''
    }

    function getViewportPreference() {
      return {
        presetId: state.presetId,
        width: state.width,
        height: state.height,
        zoom: state.zoom
      }
    }

    function applyViewportPreference(value) {
      const saved = value || {}
      if (saved.presetId === 'custom') {
        state.width = normalizeBreakpointDimension(saved.width, state.width)
        state.height = normalizeBreakpointDimension(saved.height, state.height)
        state.presetId = resolveBreakpointPresetBySize(state.width, state.height, state.customPresets)?.id || 'custom'
        state.zoom = ['fit', '1', '0.75', '0.5'].includes(String(saved.zoom)) ? String(saved.zoom) : 'fit'
        return true
      }

      const preset = findBreakpointPreset(saved.presetId, state.customPresets) || getBreakpointPreset(DEFAULT_PRESET_ID)
      if (!preset) return false
      state.presetId = preset.id
      state.width = preset.width
      state.height = preset.height
      state.zoom = ['fit', '1', '0.75', '0.5'].includes(String(saved.zoom)) ? String(saved.zoom) : 'fit'
      return true
    }

    async function loadViewportPreference() {
      try {
        const result = await chrome.storage.local.get([
          STORAGE_KEYS.RESPONSIVE_PREVIEW_STATE,
          STORAGE_KEYS.RESPONSIVE_CUSTOM_PRESETS
        ])
        state.customPresets = normalizeCustomBreakpointPresets(result?.[STORAGE_KEYS.RESPONSIVE_CUSTOM_PRESETS])
        if (state.preferenceDirty) {
          if (state.enabled) renderPanel()
          return
        }
        if (!applyViewportPreference(result?.[STORAGE_KEYS.RESPONSIVE_PREVIEW_STATE])) return
        if (state.enabled) {
          render()
          centerFrame()
        }
      } catch {
        // Preference persistence is best-effort; the preview must keep working.
      }
    }

    async function persistCustomPresets() {
      try {
        await chrome.storage.local.set({
          [STORAGE_KEYS.RESPONSIVE_CUSTOM_PRESETS]: state.customPresets
        })
        return true
      } catch {
        showToast?.(t('breakpoint.toast.presetSaveFailed'))
        return false
      }
    }

    async function persistViewportPreference() {
      state.preferenceDirty = true
      try {
        await chrome.storage.local.set({
          [STORAGE_KEYS.RESPONSIVE_PREVIEW_STATE]: getViewportPreference()
        })
      } catch {
        // Preference persistence is best-effort; the preview must keep working.
      }
    }

    // The frame loads the current same-origin URL, so reading its location only
    // throws when the browser replaced it with a cross-origin error page
    // (X-Frame-Options / CSP frame-ancestors). That is the one reliable block
    // signal we have without false positives.
    function probeFrame(iframe) {
      try {
        return { reachable: true, href: iframe.contentWindow?.location?.href || '' }
      } catch {
        return { reachable: false, href: null }
      }
    }

    function handleFrameLoad(nonce) {
      if (!state.iframe || nonce !== state.frameLoadNonce) return

      const status = classifyFrameProbe(probeFrame(state.iframe))
      if (status === 'pending') return

      window.clearTimeout(state.frameLoadTimer)
      if (status === 'ready') {
        syncFrameUrl()
        state.frameReady = true
        if (state.frameBlocked) {
          state.frameBlocked = false
          renderFrame()
        }
        return
      }

      markFrameBlocked(nonce)
    }

    function markFrameBlocked(nonce) {
      if (nonce !== state.frameLoadNonce) return
      window.clearTimeout(state.frameLoadTimer)
      state.frameReady = false
      if (state.frameBlocked) return
      state.frameBlocked = true
      renderFrame()
    }

    function getZoomOptionList() {
      return [
        ['fit', t('breakpoint.zoom.fit')],
        ['1', '100%'],
        ['0.75', '75%'],
        ['0.5', '50%']
      ]
    }

    function getZoomLabel() {
      const match = getZoomOptionList().find(([value]) => String(state.zoom) === value)
      return match ? match[1] : t('breakpoint.zoom.fit')
    }

    function getPresetGroups() {
      const groups = BREAKPOINT_PRESET_GROUPS.map(group => ({
        label: t(group.groupKey),
        items: group.items.map(item => ({
          value: item.id,
          label: item.labelKey ? t(item.labelKey) : item.label,
          meta: `${item.width} x ${item.height}`
        }))
      }))
      if (state.customPresets.length) {
        groups.push({
          label: t('breakpoint.presetGroups.customSaved'),
          items: state.customPresets.map(item => ({
            value: item.id,
            label: item.label,
            meta: `${item.width} x ${item.height}`
          }))
        })
      }
      return groups
    }

    function getZoomGroups() {
      return [{
        items: getZoomOptionList().map(([value, label]) => ({ value, label }))
      }]
    }

    function getInteractionTabs() {
      const tabs = [
        ['navigate', t('breakpoint.interaction.navigate')],
        ['inspect', t('breakpoint.interaction.inspect')]
      ]
      return tabs.map(([value, label]) => `
        <button
          class="layoutpilot-breakpoint-tab ${state.interaction === value ? 'layoutpilot-breakpoint-tab--active' : ''}"
          type="button"
          data-layoutpilot-action="breakpoint-interaction"
          data-layoutpilot-breakpoint-interaction="${escapeHtml(value)}"
          aria-pressed="${state.interaction === value ? 'true' : 'false'}"
        >${escapeHtml(label)}</button>
      `).join('')
    }

    function renderDropdownTrigger({ name, label }) {
      return `
        <button
          type="button"
          class="layoutpilot-breakpoint-dropdown-trigger"
          data-layoutpilot-action="breakpoint-menu"
          data-layoutpilot-breakpoint-menu="${escapeHtml(name)}"
          aria-haspopup="listbox"
        >
          <span class="layoutpilot-breakpoint-dropdown-value">${escapeHtml(label)}</span>
          <span class="layoutpilot-breakpoint-dropdown-chevron">${icon('chevron-down', 16)}</span>
        </button>
      `
    }

    function getDefaultSavePresetName() {
      return createCustomBreakpointPreset({
        width: state.width,
        height: state.height,
        existingPresets: state.customPresets,
        labelPrefix: t('breakpoint.presets.custom')
      }).label
    }

    function getSelectedCustomPreset() {
      if (state.presetId === 'custom') return null
      return state.customPresets.find(preset => preset.id === state.presetId) || null
    }

    function canSaveCurrentSize() {
      return !hasBreakpointPresetDimensions(state.width, state.height, state.customPresets)
    }

    function renderSaveCurrentSizeButton() {
      return canSaveCurrentSize()
        ? `<button class="layoutpilot-breakpoint-secondary-button" type="button" data-layoutpilot-action="breakpoint-open-save-preset">${icon('plus', 14)}<span>${escapeHtml(t('breakpoint.actions.saveCurrentSize'))}</span></button>`
        : ''
    }

    function renderSelectedPresetActions() {
      if (!getSelectedCustomPreset()) return ''
      return `
        <div class="layoutpilot-breakpoint-preset-actions">
          <button class="layoutpilot-breakpoint-mini-button" type="button" data-layoutpilot-action="breakpoint-open-rename-preset">${icon('edit', 14)}<span>${escapeHtml(t('breakpoint.actions.renamePreset'))}</span></button>
          <button class="layoutpilot-breakpoint-mini-button layoutpilot-breakpoint-mini-button--danger" type="button" data-layoutpilot-action="breakpoint-remove-preset">${icon('trash', 14)}<span>${escapeHtml(t('breakpoint.actions.removePreset'))}</span></button>
        </div>
      `
    }

    function renderSavePresetDialog() {
      if (!state.savePresetDialogOpen) return ''
      const isRename = state.savePresetDialogMode === 'rename'
      return `
        <div class="layoutpilot-breakpoint-dialog-backdrop">
          <div class="layoutpilot-breakpoint-dialog" role="dialog" aria-modal="true" aria-labelledby="layoutpilot-breakpoint-save-title">
            <div class="layoutpilot-breakpoint-dialog-body">
              <h3 id="layoutpilot-breakpoint-save-title">${escapeHtml(t(isRename ? 'breakpoint.customPreset.renameTitle' : 'breakpoint.customPreset.title'))}</h3>
              <p>${escapeHtml(t(isRename ? 'breakpoint.customPreset.renameDescription' : 'breakpoint.customPreset.description'))}</p>
              <label class="layoutpilot-breakpoint-dialog-field">
                <span>${escapeHtml(t('breakpoint.customPreset.nameLabel'))}</span>
                <input
                  class="layoutpilot-breakpoint-dialog-input"
                  data-layoutpilot-breakpoint-save-name="true"
                  value="${escapeHtml(state.savePresetName || getDefaultSavePresetName())}"
                  autocomplete="off"
                />
              </label>
              ${state.savePresetError ? `<p class="layoutpilot-breakpoint-dialog-error">${escapeHtml(state.savePresetError)}</p>` : ''}
            </div>
            <div class="layoutpilot-breakpoint-dialog-actions">
              <button class="layoutpilot-breakpoint-dialog-button" type="button" data-layoutpilot-action="breakpoint-cancel-save-preset">${escapeHtml(t('breakpoint.customPreset.cancel'))}</button>
              <button class="layoutpilot-breakpoint-dialog-button layoutpilot-breakpoint-dialog-button--primary" type="button" data-layoutpilot-action="breakpoint-save-preset">${escapeHtml(t(isRename ? 'breakpoint.customPreset.renameSave' : 'breakpoint.customPreset.save'))}</button>
            </div>
          </div>
        </div>
      `
    }

    function isPanToolAvailable() {
      return state.zoom !== 'fit'
    }

    function isPanToolActive() {
      return isPanToolAvailable() && (state.panToolPinned || state.panToolTemporary)
    }

    function renderViewportActions() {
      const moveActive = isPanToolActive()
      const manualZoom = isPanToolAvailable()
      return `
        <div class="layoutpilot-breakpoint-field">
          <span class="layoutpilot-breakpoint-field-label">${escapeHtml(t('breakpoint.fields.preview'))}</span>
          <div class="layoutpilot-breakpoint-viewport-actions">
            ${manualZoom ? `
              <button
                class="layoutpilot-breakpoint-icon-button ${moveActive ? 'layoutpilot-breakpoint-icon-button--active' : ''}"
                type="button"
                data-layoutpilot-action="breakpoint-pan-tool"
                ${tip(t('breakpoint.actions.move'))}
                aria-label="${escapeHtml(t('breakpoint.actions.move'))}"
                aria-pressed="${moveActive ? 'true' : 'false'}"
              >${icon('hand', 16)}</button>
              <button class="layoutpilot-breakpoint-icon-button" type="button" data-layoutpilot-action="breakpoint-center" ${tip(t('breakpoint.actions.center'))} aria-label="${escapeHtml(t('breakpoint.actions.center'))}">${icon('target', 16)}</button>
            ` : ''}
            <button class="layoutpilot-breakpoint-icon-button" type="button" data-layoutpilot-action="breakpoint-capture-preview" ${tip(t('breakpoint.actions.capture'))} aria-label="${escapeHtml(t('breakpoint.actions.capture'))}" ${state.captureBusy ? 'disabled' : ''}>${icon('camera', 16)}</button>
          </div>
        </div>
      `
    }

    function renderPanel() {
      if (!state.panel) return
      presetMenu.close()
      zoomMenu.close()

      if (state.panelCollapsed) {
        state.panel.className = 'layoutpilot-breakpoint-panel layoutpilot-breakpoint-panel--collapsed'
        state.panel.innerHTML = `
          <button class="layoutpilot-breakpoint-rail" type="button" data-layoutpilot-action="breakpoint-expand" ${tip(t('breakpoint.actions.expand'))} aria-label="${escapeHtml(t('breakpoint.actions.expand'))}">
            <span class="layoutpilot-breakpoint-rail-chevron" aria-hidden="true">${icon('chevron-left', 16)}</span>
            <span class="layoutpilot-breakpoint-rail-size">${escapeHtml(`${state.width} x ${state.height}`)}</span>
          </button>
        `
        return
      }

      state.panel.className = 'layoutpilot-breakpoint-panel'
      state.panel.innerHTML = `
        <div class="layoutpilot-breakpoint-panel-header">
          <img class="layoutpilot-breakpoint-logo" src="${escapeHtml(BRAND_LOGO_URL)}" alt="${escapeHtml(t('breakpoint.title'))}" />
          <span class="layoutpilot-breakpoint-panel-header-actions">
            <button class="layoutpilot-breakpoint-icon-button" type="button" data-layoutpilot-action="breakpoint-collapse" ${tip(t('breakpoint.actions.collapse'))} aria-label="${escapeHtml(t('breakpoint.actions.collapse'))}">${icon('chevron-right', 16)}</button>
            <button class="layoutpilot-breakpoint-icon-button layoutpilot-breakpoint-icon-button--primary" type="button" data-layoutpilot-action="breakpoint-close">${escapeHtml(t('breakpoint.actions.close'))}</button>
          </span>
        </div>

        <div class="layoutpilot-breakpoint-field">
          <span class="layoutpilot-breakpoint-field-label">${escapeHtml(t('breakpoint.interaction.label'))}</span>
          <div class="layoutpilot-breakpoint-segmented layoutpilot-breakpoint-segmented--vertical" role="group" aria-label="${escapeHtml(t('breakpoint.interaction.label'))}">
            ${getInteractionTabs()}
          </div>
        </div>

        <div class="layoutpilot-breakpoint-field">
          <span class="layoutpilot-breakpoint-field-label">${escapeHtml(t('breakpoint.fields.preset'))}</span>
          ${renderDropdownTrigger({ name: 'preset', label: getPresetLabel() })}
          <div class="layoutpilot-breakpoint-preset-actions-slot">${renderSelectedPresetActions()}</div>
        </div>

        <div class="layoutpilot-breakpoint-field">
          <span class="layoutpilot-breakpoint-field-label">${escapeHtml(t('breakpoint.fields.size'))}</span>
          <div class="layoutpilot-breakpoint-size-row">
            <input class="layoutpilot-breakpoint-input" data-layoutpilot-breakpoint-field="width" aria-label="${escapeHtml(t('breakpoint.fields.width'))}" inputmode="numeric" value="${state.width}" />
            <span class="layoutpilot-breakpoint-size-separator">x</span>
            <input class="layoutpilot-breakpoint-input" data-layoutpilot-breakpoint-field="height" aria-label="${escapeHtml(t('breakpoint.fields.height'))}" inputmode="numeric" value="${state.height}" />
            <button class="layoutpilot-breakpoint-icon-button" type="button" data-layoutpilot-action="breakpoint-rotate" ${tip(t('breakpoint.actions.rotate'))} aria-label="${escapeHtml(t('breakpoint.actions.rotate'))}">↺</button>
          </div>
          <div class="layoutpilot-breakpoint-save-size-slot">${renderSaveCurrentSizeButton()}</div>
        </div>

        <div class="layoutpilot-breakpoint-field">
          <span class="layoutpilot-breakpoint-field-label">${escapeHtml(t('breakpoint.fields.zoom'))}</span>
          ${renderDropdownTrigger({ name: 'zoom', label: getZoomLabel() })}
        </div>

        ${renderViewportActions()}
        ${renderSavePresetDialog()}
      `
    }

    function syncPanelViewport(sourceTarget = null) {
      if (!state.panel || state.panelCollapsed) return

      const presetTrigger = state.panel.querySelector('[data-layoutpilot-breakpoint-menu="preset"]')
      const presetValue = presetTrigger?.querySelector('.layoutpilot-breakpoint-dropdown-value')
      if (presetValue) presetValue.textContent = getPresetLabel()

      const saveSizeSlot = state.panel.querySelector('.layoutpilot-breakpoint-save-size-slot')
      if (saveSizeSlot) saveSizeSlot.innerHTML = renderSaveCurrentSizeButton()

      const presetActionsSlot = state.panel.querySelector('.layoutpilot-breakpoint-preset-actions-slot')
      if (presetActionsSlot) presetActionsSlot.innerHTML = renderSelectedPresetActions()

      const widthInput = state.panel.querySelector('[data-layoutpilot-breakpoint-field="width"]')
      const heightInput = state.panel.querySelector('[data-layoutpilot-breakpoint-field="height"]')
      if (widthInput && widthInput !== sourceTarget) widthInput.value = String(state.width)
      if (heightInput && heightInput !== sourceTarget) heightInput.value = String(state.height)
    }

    function renderViewportOnly(sourceTarget = null) {
      renderFrame()
      syncPanelViewport(sourceTarget)
    }

    function getResolvedScale() {
      if (state.zoom !== 'fit') return Number.parseFloat(state.zoom) || 1
      if (!state.stage) return 1

      const rect = state.stage.getBoundingClientRect()
      const availableWidth = Math.max(240, rect.width - 32)
      const availableHeight = Math.max(240, rect.height - 32)
      return Math.min(1, availableWidth / state.width, availableHeight / state.height)
    }

    function renderFrame() {
      if (!state.frame) return

      const scale = getResolvedScale()
      state.frame.style.width = `${state.width}px`
      state.frame.style.height = `${state.height}px`
      state.frame.style.transform = state.zoom === 'fit'
        ? `translate(-50%, -50%) scale(${scale})`
        : `scale(${scale})`

      if (state.frameBlocked) {
        state.frame.classList.add('layoutpilot-breakpoint-frame--blocked')
        state.frame.innerHTML = `
          <div>
            <strong class="layoutpilot-breakpoint-blocked-title">${escapeHtml(t('breakpoint.blocked.title'))}</strong>
            <p class="layoutpilot-breakpoint-blocked-copy">${escapeHtml(t('breakpoint.blocked.description'))}</p>
          </div>
        `
        state.iframe = null
        state.panOverlay = null
        return
      }

      state.frame.classList.remove('layoutpilot-breakpoint-frame--blocked')
      if (!state.iframe) {
        // Wait until the header-strip rule is confirmed active before issuing
        // the iframe request (renderFrame is re-run from the unblock ack).
        if (!state.frameUnblockReady) return
        const nonce = ++state.frameLoadNonce
        state.frameReady = false
        const iframe = document.createElement('iframe')
        iframe.setAttribute('title', t('breakpoint.frameTitle'))
        iframe.addEventListener('load', () => handleFrameLoad(nonce))
        iframe.addEventListener('error', () => markFrameBlocked(nonce))
        state.iframe = iframe
        state.frame.replaceChildren(iframe)
        // Load the real same-origin document so the SPA boots inside the frame
        // with its own viewport (media queries, window.innerWidth, dynamic
        // chunk loading and hash routing all work). srcdoc cannot do this for a
        // module/Vite app because import.meta.url becomes about:srcdoc.
        iframe.src = getCurrentUrl()
        startFrameUrlSync()
        state.frameLoadTimer = window.setTimeout(() => {
          if (!state.iframe || nonce !== state.frameLoadNonce || state.frameReady) return
          markFrameBlocked(nonce)
        }, FRAME_LOAD_TIMEOUT_MS)
      }
      syncPanOverlay()
    }

    function syncPanOverlay() {
      if (!state.frame || !state.iframe || state.frameBlocked) return
      if (!isPanToolActive()) {
        state.panOverlay?.remove()
        state.panOverlay = null
        return
      }
      if (!state.panOverlay) {
        state.panOverlay = document.createElement('div')
        state.panOverlay.className = 'layoutpilot-breakpoint-pan-overlay'
        state.panOverlay.setAttribute('aria-hidden', 'true')
      }
      if (!state.panOverlay.isConnected) state.frame.appendChild(state.panOverlay)
    }

    function ensureUi() {
      if (!state.workspace) {
        state.workspace = createElement('layoutpilot-breakpoint-workspace')
        state.workspace.innerHTML = `
          <div class="layoutpilot-breakpoint-stage"></div>
        `
        state.stage = state.workspace.querySelector('.layoutpilot-breakpoint-stage')
      }

      if (!state.frame) {
        state.frame = document.createElement('div')
        state.frame.className = 'layoutpilot-breakpoint-frame'
        state.stage.appendChild(state.frame)
      }

      // Panel is a separate top-level element so it can stack above the
      // inspect hit-shield (see raisePanel).
      if (!state.panel) {
        state.panel = createElement('layoutpilot-breakpoint-panel')
      }
    }

    function updateWorkspaceLayout() {
      if (!state.workspace) return
      state.workspace.classList.toggle('layoutpilot-breakpoint-workspace--panel-collapsed', state.panelCollapsed)
      state.workspace.classList.toggle('layoutpilot-breakpoint-workspace--inspect', state.interaction === 'inspect')
      state.workspace.classList.toggle('layoutpilot-breakpoint-workspace--fit', state.zoom === 'fit')
      state.workspace.classList.toggle('layoutpilot-breakpoint-workspace--pan-tool', isPanToolActive())
    }

    function render() {
      if (!state.enabled) return
      ensureUi()
      updateWorkspaceLayout()
      renderPanel()
      renderFrame()
    }

    function centerFrameNow() {
      if (!state.stage) return
      if (state.zoom === 'fit') {
        state.stage.scrollLeft = 0
        state.stage.scrollTop = 0
        return
      }
      state.stage.scrollLeft = Math.max(0, (state.stage.scrollWidth - state.stage.clientWidth) / 2)
      state.stage.scrollTop = Math.max(0, (state.stage.scrollHeight - state.stage.clientHeight) / 2)
    }

    // Center the frame inside the scrollable workspace. Useful when the frame is
    // bigger than the available area and would otherwise sit off-screen.
    function centerFrame() {
      if (!state.stage) return
      window.requestAnimationFrame(centerFrameNow)
    }

    function scheduleCenter() {
      if (state.centerTimer) window.cancelAnimationFrame(state.centerTimer)
      state.centerTimer = window.requestAnimationFrame(() => {
        state.centerTimer = null
        if (state.pan?.active) return
        centerFrameNow()
      })
    }

    function getTransientCaptureElements() {
      return [
        state.panel,
        document.querySelector('.layoutpilot-tooltip'),
        document.querySelector('.layoutpilot-toast'),
        ...document.querySelectorAll('.layoutpilot-menu')
      ].filter(Boolean)
    }

    function hideTransientUiForPreviewCapture() {
      return getTransientCaptureElements().map(element => {
        const previousVisibility = element.style.visibility
        element.style.visibility = 'hidden'
        return { element, previousVisibility }
      })
    }

    function restoreTransientUi(records = []) {
      for (const record of records) {
        if (!record?.element?.isConnected) continue
        record.element.style.visibility = record.previousVisibility
      }
    }

    function getPreviewCaptureFilename() {
      const presetPart = slugFilenamePart(getPresetLabel()) || 'custom'
      return `layoutpilot-preview-${presetPart}-${state.width}x${state.height}-${getTimestampForFilename()}.png`
    }

    async function cropFrameCapture(dataUrl, frameRect) {
      const image = await loadImage(dataUrl)
      const scaleX = image.width / Math.max(1, window.innerWidth || image.width)
      const scaleY = image.height / Math.max(1, window.innerHeight || image.height)
      const sourceX = Math.max(0, Math.floor(frameRect.left * scaleX))
      const sourceY = Math.max(0, Math.floor(frameRect.top * scaleY))
      const sourceRight = Math.min(image.width, Math.ceil(frameRect.right * scaleX))
      const sourceBottom = Math.min(image.height, Math.ceil(frameRect.bottom * scaleY))
      const sourceWidth = Math.max(1, sourceRight - sourceX)
      const sourceHeight = Math.max(1, sourceBottom - sourceY)

      const canvas = document.createElement('canvas')
      canvas.width = sourceWidth
      canvas.height = sourceHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight)
      return canvasToPngBlob(canvas)
    }

    async function capturePreview() {
      if (state.captureBusy || !state.frame) return
      state.captureBusy = true
      renderPanel()

      let hiddenRecords = []
      try {
        const frameRect = state.frame.getBoundingClientRect()
        if (!frameRect.width || !frameRect.height) throw new Error('Preview frame is not visible.')
        hiddenRecords = hideTransientUiForPreviewCapture()
        const dataUrl = await requestVisibleTabCapture()
        const blob = await cropFrameCapture(dataUrl, frameRect)
        downloadPngBlob(blob, getPreviewCaptureFilename())
        showToast?.(t('breakpoint.toast.previewCaptured'))
      } catch {
        showToast?.(t('breakpoint.toast.previewCaptureFailed'))
      } finally {
        restoreTransientUi(hiddenRecords)
        state.captureBusy = false
        renderPanel()
      }
    }

    function removeUi() {
      window.clearTimeout(state.frameLoadTimer)
      stopFrameUrlSync()
      if (state.centerTimer) window.cancelAnimationFrame(state.centerTimer)
      state.centerTimer = null
      state.frameLoadNonce += 1
      presetMenu.close()
      zoomMenu.close()
      state.workspace?.remove()
      state.panel?.remove()
      state.workspace = null
      state.panel = null
      state.stage = null
      state.frame = null
      state.iframe = null
      state.panOverlay = null
      state.panToolPinned = false
      state.panToolTemporary = false
      state.frameBlocked = false
      state.frameReady = false
      state.frameUrl = ''
      state.entryUrl = ''
      state.lastSyncedFrameUrl = ''
      state.pan = null
    }

    function handleResize() {
      if (!state.enabled || state.zoom !== 'fit') return
      renderFrame()
      scheduleCenter()
      notifyViewportChange()
    }

    function isPanStartTarget(target) {
      if (!target) return false
      if (state.panel?.contains(target)) return false
      if (target === state.panOverlay) return true
      if (state.frame?.contains(target)) return false
      if (target === state.stage || target === state.workspace) return true
      return !!target.classList?.contains?.('layoutpilot-hit-shield')
    }

    function handlePanPointerDown(event) {
      if (!state.enabled || event.button !== 0) return
      if (state.zoom === 'fit') return
      if (!state.stage) return
      if (isPanToolActive()) {
        if (state.panel?.contains(event.target)) return
      } else if (!isPanStartTarget(event.target)) {
        return
      }

      state.pan = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        scrollLeft: state.stage.scrollLeft,
        scrollTop: state.stage.scrollTop,
        target: event.target,
        active: false
      }
      document.addEventListener('pointermove', handlePanPointerMove, true)
      document.addEventListener('pointerup', handlePanPointerUp, true)
      document.addEventListener('pointercancel', handlePanPointerUp, true)
    }

    function handlePanPointerMove(event) {
      const pan = state.pan
      if (!pan || event.pointerId !== pan.pointerId || !state.stage) return

      const dx = event.clientX - pan.startX
      const dy = event.clientY - pan.startY
      if (!pan.active) {
        if (Math.abs(dx) < PAN_THRESHOLD && Math.abs(dy) < PAN_THRESHOLD) return
        pan.active = true
        state.workspace?.classList.add('layoutpilot-breakpoint-workspace--panning')
        try { pan.target?.setPointerCapture?.(pan.pointerId) } catch {}
      }

      state.stage.scrollLeft = pan.scrollLeft - dx
      state.stage.scrollTop = pan.scrollTop - dy
      event.preventDefault()
    }

    function handlePanPointerUp(event) {
      const pan = state.pan
      if (!pan) return
      document.removeEventListener('pointermove', handlePanPointerMove, true)
      document.removeEventListener('pointerup', handlePanPointerUp, true)
      document.removeEventListener('pointercancel', handlePanPointerUp, true)
      state.workspace?.classList.remove('layoutpilot-breakpoint-workspace--panning')
      try { pan.target?.releasePointerCapture?.(pan.pointerId) } catch {}
      state.pan = null
    }

    function bindResize() {
      window.addEventListener('resize', handleResize)
      document.addEventListener('pointerdown', handlePanPointerDown, true)
      if (window.ResizeObserver && state.stage) {
        state.resizeObserver = new ResizeObserver(handleResize)
        state.resizeObserver.observe(state.stage)
      }
    }

    function unbindResize() {
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('pointerdown', handlePanPointerDown, true)
      handlePanPointerUp({})
      state.resizeObserver?.disconnect()
      state.resizeObserver = null
    }

    // Ask the background to strip X-Frame-Options / CSP for this tab's preview
    // iframe while the mode is active (pages with those headers refuse to frame).
    // onApplied runs once the rule add/remove resolves (or immediately if the
    // extension messaging is unavailable, so the frame still loads best-effort).
    function requestFrameUnblock(enabled, onApplied) {
      const send = typeof chrome !== 'undefined' ? chrome?.runtime?.sendMessage : undefined
      if (typeof send !== 'function') {
        onApplied?.()
        return
      }
      try {
        send({ type: 'layoutpilot:set-frame-unblock', enabled }, () => {
          void chrome.runtime?.lastError
          onApplied?.()
        })
      } catch {
        onApplied?.()
      }
    }

    function setEnabled(enabled) {
      const nextEnabled = !!enabled
      if (state.enabled === nextEnabled) return getState()

      state.enabled = nextEnabled
      if (state.enabled) {
        state.entryUrl = getCurrentUrl()
        state.frameUrl = state.entryUrl
        state.lastSyncedFrameUrl = state.entryUrl
        state.frameUnblockReady = false
        state.frameBlocked = false
        requestFrameUnblock(true, () => {
          // Rule is active now — let renderFrame build the iframe so its request
          // is made after the header strip is in place.
          state.frameUnblockReady = true
          if (state.enabled) renderFrame()
        })
        state.interaction = 'navigate'
        render()
        bindResize()
        centerFrame()
        showToast?.(t('breakpoint.toast.enabled'))
        onEnabledChange?.(true)
        return getState()
      }

      state.frameUnblockReady = false
      syncFrameUrl()
      const exitUrl = getFrameExitUrl()
      requestFrameUnblock(false)
      unbindResize()
      removeUi()
      showToast?.(t('breakpoint.toast.disabled'))
      onEnabledChange?.(false)
      if (exitUrl) window.location.replace(exitUrl)
      return getState()
    }

    function toggleEnabled() {
      return setEnabled(!state.enabled)
    }

    function setInteraction(value) {
      const next = normalizeBreakpointInteraction(value)
      if (state.interaction === next) return getState()
      state.interaction = next
      renderPanel()
      updateWorkspaceLayout()
      onInteractionChange?.(state.interaction)
      return getState()
    }

    function toggleInteraction() {
      return setInteraction(state.interaction === 'inspect' ? 'navigate' : 'inspect')
    }

    // Re-assert panel DOM order so it stacks above the inspect hit-shield
    // (all LayoutPilot UI shares the max z-index and is appended to
    // documentElement; later in DOM wins).
    function raisePanel() {
      if (state.panel && state.panel.isConnected) document.documentElement.appendChild(state.panel)
    }

    function setPanelCollapsed(collapsed) {
      state.panelCollapsed = !!collapsed
      updateWorkspaceLayout()
      renderPanel()
      scheduleCenter()
      notifyViewportChange()
      return getState()
    }

    function syncPanToolUi() {
      updateWorkspaceLayout()
      syncPanOverlay()
      renderPanel()
    }

    function setPanToolPinned(pinned) {
      state.panToolPinned = !!pinned
      syncPanToolUi()
      return getState()
    }

    function togglePanTool() {
      return setPanToolPinned(!state.panToolPinned)
    }

    function setTemporaryPanTool(active) {
      const next = !!active
      if (state.panToolTemporary === next) return false
      state.panToolTemporary = next
      syncPanToolUi()
      return true
    }

    function togglePanel() {
      if (!state.enabled) return setEnabled(true)
      return setPanelCollapsed(!state.panelCollapsed)
    }

    function focusSavePresetName() {
      window.requestAnimationFrame(() => {
        const field = state.panel?.querySelector('[data-layoutpilot-breakpoint-save-name]')
        field?.focus?.()
        field?.select?.()
      })
    }

    function openSavePresetDialog() {
      if (!canSaveCurrentSize()) return
      state.savePresetDialogOpen = true
      state.savePresetDialogMode = 'create'
      state.savePresetId = ''
      state.savePresetName = getDefaultSavePresetName()
      state.savePresetError = ''
      renderPanel()
      focusSavePresetName()
    }

    function openRenamePresetDialog() {
      const preset = getSelectedCustomPreset()
      if (!preset) return
      state.savePresetDialogOpen = true
      state.savePresetDialogMode = 'rename'
      state.savePresetId = preset.id
      state.savePresetName = preset.label
      state.savePresetError = ''
      renderPanel()
      focusSavePresetName()
    }

    function closeSavePresetDialog() {
      state.savePresetDialogOpen = false
      state.savePresetDialogMode = 'create'
      state.savePresetId = ''
      state.savePresetName = ''
      state.savePresetError = ''
      renderPanel()
    }

    async function renameSelectedPreset() {
      const preset = getSelectedCustomPreset()
      if (!preset) {
        closeSavePresetDialog()
        return
      }

      const nameField = state.panel?.querySelector('[data-layoutpilot-breakpoint-save-name]')
      const label = String(nameField?.value || '').trim()
      if (!label) {
        state.savePresetError = t('breakpoint.customPreset.emptyName')
        renderPanel()
        focusSavePresetName()
        return
      }

      const exists = state.customPresets.some(item => item.id !== preset.id && item.label.toLowerCase() === label.toLowerCase())
      if (exists) {
        state.savePresetError = t('breakpoint.customPreset.duplicateName')
        renderPanel()
        focusSavePresetName()
        return
      }

      const previousCustomPresets = state.customPresets
      state.customPresets = renameCustomBreakpointPreset(preset.id, label, state.customPresets)
      const saved = await persistCustomPresets()
      if (!saved) {
        state.customPresets = previousCustomPresets
        renderPanel()
        return
      }

      state.savePresetDialogOpen = false
      state.savePresetDialogMode = 'create'
      state.savePresetId = ''
      state.savePresetName = ''
      state.savePresetError = ''
      render()
      showToast?.(t('breakpoint.toast.presetRenamed'))
      notifyViewportChange()
    }

    async function removeSelectedPreset() {
      const preset = getSelectedCustomPreset()
      if (!preset) return

      const previousCustomPresets = state.customPresets
      state.customPresets = removeCustomBreakpointPreset(preset.id, state.customPresets)
      state.presetId = 'custom'
      const saved = await persistCustomPresets()
      if (!saved) {
        state.customPresets = previousCustomPresets
        state.presetId = preset.id
        renderPanel()
        return
      }

      persistViewportPreference()
      render()
      showToast?.(t('breakpoint.toast.presetRemoved'))
      notifyViewportChange()
    }

    async function saveCurrentPreset() {
      if (state.savePresetDialogMode === 'rename') {
        await renameSelectedPreset()
        return
      }
      if (!canSaveCurrentSize()) {
        closeSavePresetDialog()
        return
      }
      const nameField = state.panel?.querySelector('[data-layoutpilot-breakpoint-save-name]')
      const label = String(nameField?.value || '').trim()
      if (!label) {
        state.savePresetError = t('breakpoint.customPreset.emptyName')
        renderPanel()
        focusSavePresetName()
        return
      }

      const exists = state.customPresets.some(preset => preset.label.toLowerCase() === label.toLowerCase())
      if (exists) {
        state.savePresetError = t('breakpoint.customPreset.duplicateName')
        renderPanel()
        focusSavePresetName()
        return
      }

      const preset = createCustomBreakpointPreset({
        label,
        width: state.width,
        height: state.height,
        existingPresets: state.customPresets,
        labelPrefix: t('breakpoint.presets.custom')
      })
      const previousCustomPresets = state.customPresets
      state.customPresets = normalizeCustomBreakpointPresets([...state.customPresets, preset])
      const saved = await persistCustomPresets()
      if (!saved) {
        state.customPresets = previousCustomPresets
        renderPanel()
        return
      }

      state.presetId = preset.id
      persistViewportPreference()
      state.savePresetDialogOpen = false
      state.savePresetName = ''
      state.savePresetError = ''
      render()
      showToast?.(t('breakpoint.toast.presetSaved'))
      notifyViewportChange()
    }

    function applyPreset(id) {
      const preset = findBreakpointPreset(id, state.customPresets)
      if (!preset) {
        state.presetId = 'custom'
        render()
        return
      }

      const changed = state.presetId !== preset.id || state.width !== preset.width || state.height !== preset.height
      state.presetId = preset.id
      state.width = preset.width
      state.height = preset.height
      persistViewportPreference()
      render()
      if (changed) {
        centerFrame()
        notifyViewportChange()
      }
    }

    function applyDimensions(width, height, sourceTarget = null) {
      const nextWidth = normalizeBreakpointDimension(width, state.width)
      const nextHeight = normalizeBreakpointDimension(height, state.height)
      const changed = nextWidth !== state.width || nextHeight !== state.height
      state.width = nextWidth
      state.height = nextHeight
      state.presetId = resolveBreakpointPresetBySize(state.width, state.height, state.customPresets)?.id || 'custom'
      persistViewportPreference()
      renderViewportOnly(sourceTarget)
      if (changed) {
        scheduleCenter()
        notifyViewportChange()
      }
    }

    function rotate() {
      const rotated = rotateBreakpointViewport(state)
      state.width = rotated.width
      state.height = rotated.height
      state.presetId = resolveBreakpointPresetBySize(state.width, state.height, state.customPresets)?.id || 'custom'
      persistViewportPreference()
      render()
      centerFrame()
      notifyViewportChange()
    }

    function setZoom(value) {
      const nextZoom = ['fit', '1', '0.75', '0.5'].includes(String(value)) ? String(value) : 'fit'
      const changed = state.zoom !== nextZoom
      state.zoom = nextZoom
      persistViewportPreference()
      render()
      centerFrame()
      if (changed) notifyViewportChange()
    }

    function openFieldMenu(name, trigger) {
      if (name === 'preset') {
        presetMenu.toggle(trigger, { groups: getPresetGroups(), activeValue: state.presetId })
      } else if (name === 'zoom') {
        zoomMenu.toggle(trigger, { groups: getZoomGroups(), activeValue: String(state.zoom) })
      }
    }

    function handleUiClick(event) {
      const trigger = event.target?.closest?.('[data-layoutpilot-action]')
      const action = trigger?.dataset?.layoutpilotAction
      if (!action?.startsWith('breakpoint-')) return false

      if (action === 'breakpoint-close') {
        if (onClose) onClose()
        else setEnabled(false)
      }
      if (action === 'breakpoint-collapse') setPanelCollapsed(true)
      if (action === 'breakpoint-expand') setPanelCollapsed(false)
      if (action === 'breakpoint-rotate') rotate()
      if (action === 'breakpoint-center') centerFrame()
      if (action === 'breakpoint-pan-tool') togglePanTool()
      if (action === 'breakpoint-open-save-preset') openSavePresetDialog()
      if (action === 'breakpoint-open-rename-preset') openRenamePresetDialog()
      if (action === 'breakpoint-remove-preset') removeSelectedPreset()
      if (action === 'breakpoint-cancel-save-preset') closeSavePresetDialog()
      if (action === 'breakpoint-save-preset') saveCurrentPreset()
      if (action === 'breakpoint-capture-preview') capturePreview()
      if (action === 'breakpoint-interaction') setInteraction(trigger.dataset.layoutpilotBreakpointInteraction)
      if (action === 'breakpoint-menu') openFieldMenu(trigger.dataset.layoutpilotBreakpointMenu, trigger)
      return true
    }

    function handleFieldChange(event) {
      if (!state.enabled) return false
      const field = event.target?.closest?.('[data-layoutpilot-breakpoint-field]')?.dataset?.layoutpilotBreakpointField
      if (!field) return false

      if (field === 'width' || field === 'height') {
        const width = state.panel?.querySelector('[data-layoutpilot-breakpoint-field="width"]')?.value
        const height = state.panel?.querySelector('[data-layoutpilot-breakpoint-field="height"]')?.value
        applyDimensions(width, height, event.target)
      }
      return true
    }

    function handleFieldKeyDown(event) {
      if (!state.enabled) return false
      const saveNameField = event.target?.closest?.('[data-layoutpilot-breakpoint-save-name]')
      if (saveNameField && event.key === 'Enter') {
        event.preventDefault()
        saveCurrentPreset()
        return true
      }
      if (saveNameField && event.key === 'Escape') {
        event.preventDefault()
        closeSavePresetDialog()
        return true
      }
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return false
      const target = event.target?.closest?.('[data-layoutpilot-breakpoint-field="width"], [data-layoutpilot-breakpoint-field="height"]')
      const field = target?.dataset?.layoutpilotBreakpointField
      if (!field) return false

      event.preventDefault()
      const direction = event.key === 'ArrowUp' ? 1 : -1
      const step = event.shiftKey ? 10 : 1
      const fallback = field === 'width' ? state.width : state.height
      const nextValue = normalizeBreakpointDimension(Number(target.value || fallback) + direction * step, fallback)
      target.value = String(nextValue)

      const width = state.panel?.querySelector('[data-layoutpilot-breakpoint-field="width"]')?.value
      const height = state.panel?.querySelector('[data-layoutpilot-breakpoint-field="height"]')?.value
      applyDimensions(width, height, target)
      return true
    }

    function handleKeyDown(event) {
      if (!state.enabled || event.repeat || event.key !== ' ') return false
      if (!isPanToolAvailable()) return false
      return setTemporaryPanTool(true)
    }

    function handleKeyUp(event) {
      if (!state.enabled || event.key !== ' ') return false
      return setTemporaryPanTool(false)
    }

    function readFrameGeometry() {
      if (!state.enabled || !state.iframe) return null

      try {
        const rect = state.iframe.getBoundingClientRect()
        const frameWindow = state.iframe.contentWindow
        const innerWidth = frameWindow?.innerWidth
        const innerHeight = frameWindow?.innerHeight
        if (!rect?.width || !rect?.height || !innerWidth || !innerHeight) return null
        return {
          originX: rect.left,
          originY: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          scaleX: rect.width / innerWidth,
          scaleY: rect.height / innerHeight
        }
      } catch {
        return null
      }
    }

    function getElementAtPoint(event) {
      if (!state.enabled) return undefined
      if (state.interaction !== 'inspect') return null

      const geometry = readFrameGeometry()
      if (!geometry) return null
      if (event.clientX < geometry.originX || event.clientX > geometry.right || event.clientY < geometry.originY || event.clientY > geometry.bottom) {
        return null
      }

      try {
        const point = frameToInternalPoint(event.clientX, event.clientY, geometry)
        const frameDocument = state.iframe.contentDocument
        return frameDocument?.elementFromPoint(point.x, point.y) || null
      } catch {
        return null
      }
    }

    function mapElementInfo(info, element) {
      if (!state.enabled || !state.iframe || element?.ownerDocument !== state.iframe.contentDocument) return info

      const geometry = readFrameGeometry()
      if (!geometry || !info?.rect) return info
      const mappedRect = internalRectToViewport(info.rect, geometry)

      return {
        ...info,
        rect: mappedRect
      }
    }

    function refreshLanguage() {
      if (!state.enabled) return
      renderPanel()
    }

    function stop() {
      setEnabled(false)
    }

    function destroy() {
      stop()
      presetMenu.destroy()
      zoomMenu.destroy()
    }

    return {
      setEnabled,
      toggleEnabled,
      togglePanel,
      setInteraction,
      toggleInteraction,
      raisePanel,
      stop,
      destroy,
      handleUiClick,
      handleFieldChange,
      handleFieldKeyDown,
      handleKeyDown,
      handleKeyUp,
      getElementAtPoint,
      mapElementInfo,
      refreshLanguage,
      getState
    }
  }

  root.breakpointMode = {
    createBreakpointMode
  }
})()
