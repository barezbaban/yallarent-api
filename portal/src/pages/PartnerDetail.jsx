import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchCompany, fetchCompanyCars } from '../api';
import { ArrowLeft, MapPin, Phone, Car, Building2, Fuel, Users as UsersIcon, Cog } from 'lucide-react';

function formatPrice(n) {
  return Number(n).toLocaleString('en-US');
}

export default function PartnerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [cars, setCars] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([fetchCompany(id), fetchCompanyCars(id)])
      .then(([comp, carList]) => {
        setCompany(comp);
        setCars(carList);
      })
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) return (
    <div className="main-content">
      <p style={{ color: 'var(--red)' }}>{error}</p>
      <button className="back-btn" onClick={() => navigate('/partners')}>
        <ArrowLeft size={16} /> Back to Partners
      </button>
    </div>
  );

  if (!company) return (
    <div className="main-content">
      <p style={{ color: 'var(--text-muted)' }}>Loading partner...</p>
    </div>
  );

  const categoryCount = {};
  cars.forEach(c => {
    const cat = c.category || 'uncategorized';
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  });

  return (
    <div className="main-content">
      <button className="back-btn" onClick={() => navigate('/partners')}>
        <ArrowLeft size={16} /> Back to Partners
      </button>

      <div className="partner-detail-header">
        <div className="partner-detail-avatar">
          <Building2 size={28} />
        </div>
        <div className="partner-detail-info">
          <h1 className="page-title">{company.name}</h1>
          <div className="partner-detail-meta">
            <span><MapPin size={14} /> {company.city}</span>
            <span><Phone size={14} /> {company.phone}</span>
            <span className={`pill ${company.is_active ? 'green' : 'red'}`}>
              {company.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      <div className="partner-detail-stats">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Cars</span>
            <div className="stat-icon teal"><Car size={18} /></div>
          </div>
          <div className="stat-value">{cars.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Categories</span>
            <div className="stat-icon blue"><Cog size={18} /></div>
          </div>
          <div className="stat-value">{Object.keys(categoryCount).length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Available</span>
            <div className="stat-icon green"><Car size={18} /></div>
          </div>
          <div className="stat-value">{cars.filter(c => c.is_available).length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Avg Price/Day</span>
            <div className="stat-icon amber"><Fuel size={18} /></div>
          </div>
          <div className="stat-value">
            {cars.length > 0 ? formatPrice(Math.round(cars.reduce((s, c) => s + Number(c.price_per_day), 0) / cars.length)) : 0}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>IQD</div>
        </div>
      </div>

      {Object.keys(categoryCount).length > 0 && (
        <div className="partner-categories">
          {Object.entries(categoryCount).map(([cat, count]) => (
            <span key={cat} className="category-tag">
              {cat} ({count})
            </span>
          ))}
        </div>
      )}

      <div className="table-card" style={{ marginTop: 20 }}>
        <div className="table-card-header">
          <span className="table-card-title">Fleet ({cars.length} cars)</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>CAR</th>
              <th>YEAR</th>
              <th>CATEGORY</th>
              <th>TRANSMISSION</th>
              <th>SEATS</th>
              <th>PRICE/DAY</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {cars.length === 0 && (
              <tr><td colSpan={7} className="muted" style={{ textAlign: 'center' }}>No cars listed</td></tr>
            )}
            {cars.map((car) => (
              <tr key={car.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {car.image_url ? (
                      <img
                        src={car.image_url}
                        alt={`${car.make} ${car.model}`}
                        style={{ width: 48, height: 32, objectFit: 'cover', borderRadius: 4 }}
                      />
                    ) : (
                      <div style={{ width: 48, height: 32, background: 'var(--bg)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Car size={16} color="var(--text-muted)" />
                      </div>
                    )}
                    <span className="name">{car.make} {car.model}</span>
                  </div>
                </td>
                <td className="muted">{car.year}</td>
                <td><span className="category-tag">{car.category || '—'}</span></td>
                <td className="muted">{car.transmission || '—'}</td>
                <td className="muted">{car.passengers || '—'}</td>
                <td className="name">{formatPrice(car.price_per_day)} IQD</td>
                <td>
                  <span className={`pill ${car.is_available ? 'green' : 'red'}`}>
                    {car.is_available ? 'Available' : 'Unavailable'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
