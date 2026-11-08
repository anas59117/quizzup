// Explicit local-only auth boundary for HTTP moderation regressions.
const auth = require('../auth');
const verify = auth.verifyIdToken;
auth.verifyFirebaseIdToken = async token => token === 'firebase-linked-review-token' ? 'raw-firebase-review-uid' : null;
auth.verifyIdToken = async token => token === 'firebase-linked-review-token'
  ? 'guest_AAAAAAAAAAAAAAAAAAAAAAAA' : verify(token);
