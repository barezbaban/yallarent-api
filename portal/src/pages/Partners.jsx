import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCompanies } from '../api';
import { Building2, MapPin, Phone, Car, ArrowRight } from 'lucide-react';

const COLORS = ['blue', 'purple', 'green', 'amber', 'red'];

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function Partners() {
  const [companies, setCompanies] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchCompanies()
      .then(setCompanies)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="main-content"><p style={{ color: 'var(--red)' }}>{error}</p></div>;

  return (
    <div className="main-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Partners</h1>
          <p className="page-subtitle">{companies.length} registered rental companies</p>
        </div>
      </div>

      <div className="partner-grid">
        {companies.map((c, i) => (
          <div
            key={c.id}
            className="partner-card"
            onClick={() => navigate(`/partners/${c.id}`)}
          >
            <div className="partner-card-top">
              <div className={`partner-avatar ${COLORS[i % COLORS.length]}`}>
                {getInitials(c.name)}
              </div>
              <div className="partner-card-info">
                <div className="partner-card-name">{c.name}</div>
                <div className="partner-card-meta">
                  <MapPin size={12} /> {c.city}
                </div>
              </div>
            </div>
            <div className="partner-card-stats">
              <div className="partner-stat">
                <Car size={14} />
                <span>{c.car_count} cars</span>
              </div>
              <div className="partner-stat">
                <Phone size={14} />
                <span>{c.phone}</span>
              </div>
            </div>
            <div className="partner-card-footer">
              <span className={`pill ${c.is_active ? 'green' : 'red'}`}>
                {c.is_active ? 'Active' : 'Inactive'}
              </span>
              <span className="partner-view">
                View Details <ArrowRight size={14} />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
