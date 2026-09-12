import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DEFAULT_COMPS_API_URL, HttpCompsService, createCompsService } from './index';

describe('createCompsService', () => {
  it('defaults to the public comps.php URL when env is unset', () => {
    const previous = process.env.EXPO_PUBLIC_COMPS_API_URL;
    delete process.env.EXPO_PUBLIC_COMPS_API_URL;
    try {
      const service = createCompsService();
      assert.ok(service instanceof HttpCompsService);
      assert.equal(service.endpoint, DEFAULT_COMPS_API_URL);
    } finally {
      if (previous === undefined) delete process.env.EXPO_PUBLIC_COMPS_API_URL;
      else process.env.EXPO_PUBLIC_COMPS_API_URL = previous;
    }
  });

  it('defaults when env is blank or whitespace', () => {
    const previous = process.env.EXPO_PUBLIC_COMPS_API_URL;
    try {
      process.env.EXPO_PUBLIC_COMPS_API_URL = '   ';
      const service = createCompsService();
      assert.ok(service instanceof HttpCompsService);
      assert.equal(service.endpoint, DEFAULT_COMPS_API_URL);
    } finally {
      if (previous === undefined) delete process.env.EXPO_PUBLIC_COMPS_API_URL;
      else process.env.EXPO_PUBLIC_COMPS_API_URL = previous;
    }
  });

  it('uses a trimmed custom URL when set', () => {
    const previous = process.env.EXPO_PUBLIC_COMPS_API_URL;
    try {
      process.env.EXPO_PUBLIC_COMPS_API_URL = ' https://example.com/api/comps.php ';
      const service = createCompsService();
      assert.ok(service instanceof HttpCompsService);
      assert.equal(service.endpoint, 'https://example.com/api/comps.php');
    } finally {
      if (previous === undefined) delete process.env.EXPO_PUBLIC_COMPS_API_URL;
      else process.env.EXPO_PUBLIC_COMPS_API_URL = previous;
    }
  });
});
