import React from 'react';
import './HeroesModal.css';
import { TEST_USER_ID, TEST_HERO_ID } from '../../../shared/constants';
import { switchActiveHero, fetchActiveHeroStats } from '../../../shared/api/apiService';
import { useHeroStore } from '../../../contexts/heroStore';

/**
 * Пропсы для модального окна всех героев
 */
interface HeroesModalProps {
  /** Показывать ли модальное окно */
  isVisible: boolean;
  /** Коллбэк при закрытии модального окна */
  onClose: () => void;
}

/**
 * Данные героев (id соответствует hero_id в heroConfig.ts)
 */
const heroes = [
  { id: 1, name: 'Джаггернаут', image: '/media/main/heroes/slider/juggernaut.png' },
  { id: 2, name: 'Кентавр', image: '/media/main/heroes/slider/centaur.png' }
];

/**
 * Модальное окно для отображения всех героев
 */
const HeroesModal: React.FC<HeroesModalProps> = ({
  isVisible,
  onClose
}) => {
  // Получаем характеристики героя из хранилища
  const stats = useHeroStore((state) => state.stats);

  if (!isVisible) return null;

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // Закрываем модалку при клике на overlay, но не на само модальное окно
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  // Обработчик выбора героя
  const handleHeroSelect = async (heroId: number) => {
    // Получаем ID текущего героя из store точно так же, как в MainPage.tsx
    const currentHeroNumericId = stats?.heroId ? parseInt(stats.heroId) : parseInt(TEST_HERO_ID);
    
    // Проверяем что это не текущий герой (эта проверка не критична)
    if (heroId === currentHeroNumericId) {
      onClose();
      return;
    }

    
    try {
      const success = await switchActiveHero(TEST_USER_ID, heroId);
      if (success) {
        onClose();
        
        // Загружаем обновленные данные активного героя
        const activeHeroData = await fetchActiveHeroStats(TEST_USER_ID);
        if (activeHeroData) {
          // Обновляем данные героя в store
          useHeroStore.getState().setStats(activeHeroData.stats);
          
          // Инициализируем золото и доход для нового героя напрямую
          if ((window as any).initializeGoldContext) {
            // Получаем текущее количество алмазов, чтобы не перезаписать их
            const currentDiamonds = (window as any).getCurrentDiamonds 
              ? (window as any).getCurrentDiamonds() 
              : 0;
              
            (window as any).initializeGoldContext(
              activeHeroData.gold,
              activeHeroData.income,
              currentDiamonds // Сохраняем текущие алмазы
            );
          }
        } else {
          console.warn('⚠️ Не удалось загрузить данные нового героя');
        }
      } else {
        console.error('❌ Не удалось переключить героя');
      }
    } catch (error) {
      console.error('❌ Ошибка при переключении героя:', error);
    }
  };

  return (
    <div className="heroes-modal-overlay" onClick={handleOverlayClick}>
      <div className="heroes-modal">
        
        {/* Декоративные элементы по углам */}
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          width: '20px',
          height: '20px',
          border: '2px solid rgba(255, 215, 0, 0.4)',
          borderLeft: 'none',
          borderBottom: 'none',
          borderRadius: '0 4px 0 0',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '8px',
          left: '8px',
          width: '20px',
          height: '20px',
          border: '2px solid rgba(255, 215, 0, 0.4)',
          borderRight: 'none',
          borderTop: 'none',
          borderRadius: '0 0 0 4px',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '8px',
          right: '8px',
          width: '20px',
          height: '20px',
          border: '2px solid rgba(255, 215, 0, 0.4)',
          borderLeft: 'none',
          borderTop: 'none',
          borderRadius: '0 0 4px 0',
          pointerEvents: 'none'
        }} />
        
        {/* Заголовок */}
        <div className="heroes-modal-header">
          <h2 className="heroes-modal-title">⚔️ ГЕРОИ</h2>
          <button 
            className="heroes-modal-close-btn"
            onClick={onClose}
            aria-label="Закрыть героев"
          >
            ✕
          </button>
        </div>

        {/* Основное содержимое */}
        <div className="heroes-modal-content">
          <div className="heroes-grid">
            {heroes.map((hero) => (
              <div 
                key={hero.id} 
                className="hero-card"
                onClick={() => handleHeroSelect(hero.id)}
                style={{ cursor: 'pointer' }}
              >
                <div className="hero-image-container">
                  <img 
                    src={hero.image} 
                    alt={hero.name}
                    className="hero-image"
                  />
                </div>
                <h3 className="hero-name">{hero.name}</h3>
              </div>
            ))}
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="heroes-modal-actions">
          <button
            className="heroes-modal-btn heroes-modal-btn-close"
            onClick={onClose}
            aria-label="Закрыть героев"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeroesModal; 