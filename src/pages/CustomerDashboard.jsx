import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useFetch } from '../components/useFetch';
import { Empty, ErrorBox, Spinner, Tabs } from '../components/UI';
import { OrderCard, QuotationCard, RequestCard } from '../components/Lists';
import ProfileForm from '../components/ProfileForm';
import { fmtDate } from '../utils';

function Requests() {
  const { data, loading, error, reload } = useFetch('/quotation-requests');
  const { notify } = useToast();
  if (loading) return <Spinner />;
  const cancel = async (id) => {
    try { await api.post(`/quotation-requests/${id}/cancel`); notify('Request cancelled'); reload(); } catch (e) { notify(errMsg(e), 'error'); }
  };
  return (
    <>
      <ErrorBox message={error} />
      {(data || []).length === 0 ? <Empty title="No quotation requests yet"><Link to="/materials">Search materials</Link> and request a quotation from a supplier.</Empty> :
        data.map((r) => (
          <RequestCard key={r.id} r={r}>
            {r.status === 'PENDING' && <button className="btn btn-outline" onClick={() => cancel(r.id)}>Cancel request</button>}
          </RequestCard>
        ))}
    </>
  );
}

function Quotations() {
  const { data, loading, error, reload } = useFetch('/quotations');
  const { notify } = useToast();
  const [ordering, setOrdering] = useState(null);
  const [address, setAddress] = useState('');
  if (loading) return <Spinner />;

  const act = async (id, action) => {
    try { await api.post(`/quotations/${id}/${action}`); notify(`Quotation ${action}ed`); reload(); } catch (e) { notify(errMsg(e), 'error'); }
  };
  const placeOrder = async (quotationId) => {
    if (!address.trim()) { notify('Enter a delivery address', 'error'); return; }
    try {
      await api.post('/orders', { quotationId, deliveryAddress: address.trim() });
      notify('Order placed');
      setOrdering(null); setAddress(''); reload();
    } catch (e) { notify(errMsg(e), 'error'); }
  };

  return (
    <>
      <ErrorBox message={error} />
      {(data || []).length === 0 ? <Empty title="No quotations received yet">Suppliers will respond to your requests here.</Empty> :
        data.map((q) => (
          <QuotationCard key={q.id} q={q}>
            {q.status === 'SENT' && (
              <div className="row">
                <button className="btn btn-primary" onClick={() => act(q.id, 'accept')}>Accept</button>
                <button className="btn btn-outline" onClick={() => act(q.id, 'reject')}>Reject</button>
              </div>
            )}
            {q.status === 'ACCEPTED' && !q.orderId && (ordering === q.id ? (
              <div className="inline-form">
                <input placeholder="Delivery address" value={address} onChange={(e) => setAddress(e.target.value)} />
                <button className="btn btn-primary" onClick={() => placeOrder(q.id)}>Confirm order</button>
                <button className="btn btn-ghost" onClick={() => setOrdering(null)}>Cancel</button>
              </div>
            ) : <button className="btn btn-primary" onClick={() => setOrdering(q.id)}>Create order</button>)}
            {q.orderId && <p className="muted">Order #{q.orderId} created from this quotation.</p>}
          </QuotationCard>
        ))}
    </>
  );
}

function Orders() {
  const { data, loading, error, reload } = useFetch('/orders');
  const { notify } = useToast();
  const [rating, setRating] = useState(null);
  const [form, setForm] = useState({ score: 5, comment: '' });
  if (loading) return <Spinner />;

  const cancel = async (id) => {
    try { await api.post(`/orders/${id}/cancel`); notify('Order cancelled'); reload(); } catch (e) { notify(errMsg(e), 'error'); }
  };
  const rate = async (orderId) => {
    try {
      await api.post('/ratings', { orderId, score: Number(form.score), comment: form.comment.trim() || null });
      notify('Thank you for your rating');
      setRating(null); reload();
    } catch (e) { notify(errMsg(e), 'error'); }
  };

  return (
    <>
      <ErrorBox message={error} />
      {(data || []).length === 0 ? <Empty title="No orders yet">Accept a quotation to create your first order.</Empty> :
        data.map((o) => (
          <OrderCard key={o.id} o={o}>
            {o.status === 'PENDING' && <button className="btn btn-outline" onClick={() => cancel(o.id)}>Cancel order</button>}
            {o.status === 'DELIVERED' && !o.rated && (rating === o.id ? (
              <div className="inline-form">
                <select value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })} aria-label="Score">
                  {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ⭐</option>)}
                </select>
                <input placeholder="Comment (optional)" value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} />
                <button className="btn btn-primary" onClick={() => rate(o.id)}>Submit rating</button>
              </div>
            ) : <button className="btn btn-primary" onClick={() => setRating(o.id)}>Rate supplier</button>)}
            {o.rated && <p className="muted">You rated this order.</p>}
          </OrderCard>
        ))}
    </>
  );
}

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('Quotation requests');
  return (
    <>
      <h2>Welcome, {user.fullName}</h2>
      <Tabs tabs={['Quotation requests', 'Quotations', 'Orders', 'Profile']} active={tab} onChange={setTab} />
      {tab === 'Quotation requests' && <Requests />}
      {tab === 'Quotations' && <Quotations />}
      {tab === 'Orders' && <Orders />}
      {tab === 'Profile' && <ProfileForm user={user} />}
      <p className="muted">Member since {fmtDate(user.createdAt)}</p>
    </>
  );
}
