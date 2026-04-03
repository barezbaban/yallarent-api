const { Router } = require('express');
const backofficeAuth = require('../middleware/backofficeAuth');
const requirePermission = require('../middleware/requirePermission');
const validate = require('../middleware/validate');
const schemas = require('../schemas');
const backofficeAuthController = require('../controllers/backofficeAuthController');
const roleController = require('../controllers/roleController');
const backofficeUserController = require('../controllers/backofficeUserController');

const router = Router();

// ── Auth ──
router.post('/auth/login', validate({ body: schemas.backofficeLogin }), backofficeAuthController.login);
router.get('/auth/me', backofficeAuth, backofficeAuthController.me);

// ── Roles ──
router.get('/roles', backofficeAuth, requirePermission('roles.view'), roleController.list);
router.get('/roles/permissions', backofficeAuth, requirePermission('roles.view'), roleController.listPermissions);
router.get('/roles/:id', backofficeAuth, requirePermission('roles.view'), validate({ params: schemas.uuidParam }), roleController.getById);
router.post('/roles', backofficeAuth, requirePermission('roles.create'), validate({ body: schemas.createRole }), roleController.create);
router.put('/roles/:id', backofficeAuth, requirePermission('roles.edit'), validate({ params: schemas.uuidParam, body: schemas.updateRole }), roleController.update);
router.delete('/roles/:id', backofficeAuth, requirePermission('roles.delete'), validate({ params: schemas.uuidParam }), roleController.remove);

// ── Users ──
router.get('/users', backofficeAuth, requirePermission('users.view'), backofficeUserController.list);
router.get('/users/:id', backofficeAuth, requirePermission('users.view'), validate({ params: schemas.uuidParam }), backofficeUserController.getById);
router.post('/users', backofficeAuth, requirePermission('users.create'), validate({ body: schemas.createBackofficeUser }), backofficeUserController.create);
router.put('/users/:id', backofficeAuth, requirePermission('users.edit'), validate({ params: schemas.uuidParam, body: schemas.updateBackofficeUser }), backofficeUserController.update);
router.post('/users/:id/reset-password', backofficeAuth, requirePermission('users.edit'), validate({ params: schemas.uuidParam }), backofficeUserController.resetPassword);

module.exports = router;
