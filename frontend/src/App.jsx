import React, { useState, useEffect } from "react";
import axios from "axios";
import io from "socket.io-client";
import GameScreen from "./GameScreen"; // Import the GameScreen component
import "./styles.css";

const API_URL = "http://localhost:4000";
const MAX_PLAYERS = 6; // Maximum number of players allowed

export default function App() {
  const [playerName, setPlayerName] = useState("");
  const [players, setPlayers] = useState([]);
  const [roomCode, setRoomCode] = useState("");
  const [isLeader, setIsLeader] = useState(false);
  const [gameStarted, setGameStarted] = useState(false); // State to track if the game has started
  const [playerCards, setPlayerCards] = useState([]);
  const socket = io(API_URL);

  const deck = [
    "Ace of Spades", "2 of Spades", "3 of Spades", "4 of Spades", "5 of Spades", "6 of Spades", "7 of Spades", "8 of Spades", "9 of Spades", "10 of Spades", "Jack of Spades", "Queen of Spades", "King of Spades",
    "Ace of Hearts", "2 of Hearts", "3 of Hearts", "4 of Hearts", "5 of Hearts", "6 of Hearts", "7 of Hearts", "8 of Hearts", "9 of Hearts", "10 of Hearts", "Jack of Hearts", "Queen of Hearts", "King of Hearts",
    "Ace of Diamonds", "2 of Diamonds", "3 of Diamonds", "4 of Diamonds", "5 of Diamonds", "6 of Diamonds", "7 of Diamonds", "8 of Diamonds", "9 of Diamonds", "10 of Diamonds", "Jack of Diamonds", "Queen of Diamonds", "King of Diamonds",
    "Ace of Clubs", "2 of Clubs", "3 of Clubs", "4 of Clubs", "5 of Clubs", "6 of Clubs", "7 of Clubs", "8 of Clubs", "9 of Clubs", "10 of Clubs", "Jack of Clubs", "Queen of Clubs", "King of Clubs"
  ];

  const handleCreateRoom = async (event) => {
    event.preventDefault();
    try {
      if (playerName.trim()) {
        const response = await axios.post(`${API_URL}/create-room`, { playerName });
        setRoomCode(response.data.roomCode);
        setPlayerName("");
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
          setPlayerName("");
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
  
  useEffect(() => {
    socket.on("game-started", ({ cards }) => {
      console.log("Game started event received"); // Log game started event
      setPlayerCards(cards); // Set the player's cards
      setGameStarted(true); // Set the gameStarted state to true
    });
  }, [socket]);

  const shuffleDeck = (deck) => {
    const shuffledDeck = deck.slice();
    for (let i = shuffledDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledDeck[i], shuffledDeck[j]] = [shuffledDeck[j], shuffledDeck[i]];
    }
    return shuffledDeck;
  };

  const handleStartGame = () => {
    const shuffledDeck = shuffleDeck(deck);
    const playersCards = {};
    const numPlayers = players.length;

    players.forEach((player) => {
      playersCards[player] = [];
    });

    shuffledDeck.forEach((card, index) => {
      const player = players[index % numPlayers];
      playersCards[player].push(card);
    });

    socket.emit("start-game", { roomCode, playersCards });
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
        <GameScreen players={players} playerCards={playerCards} /> // Pass playerCards prop to GameScreen
      )}
    </div>
  );
  
}
