const hyperdrivePromise = require('@geut/hyperdrive-promise')

const MANIFEST_LOCATION = '/dat.json'

const CHECK_PATHS = [
  (path) => path,
  (path) => path + `index.html`,
  (path) => path + `index.md`,
  (path) => path + `/index.html`,
  (path) => path + `/index.md`,
  (path) => path + `.html`,
  (path) => path + `.md`
]

// Based on algorithm used by hashbase and beaker
// https://github.com/beakerbrowser/hashbase/blob/master/lib/apis/archive-files.js#L80

/*
  Get the manifest
  Try to redirect to public dir
  Detect if it's a folder based on whether there is a trailing slash
  If there's no trailing slash, see if adding a trailing slash resolves to a folder
  If it's a folder
    Try loading the folder + `index.html`
  Else
    Try loading the file
    Try loading the file + html
    Try loading the file + md
  If it was a folder and no file was found
    Render out the directory
  If a file was found
    Render out the file
  If there is a fallback_page in the manifest
    Try to load it
  If nothing was able to load, show a 404 page
*/

module.exports = async function resolveFileInArchive (rawArchive, path, cb) {
	const archive = hyperdrivePromise(rawArchive)

  const manifest = await getManifest(archive)
  if (!path.startsWith('/')) path = `/${path}`

  for (let index = 0; index < CHECK_PATHS.length; index++) {
    const makePath = CHECK_PATHS[index]
    const checkPath = makePath(path)
    const existsFile = await checkExistsFile(archive, checkPath)
    if (existsFile) return existsFile
  }

  const existsDirectory = await checkExistsDirectory(archive, prefix + path)

  if (existsDirectory) return existsDirectory

  let fallback = manifest.fallback_page

  if (fallback) {
    if (!fallback.startsWith('/')) fallback = `/${fallback}`
    let exists404 = await checkExistsFile(archive, fallback)

    if (exists404) return exists404

    exists404 = await checkExistsFile(archive, prefix + fallback)

    if (exists404) return exists404
  }
  throw new Error('Not Found')
}

async function checkExistsDirectory (archive, path) {
  let stat = null
  try {
    stat = await archive.stat(path)
  } catch (e) {
    return null
  }

  if (stat.isDirectory()) {
    return {
      type: 'directory',
      path: path,
      stat
    }
  }

  return null
}

async function checkExistsFile (archive, path) {
  let stat = null
  try {
    stat = await archive.stat(path)
  } catch (e) {
    return null
  }

  if (stat.isFile()) {
    return {
      type: 'file',
      path: path,
      stat
    }
  }

  return null
}

async function getManifest (archive, cb) {
  try {
    const rawManifest = await archive.readFile(MANIFEST_LOCATION)

    const manifest = JSON.parse(rawManifest)

    return manifest || {}
  } catch (e) {
    return {}
  }
}
