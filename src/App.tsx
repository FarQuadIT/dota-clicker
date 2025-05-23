// src/App.tsx

import { BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import MainPage from './pages/MainPage/MainPage';
import ShopPage from './pages/ShopPage/ShopPage';
import GamePage from './pages/GamePage/GamePage';
import HelpPage from './pages/HelpPage/HelpPage';
import Header from './features/ui/Header/Header';
import Footer from './features/ui/Footer/Footer';
import { useEffect, useState } from 'react';
import { useHeroStore } from './contexts/heroStore';
import type { HeroStats } from './shared/types';
import { TEST_USER_ID, TEST_HERO_ID } from './shared/constants';
import { fetchHeroStats } from './shared/api/apiService';

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

  // Инициализация характеристик героя при первой загрузке приложения
  useEffect(() => {
    // Инициализируем героя, только если его характеристики еще не загружены
    if (!stats) {
      // Устанавливаем флаг загрузки
      setIsLoading(true); 
      setError(null);
      
      // Запрашиваем данные героя с сервера
      fetchHeroStats(TEST_USER_ID, TEST_HERO_ID)
      .then(result => {
        if (result) {
          // Устанавливаем характеристики героя в хранилище
          setStats(result.stats);
          
          // Инициализируем золото и доход
          if (result.gold !== undefined && result.income !== undefined) {
            // Инициализируем контекст золота
            if ((window as any).initializeGoldContext) {
              (window as any).initializeGoldContext(result.gold, result.income);
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
        .catch(err => {
          // Обрабатываем ошибки при запросе
          const errorMessage = `Ошибка при загрузке характеристик героя: ${err.message}`;
          setError(errorMessage);
          
          // В случае ошибки используем стандартные данные
          setDefaultHeroStats();
        })
        .finally(() => {
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
    // Создаем стандартные характеристики для демонстрации
    const initialStats: HeroStats = {
      "max-health": 100,
      "health-regen": 1,
      "max-mana": 50,
      "mana-regen": 0.5,
      "damage": 10,
      "vampirism": 0,
      "movement-speed": 5,
      "income": 5,
      heroId: TEST_HERO_ID
    };
    
    setStats(initialStats);
  };

  return (
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
          </Routes>
        )}
      </main>
    </div>
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