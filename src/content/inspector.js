(() => {
  const INSTANCE_KEY = '__layoutPilot'
  const UI_SELECTOR = [
    '.layoutpilot-overlay',
    '.layoutpilot-selected-overlay',
    '.layoutpilot-tooltip',
    '.layoutpilot-distance-layer',
    '.layoutpilot-detail-panel',
    '.layoutpilot-help-panel',
    '.layoutpilot-toast'
  ].join(', ')

  function cleanupOrphanUi() {
    document.querySelectorAll(UI_SELECTOR).forEach(element => element.remove())
  }

  if (window[INSTANCE_KEY]?.destroy) {
    window[INSTANCE_KEY].destroy()
  } else if (window[INSTANCE_KEY]?.setEnabled) {
    window[INSTANCE_KEY].setEnabled(false)
    cleanupOrphanUi()
  } else {
    cleanupOrphanUi()
  }

  const MODE = {
    INSPECT: 'inspect',
    REVIEW: 'review'
  }

  const state = {
    enabled: false,
    mode: MODE.INSPECT,
    hoveredElement: null,
    selectedElement: null,
    overlay: null,
    selectedOverlay: null,
    tooltip: null,
    distanceLayer: null,
    detailPanel: null,
    helpPanel: null,
    toast: null,
    lastPointerEvent: null,
    healthCheckTimer: null,
    detailPanelPosition: null,
    detailPanelDrag: null
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

  function ensureDetailPanel() {
    state.detailPanel ||= createElement('layoutpilot-detail-panel')
    return state.detailPanel
  }

  function ensureHelpPanel() {
    state.helpPanel ||= createElement('layoutpilot-help-panel')
    return state.helpPanel
  }

  function ensureToast() {
    state.toast ||= createElement('layoutpilot-toast')
    return state.toast
  }

  function removeElement(key) {
    if (state[key]) {
      state[key].remove()
      state[key] = null
    }
  }

  function hideUi() {
    for (const key of ['overlay', 'selectedOverlay', 'tooltip', 'distanceLayer', 'detailPanel', 'helpPanel', 'toast']) {
      removeElement(key)
    }
    cleanupOrphanUi()
  }

  function hideTransientUi() {
    for (const element of [state.overlay, state.selectedOverlay, state.tooltip, state.distanceLayer]) {
      if (element) element.style.display = 'none'
    }
  }

  function isOwnElement(element) {
    if (!(element instanceof Element)) return false
    return element.classList?.contains('layoutpilot-overlay') ||
      element.classList?.contains('layoutpilot-selected-overlay') ||
      element.classList?.contains('layoutpilot-tooltip') ||
      element.classList?.contains('layoutpilot-distance-layer') ||
      element.classList?.contains('layoutpilot-detail-panel') ||
      element.classList?.contains('layoutpilot-help-panel') ||
      element.classList?.contains('layoutpilot-toast') ||
      !!element.closest?.('.layoutpilot-tooltip, .layoutpilot-distance-layer, .layoutpilot-detail-panel, .layoutpilot-help-panel, .layoutpilot-toast')
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

  function getElementAtPoint(event) {
    const elements = document.elementsFromPoint(event.clientX, event.clientY)
    return elements.find(element => element instanceof Element && !isOwnElement(element) && element !== document.documentElement && element !== document.body) || null
  }

  function getActiveElement() {
    if (state.selectedElement?.isConnected) return state.selectedElement
    if (state.hoveredElement?.isConnected) return state.hoveredElement
    return null
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

  function getElementName(element) {
    const tag = element.tagName.toLowerCase()
    const id = element.id ? `#${element.id}` : ''
    const className = Array.from(element.classList || []).slice(0, 3).map(name => `.${name}`).join('')
    return `${tag}${id}${className}`
  }

  function cssEscape(value) {
    if (window.CSS?.escape) return CSS.escape(value)
    return String(value).replace(/[^a-zA-Z0-9_-]/g, character => `\\${character}`)
  }

  function cssStringEscape(value) {
    return String(value)
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\A ')
      .replace(/\r/g, '')
  }

  function getTextSnippet(element, maxLength = 120) {
    const text = String(element.innerText || element.textContent || '')
      .replace(/\s+/g, ' ')
      .trim()

    if (!text) return ''
    return text.length > maxLength ? `${text.slice(0, maxLength - 1)}...` : text
  }

  function getUsefulAttributeSelector(element) {
    if (element.id) return `#${cssEscape(element.id)}`

    const preferredAttributes = ['data-testid', 'data-test', 'data-cy', 'data-qa', 'data-component', 'aria-label']
    for (const attribute of preferredAttributes) {
      const value = element.getAttribute(attribute)
      if (value) return `[${attribute}="${cssStringEscape(value)}"]`
    }

    const dataAttribute = Array.from(element.attributes || [])
      .find(attribute => attribute.name.startsWith('data-') && attribute.value && attribute.value.length <= 80)

    if (dataAttribute) return `[${dataAttribute.name}="${cssStringEscape(dataAttribute.value)}"]`

    return ''
  }

  function getStableClasses(element, limit = 5) {
    return Array.from(element.classList || [])
      .filter(className => className && className.length <= 60)
      .slice(0, limit)
      .map(className => `.${cssEscape(className)}`)
      .join('')
  }

  function getSelectorPart(element, options = {}) {
    if (!(element instanceof Element)) return ''

    const tag = element.tagName.toLowerCase()
    const attributeSelector = getUsefulAttributeSelector(element)
    if (attributeSelector) return attributeSelector.startsWith('#') ? attributeSelector : `${tag}${attributeSelector}`

    const classes = getStableClasses(element)
    if (classes) return `${tag}${classes}`

    if (options.withNth) {
      const parent = element.parentElement
      const sameTagSiblings = parent
        ? Array.from(parent.children).filter(child => child.tagName === element.tagName)
        : []

      if (sameTagSiblings.length > 1) return `${tag}:nth-of-type(${sameTagSiblings.indexOf(element) + 1})`
    }

    return tag
  }

  function getFullSelectorPath(element) {
    if (!(element instanceof Element)) return '—'

    const parts = []
    let current = element

    while (current instanceof Element && current !== document.documentElement && parts.length < 6) {
      const part = getSelectorPart(current, { withNth: true })

      parts.unshift(part)
      if (part.startsWith('#')) break
      current = current.parentElement
    }

    return parts.join(' > ') || getElementName(element)
  }

  function getSelectorCandidates(element) {
    if (!(element instanceof Element)) {
      return { best: '—', withParent: '—', fullPath: '—' }
    }

    const best = getSelectorPart(element)
    const parent = element.parentElement
    const parentPart = parent && parent !== document.body && parent !== document.documentElement
      ? getSelectorPart(parent)
      : ''
    const withParent = parentPart ? `${parentPart} > ${best}` : best
    const fullPath = getFullSelectorPath(element)

    return { best, withParent, fullPath }
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

  function formatColorMarkup(colorValue) {
    const value = formatColor(colorValue)
    if (value === '—') return value
    return createColorChipMarkup([value])
  }

  function formatColorsMarkup(colors) {
    if (!colors?.length) return '—'
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
        <span class="layoutpilot-color-swatch" style="background: ${escapeHtml(background)}"></span>
        <span>${escapeHtml(uniqueColors.join(' / '))}</span>
      </span>
    `
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

  function addContextSection(lines, title, rows) {
    const usefulRows = rows.filter(Boolean)
    if (!usefulRows.length) return

    if (lines.length) lines.push('')
    lines.push(`${title}:`, ...usefulRows)
  }

  function isOverflowRelevant(overflow) {
    return isCssValueUseful(overflow) && overflow !== 'visible / visible'
  }

  function isLayoutContainer(display) {
    return ['flex', 'inline-flex', 'grid', 'inline-grid'].includes(display)
  }

  function createCompactAiContext(info) {
    const lines = ['LayoutPilot context']
    const pageRows = [
      `- URL: ${location.href}`,
      `- Viewport: ${window.innerWidth} x ${window.innerHeight}px`
    ]
    const targetRows = [
      `- Element: ${info.selectorCandidates.best || info.name}`,
      info.parent ? `- Parent: ${info.parent.selector || info.parent.name}` : '',
      info.text !== '—' ? `- Text: ${info.text}` : ''
    ]
    const boxRows = [
      `- Size: ${info.width} x ${info.height}px`,
      `- Position: x ${info.x}, y ${info.y}`
    ]
    const layoutRows = [
      `- Element display: ${info.display}`,
      `- Element position: ${info.position}`,
      info.parent ? `- Parent display: ${info.parent.display}` : '',
      info.parent && !isZeroBoxValue(info.parent.padding) ? `- Parent padding: ${info.parent.padding}` : '',
      info.parent && info.parent.gap !== '—' ? `- Parent gap: ${info.parent.gap}` : '',
      !isZeroBoxValue(info.margin) ? `- Margin: ${info.margin}` : '',
      !isZeroBoxValue(info.padding) ? `- Padding: ${info.padding}` : '',
      info.gap !== '—' ? `- Gap: ${info.gap}` : '',
      isLayoutContainer(info.display) ? `- Align / justify: ${info.alignItems} / ${info.justifyContent}` : '',
      isLayoutContainer(info.display) && info.flexDirection !== 'row' ? `- Flex direction: ${info.flexDirection}` : '',
      ['grid', 'inline-grid'].includes(info.display) && info.gridTemplateColumns !== 'none' ? `- Grid columns: ${info.gridTemplateColumns}` : '',
      ['grid', 'inline-grid'].includes(info.display) && info.gridTemplateRows !== 'none' ? `- Grid rows: ${info.gridTemplateRows}` : '',
      isOverflowRelevant(info.overflow) ? `- Overflow: ${info.overflow}` : ''
    ]
    const typographyRows = [
      `- Font: ${info.fontFamily}, ${info.fontSize}, ${info.fontWeight}`,
      `- Line height: ${formatLineHeightText(info)}`,
      `- Text align: ${info.textAlign}`,
      info.color !== '—' ? `- Color: ${info.color}` : ''
    ]
    const visualRows = [
      info.background !== '—' ? `- Background: ${info.background}` : '',
      info.border !== '—' ? `- Border: ${info.border}` : '',
      !isZeroBoxValue(info.radius) ? `- Radius: ${info.radius}` : '',
      info.shadow !== '—' ? `- Shadow: ${info.shadow}` : ''
    ]

    addContextSection(lines, 'Page', pageRows)
    addContextSection(lines, 'Target', targetRows)
    addContextSection(lines, 'Box', boxRows)
    addContextSection(lines, 'Layout', layoutRows)
    addContextSection(lines, 'Typography', typographyRows)
    addContextSection(lines, 'Visual', visualRows)

    lines.push(
      '',
      'Issue:',
      '[Describe what looks wrong here]',
      '',
      'Request:',
      'Suggest the most likely CSS/layout adjustment. Keep the existing visual style unless needed.'
    )

    return lines.join('\n')
  }

  function createAiContext(info) {
    return `LayoutPilot element context

Page:
- URL: ${location.href}
- Title: ${document.title || '—'}
- Viewport: ${window.innerWidth} x ${window.innerHeight}px
- Scroll: x ${Math.round(window.scrollX)}, y ${Math.round(window.scrollY)}

Element:
- Tag: ${info.tag}
- ID: ${info.id}
- Classes: ${info.classes}
- Role: ${info.role}
- Aria label: ${info.ariaLabel}
- Selector candidates:
  1. Best effort: ${info.selectorCandidates.best}
  2. With parent: ${info.selectorCandidates.withParent}
  3. Full path: ${info.selectorCandidates.fullPath}
- Text snippet: ${info.text}

Box:
- Size: ${info.width} x ${info.height}px
- Viewport position: x ${info.x}, y ${info.y}
- Page position: x ${info.pageX}, y ${info.pageY}
- Parent-relative position: ${info.parentRelativePosition ? `x ${info.parentRelativePosition.x}, y ${info.parentRelativePosition.y}` : '—'}

Parent:
- Element: ${info.parent ? info.parent.name : '—'}
- Selector: ${info.parent ? info.parent.selector : '—'}
- Classes: ${info.parent ? info.parent.classes : '—'}
- Size: ${info.parent ? `${info.parent.width} x ${info.parent.height}px` : '—'}
- Display: ${info.parent ? info.parent.display : '—'}
- Padding: ${info.parent ? info.parent.padding : '—'}
- Gap: ${info.parent ? info.parent.gap : '—'}
- Align / justify: ${info.parent ? `${info.parent.alignItems} / ${info.parent.justifyContent}` : '—'}

Layout:
- Display: ${info.display}
- Position: ${info.position}
- Flex direction: ${info.flexDirection}
- Align items: ${info.alignItems}
- Justify content: ${info.justifyContent}
- Gap: ${info.gap}
- Grid columns: ${info.gridTemplateColumns}
- Grid rows: ${info.gridTemplateRows}
- Overflow: ${info.overflow}
- Z-index: ${info.zIndex}

Children:
${formatChildrenSummary(info.children)}

Spacing:
- Margin: ${info.margin}
- Padding: ${info.padding}
- Gap: ${info.gap}
- Box sizing: ${info.boxSizing}

Typography:
- Font family: ${info.fontFamily}
- Font size: ${info.fontSize}
- Font weight: ${info.fontWeight}
- Line height: ${formatLineHeightText(info)}
- Line height ratio: ${info.lineHeight.ratio || '—'}
- Letter spacing: ${info.letterSpacing}
- Text align: ${info.textAlign}
- Text color: ${info.color}

Visual:
- Background color: ${info.background}
- Border: ${info.border}
- Border radius: ${info.radius}
- Box shadow: ${info.shadow}
- Opacity: ${info.opacity}

Observed issue:
[Describe what looks wrong here]

Request:
Use this context to suggest precise frontend/CSS adjustments. Keep the existing visual style unless the issue requires changing it.`
  }

  function isCssValueUseful(value) {
    return value !== undefined && value !== null && value !== '' && value !== '—'
  }

  function isZeroBoxValue(value) {
    return String(value || '').split(/\s+/).every(part => Number.parseFloat(part) === 0)
  }

  function addCssDeclaration(lines, property, value, comment = '') {
    if (!isCssValueUseful(value)) return
    lines.push(`  ${property}: ${value};${comment ? ` /* ${cssCommentEscape(comment)} */` : ''}`)
  }

  function addCssComment(lines, text) {
    if (isCssValueUseful(text)) lines.push(`  /* ${cssCommentEscape(text)} */`)
  }

  function addCssDeclarationWhen(lines, condition, property, value, comment = '') {
    if (condition) addCssDeclaration(lines, property, value, comment)
  }

  function cssCommentEscape(value) {
    return String(value).replace(/\*\//g, '* /')
  }

  function createCssSummary(info) {
    const lines = [
      `/* LayoutPilot CSS/layout summary`,
      `   Selector candidates:`,
      `   1. ${cssCommentEscape(info.selectorCandidates.best)}`,
      `   2. ${cssCommentEscape(info.selectorCandidates.withParent)}`,
      `   3. ${cssCommentEscape(info.selectorCandidates.fullPath)}`,
      `*/`,
      `${info.selectorCandidates.best} {`
    ]

    const isFlex = ['flex', 'inline-flex'].includes(info.display)
    const isGrid = ['grid', 'inline-grid'].includes(info.display)

    addCssDeclaration(lines, 'display', info.display)
    addCssDeclaration(lines, 'position', info.position)
    addCssDeclaration(lines, 'box-sizing', info.boxSizing)
    addCssDeclaration(lines, 'width', `${info.width}px`)
    addCssDeclaration(lines, 'height', `${info.height}px`)
    addCssDeclaration(lines, 'margin', info.margin)
    addCssDeclaration(lines, 'padding', info.padding)
    addCssDeclarationWhen(lines, isFlex, 'flex-direction', info.flexDirection)
    addCssDeclarationWhen(lines, isFlex || isGrid, 'align-items', info.alignItems)
    addCssDeclarationWhen(lines, isFlex || isGrid, 'justify-content', info.justifyContent)
    addCssDeclarationWhen(lines, info.gap !== '—', 'gap', info.gap)
    addCssDeclarationWhen(lines, isGrid && info.gridTemplateColumns !== 'none', 'grid-template-columns', info.gridTemplateColumns)
    addCssDeclarationWhen(lines, isGrid && info.gridTemplateRows !== 'none', 'grid-template-rows', info.gridTemplateRows)
    addCssDeclaration(lines, 'font-family', info.fontFamilyCss)
    addCssDeclaration(lines, 'font-size', info.fontSize)
    addCssDeclaration(lines, 'font-weight', info.fontWeight)
    addCssDeclaration(lines, 'line-height', info.lineHeight.value, info.lineHeight.ratio ? `ratio: ${info.lineHeight.ratio}` : info.lineHeight.note)
    addCssDeclaration(lines, 'letter-spacing', info.letterSpacing)
    addCssDeclaration(lines, 'text-align', info.textAlign)
    addCssDeclaration(lines, 'color', info.color)
    addCssDeclarationWhen(lines, info.background !== '—', 'background-color', info.background)
    if (info.border !== '—' && info.border.startsWith('top ')) {
      addCssComment(lines, `border differs by side: ${info.border}`)
    } else {
      addCssDeclarationWhen(lines, info.border !== '—', 'border', info.border)
    }
    addCssDeclarationWhen(lines, !isZeroBoxValue(info.radius), 'border-radius', info.radius)
    addCssDeclarationWhen(lines, info.shadow !== '—', 'box-shadow', info.shadow)
    addCssDeclarationWhen(lines, info.opacity !== '1', 'opacity', info.opacity)
    addCssDeclarationWhen(lines, info.zIndex !== 'auto', 'z-index', info.zIndex)

    if (info.overflow !== 'visible / visible') {
      const [overflowX, overflowY] = info.overflow.split(' / ')
      if (overflowX === overflowY) {
        addCssDeclaration(lines, 'overflow', overflowX)
      } else {
        addCssDeclaration(lines, 'overflow-x', overflowX)
        addCssDeclaration(lines, 'overflow-y', overflowY)
      }
    }

    lines.push('}')

    return lines.join('\n')
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
    const info = collectElementInfo(element)
    const selectedRect = state.selectedElement?.isConnected ? state.selectedElement.getBoundingClientRect() : null
    const spacing = selectedRect && state.selectedElement !== element ? getSpacingBetween(selectedRect, info.rect) : null
    const isPinned = state.selectedElement === element
    const layoutExtra = info.gap !== '—' ? info.gap : `${info.display} / ${info.position}`

    state.tooltip.innerHTML = `
      <strong>${escapeHtml(info.name)}</strong>
      <div class="layoutpilot-grid">
        <span class="layoutpilot-label">Size</span>
        <span class="layoutpilot-value">${info.width} x ${info.height}px</span>
        <span class="layoutpilot-label">Position</span>
        <span class="layoutpilot-value">x ${info.x}, y ${info.y}</span>
        <span class="layoutpilot-label">Padding</span>
        <span class="layoutpilot-value">${escapeHtml(info.padding)}</span>
        <span class="layoutpilot-label">Margin</span>
        <span class="layoutpilot-value">${escapeHtml(info.margin)}</span>
        <span class="layoutpilot-label">Layout</span>
        <span class="layoutpilot-value">${escapeHtml(layoutExtra)}</span>
        <span class="layoutpilot-label layoutpilot-line-label">Line height</span>
        <span class="layoutpilot-value layoutpilot-line-value">${escapeHtml(formatLineHeightText(info))}</span>
        <span class="layoutpilot-label">Font</span>
        <span class="layoutpilot-value">${escapeHtml(`${info.fontSize} ${info.fontFamily}`)}</span>
        <span class="layoutpilot-label">Color</span>
        <span class="layoutpilot-value">${formatColorMarkup(info.color)}</span>
        ${info.background !== '—' ? `
          <span class="layoutpilot-label">Background</span>
          <span class="layoutpilot-value">${formatColorMarkup(info.background)}</span>
        ` : ''}
        ${info.borderColors.length ? `
          <span class="layoutpilot-label">Border</span>
          <span class="layoutpilot-value">${formatColorsMarkup(info.borderColors)}</span>
        ` : ''}
        <span class="layoutpilot-label">Classes</span>
        <span class="layoutpilot-value layoutpilot-code">${escapeHtml(info.classes)}</span>
        ${spacing ? `
          <span class="layoutpilot-label">Spacing</span>
          <span class="layoutpilot-value">H ${spacing.horizontal}px - V ${spacing.vertical}px</span>
        ` : ''}
      </div>
      <div class="layoutpilot-divider"></div>
      <div class="layoutpilot-help">${isPinned ? 'Click again to unpin.' : 'Click to pin.'} D details - C simple context - H help - Q quit</div>
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

  function renderDetailRow(label, value, options = {}) {
    const className = options.strong ? 'layoutpilot-detail-value layoutpilot-detail-strong' : 'layoutpilot-detail-value'
    return `
      <div class="layoutpilot-detail-row">
        <span class="layoutpilot-detail-label">${escapeHtml(label)}</span>
        <span class="${className}">${value}</span>
      </div>
    `
  }

  function renderDetailSection(title, rows) {
    return `
      <section class="layoutpilot-detail-section">
        <h3>${escapeHtml(title)}</h3>
        ${rows.join('')}
      </section>
    `
  }

  function renderChildrenRows(children) {
    if (!children.count) return [renderDetailRow('Direct children', '0')]

    const rows = [renderDetailRow('Direct children', String(children.count))]
    for (const [index, child] of children.preview.entries()) {
      const text = child.text ? ` - ${child.text}` : ''
      rows.push(renderDetailRow(`${index + 1}`, `<code>${escapeHtml(`${child.tag} ${child.classes} | ${child.width} x ${child.height}px${text}`)}</code>`))
    }

    return rows
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value))
  }

  function getClampedDetailPanelPosition(x, y) {
    if (!state.detailPanel) return { x, y }

    const margin = 8
    const rect = state.detailPanel.getBoundingClientRect()
    const maxX = Math.max(margin, window.innerWidth - rect.width - margin)
    const maxY = Math.max(margin, window.innerHeight - rect.height - margin)

    return {
      x: clamp(x, margin, maxX),
      y: clamp(y, margin, maxY)
    }
  }

  function applyDetailPanelPosition() {
    if (!state.detailPanel || !state.detailPanelPosition) return

    const position = getClampedDetailPanelPosition(state.detailPanelPosition.x, state.detailPanelPosition.y)
    state.detailPanelPosition = position
    state.detailPanel.style.left = px(position.x)
    state.detailPanel.style.top = px(position.y)
    state.detailPanel.style.right = 'auto'
    state.detailPanel.style.bottom = 'auto'
  }

  function updateDetailPanelPosition(x, y) {
    state.detailPanelPosition = getClampedDetailPanelPosition(x, y)
    applyDetailPanelPosition()
  }

  function handleDetailDragMove(event) {
    if (!state.detailPanelDrag) return

    event.preventDefault()
    const nextX = event.clientX - state.detailPanelDrag.offsetX
    const nextY = event.clientY - state.detailPanelDrag.offsetY
    updateDetailPanelPosition(nextX, nextY)
  }

  function stopDetailPanelDrag() {
    if (!state.detailPanelDrag) return

    state.detailPanel?.classList.remove('layoutpilot-detail-dragging')
    state.detailPanelDrag = null
    window.removeEventListener('pointermove', handleDetailDragMove, true)
    window.removeEventListener('pointerup', stopDetailPanelDrag, true)
    window.removeEventListener('pointercancel', stopDetailPanelDrag, true)
  }

  function handleDetailDragStart(event) {
    if (event.button !== 0) return
    if (event.target?.closest?.('button, [data-layoutpilot-action], input, textarea, select, a')) return
    if (!state.detailPanel) return

    const rect = state.detailPanel.getBoundingClientRect()
    state.detailPanelDrag = {
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top
    }
    state.detailPanelPosition = { x: rect.left, y: rect.top }
    state.detailPanel.classList.add('layoutpilot-detail-dragging')
    applyDetailPanelPosition()

    event.preventDefault()
    event.stopPropagation()
    window.addEventListener('pointermove', handleDetailDragMove, true)
    window.addEventListener('pointerup', stopDetailPanelDrag, true)
    window.addEventListener('pointercancel', stopDetailPanelDrag, true)
  }

  function openDetailPanel(element = getActiveElement()) {
    if (!element?.isConnected) {
      showToast('No element selected')
      return
    }

    state.selectedElement = element
    renderSelectedOverlay()

    const info = collectElementInfo(element)
    const panel = ensureDetailPanel()
    panel.innerHTML = `
      <div class="layoutpilot-detail-header">
        <div>
          <span class="layoutpilot-detail-kicker">Modo Inspecao</span>
          <h2>${escapeHtml(info.name)}</h2>
        </div>
        <button class="layoutpilot-icon-button" type="button" data-layoutpilot-action="close-detail" aria-label="Close details">x</button>
      </div>
      <div class="layoutpilot-detail-actions">
        <button type="button" data-layoutpilot-action="copy-ai">Contexto simples</button>
        <button type="button" data-layoutpilot-action="copy-ai-full">Contexto completo</button>
        <button type="button" data-layoutpilot-action="copy-selector">Selector</button>
        <button type="button" data-layoutpilot-action="copy-css">CSS/layout</button>
      </div>
      <div class="layoutpilot-detail-body">
        ${renderDetailSection('Element', [
          renderDetailRow('Tag', escapeHtml(info.tag)),
          renderDetailRow('ID', escapeHtml(info.id)),
          renderDetailRow('Role', escapeHtml(info.role)),
          renderDetailRow('Aria label', escapeHtml(info.ariaLabel)),
          renderDetailRow('Classes', `<code>${escapeHtml(info.classes)}</code>`),
          renderDetailRow('Text', escapeHtml(info.text))
        ])}
        ${renderDetailSection('Selector candidates', [
          renderDetailRow('Best effort', `<code>${escapeHtml(info.selectorCandidates.best)}</code>`),
          renderDetailRow('With parent', `<code>${escapeHtml(info.selectorCandidates.withParent)}</code>`),
          renderDetailRow('Full path', `<code>${escapeHtml(info.selectorCandidates.fullPath)}</code>`)
        ])}
        ${renderDetailSection('Box', [
          renderDetailRow('Size', `${info.width} x ${info.height}px`),
          renderDetailRow('Viewport pos', `x ${info.x}, y ${info.y}`),
          renderDetailRow('Page pos', `x ${info.pageX}, y ${info.pageY}`),
          renderDetailRow('Parent pos', info.parentRelativePosition ? `x ${info.parentRelativePosition.x}, y ${info.parentRelativePosition.y}` : '—'),
          renderDetailRow('Box sizing', escapeHtml(info.boxSizing))
        ])}
        ${renderDetailSection('Parent', [
          renderDetailRow('Element', escapeHtml(info.parent?.name || '—')),
          renderDetailRow('Selector', `<code>${escapeHtml(info.parent?.selector || '—')}</code>`),
          renderDetailRow('Size', info.parent ? `${info.parent.width} x ${info.parent.height}px` : '—'),
          renderDetailRow('Display', escapeHtml(info.parent?.display || '—')),
          renderDetailRow('Padding', escapeHtml(info.parent?.padding || '—')),
          renderDetailRow('Gap', escapeHtml(info.parent?.gap || '—')),
          renderDetailRow('Align/justify', escapeHtml(info.parent ? `${info.parent.alignItems} / ${info.parent.justifyContent}` : '—'))
        ])}
        ${renderDetailSection('Layout', [
          renderDetailRow('Display', escapeHtml(info.display)),
          renderDetailRow('Position CSS', escapeHtml(info.position)),
          renderDetailRow('Flex direction', escapeHtml(info.flexDirection)),
          renderDetailRow('Align items', escapeHtml(info.alignItems)),
          renderDetailRow('Justify', escapeHtml(info.justifyContent)),
          renderDetailRow('Gap', escapeHtml(info.gap)),
          renderDetailRow('Grid cols', escapeHtml(info.gridTemplateColumns)),
          renderDetailRow('Grid rows', escapeHtml(info.gridTemplateRows)),
          renderDetailRow('Z-index', escapeHtml(info.zIndex)),
          renderDetailRow('Overflow', escapeHtml(info.overflow))
        ])}
        ${renderDetailSection('Children', renderChildrenRows(info.children))}
        ${renderDetailSection('Spacing', [
          renderDetailRow('Margin', escapeHtml(info.margin)),
          renderDetailRow('Padding', escapeHtml(info.padding)),
          renderDetailRow('Gap', escapeHtml(info.gap)),
          renderDetailRow('Box sizing', escapeHtml(info.boxSizing))
        ])}
        ${renderDetailSection('Typography', [
          renderDetailRow('Font', escapeHtml(info.fontFamily)),
          renderDetailRow('Size', escapeHtml(info.fontSize)),
          renderDetailRow('Weight', escapeHtml(info.fontWeight)),
          renderDetailRow('Line height', escapeHtml(formatLineHeightText(info)), { strong: true }),
          renderDetailRow('LH ratio', escapeHtml(info.lineHeight.ratio || '—'), { strong: true }),
          renderDetailRow('Letter spacing', escapeHtml(info.letterSpacing)),
          renderDetailRow('Text align', escapeHtml(info.textAlign))
        ])}
        ${renderDetailSection('Colors', [
          renderDetailRow('Text', formatColorMarkup(info.color)),
          renderDetailRow('Background', formatColorMarkup(info.background)),
          renderDetailRow('Opacity', escapeHtml(info.opacity))
        ])}
        ${renderDetailSection('Border / Effects', [
          renderDetailRow('Border', escapeHtml(info.border)),
          renderDetailRow('Radius', escapeHtml(info.radius)),
          renderDetailRow('Shadow', escapeHtml(info.shadow))
        ])}
        ${renderDetailSection('Simple Context', [
          `<pre>${escapeHtml(createCompactAiContext(info))}</pre>`
        ])}
      </div>
    `
    panel.style.display = 'flex'
    applyDetailPanelPosition()
    panel.querySelector('.layoutpilot-detail-header')?.addEventListener('pointerdown', handleDetailDragStart)
  }

  function closeDetailPanel() {
    removeElement('detailPanel')
  }

  function toggleDetailPanel() {
    if (state.detailPanel) {
      closeDetailPanel()
      return
    }

    openDetailPanel()
  }

  function renderHelpPanel() {
    const panel = ensureHelpPanel()
    panel.innerHTML = `
      <div class="layoutpilot-help-header">
        <strong>LayoutPilot atalhos</strong>
        <button class="layoutpilot-icon-button" type="button" data-layoutpilot-action="close-help" aria-label="Close help">x</button>
      </div>
      <div class="layoutpilot-help-grid">
        <kbd>I</kbd><span>Ativar/desativar inspecao</span>
        <kbd>H</kbd><span>Mostrar/ocultar atalhos</span>
        <kbd>Q</kbd><span>Desativar LayoutPilot</span>
        <kbd>Esc</kbd><span>Cancelar acao atual</span>
        <kbd>C</kbd><span>Copiar contexto simples</span>
        <kbd>D</kbd><span>Abrir/fechar detalhes</span>
        <kbd>P</kbd><span>Fixar/desfixar elemento</span>
      </div>
      <p>I funciona depois de ativar a extensao nesta aba pelo popup.</p>
      <p>Modo Revisao: em breve.</p>
    `
    panel.style.display = 'block'
  }

  function toggleHelpPanel() {
    if (state.helpPanel) {
      removeElement('helpPanel')
      return
    }

    renderHelpPanel()
  }

  function quitLayoutPilot() {
    if (state.enabled) {
      setEnabled(false)
      return
    }

    state.hoveredElement = null
    state.selectedElement = null
    state.lastPointerEvent = null
    hideUi()
  }

  function showToast(message) {
    const toast = ensureToast()
    toast.textContent = message
    toast.style.display = 'block'
    window.clearTimeout(showToast.timeout)
    showToast.timeout = window.setTimeout(() => {
      if (state.toast) state.toast.style.display = 'none'
    }, 1600)
  }

  function fallbackCopy(text) {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;'
    document.documentElement.appendChild(textarea)
    textarea.select()
    const copied = document.execCommand('copy')
    textarea.remove()
    return copied
  }

  async function copyText(text, label) {
    try {
      if (navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
      } else if (!fallbackCopy(text)) {
        throw new Error('copy failed')
      }
      showToast(`${label} copied`)
    } catch {
      showToast('Could not copy')
    }
  }

  function copyAiContext(element = getActiveElement()) {
    if (!element?.isConnected) {
      showToast('No element selected')
      return
    }
    copyText(createCompactAiContext(collectElementInfo(element)), 'Simple context')
  }

  function copyFullAiContext(element = getActiveElement()) {
    if (!element?.isConnected) {
      showToast('No element selected')
      return
    }
    copyText(createAiContext(collectElementInfo(element)), 'Full context')
  }

  function copySelector(element = getActiveElement()) {
    if (!element?.isConnected) {
      showToast('No element selected')
      return
    }
    copyText(collectElementInfo(element).selector, 'Selector')
  }

  function copyCssSummary(element = getActiveElement()) {
    if (!element?.isConnected) {
      showToast('No element selected')
      return
    }
    copyText(createCssSummary(collectElementInfo(element)), 'CSS/layout summary')
  }

  function inspectAtEvent(event) {
    if (!state.enabled || state.mode !== MODE.INSPECT || isOwnElement(event.target)) return

    const element = getElementAtPoint(event)
    if (!element) return

    state.hoveredElement = element
    state.lastPointerEvent = event
    ensureUi()
    setBox(state.overlay, element.getBoundingClientRect())
    renderSelectedOverlay()
    renderDistances(element)
    renderTooltip(event, element)
  }

  function togglePin(element = getActiveElement()) {
    if (!element?.isConnected) {
      showToast('No element selected')
      return
    }

    ensureUi()
    if (state.selectedElement === element) {
      state.selectedElement = null
      if (state.selectedOverlay) state.selectedOverlay.style.display = 'none'
      if (state.distanceLayer) {
        state.distanceLayer.innerHTML = ''
        state.distanceLayer.style.display = 'none'
      }
      showToast('Element unpinned')
      return
    }

    state.selectedElement = element
    renderSelectedOverlay()
    renderDistances(element)
    showToast('Element pinned')
  }

  function handleClick(event) {
    if (!state.enabled || state.mode !== MODE.INSPECT) return
    if (isOwnElement(event.target)) return

    const element = getElementAtPoint(event)
    if (!element) return

    event.preventDefault()
    event.stopPropagation()

    if (event.detail > 1) return
    togglePin(element)
    if (state.lastPointerEvent) renderTooltip(state.lastPointerEvent, element)
  }

  function handleDoubleClick(event) {
    if (!state.enabled || state.mode !== MODE.INSPECT) return
    if (isOwnElement(event.target)) return

    const element = getElementAtPoint(event)
    if (!element) return

    event.preventDefault()
    event.stopPropagation()
    state.selectedElement = element
    openDetailPanel(element)
  }

  function handleUiClick(event) {
    if (!isOwnElement(event.target)) return

    const action = event.target?.closest?.('[data-layoutpilot-action]')?.dataset?.layoutpilotAction
    if (!action) return

    if (action === 'close-detail') closeDetailPanel()
    if (action === 'close-help') removeElement('helpPanel')
    if (action === 'copy-ai') copyAiContext()
    if (action === 'copy-ai-full') copyFullAiContext()
    if (action === 'copy-selector') copySelector()
    if (action === 'copy-css') copyCssSummary()
  }

  function handleKeyDown(event) {
    if (isTypingTarget(event.target)) return

    const key = event.key
    const normalized = key.length === 1 ? key.toLowerCase() : key

    if (normalized === 'h') {
      event.preventDefault()
      event.stopPropagation()
      toggleHelpPanel()
      return
    }

    if (normalized === 'q') {
      event.preventDefault()
      event.stopPropagation()
      quitLayoutPilot()
      return
    }

    if (normalized === 'i') {
      event.preventDefault()
      event.stopPropagation()
      setMode(MODE.INSPECT)
      setEnabled(!state.enabled)
      return
    }

    if (normalized === 'Escape' && state.helpPanel) {
      event.preventDefault()
      event.stopPropagation()
      removeElement('helpPanel')
      return
    }

    if (!state.enabled) return

    if (normalized === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      if (state.detailPanel) {
        closeDetailPanel()
        return
      }
      if (state.helpPanel) {
        removeElement('helpPanel')
        return
      }
      if (state.selectedElement) {
        togglePin(state.selectedElement)
        return
      }
      setEnabled(false)
      return
    }

    if (normalized === 'c') {
      event.preventDefault()
      event.stopPropagation()
      copyAiContext()
      return
    }

    if (normalized === 'd') {
      event.preventDefault()
      event.stopPropagation()
      toggleDetailPanel()
      return
    }

    if (normalized === 'p') {
      event.preventDefault()
      event.stopPropagation()
      togglePin()
    }
  }

  function handleViewportChange(event) {
    if (!state.enabled) return
    if (event?.target instanceof Element && isOwnElement(event.target)) return
    if (state.selectedElement) renderSelectedOverlay()
    if (state.detailPanel && getActiveElement()) openDetailPanel(getActiveElement())
    if (state.detailPanelPosition) applyDetailPanelPosition()
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

  function handleLifecycleCleanup() {
    destroy()
  }

  function bindInspectListeners() {
    document.addEventListener('mousemove', inspectAtEvent, true)
    document.addEventListener('click', handleClick, true)
    document.addEventListener('dblclick', handleDoubleClick, true)
    window.addEventListener('scroll', handleViewportChange, true)
    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('blur', handleWindowBlur)
    window.addEventListener('focus', handleWindowFocus)
    document.addEventListener('visibilitychange', handlePageVisibilityChange)
  }

  function unbindInspectListeners() {
    document.removeEventListener('mousemove', inspectAtEvent, true)
    document.removeEventListener('click', handleClick, true)
    document.removeEventListener('dblclick', handleDoubleClick, true)
    window.removeEventListener('scroll', handleViewportChange, true)
    window.removeEventListener('resize', handleViewportChange)
    window.removeEventListener('blur', handleWindowBlur)
    window.removeEventListener('focus', handleWindowFocus)
    document.removeEventListener('visibilitychange', handlePageVisibilityChange)
  }

  function startHealthCheck() {
    if (state.healthCheckTimer) return

    state.healthCheckTimer = window.setInterval(() => {
      try {
        if (!chrome?.runtime?.id) destroy()
      } catch {
        destroy()
      }
    }, 3000)
  }

  function stopHealthCheck() {
    if (!state.healthCheckTimer) return
    window.clearInterval(state.healthCheckTimer)
    state.healthCheckTimer = null
  }

  function setMode(mode) {
    state.mode = mode === MODE.REVIEW ? MODE.REVIEW : MODE.INSPECT
  }

  function setEnabled(enabled) {
    if (state.enabled === enabled) return
    state.enabled = enabled

    if (enabled) {
      ensureUi()
      bindInspectListeners()
      showToast(state.mode === MODE.INSPECT ? 'Inspect mode on' : 'Review mode coming soon')
      return
    }

    unbindInspectListeners()
    stopDetailPanelDrag()
    state.hoveredElement = null
    state.selectedElement = null
    state.lastPointerEvent = null
    hideUi()
  }

  function destroy() {
    stopHealthCheck()
    stopDetailPanelDrag()
    unbindInspectListeners()
    document.removeEventListener('keydown', handleKeyDown, true)
    document.removeEventListener('click', handleUiClick, true)
    window.removeEventListener('pagehide', handleLifecycleCleanup)
    window.removeEventListener('beforeunload', handleLifecycleCleanup)
    state.enabled = false
    state.hoveredElement = null
    state.selectedElement = null
    state.lastPointerEvent = null
    window.clearTimeout(showToast.timeout)
    hideUi()

    if (window[INSTANCE_KEY]?.state === state) {
      try {
        delete window[INSTANCE_KEY]
      } catch {
        window[INSTANCE_KEY] = null
      }
    }
  }

  document.addEventListener('keydown', handleKeyDown, true)
  document.addEventListener('click', handleUiClick, true)
  window.addEventListener('pagehide', handleLifecycleCleanup)
  window.addEventListener('beforeunload', handleLifecycleCleanup)
  startHealthCheck()

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === 'layoutpilot:ping') {
      sendResponse({ ok: true })
      return true
    }

    if (message?.type === 'layoutpilot:get-state') {
      sendResponse({ enabled: state.enabled, mode: state.mode })
      return true
    }

    if (message?.type === 'layoutpilot:toggle') {
      setMode(message.mode || MODE.INSPECT)
      setEnabled(!state.enabled)
      sendResponse({ enabled: state.enabled, mode: state.mode })
      return true
    }

    if (message?.type === 'layoutpilot:set-enabled') {
      setMode(message.mode || MODE.INSPECT)
      setEnabled(!!message.enabled)
      sendResponse({ enabled: state.enabled, mode: state.mode })
      return true
    }

    return false
  })

  window[INSTANCE_KEY] = { setEnabled, setMode, destroy, state }
})()
