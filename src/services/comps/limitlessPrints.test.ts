import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseLimitlessPrints, printVariantCode } from './limitlessPrints';

const OP06_PRINTS_HTML = `
<table class="card-prints-versions">
  <tr><th>Print</th><th>USD</th></tr>
  <tr class="current">
    <td><a>Wings of the Captain<span class="prints-table-card-number"></span></a></td>
  </tr>
  <tr>
    <td><a href="/cards/en/OP06-101?v=1">Wings of the Captain<span class="prints-table-card-number">aa</span></a></td>
  </tr>
  <tr>
    <td><a href="/cards/en/OP06-101?v=3">Event Pack Vol.5<span class="prints-table-card-number"></span></a></td>
  </tr>
  <tr>
    <td><a href="/cards/en/OP06-101?v=4">CS 25–26 Event Pack<span class="prints-table-card-number"></span></a></td>
  </tr>
</table>
`;

describe('parseLimitlessPrints', () => {
  it('reads labels and v= indices from the prints table', () => {
    const prints = parseLimitlessPrints(OP06_PRINTS_HTML, 'OP06-101');
    assert.deepEqual(prints, [
      { index: 0, label: 'Wings of the Captain' },
      { index: 1, label: 'Wings of the Captain aa' },
      { index: 3, label: 'Event Pack Vol.5' },
      { index: 4, label: 'CS 25–26 Event Pack' },
    ]);
  });

  it('returns nothing when the table is missing — does not invent prints', () => {
    assert.deepEqual(parseLimitlessPrints('<html></html>', 'OP06-101'), []);
  });
});

describe('printVariantCode', () => {
  it('maps v=0 to the base code and v=N to _pN', () => {
    assert.equal(printVariantCode('OP06-101', 0), 'OP06-101');
    assert.equal(printVariantCode('OP06-101', 4), 'OP06-101_p4');
  });
});
