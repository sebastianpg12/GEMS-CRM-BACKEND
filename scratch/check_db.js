const mongoose = require('mongoose');
const User = require('../models/User');
const Role = require('../models/Role');
require('dotenv').config();

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    
    const users = await User.find().select('name email role');
    console.log('Users:', JSON.stringify(users, null, 2));
    
    const roles = await Role.find();
    console.log('Roles:', JSON.stringify(roles, null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
