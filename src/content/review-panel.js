(() => {
  const root = window.LayoutPilotModules ||= {}
  const { escapeHtml } = root.dom
  const { renderButton, renderCloseButton, renderIconButton } = root.ui
  const { ensureAnnotationColors, getAnnotationColorStyle } = root.reviewMarkers

  function renderCardNumber(annotation, t) {
    return renderButton({
      label: annotation.id,
      action: 'review-focus',
      className: 'layoutpilot-review-card-number',
      data: {
        'layoutpilot-review-id': annotation.id,
        'layoutpilot-review-toggle-highlight': true
      },
      title: t('review.panel.highlightAnnotation'),
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
            ${renderIconButton({
              iconHtml: '&#9998;',
              label: t('review.panel.edit'),
              action: 'review-edit',
              className: 'layoutpilot-review-card-icon',
              data: { 'layoutpilot-review-id': annotation.id }
            })}
            ${renderIconButton({
              iconHtml: '&#128465;',
              label: t('review.panel.remove'),
              action: 'review-remove',
              className: 'layoutpilot-review-card-icon layoutpilot-review-card-icon--danger',
              data: { 'layoutpilot-review-id': annotation.id }
            })}
          </div>
        </div>
      </section>
    `
  }

  function renderAnnotationList(state, t) {
    if (!state.annotations.length && !state.draftAnnotation) {
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
    const collapseLabel = state.panelCollapsed ? t('review.panel.expand') : t('review.panel.collapse')
    const collapseIcon = state.panelCollapsed ? '+' : '&minus;'

    return `
      <div class="layoutpilot-review-header">
        <div>
          <span class="layoutpilot-review-kicker">${escapeHtml(t('review.panel.kicker'))}</span>
          <h2>${escapeHtml(t('review.panel.title'))}</h2>
          <small>${escapeHtml(t('review.panel.count', { count }))}</small>
        </div>
        <div class="layoutpilot-review-header-actions">
          ${renderIconButton({
            iconHtml: collapseIcon,
            label: collapseLabel,
            action: 'review-toggle-collapse',
            className: 'layoutpilot-review-header-button'
          })}
          ${renderCloseButton({
            action: 'review-request-clear',
            label: t('review.panel.clearReview'),
            title: t('review.panel.clearReview')
          })}
        </div>
      </div>
      ${state.panelCollapsed ? '' : `
        <div class="layoutpilot-review-body">
          ${renderDraftAnnotation(state, t)}
          ${renderAnnotationList(state, t)}
        </div>
      `}
    `
  }

  function renderClearReviewDialog(t) {
    return `
      <div class="layoutpilot-review-confirm-backdrop">
        <div class="layoutpilot-review-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="layoutpilot-review-clear-title">
          <div class="layoutpilot-review-confirm-body">
            <h3 id="layoutpilot-review-clear-title">${escapeHtml(t('review.clearConfirm.title'))}</h3>
            <p>${escapeHtml(t('review.clearConfirm.description'))}</p>
          </div>
          <div class="layoutpilot-review-confirm-actions">
            ${renderButton({ label: t('review.clearConfirm.cancel'), action: 'review-cancel-clear' })}
            ${renderButton({ label: t('review.clearConfirm.confirm'), action: 'review-confirm-clear', className: 'layoutpilot-review-danger' })}
          </div>
        </div>
      </div>
    `
  }

  root.reviewPanel = {
    renderReviewPanel,
    renderClearReviewDialog
  }
})()
