(() => {
  const root = window.LayoutPilotModules ||= {}
  const { isTypingTarget } = root.dom

  function normalizeKey(event) {
    const key = event.key
    return key.length === 1 ? key.toLowerCase() : key
  }

  function shouldIgnoreShortcut(event) {
    return isTypingTarget(event.target)
  }

  function consumeShortcut(event) {
    event.preventDefault()
    event.stopPropagation()
  }

  root.shortcuts = {
    normalizeKey,
    shouldIgnoreShortcut,
    consumeShortcut
  }
})()
