const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

const rooms = {};
const playerSocketIdMap = {}; // This will store the mapping of player names to socket IDs


app.post("/create-room", (req, res) => {
  const { playerName } = req.body;
  const roomCode = generateRoomCode();
  rooms[roomCode] = {
    leader: playerName,
    players: [playerName]
  };
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
  
      io.to(roomCode).emit("player-joined", { roomCode, playerName });
      console.log("Player joined room:", roomCode, "Player:", playerName); // Log player joining
    });
  
    socket.on("start-game", ({ roomCode, playersCards }) => {
      // Send the relevant cards to each player
      Object.keys(playersCards).forEach(playerName => {
        const playerSocketId = getPlayerSocketId(playerName); // Get the socket ID of the player
        if (playerSocketId) {
          io.to(playerSocketId).emit("game-started", { cards: playersCards[playerName] });
        } else {
          console.error("Socket ID not found for player:", playerName);
        }
      });
      console.log("Game started for room:", roomCode); // Log game start event
    });
  
    socket.on("disconnect", () => {
      // Remove the player from the map when they disconnect
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
