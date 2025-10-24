#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const manifestPath = path.join(process.cwd(), 'manifest.json');
const distManifestPath = path.join(process.cwd(), 'dist', 'manifest.json');

console.log('📋 Copying and transforming manifest for production...');

// Read the source manifest
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

// Transform paths: remove 'dist/' prefix
if (manifest.background?.service_worker) {
  manifest.background.service_worker = manifest.background.service_worker.replace(/^dist\//, '');
}

if (manifest.action?.default_popup) {
  manifest.action.default_popup = manifest.action.default_popup.replace(/^dist\//, '');
}

// Write transformed manifest to dist
fs.writeFileSync(distManifestPath, JSON.stringify(manifest, null, 2));

console.log('✅ Production manifest created at dist/manifest.json');
console.log(`   - service_worker: ${manifest.background?.service_worker}`);
console.log(`   - default_popup: ${manifest.action?.default_popup}`);

