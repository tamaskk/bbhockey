"use client";
import { useEffect } from "react";

const CSS = `
[data-f]{outline:1px dashed transparent;outline-offset:3px;cursor:text;border-radius:2px}
[data-f]:hover{outline-color:rgba(255,200,0,.7)}
[data-f]:focus{outline:2px solid #ffc800;background:rgba(255,200,0,.08)}
[data-section]{position:relative}
[data-section][data-show="false"]>*:not(.bb-ed-bar){opacity:.3}
[data-section].bb-ed-drag{opacity:.5}
.bb-ed-bar{position:absolute;top:12px;right:12px;z-index:50;display:flex;gap:6px;font:600 13px/1 system-ui,sans-serif}
.bb-ed-bar button{all:unset;background:#111;color:#fff;padding:8px 10px;border-radius:6px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.3)}
.bb-ed-bar button[draggable]{cursor:grab}
`;

// Turns the server-rendered page into an editor: [data-f] texts become editable, [data-section]s draggable.
// Every change is posted to the admin window (the iframe parent), which saves it.
export default function EditMode({ adminOrigin }: { adminOrigin: string }) {
  useEffect(() => {
    if (window.parent === window) return; // opened directly, not from the admin: stay read-only
    const post = (path: string, value: unknown) => window.parent.postMessage({ bbEdit: true, path, value }, adminOrigin);
    const style = Object.assign(document.createElement("style"), { textContent: CSS });
    document.head.append(style);

    const fields = [...document.querySelectorAll<HTMLElement>("[data-f]")];
    fields.forEach((el) => (el.contentEditable = "plaintext-only"));
    const onInput = (e: Event) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>("[data-f]");
      if (el) post(el.dataset.f!, el.innerText.replace(/\n$/, ""));
    };
    const onKey = (e: KeyboardEvent) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>("[data-f]");
      if (el && e.key === "Enter" && !("ml" in el.dataset)) e.preventDefault();
    };
    // links and <summary> must not navigate/toggle while editing
    const onClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest("a, summary")) e.preventDefault();
    };
    document.addEventListener("input", onInput);
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick, true);

    const sections = () => [...document.querySelectorAll<HTMLElement>("[data-section]")];
    let dragged: HTMLElement | null = null;
    const bars = sections().map((sec) => {
      const bar = Object.assign(document.createElement("div"), { className: "bb-ed-bar" });
      const handle = Object.assign(document.createElement("button"), { textContent: "⠿ Húzd", title: "Húzással áthelyezheted", draggable: true });
      const eye = document.createElement("button");
      const label = () => (eye.textContent = sec.dataset.show === "true" ? "Elrejtés" : "Megjelenítés");
      label();
      eye.onclick = () => {
        sec.dataset.show = String(sec.dataset.show !== "true");
        label();
        post(`${sec.dataset.section}.show`, sec.dataset.show === "true");
      };
      handle.ondragstart = (e) => {
        dragged = sec;
        sec.classList.add("bb-ed-drag");
        e.dataTransfer?.setDragImage(sec, 20, 20);
      };
      handle.ondragend = () => {
        sec.classList.remove("bb-ed-drag");
        dragged = null;
        post("order", sections().map((s) => s.dataset.section));
      };
      sec.ondragover = (e) => {
        if (!dragged || dragged === sec) return;
        e.preventDefault();
        const r = sec.getBoundingClientRect();
        sec.parentElement!.insertBefore(dragged, e.clientY < r.top + r.height / 2 ? sec : sec.nextSibling);
      };
      sec.ondrop = (e) => e.preventDefault();
      bar.append(handle, eye);
      sec.append(bar);
      return bar;
    });

    return () => {
      document.removeEventListener("input", onInput);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick, true);
      fields.forEach((el) => el.removeAttribute("contenteditable"));
      bars.forEach((b) => b.remove());
      style.remove();
    };
  }, [adminOrigin]);
  return null;
}
