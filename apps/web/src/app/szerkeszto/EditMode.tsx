"use client";
import { useEffect } from "react";

const CSS = `
[data-f]{outline:1px dashed transparent;outline-offset:3px;cursor:text;border-radius:2px;min-width:1ch}
[data-f]:hover{outline-color:rgba(255,200,0,.7)}
[data-f]:focus{outline:2px solid #ffc800;background:rgba(255,200,0,.08)}
[data-f]:empty::before{content:"(üres – kattints és írj)";opacity:.45;font-style:italic}
/* inside list items (form fields, cards) empty optional texts only appear on hover, to keep the page readable */
[data-item] [data-f]:empty:not(:focus){display:none}
[data-item]:not(:has([data-item])):hover [data-f]:empty{display:revert}
[data-block],[data-item],[data-img]{position:relative}
[data-show="false"]>*:not(.bb-ed-bar){opacity:.3}
[data-item]:hover{outline:1px dashed rgba(80,160,255,.8);outline-offset:4px}
.bb-ed-drag{opacity:.4}
.bb-ed-bar{position:absolute;z-index:60;display:flex;gap:4px;font:600 12px/1 system-ui,sans-serif}
.bb-ed-bar.block{top:10px;right:10px}
/* header: right side holds the CTA button; ribbon: rotated, its right end is clipped */
.mhk-sticky-header>.bb-ed-bar.block,.mhk-marquee>.bb-ed-bar.block{right:auto;left:10px}
.bb-ed-bar.item{top:6px;right:6px;display:none}
.bb-ed-bar.item button{font-size:14px;padding:7px 9px}
.bb-ed-bar.img{bottom:8px;left:8px;display:none}
.bb-ed-bar.text{display:none;z-index:70}
.bb-ed-bar.text button{background:#b45309}
.bb-ed-bar.text button:first-child{cursor:move}
/* deleted texts are gone while editing too; the section's "👁 Törölt" button shows them for restoring */
[data-hidden]{display:none!important}
.bb-show-hidden [data-hidden]{display:revert!important;outline:2px dashed #dc2626!important;outline-offset:2px}
/* empty optional texts only show their placeholder while their section is hovered */
[data-block]:not(:hover) [data-f]:empty:not(:focus){display:none}
[data-item]:hover>.bb-ed-bar.item,[data-img]:hover>.bb-ed-bar.img{display:flex}
.bb-ed-bar button{all:unset;background:#111;color:#fff;padding:6px 8px;border-radius:6px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.35);white-space:nowrap}
.bb-ed-bar button:hover{background:#333}
.bb-ed-bar.item button{background:#1d4ed8}
.bb-ed-bar.img button{background:#7c3aed}
.bb-ed-bar button[title^="Fogd"]{cursor:grab}
body.bb-ed-dragging,body.bb-ed-dragging *{cursor:grabbing!important;user-select:none!important}
[data-item]:not(:has([data-item])),[data-section]{cursor:grab}
[data-item] [data-f]{cursor:text}
[data-section] [data-f]:not(:focus),[data-move]{cursor:move}
.bb-ed-drag{outline:3px dashed #1d4ed8!important;outline-offset:4px}
.bb-form fieldset.bb-if{opacity:.6}
.bb-splash{display:none!important}
body.bb-ed-busy{pointer-events:none;opacity:.6;cursor:progress}
`;
const SCROLL = "bb-ed-scroll";

// raw text of an editable element: not innerText, which applies CSS text-transform (uppercase headings)
const textOf = (el: HTMLElement) => {
  const c = el.cloneNode(true) as HTMLElement;
  c.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
  return (c.textContent ?? "").replace(/\n$/, "");
};

// list path of an item: "fooldal:tabor.tiles.2" -> "fooldal:tabor.tiles"
const listOf = (p: string) => p.slice(0, p.lastIndexOf("."));

// Turns the server-rendered page into an editor. Markers come from lib/edit.ts:
// [data-f] editable text, [data-item] list item, [data-img] image, [data-block]/[data-section] section.
// Every change is posted to the admin window (the iframe parent), which saves it.
export default function EditMode({ adminOrigin }: { adminOrigin: string }) {
  useEffect(() => {
    if (window.parent === window) return; // opened directly, not from the admin: stay read-only
    // same origin on Vercel (admin under /admin), separate port in local dev
    const target = adminOrigin || window.location.origin;
    const post = (msg: Record<string, unknown>) => {
      // list changes make the item paths on this page stale: lock it until the admin reloads it with the saved data
      if (["move", "dup", "del", "delSection", "order"].includes(msg.op as string)) {
        document.body.classList.add("bb-ed-busy");
        // safety: never stay locked if the admin doesn't answer
        setTimeout(() => location.reload(), 8000);
      }
      if (msg.op === "order") delete msg.op; // plain value set, "order" only marked it as a lock-worthy change
      window.parent.postMessage({ bbEdit: true, ...msg }, target);
    };
    const style = Object.assign(document.createElement("style"), { textContent: CSS });
    document.head.append(style);
    const added: HTMLElement[] = [style];

    // the admin reloads this frame after structural changes: keep the scroll position
    try {
      const y = Number(sessionStorage.getItem(SCROLL));
      if (y) requestAnimationFrame(() => window.scrollTo(0, y));
    } catch {}
    const saveScroll = () => {
      try { sessionStorage.setItem(SCROLL, String(window.scrollY)); } catch {}
    };
    window.addEventListener("scroll", saveScroll, { passive: true });

    // conditional form fields are shown (enabled) while editing
    document.querySelectorAll<HTMLFieldSetElement>("fieldset[disabled]").forEach((f) => (f.disabled = false));

    const fields = [...document.querySelectorAll<HTMLElement>("[data-f]")];
    fields.forEach((el) => (el.contentEditable = "plaintext-only"));
    const onInput = (e: Event) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>("[data-f]");
      if (el) post({ path: el.dataset.f, value: textOf(el) });
    };
    const onKey = (e: KeyboardEvent) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>("[data-f]");
      if (el && e.key === "Enter" && !("ml" in el.dataset)) e.preventDefault();
    };
    // links, <summary>, page buttons and the form must not act while editing
    const onClick = (e: MouseEvent) => {
      // editor buttons can sit inside a link (tiles): their handlers still run, only navigation stops
      if ((e.target as HTMLElement).closest("a, summary, button, label")) e.preventDefault();
    };
    const onSubmit = (e: Event) => e.preventDefault();
    document.addEventListener("input", onInput);
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);

    const bar = (host: HTMLElement, kind: string, buttons: [string, string, () => void][]) => {
      const b = Object.assign(document.createElement("div"), { className: `bb-ed-bar ${kind}`, contentEditable: "false" });
      for (const [text, title, onclick] of buttons) {
        const btn = Object.assign(document.createElement("button"), { type: "button", textContent: text, title, onclick });
        b.append(btn);
      }
      host.append(b);
      added.push(b);
      return b;
    };

    // Drag with mouse/touch (pointer events work in every browser, native HTML5 drag doesn't on buttons in Safari/Firefox).
    // The element moves live among its peers; the page scrolls when the pointer nears the top/bottom edge.
    type Drag = { peers: () => HTMLElement[]; done: (els: HTMLElement[]) => void };
    const dragInfo = new WeakMap<HTMLElement, Drag>();
    const startDrag = (el: HTMLElement, { peers, done }: Drag, y0: number) => {
      const before = peers();
      window.getSelection()?.removeAllRanges();
      (document.activeElement as HTMLElement | null)?.blur?.();
      el.classList.add("bb-ed-drag");
      document.body.classList.add("bb-ed-dragging");
      let y = y0;
      const edge = setInterval(() => {
        if (y < 80) window.scrollBy(0, -18);
        else if (y > window.innerHeight - 80) window.scrollBy(0, 18);
      }, 16);
      let ended = false;
      const end = () => {
        if (ended) return;
        ended = true;
        clearInterval(edge);
        document.removeEventListener("pointermove", move);
        document.removeEventListener("pointerup", end);
        document.removeEventListener("pointercancel", end);
        document.documentElement.removeEventListener("pointerleave", end);
        el.classList.remove("bb-ed-drag");
        document.body.classList.remove("bb-ed-dragging");
        const after = peers();
        if (after.some((x, i) => x !== before[i])) done(after);
      };
      const move = (ev: PointerEvent) => {
        // button released outside the frame (no pointerup reached us): finish here
        if (!ev.buttons) return end();
        y = ev.clientY;
        const over = peers().find((p) => {
          if (p === el || p.contains(el)) return false;
          const r = p.getBoundingClientRect();
          return ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom;
        });
        if (!over) return;
        const r = over.getBoundingClientRect();
        // side-by-side items (grid rows) use the horizontal midpoint, stacked ones the vertical
        const first = r.width < over.parentElement!.clientWidth * 0.8 ? ev.clientX < r.left + r.width / 2 : ev.clientY < r.top + r.height / 2;
        over.parentElement!.insertBefore(el, first ? over : over.nextSibling);
      };
      document.addEventListener("pointermove", move);
      document.addEventListener("pointerup", end);
      document.addEventListener("pointercancel", end);
      // pointer left the page (e.g. onto the admin bar): drop where it is
      document.documentElement.addEventListener("pointerleave", end);
    };
    // Drag with mouse/touch (pointer events work in every browser, unlike native HTML5 drag on buttons).
    // The ⠿ handle starts at once; the element itself starts after an 8px move, so a plain click still edits text.
    const draggable = (el: HTMLElement, handle: HTMLElement, peers: () => HTMLElement[], done: (els: HTMLElement[]) => void) => {
      dragInfo.set(el, { peers, done });
      handle.style.touchAction = "none";
      handle.onpointerdown = (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        startDrag(el, { peers, done }, e.clientY);
      };
    };
    // free move: a text (or button) outside list items goes wherever it is dropped; saved as an x/y offset in its look
    const freeMove = (el: HTMLElement, key: string, x0: number, y0: number) => {
      const bx = parseFloat(el.style.left) || 0, by = parseFloat(el.style.top) || 0;
      window.getSelection()?.removeAllRanges();
      (document.activeElement as HTMLElement | null)?.blur?.();
      el.style.position = "relative";
      el.classList.add("bb-ed-drag");
      document.body.classList.add("bb-ed-dragging");
      let x = bx, y = by;
      const move = (ev: PointerEvent) => {
        if (!ev.buttons) return end();
        x = Math.round(bx + ev.clientX - x0);
        y = Math.round(by + ev.clientY - y0);
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
      };
      const end = () => {
        document.removeEventListener("pointermove", move);
        document.removeEventListener("pointerup", end);
        document.documentElement.removeEventListener("pointerleave", end);
        el.classList.remove("bb-ed-drag");
        document.body.classList.remove("bb-ed-dragging");
        if (x !== bx || y !== by) post({ op: "nudge", path: key, value: { x, y } });
      };
      document.addEventListener("pointermove", move);
      document.addEventListener("pointerup", end);
      document.documentElement.addEventListener("pointerleave", end);
    };
    const onGrab = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const t = e.target as HTMLElement;
      if (t.closest(".bb-ed-bar, input, textarea, select")) return;
      const text = t.closest<HTMLElement>("[data-f]");
      if (text && text === document.activeElement) return; // editing it: dragging selects text
      const el = t.closest<HTMLElement>("[data-item], [data-section]");
      // what is grabbed moves: list item -> reorder; a text/button outside items -> free move; else the section
      const loose = !t.closest("[data-item]") && (t.closest<HTMLElement>("[data-move]") ?? text);
      const info = el && dragInfo.get(el);
      if (!loose && !info) return;
      const x0 = e.clientX, y0 = e.clientY;
      const wait = (ev: PointerEvent) => {
        if (Math.hypot(ev.clientX - x0, ev.clientY - y0) < 8) return;
        stop();
        if (loose) freeMove(loose, (loose.dataset.move ?? loose.dataset.f)!, x0, y0);
        else startDrag(el!, info!, ev.clientY);
      };
      const stop = () => {
        document.removeEventListener("pointermove", wait);
        document.removeEventListener("pointerup", stop);
      };
      document.addEventListener("pointermove", wait);
      document.addEventListener("pointerup", stop);
    };
    // the browser's own image/link dragging would swallow the pointer events
    const noNativeDrag = (e: DragEvent) => e.preventDefault();
    document.addEventListener("pointerdown", onGrab);
    document.addEventListener("dragstart", noNativeDrag);

    const look = (key: string): [string, string, () => void] => ["🎨", "Kinézet: szín, háttér, betűtípus, méret", () => post({ op: "style", path: key })];

    // one step up/down without dragging
    const step = (el: HTMLElement, peers: () => HTMLElement[], dir: -1 | 1, done: (els: HTMLElement[]) => void) => () => {
      const list = peers();
      const other = list[list.indexOf(el) + dir];
      if (!other) return;
      other.parentElement!.insertBefore(el, dir < 0 ? other : other.nextSibling);
      done(peers());
    };

    // sections and blocks
    const sections = () => [...document.querySelectorAll<HTMLElement>("[data-section]")];
    const saveOrder = (els: HTMLElement[]) => post({ op: "order", path: "fooldal:order", value: els.map((s) => s.dataset.section) });
    document.querySelectorAll<HTMLElement>("[data-block]").forEach((blk) => {
      const path = blk.dataset.block!;
      const settings: [string, string, () => void] = ["⚙ Beállítások", "Linkek, kapcsolók, minden mező", () => post({ op: "settings", path })];
      const style = look(blk.dataset.style!);
      const hidden = blk.querySelectorAll("[data-hidden]").length;
      const showHidden: [string, string, () => void][] = hidden
        ? [[`👁 Törölt (${hidden})`, "Törölt elemek mutatása: kattints beléjük, és ↺ Visszahozás", () => blk.classList.toggle("bb-show-hidden")]]
        : [];
      if (!blk.dataset.section) return void bar(blk, "block", [...showHidden, style, settings]);
      const b = bar(blk, "block", [
        ["⠿ Húzd", "Fogd meg és húzd fel vagy le", () => {}],
        ["▲", "Feljebb", step(blk, sections, -1, saveOrder)],
        ["▼", "Lejjebb", step(blk, sections, 1, saveOrder)],
        [blk.dataset.show === "true" ? "Elrejtés" : "Megjelenítés", "Látszik-e az oldalon", () => {
          blk.dataset.show = String(blk.dataset.show !== "true");
          b.children[3].textContent = blk.dataset.show === "true" ? "Elrejtés" : "Megjelenítés";
          post({ path: `${path}.show`, value: blk.dataset.show === "true" });
        }],
        ...showHidden,
        style,
        settings,
        ["＋ Új szekció", "Új szekció beszúrása ez alá", () => post({ op: "addSection", path: `fooldal:${blk.dataset.section}` })],
        ["✕ Törlés", "Szekció törlése (↶ Visszavonás-sal visszahozható)", () => post({ op: "delSection", path })],
      ]);
      draggable(blk, b.children[0] as HTMLElement, sections, saveOrder);
    });

    // list items: drag within the same list, duplicate, delete, settings
    document.querySelectorAll<HTMLElement>("[data-item]").forEach((it) => {
      const path = it.dataset.item!;
      const list = listOf(path);
      const peers = () => [...document.querySelectorAll<HTMLElement>("[data-item]")].filter((x) => listOf(x.dataset.item!) === list);
      const moved = (els: HTMLElement[]) => {
        const order = els.map((x) => Number(x.dataset.item!.slice(list.length + 1)));
        if (order.some((n, i) => n !== i)) post({ op: "move", path: list, order });
      };
      const b = bar(it, "item", [
        ["⠿", "Fogd meg és húzd", () => {}],
        ["▲", "Előrébb", step(it, peers, -1, moved)],
        ["▼", "Hátrébb", step(it, peers, 1, moved)],
        ["⧉", "Másolat (új elem)", () => post({ op: "dup", path })],
        look(path),
        ["⚙", "Beállítások", () => post({ op: "settings", path })],
        ["✕", "Törlés (↶ Visszavonás-sal visszahozható)", () => post({ op: "del", path })],
      ]);
      draggable(it, b.children[0] as HTMLElement, peers, moved);
    });

    // text look: a floating 🎨 button next to the text being edited
    const tbar = Object.assign(document.createElement("div"), { className: "bb-ed-bar text", contentEditable: "false" });
    const tbtn = (text: string, title: string) => {
      const b = Object.assign(document.createElement("button"), { type: "button", textContent: text, title });
      b.onmousedown = (e) => e.preventDefault(); // keep the text focused
      tbar.append(b);
      return b;
    };
    const moveBtn = tbtn("✥ Mozgatás", "Fogd meg és húzd oda, ahova szeretnéd");
    const lookBtn = tbtn("🎨 Kinézet", "Szín, betűtípus, méret, igazítás");
    const delBtn = tbtn("✕ Törlés", "Eltűnik az oldalról (visszahozható)");
    document.body.append(tbar);
    added.push(tbar);
    let current: HTMLElement | null = null;
    // a button's label moves the whole button
    const moving = () => (current?.closest<HTMLElement>("[data-move]") ?? current)!;
    moveBtn.style.touchAction = "none";
    moveBtn.onpointerdown = (e) => {
      if (!current || e.button !== 0) return;
      e.preventDefault();
      const el = moving();
      tbar.style.display = "none";
      freeMove(el, (el.dataset.move ?? el.dataset.f)!, e.clientX, e.clientY);
    };
    lookBtn.onclick = () => current && post({ op: "style", path: current.dataset.f });
    delBtn.onclick = () => {
      if (!current) return;
      const el = moving();
      post({ op: "hide", path: el.dataset.move ?? el.dataset.f, value: !el.hasAttribute("data-hidden") });
    };
    const onFocus = (e: FocusEvent) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>("[data-f]");
      if (!el) return;
      current = el;
      delBtn.textContent = moving().hasAttribute("data-hidden") ? "↺ Visszahozás" : "✕ Törlés";
      const r = el.getBoundingClientRect();
      tbar.style.cssText = `display:flex;position:absolute;left:${r.left + window.scrollX}px;top:${Math.max(0, r.top + window.scrollY - 34)}px`;
    };
    const onBlur = () => setTimeout(() => {
      if (!document.activeElement?.closest("[data-f]")) tbar.style.display = "none";
    }, 150);
    document.addEventListener("focusin", onFocus);
    document.addEventListener("focusout", onBlur);

    // images
    document.querySelectorAll<HTMLElement>("[data-img]").forEach((im) => {
      const path = im.dataset.img!;
      // <img> can't hold children: put the button on its parent
      const host = im.tagName === "IMG" ? im.parentElement! : im;
      if (host !== im) host.dataset.img ??= path;
      bar(host, "img", [["🖼 Kép cseréje", "Google Drive link beillesztése", () => post({ op: "img", path })]]);
    });

    return () => {
      document.removeEventListener("input", onInput);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("pointerdown", onGrab);
      document.removeEventListener("dragstart", noNativeDrag);
      document.removeEventListener("focusout", onBlur);
      window.removeEventListener("scroll", saveScroll);
      fields.forEach((el) => el.removeAttribute("contenteditable"));
      added.forEach((el) => el.remove());
    };
  }, [adminOrigin]);
  return null;
}
