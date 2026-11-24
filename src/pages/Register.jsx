import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { errMsg } from '../api';
import { DISTRICTS } from '../constants';
import { EMAIL_RE } from '../utils';
import { ErrorBox, Field } from '../components/UI';

export default function Register() {
  const { register } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', phone: '', role: 'CUSTOMER', businessName: '', district: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const isSupplier = form.role === 'SUPPLIER';

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!EMAIL_RE.test(form.email.trim())) e.email = 'Enter a valid email address';
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (isSupplier && !form.businessName.trim()) e.businessName = 'Business name is required';
    if (isSupplier && !form.district) e.district = 'Select your district';
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
      const payload = {
        fullName: form.fullName.trim(), email: form.email.trim(), password: form.password,
        phone: form.phone.trim() || null, role: form.role,
        ...(isSupplier ? { businessName: form.businessName.trim(), district: form.district } : {}),
      };
      const user = await register(payload);
      notify(isSupplier ? 'Account created. An administrator must verify your business before you appear publicly.' : 'Account created');
      navigate(user.role === 'SUPPLIER' ? '/supplier' : '/customer', { replace: true });
    } catch (err) {
      setServerError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card narrow">
      <h2>Create your account</h2>
      <ErrorBox message={serverError} />
      <form onSubmit={submit} noValidate>
        <Field label="I am a">
          <select value={form.role} onChange={set('role')}>
            <option value="CUSTOMER">Contractor / buyer</option>
            <option value="SUPPLIER">Material supplier</option>
          </select>
        </Field>
        <Field label="Full name" error={errors.fullName}><input value={form.fullName} onChange={set('fullName')} /></Field>
        <Field label="Email" error={errors.email}><input type="email" value={form.email} onChange={set('email')} /></Field>
        <Field label="Phone (optional)"><input value={form.phone} onChange={set('phone')} /></Field>
        <Field label="Password (min 8 characters)" error={errors.password}><input type="password" value={form.password} onChange={set('password')} /></Field>
        {isSupplier && (
          <>
            <Field label="Business name" error={errors.businessName}><input value={form.businessName} onChange={set('businessName')} /></Field>
            <Field label="District" error={errors.district}>
              <select value={form.district} onChange={set('district')}>
                <option value="">Select district…</option>
                {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </Field>
          </>
        )}
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Creating…' : 'Register'}</button>
      </form>
      <p className="muted">Already registered? <Link to="/login">Log in</Link></p>
    </div>
  );
}
