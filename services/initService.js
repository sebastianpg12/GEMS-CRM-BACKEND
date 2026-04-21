const User = require('../models/User');
const Role = require('../models/Role');

async function ensureSupportUser() {
  try {
    const supportEmail = process.env.SUPPORT_EMAIL || 'soporte@gems.cr';
    const existing = await User.findOne({ email: supportEmail });

    if (existing) {
      console.log(`[Init] Support user verified: ${existing.name} (${supportEmail}) - Status: ${existing.isActive ? 'Active' : 'Inactive'} - Role: ${existing.role}`);
      return;
    }

    console.log(`[Init] Creating default support user: ${supportEmail}...`);
    const supportUser = new User({
      name: 'Soporte GEMS',
      email: supportEmail,
      password: process.env.SUPPORT_PASSWORD || 'Support.2024!',
      role: 'support',
      department: 'Soporte Técnico',
      position: 'Support Manager',
      isActive: true
    });

    await supportUser.save();
    console.log(`[Init] Default support user created successfully.`);
  } catch (err) {
    console.error('[Init] CRITICAL ERROR ensuring support user:', err);
  }
}

async function ensureDefaultRoles() {
  const defaultRoles = [
    {
      name: 'Administrador',
      description: 'Acceso total al sistema',
      isSystem: true,
      permissions: {
        dashboard: true,
        clients: { view: true, create: true, edit: true, delete: true },
        activities: { view: true, create: true, edit: true, delete: true },
        reports: { view: true, export: true },
        accounting: { view: true, create: true, edit: true, delete: true },
        cases: { view: true, create: true, edit: true, delete: true },
        team: { view: true, create: true, edit: true, delete: true }
      }
    },
    {
      name: 'Manager',
      description: 'Gestión de equipos y clientes, sin eliminar',
      isSystem: true,
      permissions: {
        dashboard: true,
        clients: { view: true, create: true, edit: true, delete: false },
        activities: { view: true, create: true, edit: true, delete: false },
        reports: { view: true, export: true },
        accounting: { view: true, create: true, edit: true, delete: false },
        cases: { view: true, create: true, edit: true, delete: false },
        team: { view: true, create: true, edit: true, delete: false }
      }
    },
    {
      name: 'Vendedor',
      description: 'Gestión de ventas y prospectos',
      isSystem: true,
      permissions: {
        dashboard: true,
        clients: { view: true, create: true, edit: true, delete: false },
        activities: { view: true, create: true, edit: true, delete: true },
        reports: { view: false, export: false },
        accounting: { view: false, create: false, edit: false, delete: false },
        cases: { view: true, create: true, edit: false, delete: false },
        team: { view: true, create: false, edit: false, delete: false }
      }
    },
    {
      name: 'Soporte',
      description: 'Resolución de casos y tickets',
      isSystem: true,
      permissions: {
        dashboard: true,
        clients: { view: true, create: false, edit: false, delete: false },
        activities: { view: true, create: true, edit: true, delete: true },
        reports: { view: false, export: false },
        accounting: { view: false, create: false, edit: false, delete: false },
        cases: { view: true, create: true, edit: true, delete: true },
        team: { view: true, create: false, edit: false, delete: false }
      }
    }
  ];

  try {
    for (const roleDef of defaultRoles) {
      const existingRole = await Role.findOne({ name: roleDef.name });
      if (!existingRole) {
        await Role.create(roleDef);
        console.log(`[Init] Created default role: ${roleDef.name}`);
      }
    }
  } catch (err) {
    console.error('[Init] Error ensuring default roles:', err);
  }
}

module.exports = { ensureSupportUser, ensureDefaultRoles };
