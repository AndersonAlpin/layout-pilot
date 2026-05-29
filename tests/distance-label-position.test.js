const assert = require('node:assert/strict')

global.window = {}

require('../src/shared/dom.js')

const { getDistanceLabelPosition } = window.LayoutPilotModules.dom

function line(left, top, width, height) {
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height
  }
}

const label = { width: 34, height: 18 }
const viewport = { width: 800, height: 600 }

assert.deepEqual(
  getDistanceLabelPosition('horizontal', line(100, 90, 9, 2), label, viewport),
  { left: 105, top: 82, placement: 'above' },
  'places short horizontal distance labels above the line'
)

assert.deepEqual(
  getDistanceLabelPosition('horizontal', line(100, 12, 9, 2), label, viewport),
  { left: 105, top: 22, placement: 'below' },
  'places horizontal labels below the line when there is no room above'
)

assert.deepEqual(
  getDistanceLabelPosition('vertical', line(80, 120, 2, 36), label, viewport),
  { left: 72, top: 138, placement: 'left' },
  'places vertical distance labels left of the line'
)

assert.deepEqual(
  getDistanceLabelPosition('vertical', line(12, 120, 2, 36), label, viewport),
  { left: 22, top: 138, placement: 'right' },
  'places vertical labels right of the line when there is no room left'
)
