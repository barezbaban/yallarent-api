import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchPartners, fetchExpiringDocuments, hasPermission } from '../api';
import {
  Building2, MapPin, Phone, Car, ArrowRight, Plus, Search,
  LayoutGrid, LayoutList, AlertTriangle, ChevronLeft, ChevronRight,
} from 'lucide-react';

const CITIES = ['erbil', 'baghdad', 'basra', 'sulaymaniyah', 'duhok', 'kirkuk', 'najaf', 'karbala'];
const STATUSES = ['pending', 'active', 'suspended', 'terminated'];
const STATUS_COLORS = { pending: 'yellow', active: 'green', suspended: 'amber', terminated: 'red' };
const COLORS = ['blue', 'purple', 'green', 'amber', 'red'];

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function formatPrice(n) {
  return Number(n || 0).toLocaleString('en-US');
}

function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

export default function Partners() {
  const [partners, setPartners] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sort, setSort] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [loading, setLoading] = useState(true);
  const [expiringCount, setExpiringCount] = useState(0);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchPartners({
        search: search || undefined,
        city: cityFilter || undefined,
        status: statusFilter || undefined,
        sort: sort || undefined,
        page,
        limit: 20,
      });
      setPartners(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [search, cityFilter, statusFilter, sort, page]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    fetchExpiringDocuments().then(docs => setExpiringCount(docs.length)).catch(() => {});
  }, []);

  // Reset to page 1 on filter change
  useEffect(() => { setPage(1); }, [search, cityFilter, statusFilter, sort]);

  return (
    <div className="main-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Partners</h1>
          <p className="page-subtitle">{total} registered rental companies</p>
        </div>
        {hasPermission('companies.add') && (
          <button className="btn btn-primary" onClick={() => navigate('/partners/new')}>
            <Plus size={16} /> Add Partner
          </button>
        )}
      </div>

      {expiringCount > 0 && (
        <div className="partner-alert-banner" onClick={() => navigate('/partners?tab=expiring')}>
          <AlertTriangle size={16} />
          <span>{expiringCount} partner document{expiringCount > 1 ? 's' : ''} expire within 30 days</span>
        </div>
      )}

      {/* Filters */}
      <div className="partner-filters">
        <div className="partner-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by name or contact..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select value={cityFilter} onChange={e => setCityFilter(e.target.value)}>
          <option value="">All Cities</option>
          {CITIES.map(c => <option key={c} value={c}>{cap(c)}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          {STATUSES.map(s => <option key={s} value={s}>{cap(s)}</option>)}
        </select>
        <select value={sort} onChange={e => setSort(e.target.value)}>
          <option value="">Newest First</option>
          <option value="alphabetical">Alphabetical</option>
          <option value="most_cars">Most Cars</option>
          <option value="most_revenue">Most Revenue</option>
        </select>
        <div className="partner-view-toggle">
          <button className={viewMode === 'table' ? 'active' : ''} onClick={() => setViewMode('table')} title="Table view">
            <LayoutList size={16} />
          </button>
          <button className={viewMode === 'card' ? 'active' : ''} onClick={() => setViewMode('card')} title="Card view">
            <LayoutGrid size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</div>
      ) : viewMode === 'table' ? (
        /* ── Table View ── */
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>COMPANY</th>
                <th>CITY</th>
                <th>CONTACT</th>
                <th>PHONE</th>
                <th>CARS</th>
                <th>THIS MONTH</th>
                <th>COMMISSION</th>
                <th>STATUS</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {partners.length === 0 && (
                <tr><td colSpan={9} className="muted" style={{ textAlign: 'center' }}>No partners found</td></tr>
              )}
              {partners.map((p, i) => (
                <tr key={p.id} className="clickable-row" onClick={() => navigate(`/partners/${p.id}`)}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className={`partner-avatar-sm ${COLORS[i % COLORS.length]}`}>
                        {p.logo_url ? <img src={p.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6 }} /> : getInitials(p.company_name)}
                      </div>
                      <span className="name">{p.company_name}</span>
                    </div>
                  </td>
                  <td className="muted">{cap(p.city)}</td>
                  <td className="muted">{p.contact_person_name || '—'}</td>
                  <td className="muted">{p.contact_person_phone || '—'}</td>
                  <td>{p.car_count}</td>
                  <td className="name">{formatPrice(p.month_revenue)} IQD</td>
                  <td className="muted">
                    {p.commission_value ? `${p.commission_value}${p.commission_type === 'percentage' ? '%' : ' IQD'}` : '—'}
                  </td>
                  <td><span className={`pill ${STATUS_COLORS[p.status]}`}>{cap(p.status)}</span></td>
                  <td><ArrowRight size={14} className="muted" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* ── Card View ── */
        <div className="partner-grid">
          {partners.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No partners found</div>
          )}
          {partners.map((p, i) => (
            <div key={p.id} className="partner-card" onClick={() => navigate(`/partners/${p.id}`)}>
              <div className="partner-card-top">
                <div className={`partner-avatar ${COLORS[i % COLORS.length]}`}>
                  {p.logo_url ? <img src={p.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} /> : getInitials(p.company_name)}
                </div>
                <div className="partner-card-info">
                  <div className="partner-card-name">{p.company_name}</div>
                  <div className="partner-card-meta"><MapPin size={12} /> {cap(p.city)}</div>
                </div>
              </div>
              <div className="partner-card-stats">
                <div className="partner-stat"><Car size={14} /><span>{p.car_count} cars</span></div>
                <div className="partner-stat"><Phone size={14} /><span>{p.contact_person_phone || '—'}</span></div>
              </div>
              <div className="partner-card-footer">
                <span className={`pill ${STATUS_COLORS[p.status]}`}>{cap(p.status)}</span>
                <span className="partner-view">View Details <ArrowRight size={14} /></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="partner-pagination">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft size={16} /> Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
