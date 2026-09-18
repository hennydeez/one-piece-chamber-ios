import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { printNoteMatchesLabel, printTokens } from './printNoteMatch';

describe('printTokens', () => {
  it('splits dashes and the catalog en-dash', () => {
    assert.deepEqual(printTokens('cs 25-26 event pack'), ['cs', '25', '26', 'event', 'pack']);
    assert.deepEqual(printTokens('CS 25–26 Event Pack'), ['cs', '25', '26', 'event', 'pack']);
  });
});

describe('printNoteMatchesLabel', () => {
  it('narrows CS 25-26 event pack to that catalog print', () => {
    assert.equal(printNoteMatchesLabel('cs 25-26 event pack', 'CS 25–26 Event Pack'), true);
    assert.equal(printNoteMatchesLabel('cs 25-26 event pack', 'Event Pack Vol.5'), false);
    assert.equal(printNoteMatchesLabel('cs 25-26 event pack', 'Wings of the Captain'), false);
  });

  it('treats a short event-pack note as ambiguous across event packs', () => {
    assert.equal(printNoteMatchesLabel('event pack', 'Event Pack Vol.5'), true);
    assert.equal(printNoteMatchesLabel('event pack', 'CS 25–26 Event Pack'), true);
    assert.equal(printNoteMatchesLabel('event pack', 'Wings of the Captain aa'), false);
  });

  it('maps alt art onto an aa print label', () => {
    assert.equal(printNoteMatchesLabel('alt art', 'Wings of the Captain aa'), true);
    assert.equal(printNoteMatchesLabel('Alternate Art', 'Wings of the Captain'), false);
  });

  it('treats a blank note as matching any label', () => {
    assert.equal(printNoteMatchesLabel('', 'CS 25–26 Event Pack'), true);
    assert.equal(printNoteMatchesLabel(null, 'Base'), true);
  });
});
