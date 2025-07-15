import React from 'react';
import ReactDOM from 'react-dom/client'; // Importa createRoot desde react-dom/client
import App from './App.jsx'; // Asegúrate de que la ruta a App.jsx sea correcta
import './index.css'; // Importa tus estilos CSS globales

// Encuentra el elemento root en tu index.html
const rootElement = document.getElementById('root');

// Crea una raíz de React y renderiza tu componente App en ella
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
