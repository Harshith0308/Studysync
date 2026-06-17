const mongoose = require('mongoose');

const taskSchema = mongoose.Schema({
  title: { type: String, required: true },
  deadline: { type: Date },
  status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
