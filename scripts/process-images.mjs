import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const inputRoot = 'photos';
const outputRoot = 'public/images';
const widths = [480, 768, 1200, 1600];
const formats = ['webp', 'avif', 'jpeg'];

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (/\.(jpe?g|png|webp|tiff?)$/i.test(entry.name)) files.push(full);
  }
  return files;
}

const files = await walk(inputRoot);
if (!files.length) {
  console.log('No source photos found. Add originals under photos/<suite>/ and run npm run images.');
  process.exit(0);
}

for (const file of files) {
  const rel = path.relative(inputRoot, file);
  const dir = path.join(outputRoot, path.dirname(rel));
  const base = path.basename(rel, path.extname(rel)).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  await fs.mkdir(dir, { recursive: true });
  const metadata = await sharp(file).metadata();
  for (const width of widths.filter(w => !metadata.width || w <= metadata.width)) {
    for (const format of formats) {
      const out = path.join(dir, `${base}-${width}.${format === 'jpeg' ? 'jpg' : format}`);
      let image = sharp(file).rotate().resize({ width, withoutEnlargement: true });
      if (format === 'webp') image = image.webp({ quality: 82 });
      if (format === 'avif') image = image.avif({ quality: 55 });
      if (format === 'jpeg') image = image.jpeg({ quality: 84, progressive: true });
      await image.toFile(out);
    }
  }
  console.log(`Processed ${rel}`);
}
