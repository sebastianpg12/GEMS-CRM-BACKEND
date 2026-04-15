const User = require('../models/User');

async function ensureSupportUser() {
  try {
    const supportEmail = process.env.SUPPORT_EMAIL || 'soporte@gems.cr';
    const existing = await User.findOne({ email: supportEmail });

    if (existing) {
      console.log(`[Init] Support user already exists (${supportEmail})`);
      return;
    }

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
    console.log(`[Init] Support user created successfully: ${supportEmail}`);
  } catch (err) {
    console.error('[Init] Error creating support user:', err.message);
  }
}

module.exports = { ensureSupportUser };
