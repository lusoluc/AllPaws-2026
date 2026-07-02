import type { NextConfig } from "next";
import fs from 'fs';
import path from 'path';

// Automatically update CACHE_NAME in public/sw.js with a build timestamp
try {
  const swPath = path.join(process.cwd(), 'public', 'sw.js');
  if (fs.existsSync(swPath)) {
    const buildTimestamp = Date.now();
    let swContent = fs.readFileSync(swPath, 'utf8');
    swContent = swContent.replace(/const CACHE_NAME = 'bmd-cache-[^']+';/, `const CACHE_NAME = 'bmd-cache-${buildTimestamp}';`);
    fs.writeFileSync(swPath, swContent, 'utf8');
    console.log(`[PWA Builder] Updated CACHE_NAME to bmd-cache-${buildTimestamp}`);

    // Generate version file for client-side display
    const versionPath = path.join(process.cwd(), 'lib', 'version.ts');
    const versionContent = `// Automatically generated version file\nexport const APP_VERSION = '0.1.0-build-${buildTimestamp}';\n`;
    fs.writeFileSync(versionPath, versionContent, 'utf8');
  }
} catch (error) {
  console.error('[PWA Builder] Failed to update Service Worker cache name or version:', error);
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
