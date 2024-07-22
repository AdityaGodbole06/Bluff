import React from 'react';
import './styles.css';

const GameScreen = ({ players, playerCards }) => {
  return (
    <div className="game-container">
      <div className="player-list">
        <h3>Players</h3>
        <ul>
          {players.map((player, index) => (
            <li key={index}>{player}</li>
          ))}
        </ul>
      </div>
      <div className="cards-container">
        <h3>Your Cards</h3>
        <ul>
          {playerCards.map((card, index) => (
            <li key={index}>{card}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default GameScreen;
