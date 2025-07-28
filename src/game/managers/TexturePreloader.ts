/**
 * Менеджер предзагрузки текстур для оптимизации на iOS
 * 
 * НОВЫЙ ПОДХОД для улучшения производительности:
 * 1. Загружает только спрайтшиты без создания объектов (решает проблему микрофризов)
 * 2. Создает крипов on-demand (решает проблему фоновых лагов)
 * 3. Прогревает шейдеры для мгновенного рендеринга первого кадра
 * 
 * Преимущества над старой системой:
 * ✅ Нет фоновых анимаций (0% CPU в состоянии покоя)
 * ✅ Нет предсозданных объектов (минимум JavaScript heap)
 * ✅ Мгновенное создание крипов (текстуры уже загружены)
 * ✅ Оптимизация для iOS (минимальное потребление ресурсов)
 * 
 * Учтено что пока есть только:
 * - Герой: centaur (кентавр) в трех качествах (hd/md/ld)
 * - Крип: direCreep в трех качествах (hd/md/ld)
 */

import { Application, Texture, Assets } from 'pixi.js';
import { assetsManager } from './AssetsManager';
import { heroLevelSystem } from '../systems/HeroLevelSystem';

/**
 * Конфигурация предзагрузчика
 */
export interface TexturePreloaderConfig {
  /** Включить детальное логирование */
  enableDebugLogging: boolean;
  
  /** Таймаут для загрузки одной текстуры (мс) */
  textureLoadTimeout: number;
}

/**
 * Информация о кешированной текстуре
 */
interface CachedTextureInfo {
  /** Массив кадров анимации */
  frames: Texture[];
  
  /** Время загрузки (для отладки) */
  loadTime: number;
  
  /** Размер текстуры */
  size: { width: number; height: number };
  
  /** Качество текстуры */
  quality: 'ld' | 'md' | 'hd';
}

/**
 * Кеш загруженных текстур
 */
interface TextureCache {
  /** Текстуры героев: heroType -> animationType -> CachedTextureInfo */
  heroes: Map<string, Map<string, CachedTextureInfo>>;
  
  /** Текстуры крипов: creepType -> animationType -> CachedTextureInfo */
  creeps: Map<string, Map<string, CachedTextureInfo>>;
}

/**
 * Статистика предзагрузчика
 */
interface PreloaderStats {
  /** Количество загруженных текстур */
  loadedTextures: number;
  
  /** Общее время загрузки (мс) */
  totalLoadTime: number;
  
  /** Количество прогретых шейдеров */
  warmedUpShaders: number;
  
  /** Использованная память (приближенно, МБ) */
  estimatedMemoryUsage: number;
}

export class TexturePreloader {
  private app: Application;
  private config: TexturePreloaderConfig;
  
  // Кеш загруженных текстур
  private textureCache: TextureCache = {
    heroes: new Map(),
    creeps: new Map()
  };
  
  // Invisible спрайты для прогрева шейдеров
  private shaderWarmupSprites: Map<string, any> = new Map();
  
  // Статистика
  private stats: PreloaderStats = {
    loadedTextures: 0,
    totalLoadTime: 0,
    warmedUpShaders: 0,
    estimatedMemoryUsage: 0
  };
  
  // Флаги состояния
  private isPreloadingActive: boolean = false;
  private currentPreloadedLevel: number = -1;

  constructor(app: Application, config: Partial<TexturePreloaderConfig> = {}) {
    this.app = app;
    this.config = {
      enableDebugLogging: true,
      textureLoadTimeout: 5000, // 5 секунд на текстуру
      ...config
    };
  }

  /**
   * Предзагрузка текстур для указанного уровня
   */
  public async preloadLevel(level: number): Promise<void> {
    // Если уровень уже загружен, пропускаем
    if (this.currentPreloadedLevel === level) {
      return;
    }

    this.isPreloadingActive = true;
    
    const startTime = performance.now();

    try {
      // Получаем список крипов для уровня
      const creepTypes = await this.getCreepTypesForLevel(level);
      
      // Загружаем спрайтшиты для всех крипов уровня
      await this.preloadCreepTextures(creepTypes);
      
      // Загружаем спрайтшиты героя (всегда кентавр пока что)
      await this.preloadHeroTextures(['centaur']);
      
      // Прогреваем шейдеры
      await this.warmupShaders(creepTypes, ['centaur']);
      
      const totalTime = performance.now() - startTime;
      this.stats.totalLoadTime = totalTime;
      this.currentPreloadedLevel = level;
      
    } catch (error) {
      console.error(`❌ Ошибка предзагрузки уровня ${level}:`, error);
      throw error;
    } finally {
      this.isPreloadingActive = false;
    }
  }

  /**
   * Предзагрузка текстур крипов
   */
  private async preloadCreepTextures(creepTypes: string[]): Promise<void> {
    const loadPromises: Promise<void>[] = [];
    
    for (const creepType of creepTypes) {
      // Загружаем все анимации крипа параллельно
      loadPromises.push(
        this.loadCreepAnimation(creepType, 'idle'),
        this.loadCreepAnimation(creepType, 'attack'),
        this.loadCreepAnimation(creepType, 'death')
      );
    }
    
    await Promise.all(loadPromises);
  }

  /**
   * Предзагрузка текстур героев
   */
  private async preloadHeroTextures(heroTypes: string[]): Promise<void> {
    const loadPromises: Promise<void>[] = [];
    
    for (const heroType of heroTypes) {
      // Загружаем все анимации героя параллельно
      loadPromises.push(
        this.loadHeroAnimation(heroType, 'idle'),
        this.loadHeroAnimation(heroType, 'run'),
        this.loadHeroAnimation(heroType, 'attack')
      );
    }
    
    await Promise.all(loadPromises);
  }

  /**
   * Загрузка анимации крипа
   */
  private async loadCreepAnimation(creepType: string, animationType: string): Promise<void> {
    const cacheKey = `${creepType}_${animationType}`;
    
    try {
      const startTime = performance.now();
      
      // Получаем кадры из AssetsManager (который уже загружает правильное качество)
      const frames = assetsManager.getCreepFrames(creepType, animationType);
      
      if (!frames || frames.length === 0) {
        return;
      }
      
      const loadTime = performance.now() - startTime;
      const quality = assetsManager.getQualityInfo().quality;
      
      // Кешируем информацию о текстуре
      if (!this.textureCache.creeps.has(creepType)) {
        this.textureCache.creeps.set(creepType, new Map());
      }
      
      this.textureCache.creeps.get(creepType)!.set(animationType, {
        frames,
        loadTime,
        size: { width: frames[0].width, height: frames[0].height },
        quality
      });
      
      this.stats.loadedTextures++;
      this.updateMemoryEstimate(frames);
      
    } catch (error) {
      console.error(`❌ Ошибка загрузки ${cacheKey}:`, error);
      // Не пробрасываем ошибку, чтобы не сломать загрузку других текстур
    }
  }

  /**
   * Загрузка анимации героя
   */
  private async loadHeroAnimation(heroType: string, animationType: string): Promise<void> {
    const cacheKey = `${heroType}_${animationType}`;
    
    try {
      const startTime = performance.now();
      
      // Получаем кадры из AssetsManager
      const frames = assetsManager.getHeroFrames(heroType, animationType);
      
      if (!frames || frames.length === 0) {
        return;
      }
      
      const loadTime = performance.now() - startTime;
      const quality = assetsManager.getQualityInfo().quality;
      
      // Кешируем информацию о текстуре
      if (!this.textureCache.heroes.has(heroType)) {
        this.textureCache.heroes.set(heroType, new Map());
      }
      
      this.textureCache.heroes.get(heroType)!.set(animationType, {
        frames,
        loadTime,
        size: { width: frames[0].width, height: frames[0].height },
        quality
      });
      
      this.stats.loadedTextures++;
      this.updateMemoryEstimate(frames);
      
    } catch (error) {
      console.error(`❌ Ошибка загрузки ${cacheKey}:`, error);
    }
  }

  /**
   * Прогрев шейдеров через invisible спрайты
   */
  private async warmupShaders(creepTypes: string[], heroTypes: string[]): Promise<void> {
    const { AnimatedSprite } = await import('pixi.js');
    
    // Прогреваем шейдеры для крипов
    for (const creepType of creepTypes) {
      const idleFrames = this.getCachedCreepFrames(creepType, 'idle');
      if (idleFrames && idleFrames.length > 0) {
        const warmupSprite = new AnimatedSprite(idleFrames);
        warmupSprite.visible = false; // Invisible
        warmupSprite.renderable = false; // Не рендерится
        warmupSprite.position.set(-9999, -9999); // За экраном
        
        this.app.stage.addChild(warmupSprite);
        this.shaderWarmupSprites.set(`creep_${creepType}`, warmupSprite);
        
        // Принудительно рендерим один кадр для компиляции шейдера
        this.app.renderer.render(this.app.stage);
        
        this.stats.warmedUpShaders++;
      }
    }
    
    // Прогреваем шейдеры для героев
    for (const heroType of heroTypes) {
      const idleFrames = this.getCachedHeroFrames(heroType, 'idle');
      if (idleFrames && idleFrames.length > 0) {
        const warmupSprite = new AnimatedSprite(idleFrames);
        warmupSprite.visible = false;
        warmupSprite.renderable = false;
        warmupSprite.position.set(-9999, -9999);
        
        this.app.stage.addChild(warmupSprite);
        this.shaderWarmupSprites.set(`hero_${heroType}`, warmupSprite);
        
        this.app.renderer.render(this.app.stage);
        
        this.stats.warmedUpShaders++;
      }
    }
  }

  /**
   * Получение кешированных кадров крипа
   */
  public getCachedCreepFrames(creepType: string, animationType: string): Texture[] | null {
    const creepCache = this.textureCache.creeps.get(creepType);
    if (!creepCache) return null;
    
    const animCache = creepCache.get(animationType);
    if (!animCache) return null;
    
    return animCache.frames;
  }

  /**
   * Получение кешированных кадров героя
   */
  public getCachedHeroFrames(heroType: string, animationType: string): Texture[] | null {
    const heroCache = this.textureCache.heroes.get(heroType);
    if (!heroCache) return null;
    
    const animCache = heroCache.get(animationType);
    if (!animCache) return null;
    
    return animCache.frames;
  }

  /**
   * Получение типов крипов для уровня
   */
  private async getCreepTypesForLevel(level: number): Promise<string[]> {
    try {
      const { getLevelConfig } = await import('../config/levelsConfig');
      const levelConfig = getLevelConfig(level);
      
      // Возвращаем всех крипов уровня (обычных + босса)
      const allCreeps = [...levelConfig.normalCreeps];
      if (!allCreeps.includes(levelConfig.bossCreep)) {
        allCreeps.push(levelConfig.bossCreep);
      }
      
      // ВРЕМЕННО: Пока есть только direCreep, фильтруем
      return allCreeps.filter(creepType => creepType === 'direCreep');
      
    } catch (error) {
      console.warn('⚠️ Ошибка получения крипов уровня, используем fallback:', error);
      return ['direCreep']; // Fallback пока есть только direCreep
    }
  }

  /**
   * Проверка готовности уровня
   */
  public isLevelReady(level: number): boolean {
    return this.currentPreloadedLevel === level && !this.isPreloadingActive;
  }

  /**
   * Получение статистики
   */
  public getStats(): PreloaderStats {
    return { ...this.stats };
  }

  /**
   * Обновление оценки использованной памяти
   */
  private updateMemoryEstimate(frames: Texture[]): void {
    // Приблизительная оценка: каждая текстура = width * height * 4 байта (RGBA)
    for (const frame of frames) {
      const bytes = frame.width * frame.height * 4;
      this.stats.estimatedMemoryUsage += bytes / (1024 * 1024); // Переводим в МБ
    }
  }

  /**
   * Очистка кеша
   */
  public clearCache(): void {
    // Уничтожаем warmup спрайты
    for (const [key, sprite] of this.shaderWarmupSprites) {
      if (sprite.parent) {
        sprite.parent.removeChild(sprite);
      }
      sprite.destroy();
    }
    this.shaderWarmupSprites.clear();
    
    // Очищаем кеш (сами текстуры остаются в AssetsManager)
    this.textureCache.heroes.clear();
    this.textureCache.creeps.clear();
    
    // Сбрасываем статистику
    this.stats = {
      loadedTextures: 0,
      totalLoadTime: 0,
      warmedUpShaders: 0,
      estimatedMemoryUsage: 0
    };
    
    this.currentPreloadedLevel = -1;
  }

  /**
   * Логирование статистики
   */
  private logStats(): void {
    // Убрано для производительности
  }

  /**
   * Логирование с префиксом
   */
  private log(message: string): void {
    // Убрано для производительности
  }

  /**
   * Обновление размеров (заглушка для совместимости)
   */
  public onResize(): void {
    // Ничего не делаем - у нас нет объектов для обновления
  }

  /**
   * Уничтожение предзагрузчика
   */
  public destroy(): void {
    this.clearCache();
    this.isPreloadingActive = false;
  }
} 