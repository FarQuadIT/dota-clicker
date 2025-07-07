/**
 * Менеджер прогрева текстур крипов
 * 
 * Принцип работы:
 * 1. Предварительно создает всех крипов для текущего уровня в невидимом состоянии
 * 2. Располагает их за экраном справа
 * 3. При спавне просто делает крипа видимым и перемещает в игровую зону
 * 4. Это убирает лаги при первой отрисовке новых крипов
 * 
 * 🧪 ТЕСТОВЫЙ РЕЖИМ БОССОВ (для настройки позиций):
 * 
 * ВКЛЮЧЕН ПО УМОЛЧАНИЮ! Создает только боссов выбранного типа.
 * 
 * Быстрая смена босса через консоль браузера (F12):
 *   gameController.textureWarmupManager.setTestBoss('direCreep');
 *   gameController.textureWarmupManager.setTestBoss('wolf');
 *   gameController.textureWarmupManager.setTestBoss('satyr');
 *   gameController.textureWarmupManager.setTestBoss('shishka');
 *   gameController.textureWarmupManager.setTestBoss('voul');
 *   gameController.textureWarmupManager.setTestBoss('medved');
 *   gameController.textureWarmupManager.setTestBoss(null);  // Выключить
 */

import { Application } from 'pixi.js';
import { Creep } from '../entities/Creep';
import { getCreepsForLevel, getCreepConfig } from '../config/creepsConfig';
import { getBossForLevel } from '../config/levelsConfig';
import { heroLevelSystem } from '../systems/HeroLevelSystem';

export interface WarmupConfig {
  /** Позиция крипов за экраном (множитель от ширины экрана) */
  offscreenPositionX: number;
  
  /** Количество крипов для прогрева на один уровень */
  creepsPerLevel: number;
}

export class TextureWarmupManager {
  private app: Application;
  private config: WarmupConfig;
  
  // Очередь готовых крипов для текущего уровня
  private warmupQueue: Creep[] = [];
  
  // Текущий уровень для которого прогреты крипы
  private currentWarmedLevel: number = -1;
  
  // Флаг активности прогрева
  private isWarmupActive: boolean = true;

  // NEW: Очередь крипов для текущего уровня
  private levelCreepQueue: Creep[] = [];
  private currentLevel: number = -1;

  constructor(app: Application, config: Partial<WarmupConfig> = {}) {
    this.app = app;
    this.config = {
      offscreenPositionX: 2.0,    // 2x от ширины экрана (далеко за экраном)
      creepsPerLevel: 10,      // 9 обычных крипов + 1 босс
      ...config
    };
  }

  // ========== ТЕСТОВЫЙ РЕЖИМ ДЛЯ БОССОВ ==========
  // Измени bossType на нужный тип крипа для тестирования:
  // 'direCreep', 'wolf', 'satyr', 'shishka', 'voul', 'medved'
  private testBossMode = {
    enabled: false,       // ← Включить/выключить тестовый режим
    bossType: 'medved'    // ← Выбрать тип босса для тестирования
  };
  
  /**
   * 🧪 БЫСТРАЯ СМЕНА ТИПА БОССА ДЛЯ ТЕСТИРОВАНИЯ
   * Вызови эту функцию в консоли браузера для смены босса:
   * 
   * // Переключить на тестирование медведя:
   * gameController.textureWarmupManager.setTestBoss('medved');
   * 
   * // Переключить на тестирование сатира:
   * gameController.textureWarmupManager.setTestBoss('satyr');
   * 
   * // Выключить тестовый режим:
   * gameController.textureWarmupManager.setTestBoss(null);
   */
  public setTestBoss(bossType: string | null): void {
    if (bossType === null) {
      this.testBossMode.enabled = false;
      console.log('🧪 Тестовый режим ВЫКЛЮЧЕН - возврат к обычной игре');
    } else {
      this.testBossMode.enabled = true;
      this.testBossMode.bossType = bossType;
      console.log(`🧪 Тестовый режим: переключаемся на босса "${bossType}"`);
      console.log('💡 Перезапусти уровень чтобы изменения вступили в силу');
    }
  }
  // ===============================================

  /**
   * Прогрев текстур для указанного уровня
   */
  public async warmupLevel(level: number): Promise<void> {
    if (this.currentWarmedLevel === level && this.warmupQueue.length > 0) {
      return;
    }
    
    console.log(`🔥 Прогрев текстур для уровня ${level}...`);
    
    // Очищаем старую очередь
    this.clearWarmupQueue();
    
    // Генерируем последовательность крипов для всего уровня
    const creepSequence = await this.generateLevelCreepSequence(level);
    
    // Создаем всех крипов из последовательности
    const creationPromises = creepSequence.map(({ creepType, isBoss }) => 
      this.createWarmupCreep(creepType, isBoss)
    );
    
    // Ждем создания всех крипов
    await Promise.all(creationPromises);
    
    this.currentWarmedLevel = level;
    
    console.log(`✅ Прогрев завершен! Готово ${this.levelCreepQueue.length} крипов для уровня ${level}`);
    console.log(`📋 Последовательность крипов:`, creepSequence.map(c => c.isBoss ? `${c.creepType} (BOSS)` : c.creepType).join(', '));
  }

  /**
   * Генерирует последовательность крипов для всего уровня
   */
  private async generateLevelCreepSequence(level: number): Promise<Array<{ creepType: string; isBoss: boolean }>> {
    const { getLevelConfig } = await import('../config/levelsConfig');
    const levelConfig = getLevelConfig(level);
    
    const sequence: Array<{ creepType: string; isBoss: boolean }> = [];
    
    // ТЕСТОВЫЙ РЕЖИМ: Создаем только боссов выбранного типа
    if (this.testBossMode.enabled) {
      console.log(`🧪 ТЕСТОВЫЙ РЕЖИМ: Создаем только боссов типа "${this.testBossMode.bossType}"`);
      
      // Создаем 10 боссов одного типа для удобного тестирования
      for (let i = 0; i < 10; i++) {
        sequence.push({ creepType: this.testBossMode.bossType, isBoss: true });
      }
      
      return sequence;
    }
    
    // ОБЫЧНЫЙ РЕЖИМ: Генерируем стандартную последовательность
    // Генерируем 9 обычных крипов
    for (let i = 0; i < 9; i++) {
      const availableCreeps = levelConfig.normalCreeps;
      const randomIndex = Math.floor(Math.random() * availableCreeps.length);
      const selectedCreep = availableCreeps[randomIndex];
      
      sequence.push({ creepType: selectedCreep, isBoss: false });
    }
    
    // Добавляем 1 босса
    sequence.push({ creepType: levelConfig.bossCreep, isBoss: true });
    
    return sequence;
  }

  /**
   * Создание крипа для прогрева текстур
   */
  private async createWarmupCreep(creepType: string, isBoss: boolean): Promise<void> {
    const { Creep } = await import('../entities/Creep');
    const { getCreepConfig } = await import('../config/creepsConfig');
    
    const creepConfig = getCreepConfig(creepType);
    if (!creepConfig) {
      console.error(`❌ Не найдена конфигурация для крипа: ${creepType}`);
      return;
    }

    // Рассчитываем параметры как в игре
    const baseScale = 0.8;
    const bossMultiplier = isBoss ? 1.5 : 1.0;
    const finalScale = baseScale * creepConfig.visualScale * bossMultiplier;
    const healthMultiplier = isBoss ? 3.0 : 1.0;

    // Создаем крипа в очереди прогрева (за экраном)
    const creep = new Creep(this.app, {
      creepType: creepType,
      positionX: this.config.offscreenPositionX, // За экраном (в 2 раза дальше правого края)
      positionY: creepConfig.positionY,
      scale: finalScale,
      moveSpeed: 0, // Неподвижен в очереди
      collisionZone: creepConfig.collisionZone,
      healthMultiplier: healthMultiplier
    });

    // Скрываем полоску здоровья у крипов в очереди
    creep.createHealthBar();
    const healthBar = creep.getHealthBar();
    if (healthBar) {
      healthBar.visible = false;
    }

    // Добавляем к сцене
    this.app.stage.addChild(creep);
    
    // Добавляем в очередь уровня
    this.levelCreepQueue.push(creep);
  }

  /**
   * Получение следующего крипа из очереди уровня
   */
  public getNextLevelCreep(): Creep | null {
    if (this.levelCreepQueue.length === 0) {
      console.log('⚠️ Очередь крипов уровня пуста');
      return null;
    }

    const creep = this.levelCreepQueue.shift()!;
    console.log(`✅ Взяли следующего крипа из очереди: ${creep.getCreepType()}`);
    
    return creep;
  }

  /**
   * Определение является ли крип боссом по здоровью
   */
  private async isCreepBoss(creep: Creep): Promise<boolean> {
    const { getCreepConfig } = await import('../config/creepsConfig');
    const creepConfig = getCreepConfig(creep.getCreepType());
    
    if (creepConfig) {
      const baseHealth = creepConfig.maxHealth;
      const creepMaxHealth = creep.getMaxHealth();
      
      // Если здоровье крипа в 3 раза больше базового, значит это босс
      const healthRatio = creepMaxHealth / baseHealth;
      return healthRatio > 2.0; // Обычный крип имеет ratio ~1.0, босс ~3.0
    }
    
    return false;
  }

  /**
   * Подготовка крипа для игры
   */
  public async prepareCreepForGame(creep: Creep): Promise<void> {
    // Получаем конфигурацию крипа
    const creepConfig = creep.getConfig();
    
    // Определяем, является ли крип боссом по здоровью
    const isBoss = await this.isCreepBoss(creep);
    
    // Устанавливаем начальную позицию для входа в игру
    let relativeY = creepConfig.positionY!;
    
    // Применяем настройки для боссов
    if (isBoss) {
      const { getCreepConfig } = await import('../config/creepsConfig');
      const typeConfig = getCreepConfig(creep.getCreepType());
      
      if (typeConfig) {
        // Коррекция позиции для боссов
        if (typeConfig.bossPositionOffsetY) {
          relativeY += typeConfig.bossPositionOffsetY;
          console.log(`👑 Применена коррекция позиции для босса ${creep.getCreepType()}: ${typeConfig.bossPositionOffsetY}`);
        }
        
        // Коррекция зоны коллизии для боссов
        if (typeConfig.bossCollisionZoneMultiplier) {
          const newCollisionZone = typeConfig.collisionZone * typeConfig.bossCollisionZoneMultiplier;
          creep.setCollisionZone(newCollisionZone);
          console.log(`⚔️ Применена коррекция зоны коллизии для босса ${creep.getCreepType()}: ${typeConfig.collisionZone} → ${newCollisionZone} (×${typeConfig.bossCollisionZoneMultiplier})`);
        }
      }
    }
    
    creep.setPosition(1.5, relativeY);
    
    // Показываем полоску здоровья
    const healthBar = creep.getHealthBar();
    if (healthBar) {
      healthBar.visible = true;
    }
    
    console.log(`🎮 Крип ${creep.getCreepType()} ${isBoss ? '(БОСС)' : ''} подготовлен для игры`);
  }

  /**
   * Получение типов крипов для указанного уровня
   */
  private getCreepTypesForLevel(level: number): string[] {
    const availableCreeps = getCreepsForLevel(level);
    
    // Если нет доступных крипов для уровня, используем базовых
    if (availableCreeps.length === 0) {
      return ['direCreep', 'wolf', 'satyr'];
    }
    
    return availableCreeps;
  }

  /**
   * Очистка очереди прогрева
   */
  private clearWarmupQueue(): void {
    for (const creep of this.warmupQueue) {
      if (creep.parent) {
        this.app.stage.removeChild(creep);
      }
      creep.destroy();
    }
    this.warmupQueue.length = 0;
  }

  /**
   * Проверка готовности крипов для текущего уровня
   */
  public isLevelWarmedUp(level: number): boolean {
    return this.currentWarmedLevel === level && this.levelCreepQueue.length > 0;
  }

  /**
   * Получение количества крипов в очереди уровня
   */
  public getLevelQueueSize(): number {
    return this.levelCreepQueue.length;
  }

  /**
   * Включение/выключение системы прогрева
   */
  public setWarmupActive(active: boolean): void {
    this.isWarmupActive = active;
    
    if (!active) {
      this.clearWarmupQueue();
    }
  }

  /**
   * Проверка активности системы прогрева
   */
  public isWarmupEnabled(): boolean {
    return this.isWarmupActive;
  }

  /**
   * Обновление размеров при изменении экрана
   */
  public onResize(): void {
    // Обновляем позиции крипов в очереди
    this.levelCreepQueue.forEach(creep => {
      if (creep && !creep.destroyed) {
        creep.onResize();
      }
    });
  }

  /**
   * Подготовка к новому уровню
   */
  public prepareForLevel(level: number): void {
    if (this.currentLevel !== level) {
      // Очищаем очередь предыдущего уровня
      this.clearLevelQueue();
      this.currentLevel = level;
    }
  }

  /**
   * Очистка очереди крипов уровня
   */
  private clearLevelQueue(): void {
    this.levelCreepQueue.forEach(creep => {
      if (creep.parent) {
        creep.parent.removeChild(creep);
      }
      creep.destroy();
    });
    this.levelCreepQueue = [];
  }

  /**
   * Уничтожение менеджера
   */
  public destroy(): void {
    this.clearWarmupQueue();
    this.clearLevelQueue();
    this.isWarmupActive = false;
  }
} 