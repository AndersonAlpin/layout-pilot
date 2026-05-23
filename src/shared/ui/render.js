(() => {
  const root = window.LayoutPilotModules ||= {}
  const ui = root.ui ||= {}
  const { escapeHtml } = root.dom

  function joinClasses(...parts) {
    return parts
      .flatMap(part => Array.isArray(part) ? part : [part])
      .filter(Boolean)
      .map(part => String(part).trim())
      .filter(Boolean)
      .join(' ')
  }

  function renderAttrs(attrs = {}) {
    return Object.entries(attrs || {})
      .filter(([, value]) => value !== null && value !== undefined && value !== false)
      .map(([name, value]) => value === true ? escapeHtml(name) : `${escapeHtml(name)}="${escapeHtml(value)}"`)
      .join(' ')
  }

  function renderDataAttrs(data = {}) {
    const attrs = {}
    for (const [name, value] of Object.entries(data || {})) {
      if (value === null || value === undefined || value === false) continue
      attrs[`data-${name}`] = value
    }
    return renderAttrs(attrs)
  }

  function renderText(value) {
    return escapeHtml(value ?? '')
  }

  Object.assign(ui, {
    joinClasses,
    renderAttrs,
    renderDataAttrs,
    renderText
  })
})()
