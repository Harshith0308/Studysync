const express = require('express');
const router = express.Router();
const {
  getUsers,
  deleteUser,
  getAllGroups,
  getStats
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/roleMiddleware');

router.get('/users', protect, admin, getUsers);
router.delete('/users/:id', protect, admin, deleteUser);
router.get('/groups', protect, admin, getAllGroups);
router.get('/stats', protect, admin, getStats);

module.exports = router;
