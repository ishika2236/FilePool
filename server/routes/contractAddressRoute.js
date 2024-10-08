const express = require('express');
const router = express.Router();
const { address } = require('../contractAddress');

router.get('/', (req, res) => {
  res.json({ address });
});

module.exports = router;