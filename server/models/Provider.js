const mongoose = require('mongoose');

const providerSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
    unique: true,
  },
  availableSpace: {
    type: Number,
    required: true,
  },
  pricePerGB: {
    type: Number,
    required: true,
  },
});

const Provider = mongoose.model('Provider', providerSchema);

module.exports = Provider;
