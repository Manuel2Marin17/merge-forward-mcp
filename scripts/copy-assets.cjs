#!/usr/bin/env node

/**
 * Copy non-TypeScript assets to dist folder
 */

const fs = require('fs');
const path = require('path');

const assets = [
  { src: 'src/data/instructions-core.md', dest: 'dist/data/instructions-core.md' },
  { src: 'src/data/instructions-detailed.md', dest: 'dist/data/instructions-detailed.md' },
  { src: 'src/data/instructions-patterns.md', dest: 'dist/data/instructions-patterns.md' }
];

console.log('[2/2] Copying assets...');

for (const asset of assets) {
  const destDir = path.dirname(asset.dest);

  // Create directory if needed
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // Copy file
  fs.copyFileSync(asset.src, asset.dest);
  console.log(`      ${asset.src} -> ${asset.dest}`);
}

console.log('      Assets copied successfully\n');
