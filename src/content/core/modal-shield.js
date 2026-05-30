(() => {
  const root = window.LayoutPilotModules ||= {}
  const { isLayoutPilotElement, getModalInteractionNode } = root.dom

  const REKA_MODAL_SOURCE_EVENTS = ['pointerdown', 'click', 'focusin', 'focusout']

  function createModalShield() {
    function stopOwnUiInteractionFromDismissingModals(event) {
      if (isLayoutPilotElement(getModalInteractionNode(event))) event.stopPropagation()
    }

    function start() {
      for (const type of REKA_MODAL_SOURCE_EVENTS) {
        document.documentElement.addEventListener(type, stopOwnUiInteractionFromDismissingModals)
      }
    }

    function stop() {
      for (const type of REKA_MODAL_SOURCE_EVENTS) {
        document.documentElement.removeEventListener(type, stopOwnUiInteractionFromDismissingModals)
      }
    }

    return {
      start,
      stop
    }
  }

  root.modalShield = {
    createModalShield
  }
})()
