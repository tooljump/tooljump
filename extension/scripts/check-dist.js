#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const distPath = path.join(process.cwd(), 'dist');
const requiredFiles = [
  'manifest.json',
  'background.js',
  'content.js',
  'popup-settings.html',
  'popup.js'
];

const requiredIcons = [
  'icons/icon16.png',
  'icons/icon32.png',
  'icons/icon48.png',
  'icons/icon128.png',
  'icons/icon-green-16.png',
  'icons/icon-green-32.png',
  'icons/icon-green-48.png',
  'icons/icon-green-128.png',
  'icons/icon-red-16.png',
  'icons/icon-red-32.png',
  'icons/icon-red-48.png',
  'icons/icon-red-128.png',
];

console.log('🔍 Checking extension distribution files...\n');

let allFilesPresent = true;

// Check main files
for (const file of requiredFiles) {
  const filePath = path.join(distPath, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`✅ ${file} (${(stats.size / 1024).toFixed(1)} KB)`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesPresent = false;
  }
}

console.log('\n🎨 Checking icon files...\n');

// Check icon files
for (const icon of requiredIcons) {
  const iconPath = path.join(distPath, icon);
  if (fs.existsSync(iconPath)) {
    const stats = fs.statSync(iconPath);
    console.log(`✅ ${icon} (${(stats.size / 1024).toFixed(1)} KB)`);
  } else {
    console.log(`❌ ${icon} - MISSING`);
    allFilesPresent = false;
  }
}

console.log('\n' + '='.repeat(50));

if (allFilesPresent) {
  console.log('🎉 All files present! Extension is ready for packaging.');
  process.exit(0);
} else {
  console.log('⚠️  Some files are missing. Please run "yarn build" first.');
  process.exit(1);
}
