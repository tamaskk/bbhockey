// run: node --experimental-strip-types src/lib/image.test.ts
import assert from "node:assert/strict";
import { sized } from "./image.ts";

assert.equal(sized("https://lh3.googleusercontent.com/d/1E73cbXcQNPfUN6zAfO9l3BTG0WZDJtdT", 800), "https://lh3.googleusercontent.com/d/1E73cbXcQNPfUN6zAfO9l3BTG0WZDJtdT=w800-rj-l80");
// other hosts and already-sized Drive URLs stay as they are
assert.equal(sized("https://x.public.blob.vercel-storage.com/a.jpg"), "https://x.public.blob.vercel-storage.com/a.jpg");
assert.equal(sized("https://lh3.googleusercontent.com/d/abc=w400"), "https://lh3.googleusercontent.com/d/abc=w400");
console.log("image ok");
