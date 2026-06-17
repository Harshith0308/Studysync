const User = require('../models/User');
const Group = require('../models/Group');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  const users = await User.find({});
  res.status(200).json(users);
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    await user.deleteOne();
    res.json({ message: 'User removed' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
};

// @desc    Get all groups
// @route   GET /api/admin/groups
// @access  Private/Admin
const getAllGroups = async (req, res) => {
    const groups = await Group.find().populate('createdBy', 'name email');
    res.status(200).json(groups);
};

// @desc    Get stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getStats = async (req, res) => {
    const userCount = await User.countDocuments();
    const groupCount = await Group.countDocuments();
    
    res.status(200).json({
        userCount,
        groupCount
    });
};

module.exports = {
  getUsers,
  deleteUser,
  getAllGroups,
  getStats,
};
