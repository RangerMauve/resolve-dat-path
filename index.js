const MANIFEST_LOCATION = '/dat.json'
const CHECK_PATHS = [
  path => path,
  path => `${path}index.html`,
  path => `${path}index.md`,
  path => `${path}/index.html`,
  path => `${path}/index.md`,
  path => `${path}.html`,
  path => `${path}.md`
]

module.exports = async function resolveFileInArchive (archive, path) {
  let {
    web_root: webRoot = '',
    fallback_page: fallbackPage
  } = await getManifest(archive)

  if (!path.startsWith('/')) {
    path = `/${path}`
  }
  path = `${webRoot}${path}`
  for (const makePath of CHECK_PATHS) {
    const file = await getEntry(archive, makePath(path), 'file')
    if (file) {
      return file
    }
  }
  const dir = await getEntry(archive, path, 'directory')
  if (dir) {
    return dir
  }
  if (fallbackPage) {
    if (!fallbackPage.startsWith('/')) {
      fallbackPage = `/${fallbackPage}`
    }
    let file
    file = await getEntry(archive, fallbackPage, 'file')
    if (file) {
      return file
    }
    file = await getEntry(archive, `${webRoot}${fallbackPage}`, 'file')
    if (file) {
      return file
    }
  }
  throw new Error('Not Found')
}

async function getManifest (archive) {
  try {
    const rawManifest = await readFile(archive, MANIFEST_LOCATION, 'utf-8')
    return JSON.parse(rawManifest) || {}
  } catch (error) {
    // Oh well
    return {}
  }
}

async function getEntry (archive, path, type) {
  try {
    const stat = await asyncStat(archive, path)
    if (
      (type === 'directory' && stat.isDirectory()) ||
      (type === 'file' && stat.isFile())
    ) {
      return {
        type,
        path,
        stat
      }
    }
  } catch (error) {
    // Oh well
  }
  return null
}

const asyncStat = (archive, path) => new Promise((resolve, reject) =>
  archive.stat(path, (err, stat) => {
    if (err) reject(err)
    else resolve(stat)
  })
)

const readFile = (archive, file, encoding) => new Promise((resolve, reject) =>
  archive.readFile(file, encoding, (err, data) => {
    if (err) reject(err)
    else resolve(data)
  })
)
