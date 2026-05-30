(() => {
  const root = window.LayoutPilotModules ||= {}
  const { escapeHtml } = root.dom
  const { icon } = root.icons
  const { renderAttrs, renderButton, renderIconButton, renderSwitch } = root.ui
  const {
    ANNOTATION_COLORS,
    COLOR_MODE,
    FREE_MARK_COLOR,
    RECENT_CUSTOM_COLOR_LIMIT,
    colorFromReference,
    getAnnotationColor,
    getAnnotationColorStyle,
    normalizeColorReference
  } = root.reviewColors

  function getColorReferenceAttrs(reference) {
    const color = normalizeColorReference(reference)
    return color.type === 'custom'
      ? {
          'layoutpilot-review-color-type': 'custom',
          'layoutpilot-review-color-value': color.value
        }
      : {
          'layoutpilot-review-color-type': 'palette',
          'layoutpilot-review-color-index': color.index
        }
  }

  function getDefaultColor(state) {
    return colorFromReference(state.reviewDefaultColor)
  }

  function getDefaultColorValue(state) {
    return getDefaultColor(state).color
  }

  function renderSwatchButton({
    color,
    label,
    action,
    selected = false,
    disabled = false,
    data = {},
    className = '',
    empty = false
  }) {
    const disabledAttr = disabled || empty ? 'disabled' : ''
    return `
      <button
        type="button"
        class="layoutpilot-review-color-swatch${selected ? ' layoutpilot-review-color-swatch--selected' : ''}${empty ? ' layoutpilot-review-color-swatch--empty' : ''}${className ? ` ${className}` : ''}"
        data-layoutpilot-action="${escapeHtml(action)}"
        ${renderAttrs(Object.fromEntries(Object.entries(data).map(([key, value]) => [`data-${key}`, value])))}
        style="--layoutpilot-swatch-color: ${escapeHtml(color.color)}; --layoutpilot-swatch-text-color: ${escapeHtml(color.text)};"
        aria-label="${escapeHtml(empty ? label : `${label} ${color.color}`)}"
        ${disabledAttr}
        ${empty ? '' : renderAttrs({ 'data-layoutpilot-tooltip': color.color })}
      ><span></span></button>
    `
  }

  function isSameColorReference(referenceA, referenceB) {
    const colorA = normalizeColorReference(referenceA)
    const colorB = normalizeColorReference(referenceB)
    return colorA.type === colorB.type &&
      (colorA.type === 'custom' ? colorA.value === colorB.value : colorA.index === colorB.index)
  }

  function renderPaletteSwatches({
    action,
    selectedReference,
    label,
    extraData = {},
    disabled = false
  }) {
    const selected = normalizeColorReference(selectedReference)
    return ANNOTATION_COLORS.map((color, index) => renderSwatchButton({
      color,
      label,
      action,
      selected: selected.type === 'palette' && selected.index === index,
      disabled,
      data: {
        ...extraData,
        'layoutpilot-review-color-type': 'palette',
        'layoutpilot-review-color-index': index
      }
    })).join('')
  }

  function renderSettingsSwatches({ selectedReference, label, disabled }) {
    return [
      renderPaletteSwatches({
        action: 'review-set-default-color',
        selectedReference,
        label,
        disabled
      }),
      renderSwatchButton({
        color: FREE_MARK_COLOR,
        label,
        action: 'review-set-default-color',
        selected: isSameColorReference(selectedReference, { type: 'custom', value: FREE_MARK_COLOR.color }),
        disabled,
        data: {
          'layoutpilot-review-color-type': 'custom',
          'layoutpilot-review-color-value': FREE_MARK_COLOR.color
        }
      })
    ].join('')
  }

  function renderManualPaletteSwatches({
    action,
    selectedReference,
    label,
    extraData = {},
    disabled = false
  }) {
    const selected = normalizeColorReference(selectedReference)
    return [
      renderPaletteSwatches({
        action,
        selectedReference,
        label,
        extraData,
        disabled
      }),
      renderSwatchButton({
        color: FREE_MARK_COLOR,
        label,
        action,
        selected: selected.type === 'custom' && selected.value === FREE_MARK_COLOR.color,
        disabled,
        data: {
          ...extraData,
          'layoutpilot-review-color-type': 'custom',
          'layoutpilot-review-color-value': FREE_MARK_COLOR.color
        }
      })
    ].join('')
  }

  function renderRecentCustomSwatches({
    colors = [],
    action,
    label,
    selectedReference,
    extraData = {},
    disabled = false
  }) {
    const selected = normalizeColorReference(selectedReference)
    const normalizedColors = colors.slice(0, RECENT_CUSTOM_COLOR_LIMIT)
    const slots = Array.from({ length: RECENT_CUSTOM_COLOR_LIMIT }, (_, index) => normalizedColors[index] || null)

    return slots.map(colorValue => {
      if (!colorValue) {
        return renderSwatchButton({
          color: { color: '#0F172A', text: '#94A3B8' },
          label,
          action,
          empty: true
        })
      }

      const color = colorFromReference({ type: 'custom', value: colorValue })
      return renderSwatchButton({
        color,
        label,
        action,
        selected: selected.type === 'custom' && selected.value === colorValue,
        disabled,
        data: {
          ...extraData,
          'layoutpilot-review-color-type': 'custom',
          'layoutpilot-review-color-value': colorValue
        }
      })
    }).join('')
  }

  function renderColorSection(title, content) {
    return `
      <div class="layoutpilot-review-color-section">
        <small>${escapeHtml(title)}</small>
        <div class="layoutpilot-review-color-swatches">
          ${content}
        </div>
      </div>
    `
  }

  function renderAnnotationColorButton(annotation, t) {
    const color = getAnnotationColor(annotation)
    return renderIconButton({
      iconHtml: '<span class="layoutpilot-review-card-color-dot" aria-hidden="true"></span>',
      label: t('review.colors.swatch'),
      action: 'review-toggle-annotation-color-menu',
      className: 'layoutpilot-review-card-icon layoutpilot-review-card-color',
      data: { 'layoutpilot-review-id': annotation.id },
      attrs: {
        style: getAnnotationColorStyle(annotation)
      }
    })
  }

  function renderColorSettingsPopover(state, t) {
    const draft = state.reviewColorDraft || {
      mode: state.reviewColorMode,
      color: state.reviewDefaultColor
    }
    const automaticActive = draft.mode === COLOR_MODE.AUTO
    const draftColor = colorFromReference(draft.color)

    return `
      <div class="layoutpilot-review-popover-inner">
        <div class="layoutpilot-review-popover-title">${escapeHtml(t('review.colors.title'))}</div>
        ${renderSwitch({
          label: t('review.colors.automaticToggle'),
          checked: automaticActive,
          action: 'review-toggle-automatic-colors',
          className: 'layoutpilot-review-color-switch'
        })}
        <fieldset class="layoutpilot-review-color-fields${automaticActive ? ' layoutpilot-review-color-fields--disabled' : ''}" ${automaticActive ? 'disabled' : ''}>
          ${renderColorSection(t('review.colors.palette'), renderSettingsSwatches({
            selectedReference: draft.color,
            label: t('review.colors.defaultColor'),
            disabled: automaticActive
          }))}
          ${renderColorSection(t('review.colors.recent'), renderRecentCustomSwatches({
            colors: state.reviewRecentColors,
            action: 'review-set-default-color',
            selectedReference: draft.color,
            label: t('review.colors.recentColor'),
            disabled: automaticActive
          }))}
          <div class="layoutpilot-review-color-custom">
            <span>${escapeHtml(t('review.colors.custom'))}</span>
            <div class="layoutpilot-review-color-custom-controls">
              <input
                type="color"
                value="${escapeHtml(draftColor.color)}"
                data-layoutpilot-review-color-input="default"
                aria-label="${escapeHtml(t('review.colors.custom'))}"
                ${automaticActive ? 'disabled' : ''}
              />
              <button
                type="button"
                class="layoutpilot-review-color-hex"
                data-layoutpilot-action="review-open-color-picker"
                data-layoutpilot-review-color-input="default"
                aria-label="${escapeHtml(t('review.colors.hex'))}"
                ${automaticActive ? 'disabled' : ''}
              >${escapeHtml(draftColor.color)}</button>
            </div>
          </div>
        </fieldset>
        ${renderButton({
          label: t('review.colors.confirm'),
          action: 'review-request-color-settings-confirm',
          className: 'layoutpilot-review-popover-action'
        })}
      </div>
    `
  }

  function renderAnnotationColorMenu(state, t) {
    const annotationId = Number(state.activePopover?.annotationId)
    const annotation = state.annotations.find(item => item.id === annotationId)
    if (!annotation) return ''

    const annotationColor = getAnnotationColor(annotation).color
    const extraData = { 'layoutpilot-review-id': annotation.id }

    return `
      <div class="layoutpilot-review-menu-inner">
        ${renderColorSection(t('review.colors.palette'), renderManualPaletteSwatches({
          action: 'review-set-annotation-color',
          selectedReference: annotation.color || { type: 'palette', index: annotation.colorIndex },
          label: t('review.colors.swatch'),
          extraData
        }))}
        ${renderColorSection(t('review.colors.recent'), renderRecentCustomSwatches({
          colors: state.reviewRecentColors,
          action: 'review-set-annotation-color',
          selectedReference: annotation.color || { type: 'palette', index: annotation.colorIndex },
          label: t('review.colors.recentColor'),
          extraData
        }))}
        <div class="layoutpilot-review-color-custom layoutpilot-review-color-custom--compact">
          <span>${escapeHtml(t('review.colors.custom'))}</span>
          <div class="layoutpilot-review-color-custom-controls">
            <input
              type="color"
              value="${escapeHtml(annotationColor)}"
              data-layoutpilot-review-color-input="annotation"
              data-layoutpilot-review-id="${escapeHtml(annotation.id)}"
              aria-label="${escapeHtml(t('review.colors.custom'))}"
            />
            <button
              type="button"
              class="layoutpilot-review-color-hex"
              data-layoutpilot-action="review-open-color-picker"
              data-layoutpilot-review-color-input="annotation"
              data-layoutpilot-review-id="${escapeHtml(annotation.id)}"
              aria-label="${escapeHtml(t('review.colors.hex'))}"
            >${escapeHtml(annotationColor)}</button>
          </div>
        </div>
      </div>
    `
  }

  function renderExportMenu(t) {
    return `
      <div class="layoutpilot-review-menu-inner">
        ${renderButton({
          label: t('review.toolbar.copyImage'),
          labelHtml: `${icon('copy', 14)}<span>${escapeHtml(t('review.toolbar.copyImage'))}</span>`,
          action: 'review-copy-image',
          className: 'layoutpilot-review-menu-item'
        })}
        ${renderButton({
          label: t('review.toolbar.downloadImage'),
          labelHtml: `${icon('download', 14)}<span>${escapeHtml(t('review.toolbar.downloadImage'))}</span>`,
          action: 'review-download-snapshot',
          className: 'layoutpilot-review-menu-item'
        })}
        ${renderButton({
          label: t('review.toolbar.generatePdf'),
          labelHtml: `${icon('pdf', 14)}<span>${escapeHtml(t('review.toolbar.generatePdf'))}</span>`,
          action: 'review-generate-pdf',
          className: 'layoutpilot-review-menu-item'
        })}
      </div>
    `
  }

  root.reviewColorControls = {
    getColorReferenceAttrs,
    renderAnnotationColorButton,
    renderAnnotationColorMenu,
    renderColorSettingsPopover,
    renderExportMenu
  }
})()
