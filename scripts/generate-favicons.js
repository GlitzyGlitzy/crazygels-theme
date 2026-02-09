const sharp = require('sharp');
const path = require('path');

const OUT = path.join(process.cwd(), 'public');

const lightSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="rg" x1="0.5" y1="0" x2="0.5" y2="1">
      <stop offset="0%" stop-color="#C4868F"/>
      <stop offset="100%" stop-color="#A15D67"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="#FAF7F2"/>
  <ellipse cx="256" cy="276" rx="155" ry="185" fill="none" stroke="url(#rg)" stroke-width="16"/>
  <ellipse cx="256" cy="244" rx="110" ry="145" fill="none" stroke="url(#rg)" stroke-width="14"/>
  <path d="M256 92 C208 170, 210 210, 256 244 C302 210, 304 170, 256 92Z" fill="none" stroke="url(#rg)" stroke-width="14" stroke-linejoin="round"/>
  <circle cx="256" cy="330" r="72" fill="none" stroke="url(#rg)" stroke-width="14"/>
  <line x1="256" y1="244" x2="256" y2="402" stroke="url(#rg)" stroke-width="12"/>
  <line x1="184" y1="330" x2="328" y2="330" stroke="url(#rg)" stroke-width="12"/>
</svg>`;

const darkSvg = lightSvg.replace('fill="#FAF7F2"', 'fill="#2C2C2C"');

async function generate() {
  await sharp(Buffer.from(lightSvg)).resize(32, 32).png().toFile(path.join(OUT, 'icon-light-32x32.png'));
  console.log('Generated icon-light-32x32.png');

  await sharp(Buffer.from(darkSvg)).resize(32, 32).png().toFile(path.join(OUT, 'icon-dark-32x32.png'));
  console.log('Generated icon-dark-32x32.png');

  await sharp(Buffer.from(lightSvg)).resize(180, 180).png().toFile(path.join(OUT, 'apple-icon.png'));
  console.log('Generated apple-icon.png');

  await sharp(Buffer.from(lightSvg)).resize(16, 16).png().toFile(path.join(OUT, 'favicon-16x16.png'));
  console.log('Generated favicon-16x16.png');

  await sharp(Buffer.from(lightSvg)).resize(32, 32).png().toFile(path.join(OUT, 'favicon.ico'));
  console.log('Generated favicon.ico');

  await sharp(Buffer.from(lightSvg)).resize(512, 512).png().toFile(path.join(OUT, 'icon-512x512.png'));
  console.log('Generated icon-512x512.png');

  console.log('All favicons generated!');
}

generate().catch(console.error);
