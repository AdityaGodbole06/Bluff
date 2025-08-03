import React, { useState, useEffect } from "react";
import axios from "axios";
import io from "socket.io-client";
import GameScreen from "./GameScreen"; // Import the GameScreen component
import "./styles.css";

const API_URL = import.meta.env.VITE_API_URL || "https://bluff-production-939f.up.railway.app";
console.log("API_URL is:", API_URL);

const MAX_PLAYERS = 6; // Maximum number of players allowed

export default function App() {
  console.log("App component is loading...");
  
  // Add immediate visual feedback
  console.log("Rendering test component...");
  
  // Simple test component to see if React is working
  return (
    <div style={{ 
      padding: '20px', 
      textAlign: 'center', 
      color: 'white', 
      backgroundColor: '#1a1a1a', 
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>🚂 Bluff Game Test</h1>
      <p>If you can see this, React is working!</p>
      <p>API_URL: {API_URL}</p>
      <p>Environment: {import.meta.env.MODE}</p>
      <p>Time: {new Date().toLocaleString()}</p>
      <button 
        onClick={() => alert('Button works!')}
        style={{ 
          padding: '10px 20px', 
          margin: '10px', 
          backgroundColor: '#4CAF50', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px', 
          cursor: 'pointer' 
        }}
      >
        Test Button
      </button>
    </div>
  );
}
