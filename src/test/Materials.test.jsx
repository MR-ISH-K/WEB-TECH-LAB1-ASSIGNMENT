import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from './utils';
import Materials from '../pages/Materials';

vi.mock('../api', () => ({
  api: { get: vi.fn() },
  errMsg: (e) => e.message,
  TOKEN_KEY: 'cmn_token',
  USER_KEY: 'cmn_user',
}));
import { api } from '../api';

const materials = [
  { id: 1, name: 'Portland Cement 42.5N', categoryName: 'Cement & Binders', defaultUnit: 'bag', description: '50 kg bag', minPrice: 13800, maxPrice: 14300, supplierCount: 2 },
  { id: 2, name: 'Timber 2x4', categoryName: 'Timber', defaultUnit: 'piece', description: '4 m', minPrice: null, maxPrice: null, supplierCount: 0 },
];

describe('Materials page (API integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockImplementation((url) =>
      Promise.resolve({ data: url === '/categories' ? [{ id: 1, name: 'Cement & Binders' }] : materials }));
  });

  it('loads materials from the API and shows RWF prices and units', async () => {
    renderApp(<Materials />);
    expect(await screen.findByText('Portland Cement 42.5N')).toBeInTheDocument();
    expect(screen.getByText(/From RWF 13,800/)).toBeInTheDocument();
    expect(screen.getByText('No supplier listings yet')).toBeInTheDocument();
    expect(screen.getByText(/Demonstration data/)).toBeInTheDocument();
  });

  it('sends the chosen filters to the backend', async () => {
    renderApp(<Materials />);
    await screen.findByText('Portland Cement 42.5N');
    await userEvent.type(screen.getByLabelText('Search material'), 'cement');
    await userEvent.type(screen.getByLabelText('Maximum price'), '15000');
    await userEvent.selectOptions(screen.getByLabelText('District'), 'Huye');
    await userEvent.click(screen.getByLabelText(/In stock only/));
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));
    await waitFor(() => {
      const last = api.get.mock.calls.filter((c) => c[0] === '/materials').at(-1);
      expect(last[1].params).toEqual({ q: 'cement', maxPrice: '15000', district: 'Huye', inStock: true });
    });
  });

  it('shows an empty state when nothing matches', async () => {
    api.get.mockImplementation((url) => Promise.resolve({ data: url === '/categories' ? [] : [] }));
    renderApp(<Materials />);
    expect(await screen.findByText('No materials match your filters')).toBeInTheDocument();
  });

  it('shows an error message when the API fails', async () => {
    api.get.mockRejectedValue(new Error('Cannot reach the server'));
    renderApp(<Materials />);
    expect((await screen.findAllByRole('alert'))[0]).toHaveTextContent('Cannot reach the server');
  });
});
