import { AnimatedSprite, Application } from 'pixi.js';
import { assetsManager } from '../managers/AssetsManager';
import { GAME_CONFIG } from '../config/GameConfig';
import { EntityState } from '../core/GameStates';
import { CreepHealthBar } from '../components/CreepHealthBar';
import { CREEP_TYPES } from '../config/creepsConfig';
import { Hero } from './Hero';

// Тип callback функции для анимации золота
type GoldAnimationCallback = (x: number, y: number, goldAmount: number) => void;

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
  /** Множитель здоровья для боссов (по умолчанию 1.0) */
  healthMultiplier?: number;
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
  
  // Система паузы анимаций
  private originalAnimationSpeed: number = GAME_CONFIG.CREEP.animations.speed;
  
  // Адаптивная система
  private app: Application;
  private config: CreepConfig;
  
  // Callback для анимации золота
  private goldAnimationCallback?: GoldAnimationCallback;

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
    
    // Обновляем полоску здоровья при изменении размера экрана с адаптивными параметрами
    if (this.healthBar) {
      this.healthBar.onResize(this.x, this.y, this.width, this.scale.x);
    }
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
    
    // Сбрасываем флаг нанесения урона для новой атаки
    this.hasDealtDamageToHero = false;
    
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
  public updateCreep(_deltaTime: number, hero?: Hero): void {
    // Крип движется в состояниях IDLE и DYING (продолжает двигаться во время смерти)
    // Останавливается только во время атаки
    if (this.currentState === EntityState.IDLE || this.currentState === EntityState.DYING) {
      this.x -= this.moveSpeed;
    }

    // Проверяем кадр атаки если герой передан и крип атакует
    if (hero && this.currentState === EntityState.ATTACKING) {
      this.checkAttackFrame(hero);
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
      console.error(`Не найдена конфигурация для типа крипа: ${this.creepType}`);
      this.maxHealth = 10; // Значение по умолчанию
    } else {
      this.maxHealth = creepTypeConfig.maxHealth;
    }
    
    // Применяем множитель здоровья для боссов
    const healthMultiplier = this.config.healthMultiplier ?? 1.0;
    this.maxHealth = Math.floor(this.maxHealth * healthMultiplier);
    
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
   * Получение полоски здоровья крипа
   */
  public getHealthBar(): CreepHealthBar | null {
    return this.healthBar || null;
  }

  /**
   * Установить callback для анимации золота
   * @param callback - функция для вызова анимации золота
   */
  public setGoldAnimationCallback(callback: GoldAnimationCallback): void {
    this.goldAnimationCallback = callback;
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
      // АНИМАЦИЯ ЗОЛОТА: Вызываем callback для анимации золота
      this.triggerGoldAnimation();
      
      this.startDeath();
      return true;
    }

    return false;
  }

  /**
   * Вызвать анимацию получения золота через callback
   */
  private triggerGoldAnimation(): void {
    if (this.goldAnimationCallback) {
      // Получаем конфигурацию крипа для определения награды
      const creepConfig = CREEP_TYPES[this.creepType];
      if (creepConfig && creepConfig.goldReward) {
        // Вызываем callback с позицией крипа и количеством золота
        this.goldAnimationCallback(this.x, this.y, creepConfig.goldReward);
    
      }
    } else {
      
    }
  }

  // ==================================================================================
  // СИСТЕМА АТАК НА ГЕРОЯ (Микрошаг 2.5.3)
  // ==================================================================================

  // Флаг для отслеживания нанесения урона в атаке (как у героя)
  private hasDealtDamageToHero: boolean = false;

  /**
   * Получение типа крипа для конфигурации
   */
  public getCreepType(): string {
    return this.creepType;
  }

  /**
   * Проверка может ли крип атаковать героя
   * 
   * @returns true если крип может атаковать
   */
  public canAttackHero(): boolean {
    return !this.isDead && this.currentState === EntityState.ATTACKING;
  }

  /**
   * Атака героя крипом (аналог dealDamage из старого проекта)
   * Наносит урон герою и применяет особые способности
   * 
   * @param hero герой для атаки
   */
  public attackHero(hero: Hero): void {
    if (!this.canAttackHero() || !hero.isAlive()) return;

    // Получаем конфигурацию крипа для урона и способностей
    const creepConfig = CREEP_TYPES[this.creepType];
    if (!creepConfig) {
  
      return;
    }

    // Наносим базовый урон
    hero.takeDamage(creepConfig.damage);

    // Применяем особые способности согласно старому проекту
    this.applySpecialAbilities(hero, creepConfig);


  }

  /**
   * Применение особых способностей крипа (аналог functions['attack_modifier'] из старого проекта)
   * 
   * @param hero герой для применения способностей
   * @param config конфигурация крипа
   */
  private applySpecialAbilities(hero: Hero, config: any): void {
    if (!config.specialAbilities) return;

    for (const ability of config.specialAbilities) {
      switch (ability) {
        case 'manaburn': // Способность сатира
          if (hero.getCurrentMana() >= 2 && config.manaburnPercent) {
            // Вычисляем количество маны для отнятия в процентах от максимальной маны
            const heroMaxMana = hero.getMaxMana();
            const manaburnAmount = Math.floor(heroMaxMana * (config.manaburnPercent / 100));
            
            // Отнимаем вычисленное количество маны
            hero.takeManaburn(manaburnAmount);
    
            
            // Создаем визуальный эффект manaburn (синие частицы)
            // Получаем GameController через app для доступа к эффектам
            if ((this.app as any).gameController && (this.app as any).gameController.damageEffectManager) {
              (this.app as any).gameController.damageEffectManager.createManaburnEffect(hero.x, hero.y);
            }
          }
          break;

        case 'poison': // Способность вула
          hero.applyPoison(1000); // 1 секунда отравления

          break;

        default:

      }
    }
  }

  /**
   * Проверка кадра атаки для нанесения урона (аналог updateAnimation из старого проекта)
   * Должен вызываться в основном цикле обновления
   * 
   * @param hero герой для атаки
   */
  public checkAttackFrame(hero: Hero): void {
    if (this.currentState === EntityState.ATTACKING) {
      // Сбрасываем флаг урона при начале нового цикла анимации (currentFrame = 0)
      if (this.currentFrame === 0) {
        this.hasDealtDamageToHero = false;
      }

      // Проверяем только если ещё не нанёс урон в этом цикле
      if (!this.hasDealtDamageToHero) {
        // Получаем конфигурацию для определения кадра атаки
        const creepConfig = CREEP_TYPES[this.creepType];
        if (creepConfig) {
          // Используем attackFrame из конфигурации или значение по умолчанию (середина анимации)
          const attackFrame = (creepConfig as any).attackFrame || Math.floor(this.totalFrames / 2);
          
          // Проверяем достижение кадра урона (как в старом проекте)
          if (this.currentFrame >= attackFrame) {
            this.hasDealtDamageToHero = true;
            
            // Наносим урон герою
            this.attackHero(hero);
          }
        }
      }
    }
  }

  // ==================================================================================
  // УПРАВЛЕНИЕ ПАУЗОЙ АНИМАЦИЙ
  // ==================================================================================
  
  /**
   * Поставить анимации на паузу
   */
  public pauseAnimations(): void {
    // Сохраняем текущую скорость анимации перед паузой
    this.originalAnimationSpeed = this.animationSpeed;
    // Останавливаем анимацию PixiJS AnimatedSprite
    this.animationSpeed = 0;

  }
  
  /**
   * Возобновить анимации
   */
  public resumeAnimations(): void {
    // Восстанавливаем сохраненную скорость анимации
    this.animationSpeed = this.originalAnimationSpeed;

  }

  /**
   * Уничтожение крипа и очистка ресурсов
   */
  public destroy(): void {
    // Сбрасываем флаги атаки
    this.hasDealtDamageToHero = false;
    
    // Уничтожаем полоску здоровья
    if (this.healthBar && !this.healthBar.destroyed) {
      this.healthBar.destroy();
    }

    // Уничтожаем базовый AnimatedSprite
    super.destroy();
  }
}
