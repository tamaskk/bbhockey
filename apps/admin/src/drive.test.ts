// run: node --experimental-strip-types src/drive.test.ts
import assert from 'node:assert/strict'
import { directImageUrl } from './drive.ts'

const id = '1AbCdEfGhIjKlMnOpQrStUvWxYz012345'
const want = `https://lh3.googleusercontent.com/d/${id}`
assert.equal(directImageUrl(`https://drive.google.com/file/d/${id}/view?usp=sharing`), want)
assert.equal(directImageUrl(`https://drive.google.com/open?id=${id}`), want)
assert.equal(directImageUrl(`https://drive.google.com/uc?export=view&id=${id}`), want)
assert.equal(directImageUrl(` https://drive.google.com/file/d/${id}/view `), want)
assert.equal(directImageUrl('https://example.com/a.jpg'), 'https://example.com/a.jpg')
console.log('drive ok')
