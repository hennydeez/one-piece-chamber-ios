import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isExpoGoHost, optionalNativeModule } from './nativeModules';

describe('optionalNativeModule', () => {
  it('never throws and returns null when a native module is absent', () => {
    assert.equal(optionalNativeModule('ExpoAsset'), null);
    assert.equal(optionalNativeModule('ExponentConstants'), null);
    assert.equal(optionalNativeModule('ExponentFileSystem'), null);
  });
});

describe('isExpoGoHost', () => {
  it('does not claim Expo Go when constants native modules are missing', () => {
    assert.equal(isExpoGoHost(), false);
  });
});
