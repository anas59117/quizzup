require('dotenv').config();
const { readSource, writeDirectory, manifest } = require('../storage/migration-files');
const { PostgresStore } = require('../storage/postgres-store');
function fail(code) { throw Object.assign(new Error(code), { code }); }
function argumentsFor(argv) {
  const [command, ...args] = argv;
  if (!['inspect', 'import', 'verify', 'export', 'status'].includes(command)) fail('STORAGE_COMMAND_REQUIRED');
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    const name = args[i];
    if (!['--source', '--backup', '--target', '--source-is-stopped', '--allow-empty'].includes(name) || Object.hasOwn(flags, name)) fail('INVALID_STORAGE_ARGUMENT');
    if (['--source-is-stopped', '--allow-empty'].includes(name)) flags[name] = true;
    else { const value = args[++i]; if (!value || value.startsWith('--')) fail('INVALID_STORAGE_ARGUMENT'); flags[name] = value; }
  }
  return { command, flags };
}
async function main(argv) {
  const { command, flags } = argumentsFor(argv);
  let source;
  if (['inspect', 'import', 'verify'].includes(command)) {
    if (!flags['--source']) fail('SOURCE_DIRECTORY_REQUIRED');
    source = readSource(flags['--source']);
  }
  if (command === 'inspect') return { command, ...source.manifest };
  if (command === 'import') {
    if (!flags['--source-is-stopped']) fail('STOP_AND_FLUSH_SOURCE_FIRST');
    if (!flags['--backup']) fail('BACKUP_DIRECTORY_REQUIRED');
    if (!flags['--allow-empty'] && source.manifest.stores.every(s => s.entities === 0)) fail('EMPTY_SOURCE_REQUIRES_ALLOW_EMPTY');
    writeDirectory(flags['--backup'], source.data);
  }
  if (command === 'export' && !flags['--target']) fail('NEW_EXPORT_DIRECTORY_REQUIRED');
  const db = await PostgresStore.open({ connectionString: process.env.DATABASE_URL,
    create: command === 'import', readOnly: ['verify', 'status'].includes(command) });
  try {
    let imported;
    if (command === 'import') imported = await db.importDataset(source.data);
    const current = await db.load(), result = manifest(current);
    if (source && source.manifest.datasetHash !== result.datasetHash) fail('DATABASE_VERIFICATION_FAILED');
    if (command === 'export') writeDirectory(flags['--target'], current);
    return { command, verified: true, ...(imported || {}), ...result };
  } finally { await db.close(); }
}
if (require.main === module) main(process.argv.slice(2)).then(result => console.log(JSON.stringify(result, null, 2))).catch(error => {
  console.error(`Storage command failed: ${error.code || 'STORAGE_OPERATION_FAILED'}`);
  process.exitCode = 1;
});
module.exports = { main, argumentsFor };
