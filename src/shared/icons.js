(() => {
  const root = window.LayoutPilotModules ||= {}

  const PATHS = {
    brand: '<path d="M20 4 4 11l7 2 2 7 7-16Z"/><path d="m11 13 9-9"/>',
    view: '<path d="M12 3v18M3 12h18M7 7 3 12l4 5M17 7l4 5-4 5M7 7l5-4 5 4M7 17l5 4 5-4"/>',
    element: '<rect x="5" y="5" width="14" height="14" rx="1.5"/><path d="M9 5V3M15 5V3M9 21v-2M15 21v-2M5 9H3M5 15H3M21 9h-2M21 15h-2"/>',
    area: '<rect x="5" y="5" width="14" height="14" rx="1.5" stroke-dasharray="3 3"/><path d="M9 9h6v6H9z"/>',
    pen: '<path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z"/><path d="m14 7 3 3"/>',
    copy: '<rect x="9" y="9" width="10" height="10" rx="1.5"/><path d="M5 15H4.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5V5"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 20h14"/>',
    pdf: '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v5h4"/><path d="M9 16h6M9 12h3"/>',
    palette: '<path d="M12 3a9 9 0 0 0 0 18h1.5a1.8 1.8 0 0 0 1.2-3.15 1.2 1.2 0 0 1 .8-2.1H17a4 4 0 0 0 4-4A8.8 8.8 0 0 0 12 3Z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7.5" r="1"/><circle cx="14.5" cy="7.5" r="1"/><circle cx="16.5" cy="11" r="1"/>',
    'chevron-down': '<path d="m6 9 6 6 6-6"/>',
    'chevron-left': '<path d="m15 18-6-6 6-6"/>',
    'chevron-right': '<path d="m9 18 6-6-6-6"/>',
    target: '<circle cx="12" cy="12" r="8"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="2"/>',
    pin: '<path d="M12 3v5"/><path d="M7 8h10"/><path d="m9 8 1 7h4l1-7"/><path d="M12 15v6"/>',
    'pin-off': '<path d="M12 3v5"/><path d="M7 8h10"/><path d="m9 8 1 7h4l1-7"/><path d="M12 15v6"/><path d="m5 5 14 14"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v5M14 11v5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>'
  }

  function icon(name, size = 16) {
    const body = PATHS[name]
    if (!body) return ''

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`
  }

  root.icons = {
    icon
  }
})()
