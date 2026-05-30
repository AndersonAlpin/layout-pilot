(() => {
  const root = window.LayoutPilotModules ||= {}
  const { px } = root.dom

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value))
  }

  function createDraggablePanel(options) {
    const {
      getPanel,
      getPosition,
      setPosition,
      getDrag,
      setDrag
    } = options

    function getEdgeAnchors(x, y) {
      const panel = getPanel()
      if (!panel) return {}

      const edgeMargin = 32
      const rect = panel.getBoundingClientRect()
      const rightGap = window.innerWidth - (x + rect.width)
      const bottomGap = window.innerHeight - (y + rect.height)

      return {
        rightGap,
        bottomGap,
        anchorRight: rightGap <= edgeMargin,
        anchorBottom: bottomGap <= edgeMargin
      }
    }

    function getClampedPosition(x, y, sourcePosition = {}) {
      const panel = getPanel()
      if (!panel) return { ...sourcePosition, x, y }

      const margin = 8
      const rect = panel.getBoundingClientRect()
      const maxX = Math.max(margin, window.innerWidth - rect.width - margin)
      const maxY = Math.max(margin, window.innerHeight - rect.height - margin)
      const nextX = sourcePosition.anchorRight
        ? window.innerWidth - rect.width - sourcePosition.rightGap
        : x
      const nextY = sourcePosition.anchorBottom
        ? window.innerHeight - rect.height - sourcePosition.bottomGap
        : y
      const clampedX = clamp(nextX, margin, maxX)
      const clampedY = clamp(nextY, margin, maxY)

      return {
        ...sourcePosition,
        ...getEdgeAnchors(clampedX, clampedY),
        x: clampedX,
        y: clampedY
      }
    }

    function applyPosition() {
      const panel = getPanel()
      const position = getPosition()
      if (!panel || !position) return

      const clampedPosition = getClampedPosition(position.x, position.y, position)
      setPosition(clampedPosition)
      panel.style.left = px(clampedPosition.x)
      panel.style.top = px(clampedPosition.y)
      panel.style.right = 'auto'
      panel.style.bottom = 'auto'
    }

    function updatePosition(x, y) {
      setPosition(getClampedPosition(x, y))
      applyPosition()
    }

    function handleMove(event) {
      const drag = getDrag()
      if (!drag) return

      event.preventDefault()
      updatePosition(event.clientX - drag.offsetX, event.clientY - drag.offsetY)
    }

    function stop() {
      const drag = getDrag()
      if (!drag) return

      getPanel()?.classList.remove('layoutpilot-detail-dragging')
      setDrag(null)
      window.removeEventListener('pointermove', handleMove, true)
      window.removeEventListener('pointerup', stop, true)
      window.removeEventListener('pointercancel', stop, true)
    }

    function handleStart(event) {
      if (event.button !== 0) return
      if (event.target?.closest?.('button, [data-layoutpilot-action], input, textarea, select, a')) return

      const panel = getPanel()
      if (!panel) return

      const rect = panel.getBoundingClientRect()
      setDrag({
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top
      })
      setPosition({ x: rect.left, y: rect.top })
      panel.classList.add('layoutpilot-detail-dragging')
      applyPosition()

      event.preventDefault()
      event.stopPropagation()
      window.addEventListener('pointermove', handleMove, true)
      window.addEventListener('pointerup', stop, true)
      window.addEventListener('pointercancel', stop, true)
    }

    return {
      applyPosition,
      updatePosition,
      handleStart,
      stop
    }
  }

  root.draggablePanel = {
    createDraggablePanel
  }
})()
