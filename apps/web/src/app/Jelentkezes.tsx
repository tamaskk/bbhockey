import "./jelentkezes.css";
import { Fragment } from "react";
import { alt, img, type Urlap } from "@/lib/cms";
import type { FormField } from "@/lib/form";
import { editor, type Ed } from "@/lib/edit";
import type { Looks } from "@/lib/style";
import AcceptAll from "./AcceptAll";
import TestFill from "./TestFill";

const Linked = ({ text, href }: { text: string; href?: string | null }) =>
  href ? <a href={href} target="_blank" rel="noopener">{text}</a> : <>{text}</>;

const star = (f: FormField) => (f.required ? " *" : "");

function Control({ f, privacyUrl, p, e }: { f: FormField; privacyUrl?: string | null; p: string; e: Ed }) {
  const name = f.name ?? "";
  const id = `f-${name}`;
  const help = (e.edit || f.help) && <small className="bb-help" {...e.f(`${p}.help`, true)}>{f.help}</small>;
  const label = <span {...e.f(`${p}.label`)}>{f.label}</span>;
  const opts = f.options ?? [];

  switch (f.type) {
    case "note":
      return <p className="bb-note">{label}{(e.edit || f.help) && <><br /><span {...e.f(`${p}.help`, true)}>{f.help}</span></>}</p>;
    case "image": {
      const src = img(f.image);
      return src || e.edit ? <img className="bb-size-chart" src={src} alt={alt(f.image) || f.label} loading="lazy" {...e.img(`${p}.image`)} /> : null;
    }
    case "consent":
      return (
        <label className="mhk-form-check">
          <input type="checkbox" name={name} value="igen" required={!!f.required} />
          <span>{e.edit ? label : <Linked text={f.label} href={f.link || (name === "adatkezeles" ? privacyUrl : null)} />}{star(f)}</span>
        </label>
      );
    case "radio":
    case "checkboxes":
      return (
        <fieldset className="bb-choices">
          <legend>{label}{star(f)}</legend>
          <div>
            {opts.map((o, i) => (
              <label key={o}>
                {/* one required radio makes the whole group required */}
                <input type={f.type === "radio" ? "radio" : "checkbox"} name={name} value={o} required={!!f.required && f.type === "radio" && i === 0} />
                <span>{o}</span>
              </label>
            ))}
          </div>
          {help}
        </fieldset>
      );
  }

  const common = { id, name, required: !!f.required, placeholder: f.placeholder ?? undefined };
  return (
    <>
      <label htmlFor={id}>{label}{star(f)}</label>
      {f.type === "textarea" ? (
        <textarea rows={3} {...common} />
      ) : f.type === "select" ? (
        <select {...common} defaultValue="">
          <option value="" disabled>Válassz…</option>
          {opts.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={f.type} autoComplete={f.type === "email" ? "email" : f.type === "tel" ? "tel" : undefined} {...common} />
      )}
      {help}
    </>
  );
}

function Item({ f, privacyUrl, p, e }: { f: FormField; privacyUrl?: string | null; p: string; e: Ed }) {
  // choices/consents/notes keep their own styling, outside the text-input field rules
  const base = ["radio", "checkboxes", "consent", "note", "image"].includes(f.type) ? "bb-item" : "mhk-form-field";
  const cls = `${base}${f.width === "full" ? " mhk-full" : ""}`;
  const control = <Control f={f} privacyUrl={privacyUrl} p={p} e={e} />;
  // conditional fields start disabled (hidden, skipped by validation); the bb-form-if script enables them
  return f.ifField ? (
    <fieldset className={`bb-if ${cls}`} data-if={f.ifField} data-if-value={f.ifValue ?? ""} disabled={!e.edit} {...e.item(p)}>{control}</fieldset>
  ) : (
    <div className={cls} {...e.item(p)}>{control}</div>
  );
}

export default function Jelentkezes({ form, privacyUrl, looks, edit = false }: { form: Urlap; privacyUrl?: string | null; looks?: Looks; edit?: boolean }) {
  const e = editor(edit, "urlap", looks);
  return (
    <section className="mhk-sec bb-jelentkezes" id="jelentkezes" {...e.block("", undefined, "section")}>
      <div className="mhk-wrap">
        <div className="mhk-section-head">
          <div>
            <h2><span {...e.f("title")}>{form.title}</span> {(edit || form.highlight) && <em {...e.f("highlight")}>{form.highlight}</em>}</h2>
            {form.open && (edit || form.intro) && <p {...e.f("intro", true)}>{form.intro}</p>}
          </div>
        </div>

        {!form.open ? (
          <p className="mhk-form-panel bb-closed" {...e.f("closedText", true)}>{form.closedText}</p>
        ) : (
          <form className="mhk-form-panel mhk-form bb-form" data-form="jelentkezes">
            {!edit && <TestFill />}
            {(form.groups ?? []).map((g, gi) => (
              <fieldset className="bb-group" key={g.id ?? g.title} {...e.item(`groups.${gi}`)}>
                <legend {...e.f(`groups.${gi}.title`)}>{g.title}</legend>
                <div className="mhk-form-grid">
                  {(g.fields ?? []).map((f, fi, all) => (
                    <Fragment key={f.id ?? f.name}>
                      {/* before the first of two or more consents */}
                      {f.type === "consent" && all.findIndex((x) => x.type === "consent") === fi && all.filter((x) => x.type === "consent").length > 1 && <div className="bb-item mhk-full"><AcceptAll /></div>}
                      <Item f={f} privacyUrl={privacyUrl} p={`groups.${gi}.fields.${fi}`} e={e} />
                    </Fragment>
                  ))}
                </div>
              </fieldset>
            ))}

            <input aria-hidden="true" autoComplete="off" className="mhk-hp" name="website" tabIndex={-1} type="text" />
            <button className="mhk-btn mhk-btn-primary" type="submit"><span {...e.f("submitLabel")}>{form.submitLabel}</span></button>
            <p className="mhk-form-msg" role="status" />
          </form>
        )}
      </div>
    </section>
  );
}
