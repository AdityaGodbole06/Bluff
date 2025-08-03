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
  const [isBluffCorrect, setIsBluffCorrect] = useState(null);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [messageSent, setMessageSent] = useState(false);

  const [isOrderEnabled, setIsOrderEnabled] = useState(false); 
  const [showVictoryScreen, setShowVictoryScreen] = useState(false);
  const [victoryPlayer, setVictoryPlayer] = useState(null);


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
      console.log(newGameState);
      console.log(newGameState.players);
      const thisPlayer = newGameState.players.find(p => p.name === playerName);
      if (noCards) {
        console.log("SET NOCARDSLEFT TO PLAYER NAME");
        setNoCardsLeft(name);
        console.log(name);
      } else {
        console.log("SET NOCARDSLEFT TO NULL");
        setNoCardsLeft(null);
      }
      setGameState(newGameState);
      setCurrentCenterCard(newGameState.centerCard);
      console.log(previousTurn.playerName);
      setPreviousTurn(previousTurn);
      console.log(newGameState);
      console.log(thisPlayer);
      if (thisPlayer) {
        console.log("Hand from server:", thisPlayer.hand);
        setPlayerHand(thisPlayer.hand);
      }
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

    socket.on("bluff-card-selected", ({newGameState, bluffCall, previousPlayer, oldCenterStack, card, selectingPlayer}) => {
      console.log(oldCenterStack);
      console.log("Card selected by:", selectingPlayer);
      console.log("Current player:", playerName);
      
      // Only set the selected card for the player who made the selection
      if (selectingPlayer === playerName) {
        setSelectedBluffCard(card);
      }
      
      const thisPlayer = newGameState.players.find(p => p.name === playerName);
      if (thisPlayer) {
        console.log("Hand from server:", thisPlayer.hand);
        setPlayerHand(thisPlayer.hand);
      }

      console.log("THIS IS THE NEW GAME STATE AFTER BLUFF CALL")
      console.log(newGameState);
      setIsBluffCorrect(bluffCall);
      if (!bluffCall) {
        // Incorrect bluff call - previous player gets the cards
        setGameState(newGameState);
        setCurrentCenterCard(newGameState.centerCard);
        setNoCardsLeft(null);
        setEndBluff(false);
        
        // Show brief result message
        setWinner(previousPlayer);
        setShowVictoryScreen(true);
        setVictoryPlayer(previousPlayer);
        
        // Hide victory screen after 3 seconds and continue game
        setTimeout(() => {
          setShowVictoryScreen(false);
          setVictoryPlayer(null);
          setWinner(null);
        }, 3000);
      } else {
        // Correct bluff call - bluff caller gets the cards
        console.log("THIS IS THE NEW GAME STATE AFTER BLUFF CALL")
        console.log(newGameState);
        console.log(newGameState.players);
        console.log("newGameState.players[0].hand");
        console.log(newGameState.players[0].hand);
        console.log("newGameState.players[1].hand");
        console.log(newGameState.players[1].hand);

        console.log("oldCenterStack");
        console.log(oldCenterStack);
        console.log("Previous Center Stack from Game State");
        console.log(gameState.centerStack);

        setGameState(newGameState);
        setCurrentCenterCard(newGameState.centerCard);
        setNoCardsLeft(null);
        setEndBluff(false);
        
        // Show brief result message
        setWinner(bluffCaller);
        setShowVictoryScreen(true);
        setVictoryPlayer(bluffCaller);
        
        // Hide victory screen after 3 seconds and continue game
        setTimeout(() => {
          setShowVictoryScreen(false);
          setVictoryPlayer(null);
          setWinner(null);
        }, 3000);
      }
      
      // Hide bluff screen for all players after selection
      setTimeout(() => {
        setShowBluffScreen(false);
        setWinner(null);
        setSelectedBluffCard(null);
        setNoCardsLeft(null);
        setEndBluff(false);
        setIsBluffCorrect(null);
        // Don't hide victory screen here - let it show for 5 seconds
      }, 3000);
      
    });
    

    socket.on("next-card", ({roomCode}) => {
      console.log("HELLO" + roomCode);
    });
    
    socket.on("game-ended", ({ roomCode }) => {
      console.log("Game ended, returning to room");
      setShowBluffScreen(false);
      setWinner(null);
      setSelectedBluffCard(null);
      setShowVictoryScreen(false);
      setVictoryPlayer(null);
      setNoCardsLeft(null);
      setEndBluff(false);
      setIsBluffCorrect(null);
    });
    
  }, [socket]);


// Effect for handling the timer
useEffect(() => {
  let interval;

  if (noCardsLeft !== null && !endBluff) {
    setTimeLeft(10);
    interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimer(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setTimer(interval);
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
      setShowVictoryScreen(true);
      setVictoryPlayer(noCardsLeft);
      console.log(noCardsLeft + " wins the game!!!");
      
      // Send victory message
      socket.emit("send-message", {
        roomCode,
        playerName: "System",
        message: `${noCardsLeft} wins the game! No one called the bluff!`,
        system: true,
        timer: true
      });
      
      // Hide victory screen after 5 seconds and return to room
      setTimeout(() => {
        setShowVictoryScreen(false);
        setVictoryPlayer(null);
        // Emit event to return to room screen
        socket.emit("return-to-room", { roomCode });
      }, 5000);
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
  
  
      const placedCards = previousTurn.cardsPlaced; 
      setBluffCards(placedCards); // Update the state
      setShowBluffScreen(true); // Show the bluff screen
      setBluffCaller(playerName);
    
      console.log(placedCards); // This will log the correct cards placed in the previous turn
      socket.emit("bluff-call", { roomCode, bluffCaller: playerName, bluffCards: placedCards }); // Emit the correct cards
      socket.emit("send-message", {
        roomCode,
        playerName: "System",
        message: `${playerName} called ${previousTurn.playerName} on a bluff!`,
        system: true  // Flag it as a system message
      });
  
      console.log(`${playerName} called a bluff!`);
    }
  };
  

  const handlePlaceCard = (card) => {
    console.log(selectedCards.length);
    if (selectedCards.length > 0) {
      console.log("playerHand");
      console.log(playerHand);
      const newPlayerHand = playerHand.filter(handCard => !selectedCards.includes(handCard));
      setPlayerHand(newPlayerHand);
      console.log(newPlayerHand);
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

  function getSuitSymbol(card) {
    if (!card) return "";
    if (card.includes("Hearts")) return "♥";
    if (card.includes("Diamonds")) return "♦";
    if (card.includes("Spades")) return "♠";
    if (card.includes("Clubs")) return "♣";
    return "";
  }
  
  function getSuitColor(card) {
    if (!card) return "";
    if (card.includes("Hearts") || card.includes("Diamonds")) return "red-suit";
    return "black-suit";
  }
  

  const suitSymbol = getSuitSymbol(currentCenterCard);
  

  const handleCardClick = (card) => {
    console.log(`${playerName} selected ${getCardValue(card)} as the bluff!`);
    console.log(previousTurn.numberSelected);
    console.log(playerHand);
    setSelectedBluffCard(card); // Set the selected card
    let bluffCall = true;
    const oldCenterStack = gameState.centerStack;
    const previousPlayer = previousTurn.playerName;
    if (getCardValue(card) === getCardValue(previousTurn.numberSelected)) {
      if (endBluff) {
        console.log(noCardsLeft + " wins the game!!!");
      } else {
        console.log("You guessed INCORRECT");
        const updatedPlayerHand = [...playerHand, ...gameState.centerStack];
        setPlayerHand(updatedPlayerHand);
        console.log("PLEASE DONT SHOW")
        console.log(playerHand);

        socket.emit("send-message", {
          roomCode,
          playerName: "System",
          message: `${playerName} guessed incorrectly!`,
          system: true  // Flag it as a system message
        });

        const updatedPlayers = gameState.players.map(p => {
          if (p.name === playerName) {
            return {
              ...p,
              hand: [...p.hand, ...gameState.centerStack]
            };
          }
          return p;
        });
        
        
  
        bluffCall = false;
        setIsBluffCorrect(false);
        // Reset the center stack
        const newGameState = {
          ...gameState,
          players: updatedPlayers,
          centerCard: "",
          centerStack: [],
          currentTurnPlayer: previousTurn.playerName
        };
        setCurrentCenterCard("");
        setGameState(newGameState);
        socket.emit("bluff-card-select", { roomCode, newGameState, bluffCall, previousPlayer, oldCenterStack, card, playerName });
      }
    } else {
      const updatedPlayers = gameState.players.map(p => {
        if (p.name === previousPlayer) {
          return {
            ...p,
            hand: [...p.hand, ...gameState.centerStack]
          };
        }
        return p;
      });
      
      const newGameState = {
        ...gameState,
        players: updatedPlayers,
        centerCard: "",
        centerStack: [],
        currentTurnPlayer: playerName
      }
      console.log(oldCenterStack);
      console.log(playerHand);
      setEndBluff(true);
      setIsBluffCorrect(true);
      setNoCardsLeft(null);
      socket.emit("bluff-card-select", { roomCode, newGameState, bluffCall, previousPlayer, oldCenterStack, card, playerName });
      socket.emit("send-message", {
        roomCode,
        playerName: "System",
        message: `${playerName} guessed correctly!`,
        system: true  // Flag it as a system message
      });

      console.log("You guessed CORRECT");
    };

    // The timeout is now handled in the bluff-card-selected event listener
  

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
      socket.emit("send-message", messageData);
      // setMessages((prevMessages) => [...prevMessages, messageData]);
      setNewMessage("");
    }
  };

  function getCardRank(card) {
    if (!card) return "";
    const rank = card.split(" ")[0];
    if (["Jack", "Queen", "King", "Ace"].includes(rank)) {
      return rank[0]; // J, Q, K, A
    }
    return rank;
  }
  
  

  return (
    <div className="game-screen">
      <div className="top-section">


        <div className="player-list">
          <h3>Players</h3>
          <ul>
            {players.map((player, index) => (
              <li key={index} className={player === gameState.currentTurnPlayer ? "active-player" : ""}>
                {player}
              </li>
            ))}
          </ul>
        </div>
        <div className="center-card-wrapper">

          <div className="center-card-container">
            <div className="stack-info">Stack: {gameState.centerStack.length}</div>
            <div className="center-card-stack">
              {gameState.centerStack.length >= 3 && (
                <div className="stacked-card back-layer-2" />
              )}
              {gameState.centerStack.length >= 2 && (
                <div className="stacked-card back-layer-1" />
              )}

              <div className="center-card">
                {currentCenterCard && (
                  <>
                    <div className={`corner top-left ${getSuitColor(currentCenterCard)}`}>
                      <div>{getCardRank(currentCenterCard)}</div>
                      <div>{getSuitSymbol(currentCenterCard)}</div>
                    </div>
                    <div className={`card-value ${getSuitColor(currentCenterCard)}`}>
                      {previousTurn.playerName
                        ? `${numberToWords(previousTurn.cardsPlaced.length)} ${currentCenterCard}${previousTurn.cardsPlaced.length > 1 ? "s" : ""}`
                        : currentCenterCard}
                    </div>
                    <div className={`corner bottom-right ${getSuitColor(currentCenterCard)}`}>
                      <div>{getCardRank(currentCenterCard)}</div>
                      <div>{getSuitSymbol(currentCenterCard)}</div>
                    </div>
                  </>
                )}
              </div>
            </div>



            <div className="action-buttons">
              {noCardsLeft && !endBluff ? (
                // Show only timer and bluff button during timer
                <>
                  <div className="timer-message">
                    <div className="timer-content">
                      <span className="timer-number">{timeLeft}</span>
                      <span className="timer-text">
                        {playerName === noCardsLeft 
                          ? "Will win!"
                          : "Call bluff!"
                        }
                      </span>
                    </div>
                  </div>
                  {previousTurn.playerName &&
                  previousTurn.cardsPlaced.length > 0 &&
                  playerName !== previousTurn.playerName &&
                  playerName !== noCardsLeft &&
                  gameState.centerStack.length !== 0 && (
                    <div className="bluff-button-container">
                      <button
                        className="bluff-button"
                        onClick={handleBluff}
                      >
                        Bluff
                      </button>
                    </div>
                  )}
                </>
              ) : (
                // Show normal game buttons when timer is not active
                <>
                  {playerName === gameState.currentTurnPlayer ? (
                    <div className={`place-card-buttons ${gameState.centerStack.length !== 0 ? 'three-buttons' : 'all'}`}>
                      {gameState.centerStack.length === 0 ? (
                        // Render 13 buttons when center stack is empty
                        <>
                          {["Ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "Jack", "Queen", "King"].map((cardName) => (
                            <button 
                              key={cardName} 
                              className="place-card-button" 
                              onClick={() => handlePlaceCard(cardName + " of " + suit)}
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
                          >
                            {getCardName(previousCardValue)}
                          </button>
                          <button 
                            className="place-card-button" 
                            onClick={() => handlePlaceCard(currentCenterCard)}
                          >
                            {getCardName(cardValue)}
                          </button>
                          <button 
                            className="place-card-button" 
                            onClick={() => handlePlaceCard(getCardName(nextCardValue) + " of " + suit)}
                          >
                            {getCardName(nextCardValue)}
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <>
                      <p className="waiting-message">Waiting for {gameState.currentTurnPlayer} to place a card...</p>
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
                      >
                        Bluff
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>      
        </div>

        <div className="messaging-section">
          <div className="message-box" ref={messageBoxRef} >
          {messages.map((message, index) => {
            return (
              <div key={index} className={message.timer ? "timer-system-message" : message.system ? "system-message" : ""}>
                {message.timer ? (
                  <span>{message.message}</span>
                ) : message.system ? (
                  <em>{message.message}</em>
                ) : (
                  <>
                    <strong>{message.playerName}:</strong> {message.message}
                  </>
                )}
              </div>
            );
          })}

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
      </div>



      <div className="bottom-row">
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
      </div>
      {showBluffScreen && (
        <div className="bluff-screen">
          <div className="previous-turn-info">
            {selectedBluffCard ? (
              // Message after selection
              playerName === bluffCaller ? (
                isBluffCorrect ? (
                  <>Great! You found the bluff. 🎉</>
                ) : (
                  <>Oops! You didn't find the bluff this time. 😅</>
                )
              ) : playerName === previousTurn.playerName ? (
                isBluffCorrect ? (
                  <>Oh no! Your bluff was caught! 😓</>
                ) : (
                  <>Nice! They couldn't find your bluff. 😎</>
                )
              ) : (
                <>
                  {isBluffCorrect
                    ? `${bluffCaller} successfully found ${previousTurn.playerName}'s bluff!`
                    : `${bluffCaller} failed to find ${previousTurn.playerName}'s bluff.`}
                </>
              )
            ) : (
              // Message before selection
              playerName === previousTurn.playerName ? (
                <>You got called! Waiting to see which card exposes your bluff...</>
              ) : playerName === bluffCaller ? (
                <>
                  You called the bluff! {previousTurn.playerName} claimed they placed{" "}
                  {numberToWords(previousTurn.cardsPlaced.length)} {previousTurn.numberSelected}
                  {previousTurn.cardsPlaced.length > 1 ? "s" : ""}. Can you find the bluff...
                </>
              ) : (
                <>
                  Will {previousTurn.playerName} get caught lying about placing{" "}
                  {numberToWords(previousTurn.cardsPlaced.length)} {previousTurn.numberSelected}
                  {previousTurn.cardsPlaced.length > 1 ? "s" : ""}?
                </>
              )
            )}
          </div>



          {playerName === bluffCaller ? (
            // Bluff Caller
            <>
              <div className="bluff-screen-title">
                {selectedBluffCard ? (
                  isBluffCorrect
                    ? "You won! 🎉 "
                    : "You lost! 😅 "
                ) : (
                  "Select a Card"
                )}
              </div>
              <div className="bluff-card-buttons">
                {bluffCards.map((card, index) => {
                  const suitSymbol = getSuitSymbol(card);
                  const rank = getCardRank(card);
                  const suitColor = getSuitColor(card);

                  const isRevealed = selectedBluffCard === card;

                  return (
                    <button
                      key={index}
                      className={`bluff-card-button ${
                        isRevealed
                          ? isBluffCorrect
                            ? "bluff-correct"
                            : "bluff-wrong"
                          : ""
                      }`}
                      onClick={() => handleCardClick(card)}
                      disabled={!!selectedBluffCard}
                    >
                      {isRevealed && (
                        <>
                          <div className={`corner top-left ${suitColor}`}>
                            <div>{rank}</div>
                            <div>{suitSymbol}</div>
                          </div>
                          <div className={`card-value ${suitColor}`}>{card}</div>
                          <div className={`corner bottom-right ${suitColor}`}>
                            <div>{rank}</div>
                            <div>{suitSymbol}</div>
                          </div>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>

            </>
          ) : playerName === previousTurn.playerName ? (
            // Player who got called for bluff
            <>
              <div className="bluff-screen-title">
                {selectedBluffCard ? (
                  isBluffCorrect
                    ? "You lost! 😅 "
                    : "You won! 🎉 "
                ) : (
                  `${bluffCaller} is selecting a card...`
                )}
              </div>
              <div className="bluff-card-buttons">
                {bluffCards.map((card, index) => {
                  const suitSymbol = getSuitSymbol(card);
                  const rank = getCardRank(card);
                  const suitColor = getSuitColor(card);
                  const isRevealed = selectedBluffCard === card;

                  return (
                    <button
                      key={index}
                      className={`bluff-card-button ${
                        isRevealed
                          ? isBluffCorrect
                            ? "bluff-wrong"
                            : "bluff-correct"
                          : ""
                      }`}
                      disabled
                    >
                      {isRevealed && (
                        <>
                          <div className={`corner top-left ${suitColor}`}>
                            <div>{rank}</div>
                            <div>{suitSymbol}</div>
                          </div>
                          <div className={`card-value ${suitColor}`}>
                            {card}
                          </div>
                          <div className={`corner bottom-right ${suitColor}`}>
                            <div>{rank}</div>
                            <div>{suitSymbol}</div>
                          </div>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>

            </>
          ) : (
            // Other players
            <>
              <div className="bluff-screen-title">
                {selectedBluffCard ? (
                  isBluffCorrect
                    ? `${bluffCaller} found the bluff! 🎉`
                    : `${bluffCaller} missed the bluff. 😅`
                ) : (
                  `${bluffCaller} is selecting a card...`
                )}
              </div>
              <div className="bluff-card-buttons">
                {bluffCards.map((card, index) => {
                  const suitSymbol = getSuitSymbol(card);
                  const rank = getCardRank(card);
                  const suitColor = getSuitColor(card);
                  const isRevealed = selectedBluffCard === card;

                  return (
                    <button
                      key={index}
                      className={`bluff-card-button ${isRevealed ? "selected" : ""}`}
                      disabled
                    >
                      {isRevealed && (
                        <>
                          <div className={`corner top-left ${suitColor}`}>
                            <div>{rank}</div>
                            <div>{suitSymbol}</div>
                          </div>
                          <div className={`card-value ${suitColor}`}>
                            {card}
                          </div>
                          <div className={`corner bottom-right ${suitColor}`}>
                            <div>{rank}</div>
                            <div>{suitSymbol}</div>
                          </div>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>

            </>
          )}

        </div>
      )}
      {showVictoryScreen && (
        <div className="victory-screen">
          <div className="victory-content">
            <h1 className="victory-title">
              {playerName === victoryPlayer ? "🎉 Victory! 🎉" : "😔 Defeat! 😔"}
            </h1>
            <p className="victory-message">
              {victoryPlayer} wins the game!
            </p>
            <div className="victory-timer">
              Returning to room in 3 seconds...
            </div>
            <button 
              onClick={() => {
                setShowVictoryScreen(false);
                setVictoryPlayer(null);
                setWinner(null);
                setShowBluffScreen(false);
                setSelectedBluffCard(null);
                setNoCardsLeft(null);
                setEndBluff(false);
                setIsBluffCorrect(null);
                socket.emit("return-to-room", { roomCode });
              }}
              style={{
                padding: '10px 20px',
                margin: '10px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Return to Room Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}