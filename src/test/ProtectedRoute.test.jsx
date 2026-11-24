import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { renderApp } from './utils';
import ProtectedRoute from '../components/ProtectedRoute';

vi.mock('../api', () => ({ api: { get: vi.fn(), post: vi.fn() }, errMsg: (e) => e.message, TOKEN_KEY: 'cmn_token', USER_KEY: 'cmn_user' }));

const routes = (
  <Routes>
    <Route path="/" element={<div>Home page</div>} />
    <Route path="/login" element={<div>Login page</div>} />
    <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']}><div>Secret admin</div></ProtectedRoute>} />
  </Routes>
);

function signIn(role) {
  localStorage.setItem('cmn_token', 'x');
  localStorage.setItem('cmn_user', JSON.stringify({ id: 1, fullName: 'T', role }));
}

describe('ProtectedRoute', () => {
  it('redirects anonymous visitors to login', () => {
    renderApp(routes, { route: '/admin' });
    expect(screen.getByText('Login page')).toBeInTheDocument();
  });
  it('blocks a customer from the admin area', () => {
    signIn('CUSTOMER');
    renderApp(routes, { route: '/admin' });
    expect(screen.getByText('Home page')).toBeInTheDocument();
    expect(screen.queryByText('Secret admin')).toBeNull();
  });
  it('lets an administrator in', () => {
    signIn('ADMIN');
    renderApp(routes, { route: '/admin' });
    expect(screen.getByText('Secret admin')).toBeInTheDocument();
  });
});
