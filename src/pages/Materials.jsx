import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errMsg } from '../api';
import { DEMO_NOTICE, DISTRICTS } from '../constants';
import { rwf } from '../utils';
import { Empty, ErrorBox, Spinner } from '../components/UI';

const BLANK = { q: '', categoryId: '', minPrice: '', maxPrice: '', district: '', inStock: false };

export default function Materials() {
  const [filters, setFilters] = useState(BLANK);
  const [categories, setCategories] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const search = async (f) => {
    setLoading(true);
    setError('');
    const params = {};
    if (f.q.trim()) params.q = f.q.trim();
    if (f.categoryId) params.categoryId = f.categoryId;
    if (f.minPrice !== '') params.minPrice = f.minPrice;
    if (f.maxPrice !== '') params.maxPrice = f.maxPrice;
    if (f.district) params.district = f.district;
    if (f.inStock) params.inStock = true;
    try {
      const { data } = await api.get('/materials', { params });
      setMaterials(data);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data)).catch((e) => setError(errMsg(e)));
    search(BLANK);
  }, []);

  const set = (k) => (e) => setFilters({ ...filters, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const onSubmit = (e) => { e.preventDefault(); search(filters); };
  const reset = () => { setFilters(BLANK); search(BLANK); };

  return (
    <>
      <h2>Construction materials</h2>
      <p className="notice">{DEMO_NOTICE}</p>
      <form className="filters card" onSubmit={onSubmit}>
        <input placeholder="Search material, e.g. cement" aria-label="Search material" value={filters.q} onChange={set('q')} />
        <select aria-label="Category" value={filters.categoryId} onChange={set('categoryId')}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select aria-label="District" value={filters.district} onChange={set('district')}>
          <option value="">Any location</option>
          {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
        </select>
        <input type="number" min="0" placeholder="Min price (RWF)" aria-label="Minimum price" value={filters.minPrice} onChange={set('minPrice')} />
        <input type="number" min="0" placeholder="Max price (RWF)" aria-label="Maximum price" value={filters.maxPrice} onChange={set('maxPrice')} />
        <label className="check"><input type="checkbox" checked={filters.inStock} onChange={set('inStock')} /> In stock only</label>
        <button className="btn btn-primary">Search</button>
        <button type="button" className="btn btn-outline" onClick={reset}>Reset</button>
      </form>
      <ErrorBox message={error} />
      {loading ? <Spinner /> : materials.length === 0 ? (
        <Empty title="No materials match your filters">Try removing some filters or searching for a different material.</Empty>
      ) : (
        <div className="grid cards">
          {materials.map((m) => (
            <article className="card material" key={m.id}>
              <span className="tag">{m.categoryName}</span>
              <h3>{m.name}</h3>
              <p className="muted">{m.description}</p>
              {m.supplierCount > 0 ? (
                <p><strong>From {rwf(m.minPrice)}</strong> per {m.defaultUnit}<br />
                  <small>{m.supplierCount} supplier{m.supplierCount > 1 ? 's' : ''}{m.maxPrice !== m.minPrice ? ` · up to ${rwf(m.maxPrice)}` : ''}</small></p>
              ) : <p className="muted">No supplier listings yet</p>}
              <Link className="btn btn-outline" to={`/materials/${m.id}`}>Compare prices</Link>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
