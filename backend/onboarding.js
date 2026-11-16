const STATUSES = new Set(['pending', 'skipped', 'completed', 'legacy']);
const ACTIONS = new Set(['skip', 'complete', 'rules', 'community', 'progression']);

// Only persisted server metadata passes here. Client messages carry enum actions,
// never a state object. Missing metadata belongs to a pre-onboarding profile.
function normalizeOnboarding(raw, fallbackStatus = 'legacy') {
  const valid = !!raw && typeof raw === 'object' && !Array.isArray(raw)
    && raw.version === 1 && STATUSES.has(raw.status);
  return {
    version: 1,
    status: valid ? raw.status : fallbackStatus,
    rulesSeen: valid && raw.rulesSeen === true,
    communitySeen: valid && raw.communitySeen === true,
    progressionSeen: valid && raw.progressionSeen === true,
    profileComplete: valid ? raw.profileComplete === true : fallbackStatus === 'legacy',
  };
}

function applyOnboardingAction(current, action) {
  if (!ACTIONS.has(action)) return { ok: false, code: 'INVALID_ACTION' };
  const next = { ...current };
  if (action === 'skip') {
    if (next.status !== 'legacy') next.status = 'skipped';
  } else if (action === 'complete') {
    // Skip wins over a delayed complete from another socket or queued callback.
    if (next.status === 'pending') {
      if (!next.profileComplete) return { ok: false, code: 'ONBOARDING_INCOMPLETE' };
      next.status = 'completed';
    }
  } else {
    next[`${action}Seen`] = true;
  }
  return { ok: true, onboarding: next };
}

module.exports = { normalizeOnboarding, applyOnboardingAction };
