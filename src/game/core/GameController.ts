/**
 * Контроллер игры - управляет взаимодействием героя с крипами
 * 
 * Логика по новым требованиям:
 * 1. Герой изначально бежит (фон движется), крип движется навстречу
 * 2. По клику герой атакует - фон и крип останавливаются на время анимации атаки
 * 3. После завершения анимации атаки - фон и крип возобновляют движение
 * 4. При коллизии - оба переходят в атаку, мир останавливается
 * 5. После смерти крипа - пауза 3 сек, спавн нового крипа
 * 6. 🔥 НОВОЕ: Динамическое количество крипов на уровне из levelsConfig.ts
 * 7. ✨ ОБНОВЛЕНО: Новая система предзагрузки текстур + on-demand создание крипов для iOS оптимизации
 * 8. ⭐ НОВОЕ: Стартовый экран с надписью "Нажмите, чтобы начать путешествие..."
 */

import { Application } from 'pixi.js';
import { Hero } from '../entities/Hero';
import { Creep } from '../entities/Creep';
import { GAME_CONFIG } from '../config/GameConfig';
import { GameState } from './GameStates';
import { EntityState } from './GameEntity';
import { getAllCreepTypes, getCreepConfig } from '../config/creepsConfig';
import { useHeroStore } from '../../contexts/heroStore';
import type { HeroStats } from '../../shared/types';
import { DamageEffectManager } from '../components/DamageEffect';
import { CoinAnimationManager } from '../components/CoinAnimation';
import { LevelDisplaySystem } from '../components/LevelDisplaySystem';
import { StartScreen } from '../components/StartScreen';
import { TEST_USER_ID, TEST_HERO_ID, API_BASE_URL } from '../../shared/constants';
import { heroLevelSystem } from '../systems/HeroLevelSystem';
import { getLevelConfig, getAvailableCreepsForLevel, getBossForLevel } from '../config/levelsConfig';
import { audioManager } from '../managers/SoundManager';
import { TextureWarmupManager } from '../managers/TextureWarmupManager';
import { heroAbilitiesManager, type AbilityResult } from '../systems/HeroAbilities';
import { DamageNumberManager } from '../components/DamageNumbers';

/**
 * Конфигурация игры
 */
interface GameConfig {
  /** Время паузы после смерти крипа (мс) */
  spawnDelay: number; // GAME_CONFIG.GAME_MECHANICS.combat.spawnDelay
  
  /** Скорость движения фона/крипов */
  moveSpeed: number; // GAME_CONFIG.GAME_MECHANICS.movement.baseSpeed
  
  /** Энергия героя для атаки */
  attackEnergyCost: number;
  
  /** Зона коллизии (доля ширины героя) */
  collisionZoneRatio?: number; // GAME_CONFIG.GAME_MECHANICS.collision.detectionZone
}

/**
 * Контроллер игрового цикла
 */
export class GameController {
  private app: Application;
  private hero: Hero;
  private currentCreep: Creep | null = null;
  private currentState: GameState = GameState.WAITING_FOR_START; // 🔥 ИЗМЕНЕНО: Начинаем с ожидания клика
  
  // ======= СИСТЕМА ПАУЗЫ =======
  private isGameRunning: boolean = true; // Флаг работы игры
  private isPausedByUser: boolean = false; // Флаг паузы пользователем
  // ============================
  
  // 🔥 НОВОЕ: Защита от множественного создания
  private static activeControllers = new Set<GameController>();
  private isDestroyed: boolean = false;
  
  /**
   * 🔥 НОВЫЙ МЕТОД: Уничтожение всех активных контроллеров
   */
  private static destroyAllActiveControllers(): void {
    const controllers = Array.from(GameController.activeControllers);
    controllers.forEach(controller => {
      if (!controller.isDestroyed) {
        console.log('🧹 Уничтожаем существующий GameController');
        controller.destroy();
      }
    });
    GameController.activeControllers.clear();
  }
  
  // ======= СИСТЕМА ЗОЛОТА =======
  private sessionGoldEarned: number = 0; // Золото заработанное за текущую сессию
  // ==============================
  
  // ======= 🔥 НОВАЯ СИСТЕМА УРОВНЕЙ (динамическое количество крипов) =======
  private currentLevelProgress: number = 0;  // Убито крипов на текущем уровне (0 до totalCreepsOnLevel)
  private isCurrentlyBoss: boolean = false;  // Сейчас идет босс
  
  // 🔥 ДИНАМИЧЕСКИЕ ПАРАМЕТРЫ: Рассчитываются из levelsConfig.ts
  private totalCreepsOnLevel: number = 10;    // Общее количество крипов на уровне (обычные + босс)
  private normalCreepsCount: number = 9;      // Количество обычных крипов до босса
  
  // УДАЛЕНЫ старые константы:
  // private readonly CREEPS_PER_LEVEL = 10;
  // private readonly NORMAL_CREEPS_COUNT = 9;
  // =========================================
  
  // ======= НАСТРОЙКА КРИПОВ =======
  // Измените эту переменную чтобы выбрать конкретного крипа:
  // 'random' - случайные крипы
  // 'direCreep', 'wolf', 'satyr', 'shishka', 'voul', 'medved' - конкретный крип
  // РЕКОМЕНДУЕТСЯ: Используйте testCreepMode в TextureWarmupManager для тестирования!
  private selectedCreepType: string = 'random'; // <-- ИЗМЕНИТЕ ЗДЕСЬ
  // ================================
  
  // Доступные типы крипов для рандомного выбора (используется только если selectedCreepType = 'random')
  private availableCreepTypes: string[] = getAllCreepTypes();
  
  // Конфигурация
  private config: GameConfig = {
    spawnDelay: GAME_CONFIG.GAME_MECHANICS.combat.spawnDelay,
    moveSpeed: GAME_CONFIG.GAME_MECHANICS.movement.baseSpeed,
    attackEnergyCost: 1,
    collisionZoneRatio: GAME_CONFIG.GAME_MECHANICS.collision.detectionZone,
  };
  
  // Таймеры и флаги
  private spawnTimer: number = 0;
  private isSpawnBlocked: boolean = false;
  
  // Флаг для предотвращения немедленной проверки смерти при создании героя
  private initializationFrames: number = 0;
  private initializationTimer: number = 0; // Таймер для 2-секундной паузы в начале игры
  private readonly INITIALIZATION_DURATION = 2000; // 2 секунды в миллисекундах
  
  // Менеджер визуальных эффектов урона
  private damageEffectManager: DamageEffectManager;
  
  // Менеджер чисел урона
  private damageNumberManager: DamageNumberManager;
  
  // Менеджер анимации монет
  private coinAnimationManager: CoinAnimationManager;
  
  // Система отображения уровня
  private levelDisplaySystem: LevelDisplaySystem;
  
  // 🔥 НОВОЕ: Стартовый экран с надписью
  private startScreen!: StartScreen;
  
  // Менеджер прогрева текстур
  public textureWarmupManager: TextureWarmupManager;
  
  /**
   * Конструктор контроллера
   */
  constructor(app: Application, hero: Hero) {
    // 🔥 ЗАЩИТА: Очищаем существующие контроллеры перед созданием нового
    GameController.destroyAllActiveControllers();
    
    this.app = app;
    this.hero = hero;
    
    // 🔥 НОВОЕ: Регистрируем этот контроллер как активный
    GameController.activeControllers.add(this);
    
    // 🔥 НОВОЕ: Инициализируем параметры уровня
    this.initializeLevelParameters();
    
    // Устанавливаем правильную скорость движения сразу при инициализации
    this.updateMoveSpeed();
    
    // Настраиваем интерактивность канваса для кликов
    this.setupInteractivity();
    
    // Настраиваем callback для возобновления движения крипа
    this.setupHeroCallbacks();
    
    // Добавляем полоски здоровья на сцену (поверх всех элементов)
    this.setupHealthBars();
    
    // Инициализируем менеджер эффектов урона
    this.damageEffectManager = new DamageEffectManager(this.app);
    
    // Инициализируем менеджер чисел урона
    this.damageNumberManager = new DamageNumberManager(this.app);
    
    // Устанавливаем callback для героя чтобы он мог уведомить нас о смерти крипа от пассивной способности
    (this.hero as any).onCreepKilledByAbility = (killedCreep: any) => {
      console.log(`💀 Крип ${killedCreep.getCreepType()} убит пассивной способностью`);
      
      // Проверяем что это именно наш текущий крип
      if (this.currentCreep === killedCreep) {
        // Вызываем ту же логику что и при обычной смерти крипа
        this.onCreepKilled();
      }
    };
    
    // Инициализируем менеджер анимации монет
    this.coinAnimationManager = new CoinAnimationManager(this.app);
    
    // Инициализируем систему отображения уровня
    this.levelDisplaySystem = new LevelDisplaySystem(this.app);
    
    // Устанавливаем текущего героя для отображения его иконки
    this.levelDisplaySystem.setCurrentHero(this.hero.getHeroType());
    
    // 🔥 НОВОЕ: Инициализируем стартовый экран
    this.startScreen = new StartScreen(this.app);
    
    // Убеждаемся что сцена сортирует по zIndex для правильного отображения поверх health bars
    this.app.stage.sortableChildren = true;
    this.app.stage.addChild(this.startScreen);
    
    // Инициализируем менеджер прогрева текстур
    this.textureWarmupManager = new TextureWarmupManager(this.app);
    
    // Добавляем ссылку на себя в app для доступа из других компонентов
    (this.app as any).gameController = this;
    
    // ИСПРАВЛЕНИЕ: Принудительно восстанавливаем здоровье героя СИНХРОННО при создании
    // Это предотвращает немедленную смерть героя при входе в игру
    this.restoreHeroToFullHealth();
    
    // Обновляем все характеристики героя с сервера при входе в игру
    // Это асинхронная операция, но не блокирует создание контроллера
    this.refreshHeroStats().catch(error => {
      console.warn('⚠️ Не удалось обновить характеристики при инициализации:', error);
    });
    
    // 🔥 ИСПРАВЛЕНИЕ: Убираем показ значка уровня из конструктора - он появится при начале игры
    // this.showLevelIcon();
    
    // Инициализируем звуковую систему
    this.initializeAudioSystem();
  }
  
  /**
   * 🔥 НОВЫЙ МЕТОД: Инициализация параметров уровня
   * Рассчитывает количество крипов на основе текущего уровня из levelsConfig
   */
  private initializeLevelParameters(): void {
    try {
      const currentLevel = heroLevelSystem.getCurrentLevel();
      const levelConfig = getLevelConfig(currentLevel);
      const normalCreeps = getAvailableCreepsForLevel(currentLevel);
      
      // Общее количество крипов = количество обычных крипов из конфигурации + босс
      this.totalCreepsOnLevel = levelConfig.creepCount + 1; // +1 за босса
      
      // Количество обычных крипов = из конфигурации уровня
      this.normalCreepsCount = levelConfig.creepCount;
      
      console.log(`🎯 Инициализация уровня ${currentLevel}: ${this.normalCreepsCount} обычных крипов + 1 босс = ${this.totalCreepsOnLevel} всего`);
      
    } catch (error) {
      console.error(`❌ Ошибка инициализации параметров уровня:`, error);
      // Fallback к старым значениям
      this.totalCreepsOnLevel = 10;
      this.normalCreepsCount = 9;
    }
  }

  /**
   * 🔥 НОВЫЙ МЕТОД: Обновление параметров уровня при переходе на новый уровень
   * Вызывается при повышении уровня
   */
  private updateLevelParameters(newLevel: number): void {
    try {
      const levelConfig = getLevelConfig(newLevel);
      const normalCreeps = getAvailableCreepsForLevel(newLevel);
      
      // Обновляем параметры для нового уровня
      this.totalCreepsOnLevel = levelConfig.creepCount + 1; // +1 за босса
      this.normalCreepsCount = levelConfig.creepCount;
      
      console.log(`🆙 Переход на уровень ${newLevel}: ${this.normalCreepsCount} обычных крипов + 1 босс = ${this.totalCreepsOnLevel} всего`);
      
      // Также обновляем параметры в системе отображения уровня
      this.levelDisplaySystem.updateLevelParameters(newLevel);
      
    } catch (error) {
      console.error(`❌ Ошибка обновления параметров уровня ${newLevel}:`, error);
      // Не изменяем параметры если произошла ошибка
    }
  }

  /**
   * Инициализация звуковой системы
   */
  private async initializeAudioSystem(): Promise<void> {
    try {
      // Проверяем, не инициализирована ли уже звуковая система
      if (audioManager.isReady()) {
        console.log('🎵 Звуковая система уже инициализирована, пропускаем повторную инициализацию');
        return;
      }
      
      await audioManager.initialize();
      console.log('🎵 Звуковая система инициализирована в GameController');
    } catch (error) {
      console.error('❌ Ошибка инициализации звуковой системы в GameController:', error);
    }
  }
  
  /**
   * Настройка интерактивности канваса
   */
  private setupInteractivity(): void {
    // Делаем весь stage интерактивным для кликов
    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = this.app.screen;
    
    // Слушаем клики по всему канвасу
    this.app.stage.on('pointerdown', this.onCanvasClick.bind(this));
  }

  /**
   * Настройка callbacks героя для синхронизации фона и крипа
   */
  private setupHeroCallbacks(): void {
    // Устанавливаем callback для отслеживания движения героя
    this.hero.setMovementCallback((isMoving: boolean) => {
      // Синхронизируем движение крипа с фоном
      this.syncWorldMovement(isMoving);
    });
    
    // Устанавливаем callback для создания эффектов урона герою
    this.hero.setDamageCallback((x: number, y: number) => {
      this.damageEffectManager.createHeroDamageEffect(x, y);
    });
  }
  
  /**
   * Настройка полосок здоровья на сцене
   */
  private setupHealthBars(): void {
    // Активируем сортировку по zIndex на главной сцене
    this.app.stage.sortableChildren = true;
    
    // Получаем полоски здоровья от героя
    const healthBar = this.hero.getHealthBar();
    
    // Добавляем полоски напрямую на сцену (поверх всех элементов)
    this.app.stage.addChild(healthBar);
  }

  /**
   * Синхронизация движения всего мира (фон + крип)
   */
  private syncWorldMovement(isMoving: boolean): void {
    // Управляем фоном через app
    if ((this.app as any).setBackgroundMoving) {
      (this.app as any).setBackgroundMoving(isMoving);
    }
    
    // Синхронизируем крипа с фоном
    // ИСПРАВЛЕНИЕ: Во время боя (FIGHTING) крип должен стоять, независимо от состояния героя
    if (this.currentCreep && !this.currentCreep.getIsDead()) {
      if (this.currentState === GameState.FIGHTING) {
        // Во время боя крип всегда неподвижен
        this.currentCreep.setMoveSpeed(0);
      } else {
        // Вне боя крип синхронизируется с фоном/героем
        if (isMoving) {
          this.currentCreep.setMoveSpeed(this.config.moveSpeed);
        } else {
          this.currentCreep.setMoveSpeed(0);
        }
      }
    }
  }

  /**
   * Обработка кликов по канвасу - атака героя или начало игры
   */
  private onCanvasClick(): void {
    // Уведомляем героя о пользовательском взаимодействии (для разблокировки звуков в браузере)
    this.hero.onUserInteraction();
    
    // Уведомляем AudioManager о пользовательском взаимодействии (для разблокировки звуков в браузере)
    audioManager.onUserInteraction();
    
    // СИСТЕМА ПАУЗЫ: Блокируем клики если игра на паузе
    if (!this.isGameRunning || this.isPausedByUser) {
      return;
    }
    
    // 🔥 НОВОЕ: Обработка клика в состоянии ожидания старта
    if (this.currentState === GameState.WAITING_FOR_START) {
      this.startGameFromWaiting();
      return;
    }
    
    // Герой может атаковать ТОЛЬКО во время боя с крипом
    if (this.currentState === GameState.FIGHTING) {
      this.heroAttack();
    }
  }
  
  /**
   * 🔥 НОВЫЙ МЕТОД: Начать игру из состояния ожидания
   */
  private startGameFromWaiting(): void {
    console.log('🎮 Начинаем игру! Переход из WAITING_FOR_START в INITIALIZATION');
    
    // Скрываем стартовый экран
    this.startScreen.hide();
    
    // Переходим в состояние инициализации на 2 секунды
    this.currentState = GameState.INITIALIZATION;
    this.initializationTimer = 0;
    
    // Герой стоит в idle анимации (остается в той же позиции)
    this.hero.setIdle();
    
    // 🔥 НОВОЕ: Показываем значок уровня при реальном начале игры
    this.showLevelIcon();
    
    // Запускаем предварительный прогрев текстур
    this.preWarmupCurrentLevel();
  }
  
  /**
   * Атака героя - новая логика с остановкой мира
   */
  private heroAttack(): void {
    // ЧАСТЬ 2: Проверяем есть ли мана для атаки ПЕРЕД запуском анимации
    const manaCost = 1; // Как в старом проекте - 1 мана за атаку
    if (!this.hero.canAttack(manaCost)) {
      // Сбрасываем ману до нуля чтобы игрок понял что нужно ждать восстановления
      this.hero.setCurrentMana(0);
      // Показываем визуальное предупреждение над полосками героя
      this.hero.getHealthBar().showManaWarning();
      return; // Блокируем атаку и анимацию если нет маны
    }

    // Герой переходит в режим атаки (это автоматически остановит фон и крип через callback)
    this.hero.setAttacking();
  }
  
  /**
   * Нанесение урона крипу (вызывается при клике или автоматической атаке)
   */
  public dealDamageToCreep(): void {
    // 🔥 ЗАЩИТА: Не наносим урон если контроллер уничтожен
    if (this.isDestroyed) return;
    
    if (!this.currentCreep || this.currentCreep.getIsDead()) {
      return;
    }
    
    // Проверяем, находится ли крип в зоне коллизии
    if (this.currentState === GameState.FIGHTING) {
      // ЧАСТЬ 2: Тратим ману на атаку (проверка уже сделана в heroAttack())
      const manaCost = 1; // Как в старом проекте - 1 мана за атаку
      this.hero.spendMana(manaCost);
      
      // ЧАСТЬ 1: Получаем урон героя (уже работает корректно)
      const heroDamage = this.getHeroDamage();
      
      // Наносим урон крипу
      const creepDied = this.currentCreep.takeDamage(heroDamage);
      
      // Обрабатываем пассивные способности при нанесении урона
      let abilityKilledCreep = false;
      try {
        const abilityResults = heroAbilitiesManager.handleDealDamage(this.hero, this.currentCreep, heroDamage);
        
        // Проверяем, убила ли какая-то способность крипа
        const killedCreep = abilityResults.find(r => r.creepKilled);
        if (killedCreep) {
          abilityKilledCreep = true;
        }
        
        // ОПТИМИЗАЦИЯ: Логируем только на десктопе
        if (abilityResults.length > 0) {
          const IS_MOBILE = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          if (!IS_MOBILE) {
            console.log(`⚔️ Сработали способности при атаке:`, 
              abilityResults.map((r: AbilityResult) => r.effects?.map((e: any) => e.description).join(', ')).join('; '));
          }
        }
      } catch (error) {
        const IS_MOBILE = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (!IS_MOBILE) {
          console.warn('⚠️ Ошибка при обработке способностей атаки:', error);
        }
      }
      
      // ЧАСТЬ 4: Применяем вампиризм после успешной атаки
      this.hero.applyVampirism();
      
      // Создаем визуальный эффект урона в центре крипа
      this.damageEffectManager.createCreepDamageEffect(
        this.currentCreep.x,
        this.currentCreep.y
      );
      
      // Создаем число урона над healthbar крипа
      this.damageNumberManager.createCreepDamageNumberAboveHealthBar(
        heroDamage,
        this.currentCreep
      );
      
      if (creepDied || abilityKilledCreep) {
        // Обрабатываем пассивные способности при убийстве крипа
        try {
          const abilityResults = heroAbilitiesManager.handleCreepKilled(this.hero, this.currentCreep, heroDamage);
          // ОПТИМИЗАЦИЯ: Логируем только на десктопе
          if (abilityResults.length > 0) {
            const IS_MOBILE = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            if (!IS_MOBILE) {
              console.log(`💀 Сработали способности при убийстве крипа:`, 
                abilityResults.map((r: AbilityResult) => r.effects?.map((e: any) => e.description).join(', ')).join('; '));
            }
          }
        } catch (error) {
          const IS_MOBILE = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          if (!IS_MOBILE) {
            console.warn('⚠️ Ошибка при обработке способностей убийства:', error);
          }
        }
        
        this.onCreepKilled();
      }
      
      // Герой автоматически вернется к бегу через callback в Hero.ts
      // Это запустит синхронизацию мира через syncWorldMovement
    }
  }
  
  /**
   * Обработка убийства крипа (вызывается когда здоровье крипа достигает 0)
   */
  private async onCreepKilled(): Promise<void> {
    if (!this.currentCreep) return;
    
    // СИСТЕМА ЗОЛОТА: Награждаем игрока золотом за убийство крипа (только логика)
    const creepType = this.currentCreep.getCreepType();
    const creepConfig = getCreepConfig(creepType);
    if (creepConfig) {
      // Начисляем золото (анимация уже показана через callback в takeDamage)
      await this.awardGoldForKill(creepConfig.goldReward);
    }
    
    // ======= СИСТЕМА УРОВНЕЙ: Подсчет прогресса =======
    const currentLevel = heroLevelSystem.getCurrentLevel();
    
    console.log(`💀 Убит крип: ${creepType} ${this.isCurrentlyBoss ? '(БОСС)' : '(обычный)'}`);
    console.log(`📊 ДО увеличения: прогресс ${this.currentLevelProgress}/${this.totalCreepsOnLevel}, normalCount: ${this.normalCreepsCount}`);
    
    this.currentLevelProgress++;
    
    console.log(`📊 ПОСЛЕ увеличения: прогресс ${this.currentLevelProgress}/${this.totalCreepsOnLevel}`);
    
    // Обновляем прогресс в HUD
    this.updateLevelProgress();
    
    if (this.isCurrentlyBoss) {
      // Убили босса - уровень завершен!
      console.log(`🏆 УРОВЕНЬ ${currentLevel} ЗАВЕРШЕН! Убили босса ${creepType}`);
      await this.onLevelComplete();
    } else {
      console.log(`➡️ Продолжаем уровень ${currentLevel}. Следующий крип...`);
    }
    // =================================================
    
    // Восстанавливаем скорость движения крипа чтобы он продолжал двигаться во время смерти
    this.currentCreep.setMoveSpeed(this.config.moveSpeed);
    
    // Анимация смерти уже запущена в takeDamage()
    // Просто слушаем завершение анимации смерти
    this.currentCreep.on('death-complete', this.onCreepDeathComplete.bind(this));
    
    // Герой возвращается к бегу
    this.hero.setMoving();
    
    // Переходим в состояние ожидания
    this.currentState = GameState.WAITING;
    this.spawnTimer = 0;
    this.isSpawnBlocked = true;
  }
  
  /**
   * Завершение анимации смерти крипа
   */
  private onCreepDeathComplete(): void {
    this.cleanupCreep();
  }
  
  /**
   * 🔥 ОБНОВЛЕННЫЙ МЕТОД: Завершение уровня
   * Теперь учитывает динамическое количество крипов
   */
  private async onLevelComplete(): Promise<void> {
    // Сохраняем старый уровень ДО повышения
    const oldLevel = heroLevelSystem.getCurrentLevel();
    
    console.log(`🚀 НАЧАЛО ЗАВЕРШЕНИЯ УРОВНЯ ${oldLevel}`);
    console.log(`📊 Финальный прогресс: ${this.currentLevelProgress}/${this.totalCreepsOnLevel}`);
    
    // Повышаем уровень героя (теперь асинхронно)
    await heroLevelSystem.levelUp();
    const newLevel = heroLevelSystem.getCurrentLevel();
    
    console.log(`🆙 Переход с уровня ${oldLevel} на уровень ${newLevel}`);
    
    // 🔥 НОВОЕ: Обновляем параметры для нового уровня
    this.updateLevelParameters(newLevel);
    
    // Сбрасываем прогресс уровня
    console.log(`🔄 СБРОС ПРОГРЕССА: ${this.currentLevelProgress} -> 0, boss: ${this.isCurrentlyBoss} -> false`);
    this.currentLevelProgress = 0;
    this.isCurrentlyBoss = false;
    
    console.log(`📈 Новые параметры уровня ${newLevel}: всего ${this.totalCreepsOnLevel}, обычных ${this.normalCreepsCount}`);
    
    // Плавный переход к новому уровню (скрываем прогресс-бар, показываем новый значок)
    this.levelDisplaySystem.transitionToNewLevel(newLevel, oldLevel);
    
    // Запускаем прогрев текстур для нового уровня
    this.textureWarmupManager.warmupLevel(newLevel).then(() => {
      console.log(`✅ Прогрев нового уровня ${newLevel} завершен`);
    }).catch(error => {
      console.warn(`⚠️ Ошибка прогрева нового уровня ${newLevel}:`, error);
    });
    
    // TODO: Показать модальное окно завершения уровня (в следующих микрошагах)
  }
  
  /**
   * Запуск игрового цикла
   */
  public startGameLoop(): void {

    
    // 🔥 НОВАЯ ЛОГИКА: Если в состоянии WAITING_FOR_START - показываем стартовый экран
    if (this.currentState === GameState.WAITING_FOR_START) {
      
      this.hero.setIdle(); // Герой стоит в idle анимации в своей обычной позиции
      this.startScreen.show(); // Показываем стартовый экран с надписью
      
      // НЕ запускаем прогрев текстур и НЕ создаем крипов в этом состоянии
      console.log('⏳ Ожидаем клик пользователя для начала путешествия...');
      
    } 
    // НОВАЯ ЛОГИКА: Если в состоянии INITIALIZATION - герой стоит в idle
    else if (this.currentState === GameState.INITIALIZATION) {
      
      this.hero.setIdle(); // Герой стоит в idle анимации
      this.initializationTimer = 0; // Сбрасываем таймер
      
      // Запускаем предварительный прогрев текстур
      this.preWarmupCurrentLevel();
      
      // НЕ создаем крипа в состоянии INITIALIZATION
    } else {
      // Если игра уже была запущена (например, после паузы)
      this.hero.setMoving();
      this.createNewCreep().catch(console.error);
    }
  }
  
  /**
   * Предварительный прогрев текстур для текущего уровня
   */
  private async preWarmupCurrentLevel(): Promise<void> {
    try {
      const currentLevel = heroLevelSystem.getCurrentLevel();
      console.log(`🔥 Предварительный прогрев текстур для уровня ${currentLevel}...`);
      
      // Запускаем прогрев асинхронно, чтобы не блокировать игру
      this.textureWarmupManager.warmupLevel(currentLevel).then(() => {
        console.log(`✅ Предварительный прогрев уровня ${currentLevel} завершен`);
      }).catch(error => {
        console.warn(`⚠️ Ошибка предварительного прогрева уровня ${currentLevel}:`, error);
      });
      
    } catch (error) {
      console.warn('⚠️ Ошибка при запуске предварительного прогрева:', error);
    }
  }
  
  /**
   * Обновление игрового цикла (вызывается каждый кадр)
   */
  public update(deltaTime: number): void {
    // 🔥 ЗАЩИТА: Не обновляем уничтоженный контроллер
    if (this.isDestroyed) return;
    
    // СИСТЕМА ПАУЗЫ: Пропускаем обновление если игра на паузе
    if (!this.isGameRunning || this.isPausedByUser) {
      return; // Останавливаем игровой цикл при паузе
    }
    
    // 🔥 НОВАЯ ЛОГИКА: Обработка состояния WAITING_FOR_START
    if (this.currentState === GameState.WAITING_FOR_START) {
      // В состоянии ожидания обновляем только героя и стартовый экран
      if (this.hero) {
        this.hero.updateRegeneration(deltaTime);
        this.hero.update(deltaTime);
      }
      
      // 🔥 ИСПРАВЛЕНИЕ: НЕ обновляем систему отображения уровня в состоянии ожидания
      // this.levelDisplaySystem.update(deltaTime);
      
      return; // Выходим из update, не обрабатываем остальную логику
    }
    
    // НОВАЯ ЛОГИКА: Обработка состояния INITIALIZATION
    if (this.currentState === GameState.INITIALIZATION) {
      this.initializationTimer += deltaTime;
      
      if (this.initializationTimer >= this.INITIALIZATION_DURATION) {

        this.currentState = GameState.RUNNING;
        this.hero.setMoving(); // Герой начинает бежать
        this.createNewCreep().catch(console.error); // Создаем первого крипа
      }
      
             // В состоянии INITIALIZATION обновляем только героя и UI системы, но не крипов
       if (this.hero) {
         this.hero.updateRegeneration(deltaTime);
         // ИСПРАВЛЕНО: Также обновляем анимации героя в состоянии INITIALIZATION
         this.hero.update(deltaTime);
       }
       
       // Обновляем систему отображения уровня (значок уровня показывается в эти 2 секунды)
       this.levelDisplaySystem.update(deltaTime);
       
       return; // Выходим из update, не обрабатываем крипов и коллизии
    }
    
    // Отсчитываем кадры инициализации
    this.initializationFrames++;
    
    // ПРОВЕРКА СМЕРТИ ГЕРОЯ: Завершаем игру если здоровье равно 0
    // НО только после нескольких кадров инициализации, чтобы дать время на восстановление здоровья
    if (this.initializationFrames > 5 && this.hero && this.hero.getCurrentHealth() <= 0) {
      this.endGame(); // Завершаем игру при смерти героя
      return; // Останавливаем игровой цикл
    }
    
    // ЧАСТЬ 3: Обновляем регенерацию героя (здоровье и мана)
    if (this.hero) {
      this.hero.updateRegeneration(deltaTime);
    }
    
    // Обновляем таймер спавна если ждем
    if (this.currentState === GameState.WAITING) {
      this.updateSpawnTimer(deltaTime);
    }
    
    // Проверяем коллизии если крип есть и игра активна
    if (this.currentCreep && this.currentState !== GameState.WAITING) {
      this.checkCollisions();
    }
    
    // ИСПРАВЛЕНИЕ БАГА: Проверяем состояние героя после завершения атаки
    // Если герой в idle но еще в зоне боя - он должен остаться в idle для продолжения атак
    // Если герой в idle но НЕ в зоне боя - он должен начать бежать
    if (this.currentState === GameState.FIGHTING && 
        this.hero.getState() === EntityState.IDLE && 
        this.currentCreep && 
        !this.currentCreep.getIsDead()) {
      // Герой завершил атаку, но крип еще жив и они в коллизии
      // Оставляем героя в idle, чтобы игрок мог продолжать кликать
      // Ничего не делаем - герой остается в idle
    }
    
    // Обновляем крипа если он есть
    if (this.currentCreep) {
      this.currentCreep.updateCreep(deltaTime, this.hero);
    }
    
    // Обновляем все визуальные эффекты урона
    this.damageEffectManager.update(deltaTime);
    
    // Обновляем числа урона
    this.damageNumberManager.update(deltaTime);
    
    // Обновляем анимации монет
    this.coinAnimationManager.update(deltaTime);
    
    // Обновляем систему отображения уровня
    this.levelDisplaySystem.update(deltaTime);
  }
  
  /**
   * Обновление таймера спавна
   */
  private updateSpawnTimer(deltaTime: number): void {
    // Не обновляем таймер спавна в состоянии INITIALIZATION
    if (this.currentState === GameState.INITIALIZATION) {
      return;
    }
    
    this.spawnTimer += deltaTime;
    
    if (this.spawnTimer >= this.config.spawnDelay && this.isSpawnBlocked) {
      this.isSpawnBlocked = false;
      this.currentState = GameState.RUNNING;
      this.createNewCreep().catch(console.error);
    }
  }
  
  /**
   * Проверка коллизий между героем и крипом
   */
  private checkCollisions(): void {
    if (!this.currentCreep || this.currentCreep.getIsDead()) return;
    
    // Получаем границы объектов
    const heroBounds = this.hero.getBounds();
    const creepBounds = this.currentCreep.getBounds();
    
    // Получаем индивидуальные зоны коллизии крипа и героя
    const creepCollisionZone = this.currentCreep.getCollisionZone();
    const heroCollisionZone = this.hero.getCollisionZone();
    const baseCollisionZone = this.config.collisionZoneRatio ?? GAME_CONFIG.GAME_MECHANICS.collision.detectionZone;
    
    // Применяем множители зон коллизии героя и крипа
    const finalCollisionZone = baseCollisionZone * creepCollisionZone * heroCollisionZone;
    
    // Упрощенная проверка пересечения по X (как в старом проекте)
    const heroRight = heroBounds.x + heroBounds.width * finalCollisionZone;
    const creepLeft = creepBounds.x;
    const creepRight = creepBounds.x + creepBounds.width;
    
    const isColliding = (heroRight >= creepLeft && heroBounds.x <= creepRight);
    
    // Если началась коллизия
    if (isColliding && this.currentState === GameState.RUNNING) {
      this.startFighting();
    }
    
    // Если коллизия закончилась
    if (!isColliding && this.currentState === GameState.FIGHTING) {
      this.stopFighting();
    }
  }
  
  /**
   * Начало боя - коллизия обнаружена
   */
  private startFighting(): void {
    this.currentState = GameState.FIGHTING;
    
    // Останавливаем движение мира (фон и крип через синхронизацию)
    this.hero.setIdle(); // Это остановит фон и крип через syncWorldMovement
    
    if (this.currentCreep) {
      this.currentCreep.startAttack(); // Крип атакует
    }
  }
  
  /**
   * Конец боя - коллизия прекратилась
   */
  private stopFighting(): void {
    this.currentState = GameState.RUNNING;
    
    // Возобновляем движение мира (фон и крип через синхронизацию)
    this.hero.setMoving(); // Это запустит фон и крип через syncWorldMovement
  }
  
  /**
   * �� ОБНОВЛЕННЫЙ МЕТОД: Выбор типа крипа
   * Теперь использует динамическое количество крипов из levelsConfig
   */
  private getCreepType(): string {
    // ======= ПРОВЕРКА НАСТРОЙКИ РАЗРАБОТЧИКА =======
    // Если selectedCreepType установлен на конкретный тип (не 'random'), используем его
    if (this.selectedCreepType !== 'random') {
      console.log(`🧪 Режим разработчика: принудительно используем ${this.selectedCreepType}`);
      this.isCurrentlyBoss = false; // В режиме разработчика все крипы обычные
      return this.selectedCreepType;
    }
    // ==============================================
    
    // ======= 🔥 НОВАЯ СИСТЕМА УРОВНЕЙ: Определяем тип крипа =======
    
    // Получаем текущий уровень героя
    const currentLevel = heroLevelSystem.getCurrentLevel();
    const levelConfig = getLevelConfig(currentLevel);
    
    // 🔥 НОВАЯ ЛОГИКА: Проверяем, должен ли следующий крип быть боссом
    // Босс появляется когда убито normalCreepsCount обычных крипов
    if (this.currentLevelProgress === this.normalCreepsCount) {
      // Последний крип на уровне = босс
      this.isCurrentlyBoss = true;
      console.log(`👑 Спавним БОССА уровня ${currentLevel}: ${levelConfig.bossCreep} (прогресс: ${this.currentLevelProgress}/${this.totalCreepsOnLevel})`);
      return levelConfig.bossCreep;
    } else {
      // Обычные крипы (до достижения normalCreepsCount)
      this.isCurrentlyBoss = false;
      
      // Получаем доступных крипов для текущего уровня
      const availableCreeps = levelConfig.normalCreeps;
      
      // Выбираем случайного крипа из доступных
      const randomIndex = Math.floor(Math.random() * availableCreeps.length);
      const selectedCreep = availableCreeps[randomIndex];
      
      console.log(`🎲 Спавним обычного крипа уровня ${currentLevel}: ${selectedCreep} (прогресс: ${this.currentLevelProgress}/${this.totalCreepsOnLevel})`);
      return selectedCreep;
    }
    
    // =============================================================
  }

  /**
   * ОБНОВЛЕННЫЙ МЕТОД: Создание нового крипа с новой системой on-demand
   */
  private async createNewCreep(): Promise<void> {
    // 🔥 ЗАЩИТА: Не создаем крипов если контроллер уничтожен
    if (this.isDestroyed) return;
    
    // Блокируем создание крипов в состоянии INITIALIZATION
    if (this.currentState === GameState.INITIALIZATION) {
      console.log('⏳ Блокируем создание крипа - игра в состоянии инициализации');
      return;
    }
    
    const currentLevel = heroLevelSystem.getCurrentLevel();
    
    // Прогреваем текстуры для текущего уровня если нужно
    if (!this.textureWarmupManager.isLevelWarmedUp(currentLevel)) {
      console.log(`🔥 Запускаем прогрев текстур для уровня ${currentLevel}...`);
      await this.textureWarmupManager.warmupLevel(currentLevel);
    }
    
    // НОВЫЙ ПОДХОД: Создаем крипа on-demand с передачей прогресса уровня
    const levelProgressInfo = {
      current: this.currentLevelProgress,
      total: this.totalCreepsOnLevel,
      normalCreepsCount: this.normalCreepsCount
    };
    
    console.log(`🎯 СОЗДАНИЕ КРИПА для уровня ${currentLevel}:`);
    console.log(`📊 Передаем прогресс:`, levelProgressInfo);
    console.log(`🔮 Ожидаем: ${levelProgressInfo.current === levelProgressInfo.normalCreepsCount ? 'БОССА' : 'обычного крипа'}`);
    
    this.currentCreep = await this.textureWarmupManager.getNextLevelCreep(levelProgressInfo);
    
    if (this.currentCreep) {
      // Используем созданного on-demand крипа
      const creepType = this.currentCreep.getCreepType();
      const isBoss = this.currentCreep.getIsBoss();
      
      console.log(`✅ Получили крипа: ${creepType} ${isBoss ? '(БОСС)' : '(обычный)'}`);
      
      // ИСПРАВЛЕНО: Теперь TextureWarmupManager сам определяет босса, но синхронизируем статус
      this.isCurrentlyBoss = this.currentCreep.getIsBoss();
      
      console.log(`🔄 Синхронизация статуса босса: ${this.isCurrentlyBoss}`);
      
      // Настраиваем крипа для игры
      await this.configureCreepForGame(this.currentCreep);
      
    } else {
      // Создаем крипа обычным способом, если новая система не сработала
      console.log('⚠️ Создаем крипа обычным способом (новая система не сработала)');
      await this.createCreepFallback();
    }
  }
  


  /**
   * Настройка крипа для игры после получения из очереди прогрева
   */
  private async configureCreepForGame(creep: Creep): Promise<void> {
    // Используем менеджер прогрева для настройки крипа
    await this.textureWarmupManager.prepareCreepForGame(creep);
    
    // Устанавливаем правильную скорость движения
    creep.setMoveSpeed(this.config.moveSpeed);
    
    // Устанавливаем callback для анимации золота у крипа
    creep.setGoldAnimationCallback((x: number, y: number, goldAmount: number) => {
      this.coinAnimationManager.showCoinAnimationOnCreep(this.currentCreep!, goldAmount);
    });
    
    // Крип уже добавлен к сцене в системе прогрева, просто убеждаемся что он видим
    if (!creep.parent) {
      this.app.stage.addChild(creep);
    }
  }
  
  /**
   * Резервный метод создания крипа (без прогрева)
   */
  private async createCreepFallback(): Promise<void> {
    const { Creep } = await import('../entities/Creep');
    
    // ИСПРАВЛЕНО: Используем старую логику определения типа крипа для fallback
    const creepType = this.getCreepType();
    
    // Получаем конфигурацию крипа из новой системы
    const creepConfig = getCreepConfig(creepType);
    
    if (!creepConfig) {
      return;
    }
    
    // Используем параметры из creepsConfig.ts (которые содержат оригинальные значения из GameConfig.ts)
    const visualScale = creepConfig.visualScale;    // Визуальный масштаб
    const creepPositionY = creepConfig.positionY;   // Позиция по высоте
    const creepCollisionZone = creepConfig.collisionZone; // Зона коллизии
    
    // ИСПРАВЛЕНИЕ: Убираем фиксированный baseScale, крип сам определит свой масштаб
    // через адаптивную формулу в updateScale() с учетом качества спрайт-листа
    const bossMultiplier = this.isCurrentlyBoss ? 1.5 : 1.0; // Боссы в 1.5 раза больше
    const finalScale = visualScale * bossMultiplier; // Только конфигурационный масштаб + босс множитель
    
    // Все крипы движутся с одинаковой скоростью, привязанной к скорости фона
    const creepSpeed = this.config.moveSpeed;
    
    // Создаем крипа с учетом модификаторов босса
    const bossHealthMultiplier = this.isCurrentlyBoss ? 3.0 : 1.0; // Боссы имеют в 3 раза больше HP
    
    this.currentCreep = new Creep(this.app, {
      creepType: creepType,
      positionX: 1.5, // 110% от ширины экрана (за правым краем)
      positionY: creepPositionY, // Индивидуальная позиция по высоте для данного типа крипа
      scale: finalScale, // Комбинированный масштаб с учетом конфигурации
      moveSpeed: creepSpeed, // Одинаковая скорость для всех крипов (привязана к фону)
      collisionZone: creepCollisionZone,
      healthMultiplier: bossHealthMultiplier, // Увеличенное здоровье для боссов
      isBoss: this.isCurrentlyBoss // ✅ Передаем флаг босса
    });
    
    // СВЯЗЬ КРИПА С GAMECONTROLLER: Устанавливаем ссылку на GameController для доступа к менеджерам эффектов
    (this.app as any).gameController = this;
    
    // Устанавливаем callback для анимации золота у крипа
    this.currentCreep.setGoldAnimationCallback((x: number, y: number, goldAmount: number) => {
      // Используем новый метод который показывает анимацию точно на месте полоски здоровья
      this.coinAnimationManager.showCoinAnimationOnCreep(this.currentCreep!, goldAmount);
    });
    
    this.app.stage.addChild(this.currentCreep);
    
    // Создаем полоску здоровья после добавления крипа к сцене
    this.currentCreep.createHealthBar();
  }
  
  /**
   * Очистка текущего крипа
   */
  private cleanupCreep(): void {
    if (this.currentCreep) {
      try {
        // Принудительно останавливаем анимации крипа
        this.currentCreep.pauseAnimations();
        
        // Удаляем из сцены если он там есть
        if (this.currentCreep.parent) {
          this.currentCreep.parent.removeChild(this.currentCreep);
        }
        
        // Уничтожаем крипа
        this.currentCreep.destroy();
        this.currentCreep = null;
        
        console.log('🧹 Крип успешно очищен');
      } catch (error) {
        console.warn('⚠️ Ошибка при очистке крипа:', error);
        this.currentCreep = null; // Обнуляем ссылку в любом случае
      }
    }
  }
  
  /**
   * Получение текущего состояния
   */
  public getCurrentState(): GameState {
    return this.currentState;
  }
  
  /**
   * Получение конфигурации
   */
  public getConfig(): Readonly<GameConfig> {
    return { ...this.config };
  }
  
  /**
   * Обновление конфигурации
   */
  public updateConfig(newConfig: Partial<GameConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
  
  /**
   * Обработка изменения размера экрана
   */
  public onResize(): void {
    // Обновляем размеры текущего крипа, если он есть
    if (this.currentCreep && !this.currentCreep.getIsDead()) {
      this.currentCreep.onResize();
    }
    
    // ИСПРАВЛЕНО: Обновляем позиционирование и размеры системы отображения уровня
    if (this.levelDisplaySystem) {
      this.levelDisplaySystem.updatePositioning();
    }
    
    // 🔥 НОВОЕ: Обновляем позицию стартового экрана
    if (this.startScreen) {
      this.startScreen.updatePosition();
    }
    
    // Обновляем менеджер прогрева текстур
    if (this.textureWarmupManager) {
      this.textureWarmupManager.onResize();
    }
    
    // Обновляем скорость движения пропорционально новому размеру экрана
    this.updateMoveSpeed();
  }

  /**
   * Обновление скорости движения фона и крипов
   * 
   * Базовая скорость зависит от ширины экрана и применяется ко всем движущимся объектам
   * Обеспечивает синхронизацию движения фона с движением крипов
   */
  public updateMoveSpeed(): void {
    // Базовая скорость зависит от ширины экрана
    const baseSpeed = this.app.screen.width / 200;
    
    // ✅ ИДЕАЛЬНАЯ СИНХРОНИЗАЦИЯ: Используем ОДИНАКОВУЮ скорость для фона и крипов
    const backgroundSpeedMultiplier = GAME_CONFIG.BACKGROUND.scroll.speedMultiplier;
    const synchronizedSpeed = baseSpeed * backgroundSpeedMultiplier;
    
    // Применяем точную синхронизацию через creepSyncRatio
    const creepSyncRatio = GAME_CONFIG.BACKGROUND.scroll.creepSyncRatio;
    const creepSpeed = synchronizedSpeed * creepSyncRatio; // 1.0 = ТОЧНО как фон
    
    // Сохраняем скорость крипа в config
    this.config.moveSpeed = creepSpeed;
    
    // Обновляем скорость фона если доступно (передаем точно тот же baseSpeed)
    if ((this.app as any).updateBackgroundSpeed) {
      (this.app as any).updateBackgroundSpeed(baseSpeed);
    }
    
    // Обновляем скорость текущего крипа если он есть и движется
    if (this.currentCreep && !this.currentCreep.getIsDead() && this.currentState !== GameState.FIGHTING) {
      this.currentCreep.setMoveSpeed(creepSpeed);
    }
  }

  /**
   * Получение героя
   * Используется для доступа к герою извне контроллера
   */
  public getHero(): Hero {
    return this.hero;
  }
  
  /**
   * Получение менеджера чисел урона (геттер)
   */
  public getDamageNumberManager(): DamageNumberManager {
    return this.damageNumberManager;
  }
  
  /**
   * Получение менеджера эффектов урона (геттер)
   */
  public getDamageEffectManager(): DamageEffectManager {
    return this.damageEffectManager;
  }
  
  /**
   * �� ОБНОВЛЕННЫЙ МЕТОД: Получение прогресса текущего уровня
   * Теперь возвращает динамические значения из levelsConfig
   */
  public getLevelProgress(): { current: number; total: number; isCurrentlyBoss: boolean } {
    return {
      current: this.currentLevelProgress,
      total: this.totalCreepsOnLevel,  // 🔥 Теперь динамическое значение
      isCurrentlyBoss: this.isCurrentlyBoss
    };
  }
  
  /**
   * Получение характеристик героя из heroStore
   * Используется для получения актуальных значений урона, HP, маны и т.д.
   */
  public getHeroStats(): HeroStats | null {
    return useHeroStore.getState().stats;
  }
  
  /**
   * Получение урона героя из heroStore
   * Возвращает актуальное значение урона или 1 по умолчанию
   */
  public getHeroDamage(): number {
    const stats = this.getHeroStats();
    return stats ? stats["damage"] : 1; // Базовое значение если stats не загружены
  }
  
  /**
   * Инициализация heroStore с базовыми характеристиками
   * DEPRECATED: Теперь данные загружаются с сервера через App.tsx
   * Метод оставлен для совместимости, но не используется
   */
  public initializeHeroStats(): void {
    // Метод оставлен для совместимости, но не используется
    // Инициализация происходит в App.tsx через API загрузку
  }
  
  /**
   * Восстановление здоровья и маны героя до полных значений при входе в игру
   * Вызывается при создании GameController для симуляции "отдыха" между боями
   */
  public restoreHeroToFullHealth(): void {
    const stats = this.getHeroStats();
    if (!stats) {
      return;
    }
    
    const maxHealth = stats['max-health'];
    const maxMana = stats['max-mana'];
    const currentHealth = stats['current-health'];
    const currentMana = stats['current-mana'];
    
    // Проверяем, нужно ли восстанавливать здоровье или ману
    const needHealthRestore = currentHealth < maxHealth;
    const needManaRestore = currentMana < maxMana;
    
    if (needHealthRestore || needManaRestore) {
      // Восстанавливаем текущее здоровье до максимального
      if (needHealthRestore) {
        useHeroStore.getState().updateStat('current-health', maxHealth);
      }
      
      // Восстанавливаем текущую ману до максимальной
      if (needManaRestore) {
        useHeroStore.getState().updateStat('current-mana', maxMana);
      }
    }
  }
  
  /**
   * Обновление всех характеристик героя при входе в игру
   * Перезагружает актуальные данные с сервера и синхронизирует текущие значения
   * 
   * Это гарантирует что все изменения из магазина отражаются в игре,
   * а также что герой начинает каждый "забег" с полными HP/MP
   */
  public async refreshHeroStats(): Promise<void> {
    try {
      console.log('🔄 Обновляем характеристики АКТИВНОГО героя в игре...');
      
      // Импортируем необходимые модули
      const { fetchActiveHeroStats } = await import('../../shared/api/apiService');
      const { TEST_USER_ID } = await import('../../shared/constants');
      
      // Загружаем данные АКТИВНОГО героя с сервера (не константы!)
      const result = await fetchActiveHeroStats(TEST_USER_ID);
      
      if (result && result.stats) {
        // Обновляем все характеристики в heroStore
        useHeroStore.getState().setStats(result.stats);
        
        // Дополнительно восстанавливаем текущее здоровье и ману до максимальных значений
        // (на случай если сервер вернул неполные значения)
        const updatedStats = result.stats;
        const maxHealth = updatedStats['max-health'];
        const maxMana = updatedStats['max-mana'];
        
        // Устанавливаем полные значения для "нового забега"
        useHeroStore.getState().updateStat('current-health', maxHealth);
        useHeroStore.getState().updateStat('current-mana', maxMana);
      } else {
        // Fallback: используем старую логику восстановления из кэша
        this.restoreHeroToFullHealth();
      }
    } catch (error) {
      // Fallback: используем старую логику восстановления из кэша
      this.restoreHeroToFullHealth();
    }
  }

  // ======= МЕТОДЫ УПРАВЛЕНИЯ ПАУЗОЙ =======
  
  /**
   * Поставить игру на паузу
   */
  public pauseGame(): void {
    this.isPausedByUser = true;
    
    // Останавливаем анимации героя
    if (this.hero) {
      this.hero.pauseAnimations();
    }
    
    // Останавливаем анимации крипа
    if (this.currentCreep && !this.currentCreep.getIsDead()) {
      this.currentCreep.pauseAnimations();
    }
    
    // Останавливаем движение фона через app
    if ((this.app as any).setBackgroundMoving) {
      (this.app as any).setBackgroundMoving(false);
    }
    
    // Останавливаем игровые звуки
    audioManager.setGamePaused(true);
  }
  
  /**
   * Снять игру с паузы
   */
  public resumeGame(): void {
    this.isPausedByUser = false;
    
    // Возобновляем анимации героя
    if (this.hero) {
      this.hero.resumeAnimations();
    }
    
    // Возобновляем анимации крипа
    if (this.currentCreep && !this.currentCreep.getIsDead()) {
      this.currentCreep.resumeAnimations();
    }
    
    // Восстанавливаем движение фона в зависимости от состояния игры
    const shouldMoveBackground = this.currentState !== GameState.FIGHTING && 
                                this.hero.getState() !== EntityState.IDLE;
    
    if ((this.app as any).setBackgroundMoving) {
      (this.app as any).setBackgroundMoving(shouldMoveBackground);
    }
    
    // Возобновляем игровые звуки
    audioManager.setGamePaused(false);
  }
  
  /**
   * Проверить находится ли игра на паузе
   */
  public isPaused(): boolean {
    return this.isPausedByUser;
  }
  
  /**
   * Получить состояние игры (работает/остановлена)
   */
  public isRunning(): boolean {
    return this.isGameRunning;
  }
  
  /**
   * Остановить игру полностью (для завершения/выхода)
   */
  public stopGame(): void {
    this.isGameRunning = false;
    this.isPausedByUser = false;
    
    // Останавливаем все анимации
    if (this.hero) {
      this.hero.pauseAnimations();
    }
    if (this.currentCreep) {
      this.currentCreep.pauseAnimations();
    }
    
    // Останавливаем фон
    if ((this.app as any).setBackgroundMoving) {
      (this.app as any).setBackgroundMoving(false);
    }
    
    // ИСПРАВЛЕНИЕ: Полная остановка всех звуков
    // Останавливаем все звуки принудительно
    audioManager.stopAllSounds();
    
    // Блокируем игровые звуки
    audioManager.setGamePaused(true);
    
    console.log('🎮 Игра полностью остановлена');
  }
  
  /**
   * �� ОБНОВЛЕННЫЙ МЕТОД: Перезапустить игру
   * Теперь переинициализирует параметры уровня
   */
  public restartGame(): void {

    
    // Восстанавливаем флаги работы игры
    this.isGameRunning = true;
    this.isPausedByUser = false;
    
    // Очищаем текущего крипа если есть
    this.cleanupCreep();
    
    // 🔥 НОВОЕ: Очищаем все числа урона при перезапуске игры
    if (this.damageNumberManager) {
      this.damageNumberManager.cleanup();
      console.log('🔄 Очищены все числа урона при перезапуске игры');
    }
    
    // Сбрасываем состояние игры - возвращаемся к ожиданию клика
    this.currentState = GameState.WAITING_FOR_START; // 🔥 ИЗМЕНЕНО: Возвращаемся к начальному экрану
    this.spawnTimer = 0;
    this.isSpawnBlocked = false;
    this.initializationFrames = 0; // Сбрасываем счетчик кадров инициализации
    this.initializationTimer = 0; // Сбрасываем таймер инициализации
    
    // Сбрасываем прогресс уровня при перезапуске игры
    this.currentLevelProgress = 0;
    this.isCurrentlyBoss = false;
    
    // 🔥 НОВОЕ: Переинициализируем параметры уровня
    this.initializeLevelParameters();
    
    // ИСПРАВЛЕНО: Сбрасываем и перезапускаем систему отображения уровня
    this.levelDisplaySystem.hideLevelDisplay();
    
    // 🔥 ИСПРАВЛЕНИЕ: Убираем показ значка уровня из рестарта - он появится при клике пользователя
    // const levelData = heroLevelSystem.getLevelData();
    // this.levelDisplaySystem.showLevelIcon(levelData.currentLevel);
    
    // Восстанавливаем здоровье и ману героя
    this.restoreHeroToFullHealth();
    
    // Сбрасываем счетчик золота за сессию
    this.resetSessionGold();
    
    // Возобновляем движение фона
    this.syncWorldMovement(true);
    
    // Запускаем игровой цикл заново
    this.startGameLoop();
    
    // Возобновляем игровые звуки
    audioManager.setGamePaused(false);
  }
  
  // =======================================

  // ======= СИСТЕМА ЗОЛОТА =======
  
  /**
   * Награждение игрока золотом за убийство крипа (логика начисления + отправка на сервер)
   * @param goldAmount - количество золота для награждения
   */
  private async awardGoldForKill(goldAmount: number): Promise<void> {
    // Увеличиваем счетчик золота за сессию
    this.sessionGoldEarned += goldAmount;
    
    // Обновляем heroStore.stats["coins"]
    const heroStoreState = useHeroStore.getState();
    if (heroStoreState.stats) {
      const currentCoins = heroStoreState.stats["coins"];
      
      // Рассчитываем накопленный пассивный доход с момента последней синхронизации
      let accumulatedPassiveIncome = 0;
      if ((window as any).getAccumulatedPassiveIncome) {
        accumulatedPassiveIncome = (window as any).getAccumulatedPassiveIncome();
      }
      
      // Общая сумма: текущее золото + накопленный пассивный доход + золото за крипа
      const totalGoldIncrease = accumulatedPassiveIncome + goldAmount;
      const newCoins = currentCoins + totalGoldIncrease;
      
      // Мгновенно обновляем UI с правильной суммой
      heroStoreState.updateStat("coins", newCoins);
      
      // Синхронизируем с GoldContext для мгновенного обновления UI
      if ((window as any).updateGoldFromGameController) {
        (window as any).updateGoldFromGameController(newCoins);
      }
      
      console.log(`💰 Убийство крипа: золото за крипа=${goldAmount}, накопленный пассивный доход=${accumulatedPassiveIncome.toFixed(2)}, итого=${totalGoldIncrease.toFixed(2)}`);
      
      // ОТПРАВКА НА СЕРВЕР с ожиданием ответа для синхронизации
      await this.sendGoldToServerWithSync(goldAmount);
    } else {
      console.error(`❌ heroStore.stats === null, не можем начислить золото`);
    }
  }
  
  /**
   * Отправка золота на сервер с синхронизацией (ждет ответа и обновляет время синхронизации)
   * @param goldAmount - количество золота для отправки
   */
  private async sendGoldToServerWithSync(goldAmount: number): Promise<void> {
    try {
      // Получаем ID активного героя (НЕ константу!)
      const currentStats = this.getHeroStats();
      const activeHeroId = currentStats?.heroId || TEST_HERO_ID; // Fallback к константе только если нет данных

      const payload = {
        userId: TEST_USER_ID,
        heroId: activeHeroId, // Используем активного героя!
        income: goldAmount
      };
      
      // Отправляем запрос и ЖДЕМ ответа
      const response = await fetch(`${API_BASE_URL}/update_user_money`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        console.warn(`⚠️ Сервер вернул ошибку при отправке золота:`, response.status);
        return;
      }
      
      // Запрашиваем актуальные данные с сервера после обновления
      const heroDataResponse = await fetch(`${API_BASE_URL}/hero_data?userId=${TEST_USER_ID}`);
      
      if (heroDataResponse.ok) {
        const heroData = await heroDataResponse.json();
        
        // Обновляем время последней синхронизации в GoldContext
        if ((window as any).updateLastSyncTime) {
          (window as any).updateLastSyncTime();
        }
        
        // Если есть расхождение с серверным значением, корректируем
        if (heroData.coins !== undefined) {
          const heroStoreState = useHeroStore.getState();
          const currentLocalCoins = heroStoreState.stats?.["coins"] || 0;
          const serverCoins = heroData.coins;
          
          if (Math.abs(serverCoins - currentLocalCoins) > 1) {
            console.log(`🔄 Корректировка золота: локально=${currentLocalCoins}, сервер=${serverCoins}`);
            heroStoreState.updateStat("coins", serverCoins);
            
            if ((window as any).updateGoldFromGameController) {
              (window as any).updateGoldFromGameController(serverCoins);
            }
          }
        }
        
        console.log(`✅ Золото успешно синхронизировано с сервером`);
      }
      
    } catch (error) {
      console.warn(`⚠️ Ошибка при синхронизации золота с сервером:`, error);
      // В случае ошибки все равно продолжаем игру - золото уже обновлено локально
    }
  }
  
  /**
   * Отправка золота на сервер (как в старом проекте)
   * @param goldAmount - количество золота для отправки
   */
  private async sendGoldToServer(goldAmount: number): Promise<void> {
    // Fire-and-forget запрос как в старом проекте - не ждем ответа
    try {
      // Получаем ID активного героя (НЕ константу!)
      const currentStats = this.getHeroStats();
      const activeHeroId = currentStats?.heroId || TEST_HERO_ID; // Fallback к константе только если нет данных

      const payload = {
        userId: TEST_USER_ID,
        heroId: activeHeroId, // Используем активного героя!
        income: goldAmount
      };
      
      // Отправляем запрос без ожидания ответа (fire-and-forget)
      fetch(`${API_BASE_URL}/update_user_money`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      }).then(response => {
        if (!response.ok) {
          console.warn(`⚠️ Сервер вернул ошибку при отправке золота:`, response.status);
        }
      }).catch(error => {
        console.warn(`⚠️ Ошибка при отправке золота на сервер:`, error);
      });
      
    } catch (error) {
      console.warn(`⚠️ Исключение при отправке золота на сервер:`, error);
    }
  }
  
  /**
   * Получить количество золота заработанного за текущую сессию
   * @returns количество золота за сессию
   */
  public getSessionGoldEarned(): number {
    return this.sessionGoldEarned;
  }
  
  /**
   * Сбросить счетчик золота за сессию (используется при рестарте игры)
   */
  public resetSessionGold(): void {
    this.sessionGoldEarned = 0;
  }

  // =======================================

  // ======= СИСТЕМА СМЕРТИ ГЕРОЯ =======
  
  /**
   * Завершение игры при смерти героя
   * Ставит игру на паузу (не останавливает полностью) и запускает Game Over последовательность
   */
  private endGame(): void {

    
    // ИСПРАВЛЕНИЕ: Ставим игру на паузу, а не останавливаем полностью
    // Это заморозит игру в текущем состоянии, сохранив позиции героя и крипа
    this.isPausedByUser = true;
    
    // Останавливаем все анимации (заморозка текущего кадра)
    if (this.hero) {
      this.hero.pauseAnimations();
    }
    if (this.currentCreep) {
      this.currentCreep.pauseAnimations();
    }
    
    // 🔥 НОВОЕ: Очищаем все числа урона при смерти героя
    if (this.damageNumberManager) {
      this.damageNumberManager.cleanup();
      console.log('💥 Очищены все числа урона при смерти героя');
    }
    
    // Останавливаем фон
    if ((this.app as any).setBackgroundMoving) {
      (this.app as any).setBackgroundMoving(false);
    }
    
    // Останавливаем все игровые звуки при смерти героя
    audioManager.setGamePaused(true);
    
    // Уведомляем о Game Over через callback (устанавливается из GamePage)
    if (this.onGameOverCallback) {
      this.onGameOverCallback(this.sessionGoldEarned);
    }
  }

  // Callback для уведомления о Game Over (устанавливается из GamePage)
  private onGameOverCallback?: (sessionGold: number) => void;

  /**
   * Установка callback для уведомления о Game Over
   * Вызывается из GamePage.tsx при создании GameController
   */
  public setGameOverCallback(callback: (sessionGold: number) => void): void {
    this.onGameOverCallback = callback;
  }
  
  // ===============================

  // ======= СИСТЕМА ОТОБРАЖЕНИЯ УРОВНЯ =======
  
  /**
   * Показать значок уровня
   */
  private showLevelIcon(): void {
    const levelData = heroLevelSystem.getLevelData();
    this.levelDisplaySystem.showLevelIcon(levelData.currentLevel);
  }

  /**
   * Обновить прогресс уровня
   */
  private updateLevelProgress(): void {
    this.levelDisplaySystem.updateProgress(this.currentLevelProgress);
  }
  
  // ===============================

  /**
   * Очистка ресурсов
   */
  public destroy(): void {
    // 🔥 ЗАЩИТА: Предотвращаем множественное уничтожение
    if (this.isDestroyed) return;
    this.isDestroyed = true;
    
    console.log('🧹 Начинаем уничтожение GameController...');
    
    try {
      // Останавливаем игру полностью
      this.isGameRunning = false;
      this.isPausedByUser = false;
      
      // Останавливаем все звуки
      try {
        audioManager.stopAllSounds();
        audioManager.setGamePaused(true);
      } catch (error) {
        console.warn('Ошибка при остановке звуков:', error);
      }
      
      // Удаляем слушатели событий
      try {
        this.app.stage.off('pointerdown');
      } catch (error) {
        console.warn('Ошибка при удалении слушателей событий:', error);
      }
      
      // Останавливаем все ticker'ы
      try {
        if (this.app.ticker) {
          this.app.ticker.remove((this.app as any).heroUpdateTicker);
          this.app.ticker.remove((this.app as any).gameControllerUpdateTicker);
          
          // Очищаем ссылки
          (this.app as any).heroUpdateTicker = null;
          (this.app as any).gameControllerUpdateTicker = null;
        }
      } catch (error) {
        console.warn('Ошибка при остановке ticker\'ов:', error);
      }
      
      // Очищаем крипа
      try {
        this.cleanupCreep();
      } catch (error) {
        console.warn('Ошибка при очистке крипа:', error);
      }
      
      // Принудительно останавливаем анимации героя
      try {
        if (this.hero) {
          this.hero.pauseAnimations();
        }
      } catch (error) {
        console.warn('Ошибка при остановке анимаций героя:', error);
      }
      
      // Очищаем все эффекты урона
      try {
        if (this.damageEffectManager) {
          this.damageEffectManager.cleanup();
        }
      } catch (error) {
        console.warn('Ошибка при очистке эффектов урона:', error);
      }
      
      // Очищаем числа урона
      try {
        if (this.damageNumberManager) {
          this.damageNumberManager.cleanup();
        }
      } catch (error) {
        console.warn('Ошибка при очистке чисел урона:', error);
      }
      
      // Уничтожаем менеджер анимации монет
      try {
        if (this.coinAnimationManager) {
          this.coinAnimationManager.destroy();
        }
      } catch (error) {
        console.warn('Ошибка при уничтожении менеджера монет:', error);
      }
      
      // Уничтожаем систему отображения уровня
      try {
        if (this.levelDisplaySystem) {
          this.levelDisplaySystem.destroy();
        }
      } catch (error) {
        console.warn('Ошибка при уничтожении системы уровней:', error);
      }
      
      // 🔥 НОВОЕ: Уничтожаем стартовый экран
      try {
        if (this.startScreen) {
          this.startScreen.destroy();
        }
      } catch (error) {
        console.warn('Ошибка при уничтожении стартового экрана:', error);
      }
      
      // Уничтожаем менеджер прогрева текстур
      try {
        if (this.textureWarmupManager) {
          this.textureWarmupManager.destroy();
        }
      } catch (error) {
        console.warn('Ошибка при уничтожении менеджера текстур:', error);
      }
      
      // Убираем все ссылки на себя из app
      try {
        if ((this.app as any).gameController === this) {
          delete (this.app as any).gameController;
        }
        delete (this.app as any).gameHero;
      } catch (error) {
        console.warn('Ошибка при очистке ссылок в app:', error);
      }
      
      // 🔥 НОВОЕ: Удаляем из списка активных контроллеров
      GameController.activeControllers.delete(this);
      
      console.log('✅ GameController успешно уничтожен');
      
    } catch (error) {
      console.error('❌ Критическая ошибка при уничтожении GameController:', error);
    }
  }
}

export type { GameConfig }; 