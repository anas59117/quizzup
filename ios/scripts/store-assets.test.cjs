const test = require('node:test');
const assert = require('node:assert/strict');
const { profiles, scenarios, pngInfo, validatePng, jpegInfo } = require('./store-assets.cjs');
function png(width, height, colorType = 2, transparent = false) {
  const signature = Buffer.from('89504e470d0a1a0a', 'hex');
  const chunk = (type, data) => {
    const b = Buffer.alloc(data.length + 12);
    b.writeUInt32BE(data.length); b.write(type, 4); data.copy(b, 8); return b;
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = colorType;
  return Buffer.concat([signature, chunk('IHDR', ihdr), ...(transparent ? [chunk('tRNS', Buffer.alloc(6))] : []), chunk('IEND', Buffer.alloc(0))]);
}
test('capture matrix has eighteen distinct native captures', () => {
  assert.equal(profiles.length, 3);
  const keys = profiles.flatMap(p => ['fr', 'en'].flatMap(lang => scenarios.map(s => `${p.key}/${lang}/${s}`)));
  assert.equal(new Set(keys).size, 18);
  assert.deepEqual(profiles.map(p => [p.width, p.height]), [[1290, 2796], [1284, 2778], [1179, 2556]]);
});
test('accepts an opaque RGB icon without requiring rounded corners', () => {
  assert.equal(validatePng(png(1024, 1024), 1024, 1024, true).hasAlpha, false);
});
test('rejects RGBA and transparency chunks for submission PNG files', () => {
  assert.throws(() => validatePng(png(1024, 1024, 6), 1024, 1024, true), /alpha/i);
  assert.throws(() => validatePng(png(1024, 1024, 2, true), 1024, 1024, true), /alpha/i);
});
test('rejects dimensions from the wrong device and corrupted PNGs', () => {
  assert.throws(() => validatePng(png(1284, 2778), 1290, 2796), /dimensions/i);
  assert.throws(() => pngInfo(Buffer.alloc(50)), /PNG/i);
  assert.throws(() => pngInfo(png(1024, 1024).subarray(0, 25)), /PNG|trunc/i);
});
test('raw simulator PNG may contain alpha before conversion to JPEG', () => {
  assert.equal(validatePng(png(1290, 2796, 6), 1290, 2796).hasAlpha, true);
});
test('reads JPEG frame dimensions and rejects non-JPEG output', () => {
  const bytes = Buffer.from([0xff,0xd8,0xff,0xc0,0,17,8,10,236,5,10,3,1,0x11,0,2,0x11,0,3,0x11,0,0xff,0xd9]);
  assert.deepEqual(jpegInfo(bytes), {width:1290,height:2796,components:3});
  assert.throws(() => jpegInfo(Buffer.alloc(50)), /JPEG/i);
});
