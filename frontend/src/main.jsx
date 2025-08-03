import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

const API_URL = "https://bluff-production-939f.up.railway.app";
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
