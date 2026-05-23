(() => {
  const root = window.LayoutPilotModules ||= {}
  const { isCssValueUseful, isZeroBoxValue } = root.dom
  const { formatLineHeightText, formatChildrenSummary } = root.elementInspector

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

  root.contextExport = {
    createCompactAiContext,
    createAiContext
  }
})()
