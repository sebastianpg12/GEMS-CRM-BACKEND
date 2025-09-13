const mongoose = require('mongoose')

const MessageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
})

const ProspectConversationSchema = new mongoose.Schema({
  prospectName: { type: String, required: true },
  company: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  messages: [MessageSchema],
  lastUpdated: { type: Date, default: Date.now }
})

module.exports = mongoose.model('ProspectConversation', ProspectConversationSchema)
