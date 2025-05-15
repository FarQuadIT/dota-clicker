// src/pages/MainPage/MainPage.tsx

import { useEffect } from 'react';
import { useHeroStore, type HeroStats } from '../../contexts/heroStore';

/**
 * Компонент главной страницы
 * 
 * Отображает информацию о герое и его характеристиках
 */
export default function MainPage() {
  // Получаем характеристики героя и функцию для их установки из хранилища
  const stats = useHeroStore((state) => state.stats);
  const setStats = useHeroStore((state) => state.setStats);

  // Для демонстрации - создаем тестовые характеристики героя при первой загрузке
  useEffect(() => {
    // Если характеристики еще не установлены, создаем тестовые
    if (!stats) {
      const initialStats: HeroStats = {
        "max-health": 100,
        "health-regen": 1,
        "max-mana": 50,
        "mana-regen": 0.5,
        "damage": 10,
        "vampirism": 0,
        "movement-speed": 5,
        "income": 5,
        heroId: "1"
      };
      setStats(initialStats);
    }
  }, [stats, setStats]);

  return (
    <div style={{ 
      padding: '20px',
      color: 'white'
    }}>
      <h1>Главная страница</h1>
      
      {stats ? (
        <div style={{ marginTop: '20px' }}>
          <h2>Характеристики героя:</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {Object.entries(stats)
              .filter(([key]) => key !== 'heroId') // Исключаем технические поля
              .map(([key, value]) => (
                <li key={key} style={{ 
                  margin: '10px 0',
                  padding: '10px',
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: '4px'
                }}>
                  <strong>{key}:</strong> {typeof value === 'number' ? value.toFixed(2) : value}
                </li>
              ))}
          </ul>
        </div>
      ) : (
        <p>Загрузка характеристик героя...</p>
      )}
    </div>
  );
}