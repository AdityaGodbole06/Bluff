import React from "react";
import { useDrag, useDrop } from "react-dnd";
import "./styles.css";

function Card({ card, index, moveCard, isSelected, onClick }) {
  const [{ isDragging }, drag] = useDrag({
    type: "CARD",
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: "CARD",
    hover: (item) => {
      if (item.index !== index) {
        moveCard(item.index, index);
        item.index = index;
      }
    },
  });

  const [rank, suit] = card.split(" of ");

  const suitSymbols = {
    Hearts: "♥",
    Diamonds: "♦",
    Spades: "♠",
    Clubs: "♣",
  };

  const suitSymbol = suitSymbols[suit] || "?";
  const isRed = suit === "Hearts" || suit === "Diamonds";
  const suitColorClass = isRed ? "red-suit" : "black-suit";

  const rankMap = {
    Ace: "A",
    Jack: "J",
    Queen: "Q",
    King: "K",
  };
  const shortRank = rankMap[rank] || rank; // Use mapped letter or number

  const cardClass = [
    "card",
    isSelected ? "selected" : "",
    isDragging ? "dragging" : "",
  ].join(" ");

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={cardClass}
      onClick={onClick}
    >
      <div className={`card-corner top-left1 ${suitColorClass}`}>
        {shortRank}
        <br />
        {suitSymbol}
      </div>
      <div className={`card-content ${suitColorClass}`}>{card}</div>
      <div className={`card-corner bottom-right1 ${suitColorClass}`}>
        {shortRank}
        <br />
        {suitSymbol}
      </div>
    </div>
  );
}

export default Card;
