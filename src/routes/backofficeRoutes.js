const { Router } = require('express');
const backofficeAuth = require('../middleware/backofficeAuth');
const requirePermission = require('../middleware/requirePermission');
const { validate, validateParams } = require('../middleware/validate');
const schemas = require('../schemas');
const backofficeAuthController = require('../controllers/backofficeAuthController');
const roleController = require('../controllers/roleController');
const backofficeUserController = require('../controllers/backofficeUserController');

const router = Router();

// ── Auth ──
router.post('/auth/login', validate(schemas.backofficeLogin), backofficeAuthController.login);
router.get('/auth/me', backofficeAuth, backofficeAuthController.me);
router.post('/auth/change-password', backofficeAuth, validate(schemas.changePassword), backofficeAuthController.changePassword);

// ── Roles ──
router.get('/roles', backofficeAuth, requirePermission('roles.view'), roleController.list);
router.get('/roles/permissions', backofficeAuth, requirePermission('roles.view'), roleController.listPermissions);
router.get('/roles/:id', backofficeAuth, requirePermission('roles.view'), validateParams(schemas.uuidParam), roleController.getById);
router.post('/roles', backofficeAuth, requirePermission('roles.create'), validate(schemas.createRole), roleController.create);
router.put('/roles/:id', backofficeAuth, requirePermission('roles.edit'), validateParams(schemas.uuidParam), validate(schemas.updateRole), roleController.update);
router.delete('/roles/:id', backofficeAuth, requirePermission('roles.delete'), validateParams(schemas.uuidParam), roleController.remove);

// ── Users ──
router.get('/users', backofficeAuth, requirePermission('users.view'), backofficeUserController.list);
router.get('/users/:id', backofficeAuth, requirePermission('users.view'), validateParams(schemas.uuidParam), backofficeUserController.getById);
router.post('/users', backofficeAuth, requirePermission('users.create'), validate(schemas.createBackofficeUser), backofficeUserController.create);
router.put('/users/:id', backofficeAuth, requirePermission('users.edit'), validateParams(schemas.uuidParam), validate(schemas.updateBackofficeUser), backofficeUserController.update);
router.post('/users/:id/reset-password', backofficeAuth, requirePermission('users.edit'), validateParams(schemas.uuidParam), backofficeUserController.resetPassword);

module.exports = router;
