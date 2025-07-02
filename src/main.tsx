import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { openDB } from './lib/indexedDB';

openDB().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
  // Clean up old localStorage keys after successful IndexedDB initialization
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith("dailyMeals_") || key === "personalProfile" || key === "myPantry" || key === "recentFoods")) {
      localStorage.removeItem(key);
    }
  }
}).catch(error => {
  console.error("Failed to open IndexedDB:", error);
  // Fallback or error handling for the user
});
