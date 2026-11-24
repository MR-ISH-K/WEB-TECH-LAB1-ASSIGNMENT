import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errMsg } from '../api';
import { DISTRICTS } from '../constants';
import { Badge, Empty, ErrorBox, Spinner } from '../components/UI';

export default function Suppliers() {
  const [q, setQ] = useState('');
  const [district, setDistrict] = useState('');
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async (params) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/suppliers', { params });
      setList(data);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load({}); }, []);

  const submit = (e) => {
    e.preventDefault();
    const params = {};
    if (q.trim()) params.q = q.trim();
    if (district) params.district = district;
    load(params);
  };

  return (
    <>
      <h2>Verified suppliers</h2>
      <form className="filters card" onSubmit={submit}>
        <input placeholder="Search by business name" aria-label="Search suppliers" value={q} onChange={(e) => setQ(e.target.value)} />
        <select aria-label="District" value={district} onChange={(e) => setDistrict(e.target.value)}>
          <option value="">Any location</option>
          {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
        </select>
        <button className="btn btn-primary">Search</button>
      </form>
      <ErrorBox message={error} />
      {loading ? <Spinner /> : list.length === 0 ? <Empty title="No suppliers found">Try a different name or location.</Empty> : (
        <div className="grid cards">
          {list.map((s) => (
            <article className="card" key={s.id}>
              <h3>{s.businessName}</h3>
              <Badge status={s.verificationStatus} />
              <p className="muted">📍 {s.district}{s.address ? `, ${s.address}` : ''}</p>
              <p>{s.averageRating ? `⭐ ${s.averageRating} (${s.ratingCount})` : 'No ratings yet'}</p>
              <Link className="btn btn-outline" to={`/suppliers/${s.id}`}>View profile &amp; materials</Link>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
