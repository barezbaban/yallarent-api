import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createPartner, createPartnerContract, uploadPartnerDocument, activatePartner,
} from '../api';
import {
  ArrowLeft, ArrowRight, Check, Building2, User, Landmark, FileText, Upload, Eye,
  X, AlertCircle,
} from 'lucide-react';

const CITIES = ['erbil', 'baghdad', 'basra', 'sulaymaniyah', 'duhok', 'kirkuk', 'najaf', 'karbala'];
const STEPS = ['Company', 'Contact', 'Banking', 'Contract', 'Documents', 'Review'];
const STEP_ICONS = [Building2, User, Landmark, FileText, Upload, Eye];

function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

const INITIAL = {
  company_name: '', company_name_ar: '', city: 'erbil', full_address: '', description: '',
  contact_person_name: '', contact_person_phone: '', contact_person_email: '', emergency_phone: '',
  commercial_registration_number: '', tax_id: '',
  bank_name: '', bank_account_holder: '', bank_iban: '', bank_branch: '',
  commission_type: 'percentage', commission_value: '15', payment_frequency: 'monthly',
  contract_start_date: new Date().toISOString().split('T')[0],
  contract_end_date: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
  auto_renew: false, special_terms: '',
};

export default function PartnerForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INITIAL);
  const [docs, setDocs] = useState([]); // { file, type, name, expiry }
  const [contractFile, setContractFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const fileRef = useRef(null);
  const contractFileRef = useRef(null);

  const set = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
    setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  const validateStep = () => {
    const errs = {};
    if (step === 0) {
      if (!form.company_name.trim()) errs.company_name = 'Required';
      if (!form.city) errs.city = 'Required';
      if (!form.full_address.trim()) errs.full_address = 'Required';
    }
    if (step === 1) {
      if (!form.contact_person_name.trim()) errs.contact_person_name = 'Required';
      if (!form.contact_person_phone.trim()) errs.contact_person_phone = 'Required';
      if (!form.commercial_registration_number.trim()) errs.commercial_registration_number = 'Required';
    }
    if (step === 3) {
      if (!form.commission_value || parseFloat(form.commission_value) <= 0) errs.commission_value = 'Must be > 0';
      if (!form.contract_start_date) errs.contract_start_date = 'Required';
      if (!form.contract_end_date) errs.contract_end_date = 'Required';
      if (form.contract_start_date && form.contract_end_date && form.contract_end_date <= form.contract_start_date) {
        errs.contract_end_date = 'Must be after start date';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => { if (validateStep()) setStep(s => Math.min(s + 1, 5)); };
  const back = () => setStep(s => Math.max(s - 1, 0));

  const addDocSlot = () => {
    fileRef.current?.click();
  };

  const handleDocFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const type = docs.length === 0 ? 'business_license' : 'other';
    setDocs(prev => [...prev, { file, type, name: file.name, expiry: '' }]);
  };

  const updateDoc = (i, key, val) => {
    setDocs(prev => prev.map((d, j) => j === i ? { ...d, [key]: val } : d));
  };

  const removeDoc = (i) => {
    setDocs(prev => prev.filter((_, j) => j !== i));
  };

  const handleSubmit = async (andActivate = false) => {
    if (!validateStep()) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      // 1. Create partner
      const partner = await createPartner({
        company_name: form.company_name,
        company_name_ar: form.company_name_ar || undefined,
        city: form.city,
        full_address: form.full_address,
        description: form.description || undefined,
        contact_person_name: form.contact_person_name,
        contact_person_phone: form.contact_person_phone,
        contact_person_email: form.contact_person_email || undefined,
        emergency_phone: form.emergency_phone || undefined,
        commercial_registration_number: form.commercial_registration_number,
        tax_id: form.tax_id || undefined,
        bank_name: form.bank_name || undefined,
        bank_account_holder: form.bank_account_holder || undefined,
        bank_iban: form.bank_iban || undefined,
        bank_branch: form.bank_branch || undefined,
      });

      // 2. Create contract
      await createPartnerContract(partner.id, {
        commission_type: form.commission_type,
        commission_value: parseFloat(form.commission_value),
        payment_frequency: form.payment_frequency,
        contract_start_date: form.contract_start_date,
        contract_end_date: form.contract_end_date,
        auto_renew: form.auto_renew,
        special_terms: form.special_terms || undefined,
      });

      // 3. Upload documents
      for (const doc of docs) {
        const fd = new FormData();
        fd.append('file', doc.file);
        fd.append('document_type', doc.type);
        fd.append('document_name', doc.name);
        if (doc.expiry) fd.append('expiry_date', doc.expiry);
        await uploadPartnerDocument(partner.id, fd);
      }

      // 4. Upload contract PDF if provided
      if (contractFile) {
        const fd = new FormData();
        fd.append('file', contractFile);
        fd.append('document_type', 'signed_contract');
        fd.append('document_name', contractFile.name);
        await uploadPartnerDocument(partner.id, fd);
      }

      // 5. Activate if requested
      if (andActivate) {
        try {
          await activatePartner(partner.id);
        } catch (err) {
          // Still navigate even if activation fails — they can activate later
          console.error('Activation failed:', err.message);
        }
      }

      navigate(`/partners/${partner.id}`);
    } catch (err) {
      setSubmitError(err.message || 'Failed to create partner');
    }
    setSubmitting(false);
  };

  const hasBusinessLicense = docs.some(d => d.type === 'business_license');

  const renderField = (label, key, opts = {}) => {
    const { type = 'text', required, placeholder, suffix, textarea, half } = opts;
    return (
      <div className={`form-group ${half ? 'half' : ''}`}>
        <label>{label} {required && <span className="required">*</span>}</label>
        {textarea ? (
          <textarea value={form[key]} onChange={e => set(key, e.target.value)} placeholder={placeholder} rows={3} />
        ) : (
          <div className="input-wrap">
            <input type={type} value={form[key]} onChange={e => set(key, e.target.value)} placeholder={placeholder} />
            {suffix && <span className="input-suffix">{suffix}</span>}
          </div>
        )}
        {errors[key] && <span className="field-error">{errors[key]}</span>}
      </div>
    );
  };

  return (
    <div className="main-content">
      <button className="back-btn" onClick={() => navigate('/partners')}>
        <ArrowLeft size={16} /> Back to Partners
      </button>

      <h1 className="page-title" style={{ marginTop: 12 }}>Add New Partner</h1>

      {/* Step indicator */}
      <div className="step-indicator">
        {STEPS.map((s, i) => {
          const Icon = STEP_ICONS[i];
          return (
            <div key={s} className={`step-item ${i === step ? 'active' : i < step ? 'done' : ''}`} onClick={() => i < step && setStep(i)}>
              <div className="step-circle">{i < step ? <Check size={14} /> : <Icon size={14} />}</div>
              <span className="step-label">{s}</span>
            </div>
          );
        })}
      </div>

      <div className="partner-form-card">
        {/* Step 0: Company Details */}
        {step === 0 && (
          <div className="form-step">
            <h2>Company Details</h2>
            <div className="form-row">
              {renderField('Company Name', 'company_name', { required: true, half: true })}
              {renderField('Arabic Name', 'company_name_ar', { placeholder: 'Optional', half: true })}
            </div>
            <div className="form-row">
              <div className="form-group half">
                <label>City <span className="required">*</span></label>
                <select value={form.city} onChange={e => set('city', e.target.value)}>
                  {CITIES.map(c => <option key={c} value={c}>{cap(c)}</option>)}
                </select>
                {errors.city && <span className="field-error">{errors.city}</span>}
              </div>
            </div>
            {renderField('Full Address', 'full_address', { required: true, textarea: true })}
            {renderField('Description / Bio', 'description', { textarea: true, placeholder: 'This will appear on the customer app' })}
          </div>
        )}

        {/* Step 1: Contact */}
        {step === 1 && (
          <div className="form-step">
            <h2>Contact Information</h2>
            <div className="form-row">
              {renderField('Contact Person Name', 'contact_person_name', { required: true, half: true })}
              {renderField('Phone', 'contact_person_phone', { required: true, placeholder: '07XX XXX XXXX', half: true })}
            </div>
            <div className="form-row">
              {renderField('Email', 'contact_person_email', { type: 'email', half: true })}
              {renderField('Emergency Phone', 'emergency_phone', { half: true })}
            </div>
            <div className="form-row">
              {renderField('Commercial Registration #', 'commercial_registration_number', { required: true, half: true })}
              {renderField('Tax ID', 'tax_id', { half: true })}
            </div>
          </div>
        )}

        {/* Step 2: Banking */}
        {step === 2 && (
          <div className="form-step">
            <h2>Banking Details</h2>
            <div className="form-note">Banking details are used for processing payouts. You can add these later.</div>
            <div className="form-row">
              {renderField('Bank Name', 'bank_name', { half: true })}
              {renderField('Account Holder', 'bank_account_holder', { half: true })}
            </div>
            <div className="form-row">
              {renderField('IBAN / Account Number', 'bank_iban', { half: true })}
              {renderField('Branch', 'bank_branch', { half: true })}
            </div>
          </div>
        )}

        {/* Step 3: Contract */}
        {step === 3 && (
          <div className="form-step">
            <h2>Contract Terms</h2>
            <div className="form-group">
              <label>Commission Type</label>
              <div className="radio-group">
                <label className={`radio-btn ${form.commission_type === 'percentage' ? 'active' : ''}`}>
                  <input type="radio" checked={form.commission_type === 'percentage'} onChange={() => set('commission_type', 'percentage')} />
                  Percentage of each booking
                </label>
                <label className={`radio-btn ${form.commission_type === 'fixed_per_booking' ? 'active' : ''}`}>
                  <input type="radio" checked={form.commission_type === 'fixed_per_booking'} onChange={() => set('commission_type', 'fixed_per_booking')} />
                  Fixed amount per booking (IQD)
                </label>
              </div>
            </div>
            {renderField('Commission Value', 'commission_value', {
              type: 'number', required: true,
              suffix: form.commission_type === 'percentage' ? '%' : 'IQD',
            })}
            <div className="form-group">
              <label>Payment Frequency</label>
              <select value={form.payment_frequency} onChange={e => set('payment_frequency', e.target.value)}>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Biweekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div className="form-row">
              {renderField('Start Date', 'contract_start_date', { type: 'date', required: true, half: true })}
              {renderField('End Date', 'contract_end_date', { type: 'date', required: true, half: true })}
            </div>
            <div className="form-group">
              <label className="toggle-label">
                <input type="checkbox" checked={form.auto_renew} onChange={e => set('auto_renew', e.target.checked)} />
                Auto-renew contract
              </label>
            </div>
            <div className="form-group">
              <label>Upload Signed Contract PDF (optional)</label>
              <input type="file" ref={contractFileRef} accept="application/pdf" onChange={e => setContractFile(e.target.files?.[0] || null)} />
              {contractFile && <div className="file-tag">{contractFile.name} <X size={12} onClick={() => { setContractFile(null); contractFileRef.current.value = ''; }} /></div>}
            </div>
            {renderField('Special Terms', 'special_terms', { textarea: true })}
          </div>
        )}

        {/* Step 4: Documents */}
        {step === 4 && (
          <div className="form-step">
            <h2>Documents</h2>
            <div className="form-note">Upload documents for compliance. A business license is required for activation.</div>
            <input type="file" ref={fileRef} hidden accept="image/jpeg,image/png,application/pdf" onChange={handleDocFile} />
            {docs.length === 0 && (
              <div className="empty-docs">No documents uploaded yet</div>
            )}
            {docs.map((d, i) => (
              <div key={i} className="doc-row">
                <select value={d.type} onChange={e => updateDoc(i, 'type', e.target.value)}>
                  <option value="business_license">Business License</option>
                  <option value="insurance_certificate">Insurance Certificate</option>
                  <option value="tax_certificate">Tax Certificate</option>
                  <option value="signed_contract">Signed Contract</option>
                  <option value="vehicle_registration">Vehicle Registration</option>
                  <option value="other">Other</option>
                </select>
                <input type="text" value={d.name} onChange={e => updateDoc(i, 'name', e.target.value)} placeholder="Document name" />
                <input type="date" value={d.expiry} onChange={e => updateDoc(i, 'expiry', e.target.value)} title="Expiry date (optional)" />
                <span className="doc-file-name">{d.file.name} ({(d.file.size / 1024).toFixed(0)} KB)</span>
                <button className="icon-btn danger" onClick={() => removeDoc(i)}><X size={14} /></button>
              </div>
            ))}
            <button className="btn btn-secondary" onClick={addDocSlot} style={{ marginTop: 12 }}>
              <Upload size={14} /> Add Document
            </button>
          </div>
        )}

        {/* Step 5: Review */}
        {step === 5 && (
          <div className="form-step">
            <h2>Review & Submit</h2>
            {submitError && (
              <div className="form-error"><AlertCircle size={14} /> {submitError}</div>
            )}
            <div className="review-grid">
              <div className="review-section">
                <h3>Company</h3>
                <div className="review-row"><span>Name</span><span>{form.company_name}</span></div>
                {form.company_name_ar && <div className="review-row"><span>Arabic Name</span><span>{form.company_name_ar}</span></div>}
                <div className="review-row"><span>City</span><span>{cap(form.city)}</span></div>
                <div className="review-row"><span>Address</span><span>{form.full_address}</span></div>
              </div>
              <div className="review-section">
                <h3>Contact</h3>
                <div className="review-row"><span>Name</span><span>{form.contact_person_name}</span></div>
                <div className="review-row"><span>Phone</span><span>{form.contact_person_phone}</span></div>
                {form.contact_person_email && <div className="review-row"><span>Email</span><span>{form.contact_person_email}</span></div>}
                <div className="review-row"><span>Registration #</span><span>{form.commercial_registration_number}</span></div>
              </div>
              <div className="review-section">
                <h3>Contract</h3>
                <div className="review-row"><span>Commission</span><span>{form.commission_value}{form.commission_type === 'percentage' ? '%' : ' IQD'} per booking</span></div>
                <div className="review-row"><span>Payment</span><span>{cap(form.payment_frequency)}</span></div>
                <div className="review-row"><span>Period</span><span>{form.contract_start_date} — {form.contract_end_date}</span></div>
              </div>
              <div className="review-section">
                <h3>Documents ({docs.length})</h3>
                {docs.map((d, i) => (
                  <div key={i} className="review-row"><span>{cap(d.type.replace(/_/g, ' '))}</span><span>{d.name}</span></div>
                ))}
                {docs.length === 0 && <div className="review-row muted">None uploaded</div>}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="form-nav">
          {step > 0 && (
            <button className="btn btn-secondary" onClick={back} disabled={submitting}>
              <ArrowLeft size={14} /> Back
            </button>
          )}
          <div style={{ flex: 1 }} />
          {step < 5 ? (
            <button className="btn btn-primary" onClick={next}>
              Next <ArrowRight size={14} />
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary" onClick={() => handleSubmit(false)} disabled={submitting}>
                {submitting ? 'Saving...' : 'Save as Pending'}
              </button>
              {hasBusinessLicense && (
                <button className="btn btn-primary" onClick={() => handleSubmit(true)} disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save & Activate'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
