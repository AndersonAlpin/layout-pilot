(() => {
  const root = window.LayoutPilotModules ||= {}
  const ui = root.ui ||= {}

  function escape(value) {
    const escapeHtml = root.dom?.escapeHtml
    return escapeHtml ? escapeHtml(value) : String(value ?? '')
  }

  // Shared grouped dropdown/popover menu for LayoutPilot content-script UI.
  // Renders a floating menu appended to documentElement (top of the max-z stack),
  // positioned relative to a trigger element, with optional groups, right-aligned
  // meta, active/disabled items, outside-click/Esc dismissal and reposition.
  // No external dependencies. Callers pass already-translated strings (i18n).
  function createPopoverMenu(options = {}) {
    const { onSelect, className = '' } = options
    let menuEl = null
    let anchorEl = null
    let open = false

    function renderGroups(groups, activeValue) {
      return (groups || []).map(group => {
        const header = group.label
          ? `<div class="layoutpilot-menu-group-label">${escape(group.label)}</div>`
          : ''
        const items = (group.items || []).map(item => {
          const active = item.value != null && item.value === activeValue
          const disabled = !!item.disabled
          return `
            <button
              type="button"
              role="option"
              class="layoutpilot-menu-item${active ? ' layoutpilot-menu-item--active' : ''}${disabled ? ' layoutpilot-menu-item--disabled' : ''}"
              data-layoutpilot-menu-value="${escape(item.value)}"
              aria-selected="${active ? 'true' : 'false'}"
              ${disabled ? 'aria-disabled="true" disabled' : ''}
            >
              <span class="layoutpilot-menu-item-label">${escape(item.label)}</span>
              ${item.meta ? `<span class="layoutpilot-menu-item-meta">${escape(item.meta)}</span>` : ''}
            </button>
          `
        }).join('')
        return `<div class="layoutpilot-menu-group" role="group">${header}${items}</div>`
      }).join('')
    }

    function ensureMenu() {
      if (menuEl) return menuEl
      menuEl = document.createElement('div')
      menuEl.className = `layoutpilot-menu${className ? ` ${className}` : ''}`
      menuEl.setAttribute('role', 'listbox')
      menuEl.addEventListener('click', handleClick)
      return menuEl
    }

    function handleClick(event) {
      const itemEl = event.target?.closest?.('[data-layoutpilot-menu-value]')
      if (!itemEl || itemEl.disabled) return
      const value = itemEl.dataset.layoutpilotMenuValue
      close()
      onSelect?.(value)
    }

    function position() {
      if (!menuEl || !anchorEl?.getBoundingClientRect) return
      const rect = anchorEl.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const gap = 4
      const margin = 8

      menuEl.style.minWidth = `${Math.round(rect.width)}px`
      menuEl.style.maxWidth = `${Math.round(viewportWidth - margin * 2)}px`

      const menuRect = menuEl.getBoundingClientRect()
      const left = Math.max(margin, Math.min(rect.left, viewportWidth - margin - menuRect.width))
      menuEl.style.left = `${Math.round(left)}px`

      const spaceBelow = viewportHeight - rect.bottom
      const placeAbove = spaceBelow < menuRect.height + gap && rect.top > spaceBelow
      const top = placeAbove
        ? Math.max(margin, rect.top - menuRect.height - gap)
        : Math.min(rect.bottom + gap, viewportHeight - margin - menuRect.height)
      menuEl.style.top = `${Math.round(Math.max(margin, top))}px`
      menuEl.dataset.placement = placeAbove ? 'top' : 'bottom'
    }

    function scrollActiveIntoView() {
      const activeItem = menuEl?.querySelector?.('.layoutpilot-menu-item--active')
      activeItem?.scrollIntoView?.({ block: 'center' })
    }

    function openMenu(anchor, opts = {}) {
      anchorEl = anchor || null
      ensureMenu()
      menuEl.innerHTML = renderGroups(opts.groups, opts.activeValue)
      document.documentElement.appendChild(menuEl)
      open = true
      anchorEl?.setAttribute?.('data-layoutpilot-menu-open', 'true')
      position()
      scrollActiveIntoView()
      bindGlobal()
    }

    function close() {
      if (!open) return
      open = false
      unbindGlobal()
      anchorEl?.removeAttribute?.('data-layoutpilot-menu-open')
      menuEl?.remove()
    }

    function toggle(anchor, opts) {
      if (open && anchorEl === anchor) {
        close()
        return
      }
      if (open) close()
      openMenu(anchor, opts)
    }

    function handleOutside(event) {
      if (!open) return
      if (menuEl?.contains(event.target)) return
      if (anchorEl?.contains?.(event.target)) return
      close()
    }

    function handleKey(event) {
      if (event.key === 'Escape' && open) {
        event.stopPropagation()
        close()
      }
    }

    function handleReposition() {
      if (open) position()
    }

    function bindGlobal() {
      document.addEventListener('pointerdown', handleOutside, true)
      document.addEventListener('keydown', handleKey, true)
      window.addEventListener('resize', handleReposition, true)
      window.addEventListener('scroll', handleReposition, true)
    }

    function unbindGlobal() {
      document.removeEventListener('pointerdown', handleOutside, true)
      document.removeEventListener('keydown', handleKey, true)
      window.removeEventListener('resize', handleReposition, true)
      window.removeEventListener('scroll', handleReposition, true)
    }

    function destroy() {
      close()
      menuEl = null
      anchorEl = null
    }

    return {
      open: openMenu,
      close,
      toggle,
      isOpen: () => open,
      reposition: handleReposition,
      destroy
    }
  }

  Object.assign(ui, { createPopoverMenu })
})()
