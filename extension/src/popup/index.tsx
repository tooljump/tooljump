import React from 'react';
import ReactDOM from 'react-dom/client';
import Popup from './Popup';

// Create root element and render the popup
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
); 