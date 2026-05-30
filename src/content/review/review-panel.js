(() => {
  const root = window.LayoutPilotModules ||= {}
  const { escapeHtml } = root.dom
  const { icon } = root.icons
  const { renderAttrs, renderButton, renderIconButton } = root.ui
  const { ensureAnnotationColors, getAnnotationColorStyle } = root.reviewMarkers
  const { renderAnnotationColorButton } = root.reviewColorControls

  function renderCardNumber(annotation, t) {
    return renderButton({
      label: annotation.id,
      action: 'review-focus',
      className: 'layoutpilot-review-card-number',
      data: {
        'layoutpilot-review-id': annotation.id,
        'layoutpilot-review-toggle-highlight': true
      },
      title: null,
      ariaLabel: t('review.panel.focusAnnotation')
    })
  }

  function renderAnnotationCard(annotation, state, t) {
    const isSelected = annotation.id === state.selectedAnnotationId
    const isEditing = annotation.id === state.editingAnnotationId
    const selectedClass = isSelected ? ' layoutpilot-review-card--selected' : ''
    const editingClass = isEditing ? ' layoutpilot-review-card--editing' : ''
    const colorStyle = getAnnotationColorStyle(annotation)

    if (isEditing) {
      return `
        <section class="layoutpilot-review-card${selectedClass}${editingClass}" style="${colorStyle}">
          <div class="layoutpilot-review-card-header">
            ${renderCardNumber(annotation, t)}
          </div>
          <label for="layoutpilot-review-note-${annotation.id}">${escapeHtml(t('review.panel.observation'))}</label>
          <textarea
            id="layoutpilot-review-note-${annotation.id}"
            data-layoutpilot-review-note="${annotation.id}"
            data-layoutpilot-review-edit="true"
            data-layoutpilot-review-autofocus="true"
            rows="4"
            placeholder="${escapeHtml(t('review.panel.notePlaceholder'))}"
          >${escapeHtml(state.editingNote)}</textarea>
          <div class="layoutpilot-review-card-actions">
            ${renderButton({ label: t('review.panel.cancel'), action: 'review-cancel-edit', className: 'layoutpilot-review-neutral' })}
            ${renderButton({
              label: t('review.panel.remove'),
              action: 'review-remove',
              className: 'layoutpilot-review-danger',
              data: { 'layoutpilot-review-id': annotation.id }
            })}
            ${renderButton({ label: t('review.panel.save'), action: 'review-save-edit', className: 'layoutpilot-review-primary' })}
          </div>
        </section>
      `
    }

    return `
      <section
        class="layoutpilot-review-card${selectedClass}"
        data-layoutpilot-action="review-edit"
        data-layoutpilot-review-id="${annotation.id}"
        role="button"
        tabindex="0"
        style="${colorStyle}"
      >
        <div class="layoutpilot-review-card-header">
          ${renderCardNumber(annotation, t)}
          <span class="layoutpilot-review-card-note">${escapeHtml(annotation.note?.trim() || t('review.panel.noNote'))}</span>
          <div class="layoutpilot-review-card-tools">
            ${renderAnnotationColorButton(annotation, t)}
            ${renderIconButton({
              iconHtml: icon('edit', 14),
              label: t('review.panel.edit'),
              action: 'review-edit',
              className: 'layoutpilot-review-card-icon',
              title: null,
              data: { 'layoutpilot-review-id': annotation.id }
            })}
            ${renderIconButton({
              iconHtml: icon('trash', 14),
              label: t('review.panel.remove'),
              action: 'review-remove',
              className: 'layoutpilot-review-card-icon layoutpilot-review-card-icon--danger',
              title: null,
              data: { 'layoutpilot-review-id': annotation.id }
            })}
          </div>
        </div>
      </section>
    `
  }

  function renderAnnotationList(state, t) {
    const hasFreeMarks = Boolean(state.areaMarks?.length || state.penStrokes?.length)
    if (!state.annotations.length && !state.draftAnnotation && !hasFreeMarks) {
      return `
        <div class="layoutpilot-review-empty">
          <strong>${escapeHtml(t('review.panel.emptyTitle'))}</strong>
          <span>${escapeHtml(t('review.panel.emptyDescription'))}</span>
        </div>
      `
    }

    return `
      <div class="layoutpilot-review-list">
        ${state.annotations.map(annotation => renderAnnotationCard(annotation, state, t)).join('')}
      </div>
    `
  }

  function getFreeMarkCount(state) {
    return (state.areaMarks?.length || 0) + (state.penStrokes?.length || 0)
  }

  function renderFreeMarkCard(item, state, t) {
    const { mark, type, index } = item
    const isArea = type === 'area'
    const isSelected = state.selectedFreeMark?.type === type && state.selectedFreeMark?.id === mark.id
    const selectedClass = isSelected ? ' layoutpilot-review-free-mark-card--selected' : ''
    const focusAction = isArea ? 'review-focus-area-mark' : 'review-focus-pen-stroke'
    const removeAction = isArea ? 'review-remove-area-mark' : 'review-remove-pen-stroke'
    const idName = isArea ? 'layoutpilot-review-area-mark-id' : 'layoutpilot-review-pen-stroke-id'
    const typeLabel = isArea ? t('review.panel.freeMarkArea') : t('review.panel.freeMarkPen')
    const typeIcon = isArea ? icon('area', 14) : icon('pen', 14)
    const focusLabel = t('review.panel.focusFreeMark')

    return `
      <section class="layoutpilot-review-free-mark-card${selectedClass}">
        <button
          type="button"
          class="layoutpilot-review-free-mark-main"
          data-layoutpilot-action="${focusAction}"
          data-${idName}="${escapeHtml(mark.id)}"
          aria-label="${escapeHtml(focusLabel)}"
        >
          <span class="layoutpilot-review-free-mark-type">${typeIcon}${escapeHtml(typeLabel)}</span>
          <small>${escapeHtml(t('review.panel.freeMarkIndex', { index }))}</small>
        </button>
        <div class="layoutpilot-review-card-tools">
          ${isArea ? renderIconButton({
            iconHtml: icon('edit', 14),
            label: t('review.panel.addAnnotation'),
            action: 'review-comment-area-mark',
            className: 'layoutpilot-review-card-icon',
            title: null,
            data: { 'layoutpilot-review-area-mark-id': mark.id }
          }) : ''}
          ${renderIconButton({
            iconHtml: icon('trash', 14),
            label: t('review.panel.removeFreeMark'),
            action: removeAction,
            className: 'layoutpilot-review-card-icon layoutpilot-review-card-icon--danger',
            title: null,
            data: { [idName]: mark.id }
          })}
        </div>
      </section>
    `
  }

  function renderFreeMarksList(state, t) {
    const count = getFreeMarkCount(state)
    if (!count) return ''
    const freeMarkItems = [
      ...(state.areaMarks || []).map(mark => ({ type: 'area', mark })),
      ...(state.penStrokes || []).map(mark => ({ type: 'pen', mark }))
    ].map((item, index) => ({ ...item, index: index + 1 }))

    return `
      <section class="layoutpilot-review-free-marks">
        <div class="layoutpilot-review-section-heading">
          <strong>${escapeHtml(t('review.panel.freeMarksTitle'))}</strong>
          <small>${escapeHtml(t('review.panel.freeMarksCount', { count }))}</small>
        </div>
        <div class="layoutpilot-review-list">
          ${freeMarkItems.map(item => renderFreeMarkCard(item, state, t)).join('')}
        </div>
      </section>
    `
  }

  function renderDraftAnnotation(state, t) {
    const draft = state.draftAnnotation
    if (!draft) return ''

    return `
      <section class="layoutpilot-review-card layoutpilot-review-draft layoutpilot-review-card--editing">
        <small>${escapeHtml(t('review.panel.draft'))}</small>
        <label for="layoutpilot-review-draft-note">${escapeHtml(t('review.panel.observation'))}</label>
        <textarea
          id="layoutpilot-review-draft-note"
          data-layoutpilot-review-note="draft"
          data-layoutpilot-review-draft="true"
          data-layoutpilot-review-autofocus="true"
          rows="4"
          placeholder="${escapeHtml(t('review.panel.draftPlaceholder'))}"
        >${escapeHtml(draft.note)}</textarea>
        <div class="layoutpilot-review-card-actions">
          ${renderButton({ label: t('review.panel.cancel'), action: 'review-cancel-draft', className: 'layoutpilot-review-neutral' })}
          ${renderButton({ label: t('review.panel.saveAnnotation'), action: 'review-save-draft', className: 'layoutpilot-review-primary' })}
        </div>
      </section>
    `
  }

  function renderReviewPanel(state, options = {}) {
    const { t = key => key } = options
    ensureAnnotationColors(state.annotations)

    const count = state.annotations.length
    const hasReviewContent = Boolean(
      state.annotations.length ||
      state.areaMarks?.length ||
      state.penStrokes?.length
    )
    const collapseLabel = state.panelCollapsed ? t('review.panel.expand') : t('review.panel.collapse')
    const collapseIcon = state.panelCollapsed ? '+' : '&minus;'
    const clearReviewLabel = hasReviewContent
      ? t('review.panel.clearReview')
      : t('review.panel.clearReviewEmpty')

    return `
      <div class="layoutpilot-review-header">
        <div>
          <span class="layoutpilot-review-kicker">${escapeHtml(t('review.panel.kicker'))}</span>
          <small>${escapeHtml(t('review.panel.count', { count }))}</small>
        </div>
        <div class="layoutpilot-review-header-actions">
          ${renderIconButton({
            iconHtml: collapseIcon,
            label: collapseLabel,
            action: 'review-toggle-collapse',
            className: 'layoutpilot-review-header-button'
          })}
          ${renderIconButton({
            iconHtml: icon('palette', 14),
            label: t('review.colors.settings'),
            action: 'review-toggle-colors-popover',
            className: 'layoutpilot-review-header-button'
          })}
          ${renderIconButton({
            iconHtml: icon('trash', 14),
            action: 'review-request-clear',
            label: clearReviewLabel,
            title: clearReviewLabel,
            className: 'layoutpilot-review-header-button layoutpilot-review-header-button--danger',
            disabled: !hasReviewContent
          })}
        </div>
      </div>
      ${state.panelCollapsed ? '' : `
        <div class="layoutpilot-review-body">
          ${renderDraftAnnotation(state, t)}
          ${renderAnnotationList(state, t)}
          ${renderFreeMarksList(state, t)}
        </div>
      `}
    `
  }

  function renderConfirmDialog(t, options = {}) {
    const {
      title = t('review.clearConfirm.title'),
      description = t('review.clearConfirm.description'),
      cancelLabel = t('review.clearConfirm.cancel'),
      confirmLabel = t('review.clearConfirm.confirm'),
      confirmAction = 'review-confirm-clear',
      cancelAction = 'review-cancel-clear'
    } = options

    return `
      <div class="layoutpilot-review-confirm-backdrop">
        <div class="layoutpilot-review-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="layoutpilot-review-confirm-title">
          <div class="layoutpilot-review-confirm-body">
            <h3 id="layoutpilot-review-confirm-title">${escapeHtml(title)}</h3>
            <p>${escapeHtml(description)}</p>
          </div>
          <div class="layoutpilot-review-confirm-actions">
            ${renderButton({ label: cancelLabel, action: cancelAction })}
            ${renderButton({ label: confirmLabel, action: confirmAction, className: 'layoutpilot-review-danger' })}
          </div>
        </div>
      </div>
    `
  }

  function renderClearReviewDialog(t) {
    return renderConfirmDialog(t)
  }

  root.reviewPanel = {
    renderReviewPanel,
    renderClearReviewDialog,
    renderConfirmDialog
  }
})()
