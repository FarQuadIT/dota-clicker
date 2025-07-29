import React, { useState } from 'react';
import './HeroesModal.css';
import { TEST_USER_ID, TEST_HERO_ID } from '../../../shared/constants';
import { switchActiveHero, fetchActiveHeroStats } from '../../../shared/api/apiService';
import { useHeroStore } from '../../../contexts/heroStore';
import { useUser } from '../../../contexts/UserContext';
import HeroPreview from './HeroPreview';

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
  
  // Получаем данные пользователя для проверки доступности героев
  const { userData, isHeroEnabled, isHeroDisabled } = useUser();

  // Состояние для превью героя
  const [previewHero, setPreviewHero] = useState<{ id: number; name: string } | null>(null);

  if (!isVisible) return null;

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // Закрываем модалку при клике на overlay, но не на само модальное окно
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  // Обработчик выбора героя
  const handleHeroSelect = async (heroId: number) => {
    const hero = heroes.find(h => h.id === heroId);
    
    // Если герой заблокирован - открываем превью
    if (isHeroDisabled(heroId)) {
      console.log(`Открываем превью героя ${heroId}`);
      setPreviewHero(hero || null);
      return;
    }

    // Проверяем что герой доступен
    if (!isHeroEnabled(heroId)) {
      console.log(`Герой ${heroId} недоступен для выбора`);
      return;
    }

    // Получаем ID текущего героя из store точно так же, как в MainPage.tsx
    const currentHeroNumericId = stats?.heroId ? parseInt(stats.heroId) : parseInt(TEST_HERO_ID);
    
    // Проверяем что это не текущий герой (эта проверка не критична)
    if (heroId === currentHeroNumericId) {
      console.log(`Герой ${heroId} уже активен`);
      onClose();
      return;
    }

    try {
      const success = await switchActiveHero(TEST_USER_ID, heroId);
      if (success) {
        console.log(`✅ Герой успешно переключен на ${heroId}`);
        
        // Загружаем обновленные данные активного героя
        const activeHeroData = await fetchActiveHeroStats(TEST_USER_ID);
        if (activeHeroData) {
          // Обновляем данные героя в store
          useHeroStore.getState().setStats(activeHeroData.stats);
          console.log(`✅ Данные героя ${heroId} обновлены в store`);
        } else {
          console.warn('⚠️ Не удалось загрузить данные нового героя');
        }
        
        // Закрываем модальное окно
        onClose();
      } else {
        console.error('❌ Не удалось переключить героя');
      }
    } catch (error) {
      console.error('❌ Ошибка при переключении героя:', error);
    }
  };

  // Обработчик закрытия превью
  const handleClosePreview = () => {
    setPreviewHero(null);
  };

  // Если открыт превью героя, показываем его
  if (previewHero) {
    return (
      <HeroPreview
        heroId={previewHero.id}
        heroName={previewHero.name}
        onClose={handleClosePreview}
        onBack={handleClosePreview}
      />
    );
  }

  return (
    <div className="heroes-modal-overlay" onClick={handleOverlayClick}>
      <div className="heroes-modal">
        {/* Заголовок */}
        <div className="heroes-modal-header">
          <h2 className="heroes-modal-title">Герои</h2>
          <button 
            className="heroes-modal-close-btn"
            onClick={onClose}
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>

        {/* Основной контент */}
        <div className="heroes-modal-content">
          <div className="heroes-grid">
            {heroes.map((hero) => {
              const isEnabled = isHeroEnabled(hero.id);
              const isDisabled = isHeroDisabled(hero.id);
              const currentHeroNumericId = stats?.heroId ? parseInt(stats.heroId) : parseInt(TEST_HERO_ID);
              const isCurrentHero = hero.id === currentHeroNumericId;

              return (
                <div
                  key={hero.id}
                  className={`hero-card ${isDisabled ? 'hero-disabled' : ''} ${isCurrentHero ? 'hero-current' : ''}`}
                  onClick={() => handleHeroSelect(hero.id)}
                  style={{
                    cursor: isDisabled ? 'pointer' : (isCurrentHero ? 'default' : 'pointer')
                  }}
                >
                  <img 
                    src={hero.image} 
                    alt={hero.name}
                    className="hero-image"
                    style={{
                      filter: isDisabled ? 'grayscale(100%) brightness(0.5)' : 'none'
                    }}
                  />
                  
                  {/* Замочек для недоступных героев */}
                  {isDisabled && (
                    <div className="hero-lock-overlay">
                      <i className="fas fa-lock" />
                    </div>
                  )}

                  {/* Индикатор текущего героя */}
                  {isCurrentHero && (
                    <div className="hero-current-indicator">
                      <i className="fas fa-check" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="heroes-modal-actions">
          <button 
            className="heroes-modal-btn heroes-modal-btn-close"
            onClick={onClose}
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeroesModal; 