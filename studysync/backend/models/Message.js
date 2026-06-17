const mongoose = require('mongoose');

const messageSchema = mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  content: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
