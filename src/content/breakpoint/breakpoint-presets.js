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
  const RESERVED_PRESET_IDS = new Set(['custom'])

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

  function normalizeCustomPresetId(value, fallbackIndex) {
    const raw = String(value || '').trim()
    const id = raw
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    return id && !RESERVED_PRESET_IDS.has(id) ? id : `custom-${fallbackIndex + 1}`
  }

  function getDefaultCustomPresetName(width, height, prefix = 'Custom') {
    return `${String(prefix || 'Custom').trim() || 'Custom'} ${width} × ${height}`
  }

  function normalizeCustomBreakpointPresets(value) {
    const source = Array.isArray(value) ? value : []
    const seen = new Set()
    const normalized = []
    let generatedIdCount = 0

    for (const item of source) {
      const width = normalizeBreakpointDimension(item?.width, 390)
      const height = normalizeBreakpointDimension(item?.height, 844)
      const rawId = String(item?.id || '').trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      const usesGeneratedId = !rawId || RESERVED_PRESET_IDS.has(rawId)
      const id = normalizeCustomPresetId(item?.id, generatedIdCount)
      if (usesGeneratedId) generatedIdCount += 1
      const label = String(item?.label || '').trim() || getDefaultCustomPresetName(width, height)
      if (seen.has(id)) continue
      seen.add(id)
      normalized.push({ id, label, width, height })
    }

    return normalized
  }

  function getUniqueCustomPresetName(baseName, existingPresets = []) {
    const fallback = String(baseName || '').trim() || 'Custom'
    const names = new Set((existingPresets || []).map(preset => String(preset?.label || '').trim()).filter(Boolean))
    if (!names.has(fallback)) return fallback

    let index = 1
    let candidate = `${fallback} (${index})`
    while (names.has(candidate)) {
      index += 1
      candidate = `${fallback} (${index})`
    }
    return candidate
  }

  function getCustomPresetId(width, height, label, existingPresets = []) {
    const suffixMatch = String(label || '').match(/\((\d+)\)$/)
    const suffix = suffixMatch ? `-${suffixMatch[1]}` : ''
    const baseId = `custom-${width}x${height}${suffix}`
    const ids = new Set((existingPresets || []).map(preset => String(preset?.id || '').trim()).filter(Boolean))
    if (!ids.has(baseId)) return baseId

    let index = 1
    let candidate = `${baseId}-${index}`
    while (ids.has(candidate)) {
      index += 1
      candidate = `${baseId}-${index}`
    }
    return candidate
  }

  function createCustomBreakpointPreset(options = {}) {
    const width = normalizeBreakpointDimension(options.width, 390)
    const height = normalizeBreakpointDimension(options.height, 844)
    const existingPresets = normalizeCustomBreakpointPresets(options.existingPresets)
    const requestedLabel = String(options.label || '').trim()
    const baseName = requestedLabel || getDefaultCustomPresetName(width, height, options.labelPrefix)
    const label = getUniqueCustomPresetName(baseName, existingPresets)
    const id = getCustomPresetId(width, height, label, existingPresets)
    return { id, label, width, height }
  }

  function findBreakpointPreset(id, customPresets = []) {
    return getBreakpointPreset(id) || normalizeCustomBreakpointPresets(customPresets).find(preset => preset.id === id) || null
  }

  function resolveBreakpointPresetBySize(width, height, customPresets = []) {
    const targetWidth = normalizeBreakpointDimension(width, 390)
    const targetHeight = normalizeBreakpointDimension(height, 844)
    return [...BREAKPOINT_DEVICE_PRESETS, ...normalizeCustomBreakpointPresets(customPresets)]
      .find(preset => preset.width === targetWidth && preset.height === targetHeight) || null
  }

  function hasBreakpointPresetDimensions(width, height, customPresets = []) {
    return !!resolveBreakpointPresetBySize(width, height, customPresets)
  }

  function renameCustomBreakpointPreset(id, label, customPresets = []) {
    const targetId = String(id || '').trim()
    const nextLabel = String(label || '').trim()
    if (!targetId || !nextLabel) return normalizeCustomBreakpointPresets(customPresets)

    return normalizeCustomBreakpointPresets(customPresets).map(preset => (
      preset.id === targetId ? { ...preset, label: nextLabel } : preset
    ))
  }

  function removeCustomBreakpointPreset(id, customPresets = []) {
    const targetId = String(id || '').trim()
    return normalizeCustomBreakpointPresets(customPresets).filter(preset => preset.id !== targetId)
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

  function resolveBreakpointNavigationUrl(currentUrl, frameUrl) {
    try {
      const current = new URL(String(currentUrl || ''))
      const frame = new URL(String(frameUrl || ''), current.href)
      if (!['http:', 'https:'].includes(frame.protocol)) {
        return { shouldNavigate: false, url: '' }
      }
      if (frame.href === current.href) {
        return { shouldNavigate: false, url: '' }
      }
      return { shouldNavigate: true, url: frame.href }
    } catch {
      return { shouldNavigate: false, url: '' }
    }
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
    normalizeCustomBreakpointPresets,
    createCustomBreakpointPreset,
    getUniqueCustomPresetName,
    findBreakpointPreset,
    resolveBreakpointPresetBySize,
    hasBreakpointPresetDimensions,
    renameCustomBreakpointPreset,
    removeCustomBreakpointPreset,
    normalizeBreakpointDimension,
    rotateBreakpointViewport,
    frameToInternalPoint,
    internalRectToViewport,
    classifyFrameProbe,
    resolveBreakpointNavigationUrl,
    normalizeBreakpointInteraction,
    resolveActiveControllers
  }
})()
