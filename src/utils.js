export function rwf(value) {
  if (value === null || value === undefined || value === '') return '—';
  return `RWF ${Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}
export function fmtDate(value) {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
export function fmtQty(value) {
  return Number(value).toLocaleString('en-US', { maximumFractionDigits: 3 });
}
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
