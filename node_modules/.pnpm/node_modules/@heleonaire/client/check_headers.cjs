const fs = require('fs');
const path = require('path');

const files = [
  'public/assets/sprites/knight.png',
  'public/assets/sprites/skeleton.png',
  'public/assets/tilesets/world_tiles.png',
];

for (const f of files) {
  const full = path.resolve(__dirname, f);
  if (!fs.existsSync(full)) {
    console.log(f + ': FILE NOT FOUND');
    continue;
  }
  const buf = fs.readFileSync(full);
  const header = Array.from(buf.subarray(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(' ');
  const isPNG = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  const isJPEG = buf[0] === 0xff && buf[1] === 0xd8;
  console.log(f + ': header=[' + header + '] isPNG=' + isPNG + ' isJPEG=' + isJPEG + ' size=' + buf.length);
}
