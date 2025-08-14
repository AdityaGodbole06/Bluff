const Room = require('./models/Room');

class RoomService {
  // Create a new room
  static async createRoom(roomCode, playerName, isPrivate = false, roomName = null) {
    try {
      const room = new Room({
        roomCode,
        leader: playerName,
        players: [playerName],
        isPrivate,
        roomName: roomName || `Room ${roomCode}`
      });
      await room.save();
      return room;
    } catch (error) {
      throw error;
    }
  }

  // Get all public rooms
  static async getPublicRooms() {
    try {
      const rooms = await Room.find({ 
        isPrivate: false, 
        isGameActive: false 
      }).select('roomCode roomName leader players createdAt');
      return rooms;
    } catch (error) {
      throw error;
    }
  }

  // Join a room
  static async joinRoom(roomCode, playerName) {
    try {
      const room = await Room.findOne({ roomCode });
      if (!room) {
        throw new Error('Room not found');
      }

      // Check for duplicate name (case-insensitive)
      const nameExists = room.players.some(
        name => name.trim().toLowerCase() === playerName.trim().toLowerCase()
      );
      if (nameExists) {
        throw new Error('A player with that name already exists in this room.');
      }

      room.players.push(playerName);
      await room.save();
      return room;
    } catch (error) {
      throw error;
    }
  }

  // Get room by room code
  static async getRoom(roomCode) {
    try {
      const room = await Room.findOne({ roomCode });
      return room;
    } catch (error) {
      throw error;
    }
  }

  // Update game state
  static async updateGameState(roomCode, gameState) {
    try {
      const room = await Room.findOne({ roomCode });
      if (!room) {
        throw new Error('Room not found');
      }

      room.gameState = gameState;
      room.isGameActive = true;
      await room.save();
      return room;
    } catch (error) {
      throw error;
    }
  }

  // Remove player from room
  static async removePlayer(roomCode, playerName) {
    try {
      const room = await Room.findOne({ roomCode });
      if (!room) {
        throw new Error('Room not found');
      }

      room.players = room.players.filter(player => player !== playerName);
      
      // If the leaving player was the leader, assign a new leader
      if (room.leader === playerName && room.players.length > 0) {
        room.leader = room.players[0];
      }

      // If no players left, delete the room
      if (room.players.length === 0) {
        await Room.deleteOne({ roomCode });
        return null;
      }

      await room.save();
      return room;
    } catch (error) {
      throw error;
    }
  }

  // End game
  static async endGame(roomCode) {
    try {
      const room = await Room.findOne({ roomCode });
      if (!room) {
        throw new Error('Room not found');
      }

      room.isGameActive = false;
      room.gameState = {
        players: [],
        centerStack: [],
        currentTurnPlayer: null,
        centerCard: null
      };
      await room.save();
      return room;
    } catch (error) {
      throw error;
    }
  }

  // Clean up old rooms (optional - for maintenance)
  static async cleanupOldRooms() {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await Room.deleteMany({ createdAt: { $lt: oneDayAgo } });
    } catch (error) {
      console.error('Error cleaning up old rooms:', error);
    }
  }
}

module.exports = RoomService; 