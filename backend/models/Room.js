const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomCode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  leader: {
    type: String,
    required: true
  },
  players: [{
    type: String,
    required: true
  }],
  isPrivate: {
    type: Boolean,
    default: false
  },
  gameState: {
    players: [{
      name: String,
      hand: [String]
    }],
    centerStack: [String],
    currentTurnPlayer: String,
    centerCard: String
  },
  isGameActive: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // Auto-delete after 24 hours
  }
});

module.exports = mongoose.model('Room', roomSchema); 