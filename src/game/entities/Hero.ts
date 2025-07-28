/**
 * Класс героя в игре Dota Clicker
 * 
 * Принципы работы:
 * 1. Наследуется от GameEntity - получает систему анимаций и состояний
 * 2. Управляет героем на экране с анимациями idle и run
 * 3. Позиционируется в левой части экрана
 * 4. Автоматически переключает анимации в зависимости от состояния
 * 5. Управляет движением фона в зависимости от состояния героя
 * 
 * Основано на старом проекте hero.js
 */

import { Application } from 'pixi.js';
import { GameEntity } from '../core/GameEntity';
import { EntityState } from '../core/GameStates';
import { assetsManager } from '../managers/AssetsManager';
import { audioManager } from '../managers/SoundManager';
import { GAME_CONFIG } from '../config/GameConfig';
import { HeroHealthBar } from '../components/HeroHealthBar';
import { useHeroStore } from '../../contexts/heroStore';
import { getHeroConfig } from '../config/heroConfig';
import { heroAbilitiesManager } from '../systems/HeroAbilities';

// ==================================================================================
// ИНТЕРФЕЙСЫ И ТИПЫ
// ==================================================================================

/**
 * Конфигурация героя
 */
interface HeroConfig {
  /** Тип героя (например, 'juggernaut') */
  type: string;
  
  /** Имя героя для отображения */
  name: string;
  
  /** Позиция по X относительно ширины экрана (0-1) */
  positionX: number;
  
  /** Позиция по Y относительно высоты экрана (0-1) */
  positionY: number;
  
  /** Масштаб героя */
  scale: number;
  
  /** Зона коллизии - множитель для расстояния обнаружения крипов */
  collisionZone: number;
  
  /** Настройки полосок здоровья и маны */
  healthBars?: {
    baseWidth: number;
    minWidth: number;
    offsetX: number;
    offsetY: number;
  };
}

/**
 * Коллбэк для изменения состояния движения
 * 
 * @param isMoving - true если герой двигается, false если стоит
 */
type MovementCallback = (isMoving: boolean) => void;

/**
 * Тип коллбэка для нанесения урона после атаки
 */
type AttackCallback = () => void;

/**
 * Тип коллбэка для получения урона (x, y - позиция героя)
 */
type DamageCallback = (x: number, y: number) => void;

// ==================================================================================
// КЛАСС ГЕРОЯ
// ==================================================================================

/**
 * Класс героя
 * 
 * Представляет игрового персонажа с анимациями и возможностью управления
 */
export class Hero extends GameEntity {
  // Конфигурация героя
  private config: HeroConfig;
  
  // Ссылка на приложение PixiJS для доступа к размерам экрана
  private app: Application;
  
  // Тип героя для загрузки текстур
  private heroType: string;
  
  // Коллбэк для уведомления о движении
  private movementCallback?: MovementCallback;
  
  // Коллбэк для нанесения урона после завершения атаки
  private attackCallback?: AttackCallback;
  
  // Коллбэк для получения урона (визуальные эффекты)
  private damageCallback?: DamageCallback;
  
  // Флаг для отслеживания нанесения урона в атаке
  private hasDealtDamage: boolean = false;
  
  // Полоски здоровья и маны (добавляются на сцену через GameController)
  private healthBar!: HeroHealthBar;
  
  // Звуковая система
  private isRunSoundPlaying: boolean = false;
  private shouldPlayRunSound: boolean = false; // Флаг для отложенного запуска звука бега
  private hasUserInteracted: boolean = false; // Флаг пользовательского взаимодействия

  /**
   * Конструктор героя
   * 
   * @param app - приложение PixiJS
   * @param heroType - тип героя (например, 'juggernaut')
   * @param config - конфигурация героя
   */
  constructor(app: Application, heroType: string, config?: Partial<HeroConfig>) {
    // Получаем начальную текстуру для инициализации родительского класса
    const initialTexture = assetsManager.getHeroTexture(heroType, 'idle');
    
    super(initialTexture);
    
    this.app = app;
    this.heroType = heroType;
    
    // Получаем базовую конфигурацию из heroConfig.ts
    const heroConfig = getHeroConfig(heroType);
    
    // Применяем конфигурацию из heroConfig.ts с возможностью перезаписи
    this.config = {
      type: heroType,
      name: heroConfig?.name || heroType,
      positionX: heroConfig?.positionX || GAME_CONFIG.HERO.position.x,
      positionY: heroConfig?.positionY || GAME_CONFIG.HERO.position.y,
      scale: heroConfig?.scale || GAME_CONFIG.HERO.scale.base,
      collisionZone: heroConfig?.collisionZone || 1.0,  // Стандартная зона коллизии по умолчанию
      healthBars: heroConfig?.healthBars || { baseWidth: 120, minWidth: 80, offsetX: 0, offsetY: -90 }, // Стандартные настройки полосок
      ...config  // Переданные параметры перезаписывают базовые
    };
    
    this.setupHero();
    this.setupAnimations();
    this.setupHealthBar();

  }

  // ==================================================================================
  // ИНИЦИАЛИЗАЦИЯ
  // ==================================================================================

  /**
   * Настройка базовых параметров героя
   */
  private setupHero(): void {
    // Устанавливаем базовый zIndex для героя (меньше чем у полосок здоровья)
    this.zIndex = 100;
    
    // Позиционируем героя на экране
    this.updatePosition();
    
    // Устанавливаем масштаб
    this.updateScale();
  }

  /**
   * Настройка полосок здоровья и маны
   */
  private setupHealthBar(): void {
    // Создаем полоски здоровья и маны с индивидуальными настройками
    this.healthBar = new HeroHealthBar(this.config.healthBars!);
    
    // НЕ добавляем как дочерний элемент - это будет делать GameController
    // чтобы полоски были поверх всех остальных элементов
  }

  // ==================================================================================
  // ЗВУКОВАЯ СИСТЕМА
  // ==================================================================================

  /**
   * Воспроизведение звука атаки героя (случайный из 6 вариантов)
   */
  private playAttackSound(): void {
    try {
      // Дополнительная проверка: не воспроизводим звуки если игра на паузе
      if (audioManager.isGamePausedState()) return;
      
      // Проверяем готовность AudioManager
      if (!audioManager.isReady()) {
        return;
      }
      
      audioManager.playRandomSound('hero_attack');
    } catch (error) {
      console.warn('⚠️ Ошибка воспроизведения звука атаки героя:', error);
    }
  }

  /**
   * Запуск звука бега героя (цикличный)
   */
  private startRunSound(): void {
    if (this.isRunSoundPlaying) return;
    
    try {
      // Дополнительная проверка: не воспроизводим звуки если игра на паузе
      if (audioManager.isGamePausedState()) return;
      
      // Проверяем готовность AudioManager
      if (!audioManager.isReady()) {
        this.shouldPlayRunSound = true; // Запомним что нужно запустить звук
        return;
      }
      
      // Пытаемся воспроизвести звук
      audioManager.playSound('hero_run', true); // loop = true
      this.isRunSoundPlaying = true;
      this.shouldPlayRunSound = false; // Сбрасываем флаг отложенного запуска
      
    } catch (error) {
      console.warn('⚠️ Ошибка запуска звука бега героя:', error);
      this.shouldPlayRunSound = true; // Попробуем снова позже
    }
  }

  /**
   * Остановка звука бега героя
   */
  private stopRunSound(): void {
    if (!this.isRunSoundPlaying) return;
    
    try {
      audioManager.stopSound('hero_run');
      this.isRunSoundPlaying = false;
    } catch (error) {
      console.warn('⚠️ Ошибка остановки звука бега героя:', error);
    }
  }

  /**
   * Обновление состояния звуков в зависимости от анимации
   */
  private updateSoundState(): void {
    const currentAnimation = this.getCurrentAnimationName();
    
    // Управление звуком бега
    if (currentAnimation === 'run' && !this.isRunSoundPlaying) {
      this.startRunSound();
    } else if (currentAnimation !== 'run' && this.isRunSoundPlaying) {
      this.stopRunSound();
      this.shouldPlayRunSound = false; // Сбрасываем флаг если останавливаем звук
    }
    
    // Retry механизм: пытаемся запустить отложенный звук бега
    if (this.shouldPlayRunSound && !this.isRunSoundPlaying && currentAnimation === 'run') {
      if (audioManager.isReady() && !audioManager.isGamePausedState()) {
        this.startRunSound();
      }
    }
  }

  /**
   * Обработчик первого пользовательского взаимодействия
   * Вызывается при первом клике/тапе для разблокировки звуков
   */
  public onUserInteraction(): void {
    if (this.hasUserInteracted) return;
    
    this.hasUserInteracted = true;
    
    // Уведомляем AudioManager о взаимодействии
    audioManager.onUserInteraction();
    
    // Если у нас есть отложенный звук бега, пытаемся его запустить
    if (this.shouldPlayRunSound && !this.isRunSoundPlaying) {
      const currentAnimation = this.getCurrentAnimationName();
      if (currentAnimation === 'run') {
        this.startRunSound();
      }
    }
  }

  /**
   * Настройка анимаций героя
   */
  private setupAnimations(): void {
    try {
      // Получаем конфигурацию героя для скоростей анимаций
      const heroConfig = getHeroConfig(this.heroType);
      
      // Получаем кадры анимаций героя из спрайтшитов
      const idleFrames = assetsManager.getHeroFrames(this.heroType, 'idle');
      const runFrames = assetsManager.getHeroFrames(this.heroType, 'run');
      const attackFrames = assetsManager.getHeroFrames(this.heroType, 'attack');
      

      
      // Добавляем анимацию idle с всеми кадрами (используем скорость из heroConfig)
      this.addAnimation({
        name: 'idle',
        textures: idleFrames,
        frameRate: heroConfig?.animationSpeeds?.idle || GAME_CONFIG.HERO.animations.idleFrameRate,
        loop: true
      });
      
      // Добавляем анимацию run с всеми кадрами (используем скорость из heroConfig)
      this.addAnimation({
        name: 'run',
        textures: runFrames,
        frameRate: heroConfig?.animationSpeeds?.run || GAME_CONFIG.HERO.animations.runFrameRate,
        loop: true
      });
      
      // Добавляем анимацию attack с всеми кадрами (используем скорость из heroConfig)
      this.addAnimation({
        name: 'attack',
        textures: attackFrames,
        frameRate: heroConfig?.animationSpeeds?.attack || GAME_CONFIG.HERO.animations.attackFrameRate,
        loop: false, // Атака не зацикливается
        onComplete: () => {
          // После завершения атаки переходим в idle и ждем решения GameController
          // GameController сам решит: продолжить бой (остаться в idle) или начать бег
          
          this.setIdle();
        }
      });
      
      // Запускаем анимацию idle по умолчанию
      this.playAnimation('idle');
      
      
      
    } catch (error) {
      console.error(`❌ Ошибка настройки анимаций для героя ${this.heroType}:`, error);
    }
  }

  // ==================================================================================
  // УПРАВЛЕНИЕ СОСТОЯНИЯМИ
  // ==================================================================================

  /**
   * Установка героя в состояние покоя
   */
  public setIdle(): void {
    this.changeState(EntityState.IDLE);
    
    // ИСПРАВЛЕНИЕ: Принудительно перезапускаем анимацию idle
    // changeState уже вызывает playStateAnimation(), но нужно убедиться что анимация точно играет
    this.playAnimation('idle', true); // forceRestart = true
    
    // Уведомляем о том, что герой остановился
    this.notifyMovement(false);
    
    // Звуковые эффекты: останавливаем звук бега
    this.updateSoundState();
  }

  /**
   * Установка героя в состояние движения
   */
  public setMoving(): void {
    this.changeState(EntityState.MOVING);
    
    // ИСПРАВЛЕНИЕ: Принудительно перезапускаем анимацию run
    this.playAnimation('run', true); // forceRestart = true
    
    // Уведомляем о том, что герой начал двигаться
    this.notifyMovement(true);
    
    // Звуковые эффекты: запускаем звук бега
    this.updateSoundState();
  }

  /**
   * Установка героя в состояние атаки
   */
  public setAttacking(): void {
    this.changeState(EntityState.ATTACKING);
    
    // Сбрасываем флаг нанесения урона для новой атаки
    this.hasDealtDamage = false;
    
    // Воспроизводим анимацию attack с принудительным перезапуском
    // Это важно для кликера - каждый клик должен воспроизводить анимацию
    this.playAnimation('attack', true); // forceRestart = true
    
    // Во время атаки герой не двигается
    this.notifyMovement(false);
    
    // Звуковые эффекты: воспроизводим звук атаки и обновляем состояние звуков
    this.playAttackSound();
    this.updateSoundState();
  }

  // ==================================================================================
  // УПРАВЛЕНИЕ ДВИЖЕНИЕМ ФОНА И АТАКАМИ
  // ==================================================================================

  /**
   * Установка коллбэка для уведомления о движении
   * 
   * @param callback - функция, которая будет вызвана при изменении состояния движения
   */
  public setMovementCallback(callback: MovementCallback): void {
    this.movementCallback = callback;
  }
  
  /**
   * Установка коллбэка для нанесения урона после атаки
   * 
   * @param callback - функция, которая будет вызвана после завершения анимации атаки
   */
  public setAttackCallback(callback: AttackCallback): void {
    this.attackCallback = callback;
  }

  /**
   * Установка коллбэка для получения урона
   * 
   * @param callback - функция, которая будет вызвана при получении урона с позицией героя
   */
  public setDamageCallback(callback: DamageCallback): void {
    this.damageCallback = callback;
  }

  /**
   * Уведомление о изменении состояния движения
   * 
   * @param isMoving - true если герой двигается, false если стоит
   */
  private notifyMovement(isMoving: boolean): void {
    if (this.movementCallback) {
      this.movementCallback(isMoving);
    }
  }

  // ==================================================================================
  // ПОЗИЦИОНИРОВАНИЕ И МАСШТАБИРОВАНИЕ
  // ==================================================================================

  /**
   * Обновление позиции героя на экране
   */
  private updatePosition(): void {
    this.x = this.app.screen.width * this.config.positionX;
    this.y = this.app.screen.height * this.config.positionY;
  }
  
  /**
   * Обновление масштаба героя
   */
  private updateScale(): void {
    // ИСПРАВЛЕННАЯ ФОРМУЛА: Герой должен занимать одинаковый процент от высоты экрана
    // на всех устройствах, независимо от размера экрана
    
    // Целевой размер героя в процентах от высоты экрана (25% как на ПК)
    const targetHeightPercent = 0.7; 
    
    // Рассчитываем целевую высоту героя в пикселях
    const targetHeightPx = this.app.screen.height * targetHeightPercent;
    
    // ИСПРАВЛЕНИЕ: Определяем реальный размер кадра в зависимости от качества
    // Получаем информацию о выбранном качестве из AssetsManager
    const qualityInfo = assetsManager.getQualityInfo();
    let estimatedSpriteHeight = 800; // Значение по умолчанию
    
    // Устанавливаем размер кадра в зависимости от качества
    switch (qualityInfo.quality) {
      case 'hd':
        estimatedSpriteHeight = 1024; // HD кадры 1024×1024
        break;
      case 'md':
        estimatedSpriteHeight = 512;  // MD кадры 512×512
        break;
      case 'ld':
        estimatedSpriteHeight = 256;  // LD кадры 256×256
        break;
      default:
        estimatedSpriteHeight = 512;  // Средний размер по умолчанию
    }
    
    // Вычисляем нужный масштаб для достижения целевого размера
    const requiredScale = targetHeightPx / estimatedSpriteHeight;
    
    // Применяем конфигурационный множитель от heroConfig
    const finalScale = requiredScale * this.config.scale;
    
    // Ограничиваем масштаб разумными пределами
    const clampedScale = Math.max(0.1, Math.min(2.0, finalScale));
    
    this.scale.set(clampedScale);
  }

  /**
   * Изменение позиции героя
   * 
   * @param x - позиция по X (0-1)
   * @param y - позиция по Y (0-1)
   */
  public setPosition(x: number, y: number): void {
    this.config.positionX = Math.max(0, Math.min(1, x));
    this.config.positionY = Math.max(0, Math.min(1, y));
    this.updatePosition();
  }

  /**
   * Изменение масштаба героя
   * 
   * @param scale - новый масштаб
   */
  public setScale(scale: number): void {
    this.config.scale = Math.max(
      GAME_CONFIG.HERO.scale.min, 
      Math.min(GAME_CONFIG.HERO.scale.max, scale)
    );
    this.updateScale();
  }

  // ==================================================================================
  // ОБНОВЛЕНИЕ И СОБЫТИЯ
  // ==================================================================================

  /**
   * Обработка изменения размера экрана
   */
  public onResize(): void {
    this.updatePosition();
    this.updateScale();
    
    // Обновляем позицию полосок здоровья
    this.updateHealthBarPosition();
  }
  
  /**
   * Обновление полосок здоровья и маны
   */
  private updateHealthBars(deltaTime: number = 16.6): void {
    // Получаем актуальные статы героя из heroStore
    const heroStats = useHeroStore.getState().stats;
    
    if (!heroStats || !this.healthBar) {
      return;
    }
    
    // Обновляем полоски на основе текущих статов
    this.healthBar.updateBars(heroStats, deltaTime);
    
    // Позиционируем полоски над героем
    this.updateHealthBarPosition();
  }
  
  /**
   * Обновление позиции полосок здоровья над героем
   */
  private updateHealthBarPosition(): void {
    if (this.healthBar) {
      // ИСПРАВЛЕНИЕ: Используем this.x, this.y (центр спрайта) вместо getBounds() 
      // так как anchor.set(0.5, 0.5) означает что this.x/this.y = центр спрайта
      
      // Позиционируем полоски над героем (простое позиционирование)
      this.healthBar.positionAboveHero(
        this.x,           // Центр спрайта по X
        this.y,           // Центр спрайта по Y  
        this.width,       // Ширина спрайта
        this.height,      // Высота спрайта
        this.scale.x,
        this.app.screen.width
      );
    }
  }

  /**
   * Переопределение метода обновления для специфичной логики героя
   */
  protected onUpdate(deltaTime?: number): void {
    // Отслеживаем кадр атаки для точного нанесения урона
    this.checkAttackDamageFrame();
    
    // Обновляем полоски здоровья и маны
    this.updateHealthBars(deltaTime);
    
    // Обновляем состояние звуков
    this.updateSoundState();
  }
  
  /**
   * Проверяет достижение кадра нанесения урона в анимации атаки
   */
  private checkAttackDamageFrame(): void {
    // Проверяем только если герой атакует и ещё не нанёс урон
    if (this.getState() === EntityState.ATTACKING && !this.hasDealtDamage) {
      // Проверяем что сейчас воспроизводится анимация атаки
      if (this.getCurrentAnimationName() === 'attack') {
        // Проверяем достижение кадра урона (индексы начинаются с 0)
        if (this.getCurrentFrame() >= GAME_CONFIG.HERO.animations.damageFrame) {
          this.hasDealtDamage = true;
          
  
          
          if (this.attackCallback) {
            this.attackCallback();
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
    // Используем метод из базового класса AnimatedSprite
    this.pauseAnimation();
    
    // Останавливаем все звуки героя
    this.stopRunSound();
  }
  
  /**
   * Возобновить анимации
   */
  public resumeAnimations(): void {
    // Используем метод из базового класса AnimatedSprite
    this.resumeAnimation();
  }

  // ==================================================================================
  // ПУБЛИЧНЫЕ ГЕТТЕРЫ
  // ==================================================================================

  /** Получение типа героя */
  public getHeroType(): string {
    return this.heroType;
  }

  /** Получение конфигурации героя */
  public getConfig(): Readonly<HeroConfig> {
    return this.config;
  }

  /** Получение имени героя */
  public getName(): string {
    return this.config.name;
  }
  
  /** Получение зоны коллизии героя */
  public getCollisionZone(): number {
    return this.config.collisionZone;
  }
  
  /**
   * Получение полоски здоровья героя
   */
  public getHealthBar(): HeroHealthBar {
    return this.healthBar;
  }

  // ==================================================================================
  // СИСТЕМА ПОЛУЧЕНИЯ УРОНА И СОСТОЯНИЯ (Микрошаг 2.5.3)
  // ==================================================================================

  // Флаг отравления (для способности voul)
  private poisonTimer: number = 0;

  /**
   * Получение урона героем
   * Уменьшает current-health в heroStore и обновляет полоски здоровья
   * Обрабатывает пассивные способности героя при получении урона
   * 
   * @param damage количество урона
   * @param attacker крип, который наносит урон (для пассивных способностей)
   */
  public takeDamage(damage: number, attacker?: any): void {
    const currentHealth = this.getHealth();
    const newHealth = Math.max(0, currentHealth - damage);
    this.setHealth(newHealth);
    
    // Обрабатываем пассивные способности при получении урона
    if (attacker) {
      try {
        const abilityResults = heroAbilitiesManager.handleTakeDamage(this, attacker, damage);
        
        // ОПТИМИЗАЦИЯ: Логируем только на десктопе и только при наличии результатов
        if (abilityResults.length > 0) {
          // Проверяем, убила ли какая-то пассивная способность крипа
          const killedCreep = abilityResults.find(r => r.creepKilled);
          if (killedCreep && (this as any).onCreepKilledByAbility) {
            (this as any).onCreepKilledByAbility(attacker);
          }
        }
      } catch (error) {
        // Логируем ошибки только на десктопе
        const IS_MOBILE = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (!IS_MOBILE) {
          console.warn('⚠️ Ошибка при обработке пассивных способностей:', error);
        }
      }
    }
  }

  /**
   * Получение урона по мане (способность satyr - manaburn)
   * Уменьшает current-mana in heroStore
   * 
   * @param damage количество урона по мане
   */
  public takeManaburn(damage: number): void {
    const currentMana = this.getMana(); 
    const newMana = Math.max(0, currentMana - damage);
    this.setMana(newMana);
  }

  /**
   * Применение отравления (способность voul - poison)
   * Устанавливает флаг отравления на указанное время
   * При отравлении БЛОКИРУЕТСЯ регенерация здоровья и маны
   * 
   * @param duration длительность отравления в миллисекундах
   */
  public applyPoison(duration: number = 1000): void {
    // Снимаем предыдущее отравление, если есть
    this.removePoison();
    
    // Блокируем восстановление здоровья
    this.isHealthRegenBlocked = true;
    
    // Устанавливаем таймер на снятие отравления
    this.poisonTimer = setTimeout(() => {
      this.isHealthRegenBlocked = false;
      this.poisonTimer = 0;
    }, duration) as unknown as number;
  }

  /**
   * Проверка жив ли герой
   * 
   * @returns true если здоровье больше 0
   */
  public isAlive(): boolean {
    const heroStore = useHeroStore.getState();
    if (!heroStore.stats) return true; // Считаем живым если нет данных
    return heroStore.stats["current-health"] > 0;
  }

  /**
   * Проверка отравлен ли герой
   * 
   * @returns true если активен эффект отравления
   */
  public isPoisoned(): boolean {
    return this.poisonTimer > 0;
  }

  /**
   * Получение текущего здоровья из heroStore
   * 
   * @returns текущее здоровье героя
   */
  public getCurrentHealth(): number {
    const heroStore = useHeroStore.getState();
    if (!heroStore.stats) return 100; // Значение по умолчанию
    return heroStore.stats["current-health"];
  }

  /**
   * Получение текущей маны из heroStore
   * 
   * @returns текущая мана героя
   */
  public getCurrentMana(): number {
    const heroStore = useHeroStore.getState();
    if (!heroStore.stats) return 50; // Значение по умолчанию
    return heroStore.stats["current-mana"];
  }

  /**
   * Получение максимальной маны из heroStore
   * 
   * @returns максимальная мана героя
   */
  public getMaxMana(): number {
    const heroStore = useHeroStore.getState();
    if (!heroStore.stats) return 50; // Значение по умолчанию
    return heroStore.stats["max-mana"];
  }

  /**
   * Установка текущей маны в heroStore
   * 
   * @param amount новое значение текущей маны
   */
  public setCurrentMana(amount: number): void {
    const heroStore = useHeroStore.getState();
    if (!heroStore.stats) return;
    
    const maxMana = heroStore.stats["max-mana"];
    const newMana = Math.max(0, Math.min(maxMana, amount));
    
    // Обновляем статистики в heroStore
    heroStore.updateStat("current-mana", newMana);
    

  }
  
  /**
   * Очистка ресурсов героя
   */
  public destroy(): void {
    // Очищаем таймер отравления
    if (this.poisonTimer > 0) {
      clearTimeout(this.poisonTimer);
      this.poisonTimer = 0;
    }
    
    // Останавливаем все звуки героя
    this.stopRunSound();
    
    // Очищаем полоски здоровья
    if (this.healthBar) {
      this.healthBar.destroy();
    }
    
    // Вызываем родительский метод destroy
    super.destroy();
  }

  // ==================================================================================
  // СИСТЕМА УПРАВЛЕНИЯ МАНОЙ (Микрошаг 2.5.4 Часть 2)
  // ==================================================================================

  /**
   * Трата маны на атаку
   * Уменьшает current-mana in heroStore на указанное количество
   * 
   * @param amount количество маны для траты
   */
  public spendMana(amount: number): boolean {
    const currentMana = this.getCurrentMana();
    if (currentMana >= amount) {
      const newMana = Math.max(0, currentMana - amount);
      this.setCurrentMana(newMana);
      return true;
    }
    return false;
  }

  /**
   * Проверяет есть ли достаточно маны для атаки
   * 
   * @param manaCost стоимость атаки в мане
   * @returns true если хватает маны
   */
  public canAttack(manaCost: number = 1): boolean {
    const currentMana = this.getCurrentMana();
    return currentMana >= manaCost;
  }

  // ==================================================================================
  // СИСТЕМА РЕГЕНЕРАЦИИ (Микрошаг 2.5.4 Часть 3)
  // ==================================================================================

  /**
   * Основной метод обновления регенерации (вызывается каждый кадр из GameController)
   * 
   * @param deltaTime время с последнего кадра в миллисекундах
   */
  public updateRegeneration(deltaTime: number): void {
    if (!this.isRegenerationActive()) {
      return; // Регенерация заблокирована (например, отравлением)
    }
    
    // Обновляем регенерацию здоровья и маны
    this.regenerateHealth(deltaTime);
    this.regenerateMana(deltaTime);
  }

  /**
   * Восстановление здоровья героя со временем
   * Формула из старого проекта: health += healthRegen * deltaTime / 1000
   * 
   * @param deltaTime время с последнего кадра в миллисекундах
   */
  private regenerateHealth(deltaTime: number): void {
    const heroStats = useHeroStore.getState().stats;
    if (!heroStats) return;
    
    const currentHealth = heroStats["current-health"];
    const maxHealth = heroStats["max-health"];
    const healthRegen = heroStats["health-regen"];
    
    // Восстанавливаем здоровье только если оно не полное
    if (currentHealth < maxHealth && healthRegen > 0) {
      const healthGain = healthRegen * deltaTime / 1000; // В секунду
      const newHealth = Math.min(maxHealth, currentHealth + healthGain);
      
      useHeroStore.getState().updateStat("current-health", newHealth);
    }
  }

  /**
   * Восстановление маны героя со временем
   * Формула из старого проекта: energy += energyRegen * deltaTime / 1000
   * 
   * @param deltaTime время с последнего кадра в миллисекундах
   */
  private regenerateMana(deltaTime: number): void {
    const heroStats = useHeroStore.getState().stats;
    if (!heroStats) return;
    
    const currentMana = heroStats["current-mana"];
    const maxMana = heroStats["max-mana"];
    const manaRegen = heroStats["mana-regen"];
    
    // Восстанавливаем ману только если она не полная
    if (currentMana < maxMana && manaRegen > 0) {
      const manaGain = manaRegen * deltaTime / 1000; // В секунду
      const newMana = Math.min(maxMana, currentMana + manaGain);
      
      useHeroStore.getState().updateStat("current-mana", newMana);
    }
  }

  /**
   * Проверяет активна ли регенерация
   * Регенерация блокируется при отравлении (poison)
   * 
   * @returns true если регенерация разрешена
   */
  private isRegenerationActive(): boolean {
    return !this.isPoisoned();
  }

  // ==================================================================================
  // СИСТЕМА ВАМПИРИЗМА (Микрошаг 2.5.4 Часть 4)
  // ==================================================================================

  /**
   * Применение вампиризма после успешной атаки
   * Восстанавливает здоровье героя равное значению vampirism из stats
   * Формула из старого проекта: health = Math.min(health + vampirism, maxHealth)
   */
  public applyVampirism(): void {
    const heroStats = useHeroStore.getState().stats;
    if (!heroStats) return;
    
    const currentHealth = heroStats["current-health"];
    const maxHealth = heroStats["max-health"];
    const vampirism = heroStats["vampirism"];
    
    // Восстанавливаем здоровье только если vampirism > 0
    if (vampirism > 0) {
      const newHealth = Math.min(currentHealth + vampirism, maxHealth);
      const healAmount = newHealth - currentHealth;
      
      if (healAmount > 0) {
        useHeroStore.getState().updateStat("current-health", newHealth);
    
      }
    }
  }

  public removePoison(): void {
    if (this.poisonTimer > 0) {
      clearTimeout(this.poisonTimer);
      this.poisonTimer = 0;
    }
  }

  public setHealth(health: number): void {
    const heroStore = useHeroStore.getState();
    if (!heroStore.stats) return;
    
    heroStore.updateStat("current-health", health);
  }

  public getHealth(): number {
    const heroStore = useHeroStore.getState();
    if (!heroStore.stats) return 100; // Значение по умолчанию
    return heroStore.stats["current-health"];
  }

  public setMana(mana: number): void {
    const heroStore = useHeroStore.getState();
    if (!heroStore.stats) return;
    
    heroStore.updateStat("current-mana", mana);
  }

  public getMana(): number {
    const heroStore = useHeroStore.getState();
    if (!heroStore.stats) return 50; // Значение по умолчанию
    return heroStore.stats["current-mana"];
  }

  public isHealthRegenBlocked: boolean = false;

  public performVampirism(damageDealt: number): void {
    const heroStore = useHeroStore.getState();
    if (!heroStore.stats) return;
    
    const vampirismPercent = heroStore.stats.vampirism || 0;
    if (vampirismPercent <= 0) return;
    
    const healAmount = (damageDealt * vampirismPercent) / 100;
    const currentHealth = this.getHealth();
    const maxHealth = heroStore.stats['max-health'] || 1000;
    const newHealth = Math.min(maxHealth, currentHealth + healAmount);
    
    this.setHealth(newHealth);
  }
}