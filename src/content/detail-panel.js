(() => {
  const root = window.LayoutPilotModules ||= {}
  const { escapeHtml } = root.dom
  const { formatLineHeightText } = root.elementInspector
  const {
    renderButton,
    renderCloseButton,
    renderPanelRow,
    renderPanelSection
  } = root.ui

  function renderDetailRow(label, value, options = {}) {
    return renderPanelRow(label, '', {
      strong: options.strong,
      valueHtml: value
    })
  }

  function renderDetailSection(title, rows) {
    return renderPanelSection(title, rows)
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

  function renderDetailPanelContent(info, options) {
    const { createCompactContext, formatColorMarkup } = options

    return `
      <div class="layoutpilot-detail-header">
        <div>
          <span class="layoutpilot-detail-kicker">Modo Inspecao</span>
          <h2>${escapeHtml(info.name)}</h2>
        </div>
        ${renderCloseButton({ action: 'close-detail', label: 'Close details' })}
      </div>
      <div class="layoutpilot-detail-actions">
        ${renderButton({ label: 'Contexto simples', action: 'copy-ai' })}
        ${renderButton({ label: 'Contexto completo', action: 'copy-ai-full' })}
        ${renderButton({ label: 'Selector', action: 'copy-selector' })}
        ${renderButton({ label: 'CSS/layout', action: 'copy-css' })}
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
          `<pre>${escapeHtml(createCompactContext(info))}</pre>`
        ])}
      </div>
    `
  }

  root.detailPanel = {
    renderDetailPanelContent
  }
})()
