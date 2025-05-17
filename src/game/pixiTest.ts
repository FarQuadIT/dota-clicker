/**
 * Файл для проверки корректности установки Pixi.js
 * 
 * Этот файл содержит минимальный код для проверки, что Pixi.js
 * корректно установлен и импортируется в проект.
 */

// Импортируем только необходимые компоненты из Pixi.js
import { VERSION, Application, Graphics, Container } from 'pixi.js';

/**
 * Функция проверки версии Pixi.js
 * @returns {string} Версия установленного Pixi.js
 */
export function checkPixiVersion(): string {
  // Используем константу VERSION из Pixi.js
  console.log('Pixi.js версия:', VERSION);
  
  // Проверяем наличие ключевых компонентов Pixi.js
  if (!Application) {
    console.error('PIXI.Application не найден! Проверьте установку Pixi.js.');
  } else {
    console.log('PIXI.Application доступен.');
  }
  
  return VERSION;
}

/**
 * Функция для создания базового приложения Pixi.js
 * @param {HTMLElement} container - HTML-элемент, в который будет помещен холст
 * @returns {Promise<Application>} Промис, разрешающийся в экземпляр приложения Pixi.js
 */
export async function createPixiApp(container: HTMLElement): Promise<Application> {
  console.log('Создание приложения Pixi.js...');
  
  try {
    // Сначала создаем новое приложение
    const app = new Application();
    
    // Затем инициализируем его с настройками
    await app.init({
      background: '#242424',
      resizeTo: container, // Автоматическое изменение размера
    });
    
    // Правильно используем canvas вместо устаревшего view
    container.appendChild(app.canvas);
    
    console.log('Приложение Pixi.js успешно создано');
    console.log('Размеры холста:', app.screen.width, 'x', app.screen.height);
    
    return app;
  } catch (error) {
    console.error('Ошибка при создании приложения Pixi.js:', error);
    throw error;
  }
}

/**
 * Функция для создания тестового объекта
 * @param {Application} app - Экземпляр приложения Pixi.js
 * @returns {Promise<Container>} Промис с созданным контейнером с графическими объектами
 */
export async function createTestSprite(app: Application): Promise<Container> {
  try {
    console.log('Создание тестового объекта...');
    
    // Создаем контейнер для группировки графических объектов
    // В PixiJS 8.x только Container может иметь дочерние элементы
    const container = new Container();
    container.position.set(app.screen.width / 2, app.screen.height / 2);
    
    // Красный квадрат
    const square = new Graphics();
    square.rect(-25, -25, 50, 50).fill({ color: 0xFF0000 });
    
    // Синий круг
    const circle = new Graphics();
    circle.circle(50, 0, 25).fill({ color: 0x0000FF });
    
    // Зеленый треугольник
    const triangle = new Graphics();
    triangle.moveTo(-50, 25).lineTo(-75, -25).lineTo(-25, -25).fill({ color: 0x00FF00 });
    
    // Добавляем все фигуры в контейнер
    container.addChild(square, circle, triangle);
    
    // Добавляем контейнер на сцену
    app.stage.addChild(container);
    
    // Добавляем анимацию вращения, как показано в примерах документации
    // В PixiJS 8.x ticker.add ожидает коллбэк с объектом, содержащим deltaTime
    app.ticker.add((time) => {
      container.rotation += 0.01 * time.deltaTime;
    });
    
    console.log('Тестовый объект успешно создан');
    
    return container;
  } catch (error) {
    console.error('Ошибка при создании объекта:', error);
    throw error;
  }
}