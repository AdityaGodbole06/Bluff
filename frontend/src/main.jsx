import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

console.log("Environment variables:", {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  NODE_ENV: import.meta.env.NODE_ENV,
  MODE: import.meta.env.MODE
});

try {
  console.log("Starting React app...");
  const rootElement = document.getElementById('root');
  console.log("Root element found:", rootElement);
  
  if (!rootElement) {
    throw new Error("Root element not found!");
  }
  
  const root = ReactDOM.createRoot(rootElement);
  console.log("React root created");
  
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log("App rendered successfully");
} catch (err) {
  console.error("CRITICAL RUNTIME ERROR in main.jsx:", err);
  // Add immediate visual feedback
  document.body.innerHTML = `
    <div style="padding: 20px; color: red; background: white; font-family: Arial;">
      <h1>React Error</h1>
      <p>Error: ${err.message}</p>
      <p>Stack: ${err.stack}</p>
    </div>
  `;
}
