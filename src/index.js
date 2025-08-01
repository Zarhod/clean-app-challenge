import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Peut être vide ou contenir des styles de base
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);