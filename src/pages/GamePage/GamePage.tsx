// src/pages/GamePage/GamePage.tsx
import { useEffect, useRef, useState } from 'react';
import { Application, Graphics, TilingSprite } from 'pixi.js';
import { assetsManager, type LoadingProgress } from '../../game/managers/AssetsManager';
import { GAME_CONFIG } from '../../game/config/GameConfig';

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
 const [isGameReady, setIsGameReady] = useState(false);

 // Эффект для инициализации Pixi.js при монтировании компонента
 useEffect(() => {
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
       // Проверяем наличие контейнера и что приложение еще не создано
       if (!gameContainerRef.current || pixiApp) {
         return;
       }

       console.log('🎮 Начинаем инициализацию игры...');
       setIsInitializing(true);
       setError(null);

       // Шаг 1: Создание и настройка Pixi Application
       const app = await initializePixiApp();
       setPixiApp(app);
       setIsInitializing(false);

       // Шаг 2: Загрузка игровых ресурсов
       setIsLoadingAssets(true);
       await loadGameAssets();
       setIsLoadingAssets(false);

       // Шаг 3: Создание игровой сцены
       await createGameScene(app);
       setIsGameReady(true);

       console.log('🎉 Игра инициализирована и готова к работе!');

     } catch (err) {
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
     console.log('⚙️ Создание Pixi.js приложения...');

     // Создаем новый экземпляр Pixi Application
     const app = new Application();

     // Инициализируем приложение с настройками
     // Это асинхронная операция в PixiJS v8
     await app.init({
       // Цвет фона (темно-серый)
       background: '#1a1a1a',
       
       // Размеры канваса - полный экран
       width: window.innerWidth,
       height: window.innerHeight,
       
       // Автоматическое изменение размера при изменении окна
       resizeTo: window,
       
       // Включаем антиалиасинг для сглаживания
       antialias: true,
       
       // Разрешение для четкости на retina дисплеях
       resolution: window.devicePixelRatio || 1,
       
       // Автоматическая плотность пикселей
       autoDensity: true,
     });

     console.log('✅ Pixi.js приложение создано');
     console.log('📏 Размеры экрана:', app.screen.width, 'x', app.screen.height);

     // Добавляем canvas в контейнер
     // В PixiJS v8 используется app.canvas вместо app.view
     gameContainerRef.current!.appendChild(app.canvas);

     return app;
   }

   /**
    * Загрузка всех игровых ресурсов
    * 
    * Использует AssetsManager для загрузки текстур, звуков и других ресурсов
    * Отслеживает прогресс загрузки для отображения пользователю
    */
   async function loadGameAssets(): Promise<void> {
     console.log('📦 Загрузка игровых ресурсов...');

     // Подписываемся на обновления прогресса загрузки
     const progressCallback = (progress: LoadingProgress) => {
       setLoadingProgress(progress);
       console.log(`📈 Прогресс загрузки: ${progress.percentage}% (${progress.currentAsset})`);
     };

     assetsManager.onProgress(progressCallback);

     try {
       // Запускаем загрузку всех ресурсов
       await assetsManager.loadGameAssets();
       console.log('✅ Все ресурсы загружены');
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
     console.log('🏗️ Создание игровой сцены...');

     // Очищаем сцену от тестовых объектов
     app.stage.removeChildren();

     // Создаем фон
     await createBackground(app);

     // Создаем героя и игровой контроллер
     await createGameController(app);

     console.log('✅ Игровая сцена создана');
   }

   /**
    * Создание фонового изображения
    * 
    * Использует TilingSprite для создания движущегося фона
    * Документация: https://pixijs.download/release/docs/scene.TilingSprite.html
    */
   async function createBackground(app: Application): Promise<void> {
     console.log('🌲 Создание движущегося фона...');

     try {
       // Получаем загруженную текстуру фона
       const forestTexture = assetsManager.getBackgroundTexture('forest');
       
       // Создаем TilingSprite для повторяющегося фона
       // TilingSprite позволяет создавать бесшовный повторяющийся фон
       const backgroundTiling = new TilingSprite(
         forestTexture,
         app.screen.width * 2,  // Делаем шире экрана для плавного движения
         app.screen.height
       );
       
       // Масштабируем фон по высоте экрана
       // Сохраняем пропорции, но покрываем всю высоту
       const scaleY = app.screen.height / forestTexture.height;
       backgroundTiling.tileScale.set(scaleY, scaleY);
       
       // Позиционируем фон
       backgroundTiling.x = 0;
       backgroundTiling.y = 0;
       
       // Добавляем фон на сцену (он будет отрисован первым)
       app.stage.addChild(backgroundTiling);
       
       // Анимация движения фона справа налево
       // Скорость движения в пикселях за тик
       const scrollSpeed = GAME_CONFIG.BACKGROUND.scroll.speed;
       
       // Флаг для управления движением фона
       let isBackgroundMoving = false;
       
       app.ticker.add((time) => {
         // Двигаем фон только если установлен флаг движения
         if (isBackgroundMoving) {
           backgroundTiling.tilePosition.x -= scrollSpeed * time.deltaTime;
         }
       });
       
       // Сохраняем функцию управления движением фона в контексте приложения
       // Это позволит герою управлять фоном
       (app as any).setBackgroundMoving = (moving: boolean) => {
         isBackgroundMoving = moving;
         console.log(`🌊 Фон ${moving ? 'начал' : 'остановил'} движение`);
       };
       
       console.log('✅ Движущийся фон создан и добавлен на сцену');
       
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
     console.log('🎮 Создание игрового контроллера...');

     try {
       // Импортируем необходимые классы
       const { Hero } = await import('../../game/entities/Hero');
       const { GameController } = await import('../../game/core/GameController');
       
       // Создаем героя типа 'juggernaut'
       const hero = new Hero(app, 'juggernaut', {
         positionX: GAME_CONFIG.HERO.position.x,  // 20% от левого края
         positionY: GAME_CONFIG.HERO.position.y,  // 70% от верха (внизу экрана)
         scale: GAME_CONFIG.HERO.scale.gamePage   // 150% размера
       });
       
       // Создаем игровой контроллер
       const gameController = new GameController(app, hero);
       
       // Связываем героя с движением фона
       hero.setMovementCallback((isMoving: boolean) => {
         if ((app as any).setBackgroundMoving) {
           (app as any).setBackgroundMoving(isMoving);
         }
       });
       
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
       
       // Запускаем игровой цикл
       gameController.startGameLoop();
       
       console.log('✅ Игровой контроллер создан и запущен');
       
     } catch (error) {
       console.error('❌ Ошибка создания игрового контроллера:', error);
     }
   }

   // Запускаем инициализацию игры
   initializeGame();

   // Функция очистки при размонтировании компонента
   return () => {
     if (pixiApp) {
       console.log('🧹 Очистка игровых ресурсов...');
       
       // Останавливаем все анимации
       pixiApp.ticker.stop();
       
       // Уничтожаем приложение и освобождаем ресурсы
       pixiApp.destroy(true);
       
       setPixiApp(null);
       setIsGameReady(false);
     }
   };
 }, []); // Пустой массив зависимостей - эффект выполнится только один раз

 // Обработчик для перезагрузки при ошибке
 const handleRetry = () => {
   setError(null);
   setIsInitializing(true);
   setIsLoadingAssets(false);
   setIsGameReady(false);
   // Перезагружаем страницу для повторной инициализации
   window.location.reload();
 };

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
         // Канвас занимает весь доступный размер
         width: '100%',
         height: '100%',
         
         // Позиционирование под Header и Footer
         position: 'absolute',
         top: 0,
         left: 0,
         
         // Z-index ниже, чем у Header/Footer
         zIndex: 1,
       }}
     />

     {/* Экран загрузки */}
     {(isInitializing || isLoadingAssets) && <LoadingScreen />}

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

     {/* Индикатор готовности игры */}
     {isGameReady && (
       <div style={{
         position: 'absolute',
         top: '20px',
         right: '20px',
         backgroundColor: 'rgba(76, 175, 80, 0.8)',
         color: 'white',
         padding: '10px 15px',
         borderRadius: '5px',
         fontSize: '14px',
         zIndex: 15,
       }}>
         🎮 Игра готова
       </div>
     )}
   </div>
 );
}