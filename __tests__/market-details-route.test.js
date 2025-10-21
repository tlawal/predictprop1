import { jest } from '@jest/globals';
import { NextResponse } from 'next/server';
import { GET, __TEST__clearCache } from '../app/api/market-details/[slug]/route';

jest.mock('../lib/utils/fetchWithBackoff', () => ({
  fetchWithBackoff: jest.fn(),
}));

const { fetchWithBackoff } = jest.requireMock('../lib/utils/fetchWithBackoff');

describe('GET /api/market-details/[slug]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __TEST__clearCache();
  });

  test('returns parsed market details when fetch succeeds', async () => {
    const html = `
      <html>
        <head>
          <meta property="og:description" content="Test description" />
        </head>
        <body>
          <div class="market-rules">
            <p>Rule A</p>
            <p>Rule B</p>
          </div>
        </body>
      </html>
    `;

    fetchWithBackoff.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => html,
    });

    const request = new Request('http://localhost/api/market-details/test-market');
    const response = await GET(request, { params: { slug: 'test-market' } });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      slug: 'test-market',
      sourceUrl: 'https://polymarket.com/event/test-market',
      description: 'Test description',
      resolutionCriteria: null,
      rulesText: 'Rule A\nRule B',
    });
  });

  test('uses cache for repeated requests', async () => {
    const html = `
      <html>
        <head>
          <meta property="og:description" content="Cached description" />
        </head>
        <body>
          <div class="market-rules">
            <p>Cached Rule</p>
          </div>
        </body>
      </html>
    `;

    fetchWithBackoff.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => html,
    });

    const request = new Request('http://localhost/api/market-details/cached-market');

    const first = await GET(request, { params: { slug: 'cached-market' } });
    expect(fetchWithBackoff).toHaveBeenCalledTimes(1);
    await first.json();

    const second = await GET(request, { params: { slug: 'cached-market' } });
    expect(fetchWithBackoff).toHaveBeenCalledTimes(1);
    const payload = await second.json();

    expect(payload.rulesText).toBe('Cached Rule');
  });

  test('returns 400 when slug is missing', async () => {
    const request = new Request('http://localhost/api/market-details/');
    const response = await GET(request, { params: { slug: '' } });
    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error).toBe('Missing slug parameter');
  });

  test('returns 500 when fetch fails', async () => {
    fetchWithBackoff.mockRejectedValue(new Error('Network error'));

    const request = new Request('http://localhost/api/market-details/error-market');
    const response = await GET(request, { params: { slug: 'error-market' } });

    expect(response.status).toBe(500);
    const payload = await response.json();
    expect(payload.error).toBe('Failed to load market details');
  });
});
