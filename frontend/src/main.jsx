import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
console.log("API_URL in main.jsx:", API_URL);

try {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (err) {
  console.error("CRITICAL RUNTIME ERROR in main.jsx:", err);
}
