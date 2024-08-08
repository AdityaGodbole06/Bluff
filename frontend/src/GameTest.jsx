import React, { useState, useEffect } from "react";

const GameTest = ({ socket, roomCode }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    socket.on("update-count", (newCount) => {
      setCount(newCount);
    });

    return () => {
      socket.off("update-count");
    };
  }, [socket]);

  const handleIncrease = () => {
    const newCount = count + 1;
    setCount(newCount);
    socket.emit("increase-count", { roomCode, newCount });
  };

  return (
    <div>
      <h1>{count}</h1>
      <button onClick={handleIncrease}>Increase</button>
    </div>
  );
};

export default GameTest;
