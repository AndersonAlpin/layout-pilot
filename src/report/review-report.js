const MESSAGE_TYPE = {
  GET_REVIEW_REPORT: 'layoutpilot:get-review-report',
  CLEAR_REVIEW_REPORT: 'layoutpilot:clear-review-report'
}

const params = new URLSearchParams(window.location.search)
const reportId = params.get('id') || ''
const content = document.getElementById('layoutpilot-report-content')
const title = document.getElementById('layoutpilot-report-title')
const printButton = document.getElementById('layoutpilot-print-button')

function createElement(tagName, className, text) {
  const element = document.createElement(tagName)
  if (className) element.className = className
  if (text != null) element.textContent = text
  return element
}

function requestReport() {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({
      type: MESSAGE_TYPE.GET_REVIEW_REPORT,
      id: reportId
    }, response => {
      const runtimeError = chrome.runtime.lastError
      if (runtimeError) {
        reject(new Error(runtimeError.message))
        return
      }

      if (!response?.ok) {
        reject(new Error(response?.error?.message || 'Review report payload not found.'))
        return
      }

      resolve(response.payload)
    })
  })
}

function clearReport() {
  if (!reportId) return
  chrome.runtime.sendMessage({
    type: MESSAGE_TYPE.CLEAR_REVIEW_REPORT,
    id: reportId
  })
}

function renderAnnotationHeading(section) {
  const paragraph = createElement('p', 'comment')
  const strong = createElement('strong')
  strong.textContent = section.type === 'areaMarks'
    ? section.title || ''
    : `${section.number}.`
  paragraph.append(strong)

  if (section.type !== 'areaMarks') {
    paragraph.append(` ${section.comment || ''}`)
  }

  return paragraph
}

function renderReport(payload) {
  title.textContent = payload.title || 'LayoutPilot Review'
  printButton.textContent = payload.printButton || 'Print / Save PDF'
  content.textContent = ''

  for (const section of payload.sections || []) {
    const article = createElement('section', 'annotation')
    const heading = createElement('div', 'annotation-heading')
    heading.append(renderAnnotationHeading(section))
    article.append(heading)

    if (section.imageDataUrl) {
      const image = document.createElement('img')
      image.className = 'capture'
      image.alt = ''
      image.src = section.imageDataUrl
      article.append(image)
    } else {
      article.append(createElement('div', 'unavailable', payload.unavailableMessage || 'Image unavailable'))
    }

    content.append(article)
  }
}

async function waitForReportImages() {
  const images = Array.from(document.images)
  await Promise.all(images.map(image => {
    if (image.complete && image.naturalWidth > 0) return Promise.resolve()
    if (typeof image.decode === 'function') return image.decode().catch(() => {})

    return new Promise(resolve => {
      image.addEventListener('load', resolve, { once: true })
      image.addEventListener('error', resolve, { once: true })
    })
  }))
}

async function init() {
  printButton.addEventListener('click', () => window.print())

  try {
    const payload = await requestReport()
    renderReport(payload)
    await waitForReportImages()
    window.setTimeout(() => window.print(), 150)
  } catch (error) {
    content.textContent = error?.message || 'Could not load LayoutPilot review report.'
  }
}

window.addEventListener('pagehide', clearReport)
init()
