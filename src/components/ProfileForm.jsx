import { useState } from 'react';
import { api, errMsg } from '../api';
import { useToast } from '../context/ToastContext';
import { Field, ErrorBox } from './UI';

/** Edits the basic account profile (name, phone). */
export default function ProfileForm({ user, onSaved }) {
  const { notify } = useToast();
  const [form, setForm] = useState({ fullName: user.fullName, phone: user.phone || '' });
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim()) { setError('Full name is required'); return; }
    try {
      const { data } = await api.put('/users/me', { fullName: form.fullName.trim(), phone: form.phone.trim() || null });
      notify('Profile updated');
      setError('');
      onSaved?.(data);
    } catch (err) {
      setError(errMsg(err));
    }
  };

  return (
    <form className="card narrow-left" onSubmit={submit}>
      <h3>My profile</h3>
      <ErrorBox message={error} />
      <Field label="Email"><input value={user.email} disabled /></Field>
      <Field label="Full name"><input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></Field>
      <Field label="Phone"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
      <button className="btn btn-primary">Save profile</button>
    </form>
  );
}
