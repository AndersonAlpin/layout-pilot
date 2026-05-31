(() => {
  const root = window.LayoutPilotModules ||= {}

  function loadImageFromUrl(url) {
    return new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('Could not load image for pixel diff.'))
      image.src = url
    })
  }

  function svgToDataUrl(svgText) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(String(svgText || ''))}`
  }

  function blobToObjectUrl(blob) {
    return URL.createObjectURL(blob)
  }

  function clampRegion(region, width, height) {
    const left = Math.max(0, Math.floor(region.left))
    const top = Math.max(0, Math.floor(region.top))
    const right = Math.min(width, Math.ceil(region.left + region.width))
    const bottom = Math.min(height, Math.ceil(region.top + region.height))
    return {
      left,
      top,
      width: Math.max(0, right - left),
      height: Math.max(0, bottom - top)
    }
  }

  // options: { frame, transform, designSvgText?, designBlob? }
  // Captures the visible tab, rasterizes the design at the same placement and
  // runs pixelmatch over the overlapping region. Returns a heatmap data URL plus
  // the diff ratio and the CSS-px region to position it.
  async function runPixelDiff(options = {}) {
    const reviewSnapshot = root.reviewSnapshot
    const pixelmatch = root.pixelmatch
    if (!reviewSnapshot?.requestVisibleTabCapture || typeof pixelmatch !== 'function') {
      return { ok: false, error: { message: 'Pixel diff dependencies unavailable.' } }
    }

    const { frame, transform } = options
    if (!frame?.width || !frame?.height || !transform) {
      return { ok: false, error: { message: 'Missing frame or transform for pixel diff.' } }
    }

    let designObjectUrl = null

    try {
      const captureDataUrl = await reviewSnapshot.requestVisibleTabCapture()
      const captureImage = await loadImageFromUrl(captureDataUrl)

      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const deviceScaleX = captureImage.width / Math.max(1, viewportWidth)
      const deviceScaleY = captureImage.height / Math.max(1, viewportHeight)

      const cssRegion = {
        left: transform.offsetX,
        top: transform.offsetY,
        width: frame.width * transform.scale,
        height: frame.height * transform.scale
      }
      const deviceRegion = clampRegion({
        left: cssRegion.left * deviceScaleX,
        top: cssRegion.top * deviceScaleY,
        width: cssRegion.width * deviceScaleX,
        height: cssRegion.height * deviceScaleY
      }, captureImage.width, captureImage.height)

      if (deviceRegion.width < 2 || deviceRegion.height < 2) {
        return { ok: false, error: { message: 'Design is outside the visible viewport.' } }
      }

      // Actual layer (captured viewport) cropped to the design region.
      const actualCanvas = document.createElement('canvas')
      actualCanvas.width = deviceRegion.width
      actualCanvas.height = deviceRegion.height
      const actualCtx = actualCanvas.getContext('2d', { willReadFrequently: true })
      actualCtx.drawImage(
        captureImage,
        deviceRegion.left, deviceRegion.top, deviceRegion.width, deviceRegion.height,
        0, 0, deviceRegion.width, deviceRegion.height
      )

      // Design layer rendered at the same placement, white background.
      designObjectUrl = options.designBlob
        ? blobToObjectUrl(options.designBlob)
        : svgToDataUrl(options.designSvgText)
      const designImage = await loadImageFromUrl(designObjectUrl)

      const designCanvas = document.createElement('canvas')
      designCanvas.width = deviceRegion.width
      designCanvas.height = deviceRegion.height
      const designCtx = designCanvas.getContext('2d', { willReadFrequently: true })
      designCtx.fillStyle = '#ffffff'
      designCtx.fillRect(0, 0, deviceRegion.width, deviceRegion.height)
      designCtx.drawImage(
        designImage,
        0, 0, frame.width, frame.height,
        cssRegion.left * deviceScaleX - deviceRegion.left,
        cssRegion.top * deviceScaleY - deviceRegion.top,
        cssRegion.width * deviceScaleX,
        cssRegion.height * deviceScaleY
      )

      const actualData = actualCtx.getImageData(0, 0, deviceRegion.width, deviceRegion.height)
      const designData = designCtx.getImageData(0, 0, deviceRegion.width, deviceRegion.height)
      const diffCanvas = document.createElement('canvas')
      diffCanvas.width = deviceRegion.width
      diffCanvas.height = deviceRegion.height
      const diffCtx = diffCanvas.getContext('2d')
      const diffData = diffCtx.createImageData(deviceRegion.width, deviceRegion.height)

      const diffPixels = pixelmatch(
        designData.data,
        actualData.data,
        diffData.data,
        deviceRegion.width,
        deviceRegion.height,
        { threshold: options.threshold ?? 0.12, diffMask: true, diffColor: [255, 45, 85] }
      )
      diffCtx.putImageData(diffData, 0, 0)

      const total = deviceRegion.width * deviceRegion.height
      return {
        ok: true,
        diffPixels,
        total,
        diffRatio: total ? diffPixels / total : 0,
        dataUrl: diffCanvas.toDataURL('image/png'),
        region: cssRegion
      }
    } catch (error) {
      return { ok: false, error: { message: error?.message || 'Pixel diff failed.' } }
    } finally {
      if (designObjectUrl && options.designBlob) URL.revokeObjectURL(designObjectUrl)
    }
  }

  root.figmaPixel = {
    runPixelDiff
  }
})()
