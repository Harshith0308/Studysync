const Group = require('../models/Group');
const Message = require('../models/Message');
const Note = require('../models/Note');
const Task = require('../models/Task');
const { askAI } = require('../services/aiService');

const handleAskAI = async (req, res) => {
  const { groupId, question } = req.body || {};

  if (!question || typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({ message: 'Question is required' });
  }

  let group = null;
  if (groupId) {
    group = await Group.findById(groupId).lean();
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const isMember = (group.members || []).some(
      (m) => m.toString() === req.user.id
    );
    if (!isMember && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized for this group' });
    }
  }

  const messages = groupId
    ? await Message.find({ group: groupId })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('sender', 'name')
        .lean()
    : [];

  const tasks = groupId
    ? await Task.find({ group: groupId })
        .sort({ deadline: 1 })
        .limit(20)
        .lean()
    : [];

  const notes = groupId
    ? await Note.find({ group: groupId })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean()
    : [];

  const context = {
    group: group
      ? {
          id: group._id,
          title: group.title,
          subject: group.subject,
          description: group.description,
        }
      : null,
    tasks: tasks.map((t) => ({
      id: t._id,
      title: t.title,
      deadline: t.deadline,
      status: t.status,
    })),
    notes: notes.map((n) => ({
      id: n._id,
      title: n.title,
      createdAt: n.createdAt,
    })),
    recentMessages: messages
      .reverse()
      .map((m) => ({
        sender: m.sender?.name || 'Unknown',
        content: m.content,
        createdAt: m.createdAt,
      })),
  };

  try {
    const answer = await askAI({ question: question.trim(), context });
    return res.status(200).json({ answer });
  } catch (error) {
    return res.status(502).json({ message: error.message || 'AI request failed' });
  }
};

module.exports = { askAI: handleAskAI };
