const assert = require('node:assert/strict')

global.window = {}

require('../src/content/breakpoint/breakpoint-presets.js')

const {
  BREAKPOINT_DEVICE_PRESETS,
  BREAKPOINT_PRESET_GROUPS,
  DEFAULT_PRESET_ID,
  getBreakpointPreset,
  normalizeBreakpointDimension,
  rotateBreakpointViewport,
  classifyFrameProbe
} = window.LayoutPilotModules.breakpointPresets

assert.ok(
  BREAKPOINT_DEVICE_PRESETS.some(preset => preset.id === 'iphone-14-15-pro' && preset.width === 393 && preset.height === 852),
  'includes common phone viewport presets'
)

assert.equal(
  getBreakpointPreset('ipad-10')?.width,
  810,
  'finds presets by id'
)

assert.equal(
  getBreakpointPreset('mobile-lg')?.width,
  393,
  'exposes the essential generic presets'
)

assert.equal(
  DEFAULT_PRESET_ID,
  'iphone-16-17-pro',
  'defaults to a real device preset instead of a generic preset'
)

assert.ok(
  ['breakpoint.presetGroups.essential', 'breakpoint.presetGroups.applePhones']
    .every(key => BREAKPOINT_PRESET_GROUPS.some(group => group.groupKey === key)),
  'exposes grouped presets'
)

assert.ok(
  !BREAKPOINT_PRESET_GROUPS.some(group => group.groupKey === 'breakpoint.presetGroups.foldables'),
  'does not include foldables because they are not visually emulated'
)

assert.ok(
  ['ipad-mini-7', 'pixel-tablet', 'galaxy-tab-s9-ultra', 'surface-go-landscape']
    .every(id => getBreakpointPreset(id)),
  'includes a richer set of real tablet presets'
)

assert.ok(
  BREAKPOINT_PRESET_GROUPS.at(-1).items.some(item => item.id === 'custom' && item.labelKey === 'breakpoint.presets.custom'),
  'keeps a localized custom item in its own group'
)

assert.equal(
  getBreakpointPreset('custom'),
  null,
  'custom is not a real device preset'
)

assert.equal(
  BREAKPOINT_DEVICE_PRESETS.filter(preset => preset.id === 'ultrawide-21-9').length,
  1,
  'keeps ultrawide only once'
)

assert.equal(
  BREAKPOINT_PRESET_GROUPS.find(group => group.groupKey === 'breakpoint.presetGroups.computers')
    ?.items.some(item => item.id === 'desktop' || item.id === 'ultrawide-21-9'),
  false,
  'does not repeat essential desktop presets in Computers'
)

assert.ok(
  ['mobile-lg', 'iphone-16-17-pro', 'galaxy-s20', 'google-pixel-8-pro', 'xiaomi-14', 'ipad-pro-11', 'macbook-air-13'].every(id => getBreakpointPreset(id)),
  'includes the curated device presets'
)

assert.ok(
  ['android-compact', 'android-common', 'android-large', 'pixel-common', 'pixel-large']
    .every(id => !getBreakpointPreset(id)),
  'keeps generic Android sizes only in Essentials'
)

assert.equal(
  getBreakpointPreset('missing-preset'),
  null,
  'returns null for unknown presets'
)

assert.equal(
  normalizeBreakpointDimension('430', 390),
  430,
  'normalizes numeric string dimensions'
)

assert.equal(
  normalizeBreakpointDimension('abc', 390),
  390,
  'falls back for invalid dimensions'
)

assert.equal(
  normalizeBreakpointDimension(40, 390),
  240,
  'clamps very small dimensions to the minimum supported viewport'
)

assert.equal(
  normalizeBreakpointDimension(9000, 390),
  3840,
  'clamps very large dimensions to the maximum supported viewport'
)

assert.deepEqual(
  rotateBreakpointViewport({ width: 393, height: 852 }),
  { width: 852, height: 393 },
  'swaps width and height when rotating viewport'
)

assert.equal(
  classifyFrameProbe({ reachable: true, href: 'https://example.com/#/security/domains' }),
  'ready',
  'treats a reachable same-origin frame with a real url as rendered'
)

assert.equal(
  classifyFrameProbe({ reachable: true, href: 'about:blank' }),
  'pending',
  'keeps waiting while the frame is still on about:blank'
)

assert.equal(
  classifyFrameProbe({ reachable: true, href: '' }),
  'pending',
  'keeps waiting when the frame has no url yet'
)

assert.equal(
  classifyFrameProbe({ reachable: false, href: null }),
  'blocked',
  'flags a cross-origin error page (X-Frame-Options / CSP) as blocked'
)

assert.equal(
  classifyFrameProbe(null),
  'blocked',
  'treats a missing probe as blocked'
)

const {
  resolveActiveControllers,
  normalizeBreakpointInteraction
} = window.LayoutPilotModules.breakpointPresets

// normalizeBreakpointInteraction
assert.equal(normalizeBreakpointInteraction('inspect'), 'inspect', 'keeps inspect')
assert.equal(normalizeBreakpointInteraction('navigate'), 'navigate', 'keeps navigate')
assert.equal(normalizeBreakpointInteraction('review'), 'navigate', 'review not allowed in breakpoint -> navigate')
assert.equal(normalizeBreakpointInteraction(undefined), 'navigate', 'defaults to navigate')

// resolveActiveControllers
assert.deepEqual(
  resolveActiveControllers({ enabled: false, mode: 'inspect', breakpointEnabled: false, interaction: 'navigate' }),
  { inspect: false, review: false },
  'extension off -> nothing runs'
)
assert.deepEqual(
  resolveActiveControllers({ enabled: true, mode: 'inspect', breakpointEnabled: false, interaction: 'navigate' }),
  { inspect: true, review: false },
  'classic inspect'
)
assert.deepEqual(
  resolveActiveControllers({ enabled: true, mode: 'review', breakpointEnabled: false, interaction: 'navigate' }),
  { inspect: false, review: true },
  'classic review'
)
assert.deepEqual(
  resolveActiveControllers({ enabled: true, mode: 'review', breakpointEnabled: true, interaction: 'navigate' }),
  { inspect: false, review: false },
  'breakpoint navigate -> nothing intercepts even if classic mode was review'
)
assert.deepEqual(
  resolveActiveControllers({ enabled: true, mode: 'review', breakpointEnabled: true, interaction: 'inspect' }),
  { inspect: true, review: false },
  'breakpoint inspect -> inspect over frame, review never runs'
)
