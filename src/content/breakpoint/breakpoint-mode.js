(() => {
  const root = window.LayoutPilotModules ||= {}
  const { createElement, escapeHtml } = root.dom
  const { STORAGE_KEYS } = root.constants
  const { icon } = root.icons
  const { createPopoverMenu, getTooltipAttrs, renderAttrs } = root.ui
  const BRAND_LOGO_URL = chrome.runtime.getURL('src/assets/brand/logo-horizontal.png')
  const {
    BREAKPOINT_PRESET_GROUPS,
    DEFAULT_PRESET_ID,
    getBreakpointPreset,
    normalizeBreakpointDimension,
    rotateBreakpointViewport,
    classifyFrameProbe,
    normalizeBreakpointInteraction,
    frameToInternalPoint,
    internalRectToViewport
  } = root.breakpointPresets

  const FRAME_LOAD_TIMEOUT_MS = 12000
  const PAN_THRESHOLD = 4

  function tip(text) {
    return renderAttrs(getTooltipAttrs(text, { delayMs: 400 }))
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
      panelCollapsed: false,
      frameBlocked: false,
      frameReady: false,
      frameLoadTimer: null,
      frameLoadNonce: 0,
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
      return getBreakpointPreset(state.presetId)?.label || t('breakpoint.presets.custom')
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
        frameBlocked: state.frameBlocked
      }
    }

    function notifyViewportChange() {
      onViewportChange?.(getState())
    }

    function getCurrentUrl() {
      return window.location.href
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
        state.presetId = 'custom'
        state.width = normalizeBreakpointDimension(saved.width, state.width)
        state.height = normalizeBreakpointDimension(saved.height, state.height)
        state.zoom = ['fit', '1', '0.75', '0.5'].includes(String(saved.zoom)) ? String(saved.zoom) : 'fit'
        return true
      }

      const preset = getBreakpointPreset(saved.presetId) || getBreakpointPreset(DEFAULT_PRESET_ID)
      if (!preset) return false
      state.presetId = preset.id
      state.width = preset.width
      state.height = preset.height
      state.zoom = ['fit', '1', '0.75', '0.5'].includes(String(saved.zoom)) ? String(saved.zoom) : 'fit'
      return true
    }

    async function loadViewportPreference() {
      try {
        const result = await chrome.storage.local.get(STORAGE_KEYS.RESPONSIVE_PREVIEW_STATE)
        if (state.preferenceDirty) return
        if (!applyViewportPreference(result?.[STORAGE_KEYS.RESPONSIVE_PREVIEW_STATE])) return
        if (state.enabled) {
          render()
          centerFrame()
        }
      } catch {
        // Preference persistence is best-effort; the preview must keep working.
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
      return BREAKPOINT_PRESET_GROUPS.map(group => ({
        label: t(group.groupKey),
        items: group.items.map(item => ({
          value: item.id,
          label: item.labelKey ? t(item.labelKey) : item.label,
          meta: `${item.width} x ${item.height}`
        }))
      }))
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
            <button class="layoutpilot-breakpoint-icon-button" type="button" data-layoutpilot-action="breakpoint-center" ${tip(t('breakpoint.actions.center'))} aria-label="${escapeHtml(t('breakpoint.actions.center'))}">${icon('target', 16)}</button>
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
        </div>

        <div class="layoutpilot-breakpoint-size-row">
          <input class="layoutpilot-breakpoint-input" data-layoutpilot-breakpoint-field="width" aria-label="${escapeHtml(t('breakpoint.fields.width'))}" inputmode="numeric" value="${state.width}" />
          <span class="layoutpilot-breakpoint-size-separator">x</span>
          <input class="layoutpilot-breakpoint-input" data-layoutpilot-breakpoint-field="height" aria-label="${escapeHtml(t('breakpoint.fields.height'))}" inputmode="numeric" value="${state.height}" />
          <button class="layoutpilot-breakpoint-icon-button" type="button" data-layoutpilot-action="breakpoint-rotate" ${tip(t('breakpoint.actions.rotate'))} aria-label="${escapeHtml(t('breakpoint.actions.rotate'))}">↺</button>
        </div>

        <div class="layoutpilot-breakpoint-field">
          <span class="layoutpilot-breakpoint-field-label">${escapeHtml(t('breakpoint.fields.zoom'))}</span>
          ${renderDropdownTrigger({ name: 'zoom', label: getZoomLabel() })}
        </div>

        <div class="layoutpilot-breakpoint-current">
          <span class="layoutpilot-breakpoint-current-label">${escapeHtml(t('popup.breakpoint.current'))}</span>
          <b class="layoutpilot-breakpoint-current-value">${escapeHtml(`${getPresetLabel()} · ${state.width} x ${state.height}`)}</b>
        </div>
      `
    }

    function syncPanelViewport(sourceTarget = null) {
      if (!state.panel || state.panelCollapsed) return

      const presetTrigger = state.panel.querySelector('[data-layoutpilot-breakpoint-menu="preset"]')
      const presetValue = presetTrigger?.querySelector('.layoutpilot-breakpoint-dropdown-value')
      if (presetValue) presetValue.textContent = getPresetLabel()

      const currentValue = state.panel.querySelector('.layoutpilot-breakpoint-current-value')
      if (currentValue) currentValue.textContent = `${getPresetLabel()} · ${state.width} x ${state.height}`

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
      state.frame.style.transform = `scale(${scale})`

      if (state.frameBlocked) {
        state.frame.classList.add('layoutpilot-breakpoint-frame--blocked')
        state.frame.innerHTML = `
          <div>
            <strong class="layoutpilot-breakpoint-blocked-title">${escapeHtml(t('breakpoint.blocked.title'))}</strong>
            <p class="layoutpilot-breakpoint-blocked-copy">${escapeHtml(t('breakpoint.blocked.description'))}</p>
          </div>
        `
        state.iframe = null
        return
      }

      state.frame.classList.remove('layoutpilot-breakpoint-frame--blocked')
      if (!state.iframe) {
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
        state.frameLoadTimer = window.setTimeout(() => {
          if (!state.iframe || nonce !== state.frameLoadNonce || state.frameReady) return
          markFrameBlocked(nonce)
        }, FRAME_LOAD_TIMEOUT_MS)
      }
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

    function removeUi() {
      window.clearTimeout(state.frameLoadTimer)
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
      state.frameBlocked = false
      state.frameReady = false
      state.pan = null
    }

    function handleResize() {
      if (!state.enabled || state.zoom !== 'fit') return
      renderFrame()
      notifyViewportChange()
    }

    function isPanStartTarget(target) {
      if (!target) return false
      if (state.panel?.contains(target)) return false
      if (state.frame?.contains(target)) return false
      if (target === state.stage || target === state.workspace) return true
      return !!target.classList?.contains?.('layoutpilot-hit-shield')
    }

    function handlePanPointerDown(event) {
      if (!state.enabled || event.button !== 0) return
      if (!state.stage || !isPanStartTarget(event.target)) return

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

    function setEnabled(enabled) {
      const nextEnabled = !!enabled
      if (state.enabled === nextEnabled) return getState()

      state.enabled = nextEnabled
      if (state.enabled) {
        state.interaction = 'navigate'
        render()
        bindResize()
        centerFrame()
        showToast?.(t('breakpoint.toast.enabled'))
        onEnabledChange?.(true)
        return getState()
      }

      unbindResize()
      removeUi()
      showToast?.(t('breakpoint.toast.disabled'))
      onEnabledChange?.(false)
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

    function togglePanel() {
      if (!state.enabled) return setEnabled(true)
      return setPanelCollapsed(!state.panelCollapsed)
    }

    function applyPreset(id) {
      const preset = getBreakpointPreset(id)
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
      state.presetId = 'custom'
      state.width = nextWidth
      state.height = nextHeight
      persistViewportPreference()
      renderViewportOnly(sourceTarget)
      if (changed) {
        scheduleCenter()
        notifyViewportChange()
      }
    }

    function rotate() {
      const rotated = rotateBreakpointViewport(state)
      state.presetId = 'custom'
      state.width = rotated.width
      state.height = rotated.height
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
      if (!state.enabled || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return false
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
