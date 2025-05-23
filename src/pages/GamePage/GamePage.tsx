// src/pages/GamePage/GamePage.tsx
import { useEffect, useRef, useState } from 'react';
import { Application, Graphics, Sprite } from 'pixi.js';
import { assetsManager, type LoadingProgress } from '../../game/managers/AssetsManager';

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
    * - Врагов
    * - UI элементы
    */
   async function createGameScene(app: Application): Promise<void> {
     console.log('🏗️ Создание игровой сцены...');

     // Очищаем сцену от тестовых объектов
     app.stage.removeChildren();

     // Создаем фон
     await createBackground(app);

     // Создаем тестового героя для проверки загруженных ресурсов
     await createTestHero(app);

     // Создаем тестового врага
     await createTestCreep(app);

     console.log('✅ Игровая сцена создана');
   }

   /**
    * Создание фонового изображения
    * 
    * Использует загруженную текстуру фона и создает повторяющийся фон
    * Документация: all_pixijs_content.txt раздел "Sprites"
    */
   async function createBackground(app: Application): Promise<void> {
     console.log('🌲 Создание фона...');

     try {
       // Получаем загруженную текстуру фона
       const forestTexture = assetsManager.getBackgroundTexture('forest');
       
       // Создаем спрайт для фона
       const backgroundSprite = new Sprite(forestTexture);
       
       // Масштабируем фон по размеру экрана
       // Сохраняем пропорции, но покрываем весь экран
       const scaleX = app.screen.width / backgroundSprite.width;
       const scaleY = app.screen.height / backgroundSprite.height;
       const scale = Math.max(scaleX, scaleY);
       
       backgroundSprite.scale.set(scale);
       
       // Центрируем фон
       //backgroundSprite.x = (app.screen.width - backgroundSprite.width * scale) / 2;
       //backgroundSprite.y = (app.screen.height - backgroundSprite.height * scale) / 2;
       
       // Добавляем фон на сцену (он будет отрисован первым)
       app.stage.addChild(backgroundSprite);
       
       console.log('✅ Фон создан и добавлен на сцену');
       
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
    * Создание тестового героя
    * 
    * Создает спрайт героя с анимацией для проверки загруженных ресурсов
    * В будущем заменим на полноценный класс Hero
    */
   async function createTestHero(app: Application): Promise<void> {
     console.log('🦸 Создание тестового героя...');

     try {
       // Получаем текстуру героя в состоянии idle
       const heroTexture = assetsManager.getHeroTexture('juggernaut', 'idle');
       
       // Создаем спрайт героя
       const heroSprite = new Sprite(heroTexture);
       
       // Настраиваем позицию и размер
       heroSprite.anchor.set(0.5); // Центрируем якорь
       heroSprite.x = app.screen.width * 0.3; // Слева от центра
       heroSprite.y = app.screen.height * 0.7; // Внизу экрана
       
       // Масштабируем героя
       const heroScale = Math.min(app.screen.width, app.screen.height) / 1000;
       heroSprite.scale.set(heroScale);
       
       // Добавляем на сцену
       app.stage.addChild(heroSprite);
       
       // Простая анимация дыхания для проверки
       app.ticker.add((time) => {
         heroSprite.scale.set(heroScale + Math.sin(time.lastTime * 0.002) * 0.02);
       });
       
       console.log('✅ Тестовый герой создан');
       
     } catch (error) {
       console.error('❌ Ошибка создания героя:', error);
     }
   }

   /**
    * Создание тестового врага
    * 
    * Создает спрайт врага для проверки загруженных ресурсов
    */
   async function createTestCreep(app: Application): Promise<void> {
     console.log('👹 Создание тестового врага...');

     try {
       // Получаем текстуру врага в состоянии idle
       const creepTexture = assetsManager.getCreepTexture('direCreep', 'idle');
       
       // Создаем спрайт врага
       const creepSprite = new Sprite(creepTexture);
       
       // Настраиваем позицию и размер
       creepSprite.anchor.set(0.5);
       creepSprite.x = app.screen.width * 0.7; // Справа от центра
       creepSprite.y = app.screen.height * 0.7; // Внизу экрана
       
       // Масштабируем врага
       const creepScale = Math.min(app.screen.width, app.screen.height) / 1200;
       creepSprite.scale.set(creepScale);
       
       // Добавляем на сцену
       app.stage.addChild(creepSprite);
       
       // Простая анимация покачивания
       app.ticker.add((time) => {
         creepSprite.rotation = Math.sin(time.lastTime * 0.003) * 0.1;
       });
       
       console.log('✅ Тестовый враг создан');
       
     } catch (error) {
       console.error('❌ Ошибка создания врага:', error);
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