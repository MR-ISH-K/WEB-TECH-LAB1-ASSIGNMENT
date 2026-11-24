import { fmtDate, fmtQty, rwf } from '../utils';
import { Badge } from './UI';

export function LinesTable({ items, priced }) {
  return (
    <div className="table-wrap">
      <table className="compact">
        <thead><tr><th>Material</th><th>Qty</th>{priced && <th>Unit price</th>}{priced && <th>Line total</th>}</tr></thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.materialId}>
              <td>{i.materialName}</td>
              <td>{fmtQty(i.quantity)} {i.unit}</td>
              {priced && <td>{rwf(i.unitPrice)}</td>}
              {priced && <td>{rwf(i.lineTotal)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RequestCard({ r, who, children }) {
  return (
    <div className="card">
      <div className="row between">
        <strong>Request #{r.id} · {who === 'supplier' ? r.customerName : r.supplierName}</strong>
        <Badge status={r.status} />
      </div>
      <p className="muted">Sent {fmtDate(r.createdAt)}{r.note ? ` · “${r.note}”` : ''}</p>
      <LinesTable items={r.items} />
      {children}
    </div>
  );
}

export function QuotationCard({ q, who, children }) {
  return (
    <div className="card">
      <div className="row between">
        <strong>Quotation #{q.id} · {who === 'supplier' ? q.customerName : q.supplierName}</strong>
        <Badge status={q.status} />
      </div>
      <p className="muted">Valid until {fmtDate(q.validUntil)}{q.note ? ` · “${q.note}”` : ''}</p>
      <LinesTable items={q.items} priced />
      <p className="total">Total: {rwf(q.totalAmount)}</p>
      {children}
    </div>
  );
}

export function OrderCard({ o, who, children }) {
  return (
    <div className="card">
      <div className="row between">
        <strong>Order #{o.id} · {who === 'supplier' ? o.customerName : o.supplierName}</strong>
        <Badge status={o.status} />
      </div>
      <p className="muted">Placed {fmtDate(o.createdAt)} · Updated {fmtDate(o.updatedAt)} · Deliver to: {o.deliveryAddress}</p>
      <LinesTable items={o.items} priced />
      <p className="total">Total: {rwf(o.totalAmount)}</p>
      {children}
    </div>
  );
}
