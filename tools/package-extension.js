const path = require('node:path')
const fs = require('fs-extra')
const archiver = require('archiver')

const DIST_DIR = 'dist'
const ZIP_NAME = 'layout-pilot.zip'
const STAGING_DIR = 'package'
const ALLOWED_DIRECTORIES = ['icons', '_locales', 'src']
const ROOT_FILE_EXTENSIONS = new Set(['.html', '.css', '.js'])
const TEMP_FILE_NAMES = new Set(['.DS_Store', 'Thumbs.db', 'desktop.ini'])
const TEMP_EXTENSIONS = new Set(['.tmp', '.temp', '.swp', '.bak', '.orig', '.log'])

function addPath(paths, value) {
  if (typeof value !== 'string' || value.trim() === '') {
    return
  }

  const normalized = value.replaceAll('\\', '/')

  if (
    normalized.startsWith('/') ||
    normalized.includes('://') ||
    normalized.includes('*') ||
    normalized.startsWith('chrome://')
  ) {
    return
  }

  paths.add(normalized)
}

function addIconPaths(paths, icons) {
  if (!icons || typeof icons !== 'object') {
    return
  }

  for (const iconPath of Object.values(icons)) {
    addPath(paths, iconPath)
  }
}

function collectManifestReferences(manifest) {
  const paths = new Set()

  if (manifest.default_locale) {
    addPath(paths, `_locales/${manifest.default_locale}/messages.json`)
  }

  addPath(paths, manifest.background && manifest.background.service_worker)

  for (const script of manifest.content_scripts || []) {
    for (const jsPath of script.js || []) {
      addPath(paths, jsPath)
    }

    for (const cssPath of script.css || []) {
      addPath(paths, cssPath)
    }
  }

  for (const resourceGroup of manifest.web_accessible_resources || []) {
    for (const resourcePath of resourceGroup.resources || []) {
      addPath(paths, resourcePath)
    }
  }

  addPath(paths, manifest.side_panel && manifest.side_panel.default_path)
  addPath(paths, manifest.action && manifest.action.default_popup)
  addIconPaths(paths, manifest.action && manifest.action.default_icon)
  addIconPaths(paths, manifest.icons)
  addPath(paths, manifest.options_page)
  addPath(paths, manifest.options_ui && manifest.options_ui.page)
  addPath(paths, manifest.devtools_page)

  if (manifest.chrome_url_overrides) {
    for (const overridePath of Object.values(manifest.chrome_url_overrides)) {
      addPath(paths, overridePath)
    }
  }

  if (manifest.sandbox && Array.isArray(manifest.sandbox.pages)) {
    for (const pagePath of manifest.sandbox.pages) {
      addPath(paths, pagePath)
    }
  }

  return paths
}

async function readManifest(rootDir) {
  const manifestPath = path.join(rootDir, 'manifest.json')
  return fs.readJson(manifestPath)
}

async function validateManifestReferences(rootDir) {
  const manifest = await readManifest(rootDir)
  const missing = []

  for (const relativePath of collectManifestReferences(manifest)) {
    const absolutePath = path.join(rootDir, relativePath)

    if (!(await fs.pathExists(absolutePath))) {
      missing.push(relativePath)
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing files referenced by manifest.json:\n${missing.map((file) => `- ${file}`).join('\n')}`)
  }

  return true
}

function isRootHtmlCssJsFile(relativePath) {
  return (
    !relativePath.includes('/') &&
    ROOT_FILE_EXTENSIONS.has(path.extname(relativePath).toLowerCase())
  )
}

function shouldCopyProductionFile(sourcePath) {
  const fileName = path.basename(sourcePath)

  if (TEMP_FILE_NAMES.has(fileName) || fileName.endsWith('~')) {
    return false
  }

  return !TEMP_EXTENSIONS.has(path.extname(fileName).toLowerCase())
}

async function copyManifestRootFiles(rootDir, stagingDir) {
  const manifest = await readManifest(rootDir)

  for (const relativePath of collectManifestReferences(manifest)) {
    if (!isRootHtmlCssJsFile(relativePath)) {
      continue
    }

    await fs.copy(path.join(rootDir, relativePath), path.join(stagingDir, relativePath))
  }
}

async function copyProductionFiles(rootDir, stagingDir) {
  await fs.remove(stagingDir)
  await fs.ensureDir(stagingDir)
  await fs.copy(path.join(rootDir, 'manifest.json'), path.join(stagingDir, 'manifest.json'))

  for (const directory of ALLOWED_DIRECTORIES) {
    const source = path.join(rootDir, directory)

    if (await fs.pathExists(source)) {
      await fs.copy(source, path.join(stagingDir, directory), {
        filter: shouldCopyProductionFile
      })
    }
  }

  await copyManifestRootFiles(rootDir, stagingDir)
}

function createZip(sourceDir, zipPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath)
    const archive = archiver('zip', { zlib: { level: 9 } })

    output.on('close', resolve)
    archive.on('error', reject)

    archive.pipe(output)
    archive.directory(sourceDir, false)
    archive.finalize()
  })
}

async function buildPackage(rootDir = process.cwd()) {
  const distDir = path.join(rootDir, DIST_DIR)
  const stagingDir = path.join(distDir, STAGING_DIR)
  const zipPath = path.join(distDir, ZIP_NAME)

  await validateManifestReferences(rootDir)
  await fs.remove(distDir)
  await fs.ensureDir(distDir)
  await copyProductionFiles(rootDir, stagingDir)
  await createZip(stagingDir, zipPath)
  await fs.remove(stagingDir)

  return zipPath
}

async function main() {
  const zipPath = await buildPackage(process.cwd())
  console.log(`Created ${path.relative(process.cwd(), zipPath).replaceAll('\\', '/')}`)
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}

module.exports = {
  buildPackage,
  collectManifestReferences,
  copyProductionFiles,
  validateManifestReferences
}
