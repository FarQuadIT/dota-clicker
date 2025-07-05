import React, { useState } from 'react';
import './SettingsModal.css';

/**
 * Пропсы для модального окна настроек
 */
interface SettingsModalProps {
  /** Показывать ли модальное окно */
  isVisible: boolean;
  /** Коллбэк при закрытии модального окна */
  onClose: () => void;
}

/**
 * Модальное окно настроек игры
 * Содержит настройки звука и подсказок
 */
const SettingsModal: React.FC<SettingsModalProps> = ({
  isVisible,
  onClose
}) => {
  // Состояние настроек (пока что только локальное)
  const [soundVolume, setSoundVolume] = useState(50); // Громкость звука 0-100
  const [hintsEnabled, setHintsEnabled] = useState(true); // Включены ли подсказки
  
  if (!isVisible) return null;

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSoundVolume(Number(event.target.value));
    // TODO: Здесь будет применение громкости к звуковой системе
  };

  const handleHintsToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setHintsEnabled(event.target.checked);
    // TODO: Здесь будет управление показом подсказок
  };

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // Закрываем модалку при клике на overlay, но не на само модальное окно
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="settings-modal-overlay" onClick={handleOverlayClick}>
      <div className="settings-modal">
        
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
        <div className="settings-modal-header">
          <h2 className="settings-modal-title">⚙️ НАСТРОЙКИ</h2>
          <button 
            className="settings-modal-close-btn"
            onClick={onClose}
            aria-label="Закрыть настройки"
          >
            ✕
          </button>
        </div>

        {/* Основное содержимое */}
        <div className="settings-modal-content">
          
          {/* Настройка громкости */}
          <div className="settings-modal-section">
            <div className="settings-modal-section-header">
              <i className="settings-modal-icon">🔊</i>
              <span className="settings-modal-section-title">Громкость звука</span>
            </div>
            
            <div className="settings-modal-volume-control">
              <input
                type="range"
                min="0"
                max="100"
                value={soundVolume}
                onChange={handleVolumeChange}
                className="settings-modal-slider"
                aria-label="Громкость звука"
              />
              <span className="settings-modal-volume-value">{soundVolume}%</span>
            </div>
            
            <div className="settings-modal-description">
              Управление громкостью игровых звуков
            </div>
          </div>

          {/* Настройка подсказок */}
          <div className="settings-modal-section">
            <div className="settings-modal-section-header">
              <i className="settings-modal-icon">💡</i>
              <span className="settings-modal-section-title">Подсказки в игре</span>
            </div>
            
            <div className="settings-modal-checkbox-control">
              <label className="settings-modal-checkbox-label">
                <input
                  type="checkbox"
                  checked={hintsEnabled}
                  onChange={handleHintsToggle}
                  className="settings-modal-checkbox"
                  aria-label="Включить подсказки"
                />
                <span className="settings-modal-checkbox-custom"></span>
                <span className="settings-modal-checkbox-text">
                  Показывать подсказки и советы во время игры
                </span>
              </label>
            </div>
            
            <div className="settings-modal-description">
              Отображение полезных советов для новых игроков
            </div>
          </div>

        </div>

        {/* Кнопки действий */}
        <div className="settings-modal-actions">
          <button
            className="settings-modal-btn settings-modal-btn-close"
            onClick={onClose}
            aria-label="Закрыть настройки"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal; 