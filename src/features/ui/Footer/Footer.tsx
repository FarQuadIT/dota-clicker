// src/features/ui/Footer/Footer.tsx

import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useGame } from '../../../contexts/GameContext';
import NavigationConfirmModal from '../NavigationConfirmModal';
import './Footer.css';

export default function Footer() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isGameActive, isPaused, pauseGame, resumeGame, gameController, setGameActive } = useGame();

  // Состояние для модального окна подтверждения навигации
  const [showNavigationModal, setShowNavigationModal] = useState(false);
  const [targetPath, setTargetPath] = useState('');

  // Массив пунктов меню
  const menuItems = [
    { label: 'main', icon: 'fas fa-home', path: '/main' },
    { label: 'shop', icon: 'fa fa-shopping-cart', path: '/shop' },
    { label: 'game', icon: 'fa fa-angle-double-up', path: '/game' },
    { label: 'help', icon: 'fas fa-question-circle', path: '/help' },
  ];

  // Определяем активный пункт меню по текущему пути
  const activeIndex = menuItems.findIndex((item) => location.pathname.startsWith(item.path));
  
  // Рассчитываем позицию красной полоски
  const leftPosition = `${(activeIndex >= 0 ? activeIndex : 0) * 25}%`;

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

    
    // Если пользователь уже на этой странице, ничего не делаем
    if (location.pathname === item.path) {

      return;
    }

    // Если игра активна и пользователь хочет покинуть игру (переход С игры)
    if (location.pathname === '/game' && isGameActive && !isPaused && item.path !== '/game') {
      
      
      // Ставим игру на паузу
      pauseGame();
      
      // Показываем модальное окно подтверждения
      setTargetPath(item.path);
      setShowNavigationModal(true);
      
      
    } else {
      
      
      // Обычная навигация
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
      
      // 4. Деактивируем игру в контексте (чтобы при возврате сработал перезапуск)
      setGameActive(false);
      
      
    } catch (error) {
      console.error('❌ Ошибка при сбросе игры:', error);
    }
  };

  return (
    <>
    <footer className="footer-bar">
      {/* Создаем пункты меню */}
      {menuItems.map((item, index) => (
        <div
          key={item.label}
          className={`footer-item ${index === activeIndex ? 'active' : ''}`}
            onClick={() => handleTabClick(item)}
        >
          <i className={item.icon}></i>
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