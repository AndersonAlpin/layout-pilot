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

  function hideTransientUi() {
    for (const element of [state.overlay, state.selectedOverlay, state.tooltip, state.distanceLayer]) {
      if (element) element.style.display = 'none'
    }
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

  function formatRadiusValues(styles) {
    return `${styles.borderTopLeftRadius} ${styles.borderTopRightRadius} ${styles.borderBottomRightRadius} ${styles.borderBottomLeftRadius}`
  }

  function formatGapValues(styles) {
    if (!['flex', 'inline-flex', 'grid', 'inline-grid'].includes(styles.display)) return ''

    const rowGap = styles.rowGap
    const columnGap = styles.columnGap
    const normalized = [rowGap, columnGap].map(value => String(value).trim())

    if (normalized.every(value => value === 'normal' || value === '0px')) return ''

    if (normalized[0] === normalized[1]) return normalized[0]

    return `${rowGap} / ${columnGap}`
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
    return rgbToHex(normalized)
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
    return unique.map(color => rgbToHex(color)).filter(Boolean)
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

  function formatColorMarkup(colorValue) {
    const value = formatColor(colorValue)
    if (value === '—') return value
    return createColorChipMarkup([value])
  }

  function formatColorsMarkup(colors) {
    if (!colors?.length) return ''
    return createColorChipMarkup(colors)
  }

  function createColorChipMarkup(colors) {
    const uniqueColors = Array.from(new Set(colors.filter(Boolean)))
    if (!uniqueColors.length) return '—'

    const background = uniqueColors.length === 1
      ? uniqueColors[0]
      : `linear-gradient(90deg, ${uniqueColors.join(', ')})`

    return `
      <span class="layoutpilot-color-chip">
        <span class="layoutpilot-color-swatch" style="background: ${background}"></span>
        <span>${escapeHtml(uniqueColors.join(' / '))}</span>
      </span>
    `
  }

  function positionTooltip(event) {
    const offset = 14
    state.tooltip.style.display = 'block'
    state.tooltip.style.visibility = 'hidden'
    state.tooltip.style.left = '0px'
    state.tooltip.style.top = '0px'

    const tooltipRect = state.tooltip.getBoundingClientRect()
    const left = Math.min(event.clientX + offset, window.innerWidth - tooltipRect.width - offset)
    const top = Math.min(event.clientY + offset, window.innerHeight - tooltipRect.height - offset)

    state.tooltip.style.left = px(Math.max(12, left))
    state.tooltip.style.top = px(Math.max(12, top))
    state.tooltip.style.visibility = 'visible'
  }

  function renderTooltip(event, element) {
    const rect = element.getBoundingClientRect()
    const styles = getComputedStyle(element)
    const selectedRect = state.selectedElement?.isConnected ? state.selectedElement.getBoundingClientRect() : null
    const spacing = selectedRect && state.selectedElement !== element ? getSpacingBetween(selectedRect, rect) : null
    const backgroundColor = getElementBackgroundColor(styles)
    const borderColors = getBorderColor(styles)
    const gap = formatGapValues(styles)
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
        <span class="layoutpilot-label">Radius</span>
        <span class="layoutpilot-value">${escapeHtml(formatRadiusValues(styles))}</span>
        ${gap ? `
          <span class="layoutpilot-label">Gap</span>
          <span class="layoutpilot-value">${escapeHtml(gap)}</span>
        ` : ''}
        <span class="layoutpilot-label">Font</span>
        <span class="layoutpilot-value">${escapeHtml(formatFont(styles))}</span>
        <span class="layoutpilot-label">Color</span>
        <span class="layoutpilot-value">${formatColorMarkup(styles.color)}</span>
        ${backgroundColor ? `
          <span class="layoutpilot-label">Background</span>
          <span class="layoutpilot-value">${formatColorMarkup(backgroundColor)}</span>
        ` : ''}
        ${borderColors.length ? `
          <span class="layoutpilot-label">Border</span>
          <span class="layoutpilot-value">${formatColorsMarkup(borderColors)}</span>
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

    positionTooltip(event)
  }

  function renderSelectedOverlay() {
    if (!state.selectedElement?.isConnected) {
      state.selectedElement = null
      if (state.selectedOverlay) state.selectedOverlay.style.display = 'none'
      return
    }

    ensureUi()
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
    ensureUi()
    state.distanceLayer.innerHTML = ''

    if (!state.selectedElement?.isConnected || state.selectedElement === element) {
      state.distanceLayer.style.display = 'none'
      return
    }

    const a = state.selectedElement.getBoundingClientRect()
    const b = element.getBoundingClientRect()
    const spacing = getSpacingBetween(a, b)
    let hasDistance = false

    if (spacing.horizontal > 0) {
      const left = b.left > a.right ? a.right : b.right
      const right = b.left > a.right ? b.left : a.left
      const y = Math.max(Math.min(a.top + a.height / 2, b.bottom), b.top)
      addDistanceLine('horizontal', left, y, right - left, 2, `${spacing.horizontal}px`)
      hasDistance = true
    }

    if (spacing.vertical > 0) {
      const top = b.top > a.bottom ? a.bottom : b.bottom
      const bottom = b.top > a.bottom ? b.top : a.top
      const x = Math.max(Math.min(a.left + a.width / 2, b.right), b.left)
      addDistanceLine('vertical', x, top, 2, bottom - top, `${spacing.vertical}px`)
      hasDistance = true
    }

    state.distanceLayer.style.display = hasDistance ? 'block' : 'none'
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

  function handleViewportChange() {
    if (!state.enabled || !state.selectedElement) return
    renderSelectedOverlay()
  }

  function handlePageVisibilityChange() {
    if (!state.enabled) return

    if (document.hidden) {
      hideTransientUi()
      return
    }

    renderSelectedOverlay()
  }

  function handleWindowBlur() {
    if (!state.enabled) return
    hideTransientUi()
  }

  function handleWindowFocus() {
    if (!state.enabled) return
    renderSelectedOverlay()
  }

  function setEnabled(enabled) {
    state.enabled = enabled

    if (enabled) {
      ensureUi()
      document.addEventListener('mousemove', inspectAtEvent, true)
      document.addEventListener('click', handleClick, true)
      document.addEventListener('keydown', handleKeyDown, true)
      window.addEventListener('scroll', handleViewportChange, true)
      window.addEventListener('resize', handleViewportChange)
      window.addEventListener('blur', handleWindowBlur)
      window.addEventListener('focus', handleWindowFocus)
      document.addEventListener('visibilitychange', handlePageVisibilityChange)
      return
    }

    document.removeEventListener('mousemove', inspectAtEvent, true)
    document.removeEventListener('click', handleClick, true)
    document.removeEventListener('keydown', handleKeyDown, true)
    window.removeEventListener('scroll', handleViewportChange, true)
    window.removeEventListener('resize', handleViewportChange)
    window.removeEventListener('blur', handleWindowBlur)
    window.removeEventListener('focus', handleWindowFocus)
    document.removeEventListener('visibilitychange', handlePageVisibilityChange)
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
