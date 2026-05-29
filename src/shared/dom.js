(() => {
  const root = window.LayoutPilotModules ||= {}

  function createElement(className) {
    const element = document.createElement('div')
    element.className = className
    document.documentElement.appendChild(element)
    return element
  }

  function isTypingTarget(target) {
    if (!(target instanceof Element)) return false
    const tagName = target.tagName?.toLowerCase()
    return tagName === 'input' ||
      tagName === 'textarea' ||
      tagName === 'select' ||
      target.isContentEditable ||
      !!target.closest?.('[contenteditable="true"], [role="textbox"]')
  }

  function px(value) {
    return `${Math.round(value)}px`
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max)
  }

  function getAnchoredTooltipPosition(pointer, anchorRect, tooltipRect, viewport, options = {}) {
    const offset = options.offset ?? 14
    const margin = options.margin ?? 12
    const width = tooltipRect.width || 0
    const height = tooltipRect.height || 0
    const viewportWidth = viewport.width
    const viewportHeight = viewport.height
    const maxLeft = Math.max(margin, viewportWidth - width - margin)
    const maxTop = Math.max(margin, viewportHeight - height - margin)
    const rightFromPointer = pointer.x + offset
    const bottomFromPointer = pointer.y + offset
    const leftOfAnchor = anchorRect.left - width - offset
    const topOfAnchor = anchorRect.top - height - offset
    const leftOfPointer = pointer.x - width - offset
    const topOfPointer = pointer.y - height - offset

    const left = rightFromPointer + width <= viewportWidth - margin
      ? rightFromPointer
      : leftOfAnchor >= margin
        ? leftOfAnchor
        : clamp(leftOfPointer, margin, maxLeft)

    const top = bottomFromPointer + height <= viewportHeight - margin
      ? bottomFromPointer
      : topOfAnchor >= margin
        ? topOfAnchor
        : clamp(topOfPointer, margin, maxTop)

    return {
      left: Math.round(left),
      top: Math.round(top)
    }
  }

  function setBox(element, rect) {
    element.style.display = 'block'
    element.style.left = px(rect.left)
    element.style.top = px(rect.top)
    element.style.width = px(rect.width)
    element.style.height = px(rect.height)
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  function formatBoxValues(styles, prefix) {
    return `${styles[`${prefix}Top`]} ${styles[`${prefix}Right`]} ${styles[`${prefix}Bottom`]} ${styles[`${prefix}Left`]}`
  }

  function formatRadiusValues(styles) {
    return `${styles.borderTopLeftRadius} ${styles.borderTopRightRadius} ${styles.borderBottomRightRadius} ${styles.borderBottomLeftRadius}`
  }

  function formatGapValues(styles) {
    if (!['flex', 'inline-flex', 'grid', 'inline-grid'].includes(styles.display)) return '—'

    const rowGap = styles.rowGap
    const columnGap = styles.columnGap
    const normalized = [rowGap, columnGap].map(value => String(value).trim())

    if (normalized.every(value => value === 'normal' || value === '0px')) return '—'
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

  function isCssValueUseful(value) {
    return value !== undefined && value !== null && value !== '' && value !== '—'
  }

  function isZeroBoxValue(value) {
    return String(value || '').split(/\s+/).every(part => Number.parseFloat(part) === 0)
  }

  root.dom = {
    createElement,
    isTypingTarget,
    px,
    getAnchoredTooltipPosition,
    setBox,
    escapeHtml,
    formatBoxValues,
    formatRadiusValues,
    formatGapValues,
    rgbToHex,
    isTransparentColor,
    formatColor,
    isCssValueUseful,
    isZeroBoxValue
  }
})()
