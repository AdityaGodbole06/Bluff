import React from "react";
import { useDrag, useDrop } from "react-dnd";
import { ItemTypes } from "./ItemTypes"; // Ensure this is defined correctly

function Card({ card, index, moveCard }) {
  const [{ isDragging }, ref] = useDrag({
    type: ItemTypes.CARD,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: ItemTypes.CARD,
    hover: (draggedItem) => {
      if (draggedItem.index !== index) {
        moveCard(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
  });

  return (
    <div
      ref={(node) => ref(drop(node))}
      className="card"
      style={{
        opacity: isDragging ? 0.5 : 1, // Use isDragging to adjust opacity
        cursor: 'move',
      }}
    >
      {card}
    </div>
  );
}

export default Card;
