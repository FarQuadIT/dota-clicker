import React from 'react';
import './HeroesModal.css';

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
 * Данные героев
 */
const heroes = [
  { id: 1, name: 'Джаггернаут', image: '/media/main/heroes/slider/juggernaut.png' },
  { id: 2, name: 'Слардар', image: '/media/main/heroes/slider/slardar.png' },
  { id: 3, name: 'Король Скелетов', image: '/media/main/heroes/slider/skeleton_king.png' },
  { id: 4, name: 'Пожиратель Жизни', image: '/media/main/heroes/slider/life_stealer.png' },
  { id: 5, name: 'Кентавр', image: '/media/main/heroes/slider/centaur.png' }
];

/**
 * Модальное окно для отображения всех героев
 */
const HeroesModal: React.FC<HeroesModalProps> = ({
  isVisible,
  onClose
}) => {
  if (!isVisible) return null;

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // Закрываем модалку при клике на overlay, но не на само модальное окно
    if (event.target === event.currentTarget) {
      onClose();
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
              <div key={hero.id} className="hero-card">
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