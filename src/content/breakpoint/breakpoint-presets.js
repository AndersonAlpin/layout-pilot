(() => {
  const root = window.LayoutPilotModules ||= {}

  const MIN_VIEWPORT_DIMENSION = 240
  const MAX_VIEWPORT_DIMENSION = 3840

  // Grouped device presets. Values are CSS viewport sizes for responsive review,
  // not physical hardware emulation (no DPR, browser chrome, safe areas, etc.).
  const BREAKPOINT_PRESET_GROUPS = [
    {
      groupKey: 'breakpoint.presetGroups.essential',
      items: [
        { id: 'mobile-xs', label: 'Mobile XS', width: 320, height: 568 },
        { id: 'mobile-sm', label: 'Mobile small', width: 360, height: 780 },
        { id: 'mobile-md', label: 'Mobile medium', width: 375, height: 812 },
        { id: 'mobile-lg', label: 'Mobile large', width: 393, height: 852 },
        { id: 'mobile-xl', label: 'Mobile XL', width: 430, height: 932 },
        { id: 'tablet', label: 'Tablet', width: 768, height: 1024 },
        { id: 'laptop', label: 'Laptop', width: 1366, height: 768 },
        { id: 'desktop', label: 'Desktop FHD', width: 1920, height: 1080 },
        { id: 'ultrawide-21-9', label: 'Ultrawide 21:9', width: 2560, height: 1080 }
      ]
    },
    {
      groupKey: 'breakpoint.presetGroups.applePhones',
      items: [
        { id: 'iphone-se-1', label: 'iPhone SE 1st gen', width: 320, height: 568 },
        { id: 'iphone-se-2-3', label: 'iPhone SE 2nd/3rd gen', width: 375, height: 667 },
        { id: 'iphone-mini', label: 'iPhone 12/13 mini', width: 375, height: 812 },
        { id: 'iphone-12-13-14', label: 'iPhone 12/13/14', width: 390, height: 844 },
        { id: 'iphone-14-15-pro', label: 'iPhone 14/15 Pro', width: 393, height: 852 },
        { id: 'iphone-16-17-pro', label: 'iPhone 16/17 Pro', width: 402, height: 874 },
        { id: 'iphone-14-15-pro-max', label: 'iPhone 14/15 Pro Max', width: 430, height: 932 },
        { id: 'iphone-16-17-pro-max', label: 'iPhone 16/17 Pro Max', width: 440, height: 956 }
      ]
    },
    {
      groupKey: 'breakpoint.presetGroups.androidPhones',
      items: [
        { id: 'galaxy-s5', label: 'Galaxy S5', width: 360, height: 640 },
        { id: 'galaxy-s20', label: 'Galaxy S20', width: 360, height: 800 },
        { id: 'galaxy-s24', label: 'Galaxy S24', width: 360, height: 780 },
        { id: 'galaxy-s24-plus', label: 'Galaxy S24 Plus', width: 384, height: 832 },
        { id: 'galaxy-s26-ultra', label: 'Galaxy S26 Ultra', width: 412, height: 891 },
        { id: 'google-pixel-5', label: 'Google Pixel 5', width: 393, height: 851 },
        { id: 'google-pixel-8-pro', label: 'Google Pixel 8 Pro', width: 448, height: 997 },
        { id: 'xiaomi-14', label: 'Xiaomi 14', width: 393, height: 873 }
      ]
    },
    {
      groupKey: 'breakpoint.presetGroups.tablets',
      items: [
        { id: 'ipad-mini', label: 'iPad Mini', width: 768, height: 1024 },
        { id: 'ipad-mini-7', label: 'iPad Mini 7', width: 744, height: 1133 },
        { id: 'ipad-10', label: 'iPad 10.2/classic', width: 810, height: 1080 },
        { id: 'ipad-air-109', label: 'iPad Air 10.9', width: 820, height: 1180 },
        { id: 'ipad-air-13', label: 'iPad Air 13', width: 1024, height: 1366 },
        { id: 'ipad-pro-11', label: 'iPad Pro 11', width: 834, height: 1194 },
        { id: 'ipad-pro-13', label: 'iPad Pro 13', width: 1032, height: 1376 },
        { id: 'nexus-7-2013', label: 'Nexus 7 (2013)', width: 600, height: 960 },
        { id: 'nexus-9', label: 'Nexus 9', width: 768, height: 1024 },
        { id: 'pixel-tablet', label: 'Google Pixel Tablet', width: 753, height: 1133 },
        { id: 'galaxy-tab-10', label: 'Galaxy Tab 10', width: 800, height: 1280 },
        { id: 'galaxy-tab-s7-s8', label: 'Galaxy Tab S7/S8', width: 800, height: 1280 },
        { id: 'galaxy-tab-s9-ultra', label: 'Galaxy Tab S9 Ultra', width: 1184, height: 1848 },
        { id: 'surface-go-landscape', label: 'Surface Go landscape', width: 900, height: 600 }
      ]
    },
    {
      groupKey: 'breakpoint.presetGroups.computers',
      items: [
        { id: 'laptop-1280', label: 'Laptop 13 common', width: 1280, height: 800 },
        { id: 'laptop-1366', label: 'Laptop HD', width: 1366, height: 768 },
        { id: 'macbook-air-13', label: 'MacBook Air 13', width: 1440, height: 900 },
        { id: 'macbook-pro-14', label: 'MacBook Pro 14', width: 1512, height: 982 },
        { id: 'desktop-fhd-scaled', label: 'Desktop FHD scaled', width: 1536, height: 864 }
      ]
    },
    {
      groupKey: 'breakpoint.presetGroups.custom',
      items: [
        { id: 'custom', labelKey: 'breakpoint.presets.custom', width: 393, height: 852 }
      ]
    }
  ]

  const DEFAULT_PRESET_ID = 'iphone-16-17-pro'

  // Flat list of real device presets for id lookups (custom excluded, ids
  // de-duplicated — the essential group intentionally mirrors a few sizes that
  // also live in their device-specific groups).
  const BREAKPOINT_DEVICE_PRESETS = (() => {
    const seen = new Set()
    const list = []
    for (const group of BREAKPOINT_PRESET_GROUPS) {
      for (const preset of group.items) {
        if (preset.id === 'custom' || seen.has(preset.id)) continue
        seen.add(preset.id)
        list.push(preset)
      }
    }
    return list
  })()

  function normalizeBreakpointDimension(value, fallback) {
    const parsed = Number.parseInt(String(value ?? ''), 10)
    const safeFallback = Number.isFinite(fallback) ? fallback : 390
    const dimension = Number.isFinite(parsed) ? parsed : safeFallback
    return Math.min(Math.max(dimension, MIN_VIEWPORT_DIMENSION), MAX_VIEWPORT_DIMENSION)
  }

  function getBreakpointPreset(id) {
    return BREAKPOINT_DEVICE_PRESETS.find(preset => preset.id === id) || null
  }

  function rotateBreakpointViewport(viewport) {
    return {
      width: normalizeBreakpointDimension(viewport?.height, 844),
      height: normalizeBreakpointDimension(viewport?.width, 390)
    }
  }

  function frameToInternalPoint(clientX, clientY, geometry) {
    const geo = geometry || {}
    const scaleX = Number.isFinite(geo.scaleX) && geo.scaleX > 0 ? geo.scaleX : 1
    const scaleY = Number.isFinite(geo.scaleY) && geo.scaleY > 0 ? geo.scaleY : 1
    return {
      x: (clientX - (geo.originX || 0)) / scaleX,
      y: (clientY - (geo.originY || 0)) / scaleY
    }
  }

  function internalRectToViewport(rect, geometry) {
    const source = rect || {}
    const geo = geometry || {}
    const scaleX = Number.isFinite(geo.scaleX) && geo.scaleX > 0 ? geo.scaleX : 1
    const scaleY = Number.isFinite(geo.scaleY) && geo.scaleY > 0 ? geo.scaleY : 1
    const originX = geo.originX || 0
    const originY = geo.originY || 0
    return {
      left: originX + source.left * scaleX,
      top: originY + source.top * scaleY,
      right: originX + source.right * scaleX,
      bottom: originY + source.bottom * scaleY,
      width: source.width * scaleX,
      height: source.height * scaleY
    }
  }

  // The breakpoint frame always loads the current (same-origin) URL, so we can
  // tell whether it rendered by probing its location:
  // - reachable === false  -> the browser swapped in a cross-origin error page
  //   (X-Frame-Options / CSP frame-ancestors), so the preview is blocked.
  // - href is empty/about:blank -> still the initial frame, keep waiting.
  // - any real href -> the page rendered inside the frame.
  function classifyFrameProbe(probe) {
    if (!probe || probe.reachable === false) return 'blocked'
    const href = probe.href
    if (!href || href === 'about:blank') return 'pending'
    return 'ready'
  }

  function normalizeBreakpointInteraction(value) {
    return value === 'inspect' ? 'inspect' : 'navigate'
  }

  // Single source of truth for which controller intercepts pointer input.
  // Review never runs while the preview is on (out of MVP).
  function resolveActiveControllers(stateInput) {
    const s = stateInput || {}
    if (!s.enabled) return { inspect: false, review: false }
    if (s.breakpointEnabled) {
      return { inspect: s.interaction === 'inspect', review: false }
    }
    return { inspect: s.mode !== 'review', review: s.mode === 'review' }
  }

  root.breakpointPresets = {
    BREAKPOINT_PRESET_GROUPS,
    BREAKPOINT_DEVICE_PRESETS,
    DEFAULT_PRESET_ID,
    MIN_VIEWPORT_DIMENSION,
    MAX_VIEWPORT_DIMENSION,
    getBreakpointPreset,
    normalizeBreakpointDimension,
    rotateBreakpointViewport,
    frameToInternalPoint,
    internalRectToViewport,
    classifyFrameProbe,
    normalizeBreakpointInteraction,
    resolveActiveControllers
  }
})()
