/**
 * Система отображения чисел урона (Floating Damage Numbers)
 * 
 * Показывает числовые значения урона, исцеления и других эффектов
 * над персонажами с красивой анимацией всплытия и исчезновения.
 * 
 * Поддерживает различные типы и цвета для разных эффектов.
 * ОПТИМИЗИРОВАНО ДЛЯ iOS: упрощенные стили на слабых устройствах.
 */

import { Container, Text, Application, TextStyle } from 'pixi.js';

// ==================================================================================
// ОПТИМИЗАЦИЯ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ
// ==================================================================================

/**
 * Определение типа устройства для оптимизации
 */
const IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
const IS_ANDROID = /Android/.test(navigator.userAgent);
const IS_LOW_END = IS_IOS || IS_ANDROID || navigator.hardwareConcurrency <= 4;

/**
 * Максимальное количество одновременных анимаций (для производительности)
 */
const MAX_DAMAGE_NUMBERS = IS_LOW_END ? 8 : 20;

// ==================================================================================
// ТИПЫ И ИНТЕРФЕЙСЫ
// ==================================================================================

/**
 * Типы чисел урона для определения цвета и стиля
 */
export enum DamageNumberType {
  /** Урон наносимый героем по крипу */
  HERO_DAMAGE = 'hero_damage',
  /** Урон наносимый крипом по герою */
  CREEP_DAMAGE = 'creep_damage',
  /** Урон от пассивных способностей */
  PASSIVE_DAMAGE = 'passive_damage',
  /** Урон по мане (manaburn) */
  MANA_DAMAGE = 'mana_damage',
  /** Исцеление */
  HEALING = 'healing',
  /** Критический урон */
  CRITICAL_DAMAGE = 'critical_damage'
}

/**
 * Конфигурация стиля для типа числа урона
 */
interface DamageNumberStyle {
  /** Цвет текста (hex) */
  color: string;
  /** Размер шрифта */
  fontSize: number;
  /** Жирность шрифта */
  fontWeight: 'normal' | 'bold';
  /** Обводка текста */
  stroke?: {
    color: string;
    width: number;
  };
  /** Тень */
  dropShadow?: {
    enabled: boolean;
    color: string;
    blur: number;
    distance: number;
  };
}

/**
 * Конфигурация анимации числа урона
 */
interface DamageNumberAnimationConfig {
  /** Время жизни в миллисекундах */
  duration: number;
  /** Скорость движения вверх (пикселей в секунду) */
  upwardSpeed: number;
  /** Горизонтальное смещение (случайное) */
  horizontalRange: number;
  /** Масштабирование при появлении */
  initialScale: number;
  /** Конечный масштаб */
  finalScale: number;
  /** Начальная прозрачность */
  initialAlpha: number;
  /** Время до начала исчезновения (в процентах от общей длительности) */
  fadeStartPercent: number;
}

// ==================================================================================
// КОНФИГУРАЦИЯ СТИЛЕЙ - ОПТИМИЗИРОВАННАЯ ДЛЯ iOS
// ==================================================================================

/**
 * Упрощенные стили для слабых устройств (без дорогих эффектов)
 * КРИТИЧНО для производительности на iOS!
 */
export const SIMPLIFIED_DAMAGE_NUMBER_STYLES: Record<DamageNumberType, DamageNumberStyle> = {
  [DamageNumberType.HERO_DAMAGE]: {
    color: '#FFFFFF', // Простой белый
    fontSize: 18,
    fontWeight: 'normal', // Без bold - дешевле
    stroke: {
      color: '#000000',
      width: 1 // Тонкая обводка
    }
    // Без dropShadow - экономия производительности!
  },
  
  [DamageNumberType.CREEP_DAMAGE]: {
    color: '#FF6666', // Простой красный
    fontSize: 16,
    fontWeight: 'normal',
    stroke: {
      color: '#000000',
      width: 1
    }
  },
  
  [DamageNumberType.PASSIVE_DAMAGE]: {
    color: '#999999', // Простой серый
    fontSize: 14,
    fontWeight: 'normal',
    stroke: {
      color: '#000000',
      width: 1
    }
  },
  
  [DamageNumberType.MANA_DAMAGE]: {
    color: '#4499FF', // Простой синий
    fontSize: 14,
    fontWeight: 'normal',
    stroke: {
      color: '#000000',
      width: 1
    }
  },
  
  [DamageNumberType.HEALING]: {
    color: '#44FF44', // Простой зеленый
    fontSize: 14,
    fontWeight: 'normal',
    stroke: {
      color: '#000000',
      width: 1
    }
  },
  
  [DamageNumberType.CRITICAL_DAMAGE]: {
    color: '#FF4444', // Красный как у критического урона
    fontSize: 16,
    fontWeight: 'bold',
    stroke: {
      color: '#000000',
      width: 1
    }
  }
};

/**
 * Предустановленные стили для разных типов урона (только для мощных устройств)
 */
export const DAMAGE_NUMBER_STYLES: Record<DamageNumberType, DamageNumberStyle> = {
  [DamageNumberType.HERO_DAMAGE]: {
    color: '#E0E0E0', // Тускловато-белый
    fontSize: 24,
    fontWeight: 'bold',
    stroke: {
      color: '#000000',
      width: 2
    },
    dropShadow: {
      enabled: true,
      color: '#000000',
      blur: 2,
      distance: 1
    }
  },
  
  [DamageNumberType.CREEP_DAMAGE]: {
    color: '#FF6B6B', // Тускловато-красный
    fontSize: 22,
    fontWeight: 'bold',
    stroke: {
      color: '#8B0000',
      width: 2
    },
    dropShadow: {
      enabled: true,
      color: '#000000',
      blur: 2,
      distance: 1
    }
  },
  
  [DamageNumberType.PASSIVE_DAMAGE]: {
    color: '#A0A0A0', // Тускловато-серый
    fontSize: 20,
    fontWeight: 'normal',
    stroke: {
      color: '#000000',
      width: 1
    },
    dropShadow: {
      enabled: true,
      color: '#000000',
      blur: 1,
      distance: 1
    }
  },
  
  [DamageNumberType.MANA_DAMAGE]: {
    color: '#4DA6FF', // Голубой
    fontSize: 20,
    fontWeight: 'bold',
    stroke: {
      color: '#001F3F',
      width: 2
    },
    dropShadow: {
      enabled: true,
      color: '#000000',
      blur: 2,
      distance: 1
    }
  },
  
  [DamageNumberType.HEALING]: {
    color: '#4AFF4A', // Зеленый
    fontSize: 20,
    fontWeight: 'bold',
    stroke: {
      color: '#0B5F0B',
      width: 2
    },
    dropShadow: {
      enabled: true,
      color: '#000000',
      blur: 2,
      distance: 1
    }
  },
  
  [DamageNumberType.CRITICAL_DAMAGE]: {
    color: '#FF4444', // Красный цвет для критического урона
    fontSize: 22,      // Немного больше passive damage но не огромный
    fontWeight: 'bold',
    stroke: {
      color: '#660000', // Темно-красная обводка
      width: 2
    },
    dropShadow: {
      enabled: true,
      color: '#000000',
      blur: 2,
      distance: 1
    }
  }
};

/**
 * Конфигурация анимации по умолчанию (оптимизированная для iOS)
 */
export const DEFAULT_ANIMATION_CONFIG: DamageNumberAnimationConfig = {
  duration: IS_LOW_END ? 800 : 1000, // Короче анимация на слабых устройствах
  upwardSpeed: IS_LOW_END ? 60 : 80, // Медленнее движение
  horizontalRange: IS_LOW_END ? 10 : 20, // Меньше случайности
  initialScale: IS_LOW_END ? 1.0 : 1.2, // Без масштабирования на слабых устройствах
  finalScale: IS_LOW_END ? 1.0 : 0.8,
  initialAlpha: 1.0,
  fadeStartPercent: 0.6
};

// ==================================================================================
// КЛАСС ОДНОГО ЧИСЛА УРОНА
// ==================================================================================

/**
 * Класс для отображения одного числа урона
 */
export class DamageNumber extends Container {
  private textElement: Text;
  private animationConfig: DamageNumberAnimationConfig;
  private elapsedTime: number = 0;
  private startX: number;
  private startY: number;
  private targetX: number;
  private targetY: number;
  
  constructor(
    value: number,
    type: DamageNumberType,
    x: number,
    y: number,
    animationConfig?: Partial<DamageNumberAnimationConfig>
  ) {
    super();
    
    // Объединяем конфигурацию анимации
    this.animationConfig = { ...DEFAULT_ANIMATION_CONFIG, ...animationConfig };
    
    // Создаем стиль текста на основе типа урона
    // КРИТИЧНО: Используем упрощенные стили на слабых устройствах для производительности
    const styleConfig = IS_LOW_END ? SIMPLIFIED_DAMAGE_NUMBER_STYLES[type] : DAMAGE_NUMBER_STYLES[type];
    const textStyle = new TextStyle({
      fontFamily: 'Doka', // Единый шрифт как везде в игре
      fontSize: styleConfig.fontSize,
      fontWeight: styleConfig.fontWeight,
      fill: styleConfig.color,
      ...(styleConfig.stroke && {
        stroke: { color: styleConfig.stroke.color, width: styleConfig.stroke.width }
      }),
      // Добавляем dropShadow только на мощных устройствах (критично для iOS!)
      ...(!IS_LOW_END && styleConfig.dropShadow && styleConfig.dropShadow.enabled && {
        dropShadow: {
          color: styleConfig.dropShadow.color,
          blur: styleConfig.dropShadow.blur,
          distance: styleConfig.dropShadow.distance
        }
      })
    });
    
    // Создаем текстовый элемент
    const displayText = this.formatValue(value, type);
    this.textElement = new Text({ text: displayText, style: textStyle });
    
    // Центрируем текст
    this.textElement.anchor.set(0.5, 0.5);
    
    // Устанавливаем начальные параметры
    this.scale.set(this.animationConfig.initialScale);
    this.alpha = this.animationConfig.initialAlpha;
    
    // Добавляем текст к контейнеру
    this.addChild(this.textElement);
    
    // Сохраняем начальную и целевую позиции
    this.startX = x;
    this.startY = y;
    
    // Случайное горизонтальное смещение
    const horizontalOffset = (Math.random() - 0.5) * this.animationConfig.horizontalRange;
    this.targetX = x + horizontalOffset;
    this.targetY = y - (this.animationConfig.upwardSpeed * this.animationConfig.duration) / 1000;
    
    // Устанавливаем начальную позицию
    this.position.set(this.startX, this.startY);
    
    // Высокий zIndex для отображения поверх всего
    this.zIndex = 2000;
  }
  
  /**
   * Форматирование значения для отображения
   */
  private formatValue(value: number, type: DamageNumberType): string {
    switch (type) {
      case DamageNumberType.HERO_DAMAGE:
      case DamageNumberType.CREEP_DAMAGE:
      case DamageNumberType.PASSIVE_DAMAGE:
      case DamageNumberType.CRITICAL_DAMAGE:
        return `-${Math.floor(value)}`;
      
      case DamageNumberType.MANA_DAMAGE:
        return IS_LOW_END ? `-${Math.floor(value)}` : `-${Math.floor(value)} MP`; // Короче текст на слабых устройствах
      
      case DamageNumberType.HEALING:
        return `+${Math.floor(value)}`;
      
      default:
        return `${Math.floor(value)}`;
    }
  }
  
  /**
   * Обновление анимации (вызывается каждый кадр)
   * @returns true если анимация продолжается, false если завершена
   */
  public update(deltaTime: number): boolean {
    this.elapsedTime += deltaTime;
    
    // Проверяем завершение анимации
    if (this.elapsedTime >= this.animationConfig.duration) {
      return false;
    }
    
    // Вычисляем прогресс анимации (0-1)
    const progress = this.elapsedTime / this.animationConfig.duration;
    
    // Обновляем позицию (интерполяция от старта к цели)
    this.x = this.startX + (this.targetX - this.startX) * progress;
    this.y = this.startY + (this.targetY - this.startY) * progress;
    
    // Обновляем масштаб (от начального к конечному) - только на мощных устройствах
    if (!IS_LOW_END) {
      const currentScale = this.animationConfig.initialScale + 
        (this.animationConfig.finalScale - this.animationConfig.initialScale) * progress;
      this.scale.set(currentScale);
    }
    
    // Обновляем прозрачность (начинаем исчезать после fadeStartPercent)
    if (progress >= this.animationConfig.fadeStartPercent) {
      const fadeProgress = (progress - this.animationConfig.fadeStartPercent) / 
        (1 - this.animationConfig.fadeStartPercent);
      this.alpha = this.animationConfig.initialAlpha * (1 - fadeProgress);
    }
    
    return true;
  }
}

// ==================================================================================
// МЕНЕДЖЕР ЧИСЕЛ УРОНА - ОПТИМИЗИРОВАННЫЙ
// ==================================================================================

/**
 * Менеджер для управления всеми числами урона на экране
 * ОПТИМИЗИРОВАН для iOS: лимит количества, упрощенные стили
 */
export class DamageNumberManager {
  private numbers: DamageNumber[] = [];
  private app: Application;
  
  constructor(app: Application) {
    this.app = app;
    
    // Включаем сортировку по zIndex
    this.app.stage.sortableChildren = true;
    
    console.log(`🎭 DamageNumberManager: Режим производительности ${IS_LOW_END ? 'ВКЛЮЧЕН' : 'ВЫКЛЮЧЕН'} (iOS: ${IS_IOS})`);
  }
  
  /**
   * Создание числа урона в указанной позиции
   * ОПТИМИЗИРОВАНО: лимит количества одновременных анимаций
   */
  public createDamageNumber(
    value: number,
    type: DamageNumberType,
    x: number,
    y: number,
    animationConfig?: Partial<DamageNumberAnimationConfig>
  ): void {
    // ОПТИМИЗАЦИЯ: Удаляем старые числа если превышен лимит
    if (this.numbers.length >= MAX_DAMAGE_NUMBERS) {
      const oldestNumber = this.numbers.shift();
      if (oldestNumber) {
        this.app.stage.removeChild(oldestNumber);
        oldestNumber.destroy();
      }
    }
    
    const damageNumber = new DamageNumber(value, type, x, y, animationConfig);
    
    // Добавляем на сцену
    this.app.stage.addChild(damageNumber);
    this.numbers.push(damageNumber);
  }
  
  /**
   * Создание числа урона над крипом
   */
  public createCreepDamageNumber(value: number, x: number, y: number): void {
    this.createDamageNumber(value, DamageNumberType.HERO_DAMAGE, x, y - 40);
  }
  
  /**
   * Создание числа урона над героем
   */
  public createHeroDamageNumber(value: number, x: number, y: number): void {
    this.createDamageNumber(value, DamageNumberType.CREEP_DAMAGE, x, y - 60);
  }
  
  /**
   * Создание числа урона от пассивной способности
   */
  public createPassiveDamageNumber(value: number, x: number, y: number): void {
    this.createDamageNumber(value, DamageNumberType.PASSIVE_DAMAGE, x, y - 40);
  }
  
  /**
   * Создание числа урона по мане
   */
  public createManaDamageNumber(value: number, x: number, y: number): void {
    this.createDamageNumber(value, DamageNumberType.MANA_DAMAGE, x, y - 50);
  }
  
  /**
   * Создание числа исцеления
   */
  public createHealingNumber(value: number, x: number, y: number): void {
    this.createDamageNumber(value, DamageNumberType.HEALING, x, y - 50);
  }
  
  /**
   * Создание критического урона в указанной позиции
   */
  public createCriticalDamageAt(value: number, x: number, y: number): void {
    this.createDamageNumber(value, DamageNumberType.CRITICAL_DAMAGE, x, y - 40, {
      duration: IS_LOW_END ? 1000 : 1200, // Короче на слабых устройствах
      upwardSpeed: IS_LOW_END ? 80 : 100,
      initialScale: IS_LOW_END ? 1.0 : 1.5 // Без масштабирования на iOS
    });
  }

  /**
   * Создание числа урона над healthbar крипа (автоматическое позиционирование)
   */
  public createCreepDamageNumberAboveHealthBar(
    value: number, 
    creep: any, // Крип с методом getHealthBar()
    type: DamageNumberType = DamageNumberType.HERO_DAMAGE
  ): void {
    if (creep.getHealthBar && creep.getHealthBar()) {
      const healthBar = creep.getHealthBar();
      // Позиционируем число точно по центру healthbar
      const centerX = healthBar.getCenterX ? healthBar.getCenterX() : healthBar.x + (healthBar.getBarWidth ? healthBar.getBarWidth() / 2 : 50);
      const topY = healthBar.getTopY ? healthBar.getTopY() : healthBar.y;
      this.createDamageNumber(value, type, centerX, topY - 20);
    } else {
      // Fallback: позиционируем над крипом
      this.createDamageNumber(value, type, creep.x, creep.y - 40);
    }
  }
  
  /**
   * Создание числа урона над healthbar героя (автоматическое позиционирование)
   */
  public createHeroDamageNumberAboveHealthBar(
    value: number,
    hero: any, // Герой с методом getHealthBar()
    type: DamageNumberType = DamageNumberType.CREEP_DAMAGE
  ): void {
    if (hero.getHealthBar && hero.getHealthBar()) {
      const healthBar = hero.getHealthBar();
      // Позиционируем число точно по центру healthbar
      const centerX = healthBar.getCenterX ? healthBar.getCenterX() : healthBar.x + (healthBar.getBarWidth ? healthBar.getBarWidth() / 2 : 50);
      const topY = healthBar.getTopY ? healthBar.getTopY() : healthBar.y;
      this.createDamageNumber(value, type, centerX, topY - 20);
    } else {
      // Fallback: позиционируем над героем
      this.createDamageNumber(value, type, hero.x, hero.y - 60);
    }
  }
  
  /**
   * Создание числа пассивного урона над healthbar (автоматическое позиционирование)
   */
  public createPassiveDamageNumberAboveHealthBar(
    value: number,
    target: any, // Цель с методом getHealthBar()
    type: DamageNumberType = DamageNumberType.PASSIVE_DAMAGE
  ): void {
    if (target.getHealthBar && target.getHealthBar()) {
      const healthBar = target.getHealthBar();
      // Позиционируем число точно по центру healthbar
      const centerX = healthBar.getCenterX ? healthBar.getCenterX() : healthBar.x + (healthBar.getBarWidth ? healthBar.getBarWidth() / 2 : 50);
      const topY = healthBar.getTopY ? healthBar.getTopY() : healthBar.y;
      this.createDamageNumber(value, type, centerX, topY - 20);
    } else {
      // Fallback: позиционируем над персонажем
      this.createDamageNumber(value, type, target.x, target.y - 40);
    }
  }
  
  /**
   * Создание числа урона по мане над healthbar (автоматическое позиционирование)
   */
  public createManaDamageNumberAboveHealthBar(
    value: number,
    target: any, // Цель с методом getHealthBar()
    type: DamageNumberType = DamageNumberType.MANA_DAMAGE
  ): void {
    if (target.getHealthBar && target.getHealthBar()) {
      const healthBar = target.getHealthBar();
      // Позиционируем число точно по центру healthbar (чуть левее для мана урона)
      const centerX = healthBar.getCenterX ? healthBar.getCenterX() : healthBar.x + (healthBar.getBarWidth ? healthBar.getBarWidth() / 2 : 50);
      const topY = healthBar.getTopY ? healthBar.getTopY() : healthBar.y;
      this.createDamageNumber(value, type, centerX - 15, topY - 20);
    } else {
      // Fallback: позиционируем над персонажем
      this.createDamageNumber(value, type, target.x, target.y - 50);
    }
  }
  
  /**
   * Создание числа критического урона над healthbar (автоматическое позиционирование)
   * Отображается красным цветом выше обычного урона для избежания перекрытия
   */
  public createCriticalDamageNumber(
    value: number,
    target: any, // Цель с методом getHealthBar()
    type: DamageNumberType = DamageNumberType.CRITICAL_DAMAGE
  ): void {
    if (target.getHealthBar && target.getHealthBar()) {
      const healthBar = target.getHealthBar();
      // Позиционируем число по центру healthbar, но значительно выше обычного урона
      const centerX = healthBar.getCenterX ? healthBar.getCenterX() : healthBar.x + (healthBar.getBarWidth ? healthBar.getBarWidth() / 2 : 50);
      const topY = healthBar.getTopY ? healthBar.getTopY() : healthBar.y;
      // Критический урон размещается выше (topY - 50) чтобы не перекрываться с обычным уроном
      this.createDamageNumber(value, type, centerX, topY - 50);
    } else {
      // Fallback: позиционируем значительно выше персонажа
      this.createDamageNumber(value, type, target.x, target.y - 90);
    }
  }
  
  /**
   * Обновление всех чисел урона (вызывается каждый кадр)
   * ОПТИМИЗИРОВАНО: batch обработка
   */
  public update(deltaTime: number): void {
    for (let i = this.numbers.length - 1; i >= 0; i--) {
      const number = this.numbers[i];
      const isActive = number.update(deltaTime);
      
      // Удаляем завершенные анимации
      if (!isActive) {
        this.app.stage.removeChild(number);
        number.destroy();
        this.numbers.splice(i, 1);
      }
    }
  }
  
  /**
   * Очистка всех чисел урона
   */
  public cleanup(): void {
    
    try {
      // Создаем копию массива для безопасной итерации
      const numbersToClean = [...this.numbers];
      
      // Очищаем массив сразу, чтобы предотвратить новые добавления
      this.numbers = [];
      
      // Удаляем все числа урона
      for (const number of numbersToClean) {
        try {
          // Останавливаем анимацию если она есть
          if (number.parent) {
            number.parent.removeChild(number);
          }
          number.destroy();
        } catch (error) {
          console.warn('⚠️ Ошибка при удалении числа урона:', error);
        }
      }
      
      console.log('✅ Все числа урона очищены');
    } catch (error) {
      console.error('❌ Критическая ошибка при очистке чисел урона:', error);
      // В любом случае очищаем массив
      this.numbers = [];
    }
  }
  
  /**
   * Получение количества активных чисел урона
   */
  public getActiveCount(): number {
    return this.numbers.length;
  }
  
  /**
   * Кастомное создание числа урона с полной настройкой
   */
  public createCustomDamageNumber(
    value: number,
    x: number,
    y: number,
    customStyle: Partial<DamageNumberStyle>,
    animationConfig?: Partial<DamageNumberAnimationConfig>
  ): void {
    // Создаем временный тип для кастомного стиля
    const customType = DamageNumberType.HERO_DAMAGE;
    
    // Временно переопределяем стиль
    const originalStyle = IS_LOW_END ? SIMPLIFIED_DAMAGE_NUMBER_STYLES[customType] : DAMAGE_NUMBER_STYLES[customType];
    const targetStyles = IS_LOW_END ? SIMPLIFIED_DAMAGE_NUMBER_STYLES : DAMAGE_NUMBER_STYLES;
    targetStyles[customType] = { ...originalStyle, ...customStyle };
    
    // Создаем число урона
    this.createDamageNumber(value, customType, x, y, animationConfig);
    
    // Восстанавливаем оригинальный стиль
    targetStyles[customType] = originalStyle;
  }
}

/**
 * Тестовая функция для демонстрации всех типов чисел урона
 * Вызовите в консоли: testDamageNumbers()
 */
export function testDamageNumbers(app: Application): void {
  const manager = new DamageNumberManager(app);
  const centerX = app.screen.width / 2;
  const centerY = app.screen.height / 2;
  
  // Тестируем различные типы урона с задержкой
  setTimeout(() => {
    manager.createDamageNumber(150, DamageNumberType.HERO_DAMAGE, centerX - 100, centerY);
  }, 500);
  
  setTimeout(() => {
    manager.createDamageNumber(80, DamageNumberType.CREEP_DAMAGE, centerX + 100, centerY);
  }, 1000);
  
  setTimeout(() => {
    manager.createDamageNumber(25, DamageNumberType.PASSIVE_DAMAGE, centerX - 50, centerY - 50);
  }, 1500);
  
  setTimeout(() => {
    manager.createDamageNumber(30, DamageNumberType.MANA_DAMAGE, centerX + 50, centerY - 50);
  }, 2000);
  
  setTimeout(() => {
    manager.createDamageNumber(75, DamageNumberType.HEALING, centerX, centerY + 50);
  }, 2500);
  
  setTimeout(() => {
    manager.createDamageNumber(300, DamageNumberType.CRITICAL_DAMAGE, centerX, centerY - 100);
  }, 3000);
  
  // Делаем manager доступным глобально для дальнейшего тестирования
  (window as any).damageNumberManager = manager;
  
}

// Делаем функцию доступной глобально для вызова из консоли
(window as any).testDamageNumbers = testDamageNumbers; 