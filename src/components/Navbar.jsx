import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

function Bell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);

  const load = async () => {
    try {
      const { data } = await api.get('/notifications');
      setItems(data);
    } catch (e) {
      console.warn('Could not load notifications', e);
    }
  };
  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, []);

  const unread = items.filter((n) => !n.read).length;
  const markAll = async () => { await api.post('/notifications/read-all'); load(); };

  return (
    <div className="bell">
      <button className="btn btn-ghost" onClick={() => { setOpen(!open); if (!open) load(); }} aria-label="Notifications">
        🔔{unread > 0 && <span className="dot">{unread}</span>}
      </button>
      {open && (
        <div className="bell-panel">
          <div className="bell-head"><strong>Notifications</strong>
            {unread > 0 && <button className="link" onClick={markAll}>Mark all read</button>}
          </div>
          {items.length === 0 && <p className="muted pad">No notifications yet.</p>}
          {items.slice(0, 10).map((n) => (
            <div key={n.id} className={n.read ? 'note' : 'note unread'}>{n.message}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);
  const dash = user ? { CUSTOMER: '/customer', SUPPLIER: '/supplier', ADMIN: '/admin' }[user.role] : null;

  return (
    <header className="navbar">
      <Link to="/" className="brand">🏗️ <span>BuildLink Rwanda</span></Link>
      <button className="burger btn btn-ghost" onClick={() => setMenu(!menu)} aria-label="Toggle menu">☰</button>
      <nav className={menu ? 'nav open' : 'nav'} onClick={() => setMenu(false)}>
        <NavLink to="/materials">Materials</NavLink>
        <NavLink to="/suppliers">Suppliers</NavLink>
        {user && <NavLink to={dash}>Dashboard</NavLink>}
        {!user && <NavLink to="/login">Log in</NavLink>}
        {!user && <Link to="/register" className="btn btn-primary">Register</Link>}
        {user && <Bell />}
        {user && (
          <button className="btn btn-outline" onClick={() => { logout(); navigate('/'); }}>
            Log out ({user.fullName.split(' ')[0]})
          </button>
        )}
      </nav>
    </header>
  );
}
