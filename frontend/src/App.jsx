import React, { useState, useEffect } from "react";
import axios from "axios";
import io from "socket.io-client";
import GameTest from "./GameTest"; // Import the GameTest component
import "./styles.css";

const API_URL = "http://localhost:4000";
const MAX_PLAYERS = 6; // Maximum number of players allowed

export default function App() {
  const [playerName, setPlayerName] = useState("");
  const [players, setPlayers] = useState([]);
  const [roomCode, setRoomCode] = useState("");
  const [isLeader, setIsLeader] = useState(false);
  const [gameStarted, setGameStarted] = useState(false); // State to track if the game has started
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io.connect(API_URL);
    setSocket(newSocket);

    newSocket.on("game-started", () => {
      console.log("Game started event received");
      setGameStarted(true);
    });

    newSocket.on("player-joined", ({ roomCode, playerName }) => {
      console.log("HELLO " + playerName + " to " + roomCode);
    });

    return () => newSocket.disconnect();
  }, []);

  const handleCreateRoom = async (event) => {
    event.preventDefault();
    try {
      if (playerName.trim()) {
        const response = await axios.post(`${API_URL}/create-room`, { playerName });
        setRoomCode(response.data.roomCode);
        setIsLeader(true); // The player who creates the room is the leader
        socket.emit("join-room", { roomCode: response.data.roomCode, playerName });
        console.log("Room created with code:", response.data.roomCode);
      }
    } catch (error) {
      console.error("Error creating room:", error);
      alert("Failed to create room. Please try again.");
    }
  };

  const handleJoinRoom = async () => {
    const code = prompt("Please enter the room code:");
    if (code) {
      try {
        const response = await axios.post(`${API_URL}/join-room`, { playerName, roomCode: code });
        if (response.data.success) {
          setRoomCode(code);
          socket.emit("join-room", { roomCode: code, playerName });
          console.log("Joined room with code:", code);
        } else {
          alert(response.data.message);
        }
      } catch (error) {
        console.error("Error joining room:", error);
        alert("Failed to join room. Please try again.");
      }
    }
  };

  const fetchPlayers = async () => {
    if (roomCode) {
      try {
        const response = await axios.get(`${API_URL}/room/${roomCode}`);
        setPlayers(response.data.players);
      } catch (error) {
        console.error("Error fetching players:", error);
      }
    }
  };

  useEffect(() => {
    if (roomCode) {
      const interval = setInterval(fetchPlayers, 2000); // Fetch players every 2 seconds
      return () => clearInterval(interval);
    }
  }, [roomCode]);

  const handleStartGame = () => {
    socket.emit("start-game", { roomCode });
  };

  return (
    <div>
      {!gameStarted ? (
        !roomCode ? (
          <form className="new-player-form" onSubmit={handleCreateRoom}>
            <div className="form-row">
              <label htmlFor="player">Enter Name</label>
              <input
                type="text"
                id="player"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
              />
            </div>
            <button type="submit" className="btn">
              Create Room
            </button>
            <button type="button" className="btn" onClick={handleJoinRoom}>
              Join Room
            </button>
          </form>
        ) : (
          <div>
            <h2>Room Code: {roomCode}</h2>
            <h3>Players ({players.length}/{MAX_PLAYERS}):</h3>
            <ul>
              {players.map((player, index) => (
                <li key={index}>{player}</li>
              ))}
            </ul>
            {isLeader ? (
              <button type="button" className="btn start-button" onClick={handleStartGame}>
                Start Game
              </button>
            ) : (
              <p>Waiting for leader to start the game...</p>
            )}
          </div>
        )
      ) : (
        <GameTest socket={socket} roomCode={roomCode} /> // Pass socket and roomCode props to GameTest
      )}
    </div>
  );
}
