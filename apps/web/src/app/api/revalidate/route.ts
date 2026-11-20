import { revalidateTag } from "next/cache";

// Called by the admin after every save so the next page load shows the new content.
export function POST(req: Request) {
  const secret = process.env.SHARED_SECRET;
  if (!secret || req.headers.get("x-shared-secret") !== secret) return new Response("Unauthorized", { status: 401 });
  revalidateTag("cms", { expire: 0 });
  return Response.json({ revalidated: true });
}
