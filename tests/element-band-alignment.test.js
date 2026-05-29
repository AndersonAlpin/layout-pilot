const assert = require('node:assert/strict')

global.window = {}

require('../src/shared/dom.js')

const { getElementBandAlignment } = window.LayoutPilotModules.dom

function rect(left, top, width, height) {
  return {
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height
  }
}

assert.deepEqual(
  getElementBandAlignment(rect(160, 430, 268, 40), rect(650, 430, 268, 40)),
  { aligned: true, offset: 0, direction: 'aligned' },
  'reports elements with the same vertical band as aligned'
)

assert.deepEqual(
  getElementBandAlignment(rect(160, 430, 268, 40), rect(650, 433, 268, 40)),
  { aligned: false, offset: 3, direction: 'below' },
  'reports the hovered element as below when its band is lower'
)

assert.deepEqual(
  getElementBandAlignment(rect(160, 430, 268, 40), rect(650, 426, 268, 40)),
  { aligned: false, offset: 4, direction: 'above' },
  'reports the hovered element as above when its band is higher'
)

assert.deepEqual(
  getElementBandAlignment(rect(160, 430, 268, 40), rect(650, 430.4, 268, 40), { tolerance: 1 }),
  { aligned: true, offset: 0, direction: 'aligned' },
  'treats subpixel vertical differences within tolerance as aligned'
)

assert.deepEqual(
  getElementBandAlignment(rect(160, 430, 268, 40), rect(650, 430, 268, 44)),
  { aligned: false, offset: 0, direction: 'misaligned' },
  'reports different vertical bands as misaligned even when their top edge matches'
)
