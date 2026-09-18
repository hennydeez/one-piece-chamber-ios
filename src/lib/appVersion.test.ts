import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { APP_VERSION_FALLBACK, appVersionLabel, versionFromExpoConfig } from './appVersion';

describe('versionFromExpoConfig', () => {
  it('reads Constants.expoConfig.version', () => {
    assert.equal(versionFromExpoConfig({ version: '0.9.1' }), '0.9.1');
    assert.equal(versionFromExpoConfig({ version: ' 1.2.3 ' }), '1.2.3');
  });

  it('falls back when Expo config has no version', () => {
    assert.equal(versionFromExpoConfig({ version: '' }), APP_VERSION_FALLBACK);
    assert.equal(versionFromExpoConfig({ version: '   ' }), APP_VERSION_FALLBACK);
    assert.equal(versionFromExpoConfig(null), APP_VERSION_FALLBACK);
    assert.equal(versionFromExpoConfig(undefined), APP_VERSION_FALLBACK);
  });
});

describe('appVersionLabel', () => {
  it('prefixes a short v', () => {
    assert.equal(appVersionLabel('0.9.1'), 'v0.9.1');
  });
});
