import { Link } from 'react-router-dom';
import { DEMO_NOTICE } from '../constants';

export default function Home() {
  return (
    <>
      <section className="hero">
        <h1>Compare construction material prices and suppliers across Rwanda</h1>
        <p>Stop calling suppliers one by one. Search materials, compare prices and stock, and request quotations from verified suppliers in one place.</p>
        <div className="hero-actions">
          <Link to="/materials" className="btn btn-primary btn-lg">Search materials</Link>
          <Link to="/register" className="btn btn-outline btn-lg">Create an account</Link>
        </div>
      </section>
      <section className="grid three">
        <div className="card"><h3>1. Search &amp; compare</h3><p>Find cement, sand, gravel, blocks, iron bars and roofing, then compare supplier prices in RWF.</p></div>
        <div className="card"><h3>2. Request quotations</h3><p>Pick a verified supplier, list the materials and quantities you need and get a formal quotation.</p></div>
        <div className="card"><h3>3. Order &amp; track</h3><p>Accept a quotation, place the order and follow its status until delivery.</p></div>
      </section>
      <section className="card">
        <h3>Are you a supplier?</h3>
        <p>Register your business, get verified by our administrators, publish your prices and receive quotation requests from contractors.</p>
        <Link to="/register" className="btn btn-primary">Register as supplier</Link>
      </section>
      <p className="notice">{DEMO_NOTICE}</p>
    </>
  );
}
