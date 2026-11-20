import type { Urlap } from "./cms";

export type FormField = NonNullable<NonNullable<NonNullable<Urlap["groups"]>[number]["fields"]>[number]>;

// field types that collect an answer (notes and images are display-only)
export const isInput = (f: FormField) => f.type !== "note" && f.type !== "image";

export const allFields = (form: Urlap): FormField[] => (form.groups ?? []).flatMap((g) => g.fields ?? []);

// a conditional field counts only when its trigger field has the chosen value
export const isVisible = (f: FormField, values: (name: string) => string[]) =>
  !f.ifField || values(f.ifField).includes(f.ifValue ?? "");
