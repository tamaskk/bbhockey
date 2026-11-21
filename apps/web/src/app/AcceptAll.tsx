"use client";

// ticks every consent checkbox of its form group (Jelentkezes.tsx)
export default function AcceptAll({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="mhk-btn mhk-btn-ghost bb-accept-all"
      onClick={(e) =>
        e.currentTarget.closest("fieldset")?.querySelectorAll<HTMLInputElement>(".mhk-form-check input[type=checkbox]").forEach((c) => {
          c.checked = true;
          c.dispatchEvent(new Event("change", { bubbles: true }));
        })
      }
    >
      <span>{label}</span>
    </button>
  );
}
