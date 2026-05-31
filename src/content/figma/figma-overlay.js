(() => {
  const root = window.LayoutPilotModules ||= {}
  const { createElement, px } = root.dom

  function createFigmaOverlay() {
    const state = {
      overlay: null,
      content: null,
      media: null,
      skeleton: null,
      frame: { width: 0, height: 0 },
      transform: { scale: 1, offsetX: 0, offsetY: 0 },
      objectUrl: null,
      skeletonOn: false,
      opacity: 0.6,
      blend: 'normal'
    }

    function ensure() {
      if (state.overlay) return
      state.overlay = createElement('layoutpilot-figma-overlay')
      state.content = document.createElement('div')
      state.content.className = 'layoutpilot-figma-content'
      state.media = document.createElement('div')
      state.media.className = 'layoutpilot-figma-media'
      state.skeleton = document.createElement('div')
      state.skeleton.className = 'layoutpilot-figma-skeleton'
      state.content.append(state.media, state.skeleton)
      state.overlay.append(state.content)
      applyVisualState()
    }

    function setFrame(width, height) {
      ensure()
      state.frame = { width: width || 0, height: height || 0 }
      state.content.style.width = px(state.frame.width)
      state.content.style.height = px(state.frame.height)
    }

    function clearObjectUrl() {
      if (state.objectUrl) {
        URL.revokeObjectURL(state.objectUrl)
        state.objectUrl = null
      }
    }

    function setSvg(svgText) {
      ensure()
      clearObjectUrl()
      state.media.innerHTML = String(svgText || '')
      const svg = state.media.querySelector('svg')
      if (svg) {
        svg.style.display = 'block'
        if (state.frame.width) svg.setAttribute('width', String(state.frame.width))
        if (state.frame.height) svg.setAttribute('height', String(state.frame.height))
        svg.style.width = px(state.frame.width)
        svg.style.height = px(state.frame.height)
      }
    }

    function setImage(blob) {
      ensure()
      clearObjectUrl()
      state.media.innerHTML = ''
      state.objectUrl = URL.createObjectURL(blob)
      const image = document.createElement('img')
      image.className = 'layoutpilot-figma-media-image'
      image.src = state.objectUrl
      image.style.width = px(state.frame.width)
      image.style.height = px(state.frame.height)
      state.media.append(image)
    }

    function setSkeletonNodes(nodes) {
      ensure()
      state.skeleton.replaceChildren()
      for (const node of nodes || []) {
        const box = document.createElement('div')
        box.className = `layoutpilot-figma-skeleton-box layoutpilot-figma-skeleton-box--${node.type}`
        box.style.left = px(node.rect.x)
        box.style.top = px(node.rect.y)
        box.style.width = px(node.rect.width)
        box.style.height = px(node.rect.height)
        state.skeleton.append(box)
      }
    }

    function applyTransform(transform) {
      ensure()
      state.transform = transform
      state.content.style.transform =
        `translate(${transform.offsetX}px, ${transform.offsetY}px) scale(${transform.scale})`
    }

    function applyVisualState() {
      if (!state.overlay) return
      state.content.style.opacity = String(state.opacity)
      state.overlay.style.mixBlendMode = state.blend
      state.media.style.display = state.skeletonOn ? 'none' : 'block'
      state.skeleton.style.display = state.skeletonOn ? 'block' : 'none'
    }

    function setOpacity(value) {
      state.opacity = Math.max(0, Math.min(1, value))
      applyVisualState()
    }

    function setBlend(mode) {
      state.blend = mode === 'difference' ? 'difference' : 'normal'
      applyVisualState()
    }

    function toggleBlend() {
      setBlend(state.blend === 'difference' ? 'normal' : 'difference')
      return state.blend
    }

    function setSkeleton(enabled) {
      state.skeletonOn = !!enabled
      applyVisualState()
    }

    function toggleSkeleton() {
      setSkeleton(!state.skeletonOn)
      return state.skeletonOn
    }

    function setVisible(visible) {
      ensure()
      state.overlay.style.display = visible ? 'block' : 'none'
    }

    function getElement() {
      ensure()
      return state.overlay
    }

    // Drag mode: the overlay captures pointer events so it can be dragged.
    // When off it stays click-through so the page underneath is interactive.
    function setInteractive(enabled) {
      ensure()
      state.overlay.style.pointerEvents = enabled ? 'auto' : 'none'
      state.content.style.cursor = enabled ? 'grab' : ''
    }

    function toggleVisible() {
      ensure()
      const visible = state.overlay.style.display === 'none'
      setVisible(visible)
      return visible
    }

    function isVisible() {
      return !!state.overlay && state.overlay.style.display !== 'none'
    }

    function getState() {
      return {
        opacity: state.opacity,
        blend: state.blend,
        skeletonOn: state.skeletonOn,
        visible: isVisible()
      }
    }

    function destroy() {
      clearObjectUrl()
      if (state.overlay) {
        state.overlay.remove()
        state.overlay = null
      }
      state.content = null
      state.media = null
      state.skeleton = null
    }

    return {
      ensure,
      setFrame,
      setSvg,
      setImage,
      setSkeletonNodes,
      applyTransform,
      setOpacity,
      setBlend,
      toggleBlend,
      setSkeleton,
      toggleSkeleton,
      setVisible,
      toggleVisible,
      isVisible,
      getElement,
      setInteractive,
      getState,
      destroy
    }
  }

  root.figmaOverlay = {
    createFigmaOverlay
  }
})()
