const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/groupController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').post(protect, createGroup).get(protect, getMyGroups);
router.post('/join', protect, joinGroup);
router.get('/:id/status', protect, getGroupStatus);
router.post('/:id/requests/:userId/approve', protect, approveJoinRequest);
router.post('/:id/requests/:userId/reject', protect, rejectJoinRequest);
router.get('/:id/messages', protect, getGroupMessages);
router.route('/:id').get(protect, getGroup).delete(protect, deleteGroup);
router.post('/:id/leave', protect, leaveGroup);

module.exports = router;
