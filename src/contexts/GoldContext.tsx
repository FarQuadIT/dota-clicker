// src/contexts/GoldContext.tsx

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react';
import { TEST_USER_ID, TEST_HERO_ID, API_BASE_URL } from '../shared/constants';

/**
 * Интерфейс для контекста золота
 */
interface GoldContextProps {
  gold: number;                  // Текущее количество золота
  passiveIncome: number;         // Пассивный доход (золота в секунду)
  setGold: (value: number | ((prev: number) => number)) => void;
  setPassiveIncome: (value: number | ((prev: number) => number)) => void;
  lastServerSyncTime: number;    // Время последней синхронизации с сервером
  setLastServerSyncTime: (value: number) => void;
  syncGoldWithServer: (forceUpdateIncome?: boolean) => Promise<void>; // Функция для синхронизации золота с сервером
}

// Создаем контекст
const GoldContext = createContext<GoldContextProps | undefined>(undefined);

// Константы для синхронизации
const SYNC_INTERVAL_MS = 30000; // 30 секунд
const GOLD_UPDATE_INTERVAL_MS = 1000; // 1 секунда
const GOLD_DIFFERENCE_THRESHOLD = 0.1; // Порог для обновления золота
const INCOME_DIFFERENCE_THRESHOLD = 0.001; // Порог для обновления дохода

/**
 * Провайдер контекста золота
 */
export const GoldProvider = ({ children }: { children: ReactNode }) => {
  // Состояние для хранения текущего количества золота
  const [gold, setGold] = useState(0);
  
  // Состояние для хранения пассивного дохода в секунду
  const [passiveIncome, setPassiveIncome] = useState(0);
  
  // Состояние для хранения времени последней синхронизации с сервером
  const [lastServerSyncTime, setLastServerSyncTime] = useState(Date.now());

  // Флаг инициализации
  const [isInitialized, setIsInitialized] = useState(false);

  // Флаг для проверки, была ли первая синхронизация дохода
  const [wasIncomeUpdated, setWasIncomeUpdated] = useState(false);

  // Ref для хранения актуального значения пассивного дохода
  const passiveIncomeRef = useRef(passiveIncome);

  // Синхронизируем ref с состоянием
  useEffect(() => {
    passiveIncomeRef.current = passiveIncome;
  }, [passiveIncome]);

  /**
   * Функция для синхронизации золота с сервером
   * @param forceUpdateIncome - Если true, отправляет текущий доход на сервер
   */
  const syncGoldWithServer = useCallback(async (forceUpdateIncome = false) => {
    // Получаем текущие значения через callback и ref
    let currentGold = 0;
    let currentWasIncomeUpdated = false;
    
    setGold((g) => {
      currentGold = g;
      return g;
    });
    setWasIncomeUpdated((wiu) => {
      currentWasIncomeUpdated = wiu;
      return wiu;
    });
    
    const currentPassiveIncome = passiveIncomeRef.current;
    
    try {
      // При первой синхронизации или при принудительном обновлении отправляем актуальный доход
      const incomeToSend = (!currentWasIncomeUpdated || forceUpdateIncome) ? currentPassiveIncome : 0;
      
      // 1. Отправляем запрос на сервер для обновления золота
      const response = await fetch(`${API_BASE_URL}/update_user_money`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: TEST_USER_ID,
          heroId: TEST_HERO_ID,
          income: incomeToSend
        })
      });
      
      // Отмечаем, что доход был обновлен
      if (!currentWasIncomeUpdated && incomeToSend > 0) {
        setWasIncomeUpdated(true);
      }
      
      // 2. Проверяем ответ
      if (!response.ok) {
        throw new Error(`Ошибка при синхронизации: ${response.status} ${response.statusText}`);
      }

      // 3. Извлекаем данные из ответа
      const updateResponse = await response.json();

      // 4. Запрашиваем актуальные данные героя
      const heroDataResponse = await fetch(`${API_BASE_URL}/hero_data?userId=${TEST_USER_ID}&heroId=${TEST_HERO_ID}`);
      
      if (!heroDataResponse.ok) {
        throw new Error(`Ошибка при получении данных героя: ${heroDataResponse.status} ${heroDataResponse.statusText}`);
      }
      
      // 5. Обрабатываем полученные данные
      const heroData = await heroDataResponse.json();
      
      // 6. Обновляем золото, если оно изменилось
      if (heroData.coins !== undefined) {
        const serverGold = heroData.coins;
        const goldDifference = Math.abs(serverGold - currentGold);
        
        if (goldDifference > GOLD_DIFFERENCE_THRESHOLD) {
          setGold(serverGold);
        }
      }
      
      // 7. Обновляем пассивный доход, если он изменился
      if (heroData.currentIncome !== undefined) {
        const incomeDifference = Math.abs(heroData.currentIncome - currentPassiveIncome);
        
        if (incomeDifference > INCOME_DIFFERENCE_THRESHOLD) {
          setPassiveIncome(heroData.currentIncome);
          
          // Если доход изменился, делаем принудительное обновление на сервере
          if (currentWasIncomeUpdated && heroData.currentIncome !== currentPassiveIncome) {
            setTimeout(() => syncGoldWithServer(true), 100);
          }
        }
      }
      
      // 8. Обновляем время последней синхронизации
      setLastServerSyncTime(Date.now());
      
    } catch (error) {
      console.error('❌ Ошибка синхронизации с сервером:', error);
    }
  }, []);

  /**
   * Функция для увеличения золота на величину пассивного дохода
   */
  const updateGold = useCallback(() => {
    const currentIncome = passiveIncomeRef.current;
    if (currentIncome > 0) {
      setGold((prev) => prev + currentIncome);
    }
  }, []);

  /**
   * Эффект для увеличения золота каждую секунду и периодической синхронизации с сервером
   */
  useEffect(() => {
    // Запускаем интервал только если система инициализирована
    if (!isInitialized) {
      return;
    }
    
    // Создаем интервал, который будет выполняться каждую секунду
    const interval = setInterval(updateGold, GOLD_UPDATE_INTERVAL_MS);

    // Создаем интервал для периодической синхронизации с сервером
    const syncInterval = setInterval(() => {
      syncGoldWithServer();
    }, SYNC_INTERVAL_MS);

    // Очищаем интервалы при размонтировании компонента
    return () => {
      clearInterval(interval);
      clearInterval(syncInterval);
    };
  }, [isInitialized, updateGold]);

  /**
   * Отдельный эффект для первичной синхронизации при изменении дохода
   */
  useEffect(() => {
    // Если это первый запуск после инициализации, немедленно синхронизируем с сервером
    // для установки правильного значения пассивного дохода
    if (isInitialized && !wasIncomeUpdated && passiveIncome > 0) {
      syncGoldWithServer(true);
    }
  }, [passiveIncome, wasIncomeUpdated, isInitialized]);

  /**
   * Функция инициализации контекста с данными с сервера
   * Устанавливает начальные значения золота, дохода и состояния синхронизации
   * на основе данных, полученных с сервера
   * 
   * @param serverGold - Начальное значение золота с сервера
   * @param serverIncome - Начальное значение дохода с сервера
   */
  const initializeGoldFromServer = useCallback((serverGold: number, serverIncome: number) => {
    // Устанавливаем начальные значения
    setGold(serverGold);
    setPassiveIncome(serverIncome);
    setLastServerSyncTime(Date.now());
    setIsInitialized(true);
    // Сброс флага обновления дохода
    setWasIncomeUpdated(false);
  }, []);

  /**
   * Функция для обновления золота из GameController (мгновенная синхронизация UI)
   * @param newGoldAmount - новое количество золота
   */
  const updateGoldFromGame = useCallback((newGoldAmount: number) => {
    setGold((currentGold) => {
      const goldDifference = Math.abs(newGoldAmount - currentGold);
    
    if (goldDifference > GOLD_DIFFERENCE_THRESHOLD) {
        return newGoldAmount;
    } else {
        return currentGold;
    }
    });
  }, []);

  /**
   * Глобальные функции, доступные извне компонента
   * Используются для интеграции с игрой и инициализации
   */
  useEffect(() => {
    (window as any).initializeGoldContext = initializeGoldFromServer;
    (window as any).updateGoldFromGameController = updateGoldFromGame;
    
    // Очищаем глобальные функции при размонтировании компонента
    return () => {
      delete (window as any).initializeGoldContext;
      delete (window as any).updateGoldFromGameController;
    };
  }, [initializeGoldFromServer, updateGoldFromGame]);

  // Мемоизируем значение контекста, чтобы избежать лишних ре-рендеров
  const contextValue = useMemo(() => ({ 
    gold, 
    passiveIncome, 
    setGold, 
    setPassiveIncome, 
    lastServerSyncTime, 
    setLastServerSyncTime,
    syncGoldWithServer
  }), [gold, passiveIncome, lastServerSyncTime, syncGoldWithServer]);

  // Предоставляем все необходимые значения через контекст
  return (
    <GoldContext.Provider value={contextValue}>
      {children}
    </GoldContext.Provider>
  );
};

/**
 * Хук для использования контекста золота в компонентах
 */
export const useGold = () => {
  const context = useContext(GoldContext);
  
  // Проверка, что хук используется внутри провайдера
  if (!context) {
    throw new Error("useGold must be used within a GoldProvider");
  }
  
  return context;
};