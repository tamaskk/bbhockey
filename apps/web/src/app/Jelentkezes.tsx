import "./jelentkezes.css";
import { alt, img, type Urlap } from "@/lib/cms";
import type { FormField } from "@/lib/form";

const Linked = ({ text, href }: { text: string; href?: string | null }) =>
  href ? <a href={href} target="_blank" rel="noopener">{text}</a> : <>{text}</>;

const star = (f: FormField) => (f.required ? " *" : "");

function Control({ f, privacyUrl }: { f: FormField; privacyUrl?: string | null }) {
  const name = f.name ?? "";
  const id = `f-${name}`;
  const help = f.help && <small className="bb-help">{f.help}</small>;
  const opts = f.options ?? [];

  switch (f.type) {
    case "note":
      return <p className="bb-note">{f.label}{f.help && <><br />{f.help}</>}</p>;
    case "image": {
      const src = img(f.image);
      return src ? <img className="bb-size-chart" src={src} alt={alt(f.image) || f.label} loading="lazy" /> : null;
    }
    case "consent":
      return (
        <label className="mhk-form-check">
          <input type="checkbox" name={name} value="igen" required={!!f.required} />
          <span><Linked text={f.label} href={f.link || (name === "adatkezeles" ? privacyUrl : null)} />{star(f)}</span>
        </label>
      );
    case "radio":
    case "checkboxes":
      return (
        <fieldset className="bb-choices">
          <legend>{f.label}{star(f)}</legend>
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
      <label htmlFor={id}>{f.label}{star(f)}</label>
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

function Item({ f, privacyUrl }: { f: FormField; privacyUrl?: string | null }) {
  // choices/consents/notes keep their own styling, outside the text-input field rules
  const base = ["radio", "checkboxes", "consent", "note", "image"].includes(f.type) ? "bb-item" : "mhk-form-field";
  const cls = `${base}${f.width === "full" ? " mhk-full" : ""}`;
  const control = <Control f={f} privacyUrl={privacyUrl} />;
  // conditional fields start disabled (hidden, skipped by validation); the bb-form-if script enables them
  return f.ifField ? (
    <fieldset className={`bb-if ${cls}`} data-if={f.ifField} data-if-value={f.ifValue ?? ""} disabled>{control}</fieldset>
  ) : (
    <div className={cls}>{control}</div>
  );
}

export default function Jelentkezes({ form, privacyUrl }: { form: Urlap; privacyUrl?: string | null }) {
  return (
    <section className="mhk-sec bb-jelentkezes" id="jelentkezes">
      <div className="mhk-wrap">
        <div className="mhk-section-head">
          <div>
            <h2>{form.title} {form.highlight && <em>{form.highlight}</em>}</h2>
            {form.open && form.intro && <p>{form.intro}</p>}
          </div>
        </div>

        {!form.open ? (
          <p className="mhk-form-panel bb-closed">{form.closedText}</p>
        ) : (
          <form className="mhk-form-panel mhk-form bb-form" data-form="jelentkezes">
            {(form.groups ?? []).map((g) => (
              <fieldset className="bb-group" key={g.id ?? g.title}>
                <legend>{g.title}</legend>
                <div className="mhk-form-grid">
                  {(g.fields ?? []).map((f) => <Item key={f.id ?? f.name} f={f} privacyUrl={privacyUrl} />)}
                </div>
              </fieldset>
            ))}

            <input aria-hidden="true" autoComplete="off" className="mhk-hp" name="website" tabIndex={-1} type="text" />
            <button className="mhk-btn mhk-btn-primary" type="submit"><span>{form.submitLabel}</span></button>
            <p className="mhk-form-msg" role="status" />
          </form>
        )}
      </div>
    </section>
  );
}
