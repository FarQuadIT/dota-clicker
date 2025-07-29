// src/features/ui/Footer/Footer.tsx

import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useGame } from '../../../contexts/GameContext';
import NavigationConfirmModal from '../NavigationConfirmModal';
import { audioManager } from '../../../game/managers/SoundManager';
import battleIconUrl from '/media/interface_icons/battle_alt_7.svg';
import mainIconUrl from '/media/interface_icons/main.svg';
import shopIconUrl from '/media/interface_icons/shop.svg';
import helpIconUrl from '/media/interface_icons/help.svg';
import ratingIconUrl from '/media/interface_icons/rating.svg';
import './Footer.css';

export default function Footer() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isGameActive, isPaused, pauseGame, resumeGame, gameController, setGameActive, isMenuBlocked } = useGame();

  // Состояние для модального окна подтверждения навигации
  const [showNavigationModal, setShowNavigationModal] = useState(false);
  const [targetPath, setTargetPath] = useState('');

  // Массив пунктов меню
  const menuItems = [
    { label: 'main', icon: mainIconUrl, type: 'svg', path: '/main' },
    { label: 'shop', icon: shopIconUrl, type: 'svg', path: '/shop' },
    { label: 'game', icon: battleIconUrl, type: 'svg', path: '/game' },
    { label: 'help', icon: helpIconUrl, type: 'svg', path: '/help' },
    { label: 'rating', icon: ratingIconUrl, type: 'svg', path: '/rating' },
  ];

  // Определяем активный пункт меню по текущему пути
  const activeIndex = menuItems.findIndex((item) => location.pathname.startsWith(item.path));
  
  // Рассчитываем позицию красной полоски (100% / 5 пунктов = 20%)
  const leftPosition = `${(activeIndex >= 0 ? activeIndex : 0) * 20}%`;

  // Функция получения золота за сессию
  const getSessionGold = (): number => {
    if (gameController && typeof gameController.getSessionGoldEarned === 'function') {
      return gameController.getSessionGoldEarned();
    }
    // Fallback: если GameController недоступен, возвращаем 0
    return 0;
  };

  // Обработчик клика по таб-меню
  const handleTabClick = (item: typeof menuItems[0]) => {
    // Если меню заблокировано, игнорируем клики
    if (isMenuBlocked) {
      return;
    }
    
    // Уведомляем AudioManager о пользовательском взаимодействии
    try {
      audioManager.onUserInteraction();
    } catch (error) {
      console.warn('⚠️ Не удалось разблокировать звуки:', error);
    }
    
    // Воспроизводим звук клика по навигации
    try {
      audioManager.playSound('ui_click');
    } catch (error) {
      console.warn('⚠️ Не удалось воспроизвести звук клика:', error);
    }

    
    // Если пользователь уже на этой странице, ничего не делаем
    if (location.pathname === item.path) {

      return;
    }

    // Проверяем состояние игры для определения нужности подтверждения
    const shouldShowConfirmation = () => {
      // Если игра не активна, подтверждение не нужно
      if (!isGameActive || isPaused) return false;
      
      // Если не переход с игры, подтверждение не нужно
      if (location.pathname !== '/game' || item.path === '/game') return false;
      
      // 🔥 НОВОЕ: Если игра в состоянии ожидания клика, подтверждение не нужно
      if (gameController && typeof gameController.getCurrentState === 'function') {
        const currentState = gameController.getCurrentState();
        if (currentState === 'waiting_for_start') {
          return false;
        }
      }
      
      return true;
    };

    // Если игра активна и пользователь хочет покинуть игру (переход С игры)
    if (shouldShowConfirmation()) {
      
      
      // Ставим игру на паузу
      pauseGame();
      
      // Показываем модальное окно подтверждения
      setTargetPath(item.path);
      setShowNavigationModal(true);
      
      
    } else {
      
      
      // Обычная навигация (включая выход из состояния WAITING_FOR_START)
      navigate(item.path);
    }
  };

  // Обработчик подтверждения навигации
  const handleConfirmNavigation = () => {
    setShowNavigationModal(false);
    
    // Логика сброса игры к исходному состоянию
    if (gameController) {
      // 1. Сохранение золота уже произошло в GameController автоматически
      // 2. Сбрасываем игру к исходному состоянию
      resetGameToInitialState();
    }
    
    // Переходим на целевую страницу
    navigate(targetPath);
    
    
  };

  // Обработчик отмены навигации
  const handleCancelNavigation = () => {
    setShowNavigationModal(false);
    setTargetPath('');
    
    // Снимаем игру с паузы и продолжаем играть
    resumeGame();
    
    
  };

  // Функция сброса игры к исходному состоянию
  const resetGameToInitialState = () => {
    if (!gameController) return;
    
    try {
      // 1. Восстанавливаем здоровье и ману героя до полных значений
      if (typeof gameController.restoreHeroToFullHealth === 'function') {
        gameController.restoreHeroToFullHealth();
      }
      
      // 2. Сбрасываем счетчик золота за сессию
      if (typeof gameController.resetSessionGold === 'function') {
        gameController.resetSessionGold();
      }
      
      // 3. Останавливаем игру (это подготовит её к перезапуску при возврате)
      if (typeof gameController.stopGame === 'function') {
        gameController.stopGame();
      }
      
      // 4. ИСПРАВЛЕНИЕ: Сбрасываем состояние паузы при выходе из игры
      try {
        audioManager.resetGamePause();
      } catch (error) {
        console.warn('⚠️ Ошибка при сбросе состояния паузы:', error);
      }
      
      // 5. Деактивируем игру в контексте (чтобы при возврате сработал перезапуск)
      setGameActive(false);
      
      
    } catch (error) {
      console.error('❌ Ошибка при сбросе игры:', error);
    }
  };

  return (
    <>
    <footer className={`footer-bar ${isMenuBlocked ? 'blocked' : ''}`}>
      {/* Создаем пункты меню */}
      {menuItems.map((item, index) => (
        <div
          key={item.label}
          className={`footer-item ${index === activeIndex ? 'active' : ''} ${isMenuBlocked ? 'blocked' : ''}`}
            onClick={() => handleTabClick(item)}
        >
          {item.type === 'svg' ? (
            <img src={item.icon} alt={item.label} className="footer-svg-icon" />
          ) : (
            <i className={item.icon}></i>
          )}
        </div>
      ))}

      {/* Красная полоска, которая следует за активным пунктом */}
      <div className="footer-follow" style={{ left: leftPosition }}></div>
    </footer>

      {/* Модальное окно подтверждения навигации */}
      <NavigationConfirmModal
        isVisible={showNavigationModal}
        targetTab={targetPath.replace('/', '')} // Убираем '/' из пути для отображения
        sessionGold={getSessionGold()}
        onConfirm={handleConfirmNavigation}
        onCancel={handleCancelNavigation}
      />
    </>
  );
}