// src/App.tsx

import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MainPage from './pages/MainPage/MainPage';
import ShopPage from './pages/ShopPage/ShopPage';
import GamePage from './pages/GamePage/GamePage';
import HelpPage from './pages/HelpPage/HelpPage';
import Header from './features/ui/Header/Header';
import Footer from './features/ui/Footer/Footer';
import { useEffect } from 'react';
import { useHeroStore } from './contexts/heroStore';
import type { HeroStats } from './shared/types';
import { API_BASE_URL, TEST_USER_ID, TEST_HERO_ID } from './shared/constants';
// src/App.tsx - добавить импорт и маршрут

// Добавить этот импорт
import ApiTestPage from './pages/ApiTestPage/ApiTestPage';



/**
 * Компонент содержимого приложения
 * 
 * Содержит маршрутизацию и основной макет приложения
 */
function AppContent() {
  const location = useLocation();
  const isShopPage = location.pathname === '/shop';
  const setStats = useHeroStore((state) => state.setStats);
  const stats = useHeroStore((state) => state.stats);

  // Инициализация характеристик героя при первой загрузке приложения
  useEffect(() => {
    // Инициализируем героя, только если его характеристики еще не загружены
    if (!stats) {
      console.log('Инициализация тестовых характеристик героя');
      
      // Для демонстрации - создаем тестовые характеристики
      // В будущем здесь будет запрос к API для получения данных
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
      
      // В будущем здесь можно добавить запрос к API примерно такого вида:
      // fetch(`${API_BASE_URL}/hero_data?userId=${TEST_USER_ID}&heroId=${TEST_HERO_ID}`)
      //   .then(response => response.json())
      //   .then(data => {
      //     const mappedStats = mapApiHeroData(data);
      //     setStats(mappedStats);
      //   })
      //   .catch(error => console.error('Ошибка при загрузке данных героя:', error));
    }
  }, [stats, setStats]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#242424' }}>
      <Header />
      <Footer />
      
      <main style={{
        paddingTop: '40px',
        paddingBottom: '50px',
        padding: isShopPage ? '0' : '20px',
        height: '100vh',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}>
        <Routes>
          <Route path="/" element={<Navigate to="/main" replace />} />
          <Route path="/main" element={<MainPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/game" element={<GamePage />} />
          <Route path="/help" element={<HelpPage />} />
          // Добавить этот маршрут внутри Routes компонента
          <Route path="/api-test" element={<ApiTestPage />} />
        </Routes>
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