import { logConstants } from './shared/constants';

// Тестируем при запуске
logConstants();

// Остальной код остается как был
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)