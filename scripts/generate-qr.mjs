import fs from 'node:fs/promises';
import QRCode from 'qrcode';

const destinations = {
  home: 'https://hinsdalehousenc.com/',
  magnolia: 'https://hinsdalehousenc.com/magnolia/',
  dogwood: 'https://hinsdalehousenc.com/dogwood/',
  loblolly: 'https://hinsdalehousenc.com/loblolly/',
  hatteras: 'https://hinsdalehousenc.com/hatteras/',
  guide: 'https://hinsdalehousenc.com/guest-guide/'
};

await fs.mkdir('public/qr', { recursive: true });
for (const [name, url] of Object.entries(destinations)) {
  await QRCode.toFile(`public/qr/${name}.svg`, url, { type: 'svg', margin: 2, errorCorrectionLevel: 'M' });
  console.log(`${name}: ${url}`);
}
