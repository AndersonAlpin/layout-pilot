(() => {
  const root = window.LayoutPilotModules ||= {}

  function cssEscape(value) {
    if (window.CSS?.escape) return CSS.escape(value)
    return String(value).replace(/[^a-zA-Z0-9_-]/g, character => `\\${character}`)
  }

  function cssStringEscape(value) {
    return String(value)
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\A ')
      .replace(/\r/g, '')
  }

  function getClasses(element) {
    const classes = Array.from(element.classList || [])
    if (!classes.length) return '—'
    return classes.map(className => `.${className}`).join(' ')
  }

  function getElementName(element) {
    const tag = element.tagName.toLowerCase()
    const id = element.id ? `#${element.id}` : ''
    const className = Array.from(element.classList || []).slice(0, 3).map(name => `.${name}`).join('')
    return `${tag}${id}${className}`
  }

  function getTextSnippet(element, maxLength = 120) {
    const text = String(element.innerText || element.textContent || '')
      .replace(/\s+/g, ' ')
      .trim()

    if (!text) return ''
    return text.length > maxLength ? `${text.slice(0, maxLength - 1)}...` : text
  }

  function getUsefulAttributeSelector(element) {
    if (element.id) return `#${cssEscape(element.id)}`

    const preferredAttributes = ['data-testid', 'data-test', 'data-cy', 'data-qa', 'data-component', 'aria-label']
    for (const attribute of preferredAttributes) {
      const value = element.getAttribute(attribute)
      if (value) return `[${attribute}="${cssStringEscape(value)}"]`
    }

    const dataAttribute = Array.from(element.attributes || [])
      .find(attribute => attribute.name.startsWith('data-') && attribute.value && attribute.value.length <= 80)

    if (dataAttribute) return `[${dataAttribute.name}="${cssStringEscape(dataAttribute.value)}"]`

    return ''
  }

  function getStableClasses(element, limit = 5) {
    return Array.from(element.classList || [])
      .filter(className => className && className.length <= 60)
      .slice(0, limit)
      .map(className => `.${cssEscape(className)}`)
      .join('')
  }

  function getSelectorPart(element, options = {}) {
    if (!(element instanceof Element)) return ''

    const tag = element.tagName.toLowerCase()
    const attributeSelector = getUsefulAttributeSelector(element)
    if (attributeSelector) return attributeSelector.startsWith('#') ? attributeSelector : `${tag}${attributeSelector}`

    const classes = getStableClasses(element)
    if (classes) return `${tag}${classes}`

    if (options.withNth) {
      const parent = element.parentElement
      const sameTagSiblings = parent
        ? Array.from(parent.children).filter(child => child.tagName === element.tagName)
        : []

      if (sameTagSiblings.length > 1) return `${tag}:nth-of-type(${sameTagSiblings.indexOf(element) + 1})`
    }

    return tag
  }

  function getFullSelectorPath(element) {
    if (!(element instanceof Element)) return '—'

    const parts = []
    let current = element

    while (current instanceof Element && current !== document.documentElement && parts.length < 6) {
      const part = getSelectorPart(current, { withNth: true })

      parts.unshift(part)
      if (part.startsWith('#')) break
      current = current.parentElement
    }

    return parts.join(' > ') || getElementName(element)
  }

  function getSelectorCandidates(element) {
    if (!(element instanceof Element)) {
      return { best: '—', withParent: '—', fullPath: '—' }
    }

    const best = getSelectorPart(element)
    const parent = element.parentElement
    const parentPart = parent && parent !== document.body && parent !== document.documentElement
      ? getSelectorPart(parent)
      : ''
    const withParent = parentPart ? `${parentPart} > ${best}` : best
    const fullPath = getFullSelectorPath(element)

    return { best, withParent, fullPath }
  }

  root.selectorUtils = {
    cssEscape,
    cssStringEscape,
    getClasses,
    getElementName,
    getTextSnippet,
    getUsefulAttributeSelector,
    getStableClasses,
    getSelectorPart,
    getFullSelectorPath,
    getSelectorCandidates
  }
})()
