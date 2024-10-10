const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

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

app.post("/create-room", (req, res) => {
  const { playerName } = req.body;
  const roomCode = generateRoomCode();
  rooms[roomCode] = {
    leader: playerName,
    players: [playerName]
  };
  turns[roomCode] = 0; 
  res.status(200).json({ roomCode });
});

app.post("/join-room", (req, res) => {
  const { playerName, roomCode } = req.body;
  if (rooms[roomCode]) {
    rooms[roomCode].players.push(playerName);
    res.status(200).json({ success: true });
  } else {
    res.status(400).json({ success: false, message: "Room not found" });
  }
});

app.get("/room/:roomCode", (req, res) => {
  const { roomCode } = req.params;
  if (rooms[roomCode]) {
    res.status(200).json({ players: rooms[roomCode].players });
  } else {
    res.status(400).json({ message: "Room not found" });
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

  socket.on("start-game", ({ roomCode, playersCards, centerCard, currplayerName }) => {
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
  });

  socket.on("place-card", ({ roomCode, selectedCards, newGameState, playerName, previousTurn, noCards }) => {
    const clients = io.sockets.adapter.rooms.get(roomCode);
    console.log(`Clients in room ${roomCode}:`, clients ? Array.from(clients) : 'Room does not exist or has no clients');

    // Ensure the room exists and has clients
    if (!clients || clients.size === 0) {
        console.error(`No clients found in room ${roomCode}. Cannot emit update-game.`);
        return;
    }

    const playerSocket = getPlayerSocketId(playerName);
    if (!playerSocket) {
        console.error(`No socket found for player ${playerName}.`);
        return;
    }

    // Emit the update-game event to the room

    console.log(`update-game event emitted to room ${roomCode} with new game state.`);
    console.log(noCards + playerName);
    const name = playerName;
    
    io.to(roomCode).emit("update-game", {newGameState, roomCode, previousTurn, name, noCards});
    console.log("This is the room code:");
    console.log(roomCode);
  });

  socket.on("bluff-call", ({ roomCode, bluffCaller, bluffCards }) => {
    console.log(bluffCaller + " Called Bluff");
    console.log(bluffCards);
    io.to(roomCode).emit("bluff-called", {bluffCaller, bluffCards});
  });

  socket.on("bluff-card-select", ({ roomCode, newGameState, bluffCall, previousPlayer, oldCenterStack, card }) => {
    if (!bluffCall) {
      io.to(roomCode).emit("bluff-card-selected", newGameState, bluffCall, previousPlayer, oldCenterStack, card);
    } else {
      console.log(bluffCall);
      io.to(roomCode).emit("bluff-card-selected", newGameState, bluffCall, previousPlayer, oldCenterStack, card);
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

server.listen(4000, () => {
  console.log("Server is running on http://localhost:4000");
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