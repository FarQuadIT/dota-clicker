import React from 'react';
import './GameOverModal.css';

/**
 * Пропсы для модального окна Game Over
 */
interface GameOverModalProps {
  /** Показывать ли модальное окно */
  isVisible: boolean;
  /** Золото заработанное за текущую сессию */
  sessionGold: number;
  /** Общее золото героя */
  totalGold: number;
  /** Коллбэк при нажатии "Начать заново" */
  onRestart: () => void;
  /** Коллбэк при нажатии "Главное меню" */
  onMainMenu: () => void;
}

/**
 * Модальное окно Game Over при смерти героя
 * Показывает статистику сессии и предлагает варианты действий
 */
const GameOverModal: React.FC<GameOverModalProps> = ({
  isVisible,
  sessionGold,
  totalGold,
  onRestart,
  onMainMenu
}) => {
  if (!isVisible) return null;

  return (
    <div className="game-over-modal-overlay">
      <div className="game-over-modal">
        {/* Заголовок */}
        <div className="game-over-modal-header">
          <h2 className="game-over-modal-title">☠️ ГЕРОЙ ПОГИБ ☠️</h2>
        </div>

        {/* Основное содержимое */}
        <div className="game-over-modal-content">
          <p className="game-over-modal-text">
            Ваш герой пал в неравном бою!
          </p>

          {/* Информация о золоте */}
          <div className="game-over-modal-info">
            <div className="game-over-modal-info-item positive">
              <i className="game-over-modal-icon">💰</i>
              <span>Заработано золота за забег</span>
              <span className="game-over-modal-gold">
                +{sessionGold}
                <img 
                  src="/media/shop/images/gold.png" 
                  alt="Золото" 
                  width="18" 
                  height="18"
                  className="game-over-modal-gold-icon"
                />
              </span>
            </div>
            
            <div className="game-over-modal-info-item">
              <i className="game-over-modal-icon">🏆</i>
              <span>Всего золота</span>
              <span className="game-over-modal-total-gold">
                {totalGold}
                <img 
                  src="/media/shop/images/gold.png" 
                  alt="Золото" 
                  width="18" 
                  height="18"
                  className="game-over-modal-gold-icon"
                />
              </span>
            </div>
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="game-over-modal-actions">
          <button
            className="game-over-modal-btn game-over-modal-btn-restart"
            onClick={onRestart}
            aria-label="Начать заново"
          >
            Начать заново
          </button>
          
          <button
            className="game-over-modal-btn game-over-modal-btn-menu"
            onClick={onMainMenu}
            aria-label="Главное меню"
          >
            Главное меню
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOverModal; 