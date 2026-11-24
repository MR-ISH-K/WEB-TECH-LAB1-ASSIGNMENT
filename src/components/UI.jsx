export function Spinner({ label = 'Loading…' }) {
  return <div className="spinner" role="status"><span className="spin" />{label}</div>;
}
export function ErrorBox({ message }) {
  return message ? <div className="alert alert-error" role="alert">{message}</div> : null;
}
export function Empty({ title, children }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {children && <p>{children}</p>}
    </div>
  );
}
const COLORS = {
  VERIFIED: 'green', ACCEPTED: 'green', DELIVERED: 'green', RESOLVED: 'green', ACTIVE: 'green', SENT: 'blue', QUOTED: 'blue',
  PENDING: 'amber', PROCESSING: 'blue', DISPATCHED: 'blue', OPEN: 'amber',
  REJECTED: 'red', CANCELLED: 'red', SUSPENDED: 'red', EXPIRED: 'red', DISMISSED: 'gray', CLOSED: 'gray',
};
export function Badge({ status }) {
  return <span className={`badge badge-${COLORS[status] || 'gray'}`}>{status}</span>;
}
export function Field({ label, error, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {error && <small className="field-error" role="alert">{error}</small>}
    </label>
  );
}
export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t} role="tab" aria-selected={active === t} className={active === t ? 'tab active' : 'tab'} onClick={() => onChange(t)}>
          {t}
        </button>
      ))}
    </div>
  );
}
