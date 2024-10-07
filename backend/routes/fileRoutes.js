const express = require('express');
const multer = require('multer');
const { uploadFile, getAvailableSpace } = require('../controllers/fileController');
const auth = require('../middleware/authMiddleware');

const router = express.Router();
const upload = multer({ dest: 'uploads/' }); // Destination folder for uploaded files

router.post('/upload', upload.single('file'), uploadFile);
router.get('/available-space', getAvailableSpace);

module.exports = router;
