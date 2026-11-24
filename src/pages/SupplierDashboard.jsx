import { useEffect, useState } from 'react';
import { api, errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useFetch } from '../components/useFetch';
import { Badge, Empty, ErrorBox, Field, Spinner, Tabs } from '../components/UI';
import { OrderCard, QuotationCard, RequestCard } from '../components/Lists';
import ProfileForm from '../components/ProfileForm';
import { DISTRICTS } from '../constants';
import { fmtQty, rwf } from '../utils';

function BusinessProfile() {
  const { data, loading, error, reload } = useFetch('/suppliers/me');
  const { notify } = useToast();
  const [form, setForm] = useState(null);
  const [formError, setFormError] = useState('');
  useEffect(() => { if (data) setForm({ businessName: data.businessName, description: data.description || '', district: data.district, address: data.address || '', phone: data.phone || '', taxId: data.taxId || '' }); }, [data]);
  if (loading || !form) return error ? <ErrorBox message={error} /> : <Spinner />;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    if (!form.businessName.trim() || !form.district) { setFormError('Business name and district are required'); return; }
    try {
      await api.put('/suppliers/me', { ...form, description: form.description || null, address: form.address || null, phone: form.phone || null, taxId: form.taxId || null });
      setFormError('');
      notify('Business profile saved');
      reload();
    } catch (err) { setFormError(errMsg(err)); }
  };

  return (
    <form className="card narrow-left" onSubmit={save}>
      <h3>Business profile &amp; verification</h3>
      <p>Status: <Badge status={data.verificationStatus} /> {data.verificationNote && <span className="muted">— {data.verificationNote}</span>}</p>
      {data.verificationStatus === 'PENDING' && <p className="notice">Your business is waiting for administrator verification. Complete your details (including TIN) to help the review. You will appear in public search once verified.</p>}
      {data.verificationStatus === 'REJECTED' && <p className="notice">Update your details and save to resubmit for verification.</p>}
      <ErrorBox message={formError} />
      <Field label="Business name"><input value={form.businessName} onChange={set('businessName')} /></Field>
      <Field label="Description"><textarea value={form.description} onChange={set('description')} /></Field>
      <Field label="District">
        <select value={form.district} onChange={set('district')}>{DISTRICTS.map((d) => <option key={d}>{d}</option>)}</select>
      </Field>
      <Field label="Address"><input value={form.address} onChange={set('address')} /></Field>
      <Field label="Business phone"><input value={form.phone} onChange={set('phone')} /></Field>
      <Field label="Tax ID (TIN)"><input value={form.taxId} onChange={set('taxId')} /></Field>
      <button className="btn btn-primary">Save &amp; submit for verification</button>
    </form>
  );
}

function Listings() {
  const mine = useFetch('/supplier-listings/mine');
  const materials = useFetch('/materials');
  const { notify } = useToast();
  const [add, setAdd] = useState({ materialId: '', price: '', unit: '', stockQuantity: '' });
  const [edit, setEdit] = useState(null);
  const [error, setError] = useState('');
  if (mine.loading || materials.loading) return <Spinner />;
  const taken = new Set((mine.data || []).map((l) => l.materialId));
  const available = (materials.data || []).filter((m) => !taken.has(m.id));

  const pick = (e) => {
    const m = available.find((x) => String(x.id) === e.target.value);
    setAdd({ ...add, materialId: e.target.value, unit: m ? m.defaultUnit : '' });
  };
  const create = async (e) => {
    e.preventDefault();
    if (!add.materialId || !(Number(add.price) > 0) || !add.unit.trim() || add.stockQuantity === '' || Number(add.stockQuantity) < 0) {
      setError('Choose a material and enter a positive price, a unit and the available stock'); return;
    }
    try {
      await api.post('/supplier-listings', { materialId: Number(add.materialId), price: Number(add.price), unit: add.unit.trim(), stockQuantity: Number(add.stockQuantity) });
      notify('Listing added');
      setAdd({ materialId: '', price: '', unit: '', stockQuantity: '' }); setError(''); mine.reload();
    } catch (err) { setError(errMsg(err)); }
  };
  const saveEdit = async () => {
    try {
      await api.put(`/supplier-listings/${edit.id}`, { price: Number(edit.price), unit: edit.unit, stockQuantity: Number(edit.stockQuantity), active: edit.active });
      notify('Listing updated'); setEdit(null); mine.reload();
    } catch (err) { notify(errMsg(err), 'error'); }
  };
  const deactivate = async (id) => {
    try { await api.post(`/supplier-listings/${id}/deactivate`); notify('Listing deactivated'); mine.reload(); } catch (err) { notify(errMsg(err), 'error'); }
  };

  return (
    <>
      <form className="card" onSubmit={create}>
        <h3>Add a material listing</h3>
        <ErrorBox message={error} />
        <div className="filters">
          <select aria-label="Material" value={add.materialId} onChange={pick}>
            <option value="">Choose material…</option>
            {available.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <input type="number" min="0" step="any" placeholder="Price (RWF)" aria-label="Price" value={add.price} onChange={(e) => setAdd({ ...add, price: e.target.value })} />
          <input placeholder="Unit (bag, tonne…)" aria-label="Unit" value={add.unit} onChange={(e) => setAdd({ ...add, unit: e.target.value })} />
          <input type="number" min="0" step="any" placeholder="Stock available" aria-label="Stock" value={add.stockQuantity} onChange={(e) => setAdd({ ...add, stockQuantity: e.target.value })} />
          <button className="btn btn-primary">Add listing</button>
        </div>
      </form>
      <ErrorBox message={mine.error} />
      {(mine.data || []).length === 0 ? <Empty title="No listings yet">Add your first material above.</Empty> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Material</th><th>Price</th><th>Unit</th><th>Stock</th><th>Status</th><th /></tr></thead>
            <tbody>
              {mine.data.map((l) => edit?.id === l.id ? (
                <tr key={l.id}>
                  <td>{l.materialName}</td>
                  <td><input type="number" className="qty" value={edit.price} onChange={(e) => setEdit({ ...edit, price: e.target.value })} aria-label="Edit price" /></td>
                  <td><input className="qty" value={edit.unit} onChange={(e) => setEdit({ ...edit, unit: e.target.value })} aria-label="Edit unit" /></td>
                  <td><input type="number" className="qty" value={edit.stockQuantity} onChange={(e) => setEdit({ ...edit, stockQuantity: e.target.value })} aria-label="Edit stock" /></td>
                  <td><label className="check"><input type="checkbox" checked={edit.active} onChange={(e) => setEdit({ ...edit, active: e.target.checked })} /> Active</label></td>
                  <td><button className="btn btn-primary btn-sm" onClick={saveEdit}>Save</button> <button className="btn btn-ghost btn-sm" onClick={() => setEdit(null)}>Cancel</button></td>
                </tr>
              ) : (
                <tr key={l.id}>
                  <td>{l.materialName}</td><td>{rwf(l.price)}</td><td>per {l.unit}</td><td>{fmtQty(l.stockQuantity)}</td>
                  <td>{l.active ? <Badge status="ACTIVE" /> : <Badge status="CLOSED" />}</td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => setEdit({ id: l.id, price: l.price, unit: l.unit, stockQuantity: l.stockQuantity, active: l.active })}>Edit</button>{' '}
                    {l.active && <button className="btn btn-ghost btn-sm" onClick={() => deactivate(l.id)}>Deactivate</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function QuotationForm({ request, onDone }) {
  const { notify } = useToast();
  const [prices, setPrices] = useState({});
  const [note, setNote] = useState('');
  const [validUntil, setValidUntil] = useState(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  const [error, setError] = useState('');

  const total = request.items.reduce((sum, i) => sum + (Number(prices[i.materialId]) || 0) * Number(i.quantity), 0);
  const send = async () => {
    if (request.items.some((i) => !(Number(prices[i.materialId]) > 0))) { setError('Enter a unit price for every material'); return; }
    try {
      await api.post(`/quotation-requests/${request.id}/quotation`, {
        note: note.trim() || null, validUntil,
        items: request.items.map((i) => ({ materialId: i.materialId, unitPrice: Number(prices[i.materialId]) })),
      });
      notify('Quotation sent'); onDone();
    } catch (err) { setError(errMsg(err)); }
  };

  return (
    <div className="quote-form">
      <ErrorBox message={error} />
      {request.items.map((i) => (
        <div className="row" key={i.materialId}>
          <span className="grow">{i.materialName} × {fmtQty(i.quantity)} {i.unit}</span>
          <input type="number" min="0" step="any" className="qty" placeholder="Unit price" aria-label={`Unit price for ${i.materialName}`}
            value={prices[i.materialId] ?? ''} onChange={(e) => setPrices({ ...prices, [i.materialId]: e.target.value })} />
        </div>
      ))}
      <div className="row">
        <label>Valid until <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} /></label>
        <input className="grow" placeholder="Note to customer (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <p className="total">Quotation total: {rwf(total)}</p>
      <button className="btn btn-primary" onClick={send}>Send quotation</button>
    </div>
  );
}

function Requests() {
  const { data, loading, error, reload } = useFetch('/quotation-requests');
  const [open, setOpen] = useState(null);
  if (loading) return <Spinner />;
  return (
    <>
      <ErrorBox message={error} />
      {(data || []).length === 0 ? <Empty title="No incoming requests">Customers will send quotation requests here once you are verified and have listings.</Empty> :
        data.map((r) => (
          <RequestCard key={r.id} r={r} who="supplier">
            {r.status === 'PENDING' && (open === r.id ? <QuotationForm request={r} onDone={() => { setOpen(null); reload(); }} /> :
              <button className="btn btn-primary" onClick={() => setOpen(r.id)}>Prepare quotation</button>)}
          </RequestCard>
        ))}
    </>
  );
}

function Quotations() {
  const { data, loading, error } = useFetch('/quotations');
  if (loading) return <Spinner />;
  return (
    <>
      <ErrorBox message={error} />
      {(data || []).length === 0 ? <Empty title="No quotations sent yet" /> : data.map((q) => <QuotationCard key={q.id} q={q} who="supplier" />)}
    </>
  );
}

const NEXT = { ACCEPTED: 'PROCESSING', PROCESSING: 'DISPATCHED', DISPATCHED: 'DELIVERED' };

function Orders() {
  const { data, loading, error, reload } = useFetch('/orders');
  const { notify } = useToast();
  if (loading) return <Spinner />;
  const setStatus = async (id, status) => {
    try { await api.patch(`/orders/${id}/status`, { status }); notify(`Order marked ${status}`); reload(); } catch (e) { notify(errMsg(e), 'error'); }
  };
  const orders = data || [];
  const delivered = orders.filter((o) => o.status === 'DELIVERED');
  const sales = delivered.reduce((s, o) => s + Number(o.totalAmount), 0);
  return (
    <>
      <div className="grid three">
        <div className="card stat"><span>Total orders</span><strong>{orders.length}</strong></div>
        <div className="card stat"><span>Delivered orders</span><strong>{delivered.length}</strong></div>
        <div className="card stat"><span>Sales (delivered)</span><strong>{rwf(sales)}</strong></div>
      </div>
      <ErrorBox message={error} />
      {orders.length === 0 ? <Empty title="No orders yet" /> : orders.map((o) => (
        <OrderCard key={o.id} o={o} who="supplier">
          {o.status === 'PENDING' && (
            <div className="row">
              <button className="btn btn-primary" onClick={() => setStatus(o.id, 'ACCEPTED')}>Accept order</button>
              <button className="btn btn-outline" onClick={() => setStatus(o.id, 'REJECTED')}>Reject order</button>
            </div>
          )}
          {NEXT[o.status] && <button className="btn btn-primary" onClick={() => setStatus(o.id, NEXT[o.status])}>Mark as {NEXT[o.status]}</button>}
        </OrderCard>
      ))}
    </>
  );
}

export default function SupplierDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('Business profile');
  return (
    <>
      <h2>Supplier dashboard</h2>
      <Tabs tabs={['Business profile', 'Listings', 'Quotation requests', 'Quotations', 'Orders & sales', 'Account']} active={tab} onChange={setTab} />
      {tab === 'Business profile' && <BusinessProfile />}
      {tab === 'Listings' && <Listings />}
      {tab === 'Quotation requests' && <Requests />}
      {tab === 'Quotations' && <Quotations />}
      {tab === 'Orders & sales' && <Orders />}
      {tab === 'Account' && <ProfileForm user={user} />}
    </>
  );
}
