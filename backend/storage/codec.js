const crypto = require('node:crypto');
const { definition } = require('./catalog');
const object = value => !!value && typeof value === 'object' && !Array.isArray(value);
function fail(code = 'INVALID_SNAPSHOT') { throw Object.assign(new Error(code), { code }); }
function canonical(value) {
  if (value === null || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number') { if (!Number.isFinite(value)) fail(); return JSON.stringify(value); }
  if (typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (!object(value)) fail();
  return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
}
const canonicalHash = value => crypto.createHash('sha256').update(canonical(value)).digest('hex');

function encodeSnapshot(name, value) {
  const spec = definition(name), records = [];
  function group(partition, kind, data) {
    if (kind === 'array' ? !Array.isArray(data) : !object(data)) fail();
    const entries = kind === 'array' ? data.map((payload, index) => [index, payload]) : Object.entries(data);
    for (const [key, payload] of entries) {
      records.push({ key: JSON.stringify([partition, key]), payload, digest: canonicalHash(payload) });
    }
    return { kind, ...(kind === 'array' ? { length: data.length } : {}) };
  }
  let layout;
  if (spec.root === 'map') layout = group(null, 'map', value);
  else if (spec.root === 'array' && Array.isArray(value)) layout = group(null, 'array', value);
  else {
    if (!object(value) || (spec.root === 'array' && Object.keys(value).length)) fail();
    for (const key of spec.required || []) if (!Object.hasOwn(value, key)) fail();
    layout = { kind: 'object', fields: Object.entries(value).map(([key, data]) => {
      const kind = Object.hasOwn(spec.groups || {}, key) ? spec.groups[key] : null;
      return [key, kind ? group(key, kind, data) : { kind: 'value', data }];
    }) };
  }
  return { layout, records, hash: canonicalHash(value) };
}

function decodeSnapshot(name, layout, records) {
  definition(name);
  const rows = new Map(), consumed = new Set();
  for (const row of records) {
    if (rows.has(row.key) || canonicalHash(row.payload) !== row.digest) fail('CORRUPT_STORE');
    rows.set(row.key, row.payload);
  }
  function group(partition, descriptor) {
    if (descriptor.kind === 'value') return descriptor.data;
    if (descriptor.kind === 'array') {
      if (!Number.isSafeInteger(descriptor.length) || descriptor.length < 0 || descriptor.length > records.length) fail('CORRUPT_STORE');
      return Array.from({ length: descriptor.length }, (_, index) => {
        const key = JSON.stringify([partition, index]);
        if (!rows.has(key)) fail('CORRUPT_STORE');
        consumed.add(key); return rows.get(key);
      });
    }
    if (descriptor.kind !== 'map') fail('CORRUPT_STORE');
    const entries = [];
    for (const [key, payload] of rows) {
      let parts; try { parts = JSON.parse(key); } catch { fail('CORRUPT_STORE'); }
      if (!Array.isArray(parts) || parts.length !== 2) fail('CORRUPT_STORE');
      if (parts[0] === partition) {
        if (typeof parts[1] !== 'string') fail('CORRUPT_STORE');
        consumed.add(key); entries.push([parts[1], payload]);
      }
    }
    return Object.fromEntries(entries);
  }
  let value;
  if (layout?.kind === 'object') {
    if (!Array.isArray(layout.fields) || new Set(layout.fields.map(field => field[0])).size !== layout.fields.length) fail('CORRUPT_STORE');
    value = Object.fromEntries(layout.fields.map(([key, descriptor]) => [key, group(key, descriptor)]));
  } else value = group(null, layout || {});
  if (consumed.size !== rows.size) fail('CORRUPT_STORE');
  encodeSnapshot(name, value); // Validate the reconstructed store as strictly as import.
  return value;
}
module.exports = { encodeSnapshot, decodeSnapshot, canonicalHash, canonical };
