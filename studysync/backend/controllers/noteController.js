const Note = require('../models/Note');
const Group = require('../models/Group');
const fs = require('fs');

// @desc    Upload a note
// @route   POST /api/notes
// @access  Private
const uploadNote = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Please upload a file' });
  }

  const { title, description, groupId } = req.body;
  if (!title || !groupId) {
    return res.status(400).json({ message: 'Title and groupId are required' });
  }
  
  const group = await Group.findById(groupId);
  if (!group) {
      return res.status(404).json({ message: 'Group not found' });
  }

  const isMember = group.members.some((m) => m.toString() === req.user.id);
  const isCreator = group.createdBy.toString() === req.user.id;
  if (!isMember && !isCreator && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized' });
  }

  const note = await Note.create({
    title,
    description,
    filePath: req.file.path,
    originalName: req.file.originalname,
    uploadedBy: req.user.id,
    group: groupId,
  });

  res.status(201).json(note);
};

// @desc    Get notes for a group
// @route   GET /api/notes/:groupId
// @access  Private
const getNotes = async (req, res) => {
  const group = await Group.findById(req.params.groupId).select('members createdBy');
  if (!group) {
    return res.status(404).json({ message: 'Group not found' });
  }

  const isMember = group.members.some((m) => m.toString() === req.user.id);
  const isCreator = group.createdBy.toString() === req.user.id;
  if (!isMember && !isCreator && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized' });
  }

  const notes = await Note.find({ group: req.params.groupId })
    .populate('uploadedBy', 'name');

  res.status(200).json(notes);
};

// @desc    Delete note
// @route   DELETE /api/notes/:id
// @access  Private
const deleteNote = async (req, res) => {
  const note = await Note.findById(req.params.id);

  if (!note) {
    return res.status(404).json({ message: 'Note not found' });
  }

  // Check ownership or admin
  if (note.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(401).json({ message: 'Not authorized' });
  }

  // Delete file from filesystem
  fs.unlink(note.filePath, (err) => {
      if (err) console.error(err);
  });

  await note.deleteOne();

  res.status(200).json({ id: req.params.id });
};

module.exports = {
  uploadNote,
  getNotes,
  deleteNote,
};
