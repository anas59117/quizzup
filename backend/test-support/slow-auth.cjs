// Explicit preload for the late-identification regression test only.
const auth = require('../auth');
const original = auth.verifyIdToken;
auth.verifyIdToken = async (...args) => {
  await new Promise(resolve => setTimeout(resolve, 800));
  const uid = await original(...args);
  process.send?.({ type: 'test-auth-complete', verified: !!uid });
  return uid;
};
