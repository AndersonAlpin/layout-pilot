(() => {
  const root = window.LayoutPilotModules ||= {}

  function fallbackCopy(text) {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;'
    document.documentElement.appendChild(textarea)
    textarea.select()
    const copied = document.execCommand('copy')
    textarea.remove()
    return copied
  }

  async function copyText(text, label, showToast) {
    try {
      if (navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
      } else if (!fallbackCopy(text)) {
        throw new Error('copy failed')
      }
      showToast?.(`${label} copied`)
    } catch {
      showToast?.('Could not copy')
    }
  }

  root.clipboard = {
    fallbackCopy,
    copyText
  }
})()
