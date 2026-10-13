// Builds dist/Keystone.html: one self-contained file (code, styles, piano samples)
// that opens by double-click, with no server needed.
// Usage: npm run build

import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

const bundle = await build({
  entryPoints: [path.join(root, 'js/app.js')],
  bundle: true, format: 'iife', minify: true, write: false, target: 'es2020',
});
const js = bundle.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');

const samples = {};
for (const layer of fs.readdirSync(path.join(root, 'samples/piano'))) {
  const dir = path.join(root, 'samples/piano', layer);
  if (!fs.statSync(dir).isDirectory()) continue;
  samples[layer] = {};
  for (const f of fs.readdirSync(dir)) if (f.endsWith('.mp3')) samples[layer][f.slice(0, -4)] = fs.readFileSync(path.join(dir, f)).toString('base64');
}

let html = read('index.html')
  .replace('<link rel="stylesheet" href="css/styles.css">', () => `<style>\n${read('css/styles.css')}\n</style>`)
  .replace('<script type="module" src="js/app.js"></script>', () =>
    `<script>window.__PIANO_SAMPLES=${JSON.stringify(samples)};</script>\n<script>\n${js}\n</script>`)
  .replace('</body>', () => `<!-- Piano samples: Salamander Grand Piano V3 by Alexander Holm, CC BY 3.0 -->\n</body>`);

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
const out = path.join(root, 'dist/Keystone.html');
fs.writeFileSync(out, html);
console.log(`Wrote ${out} (${(fs.statSync(out).size / 1e6).toFixed(1)} MB)`);
