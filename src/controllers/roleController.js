const roleQueries = require('../db/roleQueries');
const { PERMISSIONS } = require('../constants/permissions');

const SUPER_ADMIN_NAME = 'Super Admin';

async function list(req, res) {
  try {
    const roles = await roleQueries.findAll();
    res.json(roles);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
}

async function getById(req, res) {
  try {
    const role = await roleQueries.findById(req.params.id);
    if (!role) return res.status(404).json({ error: 'Role not found' });
    res.json(role);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch role' });
  }
}

async function create(req, res) {
  try {
    const { name, description, permissions } = req.body;

    const existing = await roleQueries.findByName(name);
    if (existing) {
      return res.status(409).json({ error: 'A role with this name already exists' });
    }

    const role = await roleQueries.create({ name, description, permissions });
    res.status(201).json(role);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create role' });
  }
}

async function update(req, res) {
  try {
    const role = await roleQueries.findById(req.params.id);
    if (!role) return res.status(404).json({ error: 'Role not found' });

    if (role.name === SUPER_ADMIN_NAME) {
      return res.status(403).json({ error: 'The Super Admin role cannot be edited' });
    }

    if (req.body.name && req.body.name !== role.name) {
      const existing = await roleQueries.findByName(req.body.name);
      if (existing) {
        return res.status(409).json({ error: 'A role with this name already exists' });
      }
    }

    const updated = await roleQueries.update(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update role' });
  }
}

async function remove(req, res) {
  try {
    const role = await roleQueries.findById(req.params.id);
    if (!role) return res.status(404).json({ error: 'Role not found' });

    if (role.name === SUPER_ADMIN_NAME) {
      return res.status(403).json({ error: 'The Super Admin role cannot be deleted' });
    }

    const userCount = await roleQueries.getUserCount(req.params.id);
    if (userCount > 0) {
      return res.status(409).json({
        error: `${userCount} user${userCount !== 1 ? 's are' : ' is'} assigned to this role. Reassign them before deleting.`,
        userCount,
      });
    }

    await roleQueries.remove(req.params.id);
    res.json({ message: 'Role deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete role' });
  }
}

function listPermissions(req, res) {
  res.json(PERMISSIONS);
}

module.exports = { list, getById, create, update, remove, listPermissions };
