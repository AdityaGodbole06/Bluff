import React, { useState, useEffect, useRef } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import PlayerCards from "./PlayerCards";
import io from "socket.io-client";


export default function GameScreen({ players, playerCards, centerCard, centerStack, playerName, roomCode, socket }) {
  const [selectedCards, setSelectedCards] = useState([]);
  const [playerHand, setPlayerHand] = useState(playerCards);
  const [gameState, setGameState] = useState({ players, centerStack, currentTurnPlayer: players[0] });
  const [currentCenterCard, setCurrentCenterCard] = useState(centerCard);
  const [previousTurn, setPreviousTurn] = useState({ cardsPlaced: [], numberSelected: null, playerName: null });
  const [showBluffScreen, setShowBluffScreen] = useState(false);
  const [bluffCards, setBluffCards] = useState([]);
  const [bluffCaller, setBluffCaller] = useState(null);
  const [selectedBluffCard, setSelectedBluffCard] = useState(null);
  const [winner, setWinner] = useState(null);
  const [noCardsLeft, setNoCardsLeft] = useState(null);
  const [timer, setTimer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const [endBluff, setEndBluff] = useState(false);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isOrderEnabled, setIsOrderEnabled] = useState(false); 


  const messageBoxRef = useRef(null);

  useEffect(() => {
    // Auto-scroll to the bottom whenever messages are updated
    if (messageBoxRef.current) {
      messageBoxRef.current.scrollTop = messageBoxRef.current.scrollHeight;
    }
  }, [messages]);

  const toggleOrder = () => {
    setIsOrderEnabled((prev) => !prev); // Toggle order state
  };


  useEffect(() => {    
    socket.on("update-game", ({ newGameState, roomCode, previousTurn, name, noCards }) => {
      console.log("Received update-game event");
      if (noCards) {
        console.log("SET NOCARDSLEFT TO PLAYER NAME");
        setNoCardsLeft(name);
        console.log(name);
      } else {
        console.log("SET NOCARDSLEFT TO NULL");
        setNoCardsLeft(null);
      }
      console.log(newGameState);
      setGameState(newGameState);
      setCurrentCenterCard(newGameState.centerCard);
      console.log(previousTurn.playerName);
      setPreviousTurn(previousTurn);
    });

    socket.on("bluff-called", ({ bluffCaller, bluffCards }) => {
      console.log(bluffCaller);
      console.log(bluffCards);
    
      setBluffCards(bluffCards);
      clearInterval(timer);
      
      setTimer(null);
      setBluffCaller(bluffCaller);
      setShowBluffScreen(true);
    });

    socket.on("bluff-removed", () => {
      setShowBluffScreen(false);
      setWinner(null);

      setPreviousTurn([], null, null);
      console.log("Bluff Removed");
      setSelectedBluffCard(null);
    });

    socket.on("timer-cleared", () => {
      setEndBluff(true);
      console.log("TIMER HAS BEEN CLEARED");
      clearInterval(timer);
      setTimer(null);
    });

    socket.on("bluff-card-selected", (newGameState, bluffCall, previousPlayer, oldCenterStack, card) => {
      setSelectedBluffCard(card);
      console.log(newGameState);
      if (!bluffCall) {
        setWinner(previousPlayer);
        setGameState(newGameState);
        setCurrentCenterCard(newGameState.centerCard);
      } else {
        setWinner(bluffCaller);
        setNoCardsLeft(null);
        setEndBluff(false);
        if (previousPlayer === playerName) {
          const combinedHand = [...playerHand, ...oldCenterStack];
          // Use a Set to remove any duplicates
          const uniqueHand = Array.from(new Set(combinedHand));
          // Update the player's hand with the unique cards
          setPlayerHand(uniqueHand);
        }
        setGameState(newGameState);
        setCurrentCenterCard(newGameState.centerCard);
      }
      
    });
    

    socket.on("next-card", ({roomCode}) => {
      console.log("HELLO" + roomCode);
    });
    
  }, [socket]);

  useEffect(() => {
    let interval;
    console.log("USEEFFECT FOR NOCARDSLEFT" + noCardsLeft);
    if (noCardsLeft !== null && !endBluff) {
      console.log("START TIMER");
      setTimeLeft(10);
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          // if (prev === 1) {
          //   clearInterval(interval);
          //   setTimer(null);
          //   setShowBluffScreen(false);
          //   // socket.emit("game-over", { winner: noCardsLeft, roomCode });
          //   // alert(`${noCardsLeft} wins the game!`);
          //   console.log(noCardsLeft + " WINS THE GAME!!!");
          // }
          return prev - 1;
        });
      }, 1000);
      setTimer(interval);
    } else {
      clearInterval(timer);
      setTimer(null);
    }
    return () => clearInterval(interval);
  }, [noCardsLeft, endBluff]);

  useEffect(() => {
    const handleMessageSent = (messageData) => {
      console.log("Message received");
      setMessages((prevMessages) => [...prevMessages, messageData]);
    };
  
    socket.on("message-sent", handleMessageSent);
  
    // Clean up the event listener when the component unmounts or updates
    return () => {
      socket.off("message-sent", handleMessageSent);
    };
  }, [socket]);
  

  useEffect(() => {
    if (timeLeft === 0 && noCardsLeft && !endBluff) {
      setShowBluffScreen(false);
      // socket.emit("game-over", { winner: noCardsLeft, roomCode });
      console.log(noCardsLeft + " wins the game!!!");
    }
  }, [timeLeft, noCardsLeft, roomCode, socket]);
  

  const handleBluff = () => {
    if (previousTurn.numberSelected !== null) {
      console.log(previousTurn.numberSelected);
      if (timer) {
        clearInterval(timer);
        setTimer(null);
        socket.emit("clear-timer", {roomCode});
      }
  
  
      const placedCards = previousTurn.cardsPlaced; // Capture the placed cards
      setBluffCards(placedCards); // Update the state
      setShowBluffScreen(true); // Show the bluff screen
      setBluffCaller(playerName);
    
      console.log(placedCards); // This will log the correct cards placed in the previous turn
      socket.emit("bluff-call", { roomCode, bluffCaller: playerName, bluffCards: placedCards }); // Emit the correct cards
      
      console.log(`${playerName} called a bluff!`);
    }
  };
  

  const handlePlaceCard = (card) => {
    console.log(selectedCards.length);
    if (selectedCards.length > 0) {
      const newPlayerHand = playerHand.filter(handCard => !selectedCards.includes(handCard));
      setPlayerHand(newPlayerHand);
      let noCards = false;
      if (newPlayerHand.length === 0) {
        noCards = true;
        setNoCardsLeft(playerName);
        console.log(noCardsLeft);
      } else {
        setNoCardsLeft(null);
      }
      const nextCardValue = getCardValue(card);
      const newCenterCard = getCardName(nextCardValue);

      const newCenterStack = [...gameState.centerStack, ...selectedCards];

      const currentPlayerIndex = players.indexOf(gameState.currentTurnPlayer);

      // Determine the next player
      const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
      const nextTurnPlayer = players[nextPlayerIndex];

      const newGameState = {
          ...gameState,
          centerStack: newCenterStack,
          centerCard: newCenterCard,
          currentTurnPlayer: nextTurnPlayer
      };

      const previousTurn = {
        cardsPlaced: selectedCards,
        numberSelected: newCenterCard,
        playerName: playerName
      };

      console.log(newGameState);
      console.log(previousTurn);

      socket.emit("place-card", { roomCode, selectedCards, newGameState, playerName, previousTurn, noCards });

      setCurrentCenterCard(newCenterCard);
      setSelectedCards([]);
    }
  };

  const increaseCenterCard = () => {
    socket.emit("increase-center-card", {roomCode: roomCode});
  };

  const handleCardClick = (card) => {
    console.log(`${playerName} selected ${getCardValue(card)} as the bluff!`);
    console.log(previousTurn.numberSelected);
    setSelectedBluffCard(card); // Set the selected card
    let bluffCall = true;
    const oldCenterStack = gameState.centerStack;
    const previousPlayer = previousTurn.playerName;
    if (getCardValue(card) === getCardValue(previousTurn.numberSelected)) {
      if (endBluff) {
        console.log(noCardsLeft + " wins the game!!!");
      } else {
        console.log("You guessed CORRECT");
        const updatedPlayerHand = [...playerHand, ...gameState.centerStack];
        setPlayerHand(updatedPlayerHand);

        bluffCall = false;
        // Reset the center stack
        const newGameState = {
            ...gameState,
            centerCard: "",
            centerStack: [],
            currentTurnPlayer: previousTurn.playerName
        };
        setCurrentCenterCard("");
        setGameState(newGameState);
        socket.emit("bluff-card-select", { roomCode, newGameState, bluffCall, previousPlayer, oldCenterStack, card });
      }
    } else {
      
      const newGameState = {
        ...gameState,
        centerCard: "",
        centerStack: [],
        currentTurnPlayer: playerName
      }
      setEndBluff(true);
      setNoCardsLeft(null);
      socket.emit("bluff-card-select", { roomCode, newGameState, bluffCall, previousPlayer, oldCenterStack, card });
      console.log("You guessed INCORRECT");
    };

    setTimeout(() => {
      setShowBluffScreen(false);
      setWinner(null);
      socket.emit("remove-bluff", { roomCode });
    }, 3000);
  

    // Hide bluff screen after selection
    // setShowBluffScreen(false);

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

  function numberToWords(number) {
    const words = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
    return words[number] || number; // Fallback to the number if out of range
  }

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const messageData = {
        roomCode,
        playerName,
        message: newMessage,
      };
      console.log(messageData);
      socket.emit("send-message", messageData);
      // setMessages((prevMessages) => [...prevMessages, messageData]);
      setNewMessage("");
    }
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
        <div className="stack-info">Stack: {gameState.centerStack.length}</div>
        <div className="center-card">
          {currentCenterCard ? (
            previousTurn.playerName ? (
              `${numberToWords(previousTurn.cardsPlaced.length)} ${currentCenterCard}'s`
            ) : (
              currentCenterCard
            )
          ) : (
            ""
          )}
        </div>
        <div className="action-buttons">
          {playerName === gameState.currentTurnPlayer ? (
            <div className="place-card-buttons">
              {gameState.centerStack.length === 0 ? (
                // Render 13 buttons when center stack is empty
                <>
                  {["Ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "Jack", "Queen", "King"].map((cardName) => (
                    <button 
                      key={cardName} 
                      className="place-card-button" 
                      onClick={() => handlePlaceCard(cardName + " of " + suit)}
                      disabled={!!noCardsLeft}
                    >
                      {cardName}
                    </button>
                  ))}
                </>
              ) : (
                // Render the original three buttons when center stack is not empty
                <>
                  <button 
                    className="place-card-button" 
                    onClick={() => handlePlaceCard(getCardName(previousCardValue) + " of " + suit)}
                    disabled={!!noCardsLeft} // Disable if noCardsLeft is set
                  >
                    {getCardName(previousCardValue)}
                  </button>
                  <button 
                    className="place-card-button" 
                    onClick={() => handlePlaceCard(currentCenterCard)}
                    disabled={!!noCardsLeft} // Disable if noCardsLeft is set
                  >
                    {getCardName(cardValue)}
                  </button>
                  <button 
                    className="place-card-button" 
                    onClick={() => handlePlaceCard(getCardName(nextCardValue) + " of " + suit)}
                    disabled={!!noCardsLeft} // Disable if noCardsLeft is set
                  >
                    {getCardName(nextCardValue)}
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              <p>Waiting for {gameState.currentTurnPlayer} to place a card...</p>
            </>
          )}
           {previousTurn.playerName &&
          previousTurn.cardsPlaced.length > 0 &&
          playerName !== previousTurn.playerName &&
          gameState.centerStack.length !== 0 && (
            <div className="bluff-button-container">
              <button
                className="bluff-button"
                onClick={handleBluff}
                disabled={!!noCardsLeft}
              >
                Bluff
              </button>
            </div>
          )}
        </div>
      </div>      
      <div className="player-cards-section">
        <h3>Your Cards</h3>
        <DndProvider backend={HTML5Backend}>
          <PlayerCards 
            cards={playerHand} 
            selectedCards={selectedCards} 
            setSelectedCards={setSelectedCards} 
            moveCard={moveCard}
          />
        </DndProvider>
      </div>
      <div className="messaging-section">
        <div className="message-box" ref={messageBoxRef} >
          {messages.map((message, index) => (
            <div key={index}>
              <strong>{message.playerName}:</strong> {message.message}
            </div>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}>
          <div className="message-input">
            <input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <button type="submit">Send</button>
          </div>
        </form>
      </div>
      {showBluffScreen && (
        <div className="bluff-screen">
          <div className="previous-turn-info">
            {previousTurn.playerName} CLAIMS to have placed {numberToWords(previousTurn.cardsPlaced.length)} {previousTurn.numberSelected}'s
          </div>
          {playerName === bluffCaller ? (
            <>
              <div className="bluff-screen-title">Select a Card</div>
              <div className="bluff-card-buttons">
                {bluffCards.map((card, index) => (
                  <button 
                    key={index} 
                    className={`bluff-card-button ${selectedBluffCard === card ? "selected" : ""}`}
                    onClick={() => handleCardClick(card)}
                    disabled={!!selectedBluffCard}
                  >
                    {card}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              {winner ? (
                <div className="bluff-screen-title">{winner} won!!!</div>
              ) : <div className="bluff-screen-title">{bluffCaller} is selecting a card...</div>}
              <div className="bluff-card-buttons">
                {bluffCards.map((card, index) => (
                  <button 
                    key={index} 
                    className={`bluff-card-button ${selectedBluffCard === card ? "selected" : ""}`} 
                    disabled
                  >
                    {card}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}