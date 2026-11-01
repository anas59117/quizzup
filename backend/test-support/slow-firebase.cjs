// Explicit preload for HTTP mutation/shutdown regression only.
const auth = require('../auth');
auth.verifyFirebaseIdToken = async () => {
  process.send?.({ type: 'test-firebase-started' });
  await new Promise(resolve => setTimeout(resolve, 800));
  return 'shutdown-test-firebase';
};
