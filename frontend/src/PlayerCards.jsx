import React, { useState } from "react";
import Card from "./Card";

function PlayerCards({ cards }) {
    console.log("PlayerCards received cards:", cards);

  if (!Array.isArray(cards) || cards.length === 0) {
    return <p>No cards to display</p>;
  }

  const [cardOrder, setCardOrder] = useState(cards);

  const moveCard = (fromIndex, toIndex) => {
    const updatedOrder = [...cardOrder];
    const [movedCard] = updatedOrder.splice(fromIndex, 1);
    updatedOrder.splice(toIndex, 0, movedCard);
    setCardOrder(updatedOrder);
    console.log(`Moved card from index ${fromIndex} to index ${toIndex}`);
    console.log(`New card order: ${updatedOrder}`);
  };

  return (
    <div className="cards-container">
      {cardOrder.map((card, index) => (
        <Card key={index} index={index} card={card} moveCard={moveCard} />
      ))}
    </div>
  );
}

export default PlayerCards;
