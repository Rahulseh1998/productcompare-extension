/**
 * generate-icons.mjs
 *
 * Generates placeholder extension icons at all required sizes using pure Node.js.
 * Replace output PNGs with real artwork before CWS submission.
 *
 * Usage: node scripts/generate-icons.mjs
 */

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = path.resolve(__dirname, '../src/icons');
fs.mkdirSync(ICONS_DIR, { recursive: true });

// CRC-32 table for PNG chunk checksums
const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (const byte of buf) c = crcTable[(c ^ byte) & 0xFF] ^ (c >>> 8);
  return c ^ 0xFFFFFFFF;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBytes = Buffer.from(type, 'ascii');
  const crc = crc32(Buffer.concat([typeBytes, data]));
  const crcBytes = Buffer.alloc(4);
  crcBytes.writeUInt32BE(crc >>> 0);
  return Buffer.concat([len, typeBytes, data, crcBytes]);
}

function makePNG(size, r, g, b) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0); // width
  ihdrData.writeUInt32BE(size, 4); // height
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 2;  // color type: RGB truecolor
  // compression, filter, interlace = 0

  // Raw image data: each row = [filter_byte=0, R, G, B, R, G, B, ...]
  const rowSize = 1 + size * 3;
  const raw = Buffer.alloc(size * rowSize);
  for (let y = 0; y < size; y++) {
    const off = y * rowSize;
    raw[off] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      raw[off + 1 + x * 3] = r;
      raw[off + 1 + x * 3 + 1] = g;
      raw[off + 1 + x * 3 + 2] = b;
    }
  }

  const compressed = zlib.deflateSync(raw);
  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdrData),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

// Brand orange #e47911
const [R, G, B] = [228, 121, 17];

for (const size of [16, 32, 48, 128]) {
  const png = makePNG(size, R, G, B);
  const outPath = path.join(ICONS_DIR, `icon${size}.png`);
  fs.writeFileSync(outPath, png);
  console.log(`  ✓  icon${size}.png  (${png.length} bytes)`);
}

console.log('\nPlaceholder icons generated. Replace with real artwork before CWS submission.\n');
