const mongoose = require('mongoose');

const noteSchema = mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  filePath: { type: String, required: true },
  originalName: { type: String },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' }
}, { timestamps: true });

module.exports = mongoose.model('Note', noteSchema);
