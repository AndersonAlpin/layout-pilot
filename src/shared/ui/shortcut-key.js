(() => {
  const root = window.LayoutPilotModules ||= {}
  const ui = root.ui ||= {}
  const { joinClasses, renderAttrs, renderText } = ui

  function renderShortcutKey(key) {
    return `<kbd>${renderText(key)}</kbd>`
  }

  function renderShortcutList(shortcuts, options = {}) {
    const listAttrs = renderAttrs({
      ...options.attrs,
      class: joinClasses('layoutpilot-help-grid', options.className, options.attrs?.class)
    })
    const rows = shortcuts
      .map(shortcut => `${renderShortcutKey(shortcut.key)}<span>${renderText(shortcut.label)}</span>`)
      .join('')

    return `<div ${listAttrs}>${rows}</div>`
  }

  Object.assign(ui, {
    renderShortcutKey,
    renderShortcutList
  })
})()
