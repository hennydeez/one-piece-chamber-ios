import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  catalogRawImageCandidates,
  confirmImageUrl,
  imageUrlFromComps,
  isOpCardCode,
  lookupCardImage,
  parseOpCardCode,
} from './lookupCardImage';

const OP06_PRINTS_HTML = `
<table class="card-prints-versions">
  <tr><th>Print</th></tr>
  <tr class="current"><td><a>Wings of the Captain<span class="prints-table-card-number"></span></a></td></tr>
  <tr><td><a href="/cards/en/OP06-101?v=1">Wings of the Captain<span class="prints-table-card-number">aa</span></a></td></tr>
  <tr><td><a href="/cards/en/OP06-101?v=3">Event Pack Vol.5<span class="prints-table-card-number"></span></a></td></tr>
  <tr><td><a href="/cards/en/OP06-101?v=4">CS 25–26 Event Pack<span class="prints-table-card-number"></span></a></td></tr>
</table>
`;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function imageResponse(status = 200, contentType = 'image/webp'): Response {
  return new Response('img', {
    status,
    headers: { 'content-type': contentType },
  });
}

describe('parseOpCardCode', () => {
  it('parses set, number, and optional parallel suffix', () => {
    assert.deepEqual(parseOpCardCode('op01-001'), {
      code: 'OP01-001',
      set: 'OP01',
      baseCode: 'OP01-001',
    });
    assert.deepEqual(parseOpCardCode('OP01-001_p1'), {
      code: 'OP01-001_p1',
      set: 'OP01',
      baseCode: 'OP01-001',
    });
    assert.deepEqual(parseOpCardCode('P-001'), {
      code: 'P-001',
      set: 'P',
      baseCode: 'P-001',
    });
  });

  it('rejects junk — does not invent a code', () => {
    assert.equal(parseOpCardCode(''), null);
    assert.equal(parseOpCardCode('Zoro'), null);
    assert.equal(parseOpCardCode('OP01'), null);
    assert.equal(isOpCardCode('not-a-card'), false);
    assert.equal(isOpCardCode('OP01-001'), true);
  });
});

describe('catalogRawImageCandidates', () => {
  it('builds Limitless then official URLs for a known pattern', () => {
    assert.deepEqual(catalogRawImageCandidates('OP01-001', 'EN'), [
      'https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/one-piece/OP01/OP01-001_EN.webp',
      'https://en.onepiece-cardgame.com/images/cardlist/card/OP01-001.png',
    ]);
  });

  it('tries JP then EN on Limitless', () => {
    const urls = catalogRawImageCandidates('ST01-001', 'JP');
    assert.equal(
      urls[0],
      'https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/one-piece/ST01/ST01-001_JP.webp',
    );
    assert.ok(urls.includes(
      'https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/one-piece/ST01/ST01-001_EN.webp',
    ));
  });

  it('tries _p1/_p2 when the print note says alt — still unconfirmed', () => {
    const urls = catalogRawImageCandidates('OP01-001', 'EN', 'Alt art');
    assert.ok(urls[0].includes('OP01-001_p1_EN.webp'));
    assert.ok(urls.some((url) => url.includes('OP01-001_p2')));
    assert.ok(urls.some((url) => url.endsWith('OP01-001.png')));
  });

  it('returns no candidates for an invalid code — does not invent', () => {
    assert.deepEqual(catalogRawImageCandidates('nope'), []);
  });
});

describe('confirmImageUrl', () => {
  it('keeps a URL only when the host says it is an image', async () => {
    const fetchImpl = (async (input: RequestInfo | URL) => {
      assert.equal(String(input), 'https://cdn.example/op01-001.webp');
      return imageResponse();
    }) as typeof fetch;
    assert.equal(
      await confirmImageUrl('https://cdn.example/op01-001.webp', fetchImpl),
      'https://cdn.example/op01-001.webp',
    );
  });

  it('rejects a 404 or non-image — never invents', async () => {
    const missing = (async () => new Response('nope', { status: 404 })) as typeof fetch;
    assert.equal(await confirmImageUrl('https://cdn.example/missing.webp', missing), null);

    const html = (async () =>
      new Response('<html></html>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      })) as typeof fetch;
    assert.equal(await confirmImageUrl('https://cdn.example/page', html), null);
    assert.equal(await confirmImageUrl('OP01-001', html), null);
  });
});

describe('lookupCardImage', () => {
  it('uses confirmed Limitless card art for Raw', async () => {
    const fetchImpl = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('limitlesstcg') && url.endsWith('_EN.webp')) return imageResponse();
      throw new Error(`unexpected ${url}`);
    }) as typeof fetch;

    const found = await lookupCardImage({ cardCode: 'OP01-001', type: 'Raw' }, { fetchImpl });
    assert.equal(
      found.imageUrl,
      'https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/one-piece/OP01/OP01-001_EN.webp',
    );
    assert.equal(found.kind, 'raw');
    assert.equal(found.source, 'limitless');
    assert.equal(found.message, 'Card art for OP01-001.');
  });

  it('prefers a comps slab image when the API sent a real URL', async () => {
    const fetchImpl = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('comps.php')) {
        assert.match(url, /type=PSA/);
        assert.match(url, /grade=10/);
        return jsonResponse({ imageUrl: 'https://cdn.example/psa-slab.jpg', solds: [] });
      }
      throw new Error(`unexpected ${url}`);
    }) as typeof fetch;

    const found = await lookupCardImage(
      { cardCode: 'OP01-001', type: 'PSA', grade: '10' },
      { fetchImpl, endpoint: 'https://example.com/api/comps.php' },
    );
    assert.equal(found.imageUrl, 'https://cdn.example/psa-slab.jpg');
    assert.equal(found.kind, 'slab');
    assert.equal(found.source, 'comps');
    assert.equal(found.message, 'Slab photo for OP01-001.');
  });

  it('falls back honestly to card art when no slab photo exists', async () => {
    const fetchImpl = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('comps.php')) return jsonResponse({ solds: [] });
      if (url.includes('limitlesstcg')) return imageResponse();
      return new Response('nope', { status: 404 });
    }) as typeof fetch;

    const found = await lookupCardImage(
      { cardCode: 'OP01-001', type: 'BGS', grade: '9.5' },
      { fetchImpl, endpoint: 'https://example.com/api/comps.php' },
    );
    assert.equal(found.kind, 'raw');
    assert.equal(found.source, 'limitless');
    assert.equal(found.message, 'No slab photo — using card art.');
    assert.ok(found.imageUrl?.includes('OP01-001_EN.webp'));
  });

  it('narrows OP06-101 + CS 25-26 event pack to that confirmed print', async () => {
    const fetchImpl = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('limitlesstcg.com/cards/')) {
        return new Response(OP06_PRINTS_HTML, { headers: { 'content-type': 'text/html' } });
      }
      if (url.includes('OP06-101_p4_EN.webp')) return imageResponse();
      return new Response('nope', { status: 404 });
    }) as typeof fetch;

    const found = await lookupCardImage(
      { cardCode: 'OP06-101', type: 'Raw', printNote: 'cs 25-26 event pack' },
      { fetchImpl },
    );
    assert.equal(
      found.imageUrl,
      'https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/one-piece/OP06/OP06-101_p4_EN.webp',
    );
    assert.equal(found.options.length, 0);
    assert.match(found.message, /CS 25–26 Event Pack/);
  });

  it('asks the user to pick when more than one print matches', async () => {
    const fetchImpl = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('limitlesstcg.com/cards/')) {
        return new Response(OP06_PRINTS_HTML, { headers: { 'content-type': 'text/html' } });
      }
      if (url.includes('OP06-101_p3_EN.webp') || url.includes('OP06-101_p4_EN.webp')) {
        return imageResponse();
      }
      return new Response('nope', { status: 404 });
    }) as typeof fetch;

    const found = await lookupCardImage(
      { cardCode: 'OP06-101', type: 'Raw', printNote: 'event pack' },
      { fetchImpl },
    );
    assert.equal(found.imageUrl, null);
    assert.equal(found.options.length, 2);
    assert.deepEqual(
      found.options.map((option) => option.label),
      ['Event Pack Vol.5', 'CS 25–26 Event Pack'],
    );
    assert.equal(found.message, 'Several prints match. Pick one.');
  });

  it('returns no image when nothing confirms — does not invent', async () => {
    const fetchImpl = (async () => new Response('nope', { status: 404 })) as typeof fetch;
    const found = await lookupCardImage({ cardCode: 'OP99-999', type: 'Raw' }, { fetchImpl });
    assert.equal(found.imageUrl, null);
    assert.equal(found.source, null);
    assert.equal(found.message, 'No photo for this code.');
  });
});

describe('imageUrlFromComps', () => {
  it('reads imageUrl and ignores solds — does not invent prices', async () => {
    const fetchImpl = (async () =>
      jsonResponse({
        solds: [],
        imageUrl: 'https://cdn.example/from-comps.jpg',
      })) as typeof fetch;
    const url = await imageUrlFromComps(
      { cardCode: 'OP01-001', type: 'Raw' },
      { fetchImpl, endpoint: 'https://example.com/api/comps.php' },
    );
    assert.equal(url, 'https://cdn.example/from-comps.jpg');
  });

  it('returns null when comps has no imageUrl', async () => {
    const fetchImpl = (async () => jsonResponse({ solds: [] })) as typeof fetch;
    const url = await imageUrlFromComps(
      { cardCode: 'OP01-001', type: 'PSA', grade: '10' },
      { fetchImpl, endpoint: 'https://example.com/api/comps.php' },
    );
    assert.equal(url, null);
  });
});
