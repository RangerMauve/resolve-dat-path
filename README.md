# resolve-dat-path
Resolves a file within a dat archive based on how web browsers would load it.

```js
const resolveDatPath = require('resolve-dat-path')

const archive = getAHyperdriveSomehow();

const rawPath = '/blog/about'

resolveDatPath(archive, rawPath, (err, resolution) => {
  if(err) console.log('Show your application 404 page')
  else {
    const {type, path} = resolution

    if(type === 'directory') {
      console.log('Render the file list from the folder signified by `path`')
    } else if(type === 'file') {
      console.log('Render the file at `path`')
    } else {
      console.error('Something went horribly wrong')
    }
  }
})
```
