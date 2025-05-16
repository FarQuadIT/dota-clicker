// src/contexts/GoldContext.tsx

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { TEST_USER_ID, TEST_HERO_ID, API_BASE_URL } from '../shared/constants';

/**
 * Интерфейс для свойств контекста золота
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

// Создаем контекст с undefined как начальное значение
const GoldContext = createContext<GoldContextProps | undefined>(undefined);

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

  /**
   * Функция для синхронизации золота с сервером
   * @param forceUpdateIncome - Если true, отправляет текущий доход на сервер
   */
  const syncGoldWithServer = async (forceUpdateIncome = false) => {
    try {
      // При первой синхронизации или при принудительном обновлении отправляем актуальный доход
      const incomeToSend = (!wasIncomeUpdated || forceUpdateIncome) ? passiveIncome : 0;
      
      console.log(`💰 Синхронизация золота с сервером: доход=${incomeToSend}/сек`);
      
      // 1. Отправляем запрос на сервер для обновления золота
      const response = await fetch(`${API_BASE_URL}/update_user_money`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: TEST_USER_ID,
          heroId: TEST_HERO_ID,
          income: incomeToSend // Отправляем реальный доход при первой синхронизации
        })
      });
      
      // Отмечаем, что доход был обновлен
      if (!wasIncomeUpdated && incomeToSend > 0) {
        setWasIncomeUpdated(true);
      }
      
      // 2. Проверяем ответ
      if (!response.ok) {
        throw new Error(`Ошибка при синхронизации: ${response.status} ${response.statusText}`);
      }

      // 3. Извлекаем данные из ответа
      const data = await response.json();
      console.log('📊 Получены данные от сервера:', data);

      // 4. Запрашиваем актуальные данные героя
      const heroDataResponse = await fetch(`${API_BASE_URL}/hero_data?userId=${TEST_USER_ID}&heroId=${TEST_HERO_ID}`);
      
      if (!heroDataResponse.ok) {
        throw new Error(`Ошибка при получении данных героя: ${heroDataResponse.status} ${heroDataResponse.statusText}`);
      }
      
      // 5. Обрабатываем полученные данные
      const heroData = await heroDataResponse.json();
      console.log('🔄 Получены обновленные данные героя:', heroData);
      
      // 6. Обновляем золото, если оно изменилось
      if (heroData.coins !== undefined) {
        const serverGold = heroData.coins;
        const goldDifference = serverGold - gold;
        
        if (Math.abs(goldDifference) > 0.1) { // Порог для избежания проблем с округлением
          if (goldDifference > 0) {
            console.log(`💰 Получено ${goldDifference.toFixed(2)} золота от сервера`);
          } else {
            console.log(`⚠️ Обнаружено расхождение в золоте: ${goldDifference.toFixed(2)}`);
          }
          
          // Обновляем локальное значение золота
          console.log(`💰 Обновляем золото: ${gold.toFixed(2)} → ${serverGold.toFixed(2)}`);
          setGold(serverGold);
        }
      }
      
      // 7. Обновляем пассивный доход, если он изменился
      if (heroData.currentIncome !== undefined && Math.abs(heroData.currentIncome - passiveIncome) > 0.001) {
        console.log(`📈 Обновляем доход: ${passiveIncome.toFixed(2)} → ${heroData.currentIncome.toFixed(2)}/сек`);
        setPassiveIncome(heroData.currentIncome);
        
        // Если доход изменился, делаем принудительное обновление на сервере
        if (wasIncomeUpdated && heroData.currentIncome !== passiveIncome) {
          setTimeout(() => syncGoldWithServer(true), 100);
        }
      }
      
      // 8. Обновляем время последней синхронизации
      setLastServerSyncTime(Date.now());
      console.log('✅ Золото успешно синхронизировано с сервером');
    } catch (error) {
      console.error('❌ Ошибка при синхронизации золота с сервером:', error);
    }
  };

  /**
   * Эффект для увеличения золота каждую секунду и периодической синхронизации с сервером
   */
  useEffect(() => {
    // Запускаем интервал только если система инициализирована
    if (!isInitialized) return;

    console.log(`📈 Запуск автоматического начисления золота: +${passiveIncome} в секунду`);
    
    // Если это первый запуск после инициализации, немедленно синхронизируем с сервером
    // для установки правильного значения пассивного дохода
    if (!wasIncomeUpdated && passiveIncome > 0) {
      syncGoldWithServer(true);
    }
    
    // Создаем интервал, который будет выполняться каждую секунду
    const interval = setInterval(() => {
      // Увеличиваем золото на величину пассивного дохода
      setGold((prev) => prev + passiveIncome);
    }, 1000);

    // Создаем интервал для периодической синхронизации с сервером (каждые 15 секунд)
    const syncInterval = setInterval(() => {
      syncGoldWithServer();
    }, 15000);

    // Очищаем интервалы при размонтировании компонента
    return () => {
      clearInterval(interval);
      clearInterval(syncInterval);
    };
  }, [passiveIncome, isInitialized, wasIncomeUpdated]);

  /**
   * Функция инициализации контекста с данными с сервера
   */
  const initializeFromServer = (serverGold: number, serverIncome: number) => {
    console.log(`⚙️ Инициализация контекста золота: ${serverGold} золота, ${serverIncome}/сек`);
    
    // Устанавливаем начальные значения
    setGold(serverGold);
    setPassiveIncome(serverIncome);
    setLastServerSyncTime(Date.now());
    setIsInitialized(true);
    // Сброс флага обновления дохода
    setWasIncomeUpdated(false);
  };

  // Экспортируем функцию для инициализации из App.tsx
  (window as any).initializeGoldContext = initializeFromServer;

  // Предоставляем все необходимые значения через контекст
  return (
    <GoldContext.Provider
      value={{ 
        gold, 
        passiveIncome, 
        setGold, 
        setPassiveIncome, 
        lastServerSyncTime, 
        setLastServerSyncTime,
        syncGoldWithServer
      }}
    >
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