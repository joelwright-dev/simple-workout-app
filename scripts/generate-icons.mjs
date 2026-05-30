// Generate PWA icons as PNGs with zero dependencies (Node's zlib only).
// Draws the "Groundwork" mark: a clay mountain on an earthy ground field.
//
//   node scripts/generate-icons.mjs

import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "../public/icons");

const GROUND = [71, 62, 53]; // #473e35
const GROUND_DK = [34, 29, 24]; // #221d18
const CLAY = [201, 112, 63]; // #c9703f
const SAND = [212, 205, 188]; // #d4cdbc

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  // 10,11,12 = compression, filter, interlace = 0

  // Raw scanlines with filter byte 0 prefix.
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = deflateSync(raw, { level: 9 });

  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function draw(size) {
  const rgba = Buffer.alloc(size * size * 4);
  const set = (x, y, [r, g, b], a = 255) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    rgba[i] = r;
    rgba[i + 1] = g;
    rgba[i + 2] = b;
    rgba[i + 3] = a;
  };

  // Vertical gradient ground background.
  for (let y = 0; y < size; y++) {
    const t = y / size;
    const c = [
      Math.round(GROUND[0] + (GROUND_DK[0] - GROUND[0]) * t),
      Math.round(GROUND[1] + (GROUND_DK[1] - GROUND[1]) * t),
      Math.round(GROUND[2] + (GROUND_DK[2] - GROUND[2]) * t),
    ];
    for (let x = 0; x < size; x++) set(x, y, c);
  }

  // A mountain (triangle) sitting on a ground line.
  const groundY = Math.round(size * 0.72);
  const peakX = Math.round(size * 0.5);
  const peakY = Math.round(size * 0.28);
  const baseL = Math.round(size * 0.2);
  const baseR = Math.round(size * 0.8);

  for (let y = peakY; y <= groundY; y++) {
    const tt = (y - peakY) / (groundY - peakY);
    const halfWidth = (baseR - baseL) / 2;
    const xl = Math.round(peakX - halfWidth * tt);
    const xr = Math.round(peakX + halfWidth * tt);
    for (let x = xl; x <= xr; x++) {
      // Snow cap near the peak.
      const isCap = tt < 0.22;
      set(x, y, isCap ? SAND : CLAY);
    }
  }

  // Ground line band.
  for (let y = groundY; y < groundY + Math.max(2, size * 0.04); y++) {
    for (let x = 0; x < size; x++) set(x, y, SAND);
  }

  return encodePNG(size, size, rgba);
}

mkdirSync(OUT_DIR, { recursive: true });
for (const size of [192, 512]) {
  const png = draw(size);
  writeFileSync(resolve(OUT_DIR, `icon-${size}.png`), png);
  // Maskable variant is the same art (it has safe padding already).
  writeFileSync(resolve(OUT_DIR, `maskable-${size}.png`), png);
  console.log(`Wrote icon-${size}.png (${png.length} bytes)`);
}

// Apple touch icon (180).
writeFileSync(resolve(OUT_DIR, "apple-touch-icon.png"), draw(180));
console.log("Wrote apple-touch-icon.png");
