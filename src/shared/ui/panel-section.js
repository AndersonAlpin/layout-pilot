(() => {
  const root = window.LayoutPilotModules ||= {}
  const ui = root.ui ||= {}
  const { joinClasses, renderAttrs, renderText } = ui

  function renderPanelRow(label, value, options = {}) {
    const className = joinClasses(
      'layoutpilot-detail-value',
      options.strong ? 'layoutpilot-detail-strong' : '',
      options.valueClassName
    )
    const rowAttrs = renderAttrs({
      ...options.attrs,
      class: joinClasses('layoutpilot-detail-row', options.className, options.attrs?.class)
    })
    const labelAttrs = renderAttrs({
      class: joinClasses('layoutpilot-detail-label', options.labelClassName)
    })
    const valueAttrs = renderAttrs({
      class: className
    })
    const valueContent = options.valueHtml != null ? options.valueHtml : renderText(value)

    return `
      <div ${rowAttrs}>
        <span ${labelAttrs}>${renderText(label)}</span>
        <span ${valueAttrs}>${valueContent}</span>
      </div>
    `
  }

  function renderPanelSection(title, rows, options = {}) {
    const sectionAttrs = renderAttrs({
      ...options.attrs,
      class: joinClasses('layoutpilot-detail-section', options.className, options.attrs?.class)
    })

    return `
      <section ${sectionAttrs}>
        <h3>${renderText(title)}</h3>
        ${rows.join('')}
      </section>
    `
  }

  Object.assign(ui, {
    renderPanelRow,
    renderPanelSection
  })
})()
