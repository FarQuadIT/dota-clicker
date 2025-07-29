// src/pages/FirstLoginPage/FirstLoginPage.tsx

import React, { useState } from 'react';
import { useUser } from '../../contexts/UserContext';
import './FirstLoginPage.css';

/**
 * Данные доступных стартовых героев
 */
const STARTER_HEROES = [
  { id: 1, name: 'Джаггернаут', image: '/media/main/heroes/slider/juggernaut.png' },
  { id: 2, name: 'Кентавр', image: '/media/main/heroes/slider/centaur.png' }
];

/**
 * Страница первого входа в игру
 * Обрабатывает ввод имени пользователя и выбор стартового героя
 */
export default function FirstLoginPage() {
  const { status, userData, setUserNameAndCheck, selectHeroAndComplete } = useUser();
  
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Обработчик ввода имени пользователя
   */
  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userName.trim()) {
      setError('Пожалуйста, введите ваше имя');
      return;
    }

    if (userName.length < 3) {
      setError('Имя должно содержать минимум 3 символа');
      return;
    }

    if (userName.length > 20) {
      setError('Имя не должно превышать 20 символов');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const success = await setUserNameAndCheck(userName);
      
      if (!success) {
        setError('Ошибка при сохранении имени. Попробуйте еще раз.');
      }
    } catch (err) {
      setError('Произошла ошибка. Проверьте подключение к интернету.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Обработчик выбора героя
   */
  const handleHeroSelect = async (heroId: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const success = await selectHeroAndComplete(heroId);
      
      if (!success) {
        setError('Ошибка при выборе героя. Попробуйте еще раз.');
        setIsLoading(false);
      }
      // Если успешно, то UserContext автоматически перенаправит на главную страницу
    } catch (err) {
      setError('Произошла ошибка. Проверьте подключение к интернету.');
      setIsLoading(false);
    }
  };

  /**
   * Рендер этапа ввода имени
   */
  const renderNameInput = () => (
    <div className="first-login-container">
      <div className="first-login-modal">
        <div className="first-login-header">
          <h1 className="first-login-title">Добро пожаловать в Dota Clicker!</h1>
          <p className="first-login-subtitle">Введите ваше имя для начала приключения</p>
        </div>

        <form onSubmit={handleNameSubmit} className="first-login-form">
          <div className="input-group">
            <label htmlFor="userName" className="input-label">Ваше имя в игре:</label>
            <input
              id="userName"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Введите имя (3-20 символов)"
              className="name-input"
              disabled={isLoading}
              maxLength={20}
              autoFocus
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="submit-btn"
            disabled={isLoading || !userName.trim()}
          >
            {isLoading ? 'Сохранение...' : 'Продолжить'}
          </button>
        </form>
      </div>
    </div>
  );

  /**
   * Рендер этапа выбора героя
   */
  const renderHeroSelection = () => (
    <div className="first-login-container">
      <div className="first-login-modal">
        <div className="first-login-header">
          <h1 className="first-login-title">
            Привет, {userData?.userName || 'Игрок'}!
          </h1>
          <p className="first-login-subtitle">Выберите своего первого героя</p>
        </div>

        <div className="heroes-selection">
          <div className="heroes-grid">
            {STARTER_HEROES.map((hero) => (
              <div
                key={hero.id}
                className={`hero-card ${isLoading ? 'disabled' : ''}`}
                onClick={() => !isLoading && handleHeroSelect(hero.id)}
              >
                <div className="hero-image-container">
                  <img 
                    src={hero.image} 
                    alt={hero.name}
                    className="hero-image"
                  />
                </div>
                <h3 className="hero-name">{hero.name}</h3>
                {isLoading && (
                  <div className="hero-loading">Выбираем...</div>
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="hero-selection-hint">
            <p>Нажмите на изображение героя, чтобы выбрать его</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Показываем соответствующий этап в зависимости от статуса
  if (status === 'first_login') {
    return renderNameInput();
  }

  if (status === 'no_heroes') {
    return renderHeroSelection();
  }

  // Состояние загрузки или ошибки
  return (
    <div className="first-login-container">
      <div className="first-login-modal">
        <div className="first-login-header">
          <h1 className="first-login-title">
            {status === 'loading' ? 'Загрузка...' : 'Произошла ошибка'}
          </h1>
          {status === 'error' && (
            <p className="first-login-subtitle">
              Не удалось загрузить данные. Проверьте подключение к интернету.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}