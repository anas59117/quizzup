// Windows kill('SIGTERM') bypasses Node's signal handlers. Use a local IPC
// request to exercise the production flush-and-close path in these tests.
process.on('message', message => {
  if (message?.type === 'test_shutdown') process.emit('SIGTERM');
});
