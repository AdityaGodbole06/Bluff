import React, { useState, useEffect } from "react";
import axios from "axios";
import io from "socket.io-client";
import GameScreen from "./GameScreen"; // Import the GameScreen component
import "./styles.css";

const API_URL = import.meta.env.VITE_API_URL || "https://bluff-production-939f.up.railway.app";
console.log("API_URL is:", API_URL);

const MAX_PLAYERS = 6; // Maximum number of players allowed

export default function App() {
  console.log("App component is loading...");
  
  const [playerName, setPlayerName] = useState("");
  const [players, setPlayers] = useState([]);
  const [roomCode, setRoomCode] = useState("");
  const [isLeader, setIsLeader] = useState(false);
  const [gameStarted, setGameStarted] = useState(false); // State to track if the game has started
  const [playerCards, setPlayerCards] = useState([]);
  const [centerStack, setCenterStack] = useState([]);
  const [currentTurnPlayer, setCurrentTurnPlayer] = useState([]);
  const [centerCard, setCenterCard] = useState(null);
  const [socket, setSocket] = useState(null);
  const [joinError, setJoinError] = useState("");

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
          setJoinError(""); // Clear any previous error
          socket.emit("join-room", { roomCode: code, playerName });
          console.log("Joined room with code:", code);
        } else {
          setJoinError(response.data.message || "Failed to join room.");
        }
      } catch (error) {
        console.error("Error joining room:", error);
        let message = "Failed to join room. Please try again.";
        if (error.response && error.response.data && error.response.data.message) {
          message = error.response.data.message;
        } else if (error.message) {
          message = error.message;
        }
        setJoinError(message);
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
    const newSocket = io.connect(API_URL);
    setSocket(newSocket);

    newSocket.on("game-started", ({ cards, centerCard, currentTurnPlayer }) => {
      console.log("Game started event received");
      setPlayerCards(cards);
      setCenterCard(centerCard);
      setCenterStack([centerCard]);
      setCurrentTurnPlayer(currentTurnPlayer);
      setGameStarted(true);
    });

    newSocket.on("player-joined", ({ roomCode, playerName }) => {
      console.log("HELLO " + playerName + " to " + roomCode);
    });

    newSocket.on("player-left", ({ roomCode, playerName, remainingPlayers, newLeader }) => {
      console.log(`${playerName} left the room`);
      setPlayers(remainingPlayers);
      // Update leader status - check if current player is the new leader
      setIsLeader(newLeader);
      console.log("newLeader");
      console.log(newLeader);
    });

    newSocket.on("game-ended", ({ roomCode }) => {
      console.log("Game ended, returning to room");
      setGameStarted(false);
      setPlayerCards([]);
      setCenterCard(null);
      setCenterStack([]);
      setCurrentTurnPlayer([]);
    });

    return () => newSocket.disconnect();
  }, []);

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

    const centerCard = shuffledDeck.pop();

    shuffledDeck.forEach((card, index) => {
      const player = players[index % numPlayers];
      playersCards[player].push(card);
    });

    const currentPlayer = players[0]; 
    socket.emit("start-game", { roomCode, playersCards, centerCard, currentPlayer, playerName });
  };

  try {
    return (
      <div>
        {!gameStarted ? (
          !roomCode ? (
            <div className="welcome-container">
              <div className="welcome-container-row">

                <div className="welcome-heading">
                  <h1 className="title">Welcome to Bluff</h1>
                  <p className="tagline">A fast-paced card game of lies and luck</p>
                </div>

                <div className="welcome-box">
                  {joinError && (
                    <div className="error-message">
                      {joinError}
                    </div>
                  )}
                  <p className="subtitle">Enter your name to get started</p>
                  <form className="new-player-form" onSubmit={handleCreateRoom}>
                    <input
                      type="text"
                      placeholder="Your name"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      className="input-field"
                    />
                    <div className="button-group">
                      <button type="submit" className="btn">Create Room</button>
                      <button type="button" className="btn" onClick={handleJoinRoom}>Join Room</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

          ) : (
            <div className="room-info-box">
              <div className="lobby-header">
                <button 
                  type="button" 
                  className="btn back-button" 
                  onClick={() => {
                    setRoomCode("");
                    setIsLeader(false);
                    setPlayers([]);
                    setJoinError("");
                    if (socket) {
                      socket.emit("leave-room", { roomCode, playerName });
                    }
                  }}
                >
                  ← Back to Menu
                </button>
              </div>
              <h2 className="room-code">Room Code: {roomCode}</h2>
              <h3 className="player-count">Players ({players.length}/{MAX_PLAYERS}):</h3>
              <ul className="player-list-start">
                {players.map((player, index) => (
                  <li key={index} className="player-name">{player}</li>
                ))}
              </ul>

              {isLeader ? (
                <button type="button" className="btn start-button" onClick={handleStartGame}>
                  Start Game
                </button>
              ) : (
                <p className="waiting-text">Waiting for leader to start the game...</p>
              )}
            </div>
          )
        ) : (
          <GameScreen players={players} playerCards={playerCards} centerCard={centerCard} centerStack={centerStack} playerName={playerName} roomCode={roomCode} socket={socket}/> // Pass playerCards prop to GameScreen
        )}
      </div>
    );
  } catch (error) {
    console.error("Error rendering App:", error);
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'white', backgroundColor: '#1a1a1a', minHeight: '100vh' }}>
        <h1>Bluff Game</h1>
        <p>Something went wrong loading the game.</p>
        <p>Error: {error.message}</p>
        <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', margin: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Reload Page
        </button>
      </div>
    );
  }
}
