const backofficeUserQueries = require('../db/backofficeUserQueries');

function requirePermission(permissionKey) {
  return async (req, res, next) => {
    try {
      if (!req.admin || !req.admin.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Superadmin bypasses all permission checks
      if (req.admin.role === 'superadmin' || req.admin.role === 'admin') {
        return next();
      }

      // If permissions were included in the JWT payload, use them directly
      if (req.admin.permissions) {
        if (req.admin.permissions[permissionKey] === true) {
          return next();
        }
        return res.status(403).json({ error: "You don't have permission to perform this action." });
      }

      // Fallback: fetch from DB
      const user = await backofficeUserQueries.findById(req.admin.id);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      if (!user.is_active) {
        return res.status(403).json({ error: 'Account is deactivated' });
      }

      // Cache permissions on request
      req.admin.permissions = user.permissions || {};
      req.admin.roleName = user.role_name;

      if (user.permissions && user.permissions[permissionKey] === true) {
        return next();
      }

      return res.status(403).json({ error: "You don't have permission to perform this action." });
    } catch (err) {
      return res.status(500).json({ error: 'Permission check failed' });
    }
  };
}

module.exports = requirePermission;
