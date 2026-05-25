(() => {
  const root = window.LayoutPilotModules ||= {}
  const { escapeHtml, px } = root.dom
  const { icon } = root.icons

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value))
  }

  const MARKER_SIZE = 28
  const MARKER_GAP = 6
  const VIEWPORT_MARGIN = 8
  const COLOR_NEAR_DISTANCE = 180
  const MARKER_NEAR_DISTANCE = 48
  const NESTED_RECT_TOLERANCE = 3
  const ANNOTATION_COLORS = [
    { color: '#FBBF24', rgb: '251, 191, 36', text: '#03111F' },
    { color: '#38BDF8', rgb: '56, 189, 248', text: '#03111F' },
    { color: '#34D399', rgb: '52, 211, 153', text: '#03111F' },
    { color: '#A78BFA', rgb: '167, 139, 250', text: '#F8FAFC' },
    { color: '#FB923C', rgb: '251, 146, 60', text: '#03111F' },
    { color: '#F472B6', rgb: '244, 114, 182', text: '#03111F' }
  ]

  function ensureAnnotationColors(annotations = []) {
    const assignedAnnotations = []

    for (const annotation of annotations) {
      if (!annotation) continue

      if (!Number.isInteger(annotation.colorIndex)) {
        annotation.colorIndex = chooseAnnotationColorIndex(annotation, assignedAnnotations)
      }

      assignedAnnotations.push(annotation)
    }
  }

  function chooseAnnotationColorIndex(annotation, assignedAnnotations) {
    const preferredIndex = getPreferredColorIndex(annotation.id)
    const nearbyColorIndexes = new Set(
      assignedAnnotations
        .filter(assigned => areAnnotationsNear(annotation, assigned))
        .map(assigned => assigned.colorIndex)
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

  function getPreferredColorIndex(id) {
    const numericId = Number(id)
    return Math.max(0, (Number.isFinite(numericId) ? numericId : 1) - 1) % ANNOTATION_COLORS.length
  }

  function getAnnotationColor(annotationOrId) {
    const storedIndex = typeof annotationOrId === 'object' ? annotationOrId?.colorIndex : null
    const index = Number.isInteger(storedIndex)
      ? storedIndex % ANNOTATION_COLORS.length
      : getPreferredColorIndex(typeof annotationOrId === 'object' ? annotationOrId?.id : annotationOrId)
    return ANNOTATION_COLORS[index]
  }

  function getAnnotationColorStyle(annotationOrId) {
    const color = getAnnotationColor(annotationOrId)
    return `--layoutpilot-review-color: ${color.color}; --layoutpilot-review-color-rgb: ${color.rgb}; --layoutpilot-review-text-color: ${color.text};`
  }

  function queryAnnotationElement(annotation) {
    const selector = annotation?.target?.selector
    if (!selector || selector === '—') return null

    try {
      return document.querySelector(selector)
    } catch {
      return null
    }
  }

  function getAnnotationViewportRect(annotation) {
    const liveElement = annotation.element?.isConnected ? annotation.element : queryAnnotationElement(annotation)
    if (liveElement) {
      const rect = liveElement.getBoundingClientRect()
      annotation.element = liveElement
      annotation.rect.viewport = {
        x: Math.round(rect.left),
        y: Math.round(rect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      }
      annotation.rect.page = {
        x: Math.round(rect.left + window.scrollX),
        y: Math.round(rect.top + window.scrollY),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      }
      return annotation.rect.viewport
    }

    if (annotation.rect?.page) {
      return {
        x: Math.round(annotation.rect.page.x - window.scrollX),
        y: Math.round(annotation.rect.page.y - window.scrollY),
        width: annotation.rect.page.width,
        height: annotation.rect.page.height
      }
    }

    return annotation.rect?.viewport || { x: 0, y: 0, width: 0, height: 0 }
  }

  function getBoxMarkup(state, descriptor) {
    const {
      annotation,
      rect,
      nestingLevel,
      parentAnnotationId,
      hasChildren
    } = descriptor
    const selectedClass = annotation.id === state.selectedAnnotationId ? ' layoutpilot-review-annotation-box--selected' : ''
    const highlightedClass = annotation.id === state.highlightedAnnotationId ? ' layoutpilot-review-annotation-box--highlighted' : ''
    const parentClass = hasChildren ? ' layoutpilot-review-annotation-box--parent' : ''
    const nestedClass = parentAnnotationId ? ' layoutpilot-review-annotation-box--nested' : ''
    const colorStyle = getAnnotationColorStyle(annotation)

    return `
      <div
        class="layoutpilot-review-annotation-box${parentClass}${nestedClass}${selectedClass}${highlightedClass}"
        data-layoutpilot-review-id="${escapeHtml(annotation.id)}"
        ${parentAnnotationId ? `data-layoutpilot-review-parent-id="${escapeHtml(parentAnnotationId)}"` : ''}
        style="
          ${colorStyle}
          left: ${px(rect.x)};
          top: ${px(rect.y)};
          width: ${px(rect.width)};
          height: ${px(rect.height)};
          z-index: ${10 + nestingLevel};
        "
      >
        <div class="layoutpilot-review-annotation-box-tools">
          <button
            type="button"
            class="layoutpilot-review-annotation-box-button"
            data-layoutpilot-action="review-edit"
            data-layoutpilot-review-id="${escapeHtml(annotation.id)}"
            title="Edit annotation"
            aria-label="Edit annotation ${escapeHtml(annotation.id)}"
          >${icon('edit', 14)}</button>
          <button
            type="button"
            class="layoutpilot-review-annotation-box-button layoutpilot-review-annotation-box-button--danger"
            data-layoutpilot-action="review-remove"
            data-layoutpilot-review-id="${escapeHtml(annotation.id)}"
            title="Remove annotation"
            aria-label="Remove annotation ${escapeHtml(annotation.id)}"
          >${icon('trash', 14)}</button>
        </div>
      </div>
    `
  }

  function getDraftBoxMarkup(draftAnnotation) {
    if (!draftAnnotation) return ''

    const rect = getAnnotationViewportRect(draftAnnotation)
    return `
      <div
        class="layoutpilot-review-draft-box"
        style="
          left: ${px(rect.x)};
          top: ${px(rect.y)};
          width: ${px(rect.width)};
          height: ${px(rect.height)};
        "
        aria-hidden="true"
      ></div>
    `
  }

  function getPenStrokeViewportPoints(annotation) {
    return (annotation?.penStroke?.points || []).map(point => ({
      x: Math.round(point.x - window.scrollX),
      y: Math.round(point.y - window.scrollY)
    }))
  }

  function getPenStrokePath(points) {
    if (!points.length) return ''
    return points.map((point, index) =>
      `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ')
  }

  function getAnnotationPenStrokeMarkup(annotation, className = '') {
    if (annotation?.type !== 'pen') return ''

    const points = getPenStrokeViewportPoints(annotation)
    if (!points.length) return ''

    const colorStyle = getAnnotationColorStyle(annotation)
    const selectedClass = className ? ` ${className}` : ''
    if (points.length === 1) {
      const [point] = points
      return `
        <svg class="layoutpilot-review-annotation-pen${selectedClass}" viewBox="0 0 ${window.innerWidth} ${window.innerHeight}" style="${colorStyle}" aria-hidden="true">
          <circle class="layoutpilot-review-annotation-pen-dot" cx="${point.x}" cy="${point.y}" r="3"></circle>
        </svg>
      `
    }

    return `
      <svg class="layoutpilot-review-annotation-pen${selectedClass}" viewBox="0 0 ${window.innerWidth} ${window.innerHeight}" style="${colorStyle}" aria-hidden="true">
        <path class="layoutpilot-review-annotation-pen-stroke" d="${getPenStrokePath(points)}"></path>
      </svg>
    `
  }

  function getRectArea(rect) {
    return Math.max(0, rect.width || 0) * Math.max(0, rect.height || 0)
  }

  function isRectContained(innerRect, outerRect, tolerance = NESTED_RECT_TOLERANCE) {
    if (!innerRect || !outerRect) return false
    if (getRectArea(innerRect) >= getRectArea(outerRect)) return false

    return innerRect.x >= outerRect.x - tolerance &&
      innerRect.y >= outerRect.y - tolerance &&
      innerRect.x + innerRect.width <= outerRect.x + outerRect.width + tolerance &&
      innerRect.y + innerRect.height <= outerRect.y + outerRect.height + tolerance
  }

  function getNestingLevel(descriptor, descriptorById) {
    let level = 0
    let current = descriptor
    const visitedIds = new Set()

    while (current?.parentAnnotationId && !visitedIds.has(current.annotation.id)) {
      visitedIds.add(current.annotation.id)
      const parent = descriptorById.get(current.parentAnnotationId)
      if (!parent) break
      level += 1
      current = parent
    }

    return level
  }

  function getAnnotationBoxDescriptors(annotations) {
    const descriptors = annotations.map(annotation => {
      const rect = getAnnotationViewportRect(annotation)
      return {
        annotation,
        rect,
        area: getRectArea(rect),
        parentAnnotationId: null,
        nestingLevel: 0,
        hasChildren: false
      }
    })

    for (const descriptor of descriptors) {
      const parent = descriptors
        .filter(candidate => candidate.annotation.id !== descriptor.annotation.id)
        .filter(candidate => isRectContained(descriptor.rect, candidate.rect))
        .sort((candidateA, candidateB) => candidateA.area - candidateB.area)[0]

      if (!parent) continue
      descriptor.parentAnnotationId = parent.annotation.id
      parent.hasChildren = true
    }

    const descriptorById = new Map(descriptors.map(descriptor => [descriptor.annotation.id, descriptor]))
    for (const descriptor of descriptors) {
      descriptor.nestingLevel = getNestingLevel(descriptor, descriptorById)
    }

    return descriptors.sort((descriptorA, descriptorB) => {
      if (descriptorA.nestingLevel !== descriptorB.nestingLevel) {
        return descriptorA.nestingLevel - descriptorB.nestingLevel
      }

      return descriptorB.area - descriptorA.area
    })
  }

  function renderReviewAnnotationBoxes(state) {
    if (!state.annotationLayer) return
    ensureAnnotationColors(state.annotations)
    const descriptorsByPaintOrder = getAnnotationBoxDescriptors(state.annotations)

    state.annotationLayer.innerHTML = [
      ...state.annotations.map(annotation => getAnnotationPenStrokeMarkup(annotation)),
      getAnnotationPenStrokeMarkup(state.draftAnnotation, 'layoutpilot-review-annotation-pen--draft'),
      ...descriptorsByPaintOrder.map(descriptor => getBoxMarkup(state, descriptor)),
      getDraftBoxMarkup(state.draftAnnotation)
    ].join('')
  }

  function renderReviewMarkers(state) {
    if (!state.markerLayer) return
    ensureAnnotationColors(state.annotations)

    const occupiedRects = []
    const placedMarkers = []

    for (const annotation of state.annotations) {
      const rect = getAnnotationViewportRect(annotation)
      const marker = getMarkerPosition(rect, occupiedRects)
      occupiedRects.push(marker.rect)
      placedMarkers.push({ annotation, rect, marker })
    }

    const connectorMarkup = placedMarkers.map(placed => {
      const connectorClass = placed.annotation.id === state.selectedAnnotationId ? ' layoutpilot-review-connector--selected' : ''
      return getConnectorMarkup(placed.rect, placed.marker, connectorClass, getAnnotationColorStyle(placed.annotation))
    })

    const markerMarkup = placedMarkers.map(({ annotation, marker }) => {
      const selectedClass = annotation.id === state.selectedAnnotationId ? ' layoutpilot-review-marker--selected' : ''
      const colorStyle = getAnnotationColorStyle(annotation)

      return `
        <button
          class="layoutpilot-review-marker${selectedClass}"
          type="button"
          data-layoutpilot-action="review-focus"
          data-layoutpilot-review-id="${annotation.id}"
          style="${colorStyle} left: ${px(marker.x)}; top: ${px(marker.y)};"
          aria-label="Annotation ${annotation.id}"
          title="Annotation ${annotation.id}"
        >${escapeHtml(annotation.id)}</button>
      `
    })

    state.markerLayer.innerHTML = [
      ...connectorMarkup,
      ...markerMarkup
    ].join('')
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

  function areAnnotationsNear(annotationA, annotationB) {
    const rectA = getAnnotationViewportRect(annotationA)
    const rectB = getAnnotationViewportRect(annotationB)
    const distance = getDistance(getRectCenter(rectA), getRectCenter(rectB))

    return distance <= COLOR_NEAR_DISTANCE ||
      intersects(expandRect(rectFromViewportRect(rectA), 24), rectFromViewportRect(rectB))
  }

  function getMarkerRect(x, y) {
    return {
      left: x,
      top: y,
      right: x + MARKER_SIZE,
      bottom: y + MARKER_SIZE
    }
  }

  function clampMarkerPosition(x, y) {
    return {
      x: clamp(x, VIEWPORT_MARGIN, Math.max(VIEWPORT_MARGIN, window.innerWidth - MARKER_SIZE - VIEWPORT_MARGIN)),
      y: clamp(y, VIEWPORT_MARGIN, Math.max(VIEWPORT_MARGIN, window.innerHeight - MARKER_SIZE - VIEWPORT_MARGIN))
    }
  }

  function collides(candidateRect, occupiedRects) {
    const spacedRect = expandRect(candidateRect, MARKER_GAP)
    return occupiedRects.some(occupied => intersects(spacedRect, occupied))
  }

  function getCandidatePositions(rect, distance) {
    const centerX = rect.x + rect.width / 2 - MARKER_SIZE / 2
    const centerY = rect.y + rect.height / 2 - MARKER_SIZE / 2
    const right = rect.x + rect.width + distance
    const bottom = rect.y + rect.height + distance
    const left = rect.x - MARKER_SIZE - distance
    const top = rect.y - MARKER_SIZE - distance

    return [
      { x: left, y: top, displaced: distance > 4 },
      { x: right, y: top, displaced: distance > 4 },
      { x: left, y: bottom, displaced: distance > 4 },
      { x: right, y: bottom, displaced: distance > 4 },
      { x: left, y: centerY, displaced: distance > 4 },
      { x: right, y: centerY, displaced: distance > 4 },
      { x: centerX, y: top, displaced: distance > 4 },
      { x: centerX, y: bottom, displaced: distance > 4 }
    ]
  }

  function getMarkerPosition(rect, occupiedRects) {
    for (const distance of [4, 10, 18, 28, 42, 58, 76]) {
      for (const candidate of getCandidatePositions(rect, distance)) {
        const position = clampMarkerPosition(candidate.x, candidate.y)
        const candidateRect = getMarkerRect(position.x, position.y)
        if (!collides(candidateRect, occupiedRects)) {
          return {
            ...position,
            rect: candidateRect,
            needsConnector: candidate.displaced
          }
        }
      }
    }

    const fallbackBase = getCandidatePositions(rect, 96)[0]
    const fallback = clampMarkerPosition(fallbackBase.x, fallbackBase.y)
    return {
      ...fallback,
      rect: getMarkerRect(fallback.x, fallback.y),
      needsConnector: true
    }
  }

  function shouldShowConnector(placed, placedMarkers) {
    if (placed.marker.needsConnector) return true

    return placedMarkers.some(other => {
      if (other.annotation.id === placed.annotation.id) return false
      return areMarkerRectsNear(placed.marker.rect, other.marker.rect)
    })
  }

  function areMarkerRectsNear(rectA, rectB) {
    if (intersects(expandRect(rectA, MARKER_NEAR_DISTANCE), rectB)) return true

    const centerA = {
      x: rectA.left + (rectA.right - rectA.left) / 2,
      y: rectA.top + (rectA.bottom - rectA.top) / 2
    }
    const centerB = {
      x: rectB.left + (rectB.right - rectB.left) / 2,
      y: rectB.top + (rectB.bottom - rectB.top) / 2
    }

    return getDistance(centerA, centerB) <= MARKER_NEAR_DISTANCE
  }

  function getConnectorMarkup(rect, marker, className, colorStyle) {
    const markerCenterX = marker.x + MARKER_SIZE / 2
    const markerCenterY = marker.y + MARKER_SIZE / 2
    const targetX = clamp(markerCenterX, rect.x, rect.x + rect.width)
    const targetY = clamp(markerCenterY, rect.y, rect.y + rect.height)
    const deltaX = targetX - markerCenterX
    const deltaY = targetY - markerCenterY
    const length = Math.max(1, Math.sqrt(deltaX * deltaX + deltaY * deltaY))
    const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI

    return `
      <div
        class="layoutpilot-review-connector ${className}"
        style="
          ${colorStyle}
          left: ${px(markerCenterX)};
          top: ${px(markerCenterY)};
          width: ${px(length)};
          transform: rotate(${angle}deg);
        "
        aria-hidden="true"
      ></div>
    `
  }

  root.reviewMarkers = {
    renderReviewAnnotationBoxes,
    renderReviewMarkers,
    getAnnotationViewportRect,
    ensureAnnotationColors,
    getAnnotationColor,
    getAnnotationColorStyle
  }
})()
