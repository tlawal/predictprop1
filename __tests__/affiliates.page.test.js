import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import AffiliatesLandingPage from '../app/affiliates/page';

jest.mock('@clerk/nextjs', () => ({
  useUser: () => ({ user: null, isSignedIn: false }),
  SignInButton: ({ children }) => <>{children}</>
}));

const toast = Object.assign(jest.fn(), {
  success: jest.fn(),
  error: jest.fn()
});

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: toast,
  Toaster: () => <div data-testid="toast-root" />
}));

describe('AffiliatesLandingPage', () => {
  test('renders hero heading with offset padding and CTA link', () => {
    const { container } = render(<AffiliatesLandingPage />);

    const heroHeading = screen.getByRole('heading', { level: 1, name: /become a polyprop affiliate/i });
    expect(heroHeading).toBeInTheDocument();

    const ctaLink = screen.getByRole('link', { name: /apply today/i });
    expect(ctaLink).toHaveAttribute('href', '#apply');

    expect(container.firstChild).toHaveClass('relative', 'min-h-screen');
  });

  test('displays key sections and benefit cards', () => {
    render(<AffiliatesLandingPage />);

    expect(screen.getByRole('heading', { level: 2, name: /what you'll get/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /who it's for/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /why polyprop/i })).toBeInTheDocument();

    const benefitCards = screen.getAllByRole('heading', { level: 3, name: /earn up to 20% commission|apple-quality assets|24\/7 partner success/i });
    expect(benefitCards).toHaveLength(3);
  });

  test('renders FAQ content', () => {
    render(<AffiliatesLandingPage />);

    expect(screen.getByText(/how do commissions work/i)).toBeInTheDocument();
    expect(screen.getByText(/when do i get paid/i)).toBeInTheDocument();
  });
});
