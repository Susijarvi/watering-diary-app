import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const svgPath = resolve(root, 'public/icon.svg');
const svg = await readFile(svgPath);

const sizes = [192, 512];
for (const size of sizes) {
  const out = resolve(root, `public/icon-${size}.png`);
  await sharp(svg).resize(size, size).png().toFile(out);
  console.log(`✓ Wrote icon-${size}.png`);
}

// Apple touch icon (180x180 typical)
await sharp(svg)
  .resize(180, 180)
  .png()
  .toFile(resolve(root, 'public/apple-touch-icon.png'));
console.log('✓ Wrote apple-touch-icon.png');

// Maskable icon: same source works since SVG fills the safe zone with bg.
const maskable = resolve(root, 'public/icon-maskable-512.png');
await sharp(svg).resize(512, 512).png().toFile(maskable);
console.log('✓ Wrote icon-maskable-512.png');

// Stub favicon.ico fallback (use 32x32)
await sharp(svg)
  .resize(32, 32)
  .png()
  .toFile(resolve(root, 'public/favicon-32.png'));
await writeFile(resolve(root, 'public/_iconinfo.txt'), 'Generated automatically — do not edit.\n');
console.log('Done.');
