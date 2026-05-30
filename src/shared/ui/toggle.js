(() => {
  const root = window.LayoutPilotModules ||= {}
  const ui = root.ui ||= {}
  const { joinClasses, renderAttrs, renderDataAttrs, renderText } = ui

  function renderSwitch({
    label,
    checked,
    className,
    attrs,
    data,
    action,
    disabled,
    ariaLabel,
    type = 'button'
  } = {}) {
    const dataAttrs = {
      ...(data || {})
    }
    if (action) dataAttrs['layoutpilot-action'] = action

    const resolvedAttrs = {
      ...(attrs || {}),
      type,
      class: joinClasses(
        'layoutpilot-switch',
        checked && 'layoutpilot-switch--checked',
        disabled && 'layoutpilot-switch--disabled',
        className,
        attrs?.class
      ),
      'aria-pressed': checked ? 'true' : 'false'
    }
    if (disabled) resolvedAttrs.disabled = true
    if (ariaLabel != null) resolvedAttrs['aria-label'] = ariaLabel

    const attributes = joinClasses(renderAttrs(resolvedAttrs), renderDataAttrs(dataAttrs))
    return `
      <button ${attributes}>
        ${label != null ? `<span class="layoutpilot-switch-label">${renderText(label)}</span>` : ''}
        <span class="layoutpilot-switch-track" aria-hidden="true"><span></span></span>
      </button>
    `
  }

  Object.assign(ui, {
    renderSwitch
  })
})()
