(() => {
  const root = window.LayoutPilotModules ||= {}
  const { isCssValueUseful, isZeroBoxValue } = root.dom

  function cssCommentEscape(value) {
    return String(value).replace(/\*\//g, '* /')
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

  root.cssExport = {
    createCssSummary
  }
})()
