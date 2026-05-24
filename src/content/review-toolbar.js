(() => {
  const root = window.LayoutPilotModules ||= {}
  const { escapeHtml } = root.dom

  const TOOL_ICON = {
    move: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M3 12h18M7 7 3 12l4 5M17 7l4 5-4 5M7 7l5-4 5 4M7 17l5 4 5-4"/></svg>',
    element: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="1.5"/><path d="M9 5V3M15 5V3M9 21v-2M15 21v-2M5 9H3M5 15H3M21 9h-2M21 15h-2"/></svg>',
    area: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="1.5" stroke-dasharray="3 3"/><path d="M9 9h6v6H9z"/></svg>',
    pen: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z"/><path d="m14 7 3 3"/></svg>',
    copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="10" height="10" rx="1.5"/><path d="M5 15H4.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5V5"/></svg>',
    download: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 20h14"/></svg>',
    pdf: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v5h4"/><path d="M9 16h6M9 12h3"/></svg>',
    collapse: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6 9 12l6 6"/></svg>',
    expand: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
    brand: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 4 4 11l7 2 2 7 7-16Z"/><path d="m11 13 9-9"/></svg>'
  }

  function renderToolbarButton({ label, icon, action, className = '', active = false, disabled = false }) {
    const activeClass = active ? ' layoutpilot-review-toolbar-button--active' : ''
    const disabledAttr = disabled ? ' disabled' : ''
    return `
      <button
        type="button"
        class="layoutpilot-review-toolbar-button${activeClass}${className ? ` ${className}` : ''}"
        data-layoutpilot-action="${escapeHtml(action)}"
        title="${escapeHtml(label)}"
        aria-label="${escapeHtml(label)}"
        aria-pressed="${active ? 'true' : 'false'}"
        ${disabledAttr}
      >
        <span class="layoutpilot-review-toolbar-icon">${icon}</span>
        <span class="layoutpilot-review-toolbar-label">${escapeHtml(label)}</span>
      </button>
    `
  }

  function renderToolButton(tool, state, t) {
    return renderToolbarButton({
      label: t(`review.toolbar.${tool}`),
      icon: TOOL_ICON[tool],
      action: 'review-set-tool',
      active: state.activeTool === tool,
      className: 'layoutpilot-review-toolbar-tool',
      disabled: false
    }).replace('data-layoutpilot-action="review-set-tool"', `data-layoutpilot-action="review-set-tool" data-layoutpilot-review-tool="${tool}"`)
  }

  function renderReviewToolbar(state, options = {}) {
    const { t = key => key } = options

    if (state.toolbarCollapsed) {
      return `
        <button
          type="button"
          class="layoutpilot-review-toolbar-tab"
          data-layoutpilot-action="review-toggle-toolbar"
          title="${escapeHtml(t('review.toolbar.expand'))}"
          aria-label="${escapeHtml(t('review.toolbar.expand'))}"
        >
          <span class="layoutpilot-review-toolbar-icon">${TOOL_ICON.expand}</span>
          <span>${escapeHtml(t('review.toolbar.review'))}</span>
        </button>
      `
    }

    return `
      <div class="layoutpilot-review-toolbar-shell">
        <div class="layoutpilot-review-toolbar-grip" data-layoutpilot-toolbar-drag-handle="true" title="${escapeHtml(t('review.toolbar.drag'))}">
          <span class="layoutpilot-review-toolbar-brand">${TOOL_ICON.brand}</span>
          <span>${escapeHtml(t('review.toolbar.review'))}</span>
        </div>
        <div class="layoutpilot-review-toolbar-group" role="group" aria-label="${escapeHtml(t('review.toolbar.tools'))}">
          ${['move', 'element', 'area', 'pen'].map(tool => renderToolButton(tool, state, t)).join('')}
        </div>
        <div class="layoutpilot-review-toolbar-separator" aria-hidden="true"></div>
        <div class="layoutpilot-review-toolbar-group" role="group" aria-label="${escapeHtml(t('review.toolbar.actions'))}">
          ${renderToolbarButton({ label: t('review.toolbar.copyImage'), icon: TOOL_ICON.copy, action: 'review-copy-image' })}
          ${renderToolbarButton({ label: t('review.toolbar.downloadImage'), icon: TOOL_ICON.download, action: 'review-download-snapshot' })}
          ${renderToolbarButton({ label: t('review.toolbar.generatePdf'), icon: TOOL_ICON.pdf, action: 'review-generate-pdf' })}
        </div>
        <button
          type="button"
          class="layoutpilot-review-toolbar-collapse"
          data-layoutpilot-action="review-toggle-toolbar"
          title="${escapeHtml(t('review.toolbar.collapse'))}"
          aria-label="${escapeHtml(t('review.toolbar.collapse'))}"
        >${TOOL_ICON.collapse}</button>
      </div>
    `
  }

  root.reviewToolbar = {
    renderReviewToolbar
  }
})()
