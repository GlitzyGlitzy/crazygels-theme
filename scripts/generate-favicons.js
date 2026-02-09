const sharp = require('sharp');
const { readFileSync } = require('fs');

const svgContent = readFileSync('public/icon.svg', 'utf-8');

// Light mode favicon (rose gold icon on cream background) - already the SVG default
const lightSvg = svgContent;

// Dark mode favicon (rose gold icon on dark background)
const darkSvg = svgContent.replace('fill="#FAF7F2"', 'fill="#2C2C2C"');

// Generate 32x32 PNGs
async function generate() {
  // Light mode 32x32
  await sharp(Buffer.from(lightSvg))
    .resize(32, 32)
    .png()
    .toFile('public/icon-light-32x32.png');
  console.log('Generated icon-light-32x32.png');

  // Dark mode 32x32
  await sharp(Buffer.from(darkSvg))
    .resize(32, 32)
    .png()
    .toFile('public/icon-dark-32x32.png');
  console.log('Generated icon-dark-32x32.png');

  // Apple touch icon 180x180
  await sharp(Buffer.from(lightSvg))
    .resize(180, 180)
    .png()
    .toFile('public/apple-icon.png');
  console.log('Generated apple-icon.png');

  // Standard favicon 16x16
  await sharp(Buffer.from(lightSvg))
    .resize(16, 16)
    .png()
    .toFile('public/favicon-16x16.png');
  console.log('Generated favicon-16x16.png');

  // Favicon ICO (32x32 png as ico)
  await sharp(Buffer.from(lightSvg))
    .resize(32, 32)
    .png()
    .toFile('public/favicon.ico');
  console.log('Generated favicon.ico');

  // OG image placeholder - 512x512 for high res
  await sharp(Buffer.from(lightSvg))
    .resize(512, 512)
    .png()
    .toFile('public/icon-512x512.png');
  console.log('Generated icon-512x512.png');

  console.log('All favicons generated successfully!');
}

generate().catch(console.error);
