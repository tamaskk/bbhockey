// run: node --experimental-strip-types src/views/csv.test.ts
import assert from 'node:assert/strict'
import { toCsv } from './csv.ts'

const csv = toCsv(
  [
    { statusz: 'uj', valaszok: [{ kerdes: 'Név', valasz: 'Kis "Pál"' }, { kerdes: 'Megj', valasz: 'a;b' }] },
    { statusz: 'fizetve', valaszok: [{ kerdes: 'Név', valasz: '=1+1' }, { kerdes: 'Poszt', valasz: 'Kapus' }] },
  ],
  () => 'U12',
  (s) => (s === 'uj' ? 'Új' : String(s)),
)
const [head, a, b] = csv.slice(1).split('\r\n')
assert.ok(csv.startsWith('﻿'))
assert.equal(head, 'Beérkezett;Mappa;Státusz;Név;Megj;Poszt')
assert.equal(a, ';U12;Új;"Kis ""Pál""";"a;b";')
assert.equal(b, `;U12;fizetve;'=1+1;;Kapus`)
console.log('csv ok')
