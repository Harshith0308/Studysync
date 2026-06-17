const express = require('express');
const router = express.Router();
const {
  uploadNote,
  getNotes,
  deleteNote,
} = require('../controllers/noteController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post(
  '/',
  protect,
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: err.message || String(err) });
      }
      next();
    });
  },
  uploadNote
);
router.get('/:groupId', protect, getNotes);
router.delete('/:id', protect, deleteNote);

module.exports = router;
