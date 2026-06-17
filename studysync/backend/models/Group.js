const mongoose = require('mongoose');

const groupSchema = mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  description: { type: String },
  joinCode: { type: String, required: true, unique: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  joinRequests: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      requestedAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Group', groupSchema);
