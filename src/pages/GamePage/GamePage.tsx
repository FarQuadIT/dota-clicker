// src/pages/GamePage/GamePage.tsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Application, Graphics, TilingSprite } from 'pixi.js';
import { assetsManager, type LoadingProgress } from '../../game/managers/AssetsManager';
import { GAME_CONFIG } from '../../game/config/GameConfig';
import { useGame } from '../../contexts/GameContext';
import { useHeroStore } from '../../contexts/heroStore';
import GameOverModal from '../../features/ui/GameOverModal';

/**
* Компонент игровой страницы с полноэкранным Pixi.js канвасом
* 
* Принципы работы:
* 1. Создаем Pixi Application, который управляет рендерингом
* 2. Загружаем все игровые ресурсы через AssetsManager
* 3. Показываем экран загрузки с прогрессом
* 4. После загрузки создаем игровую сцену
* 5. Header и Footer остаются поверх канваса через z-index
* 
* Документация:
* - PixiJS Application: https://pixijs.download/release/docs/app.Application.html
* - Assets loading: all_pixijs_content.txt раздел "Assets"
*/
export default function GamePage() {
 // Ref для DOM элемента, в который будет помещен канвас
 const gameContainerRef = useRef<HTMLDivElement>(null);
 
 // Состояние для хранения экземпляра Pixi Application
 const [pixiApp, setPixiApp] = useState<Application | null>(null);
 
 // Состояния для отслеживания процесса инициализации и загрузки
 const [isInitializing, setIsInitializing] = useState(true);
 const [isLoadingAssets, setIsLoadingAssets] = useState(false);
 const [loadingProgress, setLoadingProgress] = useState<LoadingProgress>({
   loaded: 0,
   total: 0,
   percentage: 0,
   currentAsset: ''
 });
 const [error, setError] = useState<string | null>(null);
 

 // Состояние для отслеживания готовности DOM
 const [isDOMReady, setIsDOMReady] = useState(false);

 // Состояние для Game Over модального окна
 const [isGameOver, setIsGameOver] = useState(false);
 const [sessionGold, setSessionGold] = useState(0);

 // Используем контекст игры для управления паузой
 const { isPaused, setGameActive, setGameController, gameController, isGameActive } = useGame();
 
 // Используем героя для получения общего золота
 const { stats } = useHeroStore();
 
 // Навигация для переходов между страницами
 const navigate = useNavigate();

 // Эффект для проверки готовности DOM
 useEffect(() => {
       const checkDOMReady = () => {
      if (gameContainerRef.current) {
        setIsDOMReady(true);
      } else {
        requestAnimationFrame(checkDOMReady);
      }
    };
   
   checkDOMReady();
 }, []);

 // Эффект для инициализации Pixi.js когда DOM готов
 useEffect(() => {
   if (!isDOMReady) return;
   
   let isMounted = true; // Флаг для предотвращения race conditions
   
   /**
    * Основная функция инициализации игры
    * 
    * Последовательность действий:
    * 1. Инициализация Pixi.js Application
    * 2. Загрузка всех игровых ресурсов
    * 3. Создание игровой сцены
    */
   async function initializeGame() {
     try {
       // Проверяем что приложение еще не создано и компонент все еще mounted
       if (pixiApp || !isMounted) {
         return;
       }
       

       setIsInitializing(true);
       setError(null);

       // Шаг 1: Создание и настройка Pixi Application
       const app = await initializePixiApp();
       
       // Проверяем что компонент все еще mounted перед установкой состояния
       if (!isMounted) {
         // Если компонент размонтирован во время инициализации - уничтожаем приложение
         app.destroy(true, { children: true, texture: true });
         return;
       }
       
       setPixiApp(app);
       setIsInitializing(false);

       // Шаг 2: Загрузка игровых ресурсов
       if (!isMounted) return;
       setIsLoadingAssets(true);
       await loadGameAssets();
       
       if (!isMounted) return;
       setIsLoadingAssets(false);

       // Шаг 3: Создание игровой сцены
       if (!isMounted) return;
       await createGameScene(app);
       



     } catch (err) {
       if (!isMounted) return;
       console.error('❌ Ошибка инициализации игры:', err);
       setError(`Ошибка инициализации: ${err instanceof Error ? err.message : String(err)}`);
       setIsInitializing(false);
       setIsLoadingAssets(false);
     }
   }

   /**
    * Инициализация Pixi.js Application
    * 
    * Создает и настраивает приложение PixiJS
    * Документация: https://pixijs.download/release/docs/app.Application.html
    */
   async function initializePixiApp(): Promise<Application> {


     // Создаем новый экземпляр Pixi Application
     const app = new Application();

     // Вычисляем правильный размер канваса с учетом header и footer
     const headerHeight = 40; // Из Header.css
     const footerHeight = 50; // Из Footer.css
     const gameWidth = window.innerWidth;
     const gameHeight = window.innerHeight - headerHeight - footerHeight;

     // Инициализируем приложение с настройками
     // Это асинхронная операция в PixiJS v8
     await app.init({
       // Цвет фона (темно-серый)
       background: '#1a1a1a',
       
       // Размеры канваса - весь экран минус header и footer
       width: gameWidth,
       height: gameHeight,
       
       // НЕ используем resizeTo: window, так как нам нужен кастомный размер
       // resizeTo: window,
       
       // Включаем антиалиасинг для сглаживания
       antialias: true,
       
       // Разрешение для четкости на retina дисплеях
       resolution: window.devicePixelRatio || 1,
       
       // Автоматическая плотность пикселей
       autoDensity: true,
     });

     

     // Добавляем canvas в контейнер
     // В PixiJS v8 используется app.canvas вместо app.view
     const container = gameContainerRef.current;
     if (!container) {
       throw new Error('Game container is not available');
     }
     
     // Проверяем что canvas создан
     if (!app.canvas) {
       throw new Error('Canvas was not created by PixiJS');
     }
     
     // Очищаем контейнер от предыдущих элементов (если есть)
     // ИСПРАВЛЕНИЕ: Используем более безопасную очистку
     while (container.firstChild) {
       container.removeChild(container.firstChild);
     }
     
     // Добавляем canvas
     container.appendChild(app.canvas);
     
     

     // Добавляем обработчик изменения размера окна
     const handleResize = () => {
       const headerHeight = 40;
       const footerHeight = 50;
       const newGameWidth = window.innerWidth;
       const newGameHeight = window.innerHeight - headerHeight - footerHeight;
       
       // Изменяем размер рендерера
       app.renderer.resize(newGameWidth, newGameHeight);
       
       // Обновляем скорость фона пропорционально новой ширине экрана
       if ((app as any).updateBackgroundSpeed) {
         (app as any).updateBackgroundSpeed(newGameWidth / 200);
       }
       
       // Обновляем размеры фона
       if ((app as any).updateBackgroundSize) {
         (app as any).updateBackgroundSize();
       }
       
       // Обновляем игровые объекты при изменении размера
       if ((app as any).gameHero) {
         (app as any).gameHero.onResize();
       }
       if ((app as any).gameController) {
         (app as any).gameController.onResize();
       }
     };
     
     window.addEventListener('resize', handleResize);
     
     // Сохраняем функцию для очистки
     (app as any).removeResizeListener = () => {
       window.removeEventListener('resize', handleResize);
     };

     return app;
   }

   /**
    * Загрузка всех игровых ресурсов
    * 
    * Использует AssetsManager для загрузки текстур, звуков и других ресурсов
    * Отслеживает прогресс загрузки для отображения пользователю
    */
   async function loadGameAssets(): Promise<void> {


     // Подписываемся на обновления прогресса загрузки
     const progressCallback = (progress: LoadingProgress) => {
       setLoadingProgress(progress);
       
     };

     assetsManager.onProgress(progressCallback);

     try {
       // Запускаем загрузку всех ресурсов
       await assetsManager.loadGameAssets();
       
     } finally {
       // Отписываемся от обновлений прогресса
       assetsManager.offProgress(progressCallback);
     }
   }

   /**
    * Создание игровой сцены
    * 
    * После загрузки ресурсов создаем основные игровые объекты:
    * - Фон
    * - Героя
    * - Игровой контроллер для управления циклом боя
    */
   async function createGameScene(app: Application): Promise<void> {


     // Очищаем сцену
     app.stage.removeChildren();

     // Создаем фон
     await createBackground(app);

     // Создаем героя и игровой контроллер
     await createGameController(app);

     
   }

   /**
    * Создание фонового изображения
    * 
    * Использует TilingSprite для создания движущегося фона
    * Документация: https://pixijs.download/release/docs/scene.TilingSprite.html
    */
   async function createBackground(app: Application): Promise<void> {


     try {
       // Получаем загруженную текстуру фона
       const forestTexture = assetsManager.getBackgroundTexture('forest');
       
       // Создаем TilingSprite для повторяющегося фона
       // TilingSprite позволяет создавать бесшовный повторяющийся фон
       const backgroundTiling = new TilingSprite({
         texture: forestTexture,
         width: app.screen.width * 2,  // Делаем шире экрана для плавного движения
         height: app.screen.height
       });
       
       // Масштабируем фон по высоте игрового экрана (с учетом header/footer)
       // Сохраняем пропорции, но покрываем всю игровую высоту
       const scaleY = app.screen.height / forestTexture.height;
       backgroundTiling.tileScale.set(scaleY, scaleY);
       
       // Позиционируем фон
       backgroundTiling.x = 0;
       backgroundTiling.y = 0;
       
       // Добавляем фон на сцену (он будет отрисован первым)
       app.stage.addChild(backgroundTiling);
       
       // Анимация движения фона справа налево  
       // Скорость движения пропорциональная ширине экрана с общим коэффициентом
       const baseSpeed = app.screen.width / 200;
       const speedMultiplier = GAME_CONFIG.BACKGROUND.scroll.speedMultiplier;
       let scrollSpeed = baseSpeed * speedMultiplier;
       
       // Флаг для управления движением фона
       let isBackgroundMoving = false;
       
       app.ticker.add((time) => {
         // Двигаем фон только если установлен флаг движения
         if (isBackgroundMoving) {
           backgroundTiling.tilePosition.x -= scrollSpeed * time.deltaTime;
         }
       });
       
       // Сохраняем функции управления фоном в контексте приложения
       // Это позволит герою управлять фоном и обновлять скорость при изменении размера
       (app as any).setBackgroundMoving = (moving: boolean) => {
         isBackgroundMoving = moving;
         console.log(`🌊 Фон ${moving ? 'начал' : 'остановил'} движение`);
       };
       
       (app as any).updateBackgroundSpeed = (newBaseSpeed: number) => {
         scrollSpeed = newBaseSpeed * speedMultiplier; // Применяем общий коэффициент скорости
         console.log(`🌊 Скорость фона обновлена: ${scrollSpeed.toFixed(2)} (базовая: ${newBaseSpeed.toFixed(2)}, множитель: ${speedMultiplier})`);
       };
       
       // Функция для обновления размеров фона при изменении экрана
       (app as any).updateBackgroundSize = () => {
         backgroundTiling.width = app.screen.width * 2;
         backgroundTiling.height = app.screen.height;
         
         // Пересчитываем масштаб
         const scaleY = app.screen.height / forestTexture.height;
         backgroundTiling.tileScale.set(scaleY, scaleY);
       };
       

       
     } catch (error) {
       console.error('❌ Ошибка создания фона:', error);
       
       // Fallback: создаем простой цветной фон
       const fallbackBg = new Graphics();
       fallbackBg.rect(0, 0, app.screen.width, app.screen.height);
       fallbackBg.fill({ color: 0x228B22 }); // Зеленый цвет леса
       app.stage.addChild(fallbackBg);
     }
   }

   /**
    * Создание игрового контроллера
    * 
    * Создает героя и игровой контроллер для управления циклом боя
    */
   async function createGameController(app: Application): Promise<void> {
     

     try {
       // Импортируем необходимые классы
       const { Hero } = await import('../../game/entities/Hero');
       const { GameController } = await import('../../game/core/GameController');
       
       // Создаем игровой контроллер
       const gameController = new GameController(app, new Hero(app, 'juggernaut', {
         positionX: GAME_CONFIG.HERO.position.x,  // 20% от левого края
         positionY: GAME_CONFIG.HERO.position.y,  // 70% от верха (внизу экрана)
         scale: GAME_CONFIG.HERO.scale.gamePage   // 150% размера
       }));
       
       // Характеристики героя теперь загружаются автоматически в App.tsx через API
       
       const hero = gameController.getHero();
       
       // Связываем героя с контроллером для нанесения урона после атаки
       hero.setAttackCallback(() => {
         gameController.dealDamageToCreep();
       });
       
       // Добавляем героя на сцену
       app.stage.addChild(hero);
       
       // Добавляем героя в игровой цикл для обновления анимаций
       app.ticker.add((time) => {
         hero.update(time.deltaMS);
       });
       

       
       // Добавляем контроллер в игровой цикл
       app.ticker.add((time) => {
         gameController.update(time.deltaMS);
       });
       
       // Сохраняем ссылки для обработки resize
       (app as any).gameHero = hero;
       (app as any).gameController = gameController;
       
       // Передаем контроллер в игровой контекст
       setGameController(gameController);
       
             // Устанавливаем callback для Game Over
      gameController.setGameOverCallback((sessionGoldEarned: number) => {
        setSessionGold(sessionGoldEarned);
        setIsGameOver(true);
        setGameActive(false); // Деактивируем игру
      });
      
      // ИСПРАВЛЕНИЕ: Принудительно сбрасываем состояние Game Over при создании новой игры
      // Это нужно для случая когда пользователь возвращается в игру после смерти героя
      setIsGameOver(false);
      setSessionGold(0);
      
      // Устанавливаем игру как активную
      setGameActive(true);
       
       // Запускаем игровой цикл
       gameController.startGameLoop();
       
       

       
     } catch (error) {
       console.error('❌ Ошибка создания игрового контроллера:', error);
     }
   }

   // Запускаем инициализацию игры
   initializeGame();

   // Функция очистки при размонтировании компонента
   return () => {
     // Отмечаем что компонент размонтирован
     isMounted = false;
     
     console.log('🔄 Очистка GamePage при размонтировании');
     
     if (pixiApp) {
       try {
         // Очищаем обработчик изменения размера
         if ((pixiApp as any).removeResizeListener) {
           (pixiApp as any).removeResizeListener();
         }
         
         // Останавливаем все анимации
         if (pixiApp.ticker) {
           pixiApp.ticker.stop();
         }
         
         // Очищаем контейнер перед уничтожением приложения
         if (gameContainerRef.current && pixiApp.canvas) {
           try {
             gameContainerRef.current.removeChild(pixiApp.canvas);
           } catch (e) {
             // Игнорируем ошибки если canvas уже удален
             console.warn('Canvas уже удален из контейнера:', e);
           }
         }
         
         // Уничтожаем приложение и освобождаем ресурсы
         pixiApp.destroy(true, { children: true, texture: true });
         
       } catch (error) {
         console.warn('Ошибка при очистке PixiJS приложения:', error);
       }
     }
     
     // Очищаем контейнер на всякий случай
     if (gameContainerRef.current) {
       gameContainerRef.current.innerHTML = '';
     }
   };
 }, [isDOMReady]); // Зависит от готовности DOM

 // Эффект для перезапуска игры при возврате из других вкладок
 useEffect(() => {
   // Проверяем нужно ли перезапустить игру
   const checkAndRestartGame = () => {
     // Если есть GameController, но игра неактивна или остановлена
     if (gameController && 
         typeof gameController.isRunning === 'function' && 
         typeof gameController.restartGame === 'function') {
       
       const isRunning = gameController.isRunning();
       
             // Если игра остановлена, но мы на странице игры - перезапускаем
      if (!isRunning && !isGameActive) {
        console.log('🔄 Обнаружена остановленная игра при возврате на GamePage');
        
        // Сбрасываем состояние Game Over перед перезапуском
        setIsGameOver(false);
        setSessionGold(0);
        
        gameController.restartGame();
        setGameActive(true);
      }
     }
   };

   // Запускаем проверку через небольшую задержку для корректной инициализации
   const timeoutId = setTimeout(checkAndRestartGame, 100);
   
   return () => clearTimeout(timeoutId);
 }, [gameController, isGameActive, setGameActive]); // Зависит от состояния игры

 // Обработчик для перезагрузки при ошибке
   const handleRetry = () => {
    setError(null);
    setIsInitializing(true);
    setIsLoadingAssets(false);
    // Перезагружаем страницу для повторной инициализации
    window.location.reload();
  };

  // Обработчики для Game Over модального окна
  const handleGameRestart = () => {
    if (gameController) {
      // ИСПРАВЛЕНИЕ: НЕ вызываем stopGame() чтобы избежать конфликта с setGameActive
      // Используем только логику сброса характеристик + перезапуск через контекст
      
      // 1. Восстанавливаем здоровье и ману героя до полных значений
      if (typeof gameController.restoreHeroToFullHealth === 'function') {
        gameController.restoreHeroToFullHealth();
      }
      
      // 2. Сбрасываем счетчик золота за сессию
      if (typeof gameController.resetSessionGold === 'function') {
        gameController.resetSessionGold();
      }
      
      // 3. Перезапускаем игру напрямую через GameController (безопасный метод)
      if (typeof gameController.restartGame === 'function') {
        gameController.restartGame();
      }
      
      // 4. Убеждаемся что игра активна в контексте
      setGameActive(true);
    }
    
    // Закрываем модалку
    setIsGameOver(false);
    setSessionGold(0);
    
    console.log('🔄 Игра перезапущена после смерти героя (безопасный метод)');
  };

  const handleMainMenu = () => {
    // Закрываем модалку
    setIsGameOver(false);
    setSessionGold(0);
    
    // Переходим на главную страницу
    navigate('/main');
    
    console.log('🏠 Переход в главное меню после смерти героя');
  };

  // Функции управления паузой теперь находятся в GameContext

 /**
  * Компонент экрана загрузки
  * 
  * Отображает прогресс загрузки ресурсов с красивой анимацией
  */
 const LoadingScreen = () => (
   <div style={{
     position: 'absolute',
     top: 0,
     left: 0,
     width: '100%',
     height: '100%',
     backgroundColor: 'rgba(0, 0, 0, 0.9)',
     display: 'flex',
     flexDirection: 'column',
     justifyContent: 'center',
     alignItems: 'center',
     zIndex: 10,
     color: 'white',
     fontFamily: 'Arial, sans-serif',
   }}>
     
     {/* Заголовок */}
     <div style={{
       fontSize: '24px',
       fontWeight: 'bold',
       marginBottom: '30px',
       textAlign: 'center',
     }}>
       {isInitializing && '⚙️ Инициализация игрового движка...'}
       {isLoadingAssets && '📦 Загрузка игровых ресурсов...'}
     </div>

     {/* Прогресс бар */}
     {isLoadingAssets && (
       <>
         <div style={{
           width: '300px',
           height: '20px',
           backgroundColor: 'rgba(255, 255, 255, 0.2)',
           borderRadius: '10px',
           overflow: 'hidden',
           marginBottom: '15px',
           border: '2px solid rgba(255, 255, 255, 0.3)',
         }}>
           <div style={{
             width: `${loadingProgress.percentage}%`,
             height: '100%',
             backgroundColor: '#4CAF50',
             borderRadius: '8px',
             transition: 'width 0.3s ease',
             background: 'linear-gradient(90deg, #4CAF50, #45a049)',
           }} />
         </div>

         {/* Процент и текущий ресурс */}
         <div style={{
           fontSize: '16px',
           marginBottom: '10px',
           fontWeight: 'bold',
         }}>
           {loadingProgress.percentage}%
         </div>

         <div style={{
           fontSize: '14px',
           opacity: 0.8,
           textAlign: 'center',
           maxWidth: '400px',
         }}>
           {loadingProgress.currentAsset || 'Подготовка...'}
         </div>

         {/* Информация о прогрессе */}
         <div style={{
           fontSize: '12px',
           opacity: 0.6,
           marginTop: '10px',
         }}>
           {loadingProgress.loaded} из {loadingProgress.total} ресурсов
         </div>
       </>
     )}

     {/* Индикатор инициализации */}
     {isInitializing && (
       <div style={{
         width: '40px',
         height: '40px',
         border: '4px solid rgba(255, 255, 255, 0.3)',
         borderTop: '4px solid #4CAF50',
         borderRadius: '50%',
         animation: 'spin 1s linear infinite',
       }} />
     )}

     {/* CSS анимация */}
     <style dangerouslySetInnerHTML={{
       __html: `
         @keyframes spin {
           0% { transform: rotate(0deg); }
           100% { transform: rotate(360deg); }
         }
       `
     }} />
   </div>
 );

 return (
   <div style={{
     // Контейнер занимает весь экран
     width: '100vw',
     height: '100vh',
     
     // Убираем отступы и переполнение
     margin: 0,
     padding: 0,
     overflow: 'hidden',
     
     // Позиционирование для правильного отображения
     position: 'relative',
     
     // Темный фон на случай проблем с загрузкой
     backgroundColor: '#1a1a1a',
   }}>
     
     {/* Контейнер для Pixi.js канваса */}
     <div 
       ref={gameContainerRef}
       style={{
         // Канвас занимает пространство между header и footer
         width: '100%',
         height: 'calc(100vh - 90px)', // 40px (header) + 50px (footer)
         
         // Позиционирование - используем paddingTop из main, убираем top
         position: 'absolute',
         top: 0,
         left: 0,
         
         // Z-index ниже, чем у Header/Footer
         zIndex: 1,
       }}
     />

     {/* Экран загрузки */}
     {(isInitializing || isLoadingAssets) && <LoadingScreen />}

     {/* Кнопки управления игрой теперь находятся в Header */}

     {/* Overlay для отображения ошибок */}
     {error && (
       <div style={{
         position: 'absolute',
         top: 0,
         left: 0,
         width: '100%',
         height: '100%',
         backgroundColor: 'rgba(0, 0, 0, 0.9)',
         display: 'flex',
         flexDirection: 'column',
         justifyContent: 'center',
         alignItems: 'center',
         zIndex: 20,
         color: 'white',
         fontSize: '18px',
         textAlign: 'center',
         padding: '20px',
       }}>
         <div style={{ marginBottom: '20px', fontSize: '24px' }}>❌</div>
         <div style={{ marginBottom: '20px', color: '#ff6b6b' }}>
           {error}
         </div>
         <button
           onClick={handleRetry}
           style={{
             padding: '10px 20px',
             backgroundColor: '#4CAF50',
             color: 'white',
             border: 'none',
             borderRadius: '5px',
             cursor: 'pointer',
             fontSize: '16px',
           }}
         >
           Попробовать снова
         </button>
       </div>
     )}

     {/* Game Over модальное окно */}
     <GameOverModal
       isVisible={isGameOver}
       sessionGold={sessionGold}
       totalGold={stats?.coins || 0}
       onRestart={handleGameRestart}
       onMainMenu={handleMainMenu}
     />

   </div>
 );
}