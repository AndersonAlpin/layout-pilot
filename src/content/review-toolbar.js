(() => {
  const root = window.LayoutPilotModules ||= {}
  const { escapeHtml } = root.dom
  const { icon } = root.icons

  const TOOL_ICON_NAME = {
    move: 'view',
    element: 'element',
    area: 'area',
    pen: 'pen'
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
      icon: icon(TOOL_ICON_NAME[tool]),
      action: 'review-set-tool',
      active: state.activeTool === tool,
      className: 'layoutpilot-review-toolbar-tool',
      disabled: false
    }).replace('data-layoutpilot-action="review-set-tool"', `data-layoutpilot-action="review-set-tool" data-layoutpilot-review-tool="${tool}"`)
  }

  function renderReviewToolbar(state, options = {}) {
    const { t = key => key } = options
    const brandLogoUrl = chrome.runtime.getURL('src/assets/brand/logo-horizontal.png')

    const isPinned = state.toolbarPinned !== false
    const pinLabel = isPinned ? t('review.toolbar.unpin') : t('review.toolbar.pin')
    const pinIcon = icon(isPinned ? 'pin-off' : 'pin')

    return `
      <div class="layoutpilot-review-toolbar-shell">
        <div class="layoutpilot-review-toolbar-grip" data-layoutpilot-toolbar-drag-handle="true" title="${escapeHtml(t('review.toolbar.drag'))}">
          <img class="layoutpilot-review-toolbar-brand-logo" src="${escapeHtml(brandLogoUrl)}" alt="LayoutPilot" />
        </div>
        <div class="layoutpilot-review-toolbar-group" role="group" aria-label="${escapeHtml(t('review.toolbar.tools'))}">
          ${['move', 'element', 'area', 'pen'].map(tool => renderToolButton(tool, state, t)).join('')}
        </div>
        <div class="layoutpilot-review-toolbar-separator" aria-hidden="true"></div>
        <div class="layoutpilot-review-toolbar-group" role="group" aria-label="${escapeHtml(t('review.toolbar.actions'))}">
          ${renderToolbarButton({ label: t('review.toolbar.copyImage'), icon: icon('copy'), action: 'review-copy-image' })}
          ${renderToolbarButton({ label: t('review.toolbar.downloadImage'), icon: icon('download'), action: 'review-download-snapshot' })}
          ${renderToolbarButton({ label: t('review.toolbar.generatePdf'), icon: icon('pdf'), action: 'review-generate-pdf' })}
        </div>
        <button
          type="button"
          class="layoutpilot-review-toolbar-pin${isPinned ? ' layoutpilot-review-toolbar-pin--active' : ''}"
          data-layoutpilot-action="review-toggle-toolbar-pin"
          title="${escapeHtml(pinLabel)}"
          aria-label="${escapeHtml(pinLabel)}"
          aria-pressed="${isPinned ? 'true' : 'false'}"
        >${pinIcon}</button>
      </div>
    `
  }

  root.reviewToolbar = {
    renderReviewToolbar
  }
})()
