const File = require('../models/File');
const checkDiskSpace = require('check-disk-space').default;

exports.uploadFile = (req, res) => {
  const file = req.file; // req.file contains the uploaded file's data
  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Optionally save file metadata in MongoDB
  const newFile = new File({
    filename: file.originalname,
    path: file.path,
    size: file.size,
    uploadedBy: req.user ? req.user._id : null, // Add user reference if authentication is used
  });

  newFile.save()
    .then(() => res.status(200).json({ message: 'File uploaded successfully', file }))
    .catch((error) => res.status(500).json({ error: error.message }));
};

// Method to check available space
exports.getAvailableSpace = async (req, res) => {
  try {
    const path = '/'; // For Linux/macOS
    const diskSpace = await checkDiskSpace(path);

    res.json({
      freeSpace: diskSpace.free, // Available free space in bytes
      totalSpace: diskSpace.size, // Total space in bytes
      pathUsed: diskSpace.path    // Path you checked the disk space for
    });
  } catch (error) {
    res.status(500).json({ error: 'Could not retrieve disk space information.' });
  }
};
