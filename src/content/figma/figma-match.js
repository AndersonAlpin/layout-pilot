(() => {
  const root = window.LayoutPilotModules ||= {}
  const { projectRect, rectCenter } = root.figmaAlign

  function normalizeText(value) {
    return String(value || '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
  }

  // domEntries: [{ text, rect, info, element }] — rects already collected (viewport px).
  // Builds an index keyed by normalized text.
  function buildTextIndex(domEntries) {
    const index = new Map()
    for (const entry of domEntries) {
      const key = normalizeText(entry.text)
      if (!key) continue
      if (!index.has(key)) index.set(key, [])
      index.get(key).push(entry)
    }
    return index
  }

  // Matches design text nodes to DOM text entries by normalized string.
  // For repeated text, picks the nearest DOM entry after the global transform.
  // Returns { matches: [{ designNode, domEntry }], unmatchedDesign, anchors }.
  function matchByText(designTextNodes, domEntries, transform) {
    const index = buildTextIndex(domEntries)
    const usedDom = new Set()
    const matches = []
    const unmatchedDesign = []
    const anchors = []

    for (const designNode of designTextNodes) {
      const key = normalizeText(designNode.text)
      const candidates = (index.get(key) || []).filter(entry => !usedDom.has(entry))
      if (!candidates.length) {
        unmatchedDesign.push(designNode)
        continue
      }

      const projected = transform ? projectRect(transform, designNode.rect) : designNode.rect
      const designCenter = rectCenter(projected)

      let best = candidates[0]
      let bestDistance = Infinity
      for (const candidate of candidates) {
        const candidateCenter = rectCenter(candidate.rect)
        const candidateDistance = Math.hypot(candidateCenter.x - designCenter.x, candidateCenter.y - designCenter.y)
        if (candidateDistance < bestDistance) {
          bestDistance = candidateDistance
          best = candidate
        }
      }

      usedDom.add(best)
      matches.push({ designNode, domEntry: best })

      const designIsUnique = (index.get(key) || []).length === 1
      const domIsUnique = domEntries.filter(entry => normalizeText(entry.text) === key).length === 1
      if (designIsUnique && domIsUnique) {
        anchors.push({
          design: rectCenter(designNode.rect),
          dom: rectCenter(best.rect)
        })
      }
    }

    return { matches, unmatchedDesign, anchors }
  }

  // Matches non-text design nodes (image/icon/rect) to DOM candidates by nearest
  // center with a size tolerance. Greedy one-to-one.
  // domCandidates: [{ rect, info, element }]
  function matchByGeometry(designNodes, domCandidates, transform, options = {}) {
    const sizeTolerance = options.sizeTolerance ?? 0.4
    const maxCenterDistance = options.maxCenterDistance ?? 80
    const usedDom = new Set()
    const matches = []
    const unmatchedDesign = []

    for (const designNode of designNodes) {
      const projected = projectRect(transform, designNode.rect)
      const designCenter = rectCenter(projected)

      let best = null
      let bestScore = Infinity
      for (const candidate of domCandidates) {
        if (usedDom.has(candidate)) continue

        const candidateCenter = rectCenter(candidate.rect)
        const centerDistance = Math.hypot(candidateCenter.x - designCenter.x, candidateCenter.y - designCenter.y)
        if (centerDistance > maxCenterDistance) continue

        const widthRatio = relativeDelta(projected.width, candidate.rect.width)
        const heightRatio = relativeDelta(projected.height, candidate.rect.height)
        if (widthRatio > sizeTolerance && heightRatio > sizeTolerance) continue

        const score = centerDistance + (widthRatio + heightRatio) * 20
        if (score < bestScore) {
          bestScore = score
          best = candidate
        }
      }

      if (best) {
        usedDom.add(best)
        matches.push({ designNode, domEntry: best })
      } else {
        unmatchedDesign.push(designNode)
      }
    }

    const unmatchedDom = domCandidates.filter(candidate => !usedDom.has(candidate))
    return { matches, unmatchedDesign, unmatchedDom }
  }

  function relativeDelta(a, b) {
    const max = Math.max(Math.abs(a), Math.abs(b), 1)
    return Math.abs(a - b) / max
  }

  root.figmaMatch = {
    normalizeText,
    buildTextIndex,
    matchByText,
    matchByGeometry
  }
})()
