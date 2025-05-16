// src/main.tsx

import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { GoldProvider } from './contexts/GoldContext';

/**
 * Точка входа в приложение Dota Clicker
 * 
 * Данный файл инициализирует React-приложение, рендеря корневой компонент App
 * в элемент с id 'root' в HTML-документе.
 * 
 * Компонент App обернут в GoldProvider для доступа к состоянию золота
 * во всех компонентах приложения через React Context API.
 * 
 * Структура приложения:
 * - GoldProvider: контекст для управления золотом
 *   - App: корневой компонент, содержащий маршрутизацию и основную логику
 */
createRoot(document.getElementById('root')!).render(
  <GoldProvider>
    <App />
  </GoldProvider>
);