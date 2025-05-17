// src/pages/GamePage/GamePage.tsx
import { useEffect, useRef, useState } from 'react';
import { checkPixiVersion, createPixiApp, createTestSprite } from '../../game/pixiTest';
// Объединяем импорты из одного модуля
import { Application, Container } from 'pixi.js';

/**
 * Компонент игровой страницы
 * 
 * Временно используется для проверки работы Pixi.js
 */
export default function GamePage() {
  // Создаем реф для контейнера игры
  const gameContainerRef = useRef<HTMLDivElement>(null);
  
  // Состояния для хранения приложения и объектов Pixi.js
  const [pixiApp, setPixiApp] = useState<Application | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setSprite] = useState<Container | null>(null);

  // Эффект для инициализации Pixi.js
  useEffect(() => {
    // Асинхронная функция для инициализации
    async function initializePixi() {
      try {
        // Проверяем, что импорт Pixi.js работает
        const pixiVersion = checkPixiVersion();
        console.log(`Установленная версия Pixi.js: ${pixiVersion}`);
        
        // Убеждаемся, что у нас есть DOM-элемент контейнера и приложение еще не создано
        if (gameContainerRef.current && !pixiApp) {
          setIsLoading(true);
          
          // Создаем приложение Pixi.js
          const app = await createPixiApp(gameContainerRef.current);
          setPixiApp(app);
          
          // Создаем тестовый объект
          const newSprite = await createTestSprite(app);
          setSprite(newSprite);
          
          setIsLoading(false);
        }
      } catch (err) {
        setError(`Ошибка инициализации Pixi.js: ${err instanceof Error ? err.message : String(err)}`);
        setIsLoading(false);
      }
    }
    
    initializePixi();
    
    // Очистка при размонтировании компонента
    return () => {
      if (pixiApp) {
        console.log('Уничтожение приложения Pixi.js');
        // В PixiJS 8.x destroy принимает boolean для удаления canvas
        pixiApp.destroy(true);
        setPixiApp(null);
        setSprite(null);
      }
    };
  }, []); // Пустой массив зависимостей - эффект выполнится только один раз при монтировании
  
  return (
    <div style={{ 
      width: '100%',
      height: '100vh',
      padding: 0,
      margin: 0,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ padding: '10px', textAlign: 'center', color: 'white' }}>
        <h1>Проверка интеграции Pixi.js</h1>
        {isLoading ? (
          <p>Загрузка Pixi.js...</p>
        ) : error ? (
          <p style={{ color: 'red' }}>{error}</p>
        ) : (
          <>
            <p>Pixi.js успешно инициализирован.</p>
            <p>Ниже должен отображаться вращающийся спрайт.</p>
          </>
        )}
      </div>
      
      {/* Контейнер для Pixi.js */}
      <div 
        ref={gameContainerRef} 
        style={{ 
          flex: 1,
          width: '100%',
          border: '1px solid #444',
          borderRadius: '4px',
          overflow: 'hidden'
        }}
      />
    </div>
  );
}