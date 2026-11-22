// run: node --experimental-strip-types src/views/table.test.ts
import assert from 'node:assert/strict'
import { toTable } from './table.ts'

const [head, a, b] = toTable(
  [
    { statusz: 'uj', valaszok: [{ kerdes: 'Név', valasz: 'Kis "Pál"' }, { kerdes: 'Megj', valasz: 'a;b' }] },
    { statusz: 'fizetve', fizetve: true, valaszok: [{ kerdes: 'Név', valasz: '=1+1' }, { kerdes: 'Poszt', valasz: 'Kapus' }] },
  ],
  () => 'U12',
  (s) => (s === 'uj' ? 'Új' : String(s)),
)
assert.deepEqual(head, ['Beérkezett', 'Mappa', 'Státusz', 'Fizetett', 'Közlemény', 'Név', 'Megj', 'Poszt'])
assert.deepEqual(a, ['', 'U12', 'Új', 'Nem', '', 'Kis "Pál"', 'a;b', ''])
assert.deepEqual(b, ['', 'U12', 'fizetve', 'Igen', '', '=1+1', '', 'Kapus'])
console.log('table ok')
