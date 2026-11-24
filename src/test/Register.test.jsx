import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { renderApp } from './utils';
import Register from '../pages/Register';

vi.mock('../api', () => ({
  api: { get: vi.fn(), post: vi.fn() },
  errMsg: (e) => e.message,
  TOKEN_KEY: 'cmn_token',
  USER_KEY: 'cmn_user',
}));
import { api } from '../api';

const page = (
  <Routes>
    <Route path="/register" element={<Register />} />
    <Route path="/customer" element={<div>Customer dashboard</div>} />
    <Route path="/supplier" element={<div>Supplier dashboard</div>} />
  </Routes>
);

describe('Register page', () => {
  beforeEach(() => vi.clearAllMocks());

  it('validates required fields and password length', async () => {
    renderApp(page, { route: '/register' });
    await userEvent.type(screen.getByLabelText('Password (min 8 characters)'), '123');
    await userEvent.click(screen.getByRole('button', { name: 'Register' }));
    expect(await screen.findByText('Full name is required')).toBeInTheDocument();
    expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('asks for business details when registering as a supplier and never sends ADMIN', async () => {
    api.post.mockResolvedValue({ data: { token: 't', user: { id: 2, fullName: 'Sam', role: 'SUPPLIER' } } });
    renderApp(page, { route: '/register' });
    const role = screen.getByLabelText('I am a');
    expect([...role.options].map((o) => o.value)).not.toContain('ADMIN');
    await userEvent.selectOptions(role, 'SUPPLIER');
    expect(screen.getByLabelText('Business name')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Full name'), 'Sam Supplier');
    await userEvent.type(screen.getByLabelText('Email'), 'sam@biz.rw');
    await userEvent.type(screen.getByLabelText('Password (min 8 characters)'), 'longpassword');
    await userEvent.click(screen.getByRole('button', { name: 'Register' }));
    expect(await screen.findByText('Business name is required')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/^Business name/), 'Sam Ltd');
    await userEvent.selectOptions(screen.getByLabelText(/^District/), 'Huye');
    await userEvent.click(screen.getByRole('button', { name: 'Register' }));
    expect(await screen.findByText('Supplier dashboard')).toBeInTheDocument();
    const payload = api.post.mock.calls[0][1];
    expect(payload).toMatchObject({ role: 'SUPPLIER', businessName: 'Sam Ltd', district: 'Huye' });
  });
});
