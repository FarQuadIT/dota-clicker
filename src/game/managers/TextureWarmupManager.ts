/**
 * Менеджер прогрева текстур крипов (НОВАЯ ВЕРСИЯ)
 * 
 * ОБНОВЛЕННЫЙ ПОДХОД для iOS оптимизации:
 * 1. Использует TexturePreloader для загрузки только спрайтшитов без создания объектов
 * 2. Создает крипов on-demand при спавне (решает проблему фоновых лагов)
 * 3. Мгновенное создание крипов благодаря кешированным текстурам
 * 
 * Преимущества:
 * ✅ Отсутствие фоновых анимаций (0% CPU в состоянии покоя)
 * ✅ Минимальное потребление памяти (нет предсозданных объектов)
 * ✅ Мгновенный спавн крипов (текстуры уже загружены)
 * ✅ Оптимизация для iOS Safari
 * 
 * 🧪 ТЕСТОВЫЕ РЕЖИМЫ сохранены для совместимости
 * 🔥 ОПТИМИЗИРОВАНО ДЛЯ iOS: убраны логи на мобильных устройствах
 */

import { Application } from 'pixi.js';
import { Creep } from '../entities/Creep';
import { getCreepConfig } from '../config/creepsConfig';
import { heroLevelSystem } from '../systems/HeroLevelSystem';
import { TexturePreloader } from './TexturePreloader';

// ==================================================================================
// ОПТИМИЗАЦИЯ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ
// ==================================================================================

/**
 * Определение мобильных устройств для отключения логов
 */
const IS_MOBILE = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

/**
 * Функция для логирования только на десктопе (производительность на мобильных)
 */
function mobileOptimizedLog(enableDebugLogging: boolean, message: string): void {
  // Отключено для производительности
}

export interface WarmupConfig {
  /** Включить систему прогрева (для обратной совместимости) */
  enableWarmup: boolean;
  
  /** Включить подробное логирование (автоматически отключается на мобильных) */
  enableDebugLogging: boolean;
}

export class TextureWarmupManager {
  private app: Application;
  private config: WarmupConfig;
  
  // Новая система предзагрузки текстур
  private texturePreloader: TexturePreloader;
  
  // Флаги состояния
  private isWarmupActive: boolean = true;
  private currentWarmedLevel: number = -1;

  // ========== ТЕСТОВЫЕ РЕЖИМЫ (сохранены для совместимости) ==========
  private testBossMode = {
    enabled: false,
    bossType: 'direCreep'
  };
  
  private testCreepMode = {
    enabled: false,
    creepType: 'direCreep'
  };

  constructor(app: Application, config: Partial<WarmupConfig> = {}) {
    this.app = app;
    
    // ОПТИМИЗАЦИЯ: Автоматически отключаем логи на мобильных устройствах
    this.config = {
      enableWarmup: true,
      enableDebugLogging: false, // Отключено для производительности
      ...config
    };
    
    // Принудительно отключаем логи на мобильных
    if (IS_MOBILE && this.config.enableDebugLogging) {
      this.config.enableDebugLogging = false;
    }
    
    // Инициализируем новую систему предзагрузки с оптимизированными настройками
    this.texturePreloader = new TexturePreloader(app, {
      enableDebugLogging: false, // Отключено для производительности
      textureLoadTimeout: IS_MOBILE ? 3000 : 5000 // Меньший таймаут на мобильных
    });
  }

  /**
   * 🧪 БЫСТРАЯ СМЕНА ТИПА БОССА ДЛЯ ТЕСТИРОВАНИЯ
   */
  public setTestBoss(bossType: string | null): void {
    if (bossType === null) {
      this.testBossMode.enabled = false;
    } else {
      this.testBossMode.enabled = true;
      this.testBossMode.bossType = bossType;
    }
  }
  
  /**
   * 🧪 БЫСТРАЯ СМЕНА ТИПА ОБЫЧНОГО КРИПА ДЛЯ ТЕСТИРОВАНИЯ
   */
  public setTestCreep(creepType: string | null): void {
    if (creepType === null) {
      this.testCreepMode.enabled = false;
    } else {
      this.testCreepMode.enabled = true;
      this.testCreepMode.creepType = creepType;
    }
  }

  /**
   * НОВЫЙ МЕТОД: Прогрев текстур для указанного уровня (без создания объектов)
   * ОПТИМИЗИРОВАН: упрощенная обработка на мобильных
   */
  public async warmupLevel(level: number): Promise<void> {
    if (!this.config.enableWarmup) {
      return;
    }

    if (this.currentWarmedLevel === level) {
      return;
    }
    
    try {
      // Используем TexturePreloader для загрузки только спрайтшитов
      await this.texturePreloader.preloadLevel(level);
      
      this.currentWarmedLevel = level;
      
    } catch (error) {
      // Логируем ошибки только на десктопе
      if (!IS_MOBILE) {
        console.error(`❌ Ошибка прогрева уровня ${level}:`, error);
      }
      throw error;
    }
  }

  /**
   * НОВЫЙ МЕТОД: Создание крипа on-demand с информацией о прогрессе уровня
   * ОПТИМИЗИРОВАН: минимальные логи на мобильных
   */
  public async getNextLevelCreep(levelProgress?: { current: number; total: number; normalCreepsCount: number }): Promise<Creep | null> {
    try {
      // Определяем тип крипа для спавна с учетом прогресса уровня
      const creepType = await this.determineCreepType(levelProgress);
      const isBoss = this.shouldSpawnAsBoss(levelProgress);
      
      // Создаем крипа мгновенно используя кешированные текстуры
      const creep = await this.createCreepOnDemand(creepType, isBoss);
      
      if (creep) {
        return creep;
      } else {
        return null;
      }
      
    } catch (error) {
      if (!IS_MOBILE) {
        console.error('❌ Ошибка создания крипа on-demand:', error);
      }
      return null;
    }
  }

  /**
   * Создание крипа on-demand с использованием кешированных текстур
   * ОПТИМИЗИРОВАН: быстрая проверка без лишних логов
   */
  private async createCreepOnDemand(creepType: string, isBoss: boolean): Promise<Creep | null> {
    const creepConfig = getCreepConfig(creepType);
    if (!creepConfig) {
      if (!IS_MOBILE) {
        console.error(`❌ Не найдена конфигурация для крипа: ${creepType}`);
      }
      return null;
    }

    // Проверяем что текстуры готовы
    const idleFrames = this.texturePreloader.getCachedCreepFrames(creepType, 'idle');
    if (!idleFrames) {
      if (!IS_MOBILE) {
        console.error(`❌ Нет кешированных текстур для ${creepType}`);
      }
      return null;
    }

    // Рассчитываем параметры как в старой системе
    const bossMultiplier = isBoss ? 1.5 : 1.0;
    const finalScale = creepConfig.visualScale * bossMultiplier;
    const healthMultiplier = isBoss ? 3.0 : 1.0;

    // Создаем крипа мгновенно (текстуры уже в памяти)
    const creep = new Creep(this.app, {
      creepType: creepType,
      positionX: 1.5, // Начальная позиция за экраном
      positionY: creepConfig.positionY,
      scale: finalScale,
      moveSpeed: 0, // Скорость установится позже в GameController
      collisionZone: creepConfig.collisionZone,
      healthMultiplier: healthMultiplier,
      isBoss: isBoss
    });

    // Добавляем к сцене
    this.app.stage.addChild(creep);
    
    // Создаем полоску здоровья
    creep.createHealthBar();
    
    return creep;
  }

  /**
   * Определение типа крипа для спавна (с учетом тестовых режимов и прогресса уровня)
   * ОПТИМИЗИРОВАН: минимальные логи на мобильных
   */
  private async determineCreepType(levelProgress?: { current: number; total: number; normalCreepsCount: number }): Promise<string> {
    // ТЕСТОВЫЙ РЕЖИМ БОССОВ
    if (this.testBossMode.enabled) {
      return this.testBossMode.bossType;
    }
    
    // ТЕСТОВЫЙ РЕЖИМ ОБЫЧНЫХ КРИПОВ
    if (this.testCreepMode.enabled) {
      return this.testCreepMode.creepType;
    }
    
    // ОБЫЧНЫЙ РЕЖИМ: используем конфигурацию уровня + логику GameController
    try {
      const currentLevel = heroLevelSystem.getCurrentLevel();
      const { getLevelConfig } = await import('../config/levelsConfig');
      const levelConfig = getLevelConfig(currentLevel);
      
      // ИНТЕГРАЦИЯ ЛОГИКИ GAMECONTROLLER: Определяем босса vs обычного крипа
      if (levelProgress && levelProgress.current === levelProgress.normalCreepsCount) {
        // Последний крип на уровне = босс
        return levelConfig.bossCreep;
      } else {
        // Обычные крипы (случайный выбор из доступных)
        const availableCreeps = levelConfig.normalCreeps;
        const randomIndex = Math.floor(Math.random() * availableCreeps.length);
        const selectedCreep = availableCreeps[randomIndex];
        
        return selectedCreep;
      }
      
    } catch (error) {
      if (!IS_MOBILE) {
        console.warn('⚠️ Ошибка определения типа крипа, используем direCreep:', error);
      }
      return 'direCreep';
    }
  }

  /**
   * Определение нужно ли создавать босса (с учетом прогресса уровня)
   * ОПТИМИЗИРОВАН: упрощенные логи
   */
  private shouldSpawnAsBoss(levelProgress?: { current: number; total: number; normalCreepsCount: number }): boolean {
    // В тестовых режимах
    if (this.testBossMode.enabled) {
      return true;
    }
    if (this.testCreepMode.enabled) {
      return false;
    }
    
    // ИНТЕГРАЦИЯ ЛОГИКИ GAMECONTROLLER: Проверяем прогресс уровня
    if (levelProgress && levelProgress.current === levelProgress.normalCreepsCount) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * ОБНОВЛЕННЫЙ МЕТОД: Подготовка крипа для игры
   * ОПТИМИЗИРОВАН: меньше операций на мобильных
   */
  public async prepareCreepForGame(creep: Creep): Promise<void> {
    // Получаем конфигурацию крипа
    const creepConfig = creep.getConfig();
    const isBoss = creep.getIsBoss();
    
    // Устанавливаем правильную позицию
    let relativeY = creepConfig.positionY!;
    
    // Применяем настройки для боссов
    if (isBoss) {
      const typeConfig = getCreepConfig(creep.getCreepType());
      
      if (typeConfig) {
        // Коррекция позиции для боссов
        if (typeConfig.bossPositionOffsetY) {
          relativeY += typeConfig.bossPositionOffsetY;
        }
        
        // Коррекция зоны коллизии для боссов
        if (typeConfig.bossCollisionZoneMultiplier) {
          const newCollisionZone = typeConfig.collisionZone * typeConfig.bossCollisionZoneMultiplier;
          creep.setCollisionZone(newCollisionZone);
        }
      }
    }
    
    creep.setPosition(1.5, relativeY);
    
    // Показываем полоску здоровья
    const healthBar = creep.getHealthBar();
    if (healthBar) {
      healthBar.visible = true;
    }
  }

  /**
   * Проверка готовности крипов для текущего уровня
   */
  public isLevelWarmedUp(level: number): boolean {
    return this.texturePreloader.isLevelReady(level);
  }

  /**
   * Получение количества крипов в очереди уровня (заглушка для совместимости)
   */
  public getLevelQueueSize(): number {
    // В новой системе нет очереди объектов, возвращаем 1 если уровень готов
    return this.isLevelWarmedUp(this.currentWarmedLevel) ? 1 : 0;
  }

  /**
   * Включение/выключение системы прогрева
   */
  public setWarmupActive(active: boolean): void {
    this.isWarmupActive = active;
    this.config.enableWarmup = active;
    
    if (!active) {
      this.texturePreloader.clearCache();
    }
  }

  /**
   * Проверка активности системы прогрева
   */
  public isWarmupEnabled(): boolean {
    return this.isWarmupActive && this.config.enableWarmup;
  }

  /**
   * Обновление размеров при изменении экрана
   */
  public onResize(): void {
    // Передаем в TexturePreloader (хотя там пустая реализация)
    this.texturePreloader.onResize();
  }

  /**
   * Подготовка к новому уровню
   */
  public prepareForLevel(level: number): void {
    if (this.currentWarmedLevel !== level) {
      // Очищаем старый кеш
      this.texturePreloader.clearCache();
      this.currentWarmedLevel = -1;
    }
  }

  /**
   * Получение статистики
   */
  public getStats() {
    return this.texturePreloader.getStats();
  }

  /**
   * Логирование с префиксом (ОПТИМИЗИРОВАНО для мобильных)
   */
  private log(message: string): void {
    mobileOptimizedLog(this.config.enableDebugLogging, message);
  }

  /**
   * Уничтожение менеджера
   */
  public destroy(): void {
    // Уничтожаем TexturePreloader
    if (this.texturePreloader) {
      this.texturePreloader.destroy();
    }
    
         this.isWarmupActive = false;
     this.currentWarmedLevel = -1;
   }
} 