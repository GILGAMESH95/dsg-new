import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  images: {
    // локально Payload отдаёт абсолютные URL вида http://localhost:3000/..., оптимизатор должен их скачать
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== 'production',
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '3000', pathname: '/api/media/file/**' },
    ],
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
  },
  // Новости переехали с /blog на /about/news — старые ссылки ведут на новые адреса
  async redirects() {
    return [
      { source: '/:locale(ka|ru|en)/blog', destination: '/:locale/about/news', permanent: true },
      { source: '/:locale(ka|ru|en)/blog/:slug', destination: '/:locale/about/news/:slug', permanent: true },
    ]
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
