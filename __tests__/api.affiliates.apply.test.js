import { NextResponse } from 'next/server';

describe('POST /api/affiliates/apply', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('returns 400 when required fields are missing', async () => {
    jest.doMock('../lib/supabase', () => ({
      supabaseAdmin: null,
      isSupabaseConfigured: false
    }));
    jest.doMock('crypto', () => ({ randomUUID: () => 'test-uuid' }));

    const { POST } = await import('../app/api/affiliates/apply/route');

    const request = new Request('http://localhost/api/affiliates/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'partner@example.com',
        promotion_method: 'A very detailed plan that exceeds one hundred characters to describe shareable content.'
      })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toMatch(/name is required/i);
  });

  test('returns validation error when promotion plan is too short', async () => {
    jest.doMock('../lib/supabase', () => ({
      supabaseAdmin: null,
      isSupabaseConfigured: false
    }));
    jest.doMock('crypto', () => ({ randomUUID: () => 'test-uuid' }));

    const { POST } = await import('../app/api/affiliates/apply/route');

    const request = new Request('http://localhost/api/affiliates/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Creator',
        email: 'creator@example.com',
        promotion_method: 'Too short'
      })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toMatch(/promotion method must be at least 100 characters/i);
  });

  test('returns mock success when supabase is not configured', async () => {
    jest.doMock('../lib/supabase', () => ({
      supabaseAdmin: null,
      isSupabaseConfigured: false
    }));
    jest.doMock('crypto', () => ({ randomUUID: () => 'test-uuid' }));

    const { POST } = await import('../app/api/affiliates/apply/route');

    const request = new Request('http://localhost/api/affiliates/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Community Lead',
        email: 'community@example.com',
        promotion_method: 'I plan to create weekly deep-dives, run community discussions, and share exclusive materials across multiple platforms to promote PolyProp effectively.',
        website: 'https://example.com'
      })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.success).toBe(true);
    expect(payload.mock).toBe(true);
    expect(payload.affiliate.affiliateId).toBe('aff-test-uuid');
    expect(payload.affiliate.status).toBe('pending');
  });
});
