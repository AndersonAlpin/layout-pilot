const assert = require('node:assert/strict')

class FakeElement {
  constructor(className = '', parent = null) {
    this.classList = className ? className.split(/\s+/) : []
    this.parent = parent
  }

  closest(selector) {
    if (selector !== '[class*="layoutpilot-"]') return null

    let current = this
    while (current) {
      if (current.classList.some(className => className.includes('layoutpilot-'))) return current
      current = current.parent
    }
    return null
  }
}

global.Element = FakeElement
global.window = {}

require('../src/shared/dom.js')

const {
  getModalInteractionNode,
  isLayoutPilotElement
} = window.LayoutPilotModules.dom

const modalButton = new FakeElement('base-button')
const panel = new FakeElement('layoutpilot-review-panel')
const textarea = new FakeElement('layoutpilot-review-note', panel)

assert.equal(
  isLayoutPilotElement(textarea),
  true,
  'detects nested LayoutPilot UI elements'
)

assert.equal(
  isLayoutPilotElement(modalButton),
  false,
  'does not classify page modal elements as LayoutPilot UI'
)

assert.equal(
  getModalInteractionNode({ type: 'pointerdown', target: panel, relatedTarget: modalButton }),
  panel,
  'uses event.target for pointer interactions'
)

assert.equal(
  getModalInteractionNode({ type: 'focusin', target: textarea, relatedTarget: modalButton }),
  textarea,
  'uses event.target when focus enters LayoutPilot UI'
)

assert.equal(
  getModalInteractionNode({ type: 'focusout', target: modalButton, relatedTarget: textarea }),
  textarea,
  'uses event.relatedTarget when focus leaves a page modal and enters LayoutPilot UI'
)
