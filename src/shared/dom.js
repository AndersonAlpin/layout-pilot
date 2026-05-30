(() => {
  const root = window.LayoutPilotModules ||= {}

  function createElement(className) {
    const element = document.createElement('div')
    element.className = className
    document.documentElement.appendChild(element)
    return element
  }

  function isTypingTarget(target) {
    if (!(target instanceof Element)) return false
    const tagName = target.tagName?.toLowerCase()
    return tagName === 'input' ||
      tagName === 'textarea' ||
      tagName === 'select' ||
      target.isContentEditable ||
      !!target.closest?.('[contenteditable="true"], [role="textbox"]')
  }

  function px(value) {
    return `${Math.round(value)}px`
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max)
  }

  function getAnchoredTooltipPosition(pointer, anchorRect, tooltipRect, viewport, options = {}) {
    const offset = options.offset ?? 14
    const margin = options.margin ?? 12
    const width = tooltipRect.width || 0
    const height = tooltipRect.height || 0
    const viewportWidth = viewport.width
    const viewportHeight = viewport.height
    const maxLeft = Math.max(margin, viewportWidth - width - margin)
    const maxTop = Math.max(margin, viewportHeight - height - margin)
    const rightFromPointer = pointer.x + offset
    const bottomFromPointer = pointer.y + offset
    const leftOfAnchor = anchorRect.left - width - offset
    const topOfAnchor = anchorRect.top - height - offset
    const leftOfPointer = pointer.x - width - offset
    const topOfPointer = pointer.y - height - offset

    const left = rightFromPointer + width <= viewportWidth - margin
      ? rightFromPointer
      : leftOfAnchor >= margin
        ? leftOfAnchor
        : clamp(leftOfPointer, margin, maxLeft)

    const top = bottomFromPointer + height <= viewportHeight - margin
      ? bottomFromPointer
      : topOfAnchor >= margin
        ? topOfAnchor
        : clamp(topOfPointer, margin, maxTop)

    return {
      left: Math.round(left),
      top: Math.round(top)
    }
  }

  function getContainedTooltipPosition(pointer, innerRect, tooltipRect, viewport, options = {}) {
    const offset = options.offset ?? 16
    const margin = options.margin ?? 12
    const width = tooltipRect.width || 0
    const height = tooltipRect.height || 0
    const maxLeft = Math.max(margin, viewport.width - width - margin)
    const maxTop = Math.max(margin, viewport.height - height - margin)
    const centerX = innerRect.left + innerRect.width / 2
    const centerY = innerRect.top + innerRect.height / 2

    const candidates = [
      { left: innerRect.right + offset, top: innerRect.bottom + offset },
      { left: innerRect.left - width - offset, top: innerRect.bottom + offset },
      { left: innerRect.right + offset, top: innerRect.top - height - offset },
      { left: innerRect.left - width - offset, top: innerRect.top - height - offset }
    ]

    const bestCandidate = candidates
      .map(candidate => {
        const left = clamp(candidate.left, margin, maxLeft)
        const top = clamp(candidate.top, margin, maxTop)
        const crossesVerticalGuide = centerX >= left && centerX <= left + width
        const crossesHorizontalGuide = centerY >= top && centerY <= top + height
        const guidePenalty = (crossesVerticalGuide ? 100000 : 0) + (crossesHorizontalGuide ? 100000 : 0)
        const clampPenalty = Math.abs(left - candidate.left) + Math.abs(top - candidate.top)
        const pointerDistance = Math.hypot(left - pointer.x, top - pointer.y)

        return {
          left: Math.round(left),
          top: Math.round(top),
          score: guidePenalty + clampPenalty + pointerDistance / 10
        }
      })
      .sort((a, b) => a.score - b.score)[0]

    return {
      left: bestCandidate.left,
      top: bestCandidate.top
    }
  }

  function getDistanceLabelPosition(orientation, lineRect, labelRect, viewport, options = {}) {
    const offset = options.offset ?? 8
    const margin = options.margin ?? 8
    const labelWidth = labelRect.width || 0
    const labelHeight = labelRect.height || 0
    const centerX = lineRect.left + lineRect.width / 2
    const centerY = lineRect.top + lineRect.height / 2

    if (orientation === 'vertical') {
      const minY = margin + labelHeight / 2
      const maxY = Math.max(minY, viewport.height - margin - labelHeight / 2)
      const leftPlacement = lineRect.left - offset

      if (leftPlacement - labelWidth >= margin) {
        return {
          left: Math.round(leftPlacement),
          top: Math.round(clamp(centerY, minY, maxY)),
          placement: 'left'
        }
      }

      return {
        left: Math.round(lineRect.left + lineRect.width + offset),
        top: Math.round(clamp(centerY, minY, maxY)),
        placement: 'right'
      }
    }

    const minX = margin + labelWidth / 2
    const maxX = Math.max(minX, viewport.width - margin - labelWidth / 2)
    const abovePlacement = lineRect.top - offset

    if (abovePlacement - labelHeight >= margin) {
      return {
        left: Math.round(clamp(centerX, minX, maxX)),
        top: Math.round(abovePlacement),
        placement: 'above'
      }
    }

    const maxTop = Math.max(margin, viewport.height - margin - labelHeight)

    return {
      left: Math.round(clamp(centerX, minX, maxX)),
      top: Math.round(clamp(lineRect.top + lineRect.height + offset, margin, maxTop)),
      placement: 'below'
    }
  }

  function getElementBandAlignment(baseRect, targetRect, options = {}) {
    const centerTolerance = options.centerTolerance ?? options.tolerance ?? 0.5
    const bandTolerance = options.bandTolerance ?? options.tolerance ?? 0.5
    const horizontalGap = targetRect.left > baseRect.right
      ? targetRect.left - baseRect.right
      : baseRect.left > targetRect.right
        ? baseRect.left - targetRect.right
        : 0
    const verticalGap = targetRect.top > baseRect.bottom
      ? targetRect.top - baseRect.bottom
      : baseRect.top > targetRect.bottom
        ? baseRect.top - targetRect.bottom
        : 0
    const compareVerticalBand = verticalGap > horizontalGap
    const baseCenterX = baseRect.left + baseRect.width / 2
    const targetCenterX = targetRect.left + targetRect.width / 2
    const centerDelta = targetCenterX - baseCenterX
    const startDelta = targetRect.top - baseRect.top
    const endDelta = targetRect.bottom - baseRect.bottom
    const averageBandDelta = (startDelta + endDelta) / 2

    if (compareVerticalBand) {
      if (Math.abs(centerDelta) < centerTolerance) {
        return {
          aligned: true,
          offset: 0,
          direction: 'aligned'
        }
      }

      return {
        aligned: false,
        offset: Math.round(Math.abs(centerDelta)),
        direction: centerDelta > 0 ? 'right' : 'left'
      }
    }

    if (Math.abs(startDelta) < bandTolerance && Math.abs(endDelta) < bandTolerance) {
      return {
        aligned: true,
        offset: 0,
        direction: 'aligned'
      }
    }

    if (Math.abs(startDelta - endDelta) <= bandTolerance) {
      return {
        aligned: false,
        offset: Math.round(Math.abs(averageBandDelta)),
        direction: averageBandDelta > 0 ? 'below' : 'above'
      }
    }

    return {
      aligned: false,
      offset: 0,
      direction: 'misaligned'
    }
  }

  function rectContainsRect(outerRect, innerRect, options = {}) {
    const tolerance = options.tolerance ?? 0.5
    return innerRect.left >= outerRect.left - tolerance &&
      innerRect.top >= outerRect.top - tolerance &&
      innerRect.right <= outerRect.right + tolerance &&
      innerRect.bottom <= outerRect.bottom + tolerance &&
      (
        innerRect.left > outerRect.left + tolerance ||
        innerRect.top > outerRect.top + tolerance ||
        innerRect.right < outerRect.right - tolerance ||
        innerRect.bottom < outerRect.bottom - tolerance
      )
  }

  function getContainedRectPair(rectA, rectB, options = {}) {
    if (rectContainsRect(rectA, rectB, options)) {
      return {
        outerRect: rectA,
        innerRect: rectB
      }
    }

    if (rectContainsRect(rectB, rectA, options)) {
      return {
        outerRect: rectB,
        innerRect: rectA
      }
    }

    return null
  }

  function addContainedDistanceSegment(segments, orientation, left, top, width, height, distance) {
    const roundedDistance = Math.round(distance)
    if (roundedDistance <= 0) return

    segments.push({
      orientation,
      left: Math.round(left),
      top: Math.round(top),
      width: Math.round(width),
      height: Math.round(height),
      distance: roundedDistance
    })
  }

  function getContainedDistanceSegments(rectA, rectB, options = {}) {
    const containedPair = getContainedRectPair(rectA, rectB, options)
    if (!containedPair) return null

    const { outerRect, innerRect } = containedPair
    const segments = []
    const lineSize = options.lineSize ?? 2
    const innerCenterX = innerRect.left + innerRect.width / 2
    const innerCenterY = innerRect.top + innerRect.height / 2

    addContainedDistanceSegment(
      segments,
      'vertical',
      innerCenterX,
      outerRect.top,
      lineSize,
      innerRect.top - outerRect.top,
      innerRect.top - outerRect.top
    )
    addContainedDistanceSegment(
      segments,
      'vertical',
      innerCenterX,
      innerRect.bottom,
      lineSize,
      outerRect.bottom - innerRect.bottom,
      outerRect.bottom - innerRect.bottom
    )
    addContainedDistanceSegment(
      segments,
      'horizontal',
      outerRect.left,
      innerCenterY,
      innerRect.left - outerRect.left,
      lineSize,
      innerRect.left - outerRect.left
    )
    addContainedDistanceSegment(
      segments,
      'horizontal',
      innerRect.right,
      innerCenterY,
      outerRect.right - innerRect.right,
      lineSize,
      outerRect.right - innerRect.right
    )

    return segments
  }

  function setBox(element, rect) {
    element.style.display = 'block'
    element.style.left = px(rect.left)
    element.style.top = px(rect.top)
    element.style.width = px(rect.width)
    element.style.height = px(rect.height)
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  function formatBoxValues(styles, prefix) {
    return `${styles[`${prefix}Top`]} ${styles[`${prefix}Right`]} ${styles[`${prefix}Bottom`]} ${styles[`${prefix}Left`]}`
  }

  function formatRadiusValues(styles) {
    return `${styles.borderTopLeftRadius} ${styles.borderTopRightRadius} ${styles.borderBottomRightRadius} ${styles.borderBottomLeftRadius}`
  }

  function formatGapValues(styles) {
    if (!['flex', 'inline-flex', 'grid', 'inline-grid'].includes(styles.display)) return '—'

    const rowGap = styles.rowGap
    const columnGap = styles.columnGap
    const normalized = [rowGap, columnGap].map(value => String(value).trim())

    if (normalized.every(value => value === 'normal' || value === '0px')) return '—'
    if (normalized[0] === normalized[1]) return normalized[0]

    return `${rowGap} / ${columnGap}`
  }

  function rgbToHex(value) {
    if (!value || value === 'transparent') return value || ''

    const match = String(value).match(/rgba?\(([^)]+)\)/i)
    if (!match) return value

    const parts = match[1].split(',').map(part => part.trim())
    const [r, g, b] = parts.slice(0, 3).map(part => {
      if (part.endsWith('%')) return Math.round(Number(part.slice(0, -1)) * 2.55)
      return Number.parseInt(part, 10)
    })
    const alpha = parts[3] !== undefined ? Number.parseFloat(parts[3]) : 1

    if ([r, g, b].some(number => Number.isNaN(number))) return value

    const hex = [r, g, b]
      .map(number => Math.max(0, Math.min(255, number)).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()

    if (alpha >= 0 && alpha < 1) {
      const alphaHex = Math.round(alpha * 255).toString(16).padStart(2, '0').toUpperCase()
      return `#${hex}${alphaHex}`
    }

    return `#${hex}`
  }

  function isTransparentColor(value) {
    const normalized = String(value || '').trim().toLowerCase()
    return !normalized ||
      normalized === 'transparent' ||
      normalized === 'rgba(0, 0, 0, 0)' ||
      /rgba?\([^)]*,\s*0\s*\)$/i.test(normalized)
  }

  function formatColor(value) {
    const normalized = String(value || '').trim()
    if (!normalized || isTransparentColor(normalized)) return '—'
    return rgbToHex(normalized)
  }

  function isCssValueUseful(value) {
    return value !== undefined && value !== null && value !== '' && value !== '—'
  }

  function isZeroBoxValue(value) {
    return String(value || '').split(/\s+/).every(part => Number.parseFloat(part) === 0)
  }

  root.dom = {
    createElement,
    isTypingTarget,
    px,
    getAnchoredTooltipPosition,
    getContainedTooltipPosition,
    getDistanceLabelPosition,
    getElementBandAlignment,
    getContainedRectPair,
    getContainedDistanceSegments,
    setBox,
    escapeHtml,
    formatBoxValues,
    formatRadiusValues,
    formatGapValues,
    rgbToHex,
    isTransparentColor,
    formatColor,
    isCssValueUseful,
    isZeroBoxValue
  }
})()
