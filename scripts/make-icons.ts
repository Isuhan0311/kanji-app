import sharp from 'sharp';

const svg = (size: number) => Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#0f6e56"/>
  <text x="50%" y="54%" font-size="${size * 0.6}" fill="#ffffff"
    text-anchor="middle" dominant-baseline="middle"
    font-family="serif">漢</text>
</svg>`);

for (const [name, size] of [
  ['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180],
] as const) {
  await sharp(svg(size)).png().toFile(`public/${name}`);
  console.log(name);
}
