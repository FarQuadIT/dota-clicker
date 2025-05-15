import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { GoldProvider } from './contexts/GoldContext'; // Импортируем GoldProvider

/**
 * Точка входа в приложение
 * 
 * Оборачиваем приложение в GoldProvider для доступа к состоянию золота
 * во всех компонентах
 */
createRoot(document.getElementById('root')!).render(
  <GoldProvider>
    <App />
  </GoldProvider>
);