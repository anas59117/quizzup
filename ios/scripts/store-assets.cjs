const assert = require('node:assert/strict');
const profiles = [
  {key:'iphone-large-dynamic-island', type:'iPhone-15-Plus', width:1290, height:2796},
  {key:'iphone-large-face-id', type:'iPhone-14-Plus', width:1284, height:2778},
  {key:'iphone-medium-dynamic-island', type:'iPhone-15', width:1179, height:2556},
];
const scenarios = ['home', 'question', 'result'];
function pngInfo(buffer) {
  assert.ok(buffer.length >= 45 && buffer.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')), 'Invalid or truncated PNG');
  assert.equal(buffer.toString('ascii',12,16), 'IHDR', 'Missing PNG IHDR');
  const width=buffer.readUInt32BE(16), height=buffer.readUInt32BE(20), colorType=buffer[25];
  let hasAlpha=[4,6].includes(colorType), ended=false;
  for(let i=8;i<buffer.length;){
    assert.ok(i+12<=buffer.length,'Truncated PNG chunk');
    const size=buffer.readUInt32BE(i), type=buffer.toString('ascii',i+4,i+8);
    assert.ok(i+12+size<=buffer.length,'Truncated PNG chunk data');
    if(type==='tRNS')hasAlpha=true;
    if(type==='IEND'){ended=true;break;}
    i+=size+12;
  }
  assert.ok(ended,'Incomplete PNG');
  return {width,height,colorType,hasAlpha};
}
function validatePng(buffer,width,height,opaque=false) {
  const info=pngInfo(buffer);
  assert.ok(info.width===width&&info.height===height, `Wrong dimensions: ${info.width}x${info.height}, expected ${width}x${height}`);
  if(opaque)assert.equal(info.hasAlpha,false,'Submission image must not contain alpha');
  return info;
}
function jpegInfo(buffer) {
  assert.ok(buffer.length>4&&buffer[0]===255&&buffer[1]===216,'Invalid JPEG');
  let i=2;
  while(i+4<=buffer.length){
    assert.equal(buffer[i++],255,'Invalid JPEG marker');
    while(buffer[i]===255)i++;
    const marker=buffer[i++];
    if(marker===217||marker===218)break;
    if(marker===1||(marker>=208&&marker<=215))continue;
    const size=buffer.readUInt16BE(i);
    assert.ok(size>=2&&i+size<=buffer.length,'Truncated JPEG segment');
    if([192,193,194].includes(marker)){
      assert.ok(size>=8,'Invalid JPEG frame');
      return {width:buffer.readUInt16BE(i+5),height:buffer.readUInt16BE(i+3),components:buffer[i+7]};
    }
    i+=size;
  }
  throw Error('JPEG frame missing');
}
module.exports={profiles,scenarios,pngInfo,validatePng,jpegInfo};
