(() => {
  const root = window.LayoutPilotModules ||= {}

  const COLOR_MODE = {
    AUTO: 'auto',
    DEFAULT: 'default'
  }
  const DEFAULT_REVIEW_COLOR = { type: 'palette', index: 0 }
  const COLOR_NEAR_DISTANCE = 180
  const RECENT_CUSTOM_COLOR_LIMIT = 7
  const ANNOTATION_COLORS = [
    { color: '#FBBF24', rgb: '251, 191, 36', text: '#03111F' },
    { color: '#38BDF8', rgb: '56, 189, 248', text: '#03111F' },
    { color: '#34D399', rgb: '52, 211, 153', text: '#03111F' },
    { color: '#A78BFA', rgb: '167, 139, 250', text: '#F8FAFC' },
    { color: '#FB923C', rgb: '251, 146, 60', text: '#03111F' },
    { color: '#F472B6', rgb: '244, 114, 182', text: '#03111F' }
  ]
  const FREE_MARK_COLOR = { color: '#EF4444', rgb: '239, 68, 68', text: '#F8FAFC' }

  function cloneColorReference(reference) {
    return { ...reference }
  }

  function normalizeColorMode(mode) {
    return mode === COLOR_MODE.DEFAULT ? COLOR_MODE.DEFAULT : COLOR_MODE.AUTO
  }

  function normalizePaletteIndex(index, fallbackIndex = DEFAULT_REVIEW_COLOR.index) {
    const numericIndex = Number(index)
    return Number.isInteger(numericIndex) && numericIndex >= 0 && numericIndex < ANNOTATION_COLORS.length
      ? numericIndex
      : fallbackIndex
  }

  function normalizeHexColor(value) {
    const text = String(value || '').trim()
    const shortMatch = text.match(/^#([0-9a-f]{3})$/i)
    if (shortMatch) {
      return `#${shortMatch[1].split('').map(char => `${char}${char}`).join('')}`.toUpperCase()
    }

    const longMatch = text.match(/^#([0-9a-f]{6})$/i)
    return longMatch ? `#${longMatch[1]}`.toUpperCase() : ''
  }

  function isValidHexColor(value) {
    return Boolean(normalizeHexColor(value))
  }

  function normalizeRecentCustomColors(colors = []) {
    const seen = new Set()
    const normalizedColors = []

    for (const color of Array.isArray(colors) ? colors : []) {
      const normalized = normalizeHexColor(color)
      if (!normalized || seen.has(normalized)) continue
      seen.add(normalized)
      normalizedColors.push(normalized)
      if (normalizedColors.length >= RECENT_CUSTOM_COLOR_LIMIT) break
    }

    return normalizedColors
  }

  function addRecentCustomColor(colors = [], color) {
    const normalized = normalizeHexColor(color)
    if (!normalized) return normalizeRecentCustomColors(colors)
    return normalizeRecentCustomColors([normalized, ...normalizeRecentCustomColors(colors)])
  }

  function normalizeColorReference(reference, fallback = DEFAULT_REVIEW_COLOR) {
    const normalizedFallback = fallback === reference
      ? DEFAULT_REVIEW_COLOR
      : normalizeColorReference(fallback || DEFAULT_REVIEW_COLOR, DEFAULT_REVIEW_COLOR)

    if (reference?.type === 'custom') {
      const value = normalizeHexColor(reference.value)
      return value ? { type: 'custom', value } : cloneColorReference(normalizedFallback)
    }

    if (reference?.type === 'palette') {
      const index = normalizePaletteIndex(reference.index, -1)
      return index >= 0 ? { type: 'palette', index } : cloneColorReference(normalizedFallback)
    }

    return cloneColorReference(normalizedFallback)
  }

  function hexToRgbParts(hexValue) {
    const hex = normalizeHexColor(hexValue)
    if (!hex) return null
    return [
      Number.parseInt(hex.slice(1, 3), 16),
      Number.parseInt(hex.slice(3, 5), 16),
      Number.parseInt(hex.slice(5, 7), 16)
    ]
  }

  function getReadableTextColor(hexValue) {
    const rgb = hexToRgbParts(hexValue)
    if (!rgb) return '#03111F'
    const [red, green, blue] = rgb.map(value => {
      const channel = value / 255
      return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
    })
    const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue
    return luminance > 0.48 ? '#03111F' : '#F8FAFC'
  }

  function colorFromReference(reference) {
    const normalized = normalizeColorReference(reference)
    if (normalized.type === 'custom') {
      const rgb = hexToRgbParts(normalized.value)
      return {
        color: normalized.value,
        rgb: rgb.join(', '),
        text: getReadableTextColor(normalized.value)
      }
    }

    return ANNOTATION_COLORS[normalized.index]
  }

  function getPreferredColorIndex(id) {
    const numericId = Number(id)
    return Math.max(0, (Number.isFinite(numericId) ? numericId : 1) - 1) % ANNOTATION_COLORS.length
  }

  function getRect(annotation) {
    const rect = annotation?.rect?.viewport || annotation?.rect || null
    if (!rect) return { x: 0, y: 0, width: 0, height: 0 }
    return {
      x: Number(rect.x) || 0,
      y: Number(rect.y) || 0,
      width: Number(rect.width) || 0,
      height: Number(rect.height) || 0
    }
  }

  function intersects(rectA, rectB) {
    return rectA.left < rectB.right &&
      rectA.right > rectB.left &&
      rectA.top < rectB.bottom &&
      rectA.bottom > rectB.top
  }

  function expandRect(rect, amount) {
    return {
      left: rect.left - amount,
      top: rect.top - amount,
      right: rect.right + amount,
      bottom: rect.bottom + amount
    }
  }

  function rectFromViewportRect(rect) {
    return {
      left: rect.x,
      top: rect.y,
      right: rect.x + rect.width,
      bottom: rect.y + rect.height
    }
  }

  function getRectCenter(rect) {
    return {
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height / 2
    }
  }

  function getDistance(pointA, pointB) {
    const deltaX = pointA.x - pointB.x
    const deltaY = pointA.y - pointB.y
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY)
  }

  function areAnnotationsNear(annotationA, annotationB, getAnnotationRect = getRect) {
    const rectA = getAnnotationRect(annotationA)
    const rectB = getAnnotationRect(annotationB)
    const distance = getDistance(getRectCenter(rectA), getRectCenter(rectB))

    return distance <= COLOR_NEAR_DISTANCE ||
      intersects(expandRect(rectFromViewportRect(rectA), 24), rectFromViewportRect(rectB))
  }

  function getAnnotationPaletteIndex(annotationOrId) {
    const storedIndex = typeof annotationOrId === 'object' ? annotationOrId?.colorIndex : null
    return Number.isInteger(storedIndex)
      ? ((storedIndex % ANNOTATION_COLORS.length) + ANNOTATION_COLORS.length) % ANNOTATION_COLORS.length
      : getPreferredColorIndex(typeof annotationOrId === 'object' ? annotationOrId?.id : annotationOrId)
  }

  function getAnnotationColor(annotationOrId) {
    if (typeof annotationOrId === 'object' && annotationOrId?.color) {
      return colorFromReference(annotationOrId.color)
    }

    return ANNOTATION_COLORS[getAnnotationPaletteIndex(annotationOrId)]
  }

  function getAnnotationColorStyle(annotationOrId) {
    const color = getAnnotationColor(annotationOrId)
    return `--layoutpilot-review-color: ${color.color}; --layoutpilot-review-color-rgb: ${color.rgb}; --layoutpilot-review-text-color: ${color.text};`
  }

  function chooseAnnotationColorIndex(annotation, assignedAnnotations = [], getAnnotationRect = getRect) {
    const preferredIndex = getPreferredColorIndex(annotation?.id)
    const nearbyColorIndexes = new Set(
      assignedAnnotations
        .filter(assigned => areAnnotationsNear(annotation, assigned, getAnnotationRect))
        .map(assigned => getAnnotationPaletteIndex(assigned))
        .filter(Number.isInteger)
    )

    for (let offset = 0; offset < ANNOTATION_COLORS.length; offset += 1) {
      const candidateIndex = (preferredIndex + offset) % ANNOTATION_COLORS.length
      if (!nearbyColorIndexes.has(candidateIndex)) {
        return candidateIndex
      }
    }

    return preferredIndex
  }

  function ensureAnnotationColors(annotations = [], getAnnotationRect = getRect) {
    const assignedAnnotations = []

    for (const annotation of annotations) {
      if (!annotation) continue

      if (!annotation.color && !Number.isInteger(annotation.colorIndex)) {
        annotation.colorIndex = chooseAnnotationColorIndex(annotation, assignedAnnotations, getAnnotationRect)
      }

      assignedAnnotations.push(annotation)
    }
  }

  function getNextAnnotationColorReference(state, annotation, assignedAnnotations = state?.annotations || [], getAnnotationRect = getRect) {
    if (annotation?.color) return normalizeColorReference(annotation.color)
    if (Number.isInteger(annotation?.colorIndex)) return { type: 'palette', index: getAnnotationPaletteIndex(annotation) }

    if (normalizeColorMode(state?.reviewColorMode) === COLOR_MODE.DEFAULT) {
      return normalizeColorReference(state?.reviewDefaultColor)
    }

    return {
      type: 'palette',
      index: chooseAnnotationColorIndex(annotation, assignedAnnotations, getAnnotationRect)
    }
  }

  function applyColorToAnnotations(annotations = [], colorReference) {
    const color = normalizeColorReference(colorReference)
    for (const annotation of annotations) {
      if (!annotation) continue
      annotation.color = cloneColorReference(color)
      delete annotation.colorIndex
    }
  }

  function resetAnnotationsToAutomaticColors(annotations = []) {
    for (const annotation of annotations) {
      if (!annotation) continue
      delete annotation.color
      delete annotation.colorIndex
    }
  }

  function setAnnotationColor(annotation, colorReference) {
    if (!annotation) return null
    annotation.color = normalizeColorReference(colorReference)
    delete annotation.colorIndex
    return annotation.color
  }

  root.reviewColors = {
    ANNOTATION_COLORS,
    COLOR_MODE,
    DEFAULT_REVIEW_COLOR,
    FREE_MARK_COLOR,
    RECENT_CUSTOM_COLOR_LIMIT,
    addRecentCustomColor,
    applyColorToAnnotations,
    areAnnotationsNear,
    chooseAnnotationColorIndex,
    colorFromReference,
    ensureAnnotationColors,
    getAnnotationColor,
    getAnnotationColorStyle,
    getNextAnnotationColorReference,
    getReadableTextColor,
    isValidHexColor,
    normalizeColorMode,
    normalizeColorReference,
    normalizeHexColor,
    normalizeRecentCustomColors,
    resetAnnotationsToAutomaticColors,
    setAnnotationColor
  }
})()
