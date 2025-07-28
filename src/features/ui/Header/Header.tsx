// src/features/ui/Header/Header.tsx

import { useState, useCallback, useMemo } from 'react';
import { useGold } from '../../../contexts/GoldContext'; // Импортируем хук для золота и осколков
import { useGame } from '../../../contexts/GameContext'; // Импортируем хук для игры
import SettingsModal from '../SettingsModal'; // Импортируем модальное окно настроек
import { audioManager } from '../../../game/managers/SoundManager'; // Импортируем звуковой менеджер
import settingsIconUrl from '/media/interface_icons/settings.svg';
import diamondsIconUrl from '/media/interface_icons/diamonds.png';
import './Header.css';

/**
 * Форматирует числовое значение для отображения
 * удаляя ненужные нули после запятой
 * 
 * @param value - Числовое значение для форматирования
 * @param decimals - Количество десятичных знаков (по умолчанию 2)
 * @returns Отформатированная строка
 */
const formatNumber = (value: number, decimals = 2): string => {
  if (decimals === 0) {
    // Для целых чисел просто округляем и возвращаем без дробной части
    return Math.round(value).toString();
  }
  
  const formatted = value.toFixed(decimals);
  return formatted.replace(/\.?0+$/, '');
};

/**
 * Компонент заголовка
 * 
 * Отображает верхнюю панель с золотом, осколками, пассивным доходом и кнопками управления
 */
export default function Header() {
  // Получаем золото, осколки и пассивный доход из контекста
  const { gold, diamonds, passiveIncome } = useGold();
  
  // Получаем игровой контекст для управления паузой
  const { isPaused, isGameActive, pauseGame, resumeGame, blockMenu, unblockMenu, isMenuBlocked } = useGame();
  
  // Состояние для отображения/скрытия настроек
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Мемоизируем отформатированные значения золота, осколков и дохода
  const formattedGold = useMemo(() => formatNumber(gold), [gold]);
  const formattedDiamonds = useMemo(() => formatNumber(diamonds, 0), [diamonds]); // Осколки без дробной части
  const formattedIncome = useMemo(() => formatNumber(passiveIncome), [passiveIncome]);
  
  // Обработчик для открытия настроек
  const openSettings = useCallback(() => {
    // Уведомляем AudioManager о пользовательском взаимодействии
    try {
      audioManager.onUserInteraction();
    } catch (error) {
      console.warn('⚠️ Не удалось разблокировать звуки:', error);
    }
    
    // Воспроизводим звук открытия модального окна
    try {
      audioManager.playSound('open_modal');
    } catch (error) {
      console.warn('⚠️ Не удалось воспроизвести звук открытия модального окна:', error);
    }
    
    setIsSettingsOpen(true);
    
    // При открытии настроек - ставим игру на паузу
    if (isGameActive && !isPaused) {
      pauseGame();
    }
    
    // Блокируем меню при открытии настроек
    blockMenu();
  }, [isGameActive, isPaused, pauseGame, blockMenu]);

  // Обработчик для закрытия настроек
  const closeSettings = useCallback(() => {
    setIsSettingsOpen(false);
    
    // При закрытии настроек - снимаем игру с паузы
    if (isGameActive && isPaused) {
      resumeGame();
    }
    
    // Разблокируем меню при закрытии настроек
    unblockMenu();
  }, [isGameActive, isPaused, resumeGame, unblockMenu]);

  return (
    <header className="top-bar">
      {/* Левый блок с осколками */}
      <div className="left-icon">
        <div className="diamonds-container">
          <img 
            src={diamondsIconUrl} 
            alt="Осколки" 
            className="diamonds-icon"
            width="18" 
            height="18" 
            loading="lazy"
          />
          <span className="diamonds-amount">{formattedDiamonds}</span>
        </div>
      </div>

      {/* Центральная фигура */}
      <div className="top-bar-figure"></div>

      {/* Блок золота - с отформатированными значениями */}
      <div id="gold-container">
        <div id="gold-row">
          <span id="gold-amount">{formattedGold}</span>
          <img 
            src="/media/shop/images/gold.png" 
            alt="Золото" 
            width="18" 
            height="18" 
            loading="lazy"
          />
        </div>
        <span id="passive-income">
          {formattedIncome} 
          <img 
            src="/media/shop/images/gold.png" 
            alt="Золото" 
            width="18" 
            height="18" 
            loading="lazy"
          />
          /сек
        </span>
      </div>

      {/* Правая иконка (настройки) */}
      <div id="pause-button" className="right-icon">
        <button
          className={`settings-icon ${isSettingsOpen ? 'active' : ''}`}
          onClick={openSettings}
          aria-label="Настройки"
          title="Настройки"
        >
          <img src={settingsIconUrl} alt="Настройки" className="settings-svg-icon" />
        </button>
      </div>

      {/* Модальное окно настроек */}
      <SettingsModal
        isVisible={isSettingsOpen}
        onClose={closeSettings}
      />
    </header>
  );
}