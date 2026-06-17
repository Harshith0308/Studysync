const Group = require('../models/Group');
const User = require('../models/User');
const Message = require('../models/Message');

// Simple random string generator for join code
const generateJoinCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// @desc    Create new group
// @route   POST /api/groups
// @access  Private
const createGroup = async (req, res) => {
  const { title, subject, description } = req.body;

  if (!title || !subject) {
    return res.status(400).json({ message: 'Please add all fields' });
  }

  const joinCode = generateJoinCode();

  const group = await Group.create({
    title,
    subject,
    description,
    joinCode,
    createdBy: req.user.id,
    members: [req.user.id],
  });

  // Add group to user's joinedGroups
  await User.findByIdAndUpdate(req.user.id, {
    $push: { joinedGroups: group._id },
  });

  res.status(201).json(group);
};

// @desc    Get user groups
// @route   GET /api/groups
// @access  Private
const getMyGroups = async (req, res) => {
  const user = await User.findById(req.user.id).populate({
    path: 'joinedGroups',
    populate: { path: 'createdBy', select: 'name email' }
  });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.status(200).json(user.joinedGroups);
};

// @desc    Get single group
// @route   GET /api/groups/:id
// @access  Private
const getGroup = async (req, res) => {
  const group = await Group.findById(req.params.id)
    .populate('members', 'name email')
    .populate('createdBy', 'name');

  if (!group) {
    return res.status(404).json({ message: 'Group not found' });
  }

  const isMember = group.members.some((member) => member._id.toString() === req.user.id);
  const isCreator = group.createdBy?._id?.toString() === req.user.id || group.createdBy?.toString?.() === req.user.id;
  if (!isMember && !isCreator && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized' });
  }

  res.status(200).json(group);
};

const getGroupStatus = async (req, res) => {
  const group = await Group.findById(req.params.id)
    .populate('createdBy', 'name email')
    .populate('members', 'name email')
    .populate('joinRequests.user', 'name email');

  if (!group) {
    return res.status(404).json({ message: 'Group not found' });
  }

  const isCreator = group.createdBy?._id?.toString() === req.user.id;
  const isMember = group.members.some((m) => m._id.toString() === req.user.id);
  const isPending = group.joinRequests.some((r) => r.user?._id?.toString() === req.user.id);

  if (!isCreator && !isMember && !isPending && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized' });
  }

  const status = isCreator ? 'creator' : isMember ? 'member' : isPending ? 'pending' : 'none';

  res.status(200).json({
    status,
    group: {
      _id: group._id,
      title: group.title,
      subject: group.subject,
      description: group.description,
      joinCode: isCreator || req.user.role === 'admin' ? group.joinCode : undefined,
      createdBy: group.createdBy,
      members: group.members
    },
    joinRequests: isCreator || req.user.role === 'admin' ? group.joinRequests : []
  });
};

// @desc    Join group
// @route   POST /api/groups/join
// @access  Private
const joinGroup = async (req, res) => {
  const { joinCode } = req.body;

  if (!joinCode) {
    return res.status(400).json({ message: 'Invite code is required' });
  }

  const group = await Group.findOne({ joinCode });

  if (!group) {
    return res.status(404).json({ message: 'Invalid join code' });
  }

  const isMember = group.members.some((m) => m.toString() === req.user.id);
  if (isMember) {
    return res.status(400).json({ message: 'Already a member' });
  }

  const isCreator = group.createdBy.toString() === req.user.id;
  if (isCreator) {
    const alreadyMember = group.members.some((m) => m.toString() === req.user.id);
    if (!alreadyMember) {
      group.members.push(req.user.id);
      await group.save();
    }
    await User.findByIdAndUpdate(req.user.id, { $addToSet: { joinedGroups: group._id } });
    return res.status(200).json({ status: 'member', groupId: group._id });
  }

  const alreadyRequested = group.joinRequests.some((r) => r.user.toString() === req.user.id);
  if (!alreadyRequested) {
    group.joinRequests.push({ user: req.user.id });
    await group.save();
  }

  res.status(200).json({ status: 'pending', groupId: group._id });
};

// @desc    Leave group
// @route   POST /api/groups/:id/leave
// @access  Private
const leaveGroup = async (req, res) => {
    const group = await Group.findById(req.params.id);

    if (!group) {
        return res.status(404).json({ message: 'Group not found' });
    }

    // Remove user from group members
    group.members = group.members.filter(member => member.toString() !== req.user.id);
    await group.save();

    // Remove group from user joinedGroups
    await User.findByIdAndUpdate(req.user.id, {
        $pull: { joinedGroups: group._id }
    });

    res.status(200).json({ message: 'Left group successfully' });
}

const approveJoinRequest = async (req, res) => {
  const { id, userId } = req.params;
  const group = await Group.findById(id);

  if (!group) {
    return res.status(404).json({ message: 'Group not found' });
  }

  const isCreator = group.createdBy.toString() === req.user.id;
  if (!isCreator && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized' });
  }

  const hadRequest = group.joinRequests.some((r) => r.user.toString() === userId);
  if (!hadRequest) {
    return res.status(400).json({ message: 'No pending request for this user' });
  }

  group.joinRequests = group.joinRequests.filter((r) => r.user.toString() !== userId);
  const alreadyMember = group.members.some((m) => m.toString() === userId);
  if (!alreadyMember) {
    group.members.push(userId);
  }
  await group.save();

  await User.findByIdAndUpdate(userId, { $addToSet: { joinedGroups: group._id } });

  res.status(200).json({ message: 'Request approved' });
};

const rejectJoinRequest = async (req, res) => {
  const { id, userId } = req.params;
  const group = await Group.findById(id);

  if (!group) {
    return res.status(404).json({ message: 'Group not found' });
  }

  const isCreator = group.createdBy.toString() === req.user.id;
  if (!isCreator && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized' });
  }

  group.joinRequests = group.joinRequests.filter((r) => r.user.toString() !== userId);
  await group.save();

  res.status(200).json({ message: 'Request rejected' });
};

// @desc    Delete group
// @route   DELETE /api/groups/:id
// @access  Private (Admin or Owner)
const deleteGroup = async (req, res) => {
  const group = await Group.findById(req.params.id);

  if (!group) {
    return res.status(404).json({ message: 'Group not found' });
  }

  if (group.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(401).json({ message: 'Not authorized' });
  }

  await group.deleteOne();
  
  // Remove from all users
  await User.updateMany(
      { joinedGroups: group._id },
      { $pull: { joinedGroups: group._id } }
  );

  res.status(200).json({ id: req.params.id });
};

// @desc    Get group messages
// @route   GET /api/groups/:id/messages
// @access  Private
const getGroupMessages = async (req, res) => {
  const group = await Group.findById(req.params.id).select('members createdBy');
  if (!group) {
    return res.status(404).json({ message: 'Group not found' });
  }

  const isMember = group.members.some((m) => m.toString() === req.user.id);
  const isCreator = group.createdBy.toString() === req.user.id;
  if (!isMember && !isCreator && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized' });
  }

  const messages = await Message.find({ group: req.params.id })
    .populate('sender', 'name')
    .sort({ createdAt: 1 });
  res.status(200).json(messages);
};

module.exports = {
  createGroup,
  getMyGroups,
  getGroup,
  getGroupStatus,
  joinGroup,
  leaveGroup,
  approveJoinRequest,
  rejectJoinRequest,
  deleteGroup,
  getGroupMessages,
};
