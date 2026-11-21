import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  // the whole admin (panel, API, /_next assets) lives under /admin; the public site owns every other path
  basePath: '/admin',
  // admin-only deployments (no web service in front) would 404 on the bare domain
  redirects: async () => [{ source: '/', destination: '/admin', basePath: false, permanent: false }],
  images: {
    localPatterns: [
      {
        pathname: '/admin/api/media/file/**',
      },
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  // monorepo: dependencies are hoisted to the workspace root
  turbopack: {
    root: path.resolve(dirname, '../..'),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
