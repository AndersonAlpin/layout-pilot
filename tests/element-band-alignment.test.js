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
  'reports side-by-side elements with the same horizontal band as aligned'
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
  getElementBandAlignment(rect(160, 430, 268, 40), rect(650, 430.4, 268, 40)),
  { aligned: true, offset: 0, direction: 'aligned' },
  'treats small subpixel horizontal-band differences as aligned'
)

assert.deepEqual(
  getElementBandAlignment(rect(160, 430, 268, 40), rect(650, 431, 268, 40)),
  { aligned: false, offset: 1, direction: 'below' },
  'reports a one pixel horizontal-band difference as misaligned'
)

assert.deepEqual(
  getElementBandAlignment(rect(160, 430, 268, 40), rect(650, 430, 268, 44)),
  { aligned: false, offset: 0, direction: 'misaligned' },
  'reports different horizontal bands as misaligned even when their top edge matches'
)

assert.deepEqual(
  getElementBandAlignment(rect(222, 126, 267, 40), rect(222, 516, 267, 40)),
  { aligned: true, offset: 0, direction: 'aligned' },
  'reports stacked elements with the same center x as aligned'
)

assert.deepEqual(
  getElementBandAlignment(rect(222, 126, 155, 22), rect(166, 516, 267, 40)),
  { aligned: true, offset: 0, direction: 'aligned' },
  'reports stacked elements with different widths but the same center x as aligned'
)

assert.deepEqual(
  getElementBandAlignment(rect(222, 126, 267, 40), rect(226, 516, 267, 40)),
  { aligned: false, offset: 4, direction: 'right' },
  'reports a stacked target as right when its center x is shifted right'
)

assert.deepEqual(
  getElementBandAlignment(rect(222, 126, 267, 40), rect(223, 516, 267, 40)),
  { aligned: false, offset: 1, direction: 'right' },
  'reports a one pixel stacked center x shift as misaligned'
)

assert.deepEqual(
  getElementBandAlignment(rect(222, 126, 267, 40), rect(222.5, 516, 267, 40)),
  { aligned: false, offset: 1, direction: 'right' },
  'reports a half pixel stacked center x shift as misaligned'
)

assert.deepEqual(
  getElementBandAlignment(rect(222, 126, 267, 40), rect(218, 516, 267, 40)),
  { aligned: false, offset: 4, direction: 'left' },
  'reports a stacked target as left when its center x is shifted left'
)

assert.deepEqual(
  getElementBandAlignment(rect(166, 516, 267, 40), rect(216.5, 126, 155, 22)),
  { aligned: false, offset: 6, direction: 'left' },
  'rounds negative half-pixel center offsets symmetrically'
)

assert.deepEqual(
  getElementBandAlignment(rect(216.5, 126, 155, 22), rect(166, 516, 267, 40)),
  { aligned: false, offset: 6, direction: 'right' },
  'rounds positive half-pixel center offsets symmetrically'
)

assert.equal(
  getElementBandAlignment(
    rect(222, 126, 155, 22),
    rect(166, 516, 267, 40),
    {
      baseInfo: { textAlign: 'center' },
      targetInfo: { textAlign: 'left' }
    }
  ),
  null,
  'ignores stacked alignment when elements use different horizontal anchors'
)

assert.deepEqual(
  getElementBandAlignment(
    rect(166, 126, 155, 22),
    rect(166, 516, 267, 40),
    {
      baseInfo: { textAlign: 'left' },
      targetInfo: { textAlign: 'left' }
    }
  ),
  { aligned: true, offset: 0, direction: 'aligned' },
  'reports stacked elements with the same left anchor as aligned'
)

assert.deepEqual(
  getElementBandAlignment(
    rect(222, 126, 155, 22),
    rect(166, 516, 267, 40),
    {
      baseInfo: { textAlign: 'start', children: { count: 2 } },
      targetInfo: { textAlign: 'start', children: { count: 3 } }
    }
  ),
  { aligned: true, offset: 0, direction: 'aligned' },
  'keeps center alignment for container-like elements with default text alignment'
)

assert.deepEqual(
  getElementBandAlignment(
    rect(170, 126, 155, 22),
    rect(114, 516, 267, 40),
    {
      baseInfo: {
        textAlign: 'left',
        parent: {
          rect: rect(30, 60, 435, 480),
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start'
        }
      },
      targetInfo: { textAlign: 'center' }
    }
  ),
  { aligned: true, offset: 0, direction: 'aligned' },
  'infers center alignment for a centered badge even when its own text-align is left'
)

assert.deepEqual(
  getElementBandAlignment(
    rect(610, 523, 127, 21),
    rect(610, 548, 207, 21),
    {
      baseInfo: { textAlign: 'left' },
      targetInfo: { textAlign: 'left' }
    }
  ),
  { aligned: true, offset: 0, direction: 'aligned' },
  'reports equal-height text rows with the same left edge as aligned even when widths differ'
)
