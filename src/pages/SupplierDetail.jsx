import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api, errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useFetch } from '../components/useFetch';
import { fmtDate, rwf } from '../utils';
import { Badge, Empty, ErrorBox, Spinner } from '../components/UI';

export default function SupplierDetail() {
  const { id } = useParams();
  const [search] = useSearchParams();
  const { user } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const supplier = useFetch(`/suppliers/${id}`);
  const listings = useFetch(`/suppliers/${id}/listings`);
  const ratings = useFetch(`/suppliers/${id}/ratings`);
  const [qty, setQty] = useState({});
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState({ open: false, reason: '', details: '' });

  useEffect(() => {
    const preselect = search.get('material');
    if (preselect) setQty((q) => ({ ...q, [preselect]: q[preselect] || '1' }));
  }, [search]);

  if (supplier.loading || listings.loading) return <Spinner />;
  if (supplier.error) return <ErrorBox message={supplier.error} />;
  const s = supplier.data;
  const rows = listings.data || [];
  const isCustomer = user?.role === 'CUSTOMER';

  const submitRequest = async () => {
    setError('');
    const items = Object.entries(qty)
      .filter(([, v]) => Number(v) > 0)
      .map(([materialId, v]) => ({ materialId: Number(materialId), quantity: Number(v) }));
    if (items.length === 0) { setError('Enter a quantity greater than 0 for at least one material'); return; }
    setBusy(true);
    try {
      await api.post('/quotation-requests', { supplierId: s.id, note: note.trim() || null, items });
      notify('Quotation request sent');
      navigate('/customer');
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const submitReport = async (e) => {
    e.preventDefault();
    if (!report.reason.trim()) { notify('Please enter a reason', 'error'); return; }
    try {
      await api.post('/reports', { supplierId: s.id, reason: report.reason.trim(), details: report.details.trim() || null });
      notify('Report submitted to administrators');
      setReport({ open: false, reason: '', details: '' });
    } catch (err) {
      notify(errMsg(err), 'error');
    }
  };

  return (
    <>
      <p><Link to="/suppliers">← All suppliers</Link></p>
      <div className="card">
        <h2>{s.businessName} <Badge status={s.verificationStatus} /></h2>
        <p>{s.description || 'No description provided.'}</p>
        <p>📍 {s.district}{s.address ? `, ${s.address}` : ''}</p>
        <p>✉️ {s.contactEmail}{s.phone ? ` · 📞 ${s.phone}` : ''}</p>
        <p>{s.averageRating ? `⭐ ${s.averageRating} average from ${s.ratingCount} rating(s)` : 'No ratings yet'}</p>
        {isCustomer && <button className="btn btn-ghost" onClick={() => setReport({ ...report, open: !report.open })}>Report this supplier</button>}
        {report.open && (
          <form onSubmit={submitReport} className="inline-form">
            <input placeholder="Reason" value={report.reason} onChange={(e) => setReport({ ...report, reason: e.target.value })} />
            <input placeholder="Details (optional)" value={report.details} onChange={(e) => setReport({ ...report, details: e.target.value })} />
            <button className="btn btn-outline">Submit report</button>
          </form>
        )}
      </div>

      <h3>Materials offered</h3>
      <ErrorBox message={listings.error} />
      {rows.length === 0 ? <Empty title="No active listings" /> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Material</th><th>Price</th><th>Stock</th>{isCustomer && <th>Quantity needed</th>}</tr></thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.id}>
                  <td><Link to={`/materials/${l.materialId}`}>{l.materialName}</Link></td>
                  <td>{rwf(l.price)} per {l.unit}</td>
                  <td>{l.available ? l.stockQuantity : <span className="bad">Out of stock</span>}</td>
                  {isCustomer && (
                    <td><input type="number" min="0" step="any" className="qty" aria-label={`Quantity of ${l.materialName}`}
                      value={qty[l.materialId] ?? ''} onChange={(e) => setQty({ ...qty, [l.materialId]: e.target.value })} /></td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isCustomer ? (
        <div className="card">
          <h3>Request a quotation</h3>
          <ErrorBox message={error} />
          <textarea placeholder="Note to supplier (delivery location, timing…)" value={note} onChange={(e) => setNote(e.target.value)} />
          <button className="btn btn-primary" onClick={submitRequest} disabled={busy}>{busy ? 'Sending…' : 'Send quotation request'}</button>
        </div>
      ) : !user ? (
        <p className="notice"><Link to="/login" state={{ from: `/suppliers/${id}` }}>Log in</Link> as a customer to request a quotation.</p>
      ) : null}

      <h3>Customer ratings</h3>
      {(ratings.data || []).length === 0 ? <p className="muted">No ratings yet.</p> : (
        <div className="stack">
          {ratings.data.map((r) => (
            <div className="card" key={r.id}><strong>{'⭐'.repeat(r.score)}</strong> <span className="muted">{r.customerName} · {fmtDate(r.createdAt)}</span><p>{r.comment}</p></div>
          ))}
        </div>
      )}
    </>
  );
}
