const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('public release has no advertising SDK, tracking prompt or ad declarations', () => {
  assert.doesNotMatch(read('ios/project.yml'), /GoogleMobileAds|UserMessagingPlatform|GADApplicationIdentifier|NSUserTrackingUsageDescription|SKAdNetwork/);
  assert.doesNotMatch(read('ios/Sources/QuizzUp/AdsManager.swift'), /import (GoogleMobileAds|UserMessagingPlatform|AppTrackingTransparency)/);
  const manifest = read('ios/Sources/QuizzUp/Resources/PrivacyInfo.xcprivacy');
  assert.match(manifest, /<key>NSPrivacyTracking<\/key>\s*<false\/>/);
  assert.match(manifest, /CollectedDataTypeDeviceID/);
  assert.match(manifest, /CollectedDataTypeOtherDiagnosticData/);
  assert.doesNotMatch(manifest, /<key>NSPrivacyCollectedDataTypeTracking<\/key>\s*<true\/>/);
  assert.doesNotMatch(manifest, /PurposeThirdPartyAdvertising|CollectedDataTypeAdvertisingData/);
});

test('restricted promotional covers cannot ship or resolve in the native catalog', () => {
  const restricted = JSON.parse(read('frontend/scripts/restricted-topic-covers.json'));
  const catalog = JSON.parse(read('ios/Sources/QuizzUp/Resources/topic-catalog.json'));
  for (const key of restricted) {
    if (!catalog[key]) continue;
    assert.ok(!catalog[key].src && !catalog[key].detailSrc && !catalog[key].assetName, key);
    assert.ok(!fs.existsSync(path.join(root, 'ios/Sources/QuizzUp/Resources/Assets.xcassets', `topic-${key}.imageset`)), key);
  }
});

test('backend and frontend release policies match and adult topics are absent from native catalog', () => {
  const excluded = JSON.parse(read('frontend/src/releaseExcludedTopics.json'));
  assert.deepEqual(JSON.parse(read('backend/release-excluded-topics.json')), excluded);
  const catalog = JSON.parse(read('ios/Sources/QuizzUp/Resources/topic-catalog.json'));
  for (const key of excluded) assert.ok(!catalog[key], key);
});
