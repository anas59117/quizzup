const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('archive API validator accepts optional empty vendor arrays but requires root declarations and entry reasons', () => {
  const workflow = read('.github/workflows/ios.yml');
  const source = workflow.match(/          def validate_accessed_apis[\s\S]*?(?=          app =)/)?.[0];
  assert.ok(source, 'Archive must expose the exact validator exercised here');
  const validator = source.split('\n').map(line => line.slice(10)).join('\n');
  const fixtures = `
root = 'app/PrivacyInfo.xcprivacy'
vendor = 'app/GoogleUtilities.bundle/PrivacyInfo.xcprivacy'
validate_accessed_apis({}, vendor, root)
validate_accessed_apis({'NSPrivacyAccessedAPITypes': []}, vendor, root)
valid = {'NSPrivacyAccessedAPIType': 'NSPrivacyAccessedAPICategoryUserDefaults', 'NSPrivacyAccessedAPITypeReasons': ['CA92.1']}
validate_accessed_apis({'NSPrivacyAccessedAPITypes': [valid]}, root, root)
for data, location in [({}, root), ({'NSPrivacyAccessedAPITypes': []}, root), ({'NSPrivacyAccessedAPITypes': 'bad'}, vendor), ({'NSPrivacyAccessedAPITypes': [{'NSPrivacyAccessedAPIType': 'NSPrivacyAccessedAPICategoryUserDefaults', 'NSPrivacyAccessedAPITypeReasons': []}]}, vendor)]:
    try:
        validate_accessed_apis(data, location, root)
    except AssertionError:
        continue
    raise AssertionError('Invalid declaration accepted: ' + str(data))
`;
  const result = spawnSync(process.platform === 'win32' ? 'python' : 'python3', ['-c', validator + fixtures], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || String(result.error));
});

function validateTrackingDomains(manifest) {
  manifest = manifest.replace(/<!--[\s\S]*?-->/g, '');
  const tracking = /<key>NSPrivacyTracking<\/key>\s*<true\s*\/>/.test(manifest);
  const array = manifest.match(/<key>NSPrivacyTrackingDomains<\/key>\s*<array\s*(?:\/>|>([\s\S]*?)<\/array>)/);
  if (manifest.includes('<key>NSPrivacyTrackingDomains</key>')) assert.ok(array, 'Tracking domains must be an array');
  if (array) assert.equal((array[1] ?? '').replace(/<string>[^<]*<\/string>/g, '').trim(), '', 'Tracking domains must contain strings only');
  const domains = [...(array?.[1] ?? '').matchAll(/<string>([^<]*)<\/string>/g)].map(match => match[1]);
  if (tracking) assert.ok(domains.length > 0, 'Tracking requires at least one domain (Apple TN3181)');
  else assert.equal(domains.length, 0, 'Tracking-disabled manifests cannot declare tracking domains (Apple TN3181)');
  for (const domain of domains) {
    assert.match(domain, /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i, 'Domain must have no scheme, path or query');
  }
  return domains;
}

test('tracking manifest rejects empty domains and malformed URLs before upload', () => {
  const fixture = value => `<key>NSPrivacyTracking</key><true/><key>NSPrivacyTrackingDomains</key>${value}`;
  assert.throws(() => validateTrackingDomains(fixture('<array/>')), /at least one domain/);
  assert.deepEqual(validateTrackingDomains('<key>NSPrivacyTracking</key><false/><key>NSPrivacyTrackingDomains</key><array/>'), []);
  assert.throws(() => validateTrackingDomains('<key>NSPrivacyTracking</key><false/><key>NSPrivacyTrackingDomains</key><string>bad</string>'), /must be an array/);
  assert.throws(() => validateTrackingDomains('<key>NSPrivacyTracking</key><false/><key>NSPrivacyTrackingDomains</key><array><string>googleads.g.doubleclick.net</string></array>'), /Tracking-disabled/);
  assert.throws(() => validateTrackingDomains(fixture('<array><string>https://googleads.g.doubleclick.net/</string></array>')), /Domain must/);
  const domains = validateTrackingDomains(read('ios/Sources/QuizzUp/Resources/PrivacyInfo.xcprivacy'));
  assert.deepEqual(domains, ['googleads.g.doubleclick.net', 'pagead2.googlesyndication.com']);
  const manifest = read('ios/Sources/QuizzUp/Resources/PrivacyInfo.xcprivacy');
  for (const key of ['NSPrivacyTracking', 'NSPrivacyTrackingDomains']) {
    assert.equal(manifest.split(`<key>${key}</key>`).length - 1, 1, `Duplicate ${key}`);
  }
});

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

test('release topics retain artwork and valid bundled image references', () => {
  const catalog = JSON.parse(read('ios/Sources/QuizzUp/Resources/topic-catalog.json'));
  assert.ok(!read('frontend/scripts/native-catalog.entry.js').includes('restricted.has'), 'Catalog regeneration must preserve artwork');
  for (const [key, entry] of Object.entries(catalog)) {
    assert.ok(entry.src || entry.assetName, `Missing artwork: ${key}`);
    for (const source of [entry.src, entry.detailSrc]) {
      if (source?.startsWith('/images/')) assert.ok(fs.existsSync(path.join(root, 'frontend/public', source)), `${key}: ${source}`);
    }
    if (entry.assetName) {
      const directory = path.join(root, 'ios/Sources/QuizzUp/Resources/Assets.xcassets', `${entry.assetName}.imageset`);
      const contents = JSON.parse(fs.readFileSync(path.join(directory, 'Contents.json'), 'utf8'));
      for (const image of contents.images.filter(image => image.filename)) assert.ok(fs.existsSync(path.join(directory, image.filename)), key);
    }
  }
});

test('backend and frontend release policies match and adult topics are absent from native catalog', () => {
  const excluded = JSON.parse(read('frontend/src/releaseExcludedTopics.json'));
  assert.deepEqual(JSON.parse(read('backend/release-excluded-topics.json')), excluded);
  const catalog = JSON.parse(read('ios/Sources/QuizzUp/Resources/topic-catalog.json'));
  for (const key of excluded) assert.ok(!catalog[key], key);
});
