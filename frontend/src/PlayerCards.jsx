import React from "react";

const PlayerCards = ({ playerName, cards }) => {
  return (
    <div className="player-cards">
      <h4>{playerName}</h4>
      <ul>
        {cards.map((card, index) => (
          <li key={index}>{card}</li>
        ))}
      </ul>
    </div>
  );
};

export default PlayerCards;
