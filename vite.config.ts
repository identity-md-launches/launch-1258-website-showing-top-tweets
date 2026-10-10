import { defineConfig } from 'vite';
import site from './site.config.json';

// Set publicUrl to the final HTTPS directory (including any deployment subpath).
// null keeps the export portable until its publisher chooses a host.
function socialImageUrl(publicUrl: string | null): string {
  if (publicUrl === null) return './assets/pond-social.jpg';
  const url = new URL(publicUrl);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
    throw new Error('site.config.json publicUrl must be an HTTPS directory URL without credentials, a query, or a fragment.');
  }
  if (!url.pathname.endsWith('/')) url.pathname += '/';
  return new URL('assets/pond-social.jpg', url).href;
}

export default defineConfig({
  base: './',
  build: { target: 'es2022' },
  plugins: [{
    name: 'static-social-image',
    transformIndexHtml(html) {
      const image = socialImageUrl(site.publicUrl).replaceAll('&', '&amp;').replaceAll('"', '&quot;');
      return html.replace(/(<meta property="og:image" content=")[^"]*("\s*\/?>)/, (_, before, after) => `${before}${image}${after}`);
    },
  }],
});
