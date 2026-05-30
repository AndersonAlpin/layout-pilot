(() => {
  const root = window.LayoutPilotModules ||= {}
  const ui = root.ui ||= {}
  const { getTooltipAttrs, joinClasses, renderAttrs, renderDataAttrs, renderText } = ui

  function renderButton({
    label,
    labelHtml,
    className,
    attrs,
    data,
    action,
    disabled,
    title,
    ariaLabel,
    type = 'button'
  } = {}) {
    const dataAttrs = {
      ...(data || {})
    }
    if (action) dataAttrs['layoutpilot-action'] = action

    const resolvedAttrs = {
      ...(attrs || {}),
      type
    }
    const classes = joinClasses(className, attrs?.class)
    if (classes) resolvedAttrs.class = classes
    if (disabled) resolvedAttrs.disabled = true
    if (title != null) Object.assign(resolvedAttrs, getTooltipAttrs(title))
    if (ariaLabel != null) resolvedAttrs['aria-label'] = ariaLabel

    const attributes = joinClasses(renderAttrs(resolvedAttrs), renderDataAttrs(dataAttrs))
    return `<button ${attributes}>${labelHtml ?? renderText(label)}</button>`
  }

  function renderCloseButton({
    action,
    label,
    className = 'layoutpilot-icon-button',
    text = 'x',
    title = label,
    attrs,
    data
  } = {}) {
    return renderButton({
      label: text,
      className,
      attrs,
      data,
      action,
      ariaLabel: label,
      title
    })
  }

  function renderIconButton({
    iconHtml,
    label,
    className,
    attrs,
    data,
    action,
    disabled,
    title = label,
    type = 'button'
  } = {}) {
    return renderButton({
      labelHtml: iconHtml,
      className,
      attrs,
      data,
      action,
      disabled,
      title,
      ariaLabel: label,
      type
    })
  }

  Object.assign(ui, {
    renderButton,
    renderCloseButton,
    renderIconButton
  })
})()
