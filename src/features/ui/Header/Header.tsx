// src/features/ui/Header/Header.tsx

import { useState } from 'react';
import { useGold } from '../../../contexts/GoldContext'; // Импортируем хук для золота
import './Header.css';

/**
 * Компонент заголовка
 * 
 * Отображает верхнюю панель с золотом, пассивным доходом и кнопками управления
 */
export default function Header() {
  // Получаем золото и пассивный доход из контекста
  const { gold, passiveIncome } = useGold();
  
  // Состояние для отображения/скрытия настроек
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <header className="top-bar">
      {/* Левая иконка (возврат) */}
      <div id="resume-button" className="settings-button">
        <div className="left-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 472.615 472.615" width="24" height="24">
            <path d="M167.158,117.315l-0.001-77.375L0,193.619l167.157,153.679v-68.555c200.338,0.004,299.435,153.932,299.435,153.932 
              c3.951-19.967,6.023-40.609,6.023-61.736C472.615,196.295,341.8,117.315,167.158,117.315z" />
          </svg>
        </div>
      </div>

      {/* Центральная фигура */}
      <div className="top-bar-figure"></div>

      {/* Блок золота - теперь отображает реальные значения из контекста */}
      <div id="gold-container">
        <div id="gold-row">
          <span id="gold-amount">{gold.toFixed(2)}</span>
          <img src="/media/shop/images/gold.png" alt="Золото" width="18px" height="18px" />
        </div>
        <span id="passive-income">
          {passiveIncome.toFixed(2)} <img src="/media/shop/images/gold.png" alt="Золото" width="18px" height="18px" />/сек
        </span>
      </div>

      {/* Правая иконка (настройки) */}
      <div id="pause-button" className="right-icon">
        <button
          className={`settings-icon ${isSettingsOpen ? 'active' : ''}`}
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
        >
          <i className="fas fa-cog"></i>
        </button>
      </div>
    </header>
  );
}