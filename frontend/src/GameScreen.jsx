import React, { useState, useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import PlayerCards from "./PlayerCards";
import io from "socket.io-client";


export default function GameScreen({ players, playerCards, centerCard, centerStack, playerName, roomCode, socket }) {
  const [selectedCards, setSelectedCards] = useState([]);
  const [playerHand, setPlayerHand] = useState(playerCards);
  const [gameState, setGameState] = useState({ players, centerStack, currentTurnPlayer: players[0] });
  const [currentCenterCard, setCurrentCenterCard] = useState(centerCard);

  useEffect(() => {
    console.log('useEffect called');
    
    socket.on("update-game", ({ newGameState, roomCode }) => {
      console.log("Received update-game event");
      console.log(newGameState);
      
      console.log("HELLO " + roomCode);
    });

    socket.on("next-card", ({roomCode}) => {
      console.log("HELLO" + roomCode);
    });
    
  }, [socket]);

  const handlePlaceCard = (card) => {
    if (selectedCards.length > 0) {
      const newPlayerHand = playerHand.filter(handCard => !selectedCards.includes(handCard));
      // console.log("New Player Hand:", newPlayerHand);
      setPlayerHand(newPlayerHand);

      const newCenterStack = [...gameState.centerStack, ...selectedCards];
      const newGameState = {
        ...gameState,
        centerStack: newCenterStack
      };

      const nextCardValue = getCardValue(card);
      const newCenterCard = getCardName(nextCardValue);

      socket.emit("place-card", { roomCode, selectedCards, newGameState, playerName });

      setCurrentCenterCard(newCenterCard);
      setSelectedCards([]);
    }
  };

  const increaseCenterCard = () => {
    socket.emit("increase-center-card", {roomCode: roomCode});
  };

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

  const cardValue = getCardValue(currentCenterCard);
  const suit = getSuit(currentCenterCard);
  const previousCardValue = cardValue === 1 ? 13 : cardValue - 1;
  const nextCardValue = cardValue === 13 ? 1 : cardValue + 1;

  const moveCard = (fromIndex, toIndex) => {
    const updatedOrder = [...playerHand];
    const [movedCard] = updatedOrder.splice(fromIndex, 1);
    updatedOrder.splice(toIndex, 0, movedCard);
    setPlayerHand(updatedOrder);
  };

  return (
    <div className="game-screen">
      <div className="player-list">
        <h3>Players</h3>
        <ul>
          {players.map((player, index) => (
            <li key={index} style={{ color: player === gameState.currentTurnPlayer ? "red" : "black" }}>
              {player}
            </li>
          ))}
        </ul>
      </div>
      <div className="center-card-container">
        <div className="stack-info">
          Stack: {gameState.centerStack.length}
        </div>
        <div className="center-card">
          {currentCenterCard}
        </div>
        {playerName === gameState.currentTurnPlayer ? (
          <div className="place-card-buttons">
            <button className="place-card-button" onClick={() => handlePlaceCard(getCardName(previousCardValue) + " of " + suit)}>
              {getCardName(previousCardValue)}
            </button>
            <button className="place-card-button" onClick={() => handlePlaceCard(currentCenterCard)}>
              {getCardName(cardValue)}
            </button>
            <button className="place-card-button" onClick={() => handlePlaceCard(getCardName(nextCardValue) + " of " + suit)}>
              {getCardName(nextCardValue)}
            </button>
          </div>
        ) : (
          <p>Waiting for {gameState.currentTurnPlayer} to place a card...</p>
        )}
      </div>
      <div className="player-cards-section">
        <h3>Your Cards</h3>
        <DndProvider backend={HTML5Backend}>
          <PlayerCards cards={playerHand} selectedCards={selectedCards} setSelectedCards={setSelectedCards} moveCard={moveCard}/>
        </DndProvider>
      </div>
      <div className="test-button-container" style={{ position: "absolute", right: "20px", top: "20px" }}>
        <button className="test-button" onClick={increaseCenterCard}>Test</button>
      </div>
    </div>
  );
}
