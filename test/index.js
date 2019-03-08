const resolveDatPath = require('../')

const test = require('tape')
const ScopedFS = require('scoped-fs')

test('Test resolving index.html', (t) => {
  t.plan(2)
  const fs = new ScopedFS(__dirname)

  const toResolve = '/'

  resolveDatPath(fs, toResolve, (err, resolution) => {
    if(err) t.fail()
    else {
      const {type, path} = resolution
      t.equals(type, 'file', 'Resolved to a file')
      t.equals(path, '/index.html', 'Resolved to the index.html')
    }
  })
})
