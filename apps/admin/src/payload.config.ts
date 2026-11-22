import { emailTestEndpoint } from './emailTest'
import { korlevelEndpoint } from './korlevel'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { hu } from '@payloadcms/translations/languages/hu'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Csoportok } from './collections/Csoportok'
import { Jelentkezesek } from './collections/Jelentkezesek'
import { Media } from './collections/Media'
import { Users } from './collections/Users'
import { Beallitasok } from './globals/Beallitasok'
import { Email } from './globals/Email'
import { Fooldal } from './globals/Fooldal'
import { Urlap } from './globals/Urlap'
import { Dokumentumok } from './globals/Dokumentumok'
import { emailFrom } from './email/template'
import { resetEndpoint } from './reset'
import { localizeGlobal } from './localize'

const filename = fileURLToPath(import.meta.url)
const resend = process.env.RESEND_API_KEY
const SMTP = {
  host: process.env.SMTP_HOST || (resend && 'smtp.resend.com'),
  port: Number(process.env.SMTP_PORT || (resend ? 465 : 587)),
  user: process.env.SMTP_USER || (resend && 'resend'),
  pass: process.env.SMTP_PASS || resend,
}
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: { titleSuffix: ' – BB Skills admin' },
    importMap: { baseDir: path.resolve(dirname), importMapFile: path.resolve(dirname, 'app/(payload)/importMap.js') },
    components: {
      afterNavLinks: ['/components/EditorLink#EditorLink'],
      // the visual page editor is the admin home page
      views: { dashboard: { Component: '/views/Szerkeszto#Szerkeszto' } },
    },
  },
  // Next basePath '/admin' (next.config.ts) + admin at '/' keeps the panel at /admin and moves the API to /admin/api,
  // so on Vercel the whole app sits under /admin next to the public site
  routes: { admin: '/' },
  i18n: { supportedLanguages: { hu }, fallbackLanguage: 'hu' },
  collections: [Jelentkezesek, Csoportok, Media, Users],
  globals: [Beallitasok, Fooldal, Urlap, Email, Dokumentumok].map(localizeGlobal),
  // page content in four languages; an untranslated text falls back to Hungarian
  localization: {
    locales: [
      { code: 'hu', label: 'Magyar' },
      { code: 'en', label: 'English' },
      { code: 'de', label: 'Deutsch' },
      { code: 'sv', label: 'Svenska' },
    ],
    defaultLocale: 'hu',
    fallback: true,
  },
  endpoints: [resetEndpoint, emailTestEndpoint, korlevelEndpoint],
  // outgoing mail over SMTP (Gmail, Resend, any provider); RESEND_API_KEY alone is enough for Resend.
  // Without either Payload only logs the e-mails.
  ...(SMTP.host && {
    email: nodemailerAdapter({
      defaultFromAddress: emailFrom() || '',
      defaultFromName: 'BB Skills tábor',
      transportOptions: {
        host: SMTP.host,
        port: SMTP.port,
        secure: SMTP.port === 465,
        auth: { user: SMTP.user, pass: SMTP.pass },
      },
    }),
  }),
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  // declare: false keeps the generated types importable from apps/web, which has no payload dependency
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts'), declare: false },
  db: mongooseAdapter({ url: process.env.DATABASE_URL || '' }),
  sharp,
  plugins: [
    // uploads go to Vercel Blob in production; locally (no token) they stay on disk
    vercelBlobStorage({
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      collections: { media: { disablePayloadAccessControl: true } },
      token: process.env.BLOB_READ_WRITE_TOKEN,
    }),
  ],
})
