/**
 * Базовый класс для всех игровых сущностей (герои, враги)
 * 
 * Принципы работы:
 * 1. Расширяет AnimatedSprite - получает систему анимаций
 * 2. Добавляет игровые свойства (здоровье, урон, состояния)
 * 3. Управляет отображением полосок здоровья/маны
 * 4. Предоставляет базовую логику для боевой системы
 * 
 * Основано на старом проекте hero.js и creep.js
 * Документация: all_pixijs_content.txt разделы "Graphics" и "Containers"
 */

import { Graphics, Texture } from 'pixi.js';
import { AnimatedSprite } from './AnimatedSprite';

// ==================================================================================
// ТИПЫ ДАННЫХ ДЛЯ ИГРОВЫХ СУЩНОСТЕЙ
// ==================================================================================

/**
 * Базовые характеристики игровой сущности
 */
interface EntityStats {
  /** Максимальное здоровье */
  maxHealth: number;
  
  /** Текущее здоровье */
  currentHealth: number;
  
  /** Скорость восстановления здоровья (в секунду) */
  healthRegen: number;
  
  /** Базовый урон */
  damage: number;
  
  /** Уровень сущности */
  level: number;
}

/**
 * Состояния игровой сущности
 */
enum EntityState {
  IDLE = 'idle',           // Ожидание
  MOVING = 'moving',       // Движение
  ATTACKING = 'attacking', // Атака
  DYING = 'dying',         // Смерть
  DEAD = 'dead'           // Мертв
}

/**
 * Конфигурация полоски здоровья
 */
interface HealthBarConfig {
  /** Ширина полоски */
  width: number;
  
  /** Высота полоски */
  height: number;
  
  /** Смещение по Y относительно центра сущности */
  offsetY: number;
  
  /** Цвет фона полоски */
  backgroundColor: number;
  
  /** Цвет заполнения полоски */
  fillColor: number;
  
  /** Цвет рамки */
  borderColor: number;
}

// ==================================================================================
// КЛАСС ИГРОВОЙ СУЩНОСТИ
// ==================================================================================

/**
 * Абстрактный базовый класс для всех игровых объектов
 * 
 * Наследуется от AnimatedSprite, добавляет:
 * - Систему здоровья и характеристик
 * - Управление состояниями
 * - Отображение полосок здоровья
 * - Базовую боевую логику
 */
export abstract class GameEntity extends AnimatedSprite {
  // Характеристики сущности
  protected stats: EntityStats;
  
  // Текущее состояние сущности
  protected currentState: EntityState = EntityState.IDLE;
  
  // Флаги состояния
  protected isAliveFlag: boolean = true;
  protected isCollidingFlag: boolean = false;
  protected isDyingFlag: boolean = false;
  
  // Графические элементы для отображения полосок
  protected healthBarContainer: Graphics | null = null;
  protected healthBarConfig: HealthBarConfig;
  
  // Таймеры для восстановления здоровья
  protected healthRegenTimer: number = 0;
  
  /**
   * Конструктор базовой игровой сущности
   * 
   * @param initialStats - начальные характеристики
   * @param initialTexture - начальная текстура
   */
  constructor(initialStats: EntityStats, initialTexture?: Texture) {
    super(initialTexture);
    
    // Копируем характеристики
    this.stats = { ...initialStats };
    
    // Устанавливаем текущее здоровье равным максимальному
    this.stats.currentHealth = this.stats.maxHealth;
    
    // Настройки полоски здоровья по умолчанию
    this.healthBarConfig = {
      width: 80,
      height: 8,
      offsetY: -50,
      backgroundColor: 0x440000, // Темно-красный
      fillColor: 0xFF4444,       // Красный
      borderColor: 0xFFFFFF      // Белый
    };
    
    // Создаем полоску здоровья
    this.createHealthBar();
    
    console.log(`🎯 Создана игровая сущность: HP=${this.stats.maxHealth}, DMG=${this.stats.damage}`);
  }

  // ==================================================================================
  // УПРАВЛЕНИЕ ХАРАКТЕРИСТИКАМИ
  // ==================================================================================

  /**
   * Получение урона
   * 
   * @param damageAmount - количество урона
   * @param source - источник урона (опционально)
   */
  public takeDamage(damageAmount: number, source?: GameEntity): void {
    // Проверяем, может ли сущность получить урон
    if (!this.isAliveFlag || this.isDyingFlag) {
      return;
    }
    
    // Уменьшаем здоровье
    this.stats.currentHealth = Math.max(0, this.stats.currentHealth - damageAmount);
    
    // Обновляем полоску здоровья
    this.updateHealthBar();
    
    console.log(`💥 Получен урон ${damageAmount}, осталось HP: ${this.stats.currentHealth}/${this.stats.maxHealth}`);
    
    // Проверяем смерть
    if (this.stats.currentHealth <= 0) {
      this.die();
    }
    
    // Вызываем метод обработки урона (переопределяется в наследниках)
    this.onTakeDamage(damageAmount, source);
  }

  /**
   * Восстановление здоровья
   * 
   * @param healAmount - количество восстанавливаемого здоровья
   */
  public heal(healAmount: number): void {
    if (!this.isAliveFlag) return;
    
    // Увеличиваем здоровье, но не больше максимума
    this.stats.currentHealth = Math.min(this.stats.maxHealth, this.stats.currentHealth + healAmount);
    
    // Обновляем полоску здоровья
    this.updateHealthBar();
    
    console.log(`💚 Восстановлено ${healAmount} HP, теперь: ${this.stats.currentHealth}/${this.stats.maxHealth}`);
  }

  /**
   * Нанесение урона другой сущности
   * 
   * @param target - цель атаки
   */
  public dealDamageTo(target: GameEntity): void {
    if (!this.isAliveFlag || !target.isAlive()) {
      return;
    }
    
    // Наносим урон цели
    target.takeDamage(this.stats.damage, this);
    
    console.log(`⚔️ Нанесен урон ${this.stats.damage} цели`);
    
    // Вызываем метод обработки атаки
    this.onDealDamage(target);
  }

  // ==================================================================================
  // УПРАВЛЕНИЕ СОСТОЯНИЯМИ
  // ==================================================================================

  /**
   * Смена состояния сущности
   * 
   * @param newState - новое состояние
   */
  protected changeState(newState: EntityState): void {
    if (this.currentState === newState) return;
    
    const oldState = this.currentState;
    this.currentState = newState;
    
    console.log(`🔄 Смена состояния: ${oldState} → ${newState}`);
    
    // Обрабатываем смену состояния
    this.onStateChange(oldState, newState);
    
    // Запускаем соответствующую анимацию
    this.playStateAnimation();
  }

  /**
   * Запуск анимации для текущего состояния
   */
  protected playStateAnimation(): void {
    // Базовый маппинг состояний на анимации
    switch (this.currentState) {
      case EntityState.IDLE:
        this.playAnimation('idle');
        break;
      case EntityState.MOVING:
        this.playAnimation('run');
        break;
      case EntityState.ATTACKING:
        this.playAnimation('attack');
        break;
      case EntityState.DYING:
        this.playAnimation('death');
        break;
    }
  }

  /**
   * Обработка смерти сущности
   */
  protected die(): void {
    if (this.isDyingFlag || !this.isAliveFlag) return;
    
    console.log('💀 Сущность умирает...');
    
    // Устанавливаем флаги
    this.isDyingFlag = true;
    this.isAliveFlag = false;
    
    // Меняем состояние
    this.changeState(EntityState.DYING);
    
    // Вызываем метод обработки смерти
    this.onDeath();
  }

  // ==================================================================================
  // ВИЗУАЛЬНЫЕ ЭЛЕМЕНТЫ
  // ==================================================================================

  /**
   * Создание полоски здоровья
   */
  protected createHealthBar(): void {
    // Создаем контейнер для полоски здоровья
    this.healthBarContainer = new Graphics();
    
    // Позиционируем полоску над сущностью
    this.healthBarContainer.y = this.healthBarConfig.offsetY;
    
    // Добавляем как дочерний объект
    this.addChild(this.healthBarContainer);
    
    // Рисуем полоску
    this.updateHealthBar();
  }

  /**
   * Обновление отображения полоски здоровья
   */
  protected updateHealthBar(): void {
    if (!this.healthBarContainer) return;
    
    // Очищаем предыдущее содержимое
    this.healthBarContainer.clear();
    
    // Вычисляем процент здоровья
    const healthPercent = this.stats.currentHealth / this.stats.maxHealth;
    
    const config = this.healthBarConfig;
    
    // Рисуем фон полоски
    this.healthBarContainer
      .rect(-config.width / 2, -config.height / 2, config.width, config.height)
      .fill({ color: config.backgroundColor });
    
    // Рисуем заполнение полоски
    if (healthPercent > 0) {
      this.healthBarContainer
        .rect(-config.width / 2, -config.height / 2, config.width * healthPercent, config.height)
        .fill({ color: config.fillColor });
    }
    
    // Рисуем рамку полоски
    this.healthBarContainer
      .rect(-config.width / 2, -config.height / 2, config.width, config.height)
      .stroke({ color: config.borderColor, width: 1 });
  }

  // ==================================================================================
  // ИГРОВОЙ ЦИКЛ
  // ==================================================================================

  /**
   * Обновление сущности (вызывается каждый кадр)
   * 
   * @param deltaTime - время с последнего кадра (в миллисекундах)
   */
  public update(deltaTime: number): void {
    // Обновляем анимацию
    this.updateAnimation(deltaTime);
    
    // Обновляем восстановление здоровья
    this.updateHealthRegen(deltaTime);
    
    // Вызываем специфичное обновление для наследников
    this.onUpdate(deltaTime);
  }

  /**
   * Обновление восстановления здоровья
   * 
   * @param deltaTime - время с последнего кадра
   */
  protected updateHealthRegen(deltaTime: number): void {
    // Проверяем, может ли восстанавливаться здоровье
    if (!this.isAliveFlag || this.stats.healthRegen <= 0 || this.stats.currentHealth >= this.stats.maxHealth) {
      return;
    }
    
    // Обновляем таймер
    this.healthRegenTimer += deltaTime;
    
    // Каждую секунду восстанавливаем здоровье
    if (this.healthRegenTimer >= 1000) {
      this.heal(this.stats.healthRegen);
      this.healthRegenTimer = 0;
    }
  }

  // ==================================================================================
  // МЕТОДЫ ДЛЯ ПЕРЕОПРЕДЕЛЕНИЯ В НАСЛЕДНИКАХ
  // ==================================================================================

  /**
   * Обработка получения урона (переопределяется в наследниках)
   */
  protected onTakeDamage(damageAmount: number, source?: GameEntity): void {
    // Базовая реализация - ничего не делаем
  }

  /**
   * Обработка нанесения урона (переопределяется в наследниках)
   */
  protected onDealDamage(target: GameEntity): void {
    // Базовая реализация - ничего не делаем
  }

  /**
   * Обработка смерти (переопределяется в наследниках)
   */
  protected onDeath(): void {
    // Базовая реализация - ничего не делаем
  }

  /**
   * Обработка смены состояния (переопределяется в наследниках)
   */
  protected onStateChange(oldState: EntityState, newState: EntityState): void {
    // Базовая реализация - ничего не делаем
  }

  /**
   * Обновление специфичной логики (переопределяется в наследниках)
   */
  protected onUpdate(deltaTime: number): void {
    // Базовая реализация - ничего не делаем
  }

  // ==================================================================================
  // ПУБЛИЧНЫЕ ГЕТТЕРЫ
  // ==================================================================================

  /** Проверка, жива ли сущность */
  public isAlive(): boolean {
    return this.isAliveFlag;
  }

  /** Проверка, умирает ли сущность */
  public isDying(): boolean {
    return this.isDyingFlag;
  }

  /** Проверка столкновения */
  public isColliding(): boolean {
    return this.isCollidingFlag;
  }

  /** Получение текущего состояния */
  public getState(): EntityState {
    return this.currentState;
  }

  /** Получение характеристик */
  public getStats(): Readonly<EntityStats> {
    return this.stats;
  }

  /** Получение текущего здоровья */
  public getCurrentHealth(): number {
    return this.stats.currentHealth;
  }

  /** Получение максимального здоровья */
  public getMaxHealth(): number {
    return this.stats.maxHealth;
  }

  /** Получение урона */
  public getDamage(): number {
    return this.stats.damage;
  }

  // ==================================================================================
  // ОЧИСТКА РЕСУРСОВ
  // ==================================================================================

  /**
   * Уничтожение сущности и очистка ресурсов
   */
  public destroy(): void {
    // Удаляем полоску здоровья
    if (this.healthBarContainer) {
      this.healthBarContainer.destroy();
      this.healthBarContainer = null;
    }
    
    // Вызываем родительский метод
    super.destroy();
    
    console.log('🗑️ GameEntity уничтожена');
  }
}

// Экспортируем типы для использования в наследниках
export type { EntityStats, EntityState, HealthBarConfig };