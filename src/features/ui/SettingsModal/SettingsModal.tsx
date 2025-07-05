import React, { useState, useEffect } from 'react';
import { audioManager } from '../../../game/managers/SoundManager';
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
  // Состояние настроек (интегрированное с AudioManager)
  const [soundVolume, setSoundVolume] = useState(50); // Громкость звука 0-100
  const [isMuted, setIsMuted] = useState(false); // Отключен ли звук
  const [hintsEnabled, setHintsEnabled] = useState(true); // Включены ли подсказки
  
  // Загружаем настройки при открытии модального окна
  useEffect(() => {
    if (isVisible) {
      try {
        // Загружаем текущие настройки из AudioManager
        const currentVolume = Math.round(audioManager.getVolume() * 100);
        const currentMuted = audioManager.getMuted();
        
        setSoundVolume(currentVolume);
        setIsMuted(currentMuted);
        
        // Загружаем настройки подсказок из localStorage
        const savedHints = localStorage.getItem('gameHintsEnabled');
        if (savedHints !== null) {
          setHintsEnabled(JSON.parse(savedHints));
        }
      } catch (error) {
        console.warn('⚠️ Не удалось загрузить настройки звука:', error);
      }
    }
  }, [isVisible]);
  
  if (!isVisible) return null;

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(event.target.value);
    setSoundVolume(newVolume);
    
    try {
      // Уведомляем о пользовательском взаимодействии
      audioManager.onUserInteraction();
      
      // Воспроизводим звук клика по ползунку
      audioManager.playSound('ui_click');
      
      // Применяем громкость к звуковой системе (преобразуем в диапазон 0-1)
      audioManager.setVolume(newVolume / 100);
    } catch (error) {
      console.warn('⚠️ Не удалось установить громкость:', error);
    }
  };

  const handleMuteToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newMuted = event.target.checked;
    setIsMuted(newMuted);
    
    try {
      // Уведомляем о пользовательском взаимодействии
      audioManager.onUserInteraction();
      
      // Воспроизводим звук клика по чекбоксу (только если не отключаем звук)
      if (!newMuted) {
        audioManager.playSound('ui_click');
      }
      
      // Применяем состояние отключения звука
      audioManager.setMuted(newMuted);
    } catch (error) {
      console.warn('⚠️ Не удалось изменить состояние звука:', error);
    }
  };

  const handleHintsToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newHintsEnabled = event.target.checked;
    setHintsEnabled(newHintsEnabled);
    
    try {
      // Уведомляем о пользовательском взаимодействии
      audioManager.onUserInteraction();
      
      // Воспроизводим звук клика по чекбоксу подсказок
      audioManager.playSound('ui_click');
    } catch (error) {
      console.warn('⚠️ Не удалось разблокировать звуки:', error);
    }
    
    // Сохраняем настройку подсказок в localStorage
    localStorage.setItem('gameHintsEnabled', JSON.stringify(newHintsEnabled));
  };

  const handleCloseClick = () => {
    try {
      // Уведомляем о пользовательском взаимодействии
      audioManager.onUserInteraction();
      
      // Воспроизводим звук закрытия модального окна (тот же, что и при открытии)
      audioManager.playSound('open_modal');
    } catch (error) {
      console.warn('⚠️ Не удалось разблокировать звуки:', error);
    }
    
    onClose();
  };

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // Закрываем модалку при клике на overlay, но не на само модальное окно
    if (event.target === event.currentTarget) {
      handleCloseClick();
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
            onClick={handleCloseClick}
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
            
            {/* Чекбокс отключения звука */}
            <div className="settings-modal-checkbox-control">
              <label className="settings-modal-checkbox-label">
                <input
                  type="checkbox"
                  checked={isMuted}
                  onChange={handleMuteToggle}
                  className="settings-modal-checkbox"
                  aria-label="Отключить звук"
                />
                <span className="settings-modal-checkbox-custom"></span>
                <span className="settings-modal-checkbox-text">
                  Отключить все звуки
                </span>
              </label>
            </div>
            
            {/* Ползунок громкости (отключен если звук выключен) */}
            <div className="settings-modal-volume-control">
              <input
                type="range"
                min="0"
                max="100"
                value={soundVolume}
                onChange={handleVolumeChange}
                className="settings-modal-slider"
                disabled={isMuted}
                aria-label="Громкость звука"
                style={{ opacity: isMuted ? 0.5 : 1 }}
              />
              <span className="settings-modal-volume-value" style={{ opacity: isMuted ? 0.5 : 1 }}>
                {soundVolume}%
              </span>
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
            onClick={handleCloseClick}
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