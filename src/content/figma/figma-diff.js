(() => {
  const root = window.LayoutPilotModules ||= {}
  const { projectRect } = root.figmaAlign

  const DEFAULT_TOLERANCES = {
    position: 2,
    size: 2,
    colorDistance: 12,
    fontSize: 1,
    checkPosition: true,
    checkSize: true,
    checkColor: true,
    checkFontSize: true
  }

  function parseHex(value) {
    const normalized = String(value || '').trim().replace('#', '')
    if (normalized.length < 6) return null
    return {
      r: Number.parseInt(normalized.slice(0, 2), 16),
      g: Number.parseInt(normalized.slice(2, 4), 16),
      b: Number.parseInt(normalized.slice(4, 6), 16)
    }
  }

  function colorDistance(hexA, hexB) {
    const a = parseHex(hexA)
    const b = parseHex(hexB)
    if (!a || !b) return null
    return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2)
  }

  function toComparableColor(value) {
    if (!value || value === '—') return ''
    return String(value).toUpperCase()
  }

  function getDomFontSize(info) {
    return Number.parseFloat(info?.fontSize) || 0
  }

  // designNode: parsed primitive (frame px). domEntry: { rect: {left,top,width,height}, info }.
  // transform maps design -> viewport. Returns { designNode, domEntry, matchedBy, issues: [] }.
  function diffPair(designNode, domEntry, transform, tolerances = {}) {
    const config = { ...DEFAULT_TOLERANCES, ...tolerances }
    const projected = projectRect(transform, designNode.rect)
    const domRect = domEntry.rect
    const issues = []

    if (config.checkPosition) {
      const dx = Math.round(domRect.left - projected.x)
      const dy = Math.round(domRect.top - projected.y)
      if (Math.abs(dx) > config.position || Math.abs(dy) > config.position) {
        issues.push({ kind: 'position', dx, dy })
      }
    }

    if (config.checkSize) {
      const dw = Math.round(domRect.width - projected.width)
      const dh = Math.round(domRect.height - projected.height)
      if (Math.abs(dw) > config.size || Math.abs(dh) > config.size) {
        issues.push({ kind: 'size', dw, dh })
      }
    }

    if (config.checkColor) {
      const designColor = toComparableColor(designNode.fill)
      const actualColor = designNode.type === 'text'
        ? toComparableColor(domEntry.info?.color)
        : toComparableColor(domEntry.info?.background) || toComparableColor(firstBorderColor(domEntry.info))
      if (designColor && actualColor) {
        const distance = colorDistance(designColor, actualColor)
        if (distance != null && distance > config.colorDistance) {
          issues.push({ kind: 'color', design: designColor, actual: actualColor, distance: Math.round(distance) })
        }
      }
    }

    if (config.checkFontSize && designNode.type === 'text' && designNode.fontSize) {
      const designFontSize = designNode.fontSize * (transform.scale || 1)
      const actualFontSize = getDomFontSize(domEntry.info)
      if (actualFontSize && Math.abs(designFontSize - actualFontSize) > config.fontSize) {
        issues.push({
          kind: 'font-size',
          design: Math.round(designFontSize * 10) / 10,
          actual: Math.round(actualFontSize * 10) / 10
        })
      }
    }

    return {
      designNode,
      domEntry,
      matchedBy: designNode.type === 'text' ? 'text' : 'geometry',
      issues
    }
  }

  function firstBorderColor(info) {
    return Array.isArray(info?.borderColors) && info.borderColors.length ? info.borderColors[0] : ''
  }

  function missingResult(designNode) {
    return {
      designNode,
      domEntry: null,
      matchedBy: designNode.type === 'text' ? 'text' : 'geometry',
      issues: [{ kind: 'missing' }]
    }
  }

  function extraResult(domEntry) {
    return {
      designNode: null,
      domEntry,
      matchedBy: 'geometry',
      issues: [{ kind: 'extra' }]
    }
  }

  function summarize(results) {
    const summary = {
      total: results.length,
      divergent: 0,
      position: 0,
      size: 0,
      color: 0,
      fontSize: 0,
      missing: 0,
      extra: 0
    }

    for (const result of results) {
      if (result.issues.length) summary.divergent += 1
      for (const issue of result.issues) {
        if (issue.kind === 'position') summary.position += 1
        else if (issue.kind === 'size') summary.size += 1
        else if (issue.kind === 'color') summary.color += 1
        else if (issue.kind === 'font-size') summary.fontSize += 1
        else if (issue.kind === 'missing') summary.missing += 1
        else if (issue.kind === 'extra') summary.extra += 1
      }
    }

    return summary
  }

  root.figmaDiff = {
    DEFAULT_TOLERANCES,
    diffPair,
    missingResult,
    extraResult,
    summarize,
    colorDistance
  }
})()
