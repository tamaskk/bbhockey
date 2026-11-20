import assert from 'node:assert/strict'
import { compare, toRegex } from './sort.ts'

const s = (l: string[], dir: 1 | -1 = 1) => [...l].sort((a, b) => compare(a, b, dir))
assert.deepEqual(s(['U12', 'U8', '', 'U10']), ['U8', 'U10', 'U12', ''])
assert.deepEqual(s(['U12', 'U8', '', 'U10'], -1), ['U12', 'U10', 'U8', ''])
assert.deepEqual(s(['Zoltán', 'Ádám', 'Csaba', 'Cecília']), ['Ádám', 'Cecília', 'Csaba', 'Zoltán'])
assert.equal(toRegex('^kov')!.test('Kovács Bence'), true)
assert.equal(toRegex('(unclosed'), null)
console.log('sort ok')
