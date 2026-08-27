import { readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const dist = join(process.cwd(), 'dist');
const assets = await readdir(join(dist, 'assets'));
const hashedAssets = assets
  .filter((name) => /-[A-Za-z0-9_-]{8,}\.(?:js|css)$/.test(name))
  .sort();

const config = {
  navigationFallback: {
    rewrite: '/index.html',
    exclude: ['/assets/*', '/*.{css,js,png,jpg,svg,webp,ico,woff2,json,txt,xml,wasm}'],
  },
  globalHeaders: {
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://api.sociobot.in https://pilot-api.sociobot.in; manifest-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  },
  routes: hashedAssets.map((asset) => ({
    route: `/assets/${asset}`,
    headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
  })),
};

await writeFile(join(dist, 'staticwebapp.config.json'), `${JSON.stringify(config, null, 2)}\n`);
console.log(`Wrote static host policy for ${hashedAssets.length} immutable hashed asset${hashedAssets.length === 1 ? '' : 's'}.`);
