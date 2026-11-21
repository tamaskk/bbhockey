// run: node --experimental-strip-types src/payment.test.ts
import assert from 'node:assert/strict'
import { amount, payment, paymentText, reference } from './payment.ts'

assert.equal(reference({ jatekos_vezeteknev: 'Kiss', jatekos_keresztnev: 'Gábor', szuletesi_datum: '2019-07-01' }), 'Kiss Gábor 2019.07.01')
assert.equal(reference({ jatekos_nev: 'Kiss Gábor' }), 'Kiss Gábor')
assert.equal(amount({ jelentkezes: 'Egyedül jelentkezem – 160 000 Ft / fő' }), '160 000 Ft')
assert.equal(amount({ jelentkezes: 'Testvéremmel jelentkezem – 140 000 Ft / fő' }), '140 000 Ft')
assert.equal(amount({}), '')
const form = { paymentHolder: 'Bartalis-Horváth Nikolett', paymentAccount: '11736006-21509339', paymentText: 'Köszönjük!' }
const p = payment(form, { kozlemeny: 'Kiss Gábor 2019.07.01', osszeg: '160 000 Ft' })!
assert.deepEqual(p.rows.map(([k]) => k), ['Kedvezményezett', 'Számlaszám', 'Összeg', 'Közlemény'])
assert.match(paymentText(p), /Közlemény: Kiss Gábor 2019\.07\.01/)
assert.equal(payment({ ...form, paymentShow: false }, {}), null)
assert.equal(payment({}, {}), null)
console.log('payment ok')
