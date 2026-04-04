const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const backofficeAuth = require('../middleware/backofficeAuth');
const requirePermission = require('../middleware/requirePermission');
const partnerController = require('../controllers/partnerController');

const router = Router();

// ── File upload config for partner documents ──
const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'partners');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const partnerUpload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPG, PNG, and PDF files are allowed'), false);
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// ── Stats (must be before /:id) ──
router.get('/stats', backofficeAuth, requirePermission('companies.view'), partnerController.stats);

// ── Expiring documents ──
router.get('/documents/expiring', backofficeAuth, requirePermission('companies.view'), partnerController.expiringDocuments);

// ── Partners CRUD ──
router.get('/', backofficeAuth, requirePermission('companies.view'), partnerController.list);
router.post('/', backofficeAuth, requirePermission('companies.add'), partnerController.create);
router.get('/:id', backofficeAuth, requirePermission('companies.view'), partnerController.getById);
router.put('/:id', backofficeAuth, requirePermission('companies.edit'), partnerController.update);

// ── Status changes ──
router.put('/:id/activate', backofficeAuth, requirePermission('companies.edit'), partnerController.activate);
router.put('/:id/suspend', backofficeAuth, requirePermission('companies.suspend'), partnerController.suspend);
router.put('/:id/reactivate', backofficeAuth, requirePermission('companies.edit'), partnerController.reactivate);
router.put('/:id/terminate', backofficeAuth, requirePermission('companies.suspend'), partnerController.terminate);

// ── Contracts ──
router.get('/:id/contracts', backofficeAuth, requirePermission('companies.view'), partnerController.listContracts);
router.post('/:id/contracts', backofficeAuth, requirePermission('companies.edit'), partnerController.createContract);
router.put('/:id/contracts/:contractId', backofficeAuth, requirePermission('companies.edit'), partnerController.updateContract);

// ── Documents ──
router.get('/:id/documents', backofficeAuth, requirePermission('companies.view'), partnerController.listDocuments);
router.post('/:id/documents', backofficeAuth, requirePermission('companies.edit'), partnerUpload.single('file'), partnerController.uploadDocument);
router.put('/:id/documents/:docId/verify', backofficeAuth, requirePermission('companies.edit'), partnerController.verifyDocument);
router.delete('/:id/documents/:docId', backofficeAuth, requirePermission('companies.edit'), partnerController.deleteDocument);

// ── Payouts ──
router.get('/:id/payouts', backofficeAuth, requirePermission('payments.view'), partnerController.listPayouts);
router.post('/:id/payouts/generate', backofficeAuth, requirePermission('payments.view'), partnerController.generatePayout);
router.post('/:id/payouts', backofficeAuth, requirePermission('payments.refund'), partnerController.createPayout);
router.put('/:id/payouts/:payoutId', backofficeAuth, requirePermission('payments.refund'), partnerController.updatePayout);

// ── Notes ──
router.get('/:id/notes', backofficeAuth, requirePermission('companies.view'), partnerController.listNotes);
router.post('/:id/notes', backofficeAuth, requirePermission('companies.edit'), partnerController.createNote);

// ── Monthly Revenue ──
router.get('/:id/revenue', backofficeAuth, requirePermission('payments.view'), partnerController.monthlyRevenue);

module.exports = router;
