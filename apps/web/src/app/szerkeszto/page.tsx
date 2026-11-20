import type { Metadata } from "next";
import { ADMIN_URL } from "@/lib/cms";
import Site from "../Site";
import EditMode from "./EditMode";

export const metadata: Metadata = { robots: { index: false, follow: false } };

// The site in edit mode; shown inside the admin's "Oldalszerkesztő" iframe, which does the saving.
export default function Szerkeszto() {
  return (
    <>
      <Site edit />
      <EditMode adminOrigin={new URL(ADMIN_URL).origin} />
    </>
  );
}
