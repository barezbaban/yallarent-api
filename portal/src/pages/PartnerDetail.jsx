import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  fetchPartner, fetchCompanyCars, fetchPartnerContracts, fetchPartnerDocuments,
  fetchPartnerPayouts, fetchPartnerNotes, fetchPartnerRevenue,
  createPartnerContract, updatePartnerContract, uploadPartnerDocument,
  verifyPartnerDocument, deletePartnerDocument, generatePartnerPayout,
  createPartnerPayout, updatePartnerPayout, createPartnerNote,
  activatePartner, suspendPartner, reactivatePartner, terminatePartner,
  updatePartner, hasPermission,
} from '../api';
import {
  ArrowLeft, MapPin, Phone, Mail, Car, Building2, FileText, DollarSign,
  StickyNote, Star, Check, X, Upload, Download, AlertTriangle, Shield,
  Clock, ChevronDown, Pencil, Eye, Calendar, CreditCard, BarChart3,
  PhoneCall, Users as UsersIcon, AlertCircle, MessageSquare, Flag,
} from 'lucide-react';

function formatPrice(n) { return Number(n || 0).toLocaleString('en-US'); }
function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ') : ''; }
function formatDate(d) { return d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'; }

const STATUS_COLORS = { pending: 'yellow', active: 'green', suspended: 'amber', terminated: 'red' };
const DOC_TYPE_LABELS = {
  business_license: 'Business License', insurance_certificate: 'Insurance Certificate',
  signed_contract: 'Signed Contract', vehicle_registration: 'Vehicle Registration',
  tax_certificate: 'Tax Certificate', other: 'Other',
};
const NOTE_ICONS = { general: StickyNote, call: PhoneCall, meeting: UsersIcon, issue: AlertCircle, follow_up: Flag };
const TABS = ['Overview', 'Fleet', 'Contracts', 'Documents', 'Financials', 'Notes'];

export default function PartnerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [partner, setPartner] = useState(null);
  const [tab, setTab] = useState(0);
  const [cars, setCars] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [docs, setDocs] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [notes, setNotes] = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  // Modals
  const [modal, setModal] = useState(null); // 'suspend' | 'terminate' | 'contract' | 'document' | 'payout' | 'note'
  const [modalData, setModalData] = useState({});
  const [modalLoading, setModalLoading] = useState(false);
  const fileRef = useRef(null);

  const reload = useCallback(async () => {
    try {
      const p = await fetchPartner(id);
      setPartner(p);
    } catch (err) { setError(err.message); }
  }, [id]);

  useEffect(() => { reload(); }, [reload]);

  // Load tab data on demand
  useEffect(() => {
    if (!partner) return;
    if (tab === 1 && cars.length === 0) fetchCompanyCars(id).then(setCars).catch(() => {});
    if (tab === 2 && contracts.length === 0) fetchPartnerContracts(id).then(setContracts).catch(() => {});
    if (tab === 3 && docs.length === 0) fetchPartnerDocuments(id).then(setDocs).catch(() => {});
    if (tab === 4) {
      if (payouts.length === 0) fetchPartnerPayouts(id).then(setPayouts).catch(() => {});
      if (revenue.length === 0) fetchPartnerRevenue(id).then(setRevenue).catch(() => {});
    }
    if (tab === 5 && notes.length === 0) fetchPartnerNotes(id).then(setNotes).catch(() => {});
  }, [tab, partner, id]);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  // ── Actions ──
  const handleActivate = async () => {
    try { await activatePartner(id); await reload(); showToast('Partner activated'); } catch (e) { showToast(e.message, 'error'); }
  };
  const handleSuspend = async () => {
    if (!modalData.reason?.trim()) return;
    setModalLoading(true);
    try { await suspendPartner(id, modalData.reason); await reload(); setModal(null); showToast('Partner suspended'); } catch (e) { showToast(e.message, 'error'); }
    setModalLoading(false);
  };
  const handleReactivate = async () => {
    try { await reactivatePartner(id); await reload(); showToast('Partner reactivated'); } catch (e) { showToast(e.message, 'error'); }
  };
  const handleTerminate = async () => {
    if (!modalData.reason?.trim()) return;
    setModalLoading(true);
    try { await terminatePartner(id, modalData.reason); await reload(); setModal(null); showToast('Partner terminated'); } catch (e) { showToast(e.message, 'error'); }
    setModalLoading(false);
  };

  // ── Contract ──
  const handleCreateContract = async () => {
    setModalLoading(true);
    try {
      await createPartnerContract(id, modalData);
      const c = await fetchPartnerContracts(id);
      setContracts(c);
      await reload();
      setModal(null);
      showToast('Contract created');
    } catch (e) { showToast(e.message, 'error'); }
    setModalLoading(false);
  };

  // ── Document ──
  const handleUploadDoc = async () => {
    if (!modalData.file) return;
    setModalLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', modalData.file);
      fd.append('document_type', modalData.type || 'other');
      fd.append('document_name', modalData.name || modalData.file.name);
      if (modalData.expiry) fd.append('expiry_date', modalData.expiry);
      await uploadPartnerDocument(id, fd);
      const d = await fetchPartnerDocuments(id);
      setDocs(d);
      setModal(null);
      showToast('Document uploaded');
    } catch (e) { showToast(e.message, 'error'); }
    setModalLoading(false);
  };

  const handleVerifyDoc = async (docId) => {
    try {
      await verifyPartnerDocument(id, docId);
      setDocs(prev => prev.map(d => d.id === docId ? { ...d, is_verified: true, verified_at: new Date().toISOString() } : d));
      showToast('Document verified');
    } catch (e) { showToast(e.message, 'error'); }
  };

  const handleDeleteDoc = async (docId) => {
    if (!confirm('Delete this document?')) return;
    try {
      await deletePartnerDocument(id, docId);
      setDocs(prev => prev.filter(d => d.id !== docId));
      showToast('Document deleted');
    } catch (e) { showToast(e.message, 'error'); }
  };

  // ── Payout ──
  const handleGeneratePayout = async () => {
    if (!modalData.period_start || !modalData.period_end) return;
    setModalLoading(true);
    try {
      const preview = await generatePartnerPayout(id, { period_start: modalData.period_start, period_end: modalData.period_end });
      setModalData(prev => ({ ...prev, ...preview, step: 'preview' }));
    } catch (e) { showToast(e.message, 'error'); }
    setModalLoading(false);
  };

  const handleConfirmPayout = async () => {
    setModalLoading(true);
    try {
      await createPartnerPayout(id, {
        period_start: modalData.period_start,
        period_end: modalData.period_end,
        total_bookings: modalData.total_bookings,
        gross_revenue: modalData.gross_revenue,
        commission_amount: modalData.commission_amount,
        net_payout: modalData.net_payout,
        payment_method: modalData.payment_method || undefined,
        payment_reference: modalData.payment_reference || undefined,
        notes: modalData.payout_notes || undefined,
      });
      const p = await fetchPartnerPayouts(id);
      setPayouts(p);
      await reload();
      setModal(null);
      showToast('Payout created');
    } catch (e) { showToast(e.message, 'error'); }
    setModalLoading(false);
  };

  // ── Note ──
  const handleCreateNote = async () => {
    if (!modalData.content?.trim()) return;
    setModalLoading(true);
    try {
      const note = await createPartnerNote(id, { content: modalData.content, note_type: modalData.note_type || 'general' });
      setNotes(prev => [note, ...prev]);
      setModal(null);
      showToast('Note added');
    } catch (e) { showToast(e.message, 'error'); }
    setModalLoading(false);
  };

  if (error) return (
    <div className="main-content">
      <p style={{ color: 'var(--red)' }}>{error}</p>
      <button className="back-btn" onClick={() => navigate('/partners')}><ArrowLeft size={16} /> Back</button>
    </div>
  );
  if (!partner) return <div className="main-content"><p className="muted">Loading...</p></div>;

  const canEdit = hasPermission('companies.edit');
  const canSuspend = hasPermission('companies.suspend');
  const canViewFinancials = hasPermission('payments.view');
  const canManagePayouts = hasPermission('payments.refund');

  return (
    <div className="main-content">
      {/* Toast */}
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      <button className="back-btn" onClick={() => navigate('/partners')}><ArrowLeft size={16} /> Back to Partners</button>

      {/* ── Header ── */}
      <div className="partner-detail-header">
        <div className="partner-detail-avatar"><Building2 size={28} /></div>
        <div className="partner-detail-info">
          <h1 className="page-title">{partner.company_name}</h1>
          <div className="partner-detail-meta">
            <span><MapPin size={14} /> {cap(partner.city)}</span>
            <span><Phone size={14} /> {partner.contact_person_phone}</span>
            <span className={`pill ${STATUS_COLORS[partner.status]}`}>{cap(partner.status)}</span>
          </div>
        </div>
        <div className="partner-actions">
          {canEdit && <button className="btn btn-secondary" onClick={() => navigate(`/partners/${id}/edit`)}><Pencil size={14} /> Edit</button>}
          {partner.status === 'pending' && canEdit && (
            <button className="btn btn-primary" onClick={handleActivate}>Activate</button>
          )}
          {partner.status === 'active' && canSuspend && (
            <button className="btn btn-warning" onClick={() => { setModal('suspend'); setModalData({ reason: '' }); }}>Suspend</button>
          )}
          {partner.status === 'suspended' && canEdit && (
            <button className="btn btn-primary" onClick={handleReactivate}>Reactivate</button>
          )}
          {(partner.status === 'active' || partner.status === 'suspended') && canSuspend && (
            <button className="btn btn-danger" onClick={() => { setModal('terminate'); setModalData({ reason: '' }); }}>Terminate</button>
          )}
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="partner-detail-stats">
        <div className="stat-card"><div className="stat-header"><span className="stat-label">Total Cars</span><div className="stat-icon teal"><Car size={18} /></div></div><div className="stat-value">{partner.car_count}</div></div>
        <div className="stat-card"><div className="stat-header"><span className="stat-label">Available</span><div className="stat-icon green"><Car size={18} /></div></div><div className="stat-value">{partner.available_cars}</div></div>
        <div className="stat-card"><div className="stat-header"><span className="stat-label">Total Bookings</span><div className="stat-icon blue"><Calendar size={18} /></div></div><div className="stat-value">{partner.total_bookings}</div></div>
        <div className="stat-card"><div className="stat-header"><span className="stat-label">This Month</span><div className="stat-icon amber"><DollarSign size={18} /></div></div><div className="stat-value">{formatPrice(partner.month_revenue)}</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>IQD</div></div>
        <div className="stat-card"><div className="stat-header"><span className="stat-label">Commission</span><div className="stat-icon purple"><CreditCard size={18} /></div></div><div className="stat-value">{partner.commission_value ? `${partner.commission_value}${partner.commission_type === 'percentage' ? '%' : ' IQD'}` : '—'}</div></div>
        <div className="stat-card"><div className="stat-header"><span className="stat-label">Avg Rating</span><div className="stat-icon yellow"><Star size={18} /></div></div><div className="stat-value">{partner.avg_rating > 0 ? parseFloat(partner.avg_rating).toFixed(1) : '—'}</div></div>
      </div>

      {/* ── Tabs ── */}
      <div className="partner-tabs">
        {TABS.map((t, i) => {
          if (i === 4 && !canViewFinancials) return null;
          return <button key={t} className={`partner-tab ${tab === i ? 'active' : ''}`} onClick={() => setTab(i)}>{t}</button>;
        })}
      </div>

      {/* ── Tab Content ── */}
      <div className="partner-tab-content">

        {/* Tab 0: Overview */}
        {tab === 0 && (
          <div className="overview-grid">
            <div className="overview-section">
              <h3>Company Details</h3>
              <div className="detail-row"><span>Address</span><span>{partner.full_address || '—'}</span></div>
              {partner.description && <div className="detail-row"><span>Description</span><span>{partner.description}</span></div>}
              <div className="detail-row"><span>Registration #</span><span>{partner.commercial_registration_number || '—'}</span></div>
              {partner.tax_id && <div className="detail-row"><span>Tax ID</span><span>{partner.tax_id}</span></div>}
            </div>
            <div className="overview-section">
              <h3>Contact</h3>
              <div className="detail-row"><span>Name</span><span>{partner.contact_person_name}</span></div>
              <div className="detail-row"><span>Phone</span><span>{partner.contact_person_phone}</span></div>
              {partner.contact_person_email && <div className="detail-row"><span>Email</span><span>{partner.contact_person_email}</span></div>}
              {partner.emergency_phone && <div className="detail-row"><span>Emergency</span><span>{partner.emergency_phone}</span></div>}
            </div>
            <div className="overview-section">
              <h3>Banking</h3>
              {partner.bank_name ? (
                <>
                  <div className="detail-row"><span>Bank</span><span>{partner.bank_name}</span></div>
                  <div className="detail-row"><span>Account</span><span>{partner.bank_account_holder || '—'}</span></div>
                  <div className="detail-row"><span>IBAN</span><span>{partner.bank_iban || '—'}</span></div>
                  {partner.bank_branch && <div className="detail-row"><span>Branch</span><span>{partner.bank_branch}</span></div>}
                </>
              ) : <p className="muted">Banking details not provided</p>}
            </div>
            <div className="overview-section">
              <h3>Active Contract</h3>
              {partner.commission_value ? (
                <>
                  <div className="detail-row"><span>Commission</span><span>{partner.commission_value}{partner.commission_type === 'percentage' ? '%' : ' IQD'}</span></div>
                  <div className="detail-row"><span>Documents</span><span>{partner.document_count} uploaded</span></div>
                </>
              ) : <p className="muted">No active contract</p>}
            </div>
          </div>
        )}

        {/* Tab 1: Fleet */}
        {tab === 1 && (
          <div className="table-card">
            <div className="table-card-header">
              <span className="table-card-title">Fleet ({cars.length} cars)</span>
            </div>
            <table>
              <thead><tr><th>CAR</th><th>YEAR</th><th>CATEGORY</th><th>TRANSMISSION</th><th>SEATS</th><th>PRICE/DAY</th><th>STATUS</th></tr></thead>
              <tbody>
                {cars.length === 0 && <tr><td colSpan={7} className="muted" style={{ textAlign: 'center' }}>No cars listed</td></tr>}
                {cars.map(car => (
                  <tr key={car.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {car.image_url ? (
                          <img src={car.image_url} alt="" style={{ width: 48, height: 32, objectFit: 'cover', borderRadius: 4 }} />
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
                    <td><span className={`pill ${car.is_available ? 'green' : 'red'}`}>{car.is_available ? 'Available' : 'Unavailable'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Contracts */}
        {tab === 2 && (
          <div>
            {canEdit && (
              <button className="btn btn-primary" style={{ marginBottom: 16 }} onClick={() => {
                setModal('contract');
                setModalData({
                  commission_type: 'percentage', commission_value: '15', payment_frequency: 'monthly',
                  contract_start_date: new Date().toISOString().split('T')[0],
                  contract_end_date: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
                  auto_renew: false, special_terms: '',
                });
              }}>
                <FileText size={14} /> New Contract
              </button>
            )}
            <div className="table-card">
              <table>
                <thead><tr><th>PERIOD</th><th>COMMISSION</th><th>FREQUENCY</th><th>STATUS</th><th>AUTO-RENEW</th></tr></thead>
                <tbody>
                  {contracts.length === 0 && <tr><td colSpan={5} className="muted" style={{ textAlign: 'center' }}>No contracts</td></tr>}
                  {contracts.map(c => (
                    <tr key={c.id}>
                      <td>{formatDate(c.contract_start_date)} — {formatDate(c.contract_end_date)}</td>
                      <td className="name">{c.commission_value}{c.commission_type === 'percentage' ? '%' : ' IQD'}</td>
                      <td className="muted">{cap(c.payment_frequency)}</td>
                      <td><span className={`pill ${STATUS_COLORS[c.status] || 'blue'}`}>{cap(c.status)}</span></td>
                      <td className="muted">{c.auto_renew ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Documents */}
        {tab === 3 && (
          <div>
            {canEdit && (
              <button className="btn btn-primary" style={{ marginBottom: 16 }} onClick={() => {
                setModal('document');
                setModalData({ type: 'other', name: '', expiry: '', file: null });
              }}>
                <Upload size={14} /> Upload Document
              </button>
            )}
            {docs.some(d => d.expiry_date && new Date(d.expiry_date) <= new Date(Date.now() + 30 * 86400000)) && (
              <div className="partner-alert-banner" style={{ marginBottom: 16 }}>
                <AlertTriangle size={16} /> Some documents are expiring soon or already expired
              </div>
            )}
            <div className="doc-grid">
              {docs.length === 0 && <p className="muted">No documents uploaded</p>}
              {docs.map(d => {
                const expired = d.expiry_date && new Date(d.expiry_date) < new Date();
                const expiringSoon = d.expiry_date && !expired && new Date(d.expiry_date) <= new Date(Date.now() + 30 * 86400000);
                return (
                  <div key={d.id} className={`doc-card ${expired ? 'doc-expired' : expiringSoon ? 'doc-expiring' : ''}`}>
                    <div className="doc-card-header">
                      <FileText size={20} />
                      <div className="doc-card-info">
                        <span className="doc-card-type">{DOC_TYPE_LABELS[d.document_type] || d.document_type}</span>
                        <span className="doc-card-name">{d.document_name}</span>
                      </div>
                      {d.is_verified && <span className="pill green" style={{ fontSize: 10 }}><Check size={10} /> Verified</span>}
                    </div>
                    <div className="doc-card-meta">
                      {d.file_size && <span>{(d.file_size / 1024).toFixed(0)} KB</span>}
                      <span>Uploaded {formatDate(d.created_at)}</span>
                      {d.expiry_date && <span className={expired ? 'text-red' : expiringSoon ? 'text-amber' : ''}>Expires {formatDate(d.expiry_date)}</span>}
                    </div>
                    <div className="doc-card-actions">
                      {d.file_url && <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="btn-sm"><Download size={12} /> Download</a>}
                      {!d.is_verified && canEdit && <button className="btn-sm green" onClick={() => handleVerifyDoc(d.id)}><Check size={12} /> Verify</button>}
                      {canEdit && <button className="btn-sm danger" onClick={() => handleDeleteDoc(d.id)}><X size={12} /></button>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 4: Financials */}
        {tab === 4 && canViewFinancials && (
          <div>
            <div className="partner-detail-stats" style={{ marginBottom: 20 }}>
              <div className="stat-card"><div className="stat-header"><span className="stat-label">Total Revenue</span></div><div className="stat-value">{formatPrice(partner.total_revenue)} IQD</div></div>
              <div className="stat-card"><div className="stat-header"><span className="stat-label">Commission Earned</span></div><div className="stat-value">{formatPrice(partner.total_revenue - partner.total_paid_out)} IQD</div></div>
              <div className="stat-card"><div className="stat-header"><span className="stat-label">Total Paid Out</span></div><div className="stat-value">{formatPrice(partner.total_paid_out)} IQD</div></div>
            </div>

            {canManagePayouts && (
              <button className="btn btn-primary" style={{ marginBottom: 16 }} onClick={() => {
                setModal('payout');
                setModalData({ period_start: '', period_end: '', step: 'dates' });
              }}>
                <DollarSign size={14} /> Generate Payout
              </button>
            )}

            {/* Revenue chart (simple bar) */}
            {revenue.length > 0 && (
              <div className="table-card" style={{ marginBottom: 20 }}>
                <div className="table-card-header"><span className="table-card-title">Monthly Revenue</span></div>
                <div className="revenue-chart">
                  {revenue.map(r => {
                    const max = Math.max(...revenue.map(x => parseFloat(x.revenue) || 1));
                    const pct = ((parseFloat(r.revenue) || 0) / max) * 100;
                    return (
                      <div key={r.month} className="revenue-bar-wrap">
                        <div className="revenue-bar" style={{ height: `${Math.max(pct, 2)}%` }} title={`${formatPrice(r.revenue)} IQD`} />
                        <span className="revenue-label">{r.month.slice(5)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="table-card">
              <div className="table-card-header"><span className="table-card-title">Payout History</span></div>
              <table>
                <thead><tr><th>PERIOD</th><th>BOOKINGS</th><th>GROSS</th><th>COMMISSION</th><th>NET</th><th>STATUS</th><th>REFERENCE</th></tr></thead>
                <tbody>
                  {payouts.length === 0 && <tr><td colSpan={7} className="muted" style={{ textAlign: 'center' }}>No payouts yet</td></tr>}
                  {payouts.map(p => (
                    <tr key={p.id}>
                      <td>{formatDate(p.period_start)} — {formatDate(p.period_end)}</td>
                      <td>{p.total_bookings}</td>
                      <td className="name">{formatPrice(p.gross_revenue)}</td>
                      <td className="muted">{formatPrice(p.commission_amount)}</td>
                      <td className="name">{formatPrice(p.net_payout)}</td>
                      <td><span className={`pill ${p.status === 'paid' ? 'green' : p.status === 'disputed' ? 'red' : 'yellow'}`}>{cap(p.status)}</span></td>
                      <td className="muted">{p.payment_reference || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 5: Notes */}
        {tab === 5 && (
          <div>
            {canEdit && (
              <button className="btn btn-primary" style={{ marginBottom: 16 }} onClick={() => {
                setModal('note');
                setModalData({ content: '', note_type: 'general' });
              }}>
                <StickyNote size={14} /> Add Note
              </button>
            )}
            <div className="notes-timeline">
              {notes.length === 0 && <p className="muted">No notes yet</p>}
              {notes.map(n => {
                const NIcon = NOTE_ICONS[n.note_type] || StickyNote;
                return (
                  <div key={n.id} className="note-item">
                    <div className="note-icon"><NIcon size={16} /></div>
                    <div className="note-body">
                      <div className="note-header">
                        <span className="note-agent">{n.agent_name}</span>
                        <span className="pill" style={{ fontSize: 10 }}>{cap(n.note_type)}</span>
                        <span className="note-time">{formatDate(n.created_at)}</span>
                      </div>
                      <p className="note-content">{n.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modal === 'suspend' ? 'Suspend Partner' : modal === 'terminate' ? 'Terminate Partnership' : modal === 'contract' ? 'New Contract' : modal === 'document' ? 'Upload Document' : modal === 'payout' ? 'Generate Payout' : 'Add Note'}</h3>
              <button className="icon-btn" onClick={() => setModal(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {/* Suspend */}
              {modal === 'suspend' && (
                <>
                  <label>Reason for suspension <span className="required">*</span></label>
                  <textarea value={modalData.reason || ''} onChange={e => setModalData(d => ({ ...d, reason: e.target.value }))} rows={3} placeholder="Why is this partner being suspended?" />
                  <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                    <button className="btn btn-warning" onClick={handleSuspend} disabled={modalLoading || !modalData.reason?.trim()}>{modalLoading ? 'Saving...' : 'Suspend Partner'}</button>
                  </div>
                </>
              )}

              {/* Terminate */}
              {modal === 'terminate' && (
                <>
                  <div className="form-error" style={{ marginBottom: 12 }}><AlertTriangle size={14} /> This action is permanent. All cars will be removed from the app.</div>
                  <label>Reason for termination <span className="required">*</span></label>
                  <textarea value={modalData.reason || ''} onChange={e => setModalData(d => ({ ...d, reason: e.target.value }))} rows={3} />
                  <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                    <button className="btn btn-danger" onClick={handleTerminate} disabled={modalLoading || !modalData.reason?.trim()}>{modalLoading ? 'Saving...' : 'Terminate Partnership'}</button>
                  </div>
                </>
              )}

              {/* Contract */}
              {modal === 'contract' && (
                <>
                  {contracts.some(c => c.status === 'active') && (
                    <div className="form-error" style={{ marginBottom: 12 }}><AlertTriangle size={14} /> Creating a new contract will expire the current one.</div>
                  )}
                  <div className="form-row">
                    <div className="form-group half">
                      <label>Commission Type</label>
                      <select value={modalData.commission_type} onChange={e => setModalData(d => ({ ...d, commission_type: e.target.value }))}>
                        <option value="percentage">Percentage</option>
                        <option value="fixed_per_booking">Fixed per booking</option>
                      </select>
                    </div>
                    <div className="form-group half">
                      <label>Value</label>
                      <input type="number" value={modalData.commission_value || ''} onChange={e => setModalData(d => ({ ...d, commission_value: e.target.value }))} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Payment Frequency</label>
                    <select value={modalData.payment_frequency} onChange={e => setModalData(d => ({ ...d, payment_frequency: e.target.value }))}>
                      <option value="weekly">Weekly</option><option value="biweekly">Biweekly</option><option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div className="form-row">
                    <div className="form-group half"><label>Start Date</label><input type="date" value={modalData.contract_start_date || ''} onChange={e => setModalData(d => ({ ...d, contract_start_date: e.target.value }))} /></div>
                    <div className="form-group half"><label>End Date</label><input type="date" value={modalData.contract_end_date || ''} onChange={e => setModalData(d => ({ ...d, contract_end_date: e.target.value }))} /></div>
                  </div>
                  <label className="toggle-label"><input type="checkbox" checked={modalData.auto_renew || false} onChange={e => setModalData(d => ({ ...d, auto_renew: e.target.checked }))} /> Auto-renew</label>
                  <div className="form-group"><label>Special Terms</label><textarea value={modalData.special_terms || ''} onChange={e => setModalData(d => ({ ...d, special_terms: e.target.value }))} rows={2} /></div>
                  <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleCreateContract} disabled={modalLoading}>{modalLoading ? 'Creating...' : 'Create Contract'}</button>
                  </div>
                </>
              )}

              {/* Document */}
              {modal === 'document' && (
                <>
                  <div className="form-group">
                    <label>Document Type</label>
                    <select value={modalData.type} onChange={e => setModalData(d => ({ ...d, type: e.target.value }))}>
                      {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label>Name</label><input type="text" value={modalData.name || ''} onChange={e => setModalData(d => ({ ...d, name: e.target.value }))} placeholder="Document name" /></div>
                  <div className="form-group"><label>Expiry Date (optional)</label><input type="date" value={modalData.expiry || ''} onChange={e => setModalData(d => ({ ...d, expiry: e.target.value }))} /></div>
                  <div className="form-group"><label>File</label><input type="file" accept="image/jpeg,image/png,application/pdf" onChange={e => setModalData(d => ({ ...d, file: e.target.files?.[0] || null }))} /></div>
                  <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleUploadDoc} disabled={modalLoading || !modalData.file}>{modalLoading ? 'Uploading...' : 'Upload'}</button>
                  </div>
                </>
              )}

              {/* Payout */}
              {modal === 'payout' && (
                <>
                  {modalData.step !== 'preview' ? (
                    <>
                      <div className="form-row">
                        <div className="form-group half"><label>Period Start</label><input type="date" value={modalData.period_start || ''} onChange={e => setModalData(d => ({ ...d, period_start: e.target.value }))} /></div>
                        <div className="form-group half"><label>Period End</label><input type="date" value={modalData.period_end || ''} onChange={e => setModalData(d => ({ ...d, period_end: e.target.value }))} /></div>
                      </div>
                      <div className="modal-actions">
                        <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleGeneratePayout} disabled={modalLoading || !modalData.period_start || !modalData.period_end}>{modalLoading ? 'Calculating...' : 'Calculate'}</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="payout-preview">
                        <div className="detail-row"><span>Bookings</span><span>{modalData.total_bookings}</span></div>
                        <div className="detail-row"><span>Gross Revenue</span><span>{formatPrice(modalData.gross_revenue)} IQD</span></div>
                        <div className="detail-row"><span>Commission ({modalData.commission_value}{modalData.commission_type === 'percentage' ? '%' : ' IQD'})</span><span>{formatPrice(modalData.commission_amount)} IQD</span></div>
                        <div className="detail-row" style={{ fontWeight: 600 }}><span>Net Payout</span><span>{formatPrice(modalData.net_payout)} IQD</span></div>
                      </div>
                      <div className="form-row">
                        <div className="form-group half"><label>Payment Method</label><input type="text" value={modalData.payment_method || ''} onChange={e => setModalData(d => ({ ...d, payment_method: e.target.value }))} placeholder="e.g. bank_transfer" /></div>
                        <div className="form-group half"><label>Reference #</label><input type="text" value={modalData.payment_reference || ''} onChange={e => setModalData(d => ({ ...d, payment_reference: e.target.value }))} /></div>
                      </div>
                      <div className="form-group"><label>Notes</label><textarea value={modalData.payout_notes || ''} onChange={e => setModalData(d => ({ ...d, payout_notes: e.target.value }))} rows={2} /></div>
                      <div className="modal-actions">
                        <button className="btn btn-secondary" onClick={() => setModalData(d => ({ ...d, step: 'dates' }))}>Back</button>
                        <button className="btn btn-primary" onClick={handleConfirmPayout} disabled={modalLoading}>{modalLoading ? 'Confirming...' : 'Confirm Payout'}</button>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Note */}
              {modal === 'note' && (
                <>
                  <div className="form-group">
                    <label>Type</label>
                    <select value={modalData.note_type || 'general'} onChange={e => setModalData(d => ({ ...d, note_type: e.target.value }))}>
                      <option value="general">General</option><option value="call">Call</option><option value="meeting">Meeting</option><option value="issue">Issue</option><option value="follow_up">Follow-up</option>
                    </select>
                  </div>
                  <div className="form-group"><label>Content</label><textarea value={modalData.content || ''} onChange={e => setModalData(d => ({ ...d, content: e.target.value }))} rows={4} placeholder="Write your note..." /></div>
                  <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleCreateNote} disabled={modalLoading || !modalData.content?.trim()}>{modalLoading ? 'Saving...' : 'Add Note'}</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
