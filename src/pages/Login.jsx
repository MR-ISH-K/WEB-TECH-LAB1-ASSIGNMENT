import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { errMsg } from '../api';
import { EMAIL_RE } from '../utils';
import { ErrorBox, Field } from '../components/UI';

const HOME = { CUSTOMER: '/customer', SUPPLIER: '/supplier', ADMIN: '/admin' };

export default function Login() {
  const { login } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!EMAIL_RE.test(form.email.trim())) e.email = 'Enter a valid email address';
    if (!form.password) e.password = 'Password is required';
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    setServerError('');
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      const user = await login(form.email.trim(), form.password);
      notify(`Welcome back, ${user.fullName}`);
      navigate(location.state?.from || HOME[user.role] || '/', { replace: true });
    } catch (err) {
      setServerError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card narrow">
      <h2>Log in</h2>
      <ErrorBox message={serverError} />
      <form onSubmit={submit} noValidate>
        <Field label="Email" error={errors.email}>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" />
        </Field>
        <Field label="Password" error={errors.password}>
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="current-password" />
        </Field>
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
      </form>
      <p className="muted">No account? <Link to="/register">Register</Link></p>
    </div>
  );
}
