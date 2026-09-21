const crypto = require('node:crypto');

function randomId(prefix = '') {
  return `${prefix}${crypto.randomUUID().replaceAll('-', '')}`;
}

function randomRoomCode(alphabet, length = 5, randomInt = crypto.randomInt) {
  if (typeof alphabet !== 'string' || alphabet.length < 2) {
    throw new Error('INVALID_ALPHABET');
  }
  if (!Number.isInteger(length) || length < 1 || length > 32) {
    throw new Error('INVALID_CODE_LENGTH');
  }

  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += alphabet[randomInt(0, alphabet.length)];
  }
  return code;
}

module.exports = { randomId, randomRoomCode };
