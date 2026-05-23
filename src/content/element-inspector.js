(() => {
  const root = window.LayoutPilotModules ||= {}
  const {
    formatBoxValues,
    formatRadiusValues,
    formatGapValues,
    isTransparentColor,
    formatColor
  } = root.dom
  const {
    getClasses,
    getElementName,
    getTextSnippet,
    getSelectorCandidates
  } = root.selectorUtils

  function getElementBackgroundColor(styles) {
    return isTransparentColor(styles.backgroundColor) ? '' : styles.backgroundColor
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
    return unique.map(color => root.dom.rgbToHex(color)).filter(Boolean)
  }

  function formatFontFamily(styles) {
    return String(styles.fontFamily || '')
      .split(',')[0]
      ?.replace(/^['"]|['"]$/g, '') || '—'
  }

  function formatLineHeight(styles) {
    const lineHeight = String(styles.lineHeight || '').trim()
    const fontSize = Number.parseFloat(styles.fontSize)

    if (!lineHeight) return { value: '—', ratio: '', note: '' }

    if (lineHeight === 'normal') {
      return { value: 'normal', ratio: '', note: '~normal browser value' }
    }

    const numericLineHeight = Number.parseFloat(lineHeight)
    const ratio = Number.isFinite(numericLineHeight) && Number.isFinite(fontSize) && fontSize > 0
      ? (numericLineHeight / fontSize).toFixed(2)
      : ''

    return { value: lineHeight, ratio: ratio || '', note: '' }
  }

  function getBorderSummary(styles) {
    const borders = [
      { width: styles.borderTopWidth, style: styles.borderTopStyle, color: styles.borderTopColor },
      { width: styles.borderRightWidth, style: styles.borderRightStyle, color: styles.borderRightColor },
      { width: styles.borderBottomWidth, style: styles.borderBottomStyle, color: styles.borderBottomColor },
      { width: styles.borderLeftWidth, style: styles.borderLeftStyle, color: styles.borderLeftColor }
    ]

    const sides = borders.map(border => {
      if (Number.parseFloat(border.width) <= 0 || border.style === 'none' || isTransparentColor(border.color)) return ''
      return `${border.width} ${border.style} ${formatColor(border.color)}`
    })

    if (sides.every(side => !side)) return '—'

    const unique = Array.from(new Set(sides))
    if (unique.length === 1) return unique[0]

    return `top ${sides[0] || 'none'} / right ${sides[1] || 'none'} / bottom ${sides[2] || 'none'} / left ${sides[3] || 'none'}`
  }

  function getSpacingBetween(a, b) {
    const horizontal = b.left > a.right ? b.left - a.right : a.left > b.right ? a.left - b.right : 0
    const vertical = b.top > a.bottom ? b.top - a.bottom : a.top > b.bottom ? a.top - b.bottom : 0

    return {
      horizontal: Math.round(horizontal),
      vertical: Math.round(vertical)
    }
  }

  function getParentInfo(element) {
    const parent = element.parentElement
    if (!parent || parent === document.documentElement) return null

    const rect = parent.getBoundingClientRect()
    const styles = getComputedStyle(parent)

    return {
      tag: parent.tagName.toLowerCase(),
      name: getElementName(parent),
      classes: getClasses(parent),
      selector: getSelectorCandidates(parent).best,
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      display: styles.display,
      padding: formatBoxValues(styles, 'padding'),
      gap: formatGapValues(styles),
      alignItems: styles.alignItems,
      justifyContent: styles.justifyContent,
      flexDirection: styles.flexDirection,
      gridTemplateColumns: styles.gridTemplateColumns,
      gridTemplateRows: styles.gridTemplateRows,
      rect
    }
  }

  function getChildrenInfo(element) {
    const children = Array.from(element.children || [])

    return {
      count: children.length,
      preview: children.slice(0, 5).map(child => {
        const rect = child.getBoundingClientRect()
        return {
          tag: child.tagName.toLowerCase(),
          name: getElementName(child),
          classes: getClasses(child),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          text: getTextSnippet(child, 72)
        }
      })
    }
  }

  function collectElementInfo(element) {
    const rect = element.getBoundingClientRect()
    const styles = getComputedStyle(element)
    const lineHeight = formatLineHeight(styles)
    const backgroundColor = getElementBackgroundColor(styles)
    const selectorCandidates = getSelectorCandidates(element)
    const parent = getParentInfo(element)
    const parentRelativePosition = parent
      ? { x: Math.round(rect.left - parent.rect.left), y: Math.round(rect.top - parent.rect.top) }
      : null

    return {
      element,
      tag: element.tagName.toLowerCase(),
      id: element.id || '—',
      name: getElementName(element),
      role: element.getAttribute('role') || '—',
      ariaLabel: element.getAttribute('aria-label') || '—',
      text: getTextSnippet(element, 120) || '—',
      selector: selectorCandidates.best,
      selectorCandidates,
      classes: getClasses(element),
      rect,
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      x: Math.round(rect.left),
      y: Math.round(rect.top),
      pageX: Math.round(rect.left + window.scrollX),
      pageY: Math.round(rect.top + window.scrollY),
      parentRelativePosition,
      parent,
      children: getChildrenInfo(element),
      margin: formatBoxValues(styles, 'margin'),
      padding: formatBoxValues(styles, 'padding'),
      boxSizing: styles.boxSizing,
      display: styles.display,
      position: styles.position,
      flexDirection: styles.flexDirection,
      alignItems: styles.alignItems,
      justifyContent: styles.justifyContent,
      gridTemplateColumns: styles.gridTemplateColumns,
      gridTemplateRows: styles.gridTemplateRows,
      gap: formatGapValues(styles),
      fontFamily: formatFontFamily(styles),
      fontSize: styles.fontSize,
      fontWeight: styles.fontWeight,
      lineHeight,
      letterSpacing: styles.letterSpacing,
      color: formatColor(styles.color),
      background: backgroundColor ? formatColor(backgroundColor) : '—',
      fontFamilyCss: styles.fontFamily,
      border: getBorderSummary(styles),
      borderColors: getBorderColor(styles),
      radius: formatRadiusValues(styles),
      shadow: styles.boxShadow === 'none' ? '—' : styles.boxShadow,
      opacity: styles.opacity,
      zIndex: styles.zIndex,
      overflow: `${styles.overflowX} / ${styles.overflowY}`,
      textAlign: styles.textAlign
    }
  }

  function formatLineHeightText(info) {
    if (info.lineHeight.value === 'normal' && info.lineHeight.note) return `normal (${info.lineHeight.note})`
    if (info.lineHeight.ratio) return `${info.lineHeight.value} / ${info.lineHeight.ratio}`
    return info.lineHeight.value
  }

  function formatChildrenSummary(children) {
    if (!children.count) return '- Direct children: 0'

    const rows = children.preview.map((child, index) => {
      const text = child.text ? ` | text: "${child.text}"` : ''
      return `  ${index + 1}. ${child.tag} ${child.classes} | ${child.width} x ${child.height}px${text}`
    })

    return [`- Direct children: ${children.count}`, '- First children:', ...rows].join('\n')
  }

  root.elementInspector = {
    getElementBackgroundColor,
    getBorderColor,
    formatFontFamily,
    formatLineHeight,
    getBorderSummary,
    getSpacingBetween,
    getParentInfo,
    getChildrenInfo,
    collectElementInfo,
    formatLineHeightText,
    formatChildrenSummary
  }
})()
