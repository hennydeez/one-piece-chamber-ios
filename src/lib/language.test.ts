import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { compLanguageFromCode, languageCodeFromComp } from './language';

describe('comp language', () => {
  it('maps Global to EN and Jap to JP', () => {
    assert.equal(languageCodeFromComp('Global'), 'EN');
    assert.equal(languageCodeFromComp('Jap'), 'JP');
  });

  it('maps JP to Jap and everything else to Global', () => {
    assert.equal(compLanguageFromCode('JP'), 'Jap');
    assert.equal(compLanguageFromCode('EN'), 'Global');
    assert.equal(compLanguageFromCode('KR'), 'Global');
  });
});
