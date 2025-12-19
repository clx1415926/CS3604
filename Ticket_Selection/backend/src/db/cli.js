const { initDb, backupDb, resetAndSeed } = require('./index');

async function main() {
  const cmd = process.argv[2] || '';
  if (cmd === 'init' || cmd === 'migrate') {
    await initDb();
    process.stdout.write('OK\n');
    return;
  }
  if (cmd === 'seed') {
    await resetAndSeed();
    process.stdout.write('OK\n');
    return;
  }
  if (cmd === 'backup') {
    const p = await backupDb();
    process.stdout.write(String(p || '') + '\n');
    return;
  }
  process.stdout.write('Usage: node src/db/cli.js init|migrate|seed|backup\n');
  process.exitCode = 1;
}

main().catch((e) => {
  console.error('[ticket-selection][db] cli failed', e);
  process.exitCode = 1;
});
