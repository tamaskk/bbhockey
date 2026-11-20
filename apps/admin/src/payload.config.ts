import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { importExportPlugin } from '@payloadcms/plugin-import-export'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { hu } from '@payloadcms/translations/languages/hu'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Jelentkezesek } from './collections/Jelentkezesek'
import { Media } from './collections/Media'
import { Users } from './collections/Users'
import { Beallitasok } from './globals/Beallitasok'
import { Fooldal } from './globals/Fooldal'
import { Urlap } from './globals/Urlap'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: { titleSuffix: ' – BB Skills admin' },
    importMap: { baseDir: path.resolve(dirname) },
    components: {
      afterNavLinks: ['/components/EditorLink#EditorLink'],
      views: { szerkeszto: { Component: '/views/Szerkeszto#Szerkeszto', path: '/szerkeszto' } },
    },
  },
  i18n: { supportedLanguages: { hu }, fallbackLanguage: 'hu' },
  collections: [Jelentkezesek, Media, Users],
  globals: [Beallitasok, Fooldal, Urlap],
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
