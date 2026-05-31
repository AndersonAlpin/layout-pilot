(() => {
  const root = window.LayoutPilotModules ||= {}
  const { rgbToHex } = root.dom

  const NAMED_COLORS = {
    white: '#FFFFFF',
    black: '#000000',
    red: '#FF0000',
    green: '#008000',
    blue: '#0000FF',
    gray: '#808080',
    grey: '#808080',
    transparent: ''
  }

  function getNumbers(value) {
    return String(value || '')
      .match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi)
      ?.map(Number)
      .filter(number => !Number.isNaN(number)) || []
  }

  function firstNumber(value, fallback = 0) {
    const numbers = getNumbers(value)
    return numbers.length ? numbers[0] : fallback
  }

  function normalizeColor(value) {
    const normalized = String(value || '').trim().toLowerCase()
    if (!normalized || normalized === 'none' || normalized === 'transparent') return ''
    if (NAMED_COLORS[normalized] !== undefined) return NAMED_COLORS[normalized]

    if (normalized.startsWith('#')) {
      const hex = normalized.slice(1)
      if (hex.length === 3) {
        return `#${hex.split('').map(char => char + char).join('').toUpperCase()}`
      }
      return `#${hex.toUpperCase()}`
    }

    if (normalized.startsWith('rgb')) {
      const hex = rgbToHex(normalized)
      return typeof hex === 'string' ? hex.toUpperCase() : ''
    }

    return ''
  }

  function multiply(m1, m2) {
    return [
      m1[0] * m2[0] + m1[2] * m2[1],
      m1[1] * m2[0] + m1[3] * m2[1],
      m1[0] * m2[2] + m1[2] * m2[3],
      m1[1] * m2[2] + m1[3] * m2[3],
      m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
      m1[1] * m2[4] + m1[3] * m2[5] + m1[5]
    ]
  }

  function toMatrix(fn, args) {
    if (fn === 'matrix' && args.length >= 6) return args.slice(0, 6)
    if (fn === 'translate') return [1, 0, 0, 1, args[0] || 0, args[1] || 0]
    if (fn === 'scale') return [args[0] || 1, 0, 0, args.length > 1 ? args[1] : (args[0] || 1), 0, 0]
    if (fn === 'rotate') {
      const radians = (args[0] || 0) * Math.PI / 180
      const cos = Math.cos(radians)
      const sin = Math.sin(radians)
      // rotate(angle cx cy) -> translate(cx,cy) rotate translate(-cx,-cy)
      if (args.length >= 3) {
        const [, cx, cy] = args
        let m = [1, 0, 0, 1, cx, cy]
        m = multiply(m, [cos, sin, -sin, cos, 0, 0])
        return multiply(m, [1, 0, 0, 1, -cx, -cy])
      }
      return [cos, sin, -sin, cos, 0, 0]
    }
    return [1, 0, 0, 1, 0, 0]
  }

  function parseTransform(value) {
    let matrix = [1, 0, 0, 1, 0, 0]
    const regex = /(\w+)\s*\(([^)]*)\)/g
    let match
    while ((match = regex.exec(value || ''))) {
      matrix = multiply(matrix, toMatrix(match[1], getNumbers(match[2])))
    }
    return matrix
  }

  function applyMatrix(matrix, x, y) {
    return {
      x: matrix[0] * x + matrix[2] * y + matrix[4],
      y: matrix[1] * x + matrix[3] * y + matrix[5]
    }
  }

  function transformBox(matrix, x, y, width, height) {
    const corners = [
      applyMatrix(matrix, x, y),
      applyMatrix(matrix, x + width, y),
      applyMatrix(matrix, x, y + height),
      applyMatrix(matrix, x + width, y + height)
    ]
    const xs = corners.map(point => point.x)
    const ys = corners.map(point => point.y)
    const minX = Math.min(...xs)
    const minY = Math.min(...ys)
    return {
      x: minX,
      y: minY,
      width: Math.max(...xs) - minX,
      height: Math.max(...ys) - minY
    }
  }

  function getStyleValue(element, property) {
    const style = element.getAttribute('style')
    if (!style) return ''
    const match = style.match(new RegExp(`(?:^|;)\\s*${property}\\s*:\\s*([^;]+)`, 'i'))
    return match ? match[1].trim() : ''
  }

  function getAttr(element, name, inherited) {
    return element.getAttribute(name) || getStyleValue(element, name) || inherited || ''
  }

  function getLocalBoundingBox(element) {
    const tag = element.tagName.toLowerCase()

    if (tag === 'rect' || tag === 'image') {
      return {
        x: firstNumber(element.getAttribute('x')),
        y: firstNumber(element.getAttribute('y')),
        width: firstNumber(element.getAttribute('width')),
        height: firstNumber(element.getAttribute('height'))
      }
    }

    if (tag === 'circle') {
      const cx = firstNumber(element.getAttribute('cx'))
      const cy = firstNumber(element.getAttribute('cy'))
      const radius = firstNumber(element.getAttribute('r'))
      return { x: cx - radius, y: cy - radius, width: radius * 2, height: radius * 2 }
    }

    if (tag === 'ellipse') {
      const cx = firstNumber(element.getAttribute('cx'))
      const cy = firstNumber(element.getAttribute('cy'))
      const rx = firstNumber(element.getAttribute('rx'))
      const ry = firstNumber(element.getAttribute('ry'))
      return { x: cx - rx, y: cy - ry, width: rx * 2, height: ry * 2 }
    }

    if (tag === 'line') {
      const xs = [firstNumber(element.getAttribute('x1')), firstNumber(element.getAttribute('x2'))]
      const ys = [firstNumber(element.getAttribute('y1')), firstNumber(element.getAttribute('y2'))]
      return { x: Math.min(...xs), y: Math.min(...ys), width: Math.abs(xs[1] - xs[0]), height: Math.abs(ys[1] - ys[0]) }
    }

    if (tag === 'polygon' || tag === 'polyline') {
      const numbers = getNumbers(element.getAttribute('points'))
      return boundingBoxFromPairs(numbers)
    }

    if (tag === 'path') {
      const numbers = getNumbers(element.getAttribute('d'))
      return boundingBoxFromPairs(numbers)
    }

    return null
  }

  function boundingBoxFromPairs(numbers) {
    if (numbers.length < 2) return null
    const xs = []
    const ys = []
    for (let index = 0; index + 1 < numbers.length; index += 2) {
      xs.push(numbers[index])
      ys.push(numbers[index + 1])
    }
    const minX = Math.min(...xs)
    const minY = Math.min(...ys)
    return { x: minX, y: minY, width: Math.max(...xs) - minX, height: Math.max(...ys) - minY }
  }

  function buildTextNode(element, matrix, inheritedFill) {
    const text = (element.textContent || '').replace(/\s+/g, ' ').trim()
    if (!text) return null

    const tspan = element.querySelector('tspan')
    const fontSize = firstNumber(getAttr(element, 'font-size', getAttr(tspan || element, 'font-size')), 0) || 16
    const fontWeight = firstNumber(getAttr(element, 'font-weight', '')) || undefined
    const fill = normalizeColor(getAttr(element, 'fill', inheritedFill))
    const x = firstNumber(tspan?.getAttribute('x') ?? element.getAttribute('x'))
    const y = firstNumber(tspan?.getAttribute('y') ?? element.getAttribute('y'))
    const estimatedWidth = firstNumber(element.getAttribute('textLength')) || text.length * fontSize * 0.55
    // SVG text y is the baseline; approximate the line-box top by the ascent.
    const localBox = { x, y: y - fontSize * 0.8, width: estimatedWidth, height: fontSize * 1.2 }
    const box = transformBox(matrix, localBox.x, localBox.y, localBox.width, localBox.height)

    return {
      type: 'text',
      text,
      rect: roundRect(box),
      fontSize: Math.round(fontSize * (matrix[3] || 1) * 100) / 100,
      fontWeight,
      fill
    }
  }

  function buildRectNode(element, matrix, inheritedFill) {
    const local = getLocalBoundingBox(element)
    if (!local || local.width <= 0 || local.height <= 0) return null
    const box = transformBox(matrix, local.x, local.y, local.width, local.height)
    return {
      type: 'rect',
      rect: roundRect(box),
      fill: normalizeColor(getAttr(element, 'fill', inheritedFill)),
      stroke: normalizeColor(getAttr(element, 'stroke', '')),
      radius: firstNumber(element.getAttribute('rx')) || firstNumber(element.getAttribute('ry')) || 0
    }
  }

  function buildImageNode(element, matrix) {
    const local = getLocalBoundingBox(element)
    if (!local || local.width <= 0 || local.height <= 0) return null
    const box = transformBox(matrix, local.x, local.y, local.width, local.height)
    return {
      type: 'image',
      rect: roundRect(box),
      href: element.getAttribute('href') || element.getAttribute('xlink:href') || ''
    }
  }

  function buildIconNode(element, matrix, inheritedFill) {
    const local = getLocalBoundingBox(element)
    if (!local || (local.width <= 0 && local.height <= 0)) return null
    const box = transformBox(matrix, local.x, local.y, local.width, local.height)
    if (box.width <= 0 && box.height <= 0) return null
    return {
      type: 'icon',
      rect: roundRect(box),
      fill: normalizeColor(getAttr(element, 'fill', inheritedFill)),
      stroke: normalizeColor(getAttr(element, 'stroke', ''))
    }
  }

  function roundRect(rect) {
    return {
      x: Math.round(rect.x * 100) / 100,
      y: Math.round(rect.y * 100) / 100,
      width: Math.round(rect.width * 100) / 100,
      height: Math.round(rect.height * 100) / 100
    }
  }

  const ICON_TAGS = new Set(['path', 'circle', 'ellipse', 'line', 'polygon', 'polyline'])

  function traverse(element, parentMatrix, inheritedFill, nodes) {
    for (const child of Array.from(element.children || [])) {
      const tag = child.tagName.toLowerCase()
      if (tag === 'defs' || tag === 'clippath' || tag === 'lineargradient' || tag === 'radialgradient' || tag === 'pattern' || tag === 'mask') {
        continue
      }

      const localMatrix = parseTransform(child.getAttribute('transform'))
      const matrix = multiply(parentMatrix, localMatrix)
      const fill = getAttr(child, 'fill', '') || inheritedFill

      if (tag === 'g' || tag === 'svg') {
        traverse(child, matrix, fill, nodes)
        continue
      }

      let node = null
      if (tag === 'text') node = buildTextNode(child, matrix, inheritedFill)
      else if (tag === 'rect') node = buildRectNode(child, matrix, inheritedFill)
      else if (tag === 'image') node = buildImageNode(child, matrix)
      else if (ICON_TAGS.has(tag)) node = buildIconNode(child, matrix, inheritedFill)

      if (node) nodes.push(node)

      if (child.children && child.children.length && tag !== 'text') {
        traverse(child, matrix, fill, nodes)
      }
    }
  }

  function getFrameSize(svg) {
    const widthAttr = firstNumber(svg.getAttribute('width'))
    const heightAttr = firstNumber(svg.getAttribute('height'))
    const viewBox = getNumbers(svg.getAttribute('viewBox'))

    const width = widthAttr || (viewBox.length === 4 ? viewBox[2] : 0)
    const height = heightAttr || (viewBox.length === 4 ? viewBox[3] : 0)
    return { width: Math.round(width), height: Math.round(height) }
  }

  function parseFigmaSvg(svgText) {
    const parser = new DOMParser()
    const doc = parser.parseFromString(String(svgText || ''), 'image/svg+xml')
    const svg = doc.querySelector('svg')
    if (!svg || doc.querySelector('parsererror')) {
      return { frame: { width: 0, height: 0 }, nodes: [] }
    }

    const frame = getFrameSize(svg)
    const nodes = []
    const baseMatrix = parseTransform(svg.getAttribute('transform'))
    traverse(svg, baseMatrix, '', nodes)

    return { frame, nodes }
  }

  root.figmaSvgParser = {
    parseFigmaSvg,
    normalizeColor,
    parseTransform,
    transformBox
  }
})()
