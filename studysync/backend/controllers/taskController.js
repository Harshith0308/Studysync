const Task = require('../models/Task');
const Group = require('../models/Group');

// @desc    Create task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res) => {
  const { title, deadline, groupId } = req.body;

  const group = await Group.findById(groupId);
  if (!group) {
      return res.status(404).json({ message: 'Group not found' });
  }
  
  const isMember = group.members.some((m) => m.toString() === req.user.id);
  const isCreator = group.createdBy.toString() === req.user.id;
  if (!isMember && !isCreator && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized' });
  }

  const task = await Task.create({
    title,
    deadline,
    group: groupId,
    createdBy: req.user.id,
  });

  res.status(201).json(task);
};

// @desc    Get tasks for a group
// @route   GET /api/tasks/:groupId
// @access  Private
const getTasks = async (req, res) => {
  const group = await Group.findById(req.params.groupId).select('members createdBy');
  if (!group) {
    return res.status(404).json({ message: 'Group not found' });
  }

  const isMember = group.members.some((m) => m.toString() === req.user.id);
  const isCreator = group.createdBy.toString() === req.user.id;
  if (!isMember && !isCreator && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized' });
  }

  const tasks = await Task.find({ group: req.params.groupId })
      .sort({ deadline: 1 }); // Sort by deadline ascending

  res.status(200).json(tasks);
};

// @desc    Update task status
// @route   PUT /api/tasks/:id
// @access  Private
const updateTaskStatus = async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  const group = await Group.findById(task.group).select('members createdBy');
  if (!group) {
    return res.status(404).json({ message: 'Group not found' });
  }

  const isMember = group.members.some((m) => m.toString() === req.user.id);
  const isCreator = group.createdBy.toString() === req.user.id;
  if (!isMember && !isCreator && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized' });
  }

  task.status = req.body.status;
  await task.save();

  res.status(200).json(task);
};

module.exports = {
  createTask,
  getTasks,
  updateTaskStatus,
};
