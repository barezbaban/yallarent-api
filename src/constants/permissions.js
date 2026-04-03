const PERMISSIONS = {
  Dashboard: {
    'dashboard.view': 'View Dashboard',
  },
  Bookings: {
    'bookings.view': 'View Bookings',
    'bookings.edit': 'Edit Bookings',
    'bookings.cancel': 'Cancel Bookings',
    'bookings.refund': 'Refund Bookings',
  },
  Cars: {
    'cars.view': 'View Cars',
    'cars.add': 'Add Cars',
    'cars.edit': 'Edit Cars',
    'cars.delete': 'Delete Cars',
    'cars.availability': 'Manage Car Availability',
  },
  Customers: {
    'customers.view': 'View Customers',
    'customers.edit': 'Edit Customers',
    'customers.block': 'Block Customers',
  },
  'Rental Companies': {
    'companies.view': 'View Companies',
    'companies.add': 'Add Companies',
    'companies.edit': 'Edit Companies',
    'companies.suspend': 'Suspend Companies',
  },
  Payments: {
    'payments.view': 'View Payments',
    'payments.refund': 'Refund Payments',
    'payments.reports': 'View Payment Reports',
  },
  Promotions: {
    'promotions.view': 'View Promotions',
    'promotions.create': 'Create Promotions',
    'promotions.edit': 'Edit Promotions',
    'promotions.delete': 'Delete Promotions',
  },
  'Support Tickets': {
    'support.view': 'View Support Tickets',
    'support.respond': 'Respond to Tickets',
    'support.escalate': 'Escalate Tickets',
    'support.close': 'Close Tickets',
  },
  Reports: {
    'reports.view': 'View Reports',
    'reports.export': 'Export Reports',
  },
  Settings: {
    'settings.view': 'View Settings',
    'settings.edit': 'Edit Settings',
  },
  'User Management': {
    'users.view': 'View Users',
    'users.create': 'Create Users',
    'users.edit': 'Edit Users',
    'users.deactivate': 'Deactivate Users',
    'roles.view': 'View Roles',
    'roles.create': 'Create Roles',
    'roles.edit': 'Edit Roles',
    'roles.delete': 'Delete Roles',
  },
};

// Flat list of all permission keys
const ALL_PERMISSION_KEYS = Object.values(PERMISSIONS).flatMap(Object.keys);

module.exports = { PERMISSIONS, ALL_PERMISSION_KEYS };
