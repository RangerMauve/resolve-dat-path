# resolve-dat-path

Resolves a file within a dat archive based on how web browsers would load it.

```js
const resolveDatPath = require('resolve-dat-path')

const archive = getAHyperdriveSomehow();

const rawPath = '/blog/about'

try {
  const {type, path, stat} = await resolveDatPath(archive, rawPath)
  if(type === 'directory') {
    console.log('Render the file list from the folder signified by `path`')
  } else if(type === 'file') {
    console.log('Render the file at `path`')
  } else {
    console.error('Something went horribly wrong')
  }
} catch (err) {
  console.log('Show your application 404 page')
}
```

## How it works

_History:_ This Algorithm is based on the work used by hashbase and [beaker][].

[beaker]: https://github.com/beakerbrowser/hashbase/blob/2dc67348a6607fb75b9857779e5faf77348d449a/lib/apis/archive-files.js#L91-L172

How the algorithm for looking up paths works:

1. It will look for the `web_root` property in the `/dat.json` file to use as prefix, if non-existent it will use `/`.
2. It will look for a file to be returned, with following order at:

    1. exactly the path
    2. with an `.html` suffix
    3. with an `.md` suffix
    4. with an `/index.html` suffix
    5. with an `/index.md` suffix

3. It will look for a folder to be returned at the given path.
4. It will look for the `fallback_page` property in the `/dat.json`, will return the file for the path:

    1. if it exists as is
    2. if it exists with the `web_root` prefix

5. It will throw an `Not Found` error.

## License

[MIT](./LICENSE)
