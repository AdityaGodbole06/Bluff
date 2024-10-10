import React from "react";
import Card from "./Card";

function PlayerCards({ cards, selectedCards, setSelectedCards, moveCard, isOrderEnabled }) {
  // Define the order of card ranks
  const cardRankOrder = ["Ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "Jack", "Queen", "King"];

  // Sorting function: sort by rank first, then suit
  const sortCards = (cards) => {
    const cardRankOrder = ["Ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "Jack", "Queen", "King"];
  
    return cards.slice().sort((a, b) => {
      // Fallback for missing or undefined rank/suit
      const rankA = cardRankOrder.indexOf(a.rank) !== -1 ? cardRankOrder.indexOf(a.rank) : 0;
      const rankB = cardRankOrder.indexOf(b.rank) !== -1 ? cardRankOrder.indexOf(b.rank) : 0;
  
      const suitA = a.suit || ''; // Fallback to empty string if suit is undefined
      const suitB = b.suit || '';
  
      // Compare ranks first
      if (rankA !== rankB) {
        return rankA - rankB;
      }
  
      // Compare suits alphabetically if ranks are the same
      return suitA.localeCompare(suitB);
    });
  };
  

  // Use sorted cards if ordering is enabled
  const displayedCards = isOrderEnabled ? sortCards(cards) : cards;

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
      {displayedCards.map((card, index) => (
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
