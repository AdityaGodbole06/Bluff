import React from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import PlayerCards from "./PlayerCards";

export default function GameScreen({ players, playerCards }) {
  return (
    <div className="game-screen">
      <div>
        <div className="player-list">
          <h3>Players</h3>
          <ul>
            {players.map((player, index) => (
              <li key={index}>{player}</li>
            ))}
          </ul>
        </div>
        <div className="player-cards-section">
          <h3>Your Cards</h3>
          <DndProvider backend={HTML5Backend}>
            <PlayerCards cards={playerCards} />
          </DndProvider>
        </div>
      </div>
    </div>
  );
}
