// run: node --experimental-strip-types src/views/ops.test.ts
import assert from 'node:assert/strict'
import { addSection, currentOrder, deleteSection, remapLooks, removeBuiltin, removedBuiltins, restoreBuiltin, SECTION_KEYS } from './ops.ts'

const doc: Record<string, unknown> = { order: ['tabor', 'marquee'] }
// built-ins missing from a saved order are deleted; no saved order = all, default order
assert.deepEqual(currentOrder(doc), ['tabor', 'marquee'])
assert.deepEqual(currentOrder({}), SECTION_KEYS)
assert.ok(addSection(doc, 'szoveg', 'tabor', 'a'.repeat(24)))
assert.deepEqual((doc.order as string[]).slice(0, 3), ['tabor', `b:${'a'.repeat(24)}`, 'marquee'])
assert.equal((doc.blocks as { blockType: string }[])[0].blockType, 'szoveg')
assert.ok(!addSection(doc, 'nope', 'tabor'))
assert.ok(deleteSection(doc, 0))
assert.deepEqual(doc.blocks, [])
assert.ok(!(doc.order as string[]).some((k) => k.startsWith('b:')))

const L = 'fooldal:gyik.items'
const looks = { [`${L}.0`]: { c: 0 }, [`${L}.1.q`]: { c: 1 }, [`${L}.2`]: { c: 2 }, 'fooldal:hero.title': { c: 9 }, [`${L}.10`]: { c: 10 } }
assert.deepEqual(remapLooks(looks, L, { kind: 'del', i: 1 }), { [`${L}.0`]: { c: 0 }, [`${L}.1`]: { c: 2 }, 'fooldal:hero.title': { c: 9 }, [`${L}.9`]: { c: 10 } })
assert.deepEqual(remapLooks(looks, L, { kind: 'dup', i: 0 })[`${L}.1`], { c: 0 })
assert.deepEqual(remapLooks(looks, L, { kind: 'dup', i: 0 })[`${L}.2.q`], { c: 1 })
// new position n holds old item order[n]: [2,0,1] -> old 2 to 0, old 0 to 1, old 1 to 2
const moved = remapLooks(looks, L, { kind: 'move', order: [2, 0, 1, 3, 4, 5, 6, 7, 8, 9, 10] })
assert.deepEqual([moved[`${L}.0`], moved[`${L}.1`], moved[`${L}.2.q`]], [{ c: 2 }, { c: 0 }, { c: 1 }])
assert.deepEqual(Object.keys(remapLooks({ [`${L}.0`]: {}, [`${L}.1`]: {} }, L, { kind: 'ins', i: 1 })), [`${L}.0`, `${L}.2`])
const top: Record<string, unknown> = {}
addSection(top, 'gomb', '', 'b'.repeat(24))
assert.equal((top.order as string[])[0], `b:${'b'.repeat(24)}`)
const bi: Record<string, unknown> = { gyik: { show: false } }
assert.ok(removeBuiltin(bi, 'gyik'))
assert.ok(!currentOrder(bi).includes('gyik'))
assert.deepEqual(removedBuiltins(bi), ['gyik'])
assert.ok(restoreBuiltin(bi, 'gyik', 'marquee'))
assert.deepEqual(currentOrder(bi).slice(0, 2), ['marquee', 'gyik'])
assert.equal((bi.gyik as { show: boolean }).show, true)
console.log('ops ok')
