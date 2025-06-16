/**
 * Контроллер игры - управляет взаимодействием героя с крипами
 * 
 * Логика по принципам старого проекта:
 * 1. Герой всегда бежит (фон движется), крип движется навстречу
 * 2. По клику герой атакует (если есть энергия)
 * 3. При коллизии - оба переходят в атаку, мир останавливается
 * 4. После смерти крипа - пауза 3 сек, спавн нового крипа
 */

import { Application } from 'pixi.js';
import { Hero } from '../entities/Hero';
import { Creep } from '../entities/Creep';
import { GAME_CONFIG } from '../config/GameConfig';
import { GameState } from './GameStates';

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
  private creepStartX: number;
  
  /**
   * Конструктор контроллера
   */
  constructor(app: Application, hero: Hero) {
    this.app = app;
    this.hero = hero;
    
    // Вычисляем стартовую позицию крипов
    this.creepStartX = app.screen.width + 200;
    
    // Настраиваем интерактивность канваса для кликов
    this.setupInteractivity();
    
    console.log('🎮 GameController создан (по принципам старого проекта)');
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
    
    console.log('🖱️ Интерактивность канваса настроена');
  }
  
  /**
   * Обработка кликов по канвасу - атака героя
   */
  private onCanvasClick(): void {
    console.log('🖱️ Клик по канвасу - попытка атаки');
    console.log(`   Текущее состояние игры: ${this.currentState}`);
    console.log(`   Есть крип: ${!!this.currentCreep}`);
    console.log(`   Крип мертв: ${this.currentCreep?.getIsDead()}`);
    
    // Атакуем только если игра активна
    if (this.currentState !== GameState.WAITING) {
      this.heroAttack();
    } else {
      console.log('⚠️ Атака заблокирована - ждем спавна крипа');
    }
  }
  
  /**
   * Атака героя
   */
  private heroAttack(): void {
    if (!this.currentCreep) {
      console.log('⚠️ Нет крипа для атаки');
      return;
    }
    
    // Проверяем энергию героя (пока упрощенно)
    console.log('⚔️ Герой атакует!');
    console.log(`   Состояние героя до атаки: ${this.hero.getState()}`);
    
    // Герой переходит в режим атаки
    this.hero.setAttacking();
    
    console.log(`   Состояние героя после атаки: ${this.hero.getState()}`);
    console.log(`   Текущая анимация героя: ${this.hero.getCurrentAnimationName()}`);
    
    // Урон наносится НЕ сразу, а после завершения анимации атаки
    // Это будет обработано в колбэке завершения анимации в Hero классе
    console.log('🏃 Анимация атаки запущена, урон будет нанесен после завершения');
  }
  
  /**
   * Нанесение урона крипу (вызывается после завершения анимации атаки)
   */
  public dealDamageToCreep(): void {
    if (!this.currentCreep || this.currentCreep.getIsDead()) {
      console.log('⚠️ Нет живого крипа для нанесения урона');
      return;
    }
    
    console.log('💥 Урон крипу нанесен после завершения анимации атаки');
    
    // Проверяем, находится ли крип в зоне коллизии
    if (this.currentState === GameState.FIGHTING) {
      console.log('💀 Крип в зоне коллизии - убиваем');
      this.killCreep();
    } else {
      console.log('🎯 Крип вне зоны коллизии - урон не нанесен');
    }
  }
  
  /**
   * Убийство крипа
   */
  private killCreep(): void {
    if (!this.currentCreep) return;
    
    console.log(`💀 Крип убит на позиции (${this.currentCreep.x}, ${this.currentCreep.y})`);
    
    // Восстанавливаем скорость движения крипа чтобы он продолжал двигаться во время смерти
    this.currentCreep.setMoveSpeed(this.config.moveSpeed);
    
    // Крип переходит в анимацию смерти
    this.currentCreep.startDeath();
    
    // Слушаем завершение анимации смерти
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
    console.log('🗑️ Анимация смерти завершена, очищаем крипа');
    this.cleanupCreep();
  }
  
  /**
   * Запуск игрового цикла
   */
  public startGameLoop(): void {
    console.log('🚀 Запуск игрового цикла');
    
    // Герой сразу начинает бежать
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
      console.log('⏰ Время спавна истекло, создаем нового крипа');
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
    
    // Упрощенная проверка пересечения по X (как в старом проекте)
    const heroRight = heroBounds.x + heroBounds.width * (this.config.collisionZoneRatio ?? GAME_CONFIG.GAME_MECHANICS.collision.detectionZone);
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
    console.log('⚔️ Коллизия! Начало боя');
    
    // Логируем позиции при коллизии
    if (this.currentCreep) {
      const heroBounds = this.hero.getBounds();
      console.log(`🎯 КОЛЛИЗИЯ: позиция крипа (${this.currentCreep.x}, ${this.currentCreep.y})`);
      console.log(`🎯 КОЛЛИЗИЯ: позиция героя (${heroBounds.x}, ${heroBounds.y})`);
    }
    
    this.currentState = GameState.FIGHTING;
    
    // Останавливаем движение мира (фон и крип)
    this.hero.setIdle(); // Это остановит фон
    
    if (this.currentCreep) {
      this.currentCreep.setMoveSpeed(0); // Останавливаем крипа
      this.currentCreep.startAttack(); // Крип атакует
    }
  }
  
  /**
   * Конец боя - коллизия прекратилась
   */
  private stopFighting(): void {
    console.log('🏃 Коллизия прекратилась, возобновляем движение');
    this.currentState = GameState.RUNNING;
    
    // Возобновляем движение
    this.hero.setMoving(); // Это запустит фон
    
    if (this.currentCreep && !this.currentCreep.getIsDead()) {
      this.currentCreep.setMoveSpeed(this.config.moveSpeed); // Крип снова движется
    }
  }
  
  /**
   * Создание нового крипа
   */
  private async createNewCreep(): Promise<void> {
    const { Creep } = await import('../entities/Creep');
    
    this.currentCreep = new Creep({
      x: this.creepStartX,
      y: this.app.screen.height * 0.7,
      scale: 0.8,
      moveSpeed: this.config.moveSpeed // Сразу двигается
    });
    
    this.app.stage.addChild(this.currentCreep);
    
    console.log('👹 Новый крип создан и движется к герою');
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
      console.log('🗑️ Крип удален');
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
    console.log('⚙️ Конфигурация игры обновлена:', this.config);
  }
  
  /**
   * Очистка ресурсов
   */
  public destroy(): void {
    // Удаляем слушатели событий
    this.app.stage.off('pointerdown');
    
    // Очищаем крипа
    this.cleanupCreep();
    
    console.log('🗑️ GameController уничтожен');
  }
}

export type { GameConfig }; 