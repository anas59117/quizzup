const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('advertising update pins verified SDKs and keeps test creatives out of production configuration', () => {
  const project = read('ios/project.yml');
  assert.match(project, /GoogleMobileAds:[\s\S]*?exactVersion: 13\.13\.0/);
  assert.match(project, /GoogleUserMessagingPlatform:[\s\S]*?exactVersion: 3\.1\.0/);
  assert.match(project, /GADApplicationIdentifier: "ca-app-pub-8063787213241660~8267818819"/);
  assert.match(project, /QuizzUpInterstitialUnitID: "ca-app-pub-8063787213241660\/1263426767"/);
  assert.doesNotMatch(project, /3940256099942544|QuizzUpAdsTestMode:\s*true/);
  assert.match(project, /NSUserTrackingUsageDescription:/);
  assert.match(project, /MARKETING_VERSION: "1\.1"/);
  const manager = read('ios/Sources/QuizzUp/AdsManager.swift');
  assert.match(manager, /NativeAdEnvironment\.usesTestAds/);
  assert.match(manager, /#if STORE_CAPTURE/);
  assert.match(manager, /ConsentInformation\.shared/);
  assert.doesNotMatch(manager, /\.rawValue|consentDetails|consentErrorCode/);
  const manifest = read('ios/Sources/QuizzUp/Resources/PrivacyInfo.xcprivacy');
  assert.match(manifest, /<key>NSPrivacyTracking<\/key>\s*<true\/>/);
  assert.match(manifest, /CollectedDataTypeDeviceID/);
  assert.match(manifest, /CollectedDataTypeOtherDiagnosticData/);
  assert.match(manifest, /PurposeThirdPartyAdvertising/);
  assert.match(manifest, /CollectedDataTypeAdvertisingData/);
  assert.match(manifest, /CollectedDataTypePerformanceData/);
  assert.match(manifest, /CollectedDataTypeCrashData/);
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
