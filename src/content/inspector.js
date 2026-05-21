(() => {
  if (window.__layoutPilot) return

  const state = {
    enabled: false,
    hoveredElement: null,
    selectedElement: null,
    overlay: null,
    selectedOverlay: null,
    tooltip: null,
    distanceLayer: null
  }

  function createElement(className) {
    const element = document.createElement('div')
    element.className = className
    document.documentElement.appendChild(element)
    return element
  }

  function ensureUi() {
    state.overlay ||= createElement('layoutpilot-overlay')
    state.selectedOverlay ||= createElement('layoutpilot-selected-overlay')
    state.tooltip ||= createElement('layoutpilot-tooltip')
    state.distanceLayer ||= createElement('layoutpilot-distance-layer')
  }

  function hideUi() {
    for (const element of [state.overlay, state.selectedOverlay, state.tooltip, state.distanceLayer]) {
      if (element) element.remove()
    }

    state.overlay = null
    state.selectedOverlay = null
    state.tooltip = null
    state.distanceLayer = null
  }

  function isOwnElement(element) {
    return element?.classList?.contains('layoutpilot-overlay') ||
      element?.classList?.contains('layoutpilot-selected-overlay') ||
      element?.classList?.contains('layoutpilot-tooltip') ||
      element?.classList?.contains('layoutpilot-distance-layer') ||
      element?.closest?.('.layoutpilot-tooltip, .layoutpilot-distance-layer')
  }

  function getElementAtPoint(event) {
    const elements = document.elementsFromPoint(event.clientX, event.clientY)
    return elements.find(element => element instanceof Element && !isOwnElement(element) && element !== document.documentElement && element !== document.body) || null
  }

  function px(value) {
    return `${Math.round(value)}px`
  }

  function setBox(element, rect) {
    element.style.display = 'block'
    element.style.left = px(rect.left)
    element.style.top = px(rect.top)
    element.style.width = px(rect.width)
    element.style.height = px(rect.height)
  }

  function formatBoxValues(styles, prefix) {
    return `${styles[`${prefix}Top`]} ${styles[`${prefix}Right`]} ${styles[`${prefix}Bottom`]} ${styles[`${prefix}Left`]}`
  }


  function rgbToHex(value) {
    if (!value || value === 'transparent') return value || ''

    const match = String(value).match(/rgba?\(([^)]+)\)/i)
    if (!match) return value

    const parts = match[1].split(',').map(part => part.trim())
    const [r, g, b] = parts.slice(0, 3).map(part => {
      if (part.endsWith('%')) return Math.round(Number(part.slice(0, -1)) * 2.55)
      return Number.parseInt(part, 10)
    })
    const alpha = parts[3] !== undefined ? Number.parseFloat(parts[3]) : 1

    if ([r, g, b].some(number => Number.isNaN(number))) return value

    const hex = [r, g, b]
      .map(number => Math.max(0, Math.min(255, number)).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()

    if (alpha >= 0 && alpha < 1) {
      const alphaHex = Math.round(alpha * 255).toString(16).padStart(2, '0').toUpperCase()
      return `#${hex}${alphaHex}`
    }

    return `#${hex}`
  }

  function isTransparentColor(value) {
    const normalized = String(value || '').trim().toLowerCase()
    return !normalized ||
      normalized === 'transparent' ||
      normalized === 'rgba(0, 0, 0, 0)' ||
      /rgba?\([^)]*,\s*0\s*\)$/i.test(normalized)
  }

  function formatColor(value) {
    const normalized = String(value || '').trim()
    if (!normalized || isTransparentColor(normalized)) return '—'
    return escapeHtml(rgbToHex(normalized))
  }

  function getElementBackgroundColor(styles) {
    return isTransparentColor(styles.backgroundColor) ? '' : styles.backgroundColor
  }

  function getClasses(element) {
    const classes = Array.from(element.classList || [])
    if (!classes.length) return '—'
    return classes.map(className => `.${className}`).join(' ')
  }

  function getBorderColor(styles) {
    const borders = [
      { width: styles.borderTopWidth, style: styles.borderTopStyle, color: styles.borderTopColor },
      { width: styles.borderRightWidth, style: styles.borderRightStyle, color: styles.borderRightColor },
      { width: styles.borderBottomWidth, style: styles.borderBottomStyle, color: styles.borderBottomColor },
      { width: styles.borderLeftWidth, style: styles.borderLeftStyle, color: styles.borderLeftColor }
    ]

    const visibleColors = borders
      .filter(border => Number.parseFloat(border.width) > 0 && border.style !== 'none' && !isTransparentColor(border.color))
      .map(border => border.color)

    const unique = Array.from(new Set(visibleColors))
    if (!unique.length) return ''
    if (unique.length === 1) return unique[0]
    return unique.join(' / ')
  }

  function formatFont(styles) {
    const family = String(styles.fontFamily || '').split(',')[0]?.replace(/^['"]|['"]$/g, '') || ''
    return `${styles.fontSize}${family ? ` ${family}` : ''}`
  }

  function getSpacingBetween(a, b) {
    const horizontal = b.left > a.right ? b.left - a.right : a.left > b.right ? a.left - b.right : 0
    const vertical = b.top > a.bottom ? b.top - a.bottom : a.top > b.bottom ? a.top - b.bottom : 0

    return {
      horizontal: Math.round(horizontal),
      vertical: Math.round(vertical)
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  function getElementName(element) {
    const tag = element.tagName.toLowerCase()
    const id = element.id ? `#${element.id}` : ''
    const className = Array.from(element.classList || []).slice(0, 3).map(name => `.${name}`).join('')
    return `${tag}${id}${className}`
  }

  function renderTooltip(event, element) {
    const rect = element.getBoundingClientRect()
    const styles = getComputedStyle(element)
    const selectedRect = state.selectedElement?.isConnected ? state.selectedElement.getBoundingClientRect() : null
    const spacing = selectedRect && state.selectedElement !== element ? getSpacingBetween(selectedRect, rect) : null
    const backgroundColor = getElementBackgroundColor(styles)
    const borderColor = getBorderColor(styles)
    const isPinned = state.selectedElement === element

    state.tooltip.innerHTML = `
      <strong>${escapeHtml(getElementName(element))}</strong>
      <div class="layoutpilot-grid">
        <span class="layoutpilot-label">Size</span>
        <span class="layoutpilot-value">${Math.round(rect.width)} × ${Math.round(rect.height)}px</span>
        <span class="layoutpilot-label">Padding</span>
        <span class="layoutpilot-value">${escapeHtml(formatBoxValues(styles, 'padding'))}</span>
        <span class="layoutpilot-label">Margin</span>
        <span class="layoutpilot-value">${escapeHtml(formatBoxValues(styles, 'margin'))}</span>
        <span class="layoutpilot-label">Position</span>
        <span class="layoutpilot-value">x ${Math.round(rect.left)}, y ${Math.round(rect.top)}</span>
        <span class="layoutpilot-label">Font</span>
        <span class="layoutpilot-value">${escapeHtml(formatFont(styles))}</span>
        <span class="layoutpilot-label">Color</span>
        <span class="layoutpilot-value">${formatColor(styles.color)}</span>
        ${backgroundColor ? `
          <span class="layoutpilot-label">Background</span>
          <span class="layoutpilot-value">${formatColor(backgroundColor)}</span>
        ` : ''}
        ${borderColor ? `
          <span class="layoutpilot-label">Border</span>
          <span class="layoutpilot-value">${formatColor(borderColor)}</span>
        ` : ''}
        <span class="layoutpilot-label">Classes</span>
        <span class="layoutpilot-value layoutpilot-code">${escapeHtml(getClasses(element))}</span>
        ${spacing ? `
          <span class="layoutpilot-label">Spacing</span>
          <span class="layoutpilot-value">H ${spacing.horizontal}px · V ${spacing.vertical}px</span>
        ` : ''}
      </div>
      <div class="layoutpilot-divider"></div>
      <div class="layoutpilot-help">${isPinned ? 'Click again to unpin. ' : 'Click to pin. '}Press Esc to turn off.</div>
    `

    const offset = 14
    const tooltipWidth = 360
    const left = Math.min(event.clientX + offset, window.innerWidth - tooltipWidth - offset)
    const top = Math.min(event.clientY + offset, window.innerHeight - 180)

    state.tooltip.style.display = 'block'
    state.tooltip.style.left = px(Math.max(12, left))
    state.tooltip.style.top = px(Math.max(12, top))
  }

  function renderSelectedOverlay() {
    if (!state.selectedElement?.isConnected) {
      state.selectedElement = null
      state.selectedOverlay.style.display = 'none'
      return
    }

    setBox(state.selectedOverlay, state.selectedElement.getBoundingClientRect())
  }

  function addDistanceLine(className, left, top, width, height, label) {
    const line = document.createElement('div')
    line.className = `layoutpilot-distance-line ${className}`
    line.style.left = px(left)
    line.style.top = px(top)
    line.style.width = px(width)
    line.style.height = px(height)
    state.distanceLayer.appendChild(line)

    const labelElement = document.createElement('div')
    labelElement.className = 'layoutpilot-distance-label'
    labelElement.textContent = label
    labelElement.style.left = px(left + width / 2)
    labelElement.style.top = px(top + height / 2)
    state.distanceLayer.appendChild(labelElement)
  }

  function renderDistances(element) {
    state.distanceLayer.innerHTML = ''

    if (!state.selectedElement?.isConnected || state.selectedElement === element) return

    const a = state.selectedElement.getBoundingClientRect()
    const b = element.getBoundingClientRect()
    const spacing = getSpacingBetween(a, b)

    if (spacing.horizontal > 0) {
      const left = b.left > a.right ? a.right : b.right
      const right = b.left > a.right ? b.left : a.left
      const y = Math.max(Math.min(a.top + a.height / 2, b.bottom), b.top)
      addDistanceLine('horizontal', left, y, right - left, 2, `${spacing.horizontal}px`)
    }

    if (spacing.vertical > 0) {
      const top = b.top > a.bottom ? a.bottom : b.bottom
      const bottom = b.top > a.bottom ? b.top : a.top
      const x = Math.max(Math.min(a.left + a.width / 2, b.right), b.left)
      addDistanceLine('vertical', x, top, 2, bottom - top, `${spacing.vertical}px`)
    }
  }

  function inspectAtEvent(event) {
    if (!state.enabled) return

    const element = getElementAtPoint(event)
    if (!element) return

    state.hoveredElement = element
    ensureUi()
    setBox(state.overlay, element.getBoundingClientRect())
    renderSelectedOverlay()
    renderDistances(element)
    renderTooltip(event, element)
  }

  function handleClick(event) {
    if (!state.enabled) return

    const element = getElementAtPoint(event)
    if (!element) return

    event.preventDefault()
    event.stopPropagation()

    if (state.selectedElement === element) {
      state.selectedElement = null
      state.selectedOverlay.style.display = 'none'
      state.distanceLayer.innerHTML = ''
      renderTooltip(event, element)
      return
    }

    state.selectedElement = element
    renderSelectedOverlay()
    renderDistances(element)
    renderTooltip(event, element)
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape' && state.enabled) {
      setEnabled(false)
    }
  }

  function setEnabled(enabled) {
    state.enabled = enabled

    if (enabled) {
      ensureUi()
      document.addEventListener('mousemove', inspectAtEvent, true)
      document.addEventListener('click', handleClick, true)
      document.addEventListener('keydown', handleKeyDown, true)
      return
    }

    document.removeEventListener('mousemove', inspectAtEvent, true)
    document.removeEventListener('click', handleClick, true)
    document.removeEventListener('keydown', handleKeyDown, true)
    state.hoveredElement = null
    state.selectedElement = null
    hideUi()
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === 'layoutpilot:ping') {
      sendResponse({ ok: true })
      return true
    }

    if (message?.type === 'layoutpilot:get-state') {
      sendResponse({ enabled: state.enabled })
      return true
    }

    if (message?.type === 'layoutpilot:toggle') {
      setEnabled(!state.enabled)
      sendResponse({ enabled: state.enabled })
      return true
    }

    return false
  })

  window.__layoutPilot = { setEnabled, state }
})()
