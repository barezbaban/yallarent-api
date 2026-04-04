const partnerQueries = require('../db/partnerQueries');

// ── Partners CRUD ──

async function list(req, res) {
  try {
    const { status, city, search, sort, page = 1, limit = 20 } = req.query;
    const result = await partnerQueries.findAll({
      status, city, search, sort,
      page: parseInt(page, 10), limit: Math.min(parseInt(limit, 10) || 20, 100),
    });
    res.json(result);
  } catch (err) {
    console.error('Failed to list partners:', err);
    res.status(500).json({ error: 'Failed to fetch partners' });
  }
}

async function getById(req, res) {
  try {
    const partner = await partnerQueries.findById(req.params.id);
    if (!partner) return res.status(404).json({ error: 'Partner not found' });
    res.json(partner);
  } catch (err) {
    console.error('Failed to get partner:', err);
    res.status(500).json({ error: 'Failed to fetch partner' });
  }
}

async function create(req, res) {
  try {
    const partner = await partnerQueries.create({
      ...req.body,
      onboarded_by: req.admin.id,
    });
    res.status(201).json(partner);
  } catch (err) {
    console.error('Failed to create partner:', err);
    res.status(500).json({ error: 'Failed to create partner' });
  }
}

async function update(req, res) {
  try {
    const partner = await partnerQueries.update(req.params.id, req.body);
    if (!partner) return res.status(404).json({ error: 'Partner not found' });
    res.json(partner);
  } catch (err) {
    console.error('Failed to update partner:', err);
    res.status(500).json({ error: 'Failed to update partner' });
  }
}

async function activate(req, res) {
  try {
    const partner = await partnerQueries.findById(req.params.id);
    if (!partner) return res.status(404).json({ error: 'Partner not found' });
    if (partner.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending partners can be activated' });
    }
    // Check for business license
    const docs = await partnerQueries.findDocuments(req.params.id);
    const hasLicense = docs.some(d => d.document_type === 'business_license');
    if (!hasLicense) {
      return res.status(400).json({ error: 'A business license document is required for activation' });
    }
    // Check for active contract
    const contracts = await partnerQueries.findContracts(req.params.id);
    const hasActiveContract = contracts.some(c => c.status === 'active');
    if (!hasActiveContract) {
      return res.status(400).json({ error: 'An active contract is required for activation' });
    }
    const updated = await partnerQueries.updateStatus(req.params.id, 'active');
    res.json(updated);
  } catch (err) {
    console.error('Failed to activate partner:', err);
    res.status(500).json({ error: 'Failed to activate partner' });
  }
}

async function suspend(req, res) {
  try {
    const { suspension_reason } = req.body;
    if (!suspension_reason) return res.status(400).json({ error: 'Suspension reason is required' });
    const partner = await partnerQueries.findById(req.params.id);
    if (!partner) return res.status(404).json({ error: 'Partner not found' });
    if (partner.status !== 'active') {
      return res.status(400).json({ error: 'Only active partners can be suspended' });
    }
    const updated = await partnerQueries.updateStatus(req.params.id, 'suspended', { suspension_reason });
    res.json(updated);
  } catch (err) {
    console.error('Failed to suspend partner:', err);
    res.status(500).json({ error: 'Failed to suspend partner' });
  }
}

async function reactivate(req, res) {
  try {
    const partner = await partnerQueries.findById(req.params.id);
    if (!partner) return res.status(404).json({ error: 'Partner not found' });
    if (partner.status !== 'suspended') {
      return res.status(400).json({ error: 'Only suspended partners can be reactivated' });
    }
    const updated = await partnerQueries.updateStatus(req.params.id, 'active', { suspension_reason: null });
    res.json(updated);
  } catch (err) {
    console.error('Failed to reactivate partner:', err);
    res.status(500).json({ error: 'Failed to reactivate partner' });
  }
}

async function terminate(req, res) {
  try {
    const { termination_reason } = req.body;
    if (!termination_reason) return res.status(400).json({ error: 'Termination reason is required' });
    const partner = await partnerQueries.findById(req.params.id);
    if (!partner) return res.status(404).json({ error: 'Partner not found' });
    if (partner.status === 'terminated') {
      return res.status(400).json({ error: 'Partner is already terminated' });
    }
    const updated = await partnerQueries.updateStatus(req.params.id, 'terminated', { termination_reason });
    res.json(updated);
  } catch (err) {
    console.error('Failed to terminate partner:', err);
    res.status(500).json({ error: 'Failed to terminate partner' });
  }
}

async function stats(req, res) {
  try {
    const data = await partnerQueries.getStats();
    res.json(data);
  } catch (err) {
    console.error('Failed to get partner stats:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
}

// ── Contracts ──

async function listContracts(req, res) {
  try {
    const contracts = await partnerQueries.findContracts(req.params.id);
    res.json(contracts);
  } catch (err) {
    console.error('Failed to list contracts:', err);
    res.status(500).json({ error: 'Failed to fetch contracts' });
  }
}

async function createContract(req, res) {
  try {
    const contract = await partnerQueries.createContract(req.params.id, req.body);
    res.status(201).json(contract);
  } catch (err) {
    console.error('Failed to create contract:', err);
    res.status(500).json({ error: 'Failed to create contract' });
  }
}

async function updateContract(req, res) {
  try {
    const contract = await partnerQueries.updateContract(req.params.contractId, req.body);
    if (!contract) return res.status(404).json({ error: 'Contract not found' });
    res.json(contract);
  } catch (err) {
    console.error('Failed to update contract:', err);
    res.status(500).json({ error: 'Failed to update contract' });
  }
}

// ── Documents ──

async function listDocuments(req, res) {
  try {
    const docs = await partnerQueries.findDocuments(req.params.id);
    res.json(docs);
  } catch (err) {
    console.error('Failed to list documents:', err);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
}

async function uploadDocument(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'File is required' });
    const doc = await partnerQueries.createDocument(req.params.id, {
      document_type: req.body.document_type || 'other',
      document_name: req.body.document_name || req.file.originalname,
      file_url: `/uploads/partners/${req.file.filename}`,
      file_size: req.file.size,
      expiry_date: req.body.expiry_date || null,
      notes: req.body.notes || null,
    });
    res.status(201).json(doc);
  } catch (err) {
    console.error('Failed to upload document:', err);
    res.status(500).json({ error: 'Failed to upload document' });
  }
}

async function verifyDocument(req, res) {
  try {
    const doc = await partnerQueries.verifyDocument(req.params.docId, req.admin.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    res.json(doc);
  } catch (err) {
    console.error('Failed to verify document:', err);
    res.status(500).json({ error: 'Failed to verify document' });
  }
}

async function deleteDocument(req, res) {
  try {
    const doc = await partnerQueries.deleteDocument(req.params.docId);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    res.json({ message: 'Document deleted' });
  } catch (err) {
    console.error('Failed to delete document:', err);
    res.status(500).json({ error: 'Failed to delete document' });
  }
}

async function expiringDocuments(req, res) {
  try {
    const docs = await partnerQueries.findExpiringDocuments(30);
    res.json(docs);
  } catch (err) {
    console.error('Failed to get expiring documents:', err);
    res.status(500).json({ error: 'Failed to fetch expiring documents' });
  }
}

// ── Payouts ──

async function listPayouts(req, res) {
  try {
    const payouts = await partnerQueries.findPayouts(req.params.id);
    res.json(payouts);
  } catch (err) {
    console.error('Failed to list payouts:', err);
    res.status(500).json({ error: 'Failed to fetch payouts' });
  }
}

async function generatePayout(req, res) {
  try {
    const { period_start, period_end } = req.body;
    if (!period_start || !period_end) {
      return res.status(400).json({ error: 'period_start and period_end are required' });
    }
    const preview = await partnerQueries.generatePayoutPreview(req.params.id, period_start, period_end);
    if (preview.error) return res.status(400).json({ error: preview.error });
    res.json(preview);
  } catch (err) {
    console.error('Failed to generate payout preview:', err);
    res.status(500).json({ error: 'Failed to generate payout' });
  }
}

async function createPayout(req, res) {
  try {
    const payout = await partnerQueries.createPayout(req.params.id, {
      ...req.body,
      paid_by: req.admin.id,
    });
    res.status(201).json(payout);
  } catch (err) {
    console.error('Failed to create payout:', err);
    res.status(500).json({ error: 'Failed to create payout' });
  }
}

async function updatePayout(req, res) {
  try {
    const payout = await partnerQueries.updatePayout(req.params.payoutId, {
      ...req.body,
      paid_by: req.admin.id,
    });
    if (!payout) return res.status(404).json({ error: 'Payout not found' });
    res.json(payout);
  } catch (err) {
    console.error('Failed to update payout:', err);
    res.status(500).json({ error: 'Failed to update payout' });
  }
}

// ── Notes ──

async function listNotes(req, res) {
  try {
    const notes = await partnerQueries.findNotes(req.params.id);
    res.json(notes);
  } catch (err) {
    console.error('Failed to list notes:', err);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
}

async function createNote(req, res) {
  try {
    const { content, note_type } = req.body;
    if (!content) return res.status(400).json({ error: 'Content is required' });
    const note = await partnerQueries.createNote(req.params.id, req.admin.id, content, note_type || 'general');
    res.status(201).json(note);
  } catch (err) {
    console.error('Failed to create note:', err);
    res.status(500).json({ error: 'Failed to create note' });
  }
}

// ── Monthly Revenue ──

async function monthlyRevenue(req, res) {
  try {
    const data = await partnerQueries.getMonthlyRevenue(req.params.id);
    res.json(data);
  } catch (err) {
    console.error('Failed to get monthly revenue:', err);
    res.status(500).json({ error: 'Failed to fetch revenue data' });
  }
}

module.exports = {
  list, getById, create, update,
  activate, suspend, reactivate, terminate, stats,
  listContracts, createContract, updateContract,
  listDocuments, uploadDocument, verifyDocument, deleteDocument, expiringDocuments,
  listPayouts, generatePayout, createPayout, updatePayout,
  listNotes, createNote,
  monthlyRevenue,
};
