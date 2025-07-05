import React from 'react';
import './NavigationConfirmModal.css';

/**
 * Пропсы для модального окна подтверждения навигации
 */
interface NavigationConfirmModalProps {
  /** Показывать ли модальное окно */
  isVisible: boolean;
  /** Название целевой вкладки ('main' | 'shop' | 'help') */
  targetTab: string;
  /** Золото заработанное за текущую сессию */
  sessionGold: number;
  /** Коллбэк подтверждения перехода */
  onConfirm: () => void;
  /** Коллбэк отмены перехода */
  onCancel: () => void;
}

/**
 * Получить название вкладки для отображения
 */
const getTabDisplayName = (tab: string): string => {
  switch (tab) {
    case 'main': return 'ГЛАВНАЯ';
    case 'shop': return 'МАГАЗИН';
    case 'help': return 'ПОМОЩЬ';
    default: return tab.toUpperCase();
  }
};

/**
 * Модальное окно подтверждения выхода из игры
 */
export default function NavigationConfirmModal({
  isVisible,
  targetTab,
  sessionGold,
  onConfirm,
  onCancel
}: NavigationConfirmModalProps) {
  
  // Если модалка не видна, не рендерим
  if (!isVisible) {
    return null;
  }

  return (
    <div className="navigation-modal-overlay">
      <div className="navigation-modal">
        
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
        
        {/* Заголовок модального окна */}
        <div className="navigation-modal-header">
          <h2 className="navigation-modal-title">
            ⚠️ ПОКИНУТЬ ИГРУ?
          </h2>
        </div>

        {/* Содержимое модального окна */}
        <div className="navigation-modal-content">
          <p className="navigation-modal-text">
            Вы уверены, что хотите перейти на вкладку "{getTabDisplayName(targetTab)}"?
          </p>
          
          {/* Информация о том что произойдет */}
          <div className="navigation-modal-info">
            <div className="navigation-modal-info-item positive">
              <span className="navigation-modal-icon">✅</span>
              <span>Заработанное золото за этот забег уже начислено</span>
              {sessionGold > 0 && (
                <span className="navigation-modal-gold">
                  +{sessionGold}
                  <img 
                    src="/media/shop/images/gold.png" 
                    alt="Золото" 
                    width="18" 
                    height="18"
                    className="navigation-modal-gold-icon"
                  />
                </span>
              )}
            </div>
            
            <div className="navigation-modal-info-item warning">
              <span className="navigation-modal-icon">⚠️</span>
              <span>Текущий прогресс уровня будет потерян - придется начать заново</span>
            </div>
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="navigation-modal-actions">
          <button 
            className="navigation-modal-btn navigation-modal-btn-confirm"
            onClick={onConfirm}
          >
            Да, покинуть
          </button>
          
          <button 
            className="navigation-modal-btn navigation-modal-btn-cancel"
            onClick={onCancel}
          >
            Остаться в игре
          </button>
        </div>
        
      </div>
    </div>
  );
} 