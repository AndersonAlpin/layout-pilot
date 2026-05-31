(() => {
  const root = window.LayoutPilotModules ||= {}

  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y)
  }

  function median(values) {
    if (!values.length) return null
    const sorted = [...values].sort((a, b) => a - b)
    const middle = Math.floor(sorted.length / 2)
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
  }

  // anchors: [{ design: {x, y}, dom: {x, y} }, ...]
  // options: { frameWidth, domWidth, originX, originY }
  // Returns { scale, offsetX, offsetY } mapping design (frame px) -> viewport px.
  function computeTransform(anchors, options = {}) {
    const valid = (anchors || []).filter(anchor => anchor?.design && anchor?.dom)
    let scale = null

    if (valid.length >= 2) {
      const ratios = []
      for (let i = 0; i < valid.length; i += 1) {
        for (let j = i + 1; j < valid.length; j += 1) {
          const designDistance = distance(valid[i].design, valid[j].design)
          const domDistance = distance(valid[i].dom, valid[j].dom)
          if (designDistance > 1) ratios.push(domDistance / designDistance)
        }
      }
      scale = median(ratios)
    }

    if ((scale == null || !Number.isFinite(scale) || scale <= 0) && options.frameWidth > 0 && options.domWidth > 0) {
      scale = options.domWidth / options.frameWidth
    }

    if (scale == null || !Number.isFinite(scale) || scale <= 0) scale = 1

    if (!valid.length) {
      return {
        scale,
        offsetX: options.originX || 0,
        offsetY: options.originY || 0,
        anchorCount: 0
      }
    }

    let offsetX = 0
    let offsetY = 0
    for (const anchor of valid) {
      offsetX += anchor.dom.x - anchor.design.x * scale
      offsetY += anchor.dom.y - anchor.design.y * scale
    }

    return {
      scale,
      offsetX: offsetX / valid.length,
      offsetY: offsetY / valid.length,
      anchorCount: valid.length
    }
  }

  function projectPoint(transform, x, y) {
    return {
      x: x * transform.scale + transform.offsetX,
      y: y * transform.scale + transform.offsetY
    }
  }

  function projectRect(transform, rect) {
    return {
      x: rect.x * transform.scale + transform.offsetX,
      y: rect.y * transform.scale + transform.offsetY,
      width: rect.width * transform.scale,
      height: rect.height * transform.scale
    }
  }

  function rectCenter(rect) {
    const left = rect.x ?? rect.left ?? 0
    const top = rect.y ?? rect.top ?? 0
    return {
      x: left + rect.width / 2,
      y: top + rect.height / 2
    }
  }

  function nudge(transform, dx, dy) {
    return {
      ...transform,
      offsetX: transform.offsetX + dx,
      offsetY: transform.offsetY + dy
    }
  }

  root.figmaAlign = {
    computeTransform,
    projectPoint,
    projectRect,
    rectCenter,
    nudge
  }
})()
