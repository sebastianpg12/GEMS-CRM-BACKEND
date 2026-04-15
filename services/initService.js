const User = require('../models/User');

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

module.exports = { ensureSupportUser };
