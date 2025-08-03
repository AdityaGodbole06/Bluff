import React from "react";
import Card from "./Card";

function PlayerCards({ cards, selectedCards, setSelectedCards, moveCard }) {

  // Handle card selection toggle
  const toggleSelectCard = (card) => {
    const isSelected = selectedCards.includes(card);
    if (isSelected) {
      setSelectedCards(selectedCards.filter((selectedCard) => selectedCard !== card));
    } else if (selectedCards.length < 4) {
      setSelectedCards([...selectedCards, card]);
    }
  };

  return (
    <div className="cards-container">
      {cards.map((card, index) => (
        <Card
          key={index}
          index={index}
          card={card}
          moveCard={moveCard}
          isSelected={selectedCards.includes(card)}
          onClick={() => toggleSelectCard(card)}
        />
      ))}
    </div>
  );
}

export default PlayerCards;
