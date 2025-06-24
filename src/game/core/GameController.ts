/**
 * Контроллер игры - управляет взаимодействием героя с крипами
 * 
 * Логика по новым требованиям:
 * 1. Герой изначально бежит (фон движется), крип движется навстречу
 * 2. По клику герой атакует - фон и крип останавливаются на время анимации атаки
 * 3. После завершения анимации атаки - фон и крип возобновляют движение
 * 4. При коллизии - оба переходят в атаку, мир останавливается
 * 5. После смерти крипа - пауза 3 сек, спавн нового крипа
 */

import { Application } from 'pixi.js';
import { Hero } from '../entities/Hero';
import { Creep } from '../entities/Creep';
import { GAME_CONFIG } from '../config/GameConfig';
import { GameState } from './GameStates';
import { getAllCreepTypes, getCreepConfig } from '../config/creepsConfig';
import { useHeroStore } from '../../contexts/heroStore';
import type { HeroStats } from '../../shared/types';

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
  private currentState: GameState = GameState.RUNNING;
  
  // ======= НАСТРОЙКА КРИПОВ =======
  // Измените эту переменную чтобы выбрать конкретного крипа:
  // 'random' - случайные крипы
  // 'direCreep', 'wolf', 'satyr', 'shishka', 'voul', 'medved' - конкретный крип
  private selectedCreepType: string = 'wolf'; // <-- ИЗМЕНИТЕ ЗДЕСЬ
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
  
  /**
   * Конструктор контроллера
   */
  constructor(app: Application, hero: Hero) {
    this.app = app;
    this.hero = hero;
    
    // Устанавливаем правильную скорость движения сразу при инициализации
    this.updateMoveSpeed();
    
    // Настраиваем интерактивность канваса для кликов
    this.setupInteractivity();
    
    // Настраиваем callback для возобновления движения крипа
    this.setupHeroCallbacks();
    
    // Добавляем полоски здоровья на сцену (поверх всех элементов)
    this.setupHealthBars();
    
    // Обновляем все характеристики героя с сервера при входе в игру
    // Это асинхронная операция, но не блокирует создание контроллера
    this.refreshHeroStats().catch(error => {
      console.warn('⚠️ Не удалось обновить характеристики при инициализации:', error);
    });
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
    
    // Синхронизируем крипа с фоном ТОЛЬКО если не в состоянии боя
    if (this.currentState !== GameState.FIGHTING && this.currentCreep && !this.currentCreep.getIsDead()) {
      if (isMoving) {
        this.currentCreep.setMoveSpeed(this.config.moveSpeed);
  
      } else {
        this.currentCreep.setMoveSpeed(0);

      }
    }
  }

  /**
   * Обработка кликов по канвасу - атака героя
   */
  private onCanvasClick(): void {

    
    // Герой может атаковать всегда (даже по воздуху), кроме состояния ожидания после смерти крипа
    if (this.currentState !== GameState.WAITING) {
      this.heroAttack();
    }
  }
  
  /**
   * Атака героя - новая логика с остановкой мира
   */
  private heroAttack(): void {

    // Герой переходит в режим атаки (это автоматически остановит фон и крип через callback)
    this.hero.setAttacking();
  }
  
  /**
   * Нанесение урона крипу (вызывается после завершения анимации атаки)
   * Если крипа нет - атака проходит по воздуху
   */
  public dealDamageToCreep(): void {
    if (!this.currentCreep || this.currentCreep.getIsDead()) {
      return;
    }
    
    // Проверяем, находится ли крип в зоне коллизии
    if (this.currentState === GameState.FIGHTING) {
      // Получаем урон героя
      const heroDamage = this.getHeroDamage();
      
      // Наносим урон крипу
      const creepDied = this.currentCreep.takeDamage(heroDamage);
      
      if (creepDied) {
        this.onCreepKilled();
      }
      
      // Герой автоматически вернется к бегу через callback в Hero.ts
      // Это запустит синхронизацию мира через syncWorldMovement()
    }
  }
  
  /**
   * Обработка убийства крипа (вызывается когда здоровье крипа достигает 0)
   */
  private onCreepKilled(): void {
    if (!this.currentCreep) return;
    
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
   * Запуск игрового цикла
   */
  public startGameLoop(): void {

    
    // Герой сразу начинает бежать (новая логика)
    this.hero.setMoving();
    
    // Создаем первого крипа
    this.createNewCreep().catch(console.error);
  }
  
  /**
   * Обновление игрового цикла (вызывается каждый кадр)
   */
  public update(deltaTime: number): void {
    // Обновляем таймер спавна если ждем
    if (this.currentState === GameState.WAITING) {
      this.updateSpawnTimer(deltaTime);
    }
    
    // Проверяем коллизии если крип есть и игра активна
    if (this.currentCreep && this.currentState !== GameState.WAITING) {
      this.checkCollisions();
    }
    
    // Обновляем крипа если он есть
    if (this.currentCreep) {
      this.currentCreep.updateCreep(deltaTime);
    }
  }
  
  /**
   * Обновление таймера спавна
   */
  private updateSpawnTimer(deltaTime: number): void {
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
    
    // Получаем индивидуальную зону коллизии крипа
    const creepCollisionZone = this.currentCreep.getCollisionZone();
    const baseCollisionZone = this.config.collisionZoneRatio ?? GAME_CONFIG.GAME_MECHANICS.collision.detectionZone;
    
    // Применяем множитель зоны коллизии конкретного крипа
    const finalCollisionZone = baseCollisionZone * creepCollisionZone;
    
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
   * Выбор типа крипа (случайный или фиксированный)
   */
  private getCreepType(): string {
    // Если выбран конкретный крип - возвращаем его
    if (this.selectedCreepType !== 'random') {
      return this.selectedCreepType;
    }
    
    // Иначе выбираем случайно
    const randomIndex = Math.floor(Math.random() * this.availableCreepTypes.length);
    return this.availableCreepTypes[randomIndex];
  }



  /**
   * Создание нового крипа
   */
  private async createNewCreep(): Promise<void> {
    const { Creep } = await import('../entities/Creep');
    
    // Выбираем тип крипа (случайный или фиксированный)
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
    
    // Комбинируем масштабы: базовый * визуальный масштаб
    const baseScale = 0.8; // Базовый масштаб из GameController
    const finalScale = baseScale * visualScale;
    
    // Все крипы движутся с одинаковой скоростью, привязанной к скорости фона
    const creepSpeed = this.config.moveSpeed;
    
    this.currentCreep = new Creep(this.app, {
      creepType: creepType,
      positionX: 1.5, // 110% от ширины экрана (за правым краем)
      positionY: creepPositionY, // Индивидуальная позиция по высоте для данного типа крипа
      scale: finalScale, // Комбинированный масштаб с учетом конфигурации
      moveSpeed: creepSpeed, // Одинаковая скорость для всех крипов (привязана к фону)
      collisionZone: creepCollisionZone
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
      // Удаляем из сцены и уничтожаем
      this.app.stage.removeChild(this.currentCreep);
      this.currentCreep.destroy();
      this.currentCreep = null;

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
    
    // Обновляем скорость движения пропорционально новому размеру экрана
    this.updateMoveSpeed();
  }

  /**
   * Обновление скорости движения (синхронизация с фоном)
   */
  public updateMoveSpeed(): void {
    // Синхронизируем скорость крипа со скоростью фона
    // Используем общий коэффициент скорости из конфигурации
    const baseSpeed = this.app.screen.width / 200;
    const speedMultiplier = GAME_CONFIG.BACKGROUND.scroll.speedMultiplier;
    const newMoveSpeed = baseSpeed * speedMultiplier;
    this.config.moveSpeed = newMoveSpeed;
    
    // Обновляем скорость текущего крипа если он есть и движется
    if (this.currentCreep && !this.currentCreep.getIsDead() && this.currentState !== GameState.FIGHTING) {
      this.currentCreep.setMoveSpeed(newMoveSpeed);
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
      // Импортируем необходимые модули
      const { fetchHeroStats } = await import('../../shared/api/apiService');
      const { TEST_USER_ID, TEST_HERO_ID } = await import('../../shared/constants');
      
      // Загружаем актуальные данные с сервера
      const result = await fetchHeroStats(TEST_USER_ID, TEST_HERO_ID);
      
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

  /**
   * Очистка ресурсов
   */
  public destroy(): void {
    // Удаляем слушатели событий
    this.app.stage.off('pointerdown');
    
    // Очищаем крипа
    this.cleanupCreep();
    

  }
}

export type { GameConfig }; 