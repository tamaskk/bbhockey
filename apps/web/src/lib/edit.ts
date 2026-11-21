import type { CSSProperties } from "react";
import { css, type Looks } from "./style";

// Edit-mode markers read by app/szerkeszto/EditMode.tsx. Paths are "<global slug>:<field path>".
// Outside edit mode only the saved look (style) is rendered.
type A = Record<string, string> & { style?: CSSProperties };

export function editor(edit: boolean, slug: string, looks: Looks = {}) {
  const look = (key: string): A => {
    const l = looks?.[`${slug}:${key}`]; // styles is null after an editor reset
    const style = css(l, edit);
    return { ...(style && { style }), ...(edit && l?.hide === true && { "data-hidden": "" }) } as A;
  };
  const at = (attr: string, path: string, extra: Record<string, string> = {}): A =>
    edit ? { [attr]: `${slug}:${path}`, ...extra } : {};
  return {
    edit,
    /** inline-editable text; multiline allows Enter */
    f: (path: string, multiline?: boolean): A => ({ ...at("data-f", path, multiline ? { "data-ml": "" } : {}), ...look(path) }),
    /** array item: drag, duplicate, delete, settings, look */
    item: (path: string): A => ({ ...at("data-item", path), ...look(path) }),
    /** element moved as a whole when dragged freely (a button rather than its label) */
    move: (path: string): A => ({ ...at("data-move", path), ...look(path) }),
    /** image (upload field): replace by link */
    img: (path: string): A => at("data-img", path),
    /** section/block with a settings panel; `section` makes it draggable and hideable, `custom` deletable.
     *  `key` names its look when the settings path is shared (header and footer both edit the site settings). */
    block: (path: string, section?: { key: string; show: boolean; custom?: boolean }, key = path): A => ({
      ...at("data-block", path, {
        "data-style": `${slug}:${key}`,
        ...(section && { "data-section": section.key, "data-show": String(section.show) }),
        ...(section?.custom && { "data-custom": "" }),
      }),
      ...look(key),
    }),
  };
}
export type Ed = ReturnType<typeof editor>;
