(() => {
  const root = window.LayoutPilotModules ||= {}

  const SVG_PATTERN = /<svg[\s\S]*?<\/svg>/i

  function hasSvg(value) {
    return SVG_PATTERN.test(String(value || ''))
  }

  function extractSvg(value) {
    const match = String(value || '').match(SVG_PATTERN)
    return match ? match[0] : ''
  }

  // Reads a paste event's clipboard payload and normalizes it to either a
  // Figma "Copy as SVG" string or a "Copy as PNG" blob.
  // Resolves to { kind: 'svg', svgText } | { kind: 'png', blob } | null.
  // getAsString/getAsFile are kicked off synchronously so the DataTransferItem
  // references stay valid past the event handler.
  function readFromClipboardData(clipboardData) {
    return new Promise(resolve => {
      if (!clipboardData) {
        resolve(null)
        return
      }

      const items = Array.from(clipboardData.items || [])
      const imageItem = items.find(item => item.kind === 'file' && item.type && item.type.startsWith('image/'))
      const fileBlob = imageItem ? imageItem.getAsFile() : null

      const wantedTypes = ['image/svg+xml', 'text/html', 'text/plain']
      const stringItems = items.filter(item => item.kind === 'string' && wantedTypes.includes(item.type))

      if (!stringItems.length) {
        resolve(fileBlob ? { kind: 'png', blob: fileBlob } : null)
        return
      }

      const results = {}
      let pending = stringItems.length

      const finish = () => {
        for (const type of wantedTypes) {
          const value = results[type]
          if (value && hasSvg(value)) {
            resolve({ kind: 'svg', svgText: extractSvg(value) })
            return
          }
        }
        resolve(fileBlob ? { kind: 'png', blob: fileBlob } : null)
      }

      for (const item of stringItems) {
        const type = item.type
        item.getAsString(text => {
          results[type] = text
          pending -= 1
          if (pending === 0) finish()
        })
      }
    })
  }

  root.figmaClipboard = {
    hasSvg,
    extractSvg,
    readFromClipboardData
  }
})()
