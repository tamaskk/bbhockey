import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { importExportPlugin } from '@payloadcms/plugin-import-export'
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

const filename = fileURLToPath(import.meta.url)
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
  globals: [Beallitasok, Fooldal, Urlap, Email],
  // outgoing mail over SMTP (Gmail, Resend, any provider); without SMTP_HOST Payload only logs the e-mails
  ...(process.env.SMTP_HOST && {
    email: nodemailerAdapter({
      defaultFromAddress: process.env.EMAIL_FROM || process.env.SMTP_USER || '',
      defaultFromName: 'BB Skills tábor',
      transportOptions: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
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
    importExportPlugin({ collections: [{ slug: 'jelentkezesek' }] }),
    // uploads go to Vercel Blob in production; locally (no token) they stay on disk
    vercelBlobStorage({
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      collections: { media: { disablePayloadAccessControl: true } },
      token: process.env.BLOB_READ_WRITE_TOKEN,
    }),
  ],
})
