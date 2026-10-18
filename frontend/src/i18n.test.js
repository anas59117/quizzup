import fs from 'fs';
import path from 'path';
import { STRINGS } from './i18n';

test('every literal UI translation has a French fallback', () => {
  const missing = new Set();
  for (const file of fs.readdirSync(__dirname).filter(file => file.endsWith('.js') && !file.endsWith('.test.js'))) {
    const source = fs.readFileSync(path.join(__dirname, file), 'utf8');
    for (const match of source.matchAll(/\bt\(\s*['"]([^'"]+)['"]/g)) {
      if (!Object.prototype.hasOwnProperty.call(STRINGS.fr, match[1])) missing.add(`${file}: ${match[1]}`);
    }
  }
  expect([...missing]).toEqual([]);
});
