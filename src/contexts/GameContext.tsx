import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * Интерфейс для состояния игры
 */
interface GameState {
  isPaused: boolean;
  isGameActive: boolean; // Показывает, запущена ли игра (загружена и готова)
  isMenuBlocked: boolean; // Показывает, заблокированы ли меню (при открытии модальных окон)
}

/**
 * Интерфейс для методов управления игрой
 */
interface GameActions {
  togglePause: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  setGameActive: (active: boolean) => void;
  setGameController: (controller: any) => void;
  gameController: any; // Добавляем доступ к GameController
  blockMenu: () => void; // Блокировка меню (при открытии модальных окон)
  unblockMenu: () => void; // Разблокировка меню (при закрытии модальных окон)
}

/**
 * Полный интерфейс контекста игры
 */
interface GameContextType extends GameState, GameActions {}

// Создаем контекст
const GameContext = createContext<GameContextType | undefined>(undefined);

/**
 * Провайдер контекста игры
 */
export function GameProvider({ children }: { children: React.ReactNode }) {
  const [isPaused, setIsPaused] = useState(false);
  const [isGameActive, setIsGameActive] = useState(false);
  const [isMenuBlocked, setIsMenuBlocked] = useState(false);
  const [gameController, setGameController] = useState<any>(null);

  // Переключение паузы
  const togglePause = useCallback(() => {
    if (!gameController || !isGameActive) {
      return;
    }
    
    if (isPaused) {
      gameController.resumeGame();
      setIsPaused(false);
    } else {
      gameController.pauseGame();
      setIsPaused(true);
    }
  }, [gameController, isPaused, isGameActive]);

  // Постановка на паузу
  const pauseGame = useCallback(() => {
    if (!gameController || !isGameActive) {
      return;
    }
    
    if (!isPaused) {
      gameController.pauseGame();
      setIsPaused(true);
    }
  }, [gameController, isPaused, isGameActive]);

  // Снятие с паузы
  const resumeGame = useCallback(() => {
    if (!gameController || !isGameActive) {
      return;
    }
    
    if (isPaused) {
      gameController.resumeGame();
      setIsPaused(false);
    }
  }, [gameController, isPaused, isGameActive]);

  // Установка активности игры
  const setGameActiveWrapper = useCallback((active: boolean) => {
    setIsGameActive(active);
  }, []);

  // Установка игрового контроллера
  const setGameControllerWrapper = useCallback((controller: any) => {
    setGameController(controller);
    
    // При установке нового GameController сбрасываем состояние паузы
    if (controller && isPaused) {
      setIsPaused(false);
    }
  }, [isPaused]);

  // Блокировка меню
  const blockMenu = useCallback(() => {
    setIsMenuBlocked(true);
  }, []);

  // Разблокировка меню
  const unblockMenu = useCallback(() => {
    setIsMenuBlocked(false);
  }, []);

  const value: GameContextType = {
    // Состояние
    isPaused,
    isGameActive,
    isMenuBlocked,
    
    // Действия
    togglePause,
    pauseGame,
    resumeGame,
    setGameActive: setGameActiveWrapper,
    setGameController: setGameControllerWrapper,
    gameController, // Добавляем доступ к GameController
    blockMenu,
    unblockMenu,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

/**
 * Хук для использования контекста игры
 */
export function useGame(): GameContextType {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame должен использоваться внутри GameProvider');
  }
  return context;
} 