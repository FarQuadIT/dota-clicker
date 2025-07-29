import { Container, Text, Texture, Sprite, Application } from 'pixi.js';
import type { Creep } from '../entities/Creep';

/**
 * Данные для анимации одной монеты
 */
interface CoinAnimationData {
  container: Container;
  text: Text;
  startTime: number;
  duration: number;
  initialY: number;
  finalY: number;
}

/**
 * Менеджер анимации монет при убийстве крипов
 * 
 * Создает визуальный эффект "+X" золота который появляется точно на месте полоски здоровья крипа,
 * плавно поднимается вверх и исчезает. Аналогично предупреждению о недостатке маны.
 */
export class CoinAnimationManager {
  private app: Application;
  private container: Container;
  private activeAnimations: CoinAnimationData[] = [];

  /**
   * Конструктор менеджера анимации монет
   * @param app - экземпляр PixiJS Application
   */
  constructor(app: Application) {
    this.app = app;
    
    // Создаем основной контейнер для всех анимаций монет
    this.container = new Container();
    this.container.zIndex = 999; // Поверх всех элементов
    this.container.label = 'coin-animations';
    
    // Добавляем контейнер на главную сцену
    this.app.stage.addChild(this.container);
    
    // Включаем сортировку по zIndex
    this.app.stage.sortableChildren = true;
  }

  /**
   * Создать анимацию получения золота на месте полоски здоровья крипа
   * @param creep - крип для которого показать анимацию
   * @param goldAmount - количество золота для отображения
   */
  public showCoinAnimationOnCreep(creep: Creep, goldAmount: number): void {
    // Получаем позицию полоски здоровья крипа
    const healthBarPosition = this.getCreepHealthBarPosition(creep);
    
    if (!healthBarPosition) {
      // Fallback: показываем анимацию в центре крипа
      this.showCoinAnimation(creep.x, creep.y - 50, goldAmount);
      return;
    }
    
    // Показываем анимацию точно на месте полоски здоровья
    this.showCoinAnimation(
      healthBarPosition.x + healthBarPosition.width / 2, // Центр полоски по X
      healthBarPosition.y + healthBarPosition.height / 2, // Центр полоски по Y
      goldAmount
    );
  }

  /**
   * Получить позицию полоски здоровья крипа
   * @param creep - крип
   * @returns позиция и размеры полоски здоровья или null
   */
  private getCreepHealthBarPosition(creep: Creep): { x: number; y: number; width: number; height: number } | null {
    try {
      // Получаем полоску здоровья через публичный метод
      const healthBar = creep.getHealthBar();
      if (!healthBar) return null;

      // Возвращаем мировые координаты полоски здоровья
      return {
        x: healthBar.x,
        y: healthBar.y,
        width: (healthBar as any).barWidth || 60, // Ширина полоски
        height: 15 // Высота полоски (константа из CreepHealthBar)
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Создать анимацию получения золота в указанных координатах
   * @param x - X координата в мировых координатах (PixiJS)
   * @param y - Y координата в мировых координатах (PixiJS) 
   * @param goldAmount - количество золота для отображения
   */
  public showCoinAnimation(x: number, y: number, goldAmount: number): void {
    // Создаем контейнер для одной анимации
    const animationContainer = new Container();
    animationContainer.x = x;
    animationContainer.y = y;
    
    // Создаем текст "+X" (стиль аналогичен предупреждению о мане)
    const goldText = new Text({
      text: `${goldAmount}`,
      style: {
        fontFamily: 'Doka',
        fontSize: 24, // Крупнее для лучшей видимости
        fontWeight: 'bold',
        fill: '#F5D244', // Золотистый цвет
        stroke: { color: '#000000', width: 3 }, // Увеличил обводку под крупный шрифт
        letterSpacing: 1,
        align: 'center'
      }
    });
    
    // Центрируем текст
    goldText.anchor.set(0.5, 0.5);
    
    // Добавляем иконку монеты рядом с текстом (опционально)
    this.addCoinIcon(animationContainer, goldText);
    
    // Добавляем текст в контейнер анимации
    animationContainer.addChild(goldText);
    
    // Добавляем контейнер анимации в основной контейнер
    this.container.addChild(animationContainer);
    
    // Начальное состояние анимации
    animationContainer.alpha = 1.0; // Сразу видимый
    goldText.scale.set(1.0); // Нормальный размер
    
    // Создаем данные анимации (аналогично предупреждению о мане)
    const animationData: CoinAnimationData = {
      container: animationContainer,
      text: goldText,
      startTime: Date.now(),
      duration: 1200, // 1.2 секунды (чуть больше чем у предупреждения о мане)
      initialY: y,
      finalY: y - 30 // Движение на 30 пикселей вверх
    };
    
    // Добавляем в список активных анимаций
    this.activeAnimations.push(animationData);
  }

  /**
   * Добавить иконку монеты рядом с текстом (опционально)
   * @param container - контейнер анимации
   * @param goldText - текст с количеством золота
   */
  private addCoinIcon(container: Container, goldText: Text): void {
    try {
      // Попытаемся получить текстуру монеты
      const coinTexture = Texture.from('/media/shop/images/gold.png');
      
      if (coinTexture && coinTexture.source) {
        const coinSprite = new Sprite(coinTexture);
        coinSprite.width = 24;
        coinSprite.height = 24;
        coinSprite.anchor.set(0.5, 0.5);
        
        // ИСПРАВЛЕНИЕ: Динамически рассчитываем позицию иконки на основе ширины текста
        // Сначала нужно получить границы текста после установки стиля
        const textBounds = goldText.getBounds();
        const textWidth = textBounds.width;
        
        // Размещаем монету слева от текста с учетом его реальной ширины + отступ
        coinSprite.x = -(textWidth / 2) - 15; // Половина ширины текста + 15px отступ
        coinSprite.y = 0;
        
        container.addChild(coinSprite);
      }
    } catch (error) {
      // Если иконка монеты недоступна, продолжаем без неё
    }
  }

  /**
   * Обновление всех активных анимаций (вызывается каждый кадр)
   */
  public update(deltaTime: number): void {
    // Обновляем все анимации в обратном порядке (чтобы безопасно удалять)
    for (let i = this.activeAnimations.length - 1; i >= 0; i--) {
      const animation = this.activeAnimations[i];
      const isActive = this.updateAnimation(animation);
      
      // Удаляем завершенные анимации
      if (!isActive) {
        this.removeAnimation(animation, i);
      }
    }
  }

  /**
   * Обновить одну анимацию (аналогично предупреждению о мане)
   * @param animation - данные анимации
   * @returns true если анимация еще активна
   */
  private updateAnimation(animation: CoinAnimationData): boolean {
    const elapsed = Date.now() - animation.startTime;
    const progress = Math.min(elapsed / animation.duration, 1);
    
    if (progress >= 1) {
      // Анимация завершена
      return false;
    }
    
    // Анимация движения вверх (постоянная скорость)
    animation.container.y = animation.initialY + (animation.finalY - animation.initialY) * progress;

    // Анимация затухания (начинается с 50% времени, как у предупреждения о мане)
    if (progress > 0.5) {
      const fadeProgress = (progress - 0.5) / 0.5; // 0-1 для второй половины анимации
      animation.container.alpha = 1 - fadeProgress;
    }
    
    return true;
  }

  /**
   * Удалить завершенную анимацию
   * @param animation - данные анимации
   * @param index - индекс в массиве
   */
  private removeAnimation(animation: CoinAnimationData, index: number): void {
    // Удаляем из сцены
    if (animation.container.parent) {
      animation.container.parent.removeChild(animation.container);
    }
    
    // Уничтожаем контейнер и освобождаем память
    animation.container.destroy({
      children: true,  // Уничтожаем всех детей
      texture: false   // НЕ уничтожаем текстуры (они могут использоваться в других местах)
    });
    
    // Удаляем из массива
    this.activeAnimations.splice(index, 1);
  }

  /**
   * Очистить все активные анимации
   */
  public cleanup(): void {
    
    try {
      // Создаем копию массива для безопасной итерации
      const animationsToClean = [...this.activeAnimations];
      
      // Очищаем массив сразу
      this.activeAnimations = [];
      
      // Удаляем все активные анимации
      for (const animation of animationsToClean) {
        try {
          if (animation.container.parent) {
            animation.container.parent.removeChild(animation.container);
          }
          animation.container.destroy({ children: true, texture: false });
        } catch (error) {
          console.warn('⚠️ Ошибка при удалении анимации монеты:', error);
        }
      }
    } catch (error) {
      console.error('❌ Критическая ошибка при очистке анимаций монет:', error);
      this.activeAnimations = [];
    }
  }

  /**
   * Уничтожить менеджер и освободить ресурсы
   */
  public destroy(): void {
    this.cleanup();
    
    // Удаляем основной контейнер
    if (this.container.parent) {
      this.container.parent.removeChild(this.container);
    }
    this.container.destroy({ children: true, texture: false });
  }
} 