import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

console.log("Environment variables:", {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  NODE_ENV: import.meta.env.NODE_ENV,
  MODE: import.meta.env.MODE
});

try {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log("App rendered successfully");
} catch (err) {
  console.error("CRITICAL RUNTIME ERROR in main.jsx:", err);
}
