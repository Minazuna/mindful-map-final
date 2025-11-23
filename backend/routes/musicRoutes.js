const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const musicController = require('../controllers/musicController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Public routes
router.get('/categories', musicController.getMusicCategories);
router.get('/category/:category', musicController.getMusicByCategory);
router.get('/', musicController.getAllMusic);
router.get('/:id', musicController.getMusicById);
router.post('/:id/play', musicController.incrementPlayCount);

// Protected routes (require authentication)
router.post('/', authMiddleware, musicController.createMusic);
router.put('/:id', authMiddleware, musicController.updateMusic);
router.delete('/:id', authMiddleware, musicController.deleteMusic);
router.post('/:id/favorite', authMiddleware, musicController.addToFavorites);
router.delete('/:id/favorite', authMiddleware, musicController.removeFromFavorites);
router.get('/user/favorites', authMiddleware, musicController.getFavorites);

module.exports = router;