import { useParams, Link } from 'react-router-dom';
import { useFetch } from '../components/useFetch';
import { DEMO_NOTICE } from '../constants';
import { fmtQty, rwf } from '../utils';
import { Badge, Empty, ErrorBox, Spinner } from '../components/UI';

export default function MaterialDetail() {
  const { id } = useParams();
  const material = useFetch(`/materials/${id}`);
  const listings = useFetch(`/materials/${id}/listings`);

  if (material.loading || listings.loading) return <Spinner />;
  if (material.error) return <ErrorBox message={material.error} />;
  const m = material.data;
  const rows = listings.data || [];
  const cheapest = rows.length ? rows[0].id : null;

  return (
    <>
      <p><Link to="/materials">← All materials</Link></p>
      <div className="card">
        <span className="tag">{m.categoryName}</span>
        <h2>{m.name}</h2>
        <p className="muted">{m.description}</p>
      </div>
      <p className="notice">{DEMO_NOTICE}</p>
      <h3>Price comparison</h3>
      <ErrorBox message={listings.error} />
      {rows.length === 0 ? (
        <Empty title="No suppliers list this material yet">Check back later or browse other materials.</Empty>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Supplier</th><th>Location</th><th>Price</th><th>Unit</th><th>Stock</th><th>Status</th><th /></tr></thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.id} className={l.id === cheapest ? 'best' : ''}>
                  <td><Link to={`/suppliers/${l.supplierId}`}>{l.supplierName}</Link> {l.supplierVerified && <Badge status="VERIFIED" />}</td>
                  <td>{l.district}</td>
                  <td><strong>{rwf(l.price)}</strong>{l.id === cheapest && <span className="tag green">Lowest</span>}</td>
                  <td>per {l.unit}</td>
                  <td>{fmtQty(l.stockQuantity)}</td>
                  <td>{l.available ? <span className="ok">In stock</span> : <span className="bad">Out of stock</span>}</td>
                  <td><Link className="btn btn-primary btn-sm" to={`/suppliers/${l.supplierId}?material=${m.id}`}>Request quote</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
