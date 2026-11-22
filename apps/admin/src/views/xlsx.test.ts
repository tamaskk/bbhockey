// node --experimental-strip-types src/views/xlsx.test.ts [out.xlsx]  (pass a path to inspect the file in Excel)
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { toXlsx } from './xlsx.ts'

const table = [['Név', 'Megjegyzés'], ['Kiss Gábor', 'a < b & "c"'], ['=1+1', 'ő ű ✓']]
const x = toXlsx(table)
assert.equal(String.fromCharCode(x[0], x[1]), 'PK')
const text = new TextDecoder().decode(x)
assert.ok(text.includes('a &lt; b &amp; &quot;c&quot;'))
assert.ok(text.includes('Kiss Gábor'))
assert.ok(text.includes('<pane ySplit="1"'))
// formulas stay text: inline strings are never evaluated
assert.ok(text.includes('t="inlineStr"><is><t xml:space="preserve">=1+1'))
assert.ok(text.includes("'Jelentkezések'!$A$1:$B$3"))
if (process.argv[2]) writeFileSync(process.argv[2], x)
console.log('xlsx ok')
