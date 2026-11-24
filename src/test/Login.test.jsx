import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { renderApp } from './utils';
import Login from '../pages/Login';

vi.mock('../api', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
  errMsg: (e) => e.response?.data?.message || e.message,
  TOKEN_KEY: 'cmn_token',
  USER_KEY: 'cmn_user',
}));
import { api } from '../api';

const page = (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/customer" element={<div>Customer dashboard</div>} />
    <Route path="/admin" element={<div>Admin dashboard</div>} />
  </Routes>
);

describe('Login page', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows validation messages and does not call the API for empty input', async () => {
    renderApp(page, { route: '/login' });
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));
    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('rejects an invalid email format', async () => {
    renderApp(page, { route: '/login' });
    await userEvent.type(screen.getByLabelText('Email'), 'nope');
    await userEvent.type(screen.getByLabelText('Password'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));
    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
  });

  it('logs in, stores the session and redirects by role', async () => {
    api.post.mockResolvedValue({ data: { token: 'tok', user: { id: 1, fullName: 'Ann Admin', role: 'ADMIN', email: 'a@b.rw' } } });
    renderApp(page, { route: '/login' });
    await userEvent.type(screen.getByLabelText('Email'), 'a@b.rw');
    await userEvent.type(screen.getByLabelText('Password'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));
    expect(await screen.findByText('Admin dashboard')).toBeInTheDocument();
    expect(api.post).toHaveBeenCalledWith('/auth/login', { email: 'a@b.rw', password: 'secret123' });
    expect(localStorage.getItem('cmn_token')).toBe('tok');
  });

  it('shows the server error message on failed login', async () => {
    api.post.mockRejectedValue({ response: { data: { message: 'Invalid email or password' } } });
    renderApp(page, { route: '/login' });
    await userEvent.type(screen.getByLabelText('Email'), 'a@b.rw');
    await userEvent.type(screen.getByLabelText('Password'), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Invalid email or password'));
    expect(localStorage.getItem('cmn_token')).toBeNull();
  });
});
