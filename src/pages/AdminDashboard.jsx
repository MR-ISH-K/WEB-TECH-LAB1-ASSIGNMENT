import { useState } from 'react';
import { api, errMsg } from '../api';
import { useToast } from '../context/ToastContext';
import { useFetch } from '../components/useFetch';
import { Badge, Empty, ErrorBox, Spinner, Tabs } from '../components/UI';
import { fmtDate, rwf } from '../utils';

function Overview() {
  const { data, loading, error } = useFetch('/admin/stats');
  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} />;
  const items = [
    ['Users', data.users], ['Customers', data.customers], ['Suppliers', data.suppliers], ['Suppliers awaiting verification', data.pendingSuppliers],
    ['Listings', data.listings], ['Quotation requests', data.quotationRequests], ['Quotations', data.quotations], ['Orders', data.orders],
    ['Open reports', data.openReports], ['Delivered order value', rwf(data.deliveredValue)],
  ];
  return <div className="grid three">{items.map(([k, v]) => <div className="card stat" key={k}><span>{k}</span><strong>{v}</strong></div>)}</div>;
}

function Suppliers() {
  const [status, setStatus] = useState('PENDING');
  const { data, loading, error, reload } = useFetch('/admin/suppliers', status ? { status } : {});
  const { notify } = useToast();
  const [notes, setNotes] = useState({});
  const decide = async (id, approve) => {
    try { await api.post(`/admin/suppliers/${id}/verification`, { approve, note: notes[id] || null }); notify(approve ? 'Supplier verified' : 'Supplier rejected'); reload(); }
    catch (e) { notify(errMsg(e), 'error'); }
  };
  return (
    <>
      <div className="row">
        <label>Show <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="PENDING">Pending applications</option><option value="VERIFIED">Verified</option><option value="REJECTED">Rejected</option><option value="">All</option>
        </select></label>
      </div>
      <ErrorBox message={error} />
      {loading ? <Spinner /> : (data || []).length === 0 ? <Empty title="No suppliers in this view" /> : data.map((s) => (
        <div className="card" key={s.id}>
          <div className="row between"><strong>{s.businessName}</strong><Badge status={s.verificationStatus} /></div>
          <p className="muted">{s.district} · {s.contactEmail} · {s.phone || 'no phone'} · TIN: {s.taxId || 'not provided'}</p>
          <p>{s.description || ''}</p>
          <div className="row">
            <input className="grow" placeholder="Review note (optional)" value={notes[s.id] || ''} onChange={(e) => setNotes({ ...notes, [s.id]: e.target.value })} />
            <button className="btn btn-primary" onClick={() => decide(s.id, true)}>Approve</button>
            <button className="btn btn-outline" onClick={() => decide(s.id, false)}>Reject</button>
          </div>
        </div>
      ))}
    </>
  );
}

function Users() {
  const { data, loading, error, reload } = useFetch('/admin/users');
  const { notify } = useToast();
  if (loading) return <Spinner />;
  const toggle = async (u) => {
    try { await api.patch(`/admin/users/${u.id}/status`, { status: u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' }); notify('Account updated'); reload(); }
    catch (e) { notify(errMsg(e), 'error'); }
  };
  return (
    <>
      <ErrorBox message={error} />
      <div className="table-wrap"><table>
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th /></tr></thead>
        <tbody>{(data || []).map((u) => (
          <tr key={u.id}><td>{u.fullName}</td><td>{u.email}</td><td>{u.role}</td><td><Badge status={u.status} /></td><td>{fmtDate(u.createdAt)}</td>
            <td>{u.role !== 'ADMIN' && <button className="btn btn-outline btn-sm" onClick={() => toggle(u)}>{u.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}</button>}</td></tr>
        ))}</tbody>
      </table></div>
    </>
  );
}

function Catalogue() {
  const cats = useFetch('/categories');
  const mats = useFetch('/materials');
  const { notify } = useToast();
  const [cat, setCat] = useState({ name: '', description: '' });
  const [mat, setMat] = useState({ name: '', categoryId: '', defaultUnit: '', description: '' });
  if (cats.loading || mats.loading) return <Spinner />;
  const run = async (fn, ok) => { try { await fn(); notify(ok); cats.reload(); mats.reload(); } catch (e) { notify(errMsg(e), 'error'); } };

  return (
    <>
      <div className="card">
        <h3>Categories</h3>
        <ul className="plain">
          {(cats.data || []).map((c) => (
            <li key={c.id} className="row between">{c.name}
              <button className="btn btn-ghost btn-sm" onClick={() => run(() => api.delete(`/admin/categories/${c.id}`), 'Category deleted')}>Delete</button></li>
          ))}
        </ul>
        <div className="inline-form">
          <input placeholder="New category name" value={cat.name} onChange={(e) => setCat({ ...cat, name: e.target.value })} />
          <input placeholder="Description" value={cat.description} onChange={(e) => setCat({ ...cat, description: e.target.value })} />
          <button className="btn btn-primary" onClick={() => { if (!cat.name.trim()) return notify('Enter a category name', 'error'); run(() => api.post('/admin/categories', { name: cat.name.trim(), description: cat.description || null }).then(() => setCat({ name: '', description: '' })), 'Category added'); }}>Add category</button>
        </div>
      </div>
      <div className="card">
        <h3>Add a material type</h3>
        <div className="inline-form">
          <input placeholder="Material name" value={mat.name} onChange={(e) => setMat({ ...mat, name: e.target.value })} />
          <select aria-label="Category" value={mat.categoryId} onChange={(e) => setMat({ ...mat, categoryId: e.target.value })}>
            <option value="">Category…</option>{(cats.data || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input placeholder="Default unit" value={mat.defaultUnit} onChange={(e) => setMat({ ...mat, defaultUnit: e.target.value })} />
          <button className="btn btn-primary" onClick={() => { if (!mat.name.trim() || !mat.categoryId || !mat.defaultUnit.trim()) return notify('Name, category and unit are required', 'error'); run(() => api.post('/admin/materials', { name: mat.name.trim(), categoryId: Number(mat.categoryId), defaultUnit: mat.defaultUnit.trim(), description: mat.description || null }).then(() => setMat({ name: '', categoryId: '', defaultUnit: '', description: '' })), 'Material added'); }}>Add material</button>
        </div>
        <p className="muted">{(mats.data || []).length} material types in the catalogue.</p>
      </div>
    </>
  );
}

function Listings() {
  const { data, loading, error, reload } = useFetch('/admin/listings');
  const { notify } = useToast();
  if (loading) return <Spinner />;
  const remove = async (id) => {
    if (!window.confirm('Remove this listing permanently?')) return;
    try { await api.delete(`/admin/listings/${id}`); notify('Listing removed'); reload(); } catch (e) { notify(errMsg(e), 'error'); }
  };
  return (
    <>
      <ErrorBox message={error} />
      {(data || []).length === 0 ? <Empty title="No listings" /> : (
        <div className="table-wrap"><table>
          <thead><tr><th>Supplier</th><th>Material</th><th>Price</th><th>Active</th><th /></tr></thead>
          <tbody>{data.map((l) => (
            <tr key={l.id}><td>{l.supplierName}</td><td>{l.materialName}</td><td>{rwf(l.price)} / {l.unit}</td><td>{l.active ? 'Yes' : 'No'}</td>
              <td><button className="btn btn-outline btn-sm" onClick={() => remove(l.id)}>Remove</button></td></tr>
          ))}</tbody>
        </table></div>
      )}
    </>
  );
}

function Activity() {
  const reqs = useFetch('/admin/quotation-requests');
  const orders = useFetch('/admin/orders');
  if (reqs.loading || orders.loading) return <Spinner />;
  return (
    <>
      <h3>Quotation requests</h3>
      <ErrorBox message={reqs.error} />
      {(reqs.data || []).length === 0 ? <Empty title="No requests" /> : (
        <div className="table-wrap"><table><thead><tr><th>#</th><th>Customer</th><th>Supplier</th><th>Status</th><th>Created</th></tr></thead>
          <tbody>{reqs.data.map((r) => <tr key={r.id}><td>{r.id}</td><td>{r.customerName}</td><td>{r.supplierName}</td><td><Badge status={r.status} /></td><td>{fmtDate(r.createdAt)}</td></tr>)}</tbody></table></div>
      )}
      <h3>Orders</h3>
      <ErrorBox message={orders.error} />
      {(orders.data || []).length === 0 ? <Empty title="No orders" /> : (
        <div className="table-wrap"><table><thead><tr><th>#</th><th>Customer</th><th>Supplier</th><th>Total</th><th>Status</th><th>Created</th></tr></thead>
          <tbody>{orders.data.map((o) => <tr key={o.id}><td>{o.id}</td><td>{o.customerName}</td><td>{o.supplierName}</td><td>{rwf(o.totalAmount)}</td><td><Badge status={o.status} /></td><td>{fmtDate(o.createdAt)}</td></tr>)}</tbody></table></div>
      )}
    </>
  );
}

function Reports() {
  const { data, loading, error, reload } = useFetch('/admin/reports');
  const { notify } = useToast();
  const [notes, setNotes] = useState({});
  if (loading) return <Spinner />;
  const review = async (id, status) => {
    try { await api.patch(`/admin/reports/${id}`, { status, adminNote: notes[id] || null }); notify(`Report ${status.toLowerCase()}`); reload(); } catch (e) { notify(errMsg(e), 'error'); }
  };
  return (
    <>
      <ErrorBox message={error} />
      {(data || []).length === 0 ? <Empty title="No customer reports" /> : data.map((r) => (
        <div className="card" key={r.id}>
          <div className="row between"><strong>{r.reason}</strong><Badge status={r.status} /></div>
          <p className="muted">Against {r.supplierName} · by {r.reporterName} · {fmtDate(r.createdAt)}</p>
          <p>{r.details}</p>
          {r.adminNote && <p className="muted">Admin note: {r.adminNote}</p>}
          {r.status === 'OPEN' && (
            <div className="row">
              <input className="grow" placeholder="Admin note" value={notes[r.id] || ''} onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })} />
              <button className="btn btn-primary" onClick={() => review(r.id, 'RESOLVED')}>Resolve</button>
              <button className="btn btn-outline" onClick={() => review(r.id, 'DISMISSED')}>Dismiss</button>
            </div>
          )}
        </div>
      ))}
    </>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState('Overview');
  return (
    <>
      <h2>Administration</h2>
      <Tabs tabs={['Overview', 'Suppliers', 'Users', 'Catalogue', 'Listings', 'Requests & orders', 'Reports']} active={tab} onChange={setTab} />
      {tab === 'Overview' && <Overview />}
      {tab === 'Suppliers' && <Suppliers />}
      {tab === 'Users' && <Users />}
      {tab === 'Catalogue' && <Catalogue />}
      {tab === 'Listings' && <Listings />}
      {tab === 'Requests & orders' && <Activity />}
      {tab === 'Reports' && <Reports />}
    </>
  );
}
