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

module.exports = function resolveFileInArchive (archive, path, cb) {
  getManifest(archive, (manifest) => {
    const prefix = manifest.web_root || ''
    if (!path.startsWith('/')) path = `/${path}`
    let index = 0
    next()

    function next () {
      const makePath = CHECK_PATHS[index++]
      if (makePath) {
        const checkPath = makePath(prefix + path)
        checkExistsFile(archive, checkPath, cb, next)
      } else {
        checkExistsDirectory(archive, prefix + path, cb, try404)
      }
    }

    function try404 () {
      let fallback = manifest.fallback_page

      if (fallback) {
        if (!fallback.startsWith('/')) fallback = `/${fallback}`
        checkExistsFile(archive, fallback, cb, () => {
          checkExistsFile(archive, prefix + fallback, cb, notFound)
        })
      } else notFound()
    }

    function notFound () {
      cb(new Error('Not Found'))
    }
  })
}

function checkExistsDirectory (archive, path, onYes, onNo) {
  archive.stat(path, (err, stat) => {
    if (err) onNo()
    else if (stat.isDirectory()) {
      onYes(null, {
        type: 'directory',
        path: path,
        stat
      })
    } else onNo()
  })
}

function checkExistsFile (archive, path, onYes, onNo) {
  archive.stat(path, (err, stat) => {
    if (err) onNo()
    else if (stat.isFile()) {
      onYes(null, {
        type: 'file',
        path: path,
        stat
      })
    } else onNo()
  })
}

function getManifest (archive, cb) {
  archive.readFile(MANIFEST_LOCATION, 'utf-8', (err, rawManifest) => {
    let manifest = {}
    if (err) return cb(manifest)
    try {
      manifest = JSON.parse(rawManifest)
    } catch (e) {
      // Oh well
    }
    cb(manifest || {})
  })
}
