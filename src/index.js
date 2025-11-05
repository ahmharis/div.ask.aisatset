import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Mengimpor file CSS Tailwind
import App from './App'; // Mengimpor komponen App.jsx Anda

// Ini adalah kode yang "menempelkan" komponen App Anda
// ke dalam <div id="root"> di file public/index.html
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);