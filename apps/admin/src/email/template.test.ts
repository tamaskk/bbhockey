// run: node --experimental-strip-types src/email/template.test.ts
import assert from 'node:assert/strict'
import { fill, recipient, renderEmail } from './template.ts'

const doc = { email: ' a@b.hu ', szulo_keresztnev: 'Anna', foto: true, valaszok: [{ kerdes: 'Név', valasz: 'Kis <Pál>' }, { kerdes: 'Üres', valasz: '' }] }
assert.equal(recipient(doc), 'a@b.hu')
assert.equal(recipient({ valaszok: [{ kerdes: 'x', valasz: 'nem' }, { kerdes: 'Mail', valasz: 'c@d.hu' }] }), 'c@d.hu')
assert.equal(recipient({}), undefined)
assert.equal(fill('Kedves {{ szulo_keresztnev }}! {{foto}} {{nincs}}', doc), 'Kedves Anna! Igen ')
assert.equal(fill('{{valaszok}}', doc), 'Név: Kis <Pál>')

const html = renderEmail('Szia {{szulo_keresztnev}}!\n{{valaszok}}', { accent: '#ff0000', buttonLabel: 'Megnézem', buttonUrl: 'https://x.hu', headerTitle: 'BB', answers: 'table' }, doc)
assert.ok(html.includes('Szia Anna!<br>'))
assert.ok(html.includes('Kis &lt;Pál&gt;'), 'answers escaped')
assert.ok(!html.includes('Üres'), 'empty answers skipped')
assert.ok(html.includes('background:#ff0000') && html.includes('href="https://x.hu"'))
assert.ok(!renderEmail('x', { buttonLabel: 'B', buttonUrl: 'javascript:alert(1)' }, doc).includes('javascript:'), 'unsafe link dropped')
assert.ok(!renderEmail('x', { accent: 'red;x:y' }, doc).includes('red;x'), 'bad colour ignored')
assert.ok(!renderEmail('{{valaszok}}', { answers: 'none' }, doc).includes('Pál'))
console.log('template ok')
