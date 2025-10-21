import { NextResponse } from 'next/server';
import { fetchWithBackoff } from '../../../../lib/utils/fetchWithBackoff';
import * as cheerio from 'cheerio';

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const memoryCache = new Map();

function getFromCache(key) {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value;
}

export function __TEST__clearCache() {
  memoryCache.clear();
}

function setCache(key, value, ttlMs) {
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

function normalizeWhitespace(text) {
  return text.replace(/\s+/g, ' ').trim();
}

export async function GET(request, { params }) {
  const { slug } = params || {};

  if (!slug) {
    return NextResponse.json({ error: 'Missing slug parameter' }, { status: 400 });
  }

  try {
    const cacheKey = `market-details:${slug}`;
    const cached = getFromCache(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const targetUrl = `https://polymarket.com/event/${encodeURIComponent(slug)}`;

    const response = await fetchWithBackoff(targetUrl, {
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'PolyProp/1.0 (+https://github.com/tlawal/predictprop1)',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Polymarket page: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const descriptionText = normalizeWhitespace(
      $("meta[property='og:description']").attr('content') ||
        $("meta[name='description']").attr('content') ||
        $('.description').text() ||
        ''
    );

    const resolutionTextCandidates = [
      $('.resolution-criteria').text(),
      $('.resolution').text(),
      $('.resolution-conditions').text(),
    ]
      .map((text) => normalizeWhitespace(text || ''))
      .filter(Boolean);
    const resolutionCriteria = resolutionTextCandidates.find((text) => text.length > 0) || null;

    const rulesSelectorCandidates = [
      '.market-rules',
      '.event-rules',
      "[data-testid='market-rules']",
      "[data-testid='event-rules']",
      '.clarifications',
      '.rules',
    ];

    let rulesText = '';
    for (const selector of rulesSelectorCandidates) {
      const element = $(selector);
      if (element.length) {
        const paragraphs = element.find('p').length ? element.find('p') : element.contents();
        const collected = [];
        paragraphs.each((_, node) => {
          const text = normalizeWhitespace($(node).text() || '');
          if (text) collected.push(text);
        });
        rulesText = collected.join('\n');
        if (rulesText) break;
      }
    }

    if (!rulesText) {
      const fallbackSections = ['section', 'article'];
      for (const section of fallbackSections) {
        const candidate = $(section)
          .filter((_, el) => {
            const text = normalizeWhitespace($(el).text() || '');
            return /clarification|rule|criteria|adjudication/i.test(text) && text.length < 2000;
          })
          .first();
        if (candidate.length) {
          rulesText = normalizeWhitespace(candidate.text());
          break;
        }
      }
    }

    const payload = {
      slug,
      sourceUrl: targetUrl,
      description: descriptionText || null,
      resolutionCriteria,
      rulesText: rulesText || null,
    };

    setCache(cacheKey, payload, CACHE_TTL_MS);

    return NextResponse.json(payload);
  } catch (error) {
    console.error('Market details fetch failed:', error);
    return NextResponse.json({ error: 'Failed to load market details' }, { status: 500 });
  }
}
