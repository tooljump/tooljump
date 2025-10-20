#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Configuration
const ICONS_DIR = path.join(__dirname, '../extension/icons');
const ICON_SIZES = [16, 32, 48, 128];
const CIRCLE_COLORS = {
  green: { r: 0, g: 255, b: 0, alpha: 1 },
  red: { r: 255, g: 0, b: 0, alpha: 1 }
};

// Calculate circle properties based on icon size
function getCircleProperties(iconSize) {
  const circleRadius = Math.max(4, Math.floor(iconSize * 0.15)); // 15% of icon size, minimum 4px
  const padding = Math.max(2, Math.floor(iconSize * 0.05)); // 5% padding, minimum 2px
  
  return {
    radius: circleRadius,
    padding: padding,
    x: iconSize - circleRadius - padding,
    y: circleRadius + padding
  };
}

async function createCircleSVG(radius, color) {
  const diameter = radius * 2;
  const svg = `
    <svg width="${diameter}" height="${diameter}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${radius}" cy="${radius}" r="${radius - 1}" 
              fill="rgb(${color.r}, ${color.g}, ${color.b})" 
              stroke="white" 
              stroke-width="1"/>
    </svg>
  `;
  return Buffer.from(svg);
}

async function addStatusCircle(inputPath, outputPath, color) {
  try {
    console.log(`Processing ${path.basename(inputPath)} with color rgb(${color.r}, ${color.g}, ${color.b})`);
    
    // Load the original icon
    const originalImage = sharp(inputPath);
    const metadata = await originalImage.metadata();
    const iconSize = metadata.width;
    
    // Get circle properties for this icon size
    const circleProps = getCircleProperties(iconSize);
    
    // Create the circle SVG
    const circleSVG = await createCircleSVG(circleProps.radius, color);
    
    // Create the circle as a PNG buffer
    const circleBuffer = await sharp(circleSVG)
      .png()
      .toBuffer();
    
    // Calculate position for the circle (top right corner)
    const left = circleProps.x - circleProps.radius;
    const top = circleProps.y - circleProps.radius;
    
    // Composite the circle onto the original image
    const result = await originalImage
      .composite([{
        input: circleBuffer,
        left: left,
        top: top
      }])
      .png()
      .toBuffer();
    
    // Save the result
    fs.writeFileSync(outputPath, result);
    console.log(`✓ Created ${path.basename(outputPath)}`);
    
  } catch (error) {
    console.error(`✗ Error processing ${path.basename(inputPath)}:`, error.message);
  }
}

async function processIcons() {
  console.log('🎨 Adding status circles to icons using Sharp...\n');
  
  // Ensure output directory exists
  if (!fs.existsSync(ICONS_DIR)) {
    console.error(`Icons directory not found: ${ICONS_DIR}`);
    process.exit(1);
  }
  
  // Process each icon size
  for (const size of ICON_SIZES) {
    const inputFile = path.join(ICONS_DIR, `icon${size}.png`);
    
    if (!fs.existsSync(inputFile)) {
      console.warn(`⚠️  Icon not found: icon${size}.png`);
      continue;
    }
    
    // Create green and red versions
    for (const [colorName, colorValue] of Object.entries(CIRCLE_COLORS)) {
      const outputFile = path.join(ICONS_DIR, `icon-${colorName}-${size}.png`);
      await addStatusCircle(inputFile, outputFile, colorValue);
    }
  }
  
  console.log('\n✨ All icons processed successfully!');
  console.log('\nGenerated files:');
  
  // List generated files
  for (const size of ICON_SIZES) {
    for (const colorName of Object.keys(CIRCLE_COLORS)) {
      const fileName = `icon-${colorName}-${size}.png`;
      const filePath = path.join(ICONS_DIR, fileName);
      if (fs.existsSync(filePath)) {
        console.log(`  - ${fileName}`);
      }
    }
  }
}

// Run the script
if (require.main === module) {
  processIcons().catch(console.error);
}

module.exports = { addStatusCircle, processIcons };
