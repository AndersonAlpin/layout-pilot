(() => {
  const root = window.LayoutPilotModules ||= {}
  const ui = root.ui ||= {}

  const TOOLTIP_ID = 'layoutpilot-ui-tooltip'
  const DEFAULT_TOOLTIP_DELAY_MS = 0
  let isBound = false
  let activeTarget = null
  let pendingTarget = null
  let showTimer = null
  let isPointerDown = false
  let lastPointerMoveTime = 0

  function getTooltipElement() {
    let element = document.getElementById(TOOLTIP_ID)
    if (element) return element

    element = document.createElement('div')
    element.id = TOOLTIP_ID
    element.className = 'layoutpilot-ui-tooltip'
    element.setAttribute('role', 'tooltip')
    element.setAttribute('aria-hidden', 'true')
    document.documentElement.appendChild(element)
    return element
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max)
  }

  function getTooltipTarget(node) {
    return node instanceof Element ? node.closest('[data-layoutpilot-tooltip]') : null
  }

  function getVerticalAnchorRect(target) {
    const toolbar = target.closest('.layoutpilot-review-toolbar-shell')
    return toolbar?.getBoundingClientRect() || target.getBoundingClientRect()
  }

  function getBoundaryRect(target) {
    const panel = target.closest('.layoutpilot-review-panel')
    return panel?.getBoundingClientRect() || null
  }

  function getPlacementOrder(target) {
    if (target.closest('.layoutpilot-review-toolbar-shell')) return ['bottom', 'top', 'left', 'right']
    if (target.closest('.layoutpilot-review-header-actions')) return ['left', 'right', 'top', 'bottom']
    return ['top', 'bottom', 'right', 'left']
  }

  function hasActiveTextSelection() {
    if (typeof window.getSelection !== 'function') return false
    const selection = window.getSelection()
    return Boolean(selection && !selection.isCollapsed && String(selection).trim())
  }

  function getNow() {
    return typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? performance.now()
      : Date.now()
  }

  function clearPendingTooltip() {
    if (showTimer) {
      window.clearTimeout(showTimer)
      showTimer = null
    }
    pendingTarget = null
  }

  function hideTooltip() {
    clearPendingTooltip()
    const tooltip = document.getElementById(TOOLTIP_ID)
    if (!tooltip) return
    tooltip.classList.remove('layoutpilot-ui-tooltip--visible')
    tooltip.setAttribute('aria-hidden', 'true')
    activeTarget = null
  }

  function updateTooltipPosition(target) {
    const text = target?.dataset?.layoutpilotTooltip
    if (!text || isPointerDown || hasActiveTextSelection()) {
      hideTooltip()
      return
    }

    const tooltip = getTooltipElement()
    document.documentElement.appendChild(tooltip)
    tooltip.textContent = text
    tooltip.classList.add('layoutpilot-ui-tooltip--visible')
    tooltip.setAttribute('aria-hidden', 'false')
    tooltip.style.left = '0px'
    tooltip.style.top = '0px'
    tooltip.style.maxWidth = `${Math.min(320, Math.max(180, window.innerWidth - 24))}px`

    const rect = target.getBoundingClientRect()
    const verticalRect = getVerticalAnchorRect(target)
    const boundaryRect = getBoundaryRect(target)
    const gap = 10
    const viewportPadding = 12
    const tooltipRect = tooltip.getBoundingClientRect()
    const position = getTooltipPosition({
      rect,
      verticalRect,
      boundaryRect,
      tooltipRect,
      order: getPlacementOrder(target),
      gap,
      viewportPadding
    })

    tooltip.dataset.placement = position.placement
    tooltip.style.left = `${Math.round(position.left)}px`
    tooltip.style.top = `${Math.round(position.top)}px`
    tooltip.style.setProperty('--layoutpilot-tooltip-arrow-left', `${Math.round(position.arrowLeft)}px`)
    tooltip.style.setProperty('--layoutpilot-tooltip-arrow-top', `${Math.round(position.arrowTop)}px`)
    activeTarget = target
  }

  function getTooltipPosition({ rect, verticalRect, boundaryRect, tooltipRect, order, gap, viewportPadding }) {
    const viewport = {
      left: viewportPadding,
      top: viewportPadding,
      right: window.innerWidth - viewportPadding,
      bottom: window.innerHeight - viewportPadding
    }
    const width = tooltipRect.width
    const height = tooltipRect.height
    const minArrow = 12

    function getCandidate(placement) {
      if (placement === 'top' || placement === 'bottom') {
        const top = placement === 'top' ? verticalRect.top - height - gap : verticalRect.bottom + gap
        const left = clamp(rect.left + rect.width / 2 - width / 2, viewport.left, viewport.right - width)
        return {
          placement,
          top,
          left,
          arrowLeft: clamp(rect.left + rect.width / 2 - left, minArrow, width - minArrow),
          arrowTop: placement === 'top' ? height : 0
        }
      }

      const left = placement === 'left' ? rect.left - width - gap : rect.right + gap
      const top = clamp(rect.top + rect.height / 2 - height / 2, viewport.top, viewport.bottom - height)
      return {
        placement,
        top,
        left,
        arrowLeft: placement === 'left' ? width : 0,
        arrowTop: clamp(rect.top + rect.height / 2 - top, minArrow, height - minArrow)
      }
    }

    function getOverflow(candidate, bounds) {
      return Math.max(0, bounds.left - candidate.left) +
        Math.max(0, candidate.left + width - bounds.right) +
        Math.max(0, bounds.top - candidate.top) +
        Math.max(0, candidate.top + height - bounds.bottom)
    }

    const candidates = order.map((placement, index) => {
      const candidate = getCandidate(placement)
      const viewportOverflow = getOverflow(candidate, viewport)
      const boundaryOverflow = boundaryRect ? getOverflow(candidate, boundaryRect) : 0
      return {
        ...candidate,
        score: viewportOverflow * 1000 + boundaryOverflow * 20 + index
      }
    })

    return candidates.sort((a, b) => a.score - b.score)[0]
  }

  function parseTooltipDelay(value) {
    const delay = Number(value)
    if (!Number.isFinite(delay) || delay <= 0) return DEFAULT_TOOLTIP_DELAY_MS
    return Math.round(delay)
  }

  function scheduleTooltip(target) {
    const delay = parseTooltipDelay(target?.dataset?.layoutpilotTooltipDelay)

    clearPendingTooltip()
    if (activeTarget && activeTarget !== target) hideTooltip()
    if (isPointerDown || hasActiveTextSelection()) return

    if (delay <= 0) {
      updateTooltipPosition(target)
      return
    }

    pendingTarget = target
    showTimer = window.setTimeout(() => {
      if (pendingTarget === target && getNow() - lastPointerMoveTime >= delay) updateTooltipPosition(target)
      clearPendingTooltip()
    }, delay)
  }

  function getTooltipAttrs(text, { delayMs } = {}) {
    if (text == null || String(text).trim() === '') return {}
    const attrs = { 'data-layoutpilot-tooltip': String(text) }
    const delay = parseTooltipDelay(delayMs)
    if (delay > 0) attrs['data-layoutpilot-tooltip-delay'] = String(delay)
    return attrs
  }

  function initTooltips() {
    if (isBound || typeof document === 'undefined') return
    isBound = true
    getTooltipElement()

    document.addEventListener('pointerdown', () => {
      isPointerDown = true
      hideTooltip()
    }, true)

    window.addEventListener('pointerup', () => {
      isPointerDown = false
    }, true)

    window.addEventListener('pointercancel', () => {
      isPointerDown = false
      hideTooltip()
    }, true)

    document.addEventListener('pointerover', event => {
      lastPointerMoveTime = getNow()
      const target = getTooltipTarget(event.target)
      if (target) scheduleTooltip(target)
    })

    document.addEventListener('pointermove', event => {
      lastPointerMoveTime = getNow()
      if (event.buttons > 0) {
        isPointerDown = true
        hideTooltip()
        return
      }
      isPointerDown = false

      const target = getTooltipTarget(event.target)
      if (!target) {
        clearPendingTooltip()
        return
      }

      const delay = parseTooltipDelay(target.dataset?.layoutpilotTooltipDelay)
      if (delay <= 0 || activeTarget === target) return
      scheduleTooltip(target)
    })

    document.addEventListener('pointerout', event => {
      clearPendingTooltip()
      if (!activeTarget) return
      const nextTarget = getTooltipTarget(event.relatedTarget)
      if (nextTarget === activeTarget) return
      hideTooltip()
    })

    document.addEventListener('focusin', event => {
      const target = getTooltipTarget(event.target)
      if (target) {
        clearPendingTooltip()
        if (parseTooltipDelay(target.dataset?.layoutpilotTooltipDelay) > 0) {
          scheduleTooltip(target)
        } else {
          updateTooltipPosition(target)
        }
      }
    })

    document.addEventListener('focusout', event => {
      clearPendingTooltip()
      if (!activeTarget) return
      const nextTarget = getTooltipTarget(event.relatedTarget)
      if (nextTarget === activeTarget) return
      hideTooltip()
    })

    document.addEventListener('selectionchange', () => {
      if (hasActiveTextSelection()) hideTooltip()
    })

    window.addEventListener('scroll', hideTooltip, true)
    window.addEventListener('resize', hideTooltip)
  }

  Object.assign(ui, {
    getTooltipAttrs,
    initTooltips,
    hideTooltip
  })
})()
