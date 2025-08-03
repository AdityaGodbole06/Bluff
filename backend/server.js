const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const connectDB = require("./database");
const RoomService = require("./roomService");
require("dotenv").config({ path: "./config.env" });

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Connect to MongoDB
console.log('Starting application...');
console.log(`Node ENV: ${process.env.NODE_ENV}`);

connectDB();

// Simple test endpoint
app.get('/test', (req, res) => {
  res.status(200).send('OK');
});

// Health check endpoint for Railway
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Bluff Game Backend is running!',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Additional health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

const games = {};

// Function to get the game state
function getGameState(roomCode) {
  return games[roomCode];
}

// Function to update the game state
function updateGameState(roomCode, gameState) {
  games[roomCode] = gameState;
}

const rooms = {};
const playerSocketIdMap = {}; // This will store the mapping of player names to socket IDs
const turns = {};
const players = {};

app.post("/create-room", async (req, res) => {
  try {
    const { playerName } = req.body;
    const roomCode = generateRoomCode();
    
    // Create room in database
    await RoomService.createRoom(roomCode, playerName);
    
    // Keep in-memory for backward compatibility
    rooms[roomCode] = {
      leader: playerName,
      players: [playerName]
    };
    turns[roomCode] = 0;
    
    res.status(200).json({ roomCode });
  } catch (error) {
    console.error("Error creating room:", error);
    res.status(500).json({ error: "Failed to create room" });
  }
});

app.post("/join-room", async (req, res) => {
  try {
    const { playerName, roomCode } = req.body;
    
    // Join room in database
    await RoomService.joinRoom(roomCode, playerName);
    
    // Keep in-memory for backward compatibility
    if (rooms[roomCode]) {
      rooms[roomCode].players.push(playerName);
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error joining room:", error);
    res.status(400).json({ success: false, message: error.message });
  }
});

app.get("/room/:roomCode", async (req, res) => {
  try {
    const { roomCode } = req.params;
    const room = await RoomService.getRoom(roomCode);
    
    if (room) {
      res.status(200).json({ players: room.players });
    } else {
      res.status(400).json({ message: "Room not found" });
    }
  } catch (error) {
    console.error("Error fetching room:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

io.on("connection", (socket) => {
  socket.on("join-room", (data) => {
    const { roomCode, playerName } = data;
    socket.join(roomCode);
    playerSocketIdMap[playerName] = socket.id; // Add or update the playerSocketIdMap
    if (!rooms[roomCode]) {
      rooms[roomCode] = { players: [], centerStack: [], currentTurnPlayer: null };
    }
    io.to(roomCode).emit("player-joined", { roomCode, playerName });
    // rooms[roomCode].players.push(playerName);
    players[playerName] = roomCode;

    console.log("Player joined room:", roomCode, "Player:", playerName); // Log player joining
    console.log("Current state of room:", rooms[roomCode]);

  });

  socket.on("start-game", async ({ roomCode, playersCards, centerCard, currplayerName }) => {
    try {
      const currentTurnPlayer = rooms[roomCode].players[0]; // Get the player whose turn it is

      // Initialize the game state
      const gameState = {
        players: rooms[roomCode].players.map(player => ({
          name: player,
          hand: playersCards[player]
        })),
        centerStack: [centerCard],
        currentTurnPlayer
      };
      
      // Save to database
      await RoomService.updateGameState(roomCode, gameState);
      
      // Keep in-memory for backward compatibility
      updateGameState(roomCode, gameState);    

      // Send the relevant cards to each player
      Object.keys(playersCards).forEach(playerName => {
        const playerSocketId = getPlayerSocketId(playerName); // Get the socket ID of the player
        if (playerSocketId) {
          io.to(playerSocketId).emit("game-started", { 
            cards: playersCards[playerName], 
            centerCard,
            turnPlayer: currentTurnPlayer // Notify clients whose turn it is
          });
          console.log(":hi");
        } else {
          console.error("Socket ID not found for player:", playerName);
        }
      });
      console.log("Game started for room:", roomCode); // Log game start event
      console.log("Initialized game state:", getGameState(roomCode));
    } catch (error) {
      console.error("Error starting game:", error);
    }
  });

  socket.on("place-card", ({ roomCode, selectedCards, newGameState, playerName, previousTurn, noCards }) => {
    const clients = io.sockets.adapter.rooms.get(roomCode);
    console.log(`Clients in room ${roomCode}:`, clients ? Array.from(clients) : 'Room does not exist or has no clients');

    // Ensure the room exists and has clients
    if (!clients || clients.size === 0) {
        console.error(`No clients found in room ${roomCode}. Cannot emit update-game.`);
        return;
    }

    if (noCards) {
      io.to(roomCode).emit("message-sent", {
        playerName: "System",
        message: `${playerName} has no cards left! You have 10 seconds to call their bluff or they will win!`,
        system: true,
        timer: true
      });
      console.log(`System message sent: ${playerName} has no cards left`);
    }
    

    const playerSocket = getPlayerSocketId(playerName);
    if (!playerSocket) {
        console.error(`No socket found for player ${playerName}.`);
        return;
    }

    // Emit the update-game event to the room
    const gameState = getGameState(roomCode);

    const player = gameState.players.find(p => p.name === playerName);
    if (player) {
      player.hand = player.hand.filter(card => !selectedCards.includes(card));
    }

    gameState.centerStack.push(...selectedCards);

    const players = gameState.players.map(player => ({
      name: player.name,
      hand: player.hand
    }));

    const fixedGameState = { ...newGameState, players };
    console.log("fixedGameState");
    console.log(fixedGameState);
    console.log(fixedGameState.players);
    console.log(`update-game event emitted to room ${roomCode} with new game state.`);
    console.log(noCards + playerName);
    const name = playerName;
    updateGameState(roomCode, fixedGameState);
    io.to(roomCode).emit("update-game", {newGameState: fixedGameState, roomCode, previousTurn, name, noCards});
  });

  socket.on("bluff-call", ({ roomCode, bluffCaller, bluffCards }) => {
    console.log(bluffCaller + " Called Bluff");
    console.log(bluffCards);
    io.to(roomCode).emit("bluff-called", {bluffCaller, bluffCards});
  });

  socket.on("bluff-card-select", ({ roomCode, newGameState, bluffCall, previousPlayer, oldCenterStack, card, playerName }) => {
    const gameState = getGameState(roomCode);

    if (!bluffCall) {
      const updatedPlayers = gameState.players.map(p => {
        if (p.name === playerName) {
          return {
            ...p,
            hand: [...p.hand, ...oldCenterStack]
          };
        }
        return p;
      });
      const fixedGameState = { 
        ...newGameState,
        players: updatedPlayers,
        centerCard: "",
        centerStack: [],
        currentTurnPlayer: previousPlayer };

      console.log(fixedGameState.players[0].hand);
      console.log("fixedGameState.players[1].hand");
      console.log(fixedGameState.players[1].hand);
      console.log("fixedGameState.players[2].hand");
      console.log(fixedGameState.players[2].hand);

      console.log("oldCenterStack");
      console.log(oldCenterStack);
      updateGameState(roomCode, fixedGameState);

      io.to(roomCode).emit("bluff-card-selected", {newGameState: fixedGameState, bluffCall, previousPlayer, oldCenterStack, card});
    } else {
      const updatedPlayers = gameState.players.map(p => {
        if (p.name === previousPlayer) {
          return {
            ...p,
            hand: [...p.hand, ...oldCenterStack]
          };
        }
        return p;
      });
      const fixedGameState = { 
        ...newGameState,
        players: updatedPlayers,
        centerCard: "",
        centerStack: [],
        currentTurnPlayer: playerName };
  
      console.log(fixedGameState);
      console.log("fixedGameState.players");
      console.log(fixedGameState.players[0].hand);
      console.log("fixedGameState.players[1].hand");
      console.log(fixedGameState.players[1].hand);
      console.log("fixedGameState.players[2].hand");
      console.log(fixedGameState.players[2].hand);

      console.log("oldCenterStack");
      console.log(oldCenterStack);
      console.log("Previous Center Stack from Game State");
      console.log(gameState.centerStack);
      updateGameState(roomCode, fixedGameState);

      io.to(roomCode).emit("bluff-card-selected", {newGameState: fixedGameState, bluffCall, previousPlayer, oldCenterStack, card});
    }
  });

  socket.on("remove-bluff", ({ roomCode }) => {
    io.to(roomCode).emit("bluff-removed");
  });

  socket.on("clear-timer", ({roomCode}) => {
    console.log("CLEAR TIMER");
    io.to(roomCode).emit("timer-cleared");
  })

  socket.on("send-message", (messageData) => {
    console.log("hello");
    io.to(messageData.roomCode).emit("message-sent", messageData);
  })

  socket.on("return-to-room", ({ roomCode }) => {
    io.to(roomCode).emit("game-ended", { roomCode });
  })

  socket.on("leave-room", async ({ roomCode, playerName }) => {
    try {
      console.log(`Player ${playerName} leaving room ${roomCode}`);
      
      // Remove player from database
      const updatedRoom = await RoomService.removePlayer(roomCode, playerName);
      
      // Remove player from socket mapping
      delete playerSocketIdMap[playerName];
      delete players[playerName];
      
      // Update in-memory state
      if (rooms[roomCode] && rooms[roomCode].players) {
        rooms[roomCode].players = rooms[roomCode].players.filter(player => player !== playerName);
        
        // If the leaving player was the leader, assign a new leader
        if (rooms[roomCode].leader === playerName && rooms[roomCode].players.length > 0) {
          rooms[roomCode].leader = rooms[roomCode].players[0];
        }
        
        // If no players left in room, delete the room
        if (rooms[roomCode].players.length === 0) {
          delete rooms[roomCode];
          delete turns[roomCode];
          console.log(`Room ${roomCode} deleted - no players remaining`);
        } else {
          // Notify remaining players that someone left
          io.to(roomCode).emit("player-left", { 
            roomCode, 
            playerName, 
            remainingPlayers: rooms[roomCode].players,
            newLeader: rooms[roomCode].leader 
          });
          console.log(`Player ${playerName} left room ${roomCode}. Remaining players:`, rooms[roomCode].players);
        }
      }
      
      // Remove socket from room
      socket.leave(roomCode);
    } catch (error) {
      console.error("Error leaving room:", error);
    }
  });

  

  // socket.on("place-card", ({ roomCode, playerName, selectedCards }) => {
  //   const gameState = getGameState(roomCode);

  //   // Debugging: Log the game state before any modifications
  //   console.log("Game state before placing card:", gameState);
  //   console.log(roomCode);

  //   if (gameState) {
  //     const currentPlayer = gameState.players.find(player => player.name === playerName);
  //     console.log(currentPlayer, gameState.currentTurnPlayer, playerName, selectedCards);

  //     if (currentPlayer && gameState.currentTurnPlayer === playerName && selectedCards.length > 0) {
  //       currentPlayer.hand = currentPlayer.hand.filter(card => !selectedCards.includes(card));
  //       gameState.centerStack.push(...selectedCards);
  //       updateGameState(roomCode, gameState);
  //       io.to(roomCode).emit("update-game-state", gameState);
  //       console.log(currentPlayer.hand);
  //     } else {
  //       console.error("Current player not found or it's not their turn.");
  //     }
  //   } else {
  //     console.error("Game state is undefined.");
  //   }
    
  // });

  socket.on("increase-center-card", (data) => {
    const {roomCode} = data;
    gameState = getGameState(roomCode);
    const currentCenterCard = gameState.centerStack[gameState.centerStack.length - 1];

    const cardValue = getCardValue(currentCenterCard);
    const suit = getSuit(currentCenterCard);
    const nextCardValue = cardValue === 13 ? 1 : cardValue + 1;
    const newCenterCard = getCardName(nextCardValue) + " of " + suit;

    gameState.centerStack.push(newCenterCard);
    console.log("hiu" + roomCode);
    io.to(roomCode).emit("next-card", roomCode);
  });


  socket.on("disconnect", () => {
    for (let playerName in playerSocketIdMap) {
      if (playerSocketIdMap[playerName] === socket.id) {
        delete playerSocketIdMap[playerName];
        break;
      }
    }
  });
});

function getPlayerSocketId(playerName) {
  return playerSocketIdMap[playerName];
}

const generateRoomCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const PORT = 4000; // Force port 4000 for Railway

console.log(`Port: ${PORT}`);

// Add error handling for server startup
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`MongoDB URI configured: ${process.env.MONGODB_URI ? 'Yes' : 'No'}`);
  console.log(`Health check available at: http://0.0.0.0:${PORT}/health`);
}).on('error', (error) => {
  console.error('Server failed to start:', error);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});


const getCardValue = (card) => {
  const valueMap = {
    "Ace": 1,
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "7": 7,
    "8": 8,
    "9": 9,
    "10": 10,
    "Jack": 11,
    "Queen": 12,
    "King": 13,
  };
  return valueMap[card.split(' ')[0]];
};

const getCardName = (value) => {
  const nameMap = {
    1: "Ace",
    2: "2",
    3: "3",
    4: "4",
    5: "5",
    6: "6",
    7: "7",
    8: "8",
    9: "9",
    10: "10",
    11: "Jack",
    12: "Queen",
    13: "King",
  };
  return nameMap[value];
};

const getSuit = (card) => card.split(' ')[2];