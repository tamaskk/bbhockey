// run: node --experimental-strip-types src/lib/form.test.ts
import assert from "node:assert/strict";
import { isVisible, type FormField } from "./form.ts";

const v = (m: Record<string, string[]>) => (n: string) => m[n] ?? [];
const f = { label: "x", type: "text", ifField: "allergia", ifValue: "Igen" } as FormField;
assert.equal(isVisible(f, v({ allergia: ["Igen"] })), true);
assert.equal(isVisible(f, v({ allergia: ["Nem"] })), false);
assert.equal(isVisible({ label: "y", type: "text" } as FormField, v({})), true);
console.log("form ok");
