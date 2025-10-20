import nodeFetch from 'node-fetch';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getFetch = () => (typeof fetch === 'function' ? fetch : nodeFetch);

export async function fetchWithBackoff(url, options = {}, maxRetries = 3, customFetch) {
  let attempt = 0;
  let lastError;
  const runtimeFetch = customFetch || getFetch();

  while (attempt < maxRetries) {
    try {
      const response = await runtimeFetch(url, options);

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : Math.pow(2, attempt) * 1000;
        await sleep(delay);
        attempt += 1;
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gamma API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return response;
    } catch (error) {
      lastError = error;
      const delay = Math.pow(2, attempt) * 1000;
      await sleep(delay);
      attempt += 1;
    }
  }

  throw lastError || new Error('Failed to fetch with backoff');
}

export async function fetchJsonWithBackoff(url, options = {}, maxRetries = 3, customFetch) {
  const response = await fetchWithBackoff(url, options, maxRetries, customFetch);
  return response.json();
}
