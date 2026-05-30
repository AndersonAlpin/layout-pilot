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

  const TECHNICAL_LABEL = {
    sections: {
      element: 'Element',
      selectorCandidates: 'Selector candidates',
      box: 'Box',
      parent: 'Parent',
      layout: 'Layout',
      children: 'Children',
      spacing: 'Spacing',
      typography: 'Typography',
      colors: 'Colors',
      borderEffects: 'Border / Effects'
    },
    rows: {
      tag: 'Tag',
      id: 'ID',
      role: 'Role',
      ariaLabel: 'Aria label',
      classes: 'Classes',
      text: 'Text',
      bestEffort: 'Best effort',
      withParent: 'With parent',
      fullPath: 'Full path',
      size: 'Size',
      viewportPos: 'Viewport pos',
      pagePos: 'Page pos',
      parentPos: 'Parent pos',
      boxSizing: 'Box sizing',
      element: 'Element',
      selector: 'Selector',
      display: 'Display',
      padding: 'Padding',
      gap: 'Gap',
      alignJustify: 'Align/justify',
      positionCss: 'Position CSS',
      flexDirection: 'Flex direction',
      alignItems: 'Align items',
      justify: 'Justify',
      gridCols: 'Grid cols',
      gridRows: 'Grid rows',
      zIndex: 'Z-index',
      overflow: 'Overflow',
      directChildren: 'Direct children',
      margin: 'Margin',
      font: 'Font',
      weight: 'Weight',
      lineHeight: 'Line height',
      lineHeightRatio: 'LH ratio',
      letterSpacing: 'Letter spacing',
      textAlign: 'Text align',
      background: 'Background',
      opacity: 'Opacity',
      border: 'Border',
      radius: 'Radius',
      shadow: 'Shadow'
    },
    actions: {
      selector: 'Selector',
      cssLayout: 'CSS/layout'
    }
  }

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
    if (!children.count) return [renderDetailRow(TECHNICAL_LABEL.rows.directChildren, '0')]

    const rows = [renderDetailRow(TECHNICAL_LABEL.rows.directChildren, String(children.count))]
    for (const [index, child] of children.preview.entries()) {
      const text = child.text ? ` - ${child.text}` : ''
      rows.push(renderDetailRow(`${index + 1}`, `<code>${escapeHtml(`${child.tag} ${child.classes} | ${child.width} x ${child.height}px${text}`)}</code>`))
    }

    return rows
  }

  function renderDetailPanelContent(info, options) {
    const { createCompactContext, formatColorMarkup, t } = options

    return `
      <div class="layoutpilot-detail-header">
        <div>
          <span class="layoutpilot-detail-kicker">${escapeHtml(t('detail.kicker'))}</span>
          <h2>${escapeHtml(info.name)}</h2>
        </div>
        ${renderCloseButton({ action: 'close-detail', label: t('detail.close') })}
      </div>
      <div class="layoutpilot-detail-actions">
        ${renderButton({ label: t('detail.actions.simpleContext'), action: 'copy-ai' })}
        ${renderButton({ label: t('detail.actions.fullContext'), action: 'copy-ai-full' })}
        ${renderButton({ label: TECHNICAL_LABEL.actions.selector, action: 'copy-selector' })}
        ${renderButton({ label: TECHNICAL_LABEL.actions.cssLayout, action: 'copy-css' })}
      </div>
      <div class="layoutpilot-detail-body">
        ${renderDetailSection(TECHNICAL_LABEL.sections.element, [
          renderDetailRow(TECHNICAL_LABEL.rows.tag, escapeHtml(info.tag)),
          renderDetailRow(TECHNICAL_LABEL.rows.id, escapeHtml(info.id)),
          renderDetailRow(TECHNICAL_LABEL.rows.role, escapeHtml(info.role)),
          renderDetailRow(TECHNICAL_LABEL.rows.ariaLabel, escapeHtml(info.ariaLabel)),
          renderDetailRow(TECHNICAL_LABEL.rows.classes, `<code>${escapeHtml(info.classes)}</code>`),
          renderDetailRow(TECHNICAL_LABEL.rows.text, escapeHtml(info.text))
        ])}
        ${renderDetailSection(TECHNICAL_LABEL.sections.selectorCandidates, [
          renderDetailRow(TECHNICAL_LABEL.rows.bestEffort, `<code>${escapeHtml(info.selectorCandidates.best)}</code>`),
          renderDetailRow(TECHNICAL_LABEL.rows.withParent, `<code>${escapeHtml(info.selectorCandidates.withParent)}</code>`),
          renderDetailRow(TECHNICAL_LABEL.rows.fullPath, `<code>${escapeHtml(info.selectorCandidates.fullPath)}</code>`)
        ])}
        ${renderDetailSection(TECHNICAL_LABEL.sections.box, [
          renderDetailRow(TECHNICAL_LABEL.rows.size, `${info.width} x ${info.height}px`),
          renderDetailRow(TECHNICAL_LABEL.rows.viewportPos, `x ${info.x}, y ${info.y}`),
          renderDetailRow(TECHNICAL_LABEL.rows.pagePos, `x ${info.pageX}, y ${info.pageY}`),
          renderDetailRow(TECHNICAL_LABEL.rows.parentPos, info.parentRelativePosition ? `x ${info.parentRelativePosition.x}, y ${info.parentRelativePosition.y}` : '—'),
          renderDetailRow(TECHNICAL_LABEL.rows.boxSizing, escapeHtml(info.boxSizing))
        ])}
        ${renderDetailSection(TECHNICAL_LABEL.sections.parent, [
          renderDetailRow(TECHNICAL_LABEL.rows.element, escapeHtml(info.parent?.name || '—')),
          renderDetailRow(TECHNICAL_LABEL.rows.selector, `<code>${escapeHtml(info.parent?.selector || '—')}</code>`),
          renderDetailRow(TECHNICAL_LABEL.rows.size, info.parent ? `${info.parent.width} x ${info.parent.height}px` : '—'),
          renderDetailRow(TECHNICAL_LABEL.rows.display, escapeHtml(info.parent?.display || '—')),
          renderDetailRow(TECHNICAL_LABEL.rows.padding, escapeHtml(info.parent?.padding || '—')),
          renderDetailRow(TECHNICAL_LABEL.rows.gap, escapeHtml(info.parent?.gap || '—')),
          renderDetailRow(TECHNICAL_LABEL.rows.alignJustify, escapeHtml(info.parent ? `${info.parent.alignItems} / ${info.parent.justifyContent}` : '—'))
        ])}
        ${renderDetailSection(TECHNICAL_LABEL.sections.layout, [
          renderDetailRow(TECHNICAL_LABEL.rows.display, escapeHtml(info.display)),
          renderDetailRow(TECHNICAL_LABEL.rows.positionCss, escapeHtml(info.position)),
          renderDetailRow(TECHNICAL_LABEL.rows.flexDirection, escapeHtml(info.flexDirection)),
          renderDetailRow(TECHNICAL_LABEL.rows.alignItems, escapeHtml(info.alignItems)),
          renderDetailRow(TECHNICAL_LABEL.rows.justify, escapeHtml(info.justifyContent)),
          renderDetailRow(TECHNICAL_LABEL.rows.gap, escapeHtml(info.gap)),
          renderDetailRow(TECHNICAL_LABEL.rows.gridCols, escapeHtml(info.gridTemplateColumns)),
          renderDetailRow(TECHNICAL_LABEL.rows.gridRows, escapeHtml(info.gridTemplateRows)),
          renderDetailRow(TECHNICAL_LABEL.rows.zIndex, escapeHtml(info.zIndex)),
          renderDetailRow(TECHNICAL_LABEL.rows.overflow, escapeHtml(info.overflow))
        ])}
        ${renderDetailSection(TECHNICAL_LABEL.sections.children, renderChildrenRows(info.children))}
        ${renderDetailSection(TECHNICAL_LABEL.sections.spacing, [
          renderDetailRow(TECHNICAL_LABEL.rows.margin, escapeHtml(info.margin)),
          renderDetailRow(TECHNICAL_LABEL.rows.padding, escapeHtml(info.padding)),
          renderDetailRow(TECHNICAL_LABEL.rows.gap, escapeHtml(info.gap)),
          renderDetailRow(TECHNICAL_LABEL.rows.boxSizing, escapeHtml(info.boxSizing))
        ])}
        ${renderDetailSection(TECHNICAL_LABEL.sections.typography, [
          renderDetailRow(TECHNICAL_LABEL.rows.font, escapeHtml(info.fontFamily)),
          renderDetailRow(TECHNICAL_LABEL.rows.size, escapeHtml(info.fontSize)),
          renderDetailRow(TECHNICAL_LABEL.rows.weight, escapeHtml(info.fontWeight)),
          renderDetailRow(TECHNICAL_LABEL.rows.lineHeight, escapeHtml(formatLineHeightText(info)), { strong: true }),
          renderDetailRow(TECHNICAL_LABEL.rows.lineHeightRatio, escapeHtml(info.lineHeight.ratio || '—'), { strong: true }),
          renderDetailRow(TECHNICAL_LABEL.rows.letterSpacing, escapeHtml(info.letterSpacing)),
          renderDetailRow(TECHNICAL_LABEL.rows.textAlign, escapeHtml(info.textAlign))
        ])}
        ${renderDetailSection(TECHNICAL_LABEL.sections.colors, [
          renderDetailRow(TECHNICAL_LABEL.rows.text, formatColorMarkup(info.color)),
          renderDetailRow(TECHNICAL_LABEL.rows.background, formatColorMarkup(info.background)),
          renderDetailRow(TECHNICAL_LABEL.rows.opacity, escapeHtml(info.opacity))
        ])}
        ${renderDetailSection(TECHNICAL_LABEL.sections.borderEffects, [
          renderDetailRow(TECHNICAL_LABEL.rows.border, escapeHtml(info.border)),
          renderDetailRow(TECHNICAL_LABEL.rows.radius, escapeHtml(info.radius)),
          renderDetailRow(TECHNICAL_LABEL.rows.shadow, escapeHtml(info.shadow))
        ])}
        ${renderDetailSection(t('detail.simpleContextPreview'), [
          `<pre>${escapeHtml(createCompactContext(info))}</pre>`
        ])}
      </div>
    `
  }

  root.detailPanel = {
    renderDetailPanelContent
  }
})()
