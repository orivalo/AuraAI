/**
 * Script to generate PWA icons
 * 
 * Option 1: Using sharp (recommended)
 *   npm install --save-dev sharp
 *   node scripts/generate-icons.js
 * 
 * Option 2: Using canvas
 *   npm install --save-dev canvas
 *   node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');

const sizes = [192, 512];
const outputDir = path.join(__dirname, '../public');

// Try to use sharp first
async function generateWithSharp() {
  try {
    const sharp = require('sharp');
    const inputSvg = path.join(__dirname, '../public/icon.svg');
    
    for (const size of sizes) {
      const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
      await sharp(inputSvg)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      console.log(`✓ Generated ${outputPath}`);
    }
    return true;
  } catch (error) {
    return false;
  }
}

// Fallback: Generate simple colored squares as placeholders
async function generatePlaceholders() {
  const { createCanvas } = require('canvas');
  
  for (const size of sizes) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Background
    const radius = size * 0.25;
    ctx.fillStyle = '#7C9070';
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, radius);
    ctx.fill();
    
    // Simple icon
    ctx.fillStyle = '#F1F4F0';
    ctx.globalAlpha = 0.9;
    const centerX = size / 2;
    const centerY = size / 2;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY - size * 0.1, size * 0.3, size * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = '#A4B494';
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(centerX - size * 0.1, centerY - size * 0.05, size * 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX + size * 0.1, centerY - size * 0.05, size * 0.05, 0, Math.PI * 2);
    ctx.fill();
    
    // Save
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    console.log(`✓ Generated ${outputPath}`);
  }
}

async function main() {
  console.log('Generating PWA icons...\n');
  
  // Try sharp first
  const sharpSuccess = await generateWithSharp();
  
  if (!sharpSuccess) {
    console.log('Sharp not available, trying canvas...\n');
    try {
      await generatePlaceholders();
    } catch (error) {
      console.error('\n❌ Error: Neither sharp nor canvas is available.');
      console.log('\nPlease install one of the following:');
      console.log('  npm install --save-dev sharp');
      console.log('  OR');
      console.log('  npm install --save-dev canvas');
      console.log('\nAlternatively, use an online tool:');
      console.log('  https://realfavicongenerator.net/');
      console.log('  https://www.pwabuilder.com/imageGenerator');
      process.exit(1);
    }
  }
  
  console.log('\n✓ All icons generated successfully!');
}

main().catch(console.error);

