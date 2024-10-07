// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  storageSpace: { type: Number, required: true },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
