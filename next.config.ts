import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // the release's commit (scripts/deploy/release.sh): pages from an older release reload instead (lib/net/skew.ts)
  deploymentId: process.env.NEXT_DEPLOYMENT_ID || undefined,
  // document uploads go through server actions: 10 MB files (docs/08) + form overhead; nginx allows 11m
  experimental: { serverActions: { bodySizeLimit: '11mb' } },
  // native image processing (passport photo, signature, stamp) stays a Node dependency, not bundled
  serverExternalPackages: ['sharp', '@react-pdf/renderer'],
  // the launch-day show (owner, 7 Nov 2026): a self-contained page in public/launch, at /launch
  async rewrites() {
    return [{ source: '/launch', destination: '/launch/index.html' }];
  },
  async headers() {
    return [
      {
        // Font files carry a content hash in their name (jameel-noori.<hash>.woff2), so phones download the
        // 6.8 MB Urdu font once and keep it. Next.js serves public/ with max-age=0 otherwise.
        source: '/fonts/:file*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
