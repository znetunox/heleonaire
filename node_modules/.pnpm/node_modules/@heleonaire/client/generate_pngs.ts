import fs from 'fs';
import path from 'path';

// Minimal PNG generator in pure Node (PNG signature + IHDR + IDAT + IEND)
// with Deflate compression using zlib
import zlib from 'zlib';

function createPngBuffer(width: number, height: number, drawFn: (x: number, y: number) => [number, number, number, number]): Buffer {
  // Raw RGBA buffer with filter byte 0 at start of each scanline
  const scanlineLength = width * 4 + 1;
  const rawData = Buffer.alloc(height * scanlineLength);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawFn(x, y);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Header
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA color type
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // IDAT chunk
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function crc32(buf: Buffer): number {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    let byte = buf[i];
    for (let j = 0; j < 8; j++) {
      const bit = (byte ^ crc) & 1;
      crc = (crc >>> 1) ^ (bit ? 0xedb88320 : 0);
      byte >>>= 1;
    }
  }
  return (crc ^ -1) >>> 0;
}

function makeChunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = data.length;
  const chunk = Buffer.alloc(8 + len + 4);
  chunk.writeUInt32BE(len, 0);
  typeBuf.copy(chunk, 4);
  data.copy(chunk, 8);
  const crcVal = crc32(Buffer.concat([typeBuf, data]));
  chunk.writeUInt32BE(crcVal, 8 + len);
  return chunk;
}

// 1. Generate clean 128x128 Tileset (4x4 tiles of 32x32)
// Tile 0: Grass, Tile 1: Stone Cobblestone, Tile 2: Dirt, Tile 3: Water/Floor
const tilesetPng = createPngBuffer(128, 128, (x, y) => {
  const tileX = Math.floor(x / 32);
  const tileY = Math.floor(y / 32);
  const lx = x % 32;
  const ly = y % 32;

  // Tile (0,0): Plains of Ash Grass
  if (tileX === 0 && tileY === 0) {
    const isBorder = lx === 0 || ly === 0 || lx === 31 || ly === 31;
    if (isBorder) return [45, 75, 45, 255];
    const noise = ((lx * 7 + ly * 13) % 19);
    return [55 + noise, 95 + noise * 2, 55 + noise, 255];
  }
  // Tile (1,0): Medieval Cobblestone
  if (tileX === 1 && tileY === 0) {
    const isBorder = (lx % 16 === 0) || (ly % 16 === 0);
    if (isBorder) return [40, 45, 55, 255];
    const noise = ((lx * 11 + ly * 5) % 15);
    return [110 + noise, 115 + noise, 125 + noise, 255];
  }
  // Tile (2,0): Ash Dirt
  if (tileX === 2 && tileY === 0) {
    const noise = ((lx * 3 + ly * 17) % 20);
    return [90 + noise, 80 + noise, 70 + noise, 255];
  }
  // Tile (3,0): Water / Stone Edge
  if (tileX === 3 && tileY === 0) {
    const noise = ((lx * 9 + ly * 9) % 25);
    return [30 + noise, 80 + noise, 140 + noise, 255];
  }

  // Default Ground
  return [60, 90, 60, 255];
});

// 2. Generate clean 128x32 Knight Spritesheet (4 frames of 32x32)
const knightPng = createPngBuffer(128, 32, (x, y) => {
  const frame = Math.floor(x / 32);
  const lx = x % 32;
  const ly = y;

  const dx = lx - 16;
  const dy = ly - 16;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Outer Armor Outline
  if (dist > 12) return [0, 0, 0, 0];
  if (dist > 10) return [20, 25, 35, 255];

  // Head/Helmet
  if (ly >= 6 && ly <= 14 && lx >= 10 && lx <= 22) {
    if (ly === 10 && lx >= 12 && lx <= 20) return [240, 200, 50, 255]; // Golden Visor
    return [70, 90, 120, 255]; // Helmet steel
  }

  // Crest / Plume
  if (ly >= 2 && ly <= 6 && lx >= 14 && lx <= 18) {
    return [220, 50, 50, 255]; // Red Plume
  }

  // Shield on left
  if (lx >= 6 && lx <= 11 && ly >= 12 && ly <= 22) {
    return [40, 100, 200, 255]; // Blue Shield
  }

  // Sword on right (varies by frame)
  const swordOffset = frame % 2 === 0 ? 0 : 2;
  if (lx >= 22 + swordOffset && lx <= 26 + swordOffset && ly >= 8 && ly <= 24) {
    return [220, 230, 240, 255]; // Silver Sword
  }

  // Armor Body
  return [50, 70, 95, 255];
});

// 3. Generate clean 128x32 Monster/Skeleton Spritesheet (4 frames of 32x32)
const skeletonPng = createPngBuffer(128, 32, (x, y) => {
  const frame = Math.floor(x / 32);
  const lx = x % 32;
  const ly = y;

  const dx = lx - 16;
  const dy = ly - 14;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Skull
  if (dist <= 10) {
    // Eye sockets
    if (ly >= 12 && ly <= 14 && (lx === 12 || lx === 20)) {
      return [255, 200, 0, 255]; // Yellow glowing eye
    }
    if (ly >= 11 && ly <= 15 && ((lx >= 11 && lx <= 13) || (lx >= 19 && lx <= 21))) {
      return [20, 20, 20, 255]; // Socket
    }
    return [230, 230, 235, 255]; // Bone
  }

  // Body / Ribcage
  if (ly >= 20 && ly <= 28 && lx >= 11 && lx <= 21) {
    if (ly % 3 === 0) return [230, 230, 235, 255]; // Ribs
    return [40, 45, 55, 255]; // Dark Void
  }

  return [0, 0, 0, 0];
});

// Write all generated PNGs
const baseDir = path.resolve(process.cwd(), 'packages/client/public/assets');
fs.writeFileSync(path.join(baseDir, 'tilesets/world_tiles.png'), tilesetPng);
fs.writeFileSync(path.join(baseDir, 'sprites/knight.png'), knightPng);
fs.writeFileSync(path.join(baseDir, 'sprites/skeleton.png'), skeletonPng);

console.log('Successfully created real PNG assets for tilesets and sprites!');
