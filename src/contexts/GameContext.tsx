import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * Интерфейс для состояния игры
 */
interface GameState {
  isPaused: boolean;
  isGameActive: boolean; // Показывает, запущена ли игра (загружена и готова)
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
  const [gameController, setGameController] = useState<any>(null);

  // Переключение паузы
  const togglePause = useCallback(() => {
    if (!gameController || !isGameActive) {
      console.warn('⚠️ GameController не найден или игра неактивна');
      return;
    }
    
    if (isPaused) {
      gameController.resumeGame();
      setIsPaused(false);
      console.log('🟢 Игра возобновлена через контекст');
    } else {
      gameController.pauseGame();
      setIsPaused(true);
      console.log('🟡 Игра поставлена на паузу через контекст');
    }
  }, [gameController, isPaused, isGameActive]);

  // Постановка на паузу
  const pauseGame = useCallback(() => {
    if (!gameController || !isGameActive) {
      console.warn('⚠️ GameController не найден или игра неактивна');
      return;
    }
    
    if (!isPaused) {
      gameController.pauseGame();
      setIsPaused(true);
      console.log('🟡 Игра поставлена на паузу через контекст');
    }
  }, [gameController, isPaused, isGameActive]);

  // Снятие с паузы
  const resumeGame = useCallback(() => {
    if (!gameController || !isGameActive) {
      console.warn('⚠️ GameController не найден или игра неактивна');
      return;
    }
    
    if (isPaused) {
      gameController.resumeGame();
      setIsPaused(false);
      console.log('🟢 Игра возобновлена через контекст');
    }
  }, [gameController, isPaused, isGameActive]);

  // Установка активности игры
  const setGameActiveWrapper = useCallback((active: boolean) => {
    setIsGameActive(active);
    console.log(`🎮 Состояние игры изменено: ${active ? 'активна' : 'неактивна'}`);
  }, []);

  // Установка игрового контроллера
  const setGameControllerWrapper = useCallback((controller: any) => {
    setGameController(controller);
    console.log('🎮 GameController установлен в контекст');
  }, []);

  const value: GameContextType = {
    // Состояние
    isPaused,
    isGameActive,
    
    // Действия
    togglePause,
    pauseGame,
    resumeGame,
    setGameActive: setGameActiveWrapper,
    setGameController: setGameControllerWrapper,
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