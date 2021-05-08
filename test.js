const resolveDatPath = require('.')
const test = require('tape')
const ScopedFS = require('scoped-fs')
const tmp = require('tmp')
const path = require('path')
const { randomBytes } = require('crypto')

;[
  'test',
  'testindex.html',
  'testindex.md',
  'test/index.html',
  'test/index.md',
  'test.html',
  'test.md'
].forEach((file, index, all) => {
  test(`Test resolving ${file}`, async t => {
    const { folder, cleanup } = tmpdir()
    try {
      const fs = new ScopedFS(folder)
      await prepareTestFiles(fs, all.slice(index))
      matchesFile(t, await resolveDatPath(fs, 'test'), file)
    } finally {
      cleanup()
    }
  })
  test(`Test resolving with web_root, ${file}`, async t => {
    const { folder, cleanup } = tmpdir()
    try {
      const fs = new ScopedFS(folder)
      await prepareTestFiles(fs, all.slice(index).map(file => `webr/${file}`))
      await prepareTestFiles(fs, all.slice(index))
      fs.writeFileSync('dat.json', JSON.stringify({
        web_root: '/webr'
      }))
      matchesFile(t, await resolveDatPath(fs, 'test'), `webr/${file}`)
    } finally {
      cleanup()
    }
  })
})

test('Test resolving to /test folder', async t => {
  const { folder, cleanup } = tmpdir()
  try {
    const fs = new ScopedFS(folder)
    await mkdirP(fs, 'test')
    matchesDir(t, await resolveDatPath(fs, 'test'), 'test')
  } finally {
    cleanup()
  }
})

test('Test 404 to /not-found folder', async t => {
  const { folder, cleanup } = tmpdir()
  try {
    const fs = new ScopedFS(folder)
    await rejects(t, () => resolveDatPath(fs, 'test'), 'Not Found')
  } finally {
    cleanup()
  }
})

test('Test fallback', async t => {
  const { folder, cleanup } = tmpdir()
  try {
    const fs = new ScopedFS(folder)
    fs.writeFileSync('dat.json', JSON.stringify({
      fallback_page: '404'
    }))
    fs.writeFileSync('404', 'dummy content')
    matchesFile(t, await resolveDatPath(fs, 'test'), '404')
  } finally {
    cleanup()
  }
})

test('Test fallback', async t => {
  const { folder, cleanup } = tmpdir()
  try {
    const fs = new ScopedFS(folder)
    fs.writeFileSync('dat.json', JSON.stringify({
      fallback_page: '404'
    }))
    fs.writeFileSync('404', 'dummy content')
    matchesFile(t, await resolveDatPath(fs, 'test'), '404')
  } finally {
    cleanup()
  }
})

test('Test webroot fallback', async t => {
  const { folder, cleanup } = tmpdir()
  try {
    const fs = new ScopedFS(folder)
    fs.writeFileSync('dat.json', JSON.stringify({
      web_root: '/webr',
      fallback_page: '404'
    }))
    await mkdirP(fs, 'webr')
    fs.writeFileSync('webr/404', 'dummy content')
    matchesFile(t, await resolveDatPath(fs, 'test'), 'webr/404')
  } finally {
    cleanup()
  }
})

async function prepareTestFiles (fs, files) {
  for (const file of files) {
    try {
      await mkdirP(fs, path.dirname(file), { recursive: true })
      fs.writeFileSync(file, 'hello world')
    } catch (err) {
      if (err.code !== 'EEXIST') {
        // There may be an error with the test/prefix
        throw err
      }
    }
  }
}

function mkdirP (fs, dir) {
  return new Promise((resolve, reject) =>
    fs.mkdir(dir, { recursive: true }, err => err ? reject(err) : resolve())
  )
}

function tmpdir () {
  const { name: folder, removeCallback: cleanup } = tmp.dirSync({
    prefix: randomBytes(6).toString('hex'),
    unsafeCleanup: true
  })
  return { folder, cleanup }
}

function matchesDir (t, result, dirname) {
  const { type, path, stat } = result
  t.equals(type, 'directory', 'Resolved to a directory')
  t.equals(path, `/${dirname}`, `Resolved to the expected /${dirname}`)
  t.ok(stat, 'Stat passed through')
}

function matchesFile (t, result, filename) {
  const { type, path, stat } = result
  t.equals(type, 'file', 'Resolved to a file')
  t.equals(path, `/${filename}`, `Resolved to the expected /${filename}`)
  t.ok(stat, 'Stat passed through')
}

async function rejects (t, handler, check, msg) {
  try {
    await handler()
    t.fail('passed')
  } catch (error) {
    if (typeof check === 'string') {
      t.equals(error.message, check, msg || `Rejects with message=${check}`)
    } else if (check === null || check === undefined) {
      t.pass(msg || 'Rejects')
    } else if (typeof check === 'function') {
      t.ok(error instanceof check, msg || `Rejects with ${check}`)
    } else {
      t.deepEquals(error, check, msg || 'Rejects')
    }
  }
}
