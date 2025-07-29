// src/App.tsx

import { BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import MainPage from './pages/MainPage/MainPage';
import ShopPage from './pages/ShopPage/ShopPage';
import GamePage from './pages/GamePage/GamePage';
import HelpPage from './pages/HelpPage/HelpPage';
import RatingPage from './pages/RatingPage/RatingPage';
import Header from './features/ui/Header/Header';
import Footer from './features/ui/Footer/Footer';
import { useEffect, useState, useRef } from 'react';
import { useHeroStore } from './contexts/heroStore';
import { GameProvider } from './contexts/GameContext';
import type { HeroStats } from './shared/types';
import { TEST_USER_ID, TEST_HERO_ID } from './shared/constants';
import { fetchActiveHeroStats, fetchUserInfo, type UserInfo } from './shared/api/apiService';
import { audioManager } from './game/managers/SoundManager';

/**
 * Компонент содержимого приложения
 * 
 * Содержит маршрутизацию и основной макет приложения
 */
function AppContent() {
  const setStats = useHeroStore((state) => state.setStats);
  const stats = useHeroStore((state) => state.stats);
  const [isLoading, setIsLoading] = useState(false); // Добавляем состояние загрузки
  const [error, setError] = useState<string | null>(null); // Добавляем состояние ошибки
  const isMountedRef = useRef(true); // Ref для отслеживания состояния монтирования

  // Cleanup при размонтировании
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Инициализация звуковой системы при первой загрузке приложения
  useEffect(() => {
    let isCancelled = false;
    
    const initializeAudioSystem = async () => {
      try {
        await audioManager.initialize();
        
        if (!isCancelled) {
        }
      } catch (error) {
        if (!isCancelled) {
        }
      }
    };

    initializeAudioSystem();
    
    return () => {
      isCancelled = true;
    };
  }, []);

  // Инициализация характеристик героя при первой загрузке приложения
  useEffect(() => {
    // Инициализируем героя, только если его характеристики еще не загружены
    if (!stats) {
      // Устанавливаем флаг загрузки
      setIsLoading(true); 
      setError(null);
      
      // Сначала загружаем информацию о пользователе (включая осколки)
      fetchUserInfo(TEST_USER_ID)
      .then((userInfo: UserInfo | null) => {
        // Затем запрашиваем данные АКТИВНОГО героя с сервера
        return fetchActiveHeroStats(TEST_USER_ID).then(result => ({
          userInfo,
          heroData: result
        }));
      })
      .catch((error) => {
        // Если не удалось загрузить userInfo, продолжаем только с данными героя
        return fetchActiveHeroStats(TEST_USER_ID).then(result => ({
          userInfo: null,
          heroData: result
        }));
      })
      .then(({ userInfo, heroData }: any) => {
        // Проверяем, что компонент все еще смонтирован
        if (!isMountedRef.current) return;
        
        if (heroData) {
          // Устанавливаем характеристики героя в хранилище
          setStats(heroData.stats);
          
          // Инициализируем золото, доход И осколки одновременно
          if (heroData.gold !== undefined && heroData.income !== undefined) {
            const diamonds = userInfo?.diamonds ?? 0; // Получаем осколки из userInfo
            
            // Инициализируем контекст золота с осколками
            if ((window as any).initializeGoldContext) {
              (window as any).initializeGoldContext(heroData.gold, heroData.income, diamonds);
            }
          }
        } else {
            // Обрабатываем ошибку при загрузке данных
            const errorMessage = 'Не удалось загрузить характеристики героя';
            setError(errorMessage);
            
            // В случае ошибки используем стандартные данные
            setDefaultHeroStats();
          }
        })
        .catch((err: any) => {
          // Проверяем, что компонент все еще смонтирован
          if (!isMountedRef.current) return;
          
          // Обрабатываем ошибки при запросе
          const errorMessage = `Ошибка при загрузке характеристик героя: ${err.message}`;
          setError(errorMessage);
          
          // В случае ошибки используем стандартные данные
          setDefaultHeroStats();
        })
        .finally(() => {
          // Проверяем, что компонент все еще смонтирован
          if (!isMountedRef.current) return;
          
          // Снимаем флаг загрузки
          setIsLoading(false);
        });
    }
  }, [stats, setStats]);
  
  /**
   * Функция для установки стандартных данных в случае ошибки
   * Инициализирует базовые характеристики героя для работы приложения
   * в автономном режиме, когда сервер недоступен
   */
  const setDefaultHeroStats = () => {
    // Проверяем, что компонент все еще смонтирован
    if (!isMountedRef.current) return;
    
    // Создаем стандартные характеристики для демонстрации
    const initialStats: HeroStats = {
      "max-health": 100,
      "health-regen": 1,
      "max-mana": 50,
      "mana-regen": 0.5,
      "damage": 10,
      "vampirism": 5,  // Тестовое значение для проверки вампиризма (восстанавливает 5 HP за атаку)
      "movement-speed": 5,
      "income": 5,
      
      // Новые поля для интеграции с игрой
      "level": 1,
      "coins": 0,
      "current-health": 100, // Изначально = максимальному здоровью
      "current-mana": 50,    // Изначально = максимальной мане
      
      heroId: TEST_HERO_ID
    };
    
    setStats(initialStats);
    

  };

  return (
    <GameProvider>
      <div style={{ minHeight: '100vh', backgroundColor: '#242424' }}>
        <Header />
        <Footer />
      
      <main style={{
        paddingTop: '40px',
        paddingBottom: '50px',
        height: '100vh',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}>
        {/* Показываем индикатор загрузки, если данные загружаются */}
        {isLoading && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            height: '100%',
            color: 'white'
          }}>
            <p>Загрузка данных героя...</p>
          </div>
        )}
        
        {/* Показываем сообщение об ошибке, если есть */}
        {error && !isLoading && (
          <div style={{ 
            padding: '10px',
            backgroundColor: 'rgba(255, 0, 0, 0.1)',
            border: '1px solid #ff6b6b',
            borderRadius: '4px',
            color: '#ff6b6b',
            margin: '10px'
          }}>
            <p>{error}</p>
          </div>
        )}
        
        {/* Рендерим маршруты, только если нет загрузки */}
        {!isLoading && (
          <Routes>
            <Route path="/" element={<Navigate to="/main" replace />} />
            <Route path="/main" element={<MainPage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/game" element={<GamePage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/rating" element={<RatingPage />} />
          </Routes>
        )}
      </main>
    </div>
    </GameProvider>
  );
}

/**
 * Корневой компонент приложения
 * 
 * Содержит провайдеры и основной маршрутизатор
 */
function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;