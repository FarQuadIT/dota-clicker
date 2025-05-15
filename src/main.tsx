// src/main.tsx

import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { GoldProvider } from './contexts/GoldContext';

/**
 * Точка входа в приложение
 * 
 * Оборачиваем приложение в GoldProvider для доступа к состоянию золота
 * во всех компонентах приложения. Здесь не нужно добавлять
 * другие провайдеры, так как они определены в других частях приложения.
 */
createRoot(document.getElementById('root')!).render(
  <GoldProvider>
    <App />
  </GoldProvider>
);