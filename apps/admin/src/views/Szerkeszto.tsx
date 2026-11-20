import type { AdminViewServerProps } from 'payload'
import { redirect } from 'next/navigation'
import { Editor } from './Editor'

// Visual page editor: the live site in edit mode, saved automatically into the "fooldal" global.
export const Szerkeszto = ({ initPageResult }: AdminViewServerProps) => {
  if (!initPageResult.req.user) redirect('/admin/login?redirect=/admin/szerkeszto')
  return <Editor webUrl={process.env.WEB_URL || 'http://localhost:3000'} />
}
