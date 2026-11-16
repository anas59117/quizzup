// Local integration seam: only the explicit test JWT format reaches Firebase lookup.
const actualFetch = global.fetch;
if (process.env.TEST_DELETE_FLUSH_FAILURE === '1') {
  const writer = require('../json-writer'), original = writer.createJsonWriter;
  writer.createJsonWriter = (file, ...args) => {
    const persist = original(file, ...args);
    if (file.endsWith('deleted-identities.json')) {
      const flush = persist.flush; let fail = true;
      persist.flush = async () => { if (fail) { fail = false; throw Error('Injected deletion durability failure'); } return flush(); };
    }
    return persist;
  };
}
if (process.env.TEST_SLOW_QUESTIONS === '1') {
  const questions = require('../questions'), original = questions.getMixedQuestions;
  questions.getMixedQuestions = async (...args) => {
    process.send?.({ type: 'test-questions-pending' });
    await new Promise(resolve => setTimeout(resolve, 400));
    return original(...args);
  };
}
global.fetch = async (url, options) => {
  if (!String(url).startsWith('https://identitytoolkit.googleapis.com/')) return actualFetch(url, options);
  const token = JSON.parse(options.body).idToken;
  if (!token?.endsWith('.test-signature')) return new Response('{}', { status: 401 });
  const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url'));
  return new Response(JSON.stringify({ users: [{ localId: payload.sub }] }), { status: 200 });
};
