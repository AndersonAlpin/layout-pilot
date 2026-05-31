(() => {
  const root = window.LayoutPilotModules ||= {}

  // Vendored pixelmatch (https://github.com/mapbox/pixelmatch) — MIT License,
  // Copyright (c) 2019 Mapbox. Adapted to the IIFE/module pattern, no bundler.

  const defaultOptions = {
    threshold: 0.1,
    includeAA: false,
    alpha: 0.1,
    aaColor: [255, 255, 0],
    diffColor: [255, 0, 0],
    diffColorAlt: null,
    diffMask: false
  }

  function pixelmatch(img1, img2, output, width, height, options) {
    if (!isPixelData(img1) || !isPixelData(img2) || (output && !isPixelData(output))) {
      throw new Error('Image data: Uint8Array, Uint8ClampedArray or Buffer expected.')
    }

    if (img1.length !== img2.length || (output && output.length !== img1.length)) {
      throw new Error('Image sizes do not match.')
    }

    if (img1.length !== width * height * 4) {
      throw new Error('Image data size does not match width/height.')
    }

    const settings = Object.assign({}, defaultOptions, options)

    const len = width * height
    const a32 = new Uint32Array(img1.buffer, img1.byteOffset, len)
    const b32 = new Uint32Array(img2.buffer, img2.byteOffset, len)
    let identical = true

    for (let i = 0; i < len; i++) {
      if (a32[i] !== b32[i]) {
        identical = false
        break
      }
    }
    if (identical) {
      if (output && !settings.diffMask) {
        for (let i = 0; i < len; i++) drawGrayPixel(img1, 4 * i, settings.alpha, output)
      }
      return 0
    }

    const maxDelta = 35215 * settings.threshold * settings.threshold
    let diff = 0
    const [aaR, aaG, aaB] = settings.aaColor
    const [diffR, diffG, diffB] = settings.diffColor
    const [altR, altG, altB] = settings.diffColorAlt || settings.diffColor

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pos = (y * width + x) * 4
        const delta = colorDelta(img1, img2, pos, pos, false)

        if (Math.abs(delta) > maxDelta) {
          if (!settings.includeAA && (antialiased(img1, x, y, width, height, img2) || antialiased(img2, x, y, width, height, img1))) {
            if (output && !settings.diffMask) drawPixel(output, pos, aaR, aaG, aaB)
          } else {
            if (output) {
              if (delta < 0) {
                drawPixel(output, pos, altR, altG, altB)
              } else {
                drawPixel(output, pos, diffR, diffG, diffB)
              }
            }
            diff++
          }
        } else if (output && !settings.diffMask) {
          drawGrayPixel(img1, pos, settings.alpha, output)
        }
      }
    }

    return diff
  }

  function isPixelData(arr) {
    return ArrayBuffer.isView(arr) && arr.constructor.BYTES_PER_ELEMENT === 1
  }

  function antialiased(img, x1, y1, width, height, img2) {
    const x0 = Math.max(x1 - 1, 0)
    const y0 = Math.max(y1 - 1, 0)
    const x2 = Math.min(x1 + 1, width - 1)
    const y2 = Math.min(y1 + 1, height - 1)
    const pos = (y1 * width + x1) * 4
    let zeroes = x1 === x0 || x1 === x2 || y1 === y0 || y1 === y2 ? 1 : 0
    let min = 0
    let max = 0
    let minX = 0
    let minY = 0
    let maxX = 0
    let maxY = 0

    for (let x = x0; x <= x2; x++) {
      for (let y = y0; y <= y2; y++) {
        if (x === x1 && y === y1) continue

        const delta = colorDelta(img, img, pos, (y * width + x) * 4, true)

        if (delta === 0) {
          zeroes++
          if (zeroes > 2) return false
        } else if (delta < min) {
          min = delta
          minX = x
          minY = y
        } else if (delta > max) {
          max = delta
          maxX = x
          maxY = y
        }
      }
    }

    if (min === 0 || max === 0) return false

    return (hasManySiblings(img, minX, minY, width, height) && hasManySiblings(img2, minX, minY, width, height)) ||
      (hasManySiblings(img, maxX, maxY, width, height) && hasManySiblings(img2, maxX, maxY, width, height))
  }

  function hasManySiblings(img, x1, y1, width, height) {
    const x0 = Math.max(x1 - 1, 0)
    const y0 = Math.max(y1 - 1, 0)
    const x2 = Math.min(x1 + 1, width - 1)
    const y2 = Math.min(y1 + 1, height - 1)
    const pos = (y1 * width + x1) * 4
    let zeroes = x1 === x0 || x1 === x2 || y1 === y0 || y1 === y2 ? 1 : 0

    for (let x = x0; x <= x2; x++) {
      for (let y = y0; y <= y2; y++) {
        if (x === x1 && y === y1) continue
        const pos2 = (y * width + x) * 4
        if (img[pos] === img[pos2] &&
          img[pos + 1] === img[pos2 + 1] &&
          img[pos + 2] === img[pos2 + 2] &&
          img[pos + 3] === img[pos2 + 3]) zeroes++
        if (zeroes > 2) return true
      }
    }

    return false
  }

  function colorDelta(img1, img2, k, m, yOnly) {
    let r1 = img1[k + 0]
    let g1 = img1[k + 1]
    let b1 = img1[k + 2]
    let a1 = img1[k + 3]
    let r2 = img2[m + 0]
    let g2 = img2[m + 1]
    let b2 = img2[m + 2]
    let a2 = img2[m + 3]

    if (a1 === a2 && r1 === r2 && g1 === g2 && b1 === b2) return 0

    if (a1 < 255) {
      a1 /= 255
      r1 = blend(r1, a1)
      g1 = blend(g1, a1)
      b1 = blend(b1, a1)
    }

    if (a2 < 255) {
      a2 /= 255
      r2 = blend(r2, a2)
      g2 = blend(g2, a2)
      b2 = blend(b2, a2)
    }

    const y1 = rgb2y(r1, g1, b1)
    const y2 = rgb2y(r2, g2, b2)
    const y = y1 - y2

    if (yOnly) return y

    const i = rgb2i(r1, g1, b1) - rgb2i(r2, g2, b2)
    const q = rgb2q(r1, g1, b1) - rgb2q(r2, g2, b2)

    const delta = 0.5053 * y * y + 0.299 * i * i + 0.1957 * q * q

    return y1 > y2 ? -delta : delta
  }

  function rgb2y(r, g, b) { return r * 0.29889531 + g * 0.58662247 + b * 0.11448223 }
  function rgb2i(r, g, b) { return r * 0.59597799 - g * 0.27417610 - b * 0.32180189 }
  function rgb2q(r, g, b) { return r * 0.21147017 - g * 0.52261711 + b * 0.31114694 }

  function blend(c, a) {
    return 255 + (c - 255) * a
  }

  function drawPixel(output, pos, r, g, b) {
    output[pos + 0] = r
    output[pos + 1] = g
    output[pos + 2] = b
    output[pos + 3] = 255
  }

  function drawGrayPixel(img, i, alpha, output) {
    const r = img[i + 0]
    const g = img[i + 1]
    const b = img[i + 2]
    const val = blend(rgb2y(r, g, b), alpha * img[i + 3] / 255)
    drawPixel(output, i, val, val, val)
  }

  root.pixelmatch = pixelmatch
})()
