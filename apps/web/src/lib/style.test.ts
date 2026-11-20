// run: node --experimental-strip-types src/lib/style.test.ts
import assert from "node:assert/strict";
import { css, fontsHref, fontName } from "./style.ts";

assert.deepEqual(css({ color: "#ff0000", size: 20, weight: "800", align: "center", pad: 40 }), { color: "#ff0000", fontSize: "20px", fontWeight: 800, textAlign: "center", paddingTop: "40px", paddingBottom: "40px" });
// injection attempts are dropped
assert.equal(css({ color: "red;background:url(x)", bg: "url(evil)", font: "x';}body{display:none", size: 9999 } as never), undefined);
assert.equal(fontName("Open Sans:ital,wght@0,400;1,700"), "Open Sans");
assert.equal(fontsHref(["Inter:wght@400;600", "", null, "Inter:wght@400;600", "bad\"font"]), "https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap");
assert.equal(fontsHref([]), undefined);
assert.equal((css({ font: "Inter:wght@400" }) as Record<string, string>)["--bb-fh"], '"Inter"');
assert.deepEqual(css({ x: 12, y: -5 }), { position: "relative", left: "12px", top: "-5px" });
assert.equal(css({ x: 99999 }), undefined);
assert.deepEqual(css({ hide: true }), { display: "none" });
assert.deepEqual(css({ hide: true }, true), { opacity: 0.3 });
console.log("style ok");
