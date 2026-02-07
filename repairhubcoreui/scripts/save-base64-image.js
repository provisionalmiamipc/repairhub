#!/usr/bin/env node
/**
 * save-base64-image.js
 *
 * Usage:
 *  node scripts/save-base64-image.js input.json
 *  cat input.json | node scripts/save-base64-image.js
 *
 * Input JSON formats accepted:
 *  - Array of objects: [{ "imageName": "tv-32-1.jpg", "dataUrl": "data:image/jpeg;base64,..." }, ...]
 *  - Object map: { "tv-32-1.jpg": "data:image/png;base64,...", ... }
 *
 * The script writes files to: src/assets/images/items/ (created if missing).
 */

const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'src', 'assets', 'images', 'items');

function ensureOutDir() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    console.log('Created directory:', OUT_DIR);
  }
}

function parseInput(raw) {
  try {
    const obj = JSON.parse(raw);
    if (Array.isArray(obj)) return obj;
    // if object map, convert to array
    if (obj && typeof obj === 'object') {
      return Object.keys(obj).map(k => ({ imageName: k, dataUrl: obj[k] }));
    }
    throw new Error('Unsupported JSON shape');
  } catch (e) {
    throw e;
  }
}

function dataUrlToBuffer(dataUrl) {
  // data:[<mediatype>][;base64],<data>
  const match = String(dataUrl).match(/^data:(.+);base64,(.*)$/);
  if (!match) {
    // maybe it's raw base64
    return Buffer.from(dataUrl, 'base64');
  }
  const base64 = match[2];
  return Buffer.from(base64, 'base64');
}

function uniqueFilename(dir, name) {
  let candidate = name;
  const ext = path.extname(name);
  const base = name.slice(0, name.length - ext.length);
  let i = 1;
  while (fs.existsSync(path.join(dir, candidate))) {
    candidate = `${base}-${i}${ext}`;
    i++;
  }
  return candidate;
}

function writeFile(entry) {
  const { imageName, dataUrl } = entry;
  if (!imageName || !dataUrl) {
    console.warn('Skipping invalid entry (missing imageName or dataUrl):', entry);
    return null;
  }

  const safeName = imageName.replace(/[^a-zA-Z0-9._\-]/g, '-');
  const finalName = uniqueFilename(OUT_DIR, safeName);
  const outPath = path.join(OUT_DIR, finalName);
  const buffer = dataUrlToBuffer(dataUrl);
  fs.writeFileSync(outPath, buffer);
  return finalName;
}

async function main() {
  const inputFile = process.argv[2];
  let raw = '';
  if (inputFile) {
    raw = fs.readFileSync(inputFile, 'utf8');
  } else {
    // read stdin
    raw = fs.readFileSync(0, 'utf8');
  }

  if (!raw) {
    console.error('No input provided. Provide a JSON file path or pipe JSON to stdin.');
    process.exit(2);
  }

  ensureOutDir();

  let entries;
  try {
    entries = parseInput(raw);
  } catch (e) {
    console.error('Failed to parse JSON input:', e.message);
    process.exit(3);
  }

  const results = [];
  for (const e of entries) {
    try {
      const saved = writeFile(e);
      if (saved) {
        results.push({ requested: e.imageName, saved });
        console.log(`Wrote ${saved}`);
      }
    } catch (err) {
      console.error('Error writing entry', e.imageName, err.message);
    }
  }

  console.log('Done. Files written to:', OUT_DIR);
  console.log(JSON.stringify(results, null, 2));
}

if (require.main === module) {
  main();
}
