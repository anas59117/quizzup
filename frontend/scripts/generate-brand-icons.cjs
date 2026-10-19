// Manual release asset generation. Supply sharp through NODE_PATH or SHARP_PATH;
// this script adds no runtime or CI dependency to the application.
const fs = require('node:fs');
const path = require('node:path');
const sharp = require(process.env.SHARP_PATH || 'sharp');
const root = path.resolve(__dirname, '../public');
const icon = fs.readFileSync(path.join(root, 'brand-app-icon.svg'));

(async () => {
  for (const [name, size] of [['logo192.png',192],['logo512.png',512],['apple-touch-icon.png',180]]) {
    await sharp(icon).resize(size,size).png().toFile(path.join(root,name));
  }
  const sizes=[16,32,48];
  const images=await Promise.all(sizes.map(size=>sharp(icon).resize(size,size).png().toBuffer()));
  const header=Buffer.alloc(6+16*sizes.length);header.writeUInt16LE(1,2);header.writeUInt16LE(sizes.length,4);
  let offset=header.length;
  sizes.forEach((size,index)=>{const start=6+index*16;header[start]=size;header[start+1]=size;header.writeUInt16LE(1,start+4);header.writeUInt16LE(32,start+6);header.writeUInt32LE(images[index].length,start+8);header.writeUInt32LE(offset,start+12);offset+=images[index].length;});
  fs.writeFileSync(path.join(root,'favicon.ico'),Buffer.concat([header,...images]));
  const mark=fs.readFileSync(path.join(root,'brand-symbol.svg'),'utf8').replace('<svg ', '<svg x="162" y="206" width="176" height="176" ');
  const card=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#bd1235"/>${mark}<text x="358" y="330" fill="#fff" font-family="Inter,Arial,sans-serif" font-size="112" font-weight="800" letter-spacing="-5">QuizzUp</text><text x="600" y="445" text-anchor="middle" fill="#fff" font-family="Inter,Arial,sans-serif" font-size="30">Duels de quiz en temps réel</text></svg>`;
  await sharp(Buffer.from(card)).png().toFile(path.join(root,'og-image.png'));
  console.log('Brand icons, favicon and social preview generated');
})().catch(error=>{console.error(error);process.exitCode=1;});
