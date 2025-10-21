import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SWRConfig } from 'swr';
import OrderModal from '../app/markets/components/OrderModal';

describe('OrderModal market rules integration', () => {
  const baseMarket = {
    id: 'test-market',
    tokenId: 'test-token',
    question: 'Test Market Question?',
    description: 'Test market description',
    yesOdds: 0.55,
    noOdds: 0.45,
    volume: 10000,
    endDate: '2099-01-01T00:00:00Z',
    createdAt: '2098-01-01T00:00:00Z',
    slug: 'test-market',
    url: 'https://polymarket.com/event/test-market',
  };

  const renderWithProviders = (ui) =>
    render(
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
        {ui}
      </SWRConfig>
    );

  beforeEach(() => {
    jest.clearAllMocks();
    window.innerWidth = 1024;
  });

  test('fetches and displays market rules when toggled', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          description: 'API description',
          resolutionCriteria: 'Results will be decided by API data.',
          rulesText: 'First rule line\nSecond rule line',
          sourceUrl: 'https://polymarket.com/event/test-market',
        }),
      })
    );

    renderWithProviders(
      <OrderModal market={baseMarket} isOpen={true} onClose={jest.fn()} />
    );

    fireEvent.click(
      screen.getByRole('button', { name: /view market rules/i })
    );

    expect(screen.getByText(/loading market rules/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('First rule line')).toBeInTheDocument();
      expect(screen.getByText('Second rule line')).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/market-details/test-market');
    expect(
      screen.getByRole('link', { name: /view on polymarket/i })
    ).toHaveAttribute('href', 'https://polymarket.com/event/test-market');
  });

  test('shows error message when rules fetch fails', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('Network failure')));

    renderWithProviders(
      <OrderModal market={baseMarket} isOpen={true} onClose={jest.fn()} />
    );

    fireEvent.click(
      screen.getByRole('button', { name: /view market rules/i })
    );

    await waitFor(() => {
      expect(
        screen.getByText(/unable to load market rules/i)
      ).toBeInTheDocument();
    });
  });
});
