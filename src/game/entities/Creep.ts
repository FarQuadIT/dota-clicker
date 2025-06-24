import { AnimatedSprite, Application } from 'pixi.js';
import { assetsManager } from '../managers/AssetsManager';
import { GAME_CONFIG } from '../config/GameConfig';
import { EntityState } from '../core/GameStates';
import { CreepHealthBar } from '../components/CreepHealthBar';
import { CREEP_TYPES, type CreepTypeConfig } from '../config/creepsConfig';

/**
 * Конфигурация крипа
 */
interface CreepConfig {
  /** Тип крипа (direCreep, medved, satyr, shishka, voul, wolf) */
  creepType?: string;
  /** Позиция X относительно ширины экрана (0-1) */
  positionX?: number;
  /** Позиция Y относительно высоты экрана (0-1) */
  positionY?: number;
  /** Масштаб крипа (относительный) */
  scale?: number;
  /** Скорость движения справа налево (пикселей в тик) */
  moveSpeed?: number;
  /** Смещение позиции X при анимации смерти */
  deathOffsetX?: number;
  /** Смещение позиции Y при анимации смерти */
  deathOffsetY?: number;
  /** Зона коллизии для данного крипа (множитель, по умолчанию 1.0) */
  collisionZone?: number;
}

/**
 * Класс крипа - враг героя
 * Движется справа налево, атакует героя
 * Поддерживает адаптивное масштабирование под разные размеры экрана
 */
export class Creep extends AnimatedSprite {
  private currentState: EntityState = EntityState.IDLE;
  private moveSpeed: number;
  private isDead: boolean = false;
  private deathOffsetX: number;
  private deathOffsetY: number;
  private creepType: string;
  private collisionZone: number;
  
  // Система здоровья
  private maxHealth!: number;
  private currentHealth!: number;
  private healthBar!: CreepHealthBar;
  
  // Адаптивная система
  private app: Application;
  private config: CreepConfig;

  constructor(app: Application, config: CreepConfig = {}) {
    // Определяем тип крипа (по умолчанию direCreep)
    const creepType = config.creepType || 'direCreep';
    
    // Получаем кадры idle для создания начального спрайта
    const idleFrames = assetsManager.getCreepFrames(creepType, 'idle');
    super(idleFrames);

    // Сохраняем тип крипа
    this.creepType = creepType;

    // Сохраняем ссылки для адаптивной системы
    this.app = app;
    this.config = {
      // Позиция по умолчанию: за правым краем экрана + 10%, на 70% высоты экрана
      positionX: 1.1, // 110% от ширины экрана (за правым краем)
      positionY: 0.7, // 70% от высоты экрана
      scale: GAME_CONFIG.CREEP.scale.base,
      creepType: creepType,
      ...config
    };

    // Устанавливаем anchor сразу в конструкторе
    this.anchor.set(0.5);
    
    // Устанавливаем zIndex для крипа (средний уровень между героем и полосками здоровья)
    this.zIndex = 200;

    this.moveSpeed = config.moveSpeed ?? GAME_CONFIG.CREEP.movement.baseSpeed;
    this.deathOffsetX = config.deathOffsetX ?? GAME_CONFIG.CREEP.death.offsetX;
    this.deathOffsetY = config.deathOffsetY ?? GAME_CONFIG.CREEP.death.offsetY;
    this.collisionZone = config.collisionZone ?? 1.0; // По умолчанию стандартная зона коллизии

    // Настройка адаптивной позиции и масштаба
    this.updatePosition();
    this.updateScale();

    // Инициализация системы здоровья
    this.initializeHealth();

    // Создаем все анимации
    this.createAnimations();
    
    // Настройка начальной анимации
    this.setupIdleAnimation();
    

  }

  /**
   * Обновление позиции крипа на экране (адаптивное)
   */
  private updatePosition(): void {
    this.x = this.app.screen.width * this.config.positionX!;
    this.y = this.app.screen.height * this.config.positionY!;
  }

  /**
   * Обновление масштаба крипа (адаптивное)
   */
  private updateScale(): void {
    // Вычисляем масштаб на основе размера экрана (аналогично герою)
    const baseScale = Math.min(this.app.screen.width, this.app.screen.height) / GAME_CONFIG.SCREEN.baseResolution;
    const finalScale = baseScale * this.config.scale!;
    
    this.scale.set(finalScale);
  }

  /**
   * Обработка изменения размера экрана
   */
  public onResize(): void {
    this.updatePosition();
    this.updateScale();
    
    // Обновляем полоску здоровья при изменении размера экрана
    this.updateHealthBar();
  }

  /**
   * Изменение позиции крипа
   * 
   * @param x - позиция по X (0-1)
   * @param y - позиция по Y (0-1)
   */
  public setPosition(x: number, y: number): void {
    this.config.positionX = Math.max(0, Math.min(2, x)); // Позволяем до 200% для спавна за экраном
    this.config.positionY = Math.max(0, Math.min(1, y));
    this.updatePosition();
  }

  /**
   * Изменение масштаба крипа
   * 
   * @param scale - новый масштаб
   */
  public setScale(scale: number): void {
    this.config.scale = Math.max(0.1, Math.min(3.0, scale)); // Ограничиваем разумными пределами
    this.updateScale();
  }

  /**
   * Создание всех анимаций крипа
   */
  private createAnimations(): void {

  }

  /**
   * Настройка анимации idle
   */
  private setupIdleAnimation(): void {
    const idleFrames = assetsManager.getCreepFrames(this.creepType, 'idle');
    
    this.textures = idleFrames;
    this.animationSpeed = GAME_CONFIG.CREEP.animations.speed;
    this.loop = true;
    this.play();
    this.currentState = EntityState.IDLE;
    

  }

  /**
   * Переход к анимации атаки
   */
  public startAttack(): void {
    if (this.isDead) return;
    
    // Сохраняем текущую позицию перед переключением анимации
    const currentX = this.x;
    const currentY = this.y;
    
    this.stop();
    const attackFrames = assetsManager.getCreepFrames(this.creepType, 'attack');
    this.textures = attackFrames;
    this.animationSpeed = GAME_CONFIG.CREEP.animations.speed;
    this.loop = true;
    this.play();
    
    // Восстанавливаем позицию после переключения анимации
    this.x = currentX;
    this.y = currentY;
    
    this.currentState = EntityState.ATTACKING;
    

  }

  /**
   * Переход к анимации смерти
   */
  public startDeath(): void {
    if (this.isDead) return;
    

    
    this.isDead = true;
    
    // Сохраняем текущую позицию перед переключением анимации
    const currentX = this.x;
    const currentY = this.y;
    
    this.stop();
    const deathFrames = assetsManager.getCreepFrames(this.creepType, 'death');
    this.textures = deathFrames;
    this.animationSpeed = GAME_CONFIG.CREEP.animations.speed;
    this.loop = false;
    this.play();
    
    // Восстанавливаем позицию после переключения анимации с адаптивным смещением
    // Смещение тоже должно масштабироваться под размер экрана
    const adaptiveOffsetX = this.deathOffsetX * this.scale.x;
    const adaptiveOffsetY = this.deathOffsetY * this.scale.y;
    
    this.x = currentX + adaptiveOffsetX; 
    this.y = currentY + adaptiveOffsetY;
    

    
    this.currentState = EntityState.DYING;
    
    // Слушаем окончание анимации смерти
    this.onComplete = () => {

      this.emit('death-complete');
    };
    
    // Дополнительная гарантия - удаляем через таймер если событие не сработало
    setTimeout(() => {
      if (!this.destroyed) {
    
        this.emit('death-complete');
      }
    }, GAME_CONFIG.CREEP.death.maxDuration);
    

  }

  /**
   * Обновление крипа (движение)
   */
  public updateCreep(deltaTime: number): void {
    // Крип движется в состояниях IDLE и DYING (продолжает двигаться во время смерти)
    // Останавливается только во время атаки
    // Убираем deltaTime чтобы движение было идентично фону (как в старом проекте)
    if (this.currentState === EntityState.IDLE || this.currentState === EntityState.DYING) {
      this.x -= this.moveSpeed;
    }

    // Обновляем полоску здоровья каждый кадр
    this.updateHealthBar();
  }

  /**
   * Проверка жив ли крип
   */
  public getIsDead(): boolean {
    return this.isDead;
  }

  /**
   * Получение текущего состояния
   */
  public getCurrentState(): EntityState {
    return this.currentState;
  }

  /**
   * Получение позиции X
   */
  public getX(): number {
    return this.x;
  }

  /**
   * Установка скорости движения
   */
  public setMoveSpeed(speed: number): void {
    this.moveSpeed = speed;
  }

  /**
   * Получение конфигурации крипа
   */
  public getConfig(): Readonly<CreepConfig> {
    return { ...this.config };
  }

  /**
   * Получение зоны коллизии для данного крипа
   */
  public getCollisionZone(): number {
    return this.collisionZone;
  }

  /**
   * Инициализация системы здоровья крипа
   */
  private initializeHealth(): void {
    // Получаем конфигурацию типа крипа
    const creepTypeConfig = CREEP_TYPES[this.creepType];
    if (!creepTypeConfig) {
      console.warn(`Не найдена конфигурация для типа крипа: ${this.creepType}`);
      this.maxHealth = 10; // Значение по умолчанию
    } else {
      this.maxHealth = creepTypeConfig.maxHealth;
    }
    
    // Устанавливаем текущее здоровье равным максимальному
    this.currentHealth = this.maxHealth;
  }

  /**
   * Создание полоски здоровья крипа (вызывается из GameController после добавления к сцене)
   */
  public createHealthBar(): void {
    // Получаем конфигурацию типа крипа для позиционирования
    const creepTypeConfig = CREEP_TYPES[this.creepType];
    if (!creepTypeConfig) {
      console.warn(`Не найдена конфигурация для позиционирования полоски здоровья: ${this.creepType}`);
      return;
    }

    // Создаем полоску здоровья
    this.healthBar = new CreepHealthBar(
      creepTypeConfig,
      this.width,
      this.scale.x,
      this.maxHealth
    );

    // Добавляем полоску здоровья к сцене приложения
    // Позиция будет обновляться в updateHealthBar()
    this.app.stage.addChild(this.healthBar);
  }

  /**
   * Обновление позиции полоски здоровья
   */
  private updateHealthBar(): void {
    if (!this.healthBar) return;

    // Обновляем позицию полоски относительно крипа
    this.healthBar.updatePosition(
      this.x,
      this.y,
      this.width,
      this.scale.x
    );

    // Обновляем здоровье в полоске
    this.healthBar.updateHealth(this.currentHealth, this.maxHealth);

    // Скрываем полоску если крип умирает
    this.healthBar.setDying(this.isDead);
  }

  /**
   * Получение текущего здоровья
   */
  public getCurrentHealth(): number {
    return this.currentHealth;
  }

  /**
   * Получение максимального здоровья
   */
  public getMaxHealth(): number {
    return this.maxHealth;
  }

  /**
   * Нанесение урона крипу
   * 
   * @param damage количество урона
   * @returns true если крип умер от урона
   */
  public takeDamage(damage: number): boolean {
    if (this.isDead) return true;

    this.currentHealth = Math.max(0, this.currentHealth - damage);
    
    // Обновляем полоску здоровья
    if (this.healthBar) {
      this.healthBar.updateHealth(this.currentHealth);
    }

    // Проверяем смерть
    if (this.currentHealth <= 0 && !this.isDead) {
      this.startDeath();
      return true;
    }

    return false;
  }

  /**
   * Уничтожение крипа и очистка ресурсов
   */
  public destroy(): void {
    // Удаляем полоску здоровья из сцены
    if (this.healthBar) {
      this.app.stage.removeChild(this.healthBar);
      this.healthBar.destroy();
    }

    // Вызываем базовый метод уничтожения
    super.destroy();
  }
}
