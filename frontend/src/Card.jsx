import React from "react";
import { useDrag, useDrop } from "react-dnd";

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


    return (
        <div
        ref={(node) => drag(drop(node))}
        onClick={onClick}
        style={{
            opacity: isDragging ? 0.5 : 1,
            border: isSelected ? "2px solid blue" : "1px solid gray",
            padding: "10px", /* Adjust padding */
            margin: "5px", /* Adjust margin */
            backgroundColor: "#007bff33", /* Background color */
            borderRadius: "8px", /* Curved corners */
            cursor: "move",
            boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)", /* Shadow */
            textAlign: "center", /* Center text */
            fontSize: "16px", /* Font size */
            maxWidth: "100px", /* Limit width to fit in container */
            maxHeight: "150px", /* Limit height to fit in container */
            overflow: "hidden", /* Hide overflow content */
        }}
    >
        {card}
    </div>
    );
}

export default Card;
