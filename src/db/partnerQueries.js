const pool = require('../config/db');

// ── Partners ──

async function findAll({ status, city, search, sort, page = 1, limit = 20 } = {}) {
  let where = 'WHERE 1=1';
  const params = [];

  if (status) { params.push(status); where += ` AND p.status = $${params.length}`; }
  if (city) { params.push(city); where += ` AND p.city = $${params.length}`; }
  if (search) {
    params.push(`%${search}%`);
    where += ` AND (p.company_name ILIKE $${params.length} OR p.contact_person_name ILIKE $${params.length})`;
  }

  const countQ = `SELECT COUNT(*)::int AS total FROM partners p ${where}`;
  const { rows: countRows } = await pool.query(countQ, params);
  const total = countRows[0].total;

  let orderBy = 'ORDER BY p.created_at DESC';
  if (sort === 'alphabetical') orderBy = 'ORDER BY p.company_name ASC';
  else if (sort === 'most_cars') orderBy = 'ORDER BY car_count DESC';
  else if (sort === 'most_revenue') orderBy = 'ORDER BY month_revenue DESC';

  params.push(limit);
  const limitIdx = params.length;
  params.push((page - 1) * limit);
  const offsetIdx = params.length;

  const query = `
    SELECT p.*,
      COALESCE(car_agg.car_count, 0)::int AS car_count,
      COALESCE(car_agg.active_bookings, 0)::int AS active_bookings,
      COALESCE(rev_agg.month_revenue, 0)::numeric AS month_revenue,
      con.commission_type,
      con.commission_value
    FROM partners p
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::int AS car_count,
             COUNT(*) FILTER (WHERE EXISTS (
               SELECT 1 FROM bookings b WHERE b.car_id = c.id AND b.status IN ('pending','confirmed')
             ))::int AS active_bookings
      FROM cars c WHERE c.partner_id = p.id
    ) car_agg ON true
    LEFT JOIN LATERAL (
      SELECT COALESCE(SUM(b.total_price), 0) AS month_revenue
      FROM bookings b
      JOIN cars c ON b.car_id = c.id AND c.partner_id = p.id
      WHERE b.status IN ('confirmed','completed')
        AND b.created_at >= date_trunc('month', CURRENT_DATE)
    ) rev_agg ON true
    LEFT JOIN LATERAL (
      SELECT commission_type, commission_value
      FROM partner_contracts pc
      WHERE pc.partner_id = p.id AND pc.status = 'active'
      ORDER BY pc.created_at DESC LIMIT 1
    ) con ON true
    ${where}
    ${orderBy}
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;

  const { rows } = await pool.query(query, params);
  return { data: rows, total, page, limit, totalPages: Math.ceil(total / limit) };
}

async function findById(id) {
  const { rows } = await pool.query(`
    SELECT p.*,
      COALESCE(car_agg.car_count, 0)::int AS car_count,
      COALESCE(car_agg.available_cars, 0)::int AS available_cars,
      COALESCE(booking_agg.total_bookings, 0)::int AS total_bookings,
      COALESCE(booking_agg.total_revenue, 0)::numeric AS total_revenue,
      COALESCE(booking_agg.month_revenue, 0)::numeric AS month_revenue,
      COALESCE(rating_agg.avg_rating, 0)::numeric AS avg_rating,
      con.commission_type,
      con.commission_value,
      con.id AS active_contract_id,
      COALESCE(doc_agg.doc_count, 0)::int AS document_count,
      COALESCE(payout_agg.total_paid, 0)::numeric AS total_paid_out
    FROM partners p
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::int AS car_count,
             COUNT(*) FILTER (WHERE c.is_available = TRUE)::int AS available_cars
      FROM cars c WHERE c.partner_id = p.id
    ) car_agg ON true
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::int AS total_bookings,
             COALESCE(SUM(b.total_price), 0) AS total_revenue,
             COALESCE(SUM(b.total_price) FILTER (
               WHERE b.created_at >= date_trunc('month', CURRENT_DATE)
             ), 0) AS month_revenue
      FROM bookings b
      JOIN cars c ON b.car_id = c.id AND c.partner_id = p.id
      WHERE b.status IN ('confirmed','completed')
    ) booking_agg ON true
    LEFT JOIN LATERAL (
      SELECT AVG(r.rating)::numeric(3,1) AS avg_rating
      FROM reviews r
      JOIN cars c ON r.car_id = c.id AND c.partner_id = p.id
    ) rating_agg ON true
    LEFT JOIN LATERAL (
      SELECT commission_type, commission_value, id
      FROM partner_contracts pc
      WHERE pc.partner_id = p.id AND pc.status = 'active'
      ORDER BY pc.created_at DESC LIMIT 1
    ) con ON true
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::int AS doc_count
      FROM partner_documents pd
      WHERE pd.partner_id = p.id AND pd.is_deleted = FALSE
    ) doc_agg ON true
    LEFT JOIN LATERAL (
      SELECT COALESCE(SUM(pp.net_payout), 0) AS total_paid
      FROM partner_payouts pp
      WHERE pp.partner_id = p.id AND pp.status = 'paid'
    ) payout_agg ON true
    WHERE p.id = $1
  `, [id]);
  return rows[0] || null;
}

async function create(data) {
  const { rows } = await pool.query(`
    INSERT INTO partners (
      company_name, company_name_ar, logo_url, description, city, full_address,
      latitude, longitude, contact_person_name, contact_person_email,
      contact_person_phone, emergency_phone, commercial_registration_number,
      tax_id, bank_name, bank_account_holder, bank_iban, bank_branch,
      status, onboarded_by
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
    RETURNING *
  `, [
    data.company_name, data.company_name_ar || null, data.logo_url || null,
    data.description || null, data.city, data.full_address || '',
    data.latitude || null, data.longitude || null,
    data.contact_person_name || '', data.contact_person_email || null,
    data.contact_person_phone || '', data.emergency_phone || null,
    data.commercial_registration_number || '', data.tax_id || null,
    data.bank_name || null, data.bank_account_holder || null,
    data.bank_iban || null, data.bank_branch || null,
    data.status || 'pending', data.onboarded_by || null,
  ]);
  return rows[0];
}

async function update(id, data) {
  const fields = [];
  const values = [];
  const allowed = [
    'company_name', 'company_name_ar', 'logo_url', 'description', 'city',
    'full_address', 'latitude', 'longitude', 'contact_person_name',
    'contact_person_email', 'contact_person_phone', 'emergency_phone',
    'commercial_registration_number', 'tax_id', 'bank_name',
    'bank_account_holder', 'bank_iban', 'bank_branch',
  ];
  for (const key of allowed) {
    if (data[key] !== undefined) {
      values.push(data[key]);
      fields.push(`${key} = $${values.length}`);
    }
  }
  if (fields.length === 0) return findById(id);
  values.push(id);
  fields.push(`updated_at = NOW()`);
  const { rows } = await pool.query(
    `UPDATE partners SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`,
    values
  );
  return rows[0] || null;
}

async function updateStatus(id, status, extra = {}) {
  const sets = ['status = $2', 'updated_at = NOW()'];
  const params = [id, status];
  if (extra.suspension_reason !== undefined) {
    params.push(extra.suspension_reason); sets.push(`suspension_reason = $${params.length}`);
  }
  if (extra.termination_reason !== undefined) {
    params.push(extra.termination_reason); sets.push(`termination_reason = $${params.length}`);
  }
  if (status === 'active') sets.push('activated_at = NOW()');
  if (status === 'suspended') sets.push('suspended_at = NOW()');
  if (status === 'terminated') sets.push('terminated_at = NOW()');
  const { rows } = await pool.query(
    `UPDATE partners SET ${sets.join(', ')} WHERE id = $1 RETURNING *`, params
  );
  return rows[0] || null;
}

async function getStats() {
  const { rows } = await pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
      COUNT(*) FILTER (WHERE status = 'active')::int AS active,
      COUNT(*) FILTER (WHERE status = 'suspended')::int AS suspended,
      COUNT(*) FILTER (WHERE status = 'terminated')::int AS terminated,
      COUNT(*)::int AS total
    FROM partners
  `);
  const { rows: carRows } = await pool.query(`
    SELECT COUNT(*)::int AS active_cars
    FROM cars c JOIN partners p ON c.partner_id = p.id
    WHERE p.status = 'active' AND c.is_available = TRUE
  `);
  const { rows: docRows } = await pool.query(`
    SELECT COUNT(*)::int AS expiring_docs
    FROM partner_documents
    WHERE is_deleted = FALSE AND expiry_date IS NOT NULL
      AND expiry_date <= CURRENT_DATE + INTERVAL '30 days'
      AND expiry_date >= CURRENT_DATE
  `);
  const { rows: payoutRows } = await pool.query(`
    SELECT COUNT(*)::int AS pending_payouts
    FROM partner_payouts WHERE status = 'pending'
  `);
  return {
    ...rows[0],
    active_cars: carRows[0].active_cars,
    expiring_docs: docRows[0].expiring_docs,
    pending_payouts: payoutRows[0].pending_payouts,
  };
}

// ── Contracts ──

async function findContracts(partnerId) {
  const { rows } = await pool.query(
    `SELECT * FROM partner_contracts WHERE partner_id = $1 ORDER BY created_at DESC`, [partnerId]
  );
  return rows;
}

async function createContract(partnerId, data) {
  // Expire any existing active contract
  await pool.query(
    `UPDATE partner_contracts SET status = 'expired', updated_at = NOW()
     WHERE partner_id = $1 AND status = 'active'`, [partnerId]
  );
  const { rows } = await pool.query(`
    INSERT INTO partner_contracts (
      partner_id, commission_type, commission_value, payment_frequency,
      contract_start_date, contract_end_date, auto_renew,
      contract_document_url, special_terms, status
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *
  `, [
    partnerId, data.commission_type, data.commission_value, data.payment_frequency,
    data.contract_start_date, data.contract_end_date, data.auto_renew || false,
    data.contract_document_url || null, data.special_terms || null,
    data.status || 'active',
  ]);
  return rows[0];
}

async function updateContract(contractId, data) {
  const fields = [];
  const values = [];
  const allowed = [
    'commission_type', 'commission_value', 'payment_frequency',
    'contract_start_date', 'contract_end_date', 'auto_renew',
    'contract_document_url', 'special_terms', 'status',
  ];
  for (const key of allowed) {
    if (data[key] !== undefined) {
      values.push(data[key]);
      fields.push(`${key} = $${values.length}`);
    }
  }
  if (fields.length === 0) return null;
  values.push(contractId);
  fields.push('updated_at = NOW()');
  const { rows } = await pool.query(
    `UPDATE partner_contracts SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`, values
  );
  return rows[0] || null;
}

// ── Documents ──

async function findDocuments(partnerId) {
  const { rows } = await pool.query(
    `SELECT pd.*, bu.full_name AS verified_by_name
     FROM partner_documents pd
     LEFT JOIN backoffice_users bu ON pd.verified_by = bu.id
     WHERE pd.partner_id = $1 AND pd.is_deleted = FALSE
     ORDER BY pd.created_at DESC`, [partnerId]
  );
  return rows;
}

async function createDocument(partnerId, data) {
  const { rows } = await pool.query(`
    INSERT INTO partner_documents (
      partner_id, document_type, document_name, file_url, file_size, expiry_date, notes
    ) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
  `, [
    partnerId, data.document_type, data.document_name,
    data.file_url, data.file_size || null, data.expiry_date || null, data.notes || null,
  ]);
  return rows[0];
}

async function verifyDocument(docId, agentId) {
  const { rows } = await pool.query(`
    UPDATE partner_documents SET is_verified = TRUE, verified_by = $2, verified_at = NOW(), updated_at = NOW()
    WHERE id = $1 RETURNING *
  `, [docId, agentId]);
  return rows[0] || null;
}

async function deleteDocument(docId) {
  const { rows } = await pool.query(
    `UPDATE partner_documents SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1 RETURNING *`, [docId]
  );
  return rows[0] || null;
}

async function findExpiringDocuments(days = 30) {
  const { rows } = await pool.query(`
    SELECT pd.*, p.company_name, p.id AS partner_id
    FROM partner_documents pd
    JOIN partners p ON pd.partner_id = p.id
    WHERE pd.is_deleted = FALSE AND pd.expiry_date IS NOT NULL
      AND pd.expiry_date <= CURRENT_DATE + $1 * INTERVAL '1 day'
      AND pd.expiry_date >= CURRENT_DATE
    ORDER BY pd.expiry_date ASC
  `, [days]);
  return rows;
}

// ── Payouts ──

async function findPayouts(partnerId) {
  const { rows } = await pool.query(`
    SELECT pp.*, bu.full_name AS paid_by_name
    FROM partner_payouts pp
    LEFT JOIN backoffice_users bu ON pp.paid_by = bu.id
    WHERE pp.partner_id = $1
    ORDER BY pp.period_start DESC
  `, [partnerId]);
  return rows;
}

async function generatePayoutPreview(partnerId, periodStart, periodEnd) {
  // Get active contract
  const { rows: conRows } = await pool.query(
    `SELECT * FROM partner_contracts WHERE partner_id = $1 AND status = 'active' LIMIT 1`, [partnerId]
  );
  const contract = conRows[0];
  if (!contract) return { error: 'No active contract found' };

  // Get completed bookings in period
  const { rows } = await pool.query(`
    SELECT COUNT(*)::int AS total_bookings,
           COALESCE(SUM(b.total_price), 0)::numeric AS gross_revenue
    FROM bookings b
    JOIN cars c ON b.car_id = c.id AND c.partner_id = $1
    WHERE b.status IN ('completed', 'confirmed')
      AND b.start_date >= $2 AND b.end_date <= $3
  `, [partnerId, periodStart, periodEnd]);

  const { total_bookings, gross_revenue } = rows[0];
  let commission_amount;
  if (contract.commission_type === 'percentage') {
    commission_amount = parseFloat(gross_revenue) * parseFloat(contract.commission_value) / 100;
  } else {
    commission_amount = total_bookings * parseFloat(contract.commission_value);
  }
  const net_payout = parseFloat(gross_revenue) - commission_amount;

  return {
    total_bookings,
    gross_revenue: parseFloat(gross_revenue),
    commission_amount: Math.round(commission_amount * 100) / 100,
    net_payout: Math.round(net_payout * 100) / 100,
    commission_type: contract.commission_type,
    commission_value: parseFloat(contract.commission_value),
  };
}

async function createPayout(partnerId, data) {
  const { rows } = await pool.query(`
    INSERT INTO partner_payouts (
      partner_id, period_start, period_end, total_bookings,
      gross_revenue, commission_amount, net_payout, status,
      payment_method, payment_reference, notes, paid_at, paid_by
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *
  `, [
    partnerId, data.period_start, data.period_end, data.total_bookings,
    data.gross_revenue, data.commission_amount, data.net_payout,
    data.payment_reference ? 'paid' : 'pending',
    data.payment_method || null, data.payment_reference || null,
    data.notes || null,
    data.payment_reference ? new Date() : null,
    data.paid_by || null,
  ]);
  return rows[0];
}

async function updatePayout(payoutId, data) {
  const fields = [];
  const values = [];
  const allowed = ['status', 'payment_method', 'payment_reference', 'notes'];
  for (const key of allowed) {
    if (data[key] !== undefined) {
      values.push(data[key]); fields.push(`${key} = $${values.length}`);
    }
  }
  if (data.status === 'paid' || data.payment_reference) {
    fields.push('paid_at = NOW()');
    if (data.paid_by) {
      values.push(data.paid_by); fields.push(`paid_by = $${values.length}`);
    }
  }
  if (fields.length === 0) return null;
  values.push(payoutId);
  fields.push('updated_at = NOW()');
  const { rows } = await pool.query(
    `UPDATE partner_payouts SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`, values
  );
  return rows[0] || null;
}

// ── Notes ──

async function findNotes(partnerId) {
  const { rows } = await pool.query(`
    SELECT pn.*, bu.full_name AS agent_name
    FROM partner_notes pn
    JOIN backoffice_users bu ON pn.agent_id = bu.id
    WHERE pn.partner_id = $1
    ORDER BY pn.created_at DESC
  `, [partnerId]);
  return rows;
}

async function createNote(partnerId, agentId, content, noteType = 'general') {
  const { rows } = await pool.query(`
    INSERT INTO partner_notes (partner_id, agent_id, content, note_type)
    VALUES ($1, $2, $3, $4) RETURNING *
  `, [partnerId, agentId, content, noteType]);
  // Fetch with agent name
  const { rows: full } = await pool.query(`
    SELECT pn.*, bu.full_name AS agent_name
    FROM partner_notes pn
    JOIN backoffice_users bu ON pn.agent_id = bu.id
    WHERE pn.id = $1
  `, [rows[0].id]);
  return full[0];
}

// ── Monthly revenue (for chart) ──

async function getMonthlyRevenue(partnerId, months = 12) {
  const { rows } = await pool.query(`
    SELECT
      to_char(date_trunc('month', b.created_at), 'YYYY-MM') AS month,
      COALESCE(SUM(b.total_price), 0)::numeric AS revenue
    FROM bookings b
    JOIN cars c ON b.car_id = c.id AND c.partner_id = $1
    WHERE b.status IN ('confirmed', 'completed')
      AND b.created_at >= NOW() - ($2 || ' months')::interval
    GROUP BY date_trunc('month', b.created_at)
    ORDER BY month ASC
  `, [partnerId, months]);
  return rows;
}

module.exports = {
  findAll, findById, create, update, updateStatus, getStats,
  findContracts, createContract, updateContract,
  findDocuments, createDocument, verifyDocument, deleteDocument, findExpiringDocuments,
  findPayouts, generatePayoutPreview, createPayout, updatePayout,
  findNotes, createNote,
  getMonthlyRevenue,
};
