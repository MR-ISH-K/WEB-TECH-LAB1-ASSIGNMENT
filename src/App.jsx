import { Link, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Materials from './pages/Materials';
import MaterialDetail from './pages/MaterialDetail';
import Suppliers from './pages/Suppliers';
import SupplierDetail from './pages/SupplierDetail';
import CustomerDashboard from './pages/CustomerDashboard';
import SupplierDashboard from './pages/SupplierDashboard';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/materials" element={<Materials />} />
          <Route path="/materials/:id" element={<MaterialDetail />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/suppliers/:id" element={<SupplierDetail />} />
          <Route path="/customer" element={<ProtectedRoute roles={['CUSTOMER']}><CustomerDashboard /></ProtectedRoute>} />
          <Route path="/supplier" element={<ProtectedRoute roles={['SUPPLIER']}><SupplierDashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="*" element={<div className="card"><h2>Page not found</h2><Link to="/">Go home</Link></div>} />
        </Routes>
      </main>
      <footer className="footer">BuildLink Rwanda · MVP for local development · Prices in RWF · Demonstration data is not real market data</footer>
    </>
  );
}
