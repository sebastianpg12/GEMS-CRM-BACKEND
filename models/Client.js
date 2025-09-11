const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema(
  {
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    pinned: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const ServiceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    plan: String,
    status: { type: String, enum: ['active', 'paused', 'cancelled', 'trial'], default: 'active' },
    startDate: Date,
    endDate: Date,
    notes: String
  },
  { timestamps: true }
);

const CommitmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    dueDate: Date,
    status: { type: String, enum: ['pending', 'in_progress', 'completed', 'cancelled'], default: 'pending' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

const PreferenceSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    value: { type: String, default: '' }
  },
  { _id: true }
);

const CustomFieldSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    value: { type: mongoose.Schema.Types.Mixed },
    type: { type: String, enum: ['string', 'number', 'boolean', 'date', 'json'], default: 'string' }
  },
  { _id: true }
);

const ClientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: String,
    phone: String,
    company: String,
    tags: [String],
    profile: {
      about: String,
      address: String,
      website: String,
      industry: String,
      size: String,
      location: String,
      socials: {
        linkedin: String,
        twitter: String,
        facebook: String,
        instagram: String
      }
    },
    services: [ServiceSchema],
    preferences: [PreferenceSchema],
    commitments: [CommitmentSchema],
    notes: [NoteSchema],
    customFields: [CustomFieldSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Client', ClientSchema);
