// src/contexts/GoldContext.tsx

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

/**
 * Интерфейс для свойств контекста золота
 * 
 * Включает текущее количество золота, пассивный доход, функции для изменения
 * этих значений и время последней синхронизации с сервером
 */
interface GoldContextProps {
  gold: number;                  // Текущее количество золота
  passiveIncome: number;         // Пассивный доход (золота в секунду)
  setGold: (value: number | ((prev: number) => number)) => void;            // Функция для изменения золота
  setPassiveIncome: (value: number | ((prev: number) => number)) => void;   // Функция для изменения дохода
  lastServerSyncTime: number;    // Время последней синхронизации с сервером
  setLastServerSyncTime: (value: number) => void; // Функция для обновления времени синхронизации
}

// Создаем контекст с undefined как начальное значение
const GoldContext = createContext<GoldContextProps | undefined>(undefined);

/**
 * Провайдер контекста золота
 * 
 * Оборачивает приложение и предоставляет доступ к состоянию золота
 * и функциям для его изменения во всех компонентах
 */
export const GoldProvider = ({ children }: { children: ReactNode }) => {
  // Состояние для хранения текущего количества золота (начальное значение: 1000)
  const [gold, setGold] = useState(1000);
  
  // Состояние для хранения пассивного дохода в секунду (начальное значение: 5)
  const [passiveIncome, setPassiveIncome] = useState(5);
  
  // Состояние для хранения времени последней синхронизации с сервером
  const [lastServerSyncTime, setLastServerSyncTime] = useState(Date.now());

  // Эффект для увеличения золота каждую секунду на величину пассивного дохода
  useEffect(() => {
    // Создаем интервал, который будет выполняться каждую секунду
    const interval = setInterval(() => {
      // Увеличиваем золото на величину пассивного дохода
      setGold((prev) => prev + passiveIncome);
    }, 1000);

    // Очищаем интервал при размонтировании компонента
    return () => clearInterval(interval);
  }, [passiveIncome]); // Зависимость от пассивного дохода - при его изменении интервал пересоздается

  // Предоставляем все необходимые значения через контекст
  return (
    <GoldContext.Provider
      value={{ 
        gold, 
        passiveIncome, 
        setGold, 
        setPassiveIncome, 
        lastServerSyncTime, 
        setLastServerSyncTime 
      }}
    >
      {children}
    </GoldContext.Provider>
  );
};

/**
 * Хук для использования контекста золота в компонентах
 * 
 * Предоставляет доступ к состоянию золота и функциям для его изменения
 * Выбрасывает ошибку, если используется вне GoldProvider
 */
export const useGold = () => {
  const context = useContext(GoldContext);
  
  // Проверка, что хук используется внутри провайдера
  if (!context) {
    throw new Error("useGold must be used within a GoldProvider");
  }
  
  return context;
};