/**
 * Менеджер ресурсов для игры Dota Clicker
 * 
 * Принципы работы:
 * 1. Загружает все игровые ресурсы (текстуры, звуки, спрайтшиты)
 * 2. Кэширует загруженные ресурсы для быстрого доступа
 * 3. Разбивает спрайтшиты на отдельные кадры для анимаций
 * 4. Предоставляет информацию о прогрессе загрузки
 * 5. Использует PixiJS Assets API для оптимальной загрузки
 * 6. Поддерживает адаптивную загрузку спрайт листов в зависимости от мощности устройства
 * 
 * Документация: 
 * - PixiJS Assets: https://pixijs.download/release/docs/assets.Assets.html
 * - В all_pixijs_content.txt раздел "Assets"
 */

import { Assets, Texture, Rectangle } from 'pixi.js';
import { getAllHeroTypes, getHeroConfig } from '../config/heroConfig';
import { getAllCreepTypes, getCreepConfig, getCreepAnimationConfig } from '../config/creepsConfig';

// ==================================================================================
// ТИПЫ ДАННЫХ ДЛЯ МЕНЕДЖЕРА РЕСУРСОВ
// ==================================================================================

/**
 * Уровни качества спрайт листов
 */
export type QualityLevel = 'ld' | 'md' | 'hd';

/**
 * Типы устройств для выбора качества спрайт листов
 */
export type DeviceType = 'desktop' | 'tablet' | 'smartphone';

/**
 * Мощность устройства
 */
export type DevicePower = 'weak' | 'medium' | 'strong';

/**
 * Конфигурация спрайтшита для анимации
 */
export interface SpriteSheetConfig {
  /** Путь к файлу спрайтшита */
  path: string;
  
  /** Ширина одного кадра в пикселях */
  frameWidth: number;
  
  /** Высота одного кадра в пикселях */
  frameHeight: number;
  
  /** Количество кадров по горизонтали */
  framesX: number;
  
  /** Количество кадров по вертикали */
  framesY: number;
  
  /** Общее количество используемых кадров (исключая пустые ячейки) */
  totalFrames: number;
}

/**
 * Адаптивная конфигурация спрайтшита с несколькими уровнями качества
 */
export interface AdaptiveSpriteSheetConfig {
  /** Конфигурация для слабых устройств (256x256) */
  ld: SpriteSheetConfig;
  /** Конфигурация для средних устройств (512x512) */
  md: SpriteSheetConfig;
  /** Конфигурация для мощных устройств (1024x1024) */
  hd: SpriteSheetConfig;
}

/**
 * Основной интерфейс для всех игровых ресурсов
 * Структурирует ресурсы по категориям для организованного доступа
 */
interface GameAssets {
  // Текстуры персонажей
  heroes: {
    /**
     * Индексная сигнатура, позволяющая хранить героев с любым именем
     * 
     * Пример практического использования:
     * 
     * // Добавление нового героя в игру
     * this.assets.heroes["axe"] = { 
     *   idle: axeIdleFrames, 
     *   run: axeRunFrames, 
     *   attack: axeAttackFrames 
     * };
     * 
     * // Доступ к кадрам анимации героя
     * const heroFrames = this.assets.heroes[heroConfig.name].idle;
     */
    [heroName: string]: HeroAssets;
  };
  
  // Текстуры врагов
  creeps: {
    [creepName: string]: CreepAssets;
  };
  
  // Фоновые изображения
  backgrounds: {
    [bgName: string]: Texture;
    forest: Texture;
  };
  
  // UI элементы
  ui: {
    [uiName: string]: Texture;
    gold: Texture;
    health: Texture;
    mana: Texture;
  };
  
  // Значки уровней для HUD
  levels: {
    [levelName: string]: Texture;
    bronze: Texture;
    silver: Texture;
    gold: Texture;
    platinum: Texture;
    master: Texture;
    grandmaster: Texture;
  };
  
  // Иконки героев для прогресс-бара
  heroIcons: {
    [heroName: string]: Texture;
    juggernaut: Texture;
  };
}

/**
 * Интерфейс кадров анимаций для героев
 * Содержит массивы кадров для каждой анимации
 */
interface HeroAssets {
  [animation: string]: Texture[];
  idle: Texture[];      // Массив кадров анимации ожидания
  run: Texture[];       // Массив кадров анимации бега
  attack: Texture[];    // Массив кадров анимации атаки
}

/**
 * Интерфейс кадров анимаций для врагов (крипов)
 * Содержит массивы кадров для каждой анимации
 */
interface CreepAssets {
  [animation: string]: Texture[];
  idle: Texture[];      // Массив кадров анимации ожидания
  attack: Texture[];    // Массив кадров анимации атаки
  death: Texture[];     // Массив кадров анимации смерти
}

/**
 * Интерфейс для отслеживания прогресса загрузки ресурсов
 * Используется для отображения пользователю индикатора загрузки
 */
interface LoadingProgress {
  loaded: number;      // Количество загруженных ресурсов
  total: number;       // Общее количество ресурсов
  percentage: number;  // Процент загрузки (0-100)
  currentAsset: string; // Текущий загружаемый ресурс
}

/**
 * Класс-синглтон для управления игровыми ресурсами
 * 
 * Паттерн Singleton обеспечивает единственный экземпляр менеджера
 * по всему приложению, что важно для кэширования ресурсов и
 * эффективного управления памятью
 */
class AssetsManager {
  // Статическая ссылка на единственный экземпляр класса
  private static instance: AssetsManager;
  
  // Объект для хранения загруженных ресурсов
  // Partial<GameAssets> означает, что не все поля обязательно будут заполнены сразу
  private assets: Partial<GameAssets> = {};
  
  // Объект для хранения текущего прогресса загрузки
  private loadingProgress: LoadingProgress = {
    loaded: 0,
    total: 0,
    percentage: 0,
    currentAsset: ''
  };
  
  // Массив функций обратного вызова для уведомления о прогрессе загрузки
  // Позволяет компонентам UI подписаться на обновления прогресса
  private progressCallbacks: ((progress: LoadingProgress) => void)[] = [];
  
  // Флаг, указывающий на завершение загрузки всех ресурсов
  private isLoaded = false;

  // Определенная мощность устройства и выбранный уровень качества
  private devicePower: DevicePower = 'medium';
  private selectedQuality: QualityLevel = 'md';

  /**
   * Статический метод для получения единственного экземпляра менеджера (Singleton)
   * Если экземпляр не существует, он будет создан
   * Этот метод является точкой доступа к менеджеру из любой части приложения
   */
  public static getInstance(): AssetsManager {
    if (!AssetsManager.instance) {
      AssetsManager.instance = new AssetsManager();
    }
    return AssetsManager.instance;
  }

  /**
   * Определение мощности устройства по WebGL характеристикам
   * @returns Мощность устройства: weak/medium/strong
   */
  public detectDevicePower(): DevicePower {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') as WebGLRenderingContext || 
                  canvas.getContext('experimental-webgl') as WebGLRenderingContext;
      
      if (!gl) {
        console.warn('⚠️ WebGL не поддерживается, используем слабую конфигурацию');
        return 'weak';
      }

      const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
      const maxVertexAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS) as number;
      const maxRenderbufferSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) as number;
      


      // Определяем мощность по характеристикам GPU
      if (maxTextureSize >= 8192 && maxVertexAttribs >= 16) {
        return 'strong';   // Дискретная видеокарта
      } else if (maxTextureSize >= 4096 && maxVertexAttribs >= 8) {
        return 'medium';   // Современная интегрированная графика
      } else {
        return 'weak';     // Старая/слабая графика
      }
    } catch (error) {
      console.error('❌ Ошибка определения мощности устройства:', error);
      return 'weak'; // По умолчанию слабая конфигурация
    }
  }

  /**
   * Определение типа устройства для выбора качества спрайт листов
   * @returns Тип устройства: desktop/tablet/smartphone
   */
  public detectDeviceType(): DeviceType {
    try {
      const userAgent = navigator.userAgent.toLowerCase();
      const screenWidth = window.screen.width;
      const screenHeight = window.screen.height;
      const pixelRatio = window.devicePixelRatio || 1;
      
      // Проверяем User Agent на наличие мобильных устройств
      const isMobile = /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const isTablet = /tablet|ipad|playbook|silk/i.test(userAgent);
      
      // Определяем размер экрана
      const smallestDimension = Math.min(screenWidth, screenHeight);
      const largestDimension = Math.max(screenWidth, screenHeight);
      

      
      // Логика определения типа устройства:
      // 1. Сначала проверяем User Agent
      if (isTablet) {

        return 'tablet';
      }
      
      if (isMobile) {
        // Для мобильных устройств дополнительно проверяем размер экрана
        // Смартфоны обычно имеют самую маленькую сторону < 500px
        // Планшеты в портретном режиме могут быть помечены как mobile, но имеют большие размеры
        if (smallestDimension >= 500) {

          return 'tablet';
        } else {

          return 'smartphone';
        }
      }
      
      // 2. Если User Agent не содержит мобильных признаков, анализируем размер экрана
      // Смартфоны: самая маленькая сторона < 500px
      if (smallestDimension < 500) {

        return 'smartphone';
      }
      
      // Планшеты: самая маленькая сторона 500-900px
      if (smallestDimension >= 500 && smallestDimension < 900) {

        return 'tablet';
      }
      
      // ПК/десктопы: все остальные случаи (обычно самая маленькая сторона >= 900px)

      return 'desktop';
      
    } catch (error) {
      console.error('❌ Ошибка определения типа устройства:', error);
      return 'desktop'; // По умолчанию считаем ПК
    }
  }

  /**
   * Определение iOS устройства
   * @returns true если устройство работает на iOS
   */
  private isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.userAgent.includes('Macintosh') && 'ontouchend' in document);
  }

  /**
   * Выбор уровня качества спрайт листов в зависимости от типа устройства и его мощности
   * 
   * Адаптивная логика:
   * - ПК (десктоп): HD качество (с учетом мощности может быть снижено до MD/LD)
   * - Планшет: MD качество (с учетом мощности может быть снижено до LD)
   * - Смартфон: MD качество для мощных устройств с хорошими экранами, иначе LD качество
   * 
   * @param devicePower - мощность устройства
   * @returns Уровень качества: ld/md/hd
   */
  public selectQualityLevel(devicePower: DevicePower): QualityLevel {
    // Определяем тип устройства
    const deviceType = this.detectDeviceType();
    

    
    // Получаем максимальный размер текстуры GPU для проверки ограничений
    let maxTextureSize = 4096; // Безопасное значение по умолчанию
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') as WebGLRenderingContext;
      if (gl) {
        maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
      }
    } catch (error) {
      console.warn('⚠️ Не удалось определить max texture size, используем 4096');
    }
    
    // Максимальные размеры наших спрайт-листов для каждого качества
    const maxSpritesheetSizes = {
      hd: Math.max(7168, 6144, 5120), // Максимальный размер HD спрайт-листов (7168×6144 direCreep idle)
      md: Math.max(3584, 3072, 2560), // Максимальный размер MD спрайт-листов (7×6×512 = 3584×3072)
      ld: Math.max(1792, 1536, 1280)  // Максимальный размер LD спрайт-листов (7×6×256 = 1792×1536)
    };
    
    // Функция проверки поддержки качества по размеру текстуры
    const canSupportQuality = (quality: QualityLevel): boolean => {
      return maxSpritesheetSizes[quality] <= maxTextureSize;
    };
    
    // Определяем максимально доступное качество по размеру текстуры
    let maxSupportedQuality: QualityLevel = 'ld';
    if (canSupportQuality('hd')) {
      maxSupportedQuality = 'hd';
    } else if (canSupportQuality('md')) {
      maxSupportedQuality = 'md';
    } else {
      maxSupportedQuality = 'ld';
    }
    

    
    // Новая логика выбора качества по типу устройства
    let desiredQuality: QualityLevel;
    let qualityReason: string;
    
    switch (deviceType) {
      case 'desktop':
        // ПК (десктоп): стремимся к HD, но учитываем мощность
        if (devicePower === 'strong') {
          desiredQuality = 'hd';
          qualityReason = 'ПК + мощный GPU → HD качество';
        } else if (devicePower === 'medium') {
          desiredQuality = 'hd'; // Попробуем HD, но можем снизить если GPU не потянет
          qualityReason = 'ПК + средний GPU → пробуем HD качество';
        } else {
          desiredQuality = 'md';
          qualityReason = 'ПК + слабый GPU → MD качество';
        }
        break;
        
      case 'tablet':
        // Планшет: стремимся к MD, можем снизить до LD при слабом GPU
        if (devicePower === 'weak') {
          desiredQuality = 'ld';
          qualityReason = 'Планшет + слабый GPU → LD качество';
        } else {
          desiredQuality = 'md';
          qualityReason = 'Планшет + хороший GPU → MD качество';
        }
        break;
        
      case 'smartphone':
        // Смартфон: проверяем возможности устройства для MD качества
        if (devicePower !== 'weak' && canSupportQuality('md')) {
          // Дополнительно проверяем характеристики экрана для обоснованности MD качества
          const screenWidth = window.screen.width;
          const screenHeight = window.screen.height;
          const pixelRatio = window.devicePixelRatio || 1;
          const hasHighDPI = pixelRatio >= 2;
          const hasDecentScreen = Math.min(screenWidth, screenHeight) >= 360; // Современные смартфоны
          
          if ((hasHighDPI || hasDecentScreen) && devicePower === 'strong') {
            desiredQuality = 'md';
            qualityReason = 'Смартфон + мощный GPU + хороший экран → MD качество для четкости';
          } else if (hasHighDPI && devicePower === 'medium') {
            desiredQuality = 'md';
            qualityReason = 'Смартфон + средний GPU + High DPI → MD качество для четкости';
          } else {
            desiredQuality = 'ld';
            qualityReason = 'Смартфон + слабые характеристики → LD качество для производительности';
          }
        } else {
          desiredQuality = 'ld';
          qualityReason = 'Смартфон + слабый GPU или ограничения текстур → LD качество для производительности';
        }
        break;
        
      default:
        // Fallback на средние настройки
        desiredQuality = 'md';
        qualityReason = 'Неизвестное устройство → MD качество по умолчанию';
    }
    
    // Проверяем ограничения iOS (дополнительная безопасность)
    const isIOSDevice = this.isIOS();
    if (isIOSDevice && desiredQuality === 'hd') {

      desiredQuality = 'md';
      qualityReason += ' → снижено до MD (iOS ограничение)';
    }
    
    // Применяем ограничение по максимальному размеру текстуры GPU
    const finalQuality = canSupportQuality(desiredQuality) ? desiredQuality : maxSupportedQuality;
    
    if (finalQuality !== desiredQuality) {

      qualityReason += ` → снижено до ${finalQuality.toUpperCase()} (GPU лимит: ${maxTextureSize}px)`;
    } else {

    }
    

    
    return finalQuality;
  }

  /**
   * Получение выбранного уровня качества для адаптивных спрайт листов
   * @param adaptiveConfig - конфигурация с несколькими уровнями качества
   * @returns Конфигурация спрайт листа для текущего устройства
   */
  public getAdaptiveConfig(adaptiveConfig: AdaptiveSpriteSheetConfig): SpriteSheetConfig {
    return adaptiveConfig[this.selectedQuality];
  }

  /**
   * Получение информации о выбранном качестве
   */
  public getQualityInfo(): { devicePower: DevicePower; quality: QualityLevel; description: string } {
    const descriptions = {
      ld: 'Низкое качество (256×256) - для слабых устройств',
      md: 'Среднее качество (512×512) - для средних устройств', 
      hd: 'Высокое качество (1024×1024) - для мощных устройств'
    };

    return {
      devicePower: this.devicePower,
      quality: this.selectedQuality,
      description: descriptions[this.selectedQuality]
    };
  }

  /**
   * Приватный конструктор для реализации паттерна Singleton
   * Приватный доступ гарантирует, что класс можно инстанцировать только через getInstance()
   */
  private constructor() {
    // Менеджер ресурсов создан
  }

  /**
   * Основной метод для загрузки всех игровых ресурсов
   * 
   * Использует PixiJS Assets API для эффективной загрузки
   * Организует процесс загрузки по категориям ресурсов
   * Отслеживает прогресс и уведомляет подписчиков
   * Автоматически определяет мощность устройства и выбирает оптимальное качество
   */
  public async loadGameAssets(): Promise<void> {
    try {

      // Определяем мощность устройства и выбираем уровень качества
      this.devicePower = this.detectDevicePower();
      this.selectedQuality = this.selectQualityLevel(this.devicePower);
      
      
      // Проверяем ограничения мобильных устройств
      const maxTextureSize = this.detectMaxTextureSize();
      
      // Создаем манифест - структуру, описывающую все ресурсы для загрузки
      const assetManifest = this.createAssetManifest();
      
      // Инициализируем прогресс загрузки
      // Считаем общее количество файлов для загрузки
      this.loadingProgress.total = this.countTotalAssets(assetManifest);
      this.loadingProgress.loaded = 0;
      this.loadingProgress.percentage = 0;
      
      // Отправляем первое уведомление о прогрессе (0%)
      this.notifyProgress();

      // Загружаем ресурсы по категориям для лучшего контроля
      // Используем await для последовательной загрузки, чтобы не перегружать сеть
      await this.loadHeroAssets(assetManifest.heroes);
      await this.loadCreepAssets(assetManifest.creeps);
      await this.loadBackgroundAssets(assetManifest.backgrounds);
      await this.loadUIAssets(assetManifest.ui);
      await this.loadLevelAssets(assetManifest.levels);
      await this.loadHeroIconAssets(assetManifest.heroIcons);

      // Устанавливаем флаг завершения загрузки
      this.isLoaded = true;

      
    } catch (error) {
      // Обработка ошибок загрузки
      console.error('❌ Ошибка загрузки ресурсов:', error);
      throw error; // Пробрасываем ошибку дальше для обработки на уровне выше
    }
  }

  /**
   * Генерирует манифест героев из heroConfig.ts
   * Автоматически адаптирует спрайт листы под мощность устройства
   * 
   * @returns Объект с конфигурациями спрайтшитов всех героев
   */
  private generateHeroManifest(): Record<string, any> {
    const heroManifest: Record<string, any> = {};
    
    // Получаем всех героев из конфигурации
    const heroTypes = getAllHeroTypes();
    
    for (const heroId of heroTypes) {
      const heroConfig = getHeroConfig(heroId);
      
      // Создаем объект анимаций для этого героя
      heroManifest[heroId] = {
        idle: this.resolveAnimationConfig(heroConfig.animations.idle),
        run: this.resolveAnimationConfig(heroConfig.animations.run),
        attack: this.resolveAnimationConfig(heroConfig.animations.attack)
      };
    }
    
    return heroManifest;
  }

  /**
   * Генерирует манифест иконок героев из heroConfig.ts
   * Автоматически извлекает пути к иконкам всех героев
   * 
   * @returns Объект с путями к иконкам всех героев
   */
  private generateHeroIconManifest(): Record<string, string> {
    const heroIconManifest: Record<string, string> = {};
    
    // Получаем всех героев из конфигурации
    const heroTypes = getAllHeroTypes();
    
    for (const heroId of heroTypes) {
      const heroConfig = getHeroConfig(heroId);
      
      // Добавляем путь к иконке героя
      heroIconManifest[heroId] = heroConfig.icon;
    }
    
    return heroIconManifest;
  }

  /**
   * Генерирует манифест крипов из creepsConfig.ts
   * Автоматически адаптирует спрайт листы под мощность устройства
   * 
   * 🧪 ТЕСТОВЫЙ РЕЖИМ iOS: Сейчас загружается только direCreep
   * 
   * Чтобы вернуть загрузку всех крипов:
   * 1. Закомментировать строку: const creepTypes = allCreepTypes.filter(...)
   * 2. Раскомментировать строку: const creepTypes = getAllCreepTypes();
   * 3. Раскомментировать fallbackCreeps в createAssetManifest()
   * 
   * @returns Объект с конфигурациями спрайтшитов всех крипов
   */
  private generateCreepManifest(): Record<string, any> {
    const creepManifest: Record<string, any> = {};
    
    // ВРЕМЕННО: Загружаем только direCreep для тестирования iOS
    // Получаем всех крипов из конфигурации
    const allCreepTypes = getAllCreepTypes();
    
    // Фильтруем только direCreep для тестирования
    const creepTypes = allCreepTypes.filter(creepType => creepType === 'direCreep');
    
    // РАСКОММЕНТИРОВАТЬ КОГДА ВСЕ КРИПЫ БУДУТ ГОТОВЫ:
    // const creepTypes = getAllCreepTypes();
    
    for (const creepType of creepTypes) {
      const creepConfig = getCreepConfig(creepType);
      if (!creepConfig) continue;
      
      // Создаем объект анимаций для этого крипа
      const creepAnimations: Record<string, any> = {};
      
      // Получаем анимации из конфигурации или используем fallback для старых крипов
      const idleConfig = getCreepAnimationConfig(creepType, 'idle');
      const attackConfig = getCreepAnimationConfig(creepType, 'attack');
      const deathConfig = getCreepAnimationConfig(creepType, 'death');
      
      if (idleConfig) {
        creepAnimations.idle = this.resolveAnimationConfig(idleConfig);
      }
      if (attackConfig) {
        creepAnimations.attack = this.resolveAnimationConfig(attackConfig);
      }
      if (deathConfig) {
        creepAnimations.death = this.resolveAnimationConfig(deathConfig);
      }
      
      // Если есть анимации, добавляем в манифест
      if (Object.keys(creepAnimations).length > 0) {
        creepManifest[creepType] = creepAnimations;
      }
    }
    

    
    return creepManifest;
  }

  /**
   * Разрешает конфигурацию анимации - выбирает подходящий уровень качества
   * для адаптивных спрайт листов или возвращает обычную конфигурацию
   * 
   * @param config - конфигурация анимации (обычная или адаптивная)
   * @returns Конкретная конфигурация спрайт листа для текущего устройства
   */
  private resolveAnimationConfig(config: SpriteSheetConfig | AdaptiveSpriteSheetConfig): SpriteSheetConfig {
    // Проверяем, является ли конфигурация адаптивной
    if (this.isAdaptiveConfig(config)) {
      // Возвращаем конфигурацию соответствующую мощности устройства
      return this.getAdaptiveConfig(config);
    } else {
      // Возвращаем обычную конфигурацию как есть
      return config;
    }
  }

  /**
   * Проверяет, является ли конфигурация адаптивной
   * 
   * @param config - конфигурация для проверки
   * @returns true если конфигурация адаптивная, false если обычная
   */
  private isAdaptiveConfig(config: SpriteSheetConfig | AdaptiveSpriteSheetConfig): config is AdaptiveSpriteSheetConfig {
    // Адаптивная конфигурация имеет свойства ld, md, hd вместо path, frameWidth и т.д.
    return 'ld' in config && 'md' in config && 'hd' in config;
  }

  /**
   * Создание манифеста всех игровых ресурсов
   * 
   * Манифест описывает какие файлы нужно загрузить и где они находятся
   * Структура путей основана на папке public/media/
   * 
   * @returns Объект, описывающий все пути к ресурсам
   */
  private createAssetManifest() {
    // Генерируем манифест крипов автоматически из creepsConfig.ts
    const creepManifest = this.generateCreepManifest();
    
    // Добавляем fallback для крипов без адаптивных спрайт-листов
    const fallbackCreeps = {
        // ВРЕМЕННО ЗАКОММЕНТИРОВАНО ДЛЯ ТЕСТИРОВАНИЯ iOS:
        // Раскомментировать когда все крипы будут готовы в разных качествах
        
        /*
        medved: {
          idle: {
            path: '/media/game/assets/creeps/medved_idle.png',
            frameWidth: 1024,
            frameHeight: 1024,
            framesX: 6,
            framesY: 5,
            totalFrames: 27
          },
          attack: {
            path: '/media/game/assets/creeps/medved_attack.png',
            frameWidth: 1024,
            frameHeight: 1024,
            framesX: 5,
            framesY: 5,
            totalFrames: 21
          },
          death: {
            path: '/media/game/assets/creeps/medved_death.png',
            frameWidth: 1024,
            frameHeight: 1024,
            framesX: 5,
            framesY: 5,
            totalFrames: 21
          }
        },
        satyr: {
          idle: {
            path: '/media/game/assets/creeps/satyr_idle.png',
            frameWidth: 512,
            frameHeight: 512,
            framesX: 7,
            framesY: 6,
            totalFrames: 40
          },
          attack: {
            path: '/media/game/assets/creeps/satyr_attack.png',
            frameWidth: 512,
            frameHeight: 512,
            framesX: 5,
            framesY: 5,
            totalFrames: 23
          },
          death: {
            path: '/media/game/assets/creeps/satyr_death.png',
            frameWidth: 512,
            frameHeight: 512,
            framesX: 6,
            framesY: 5,
            totalFrames: 30
          }
        },
        shishka: {
          idle: {
            path: '/media/game/assets/creeps/shishka_idle.png',
            frameWidth: 1024,
            frameHeight: 1024,
            framesX: 5,
            framesY: 5,
            totalFrames: 24
          },
          attack: {
            path: '/media/game/assets/creeps/shishka_attack.png',
            frameWidth: 1024,
            frameHeight: 1024,
            framesX: 6,
            framesY: 5,
            totalFrames: 27
          },
          death: {
            path: '/media/game/assets/creeps/shishka_death.png',
            frameWidth: 1024,
            frameHeight: 1024,
            framesX: 5,
            framesY: 6,
            totalFrames: 27
          }
        },
        voul: {
          idle: {
            path: '/media/game/assets/creeps/voul_idle.png',
            frameWidth: 1024,
            frameHeight: 1024,
            framesX: 5,
            framesY: 7,
            totalFrames: 34
          },
          attack: {
            path: '/media/game/assets/creeps/voul_attack.png',
            frameWidth: 1024,
            frameHeight: 1024,
            framesX: 5,
            framesY: 5,
            totalFrames: 25
          },
          death: {
            path: '/media/game/assets/creeps/voul_death.png',
            frameWidth: 1024,
            frameHeight: 1024,
            framesX: 4,
            framesY: 8,
            totalFrames: 31
          }
        },
        wolf: {
          idle: {
            path: '/media/game/assets/creeps/wolf_idle.png',
            frameWidth: 1024,
            frameHeight: 1024,
            framesX: 5,
            framesY: 5,
            totalFrames: 23
          },
          attack: {
            path: '/media/game/assets/creeps/wolf_attack.png',
            frameWidth: 1024,
            frameHeight: 1024,
            framesX: 7,
            framesY: 3,
            totalFrames: 21
          },
          death: {
            path: '/media/game/assets/creeps/wolf_death.png',
            frameWidth: 1024,
            frameHeight: 1024,
            framesX: 3,
            framesY: 6,
            totalFrames: 18
          }
        }
        */
    };
    
    // Объединяем автоматически сгенерированные конфигурации с fallback
    const finalCreepManifest = { ...creepManifest, ...fallbackCreeps };
    

    return {
      // Ресурсы героев - автоматически генерируются из heroConfig.ts
      heroes: this.generateHeroManifest(),
      
      // Ресурсы врагов (крипов) - автоматически из creepsConfig.ts + fallback
      creeps: finalCreepManifest,
      
      // Фоновые изображения для игровых локаций
      backgrounds: {
        forest: '/media/game/images/forest_background.png'
      },
      
      // Элементы пользовательского интерфейса
      ui: {
        gold: '/media/shop/images/gold.png',
        health: '/media/shop/main/health.png',
        mana: '/media/shop/main/mana.png'
      },
      
      // Значки уровней для HUD
      levels: {
        bronze: '/media/game/assets/levels/bronze.jpg',
        silver: '/media/game/assets/levels/silver.webp',
        gold: '/media/game/assets/levels/gold.JPG',
        platinum: '/media/game/assets/levels/platinum.webp',
        master: '/media/game/assets/levels/master.webp',
        grandmaster: '/media/game/assets/levels/grandmaster.webp'
      },
      
      // Иконки героев для прогресс-бара - автоматически генерируются из heroConfig.ts
      heroIcons: this.generateHeroIconManifest()
    };
  }

  /**
   * Подсчет общего количества ресурсов в манифесте
   * Используется для инициализации прогресса загрузки
   * 
   * @param manifest - Манифест ресурсов
   * @returns Общее количество файлов для загрузки
   */
  private countTotalAssets(manifest: any): number {
    let count = 0;
    
    // Рекурсивная функция для подсчета всех строковых значений в объекте
    // Каждое строковое значение считается как путь к файлу для загрузки
    const countInObject = (obj: any) => {
      Object.values(obj).forEach(value => {
        if (typeof value === 'string') {
          count++; // Это путь к файлу, увеличиваем счетчик
        } else if (typeof value === 'object') {
          countInObject(value); // Рекурсивно считаем вложенные объекты
        }
      });
    };
    
    countInObject(manifest);
    return count;
  }

  /**
   * Создание кадров анимации из спрайтшита
   * 
   * Разбивает спрайтшит на отдельные текстуры кадров для анимации
   * 
   * @param spritesheet - загруженная текстура спрайтшита
   * @param config - конфигурация разбивки спрайтшита
   * @returns Массив текстур кадров
   */
  private createFrameTextures(spritesheet: Texture, config: SpriteSheetConfig): Texture[] {
    const frames: Texture[] = [];

    
    // Создаем текстуру для каждого кадра
    for (let i = 0; i < config.totalFrames; i++) {
      // Вычисляем позицию кадра в сетке спрайтшита
      const x = (i % config.framesX) * config.frameWidth;
      const y = Math.floor(i / config.framesX) * config.frameHeight;
      
      // Создаем новую текстуру для кадра
      const frameTexture = new Texture({
        source: spritesheet.source,
        frame: new Rectangle(x, y, config.frameWidth, config.frameHeight)
      });
      
      frames.push(frameTexture);
    }
    

    return frames;
  }

  /**
   * Загрузка ресурсов героев
   * 
   * @param heroManifest - Объект с конфигурациями спрайтшитов героев
   */
  private async loadHeroAssets(heroManifest: any): Promise<void> {

    
    // Инициализируем объект для хранения ресурсов героев
    this.assets.heroes = {};
    
    // Перебираем всех героев в манифесте
    for (const [heroName, heroPaths] of Object.entries(heroManifest)) {
      this.loadingProgress.currentAsset = `Герой: ${heroName}`;
      this.notifyProgress();
      
      // Создаем объект для хранения кадров анимаций героя
      const heroAssets: HeroAssets = {} as HeroAssets;
      
      // Загружаем каждую анимацию героя
      for (const [animName, config] of Object.entries(heroPaths as any)) {
        try {
          // Обновляем информацию о текущем загружаемом ресурсе
          this.loadingProgress.currentAsset = `${heroName} - ${animName}`;
          this.notifyProgress();
          
          // Загружаем спрайтшит
          const spritesheet = await Assets.load((config as SpriteSheetConfig).path);
          
          // Разбиваем спрайтшит на кадры
          const frames = this.createFrameTextures(spritesheet, config as SpriteSheetConfig);
          heroAssets[animName] = frames;
          
          // Увеличиваем счетчик загруженных ресурсов
          this.incrementProgress();
          
  
          
        } catch (error) {
          // В случае ошибки загрузки, используем белую текстуру как запасной вариант
          console.error(`❌ Ошибка загрузки ${(config as SpriteSheetConfig).path}:`, error);
          heroAssets[animName] = [Texture.WHITE]; // Fallback - массив с одной белой текстурой
          this.incrementProgress();
        }
      }
      
      // Сохраняем загруженные кадры героя в общий объект ресурсов
      this.assets.heroes![heroName] = heroAssets;
    }
  }

  /**
   * Загрузка ресурсов врагов (крипов)
   * Принцип работы аналогичен loadHeroAssets
   * 
   * @param creepManifest - Объект с конфигурациями спрайтшитов врагов
   */
  private async loadCreepAssets(creepManifest: any): Promise<void> {

    
    // Инициализируем объект для хранения ресурсов врагов
    this.assets.creeps = {};
    
    // Перебираем всех врагов в манифесте
    for (const [creepName, creepPaths] of Object.entries(creepManifest)) {
      this.loadingProgress.currentAsset = `Враг: ${creepName}`;
      this.notifyProgress();
      
      // Создаем объект для хранения кадров анимаций врага
      const creepAssets: CreepAssets = {} as CreepAssets;
      
      // Загружаем каждую анимацию врага
      for (const [animName, config] of Object.entries(creepPaths as any)) {
        try {
          this.loadingProgress.currentAsset = `${creepName} - ${animName}`;
          this.notifyProgress();
          
          // Загружаем спрайтшит и создаем кадры
          const spritesheet = await Assets.load((config as SpriteSheetConfig).path);
          const frames = this.createFrameTextures(spritesheet, config as SpriteSheetConfig);
          creepAssets[animName] = frames;
          
          this.incrementProgress();
          
  
          
        } catch (error) {
          console.error(`❌ Ошибка загрузки ${(config as SpriteSheetConfig).path}:`, error);
          creepAssets[animName] = [Texture.WHITE];
          this.incrementProgress();
        }
      }
      
      // Сохраняем загруженные кадры врага в общий объект ресурсов
      this.assets.creeps![creepName] = creepAssets;
    }
  }

  /**
   * Загрузка фоновых изображений
   * 
   * @param bgManifest - Объект с путями к фоновым изображениям
   */
  private async loadBackgroundAssets(bgManifest: any): Promise<void> {

    
    // Инициализируем объект для хранения фоновых изображений
    this.assets.backgrounds = {} as GameAssets['backgrounds'];
    
    // Перебираем все фоны в манифесте
    for (const [bgName, path] of Object.entries(bgManifest)) {
      try {
        this.loadingProgress.currentAsset = `Фон: ${bgName}`;
        this.notifyProgress();
        
        // Загружаем текстуру фона
        const texture = await Assets.load(path as string);
        this.assets.backgrounds[bgName] = texture;
        
        this.incrementProgress();
        

        
      } catch (error) {
        // При ошибке используем белую текстуру как запасной вариант
        console.error(`❌ Ошибка загрузки фона ${path}:`, error);
        this.assets.backgrounds[bgName] = Texture.WHITE;
        this.incrementProgress();
      }
    }
  }

  /**
   * Загрузка элементов пользовательского интерфейса
   * 
   * @param uiManifest - Объект с путями к UI элементам
   */
  private async loadUIAssets(uiManifest: any): Promise<void> {

    
    // Инициализируем объект для хранения UI элементов
    this.assets.ui = {} as GameAssets['ui'];
    
    // Перебираем все UI элементы в манифесте
    for (const [uiName, path] of Object.entries(uiManifest)) {
      try {
        this.loadingProgress.currentAsset = `UI: ${uiName}`;
        this.notifyProgress();
        
        // Загружаем текстуру UI элемента
        const texture = await Assets.load(path as string);
        this.assets.ui[uiName] = texture;
        
        this.incrementProgress();
        

        
      } catch (error) {
        console.error(`❌ Ошибка загрузки UI ${path}:`, error);
        this.assets.ui[uiName] = Texture.WHITE;
        this.incrementProgress();
      }
    }
  }

  /**
   * Загрузка значков уровней для HUD
   * 
   * @param levelManifest - Объект с путями к значкам уровней
   */
  private async loadLevelAssets(levelManifest: any): Promise<void> {

    
    // Инициализируем объект для хранения значков уровней
    this.assets.levels = {} as GameAssets['levels'];
    
    // Перебираем все значки уровней в манифесте
    for (const [levelName, path] of Object.entries(levelManifest)) {
      try {
        this.loadingProgress.currentAsset = `Уровень: ${levelName}`;
        this.notifyProgress();
        
        // Загружаем текстуру значка уровня
        const texture = await Assets.load(path as string);
        this.assets.levels[levelName] = texture;
        
        this.incrementProgress();
        

        
      } catch (error) {
        console.error(`❌ Ошибка загрузки значка уровня ${path}:`, error);
        this.assets.levels[levelName] = Texture.WHITE;
        this.incrementProgress();
      }
    }
  }

  /**
   * Загрузка иконок героев для прогресс-бара
   * 
   * @param heroIconManifest - Объект с путями к иконкам героев
   */
  private async loadHeroIconAssets(heroIconManifest: any): Promise<void> {

    
    // Инициализируем объект для хранения иконок героев
    this.assets.heroIcons = {} as GameAssets['heroIcons'];
    
    // Перебираем все иконки героев в манифесте
    for (const [heroName, path] of Object.entries(heroIconManifest)) {
      try {
        this.loadingProgress.currentAsset = `Иконка героя: ${heroName}`;
        this.notifyProgress();
        
        // Загружаем текстуру иконки героя
        const texture = await Assets.load(path as string);
        this.assets.heroIcons[heroName] = texture;
        
        this.incrementProgress();
        

        
      } catch (error) {
        console.error(`❌ Ошибка загрузки иконки героя ${path}:`, error);
        this.assets.heroIcons[heroName] = Texture.WHITE;
        this.incrementProgress();
      }
    }
  }

  /**
   * Увеличение счетчика загруженных ресурсов
   * Вызывается после успешной загрузки каждого ресурса
   */
  private incrementProgress(): void {
    // Увеличиваем счетчик загруженных ресурсов
    this.loadingProgress.loaded++;
    
    // Вычисляем процент загрузки и округляем до целого числа
    this.loadingProgress.percentage = Math.round(
      (this.loadingProgress.loaded / this.loadingProgress.total) * 100
    );
    
    // Уведомляем подписчиков о новом прогрессе
    this.notifyProgress();
  }

  /**
   * Уведомление подписчиков о прогрессе загрузки
   * Вызывает все зарегистрированные колбэки с текущим прогрессом
   */
  private notifyProgress(): void {
    // Для каждого подписанного колбэка отправляем копию объекта прогресса
    this.progressCallbacks.forEach(callback => {
      callback({ ...this.loadingProgress }); // Передаем копию объекта, чтобы избежать мутаций
    });
  }

  // =============================================================================
  // ПУБЛИЧНЫЕ МЕТОДЫ ДЛЯ ПОЛУЧЕНИЯ РЕСУРСОВ
  // =============================================================================

  /**
   * Получение кадров анимации героя
   * 
   * @param heroName - имя героя (например, 'juggernaut')
   * @param animation - тип анимации ('idle', 'run', 'attack')
   * @returns Массив текстур кадров или fallback
   */
  public getHeroFrames(heroName: string, animation: string): Texture[] {
    const heroAssets = this.assets.heroes?.[heroName];
    if (heroAssets && heroAssets[animation]) {
      return heroAssets[animation];
    }
    

    return [Texture.WHITE]; // Fallback - массив с одной белой текстурой
  }

  /**
   * Получение первого кадра анимации героя (для обратной совместимости)
   * 
   * @param heroName - имя героя (например, 'juggernaut')
   * @param animation - тип анимации ('idle', 'run', 'attack')
   * @returns Первый кадр анимации или fallback
   */
  public getHeroTexture(heroName: string, animation: string): Texture {
    const frames = this.getHeroFrames(heroName, animation);
    return frames[0] || Texture.WHITE;
  }

  /**
   * Получение кадров анимации врага
   */
  public getCreepFrames(creepName: string, animation: string): Texture[] {
    const creepAssets = this.assets.creeps?.[creepName];
    if (creepAssets && creepAssets[animation]) {
      return creepAssets[animation];
    }
    

    return [Texture.WHITE];
  }

  /**
   * Получение первого кадра анимации врага (для обратной совместимости)
   */
  public getCreepTexture(creepName: string, animation: string): Texture {
    const frames = this.getCreepFrames(creepName, animation);
    return frames[0] || Texture.WHITE;
  }

  /**
   * Получение фоновой текстуры
   * 
   * @param bgName - имя фона (например, 'forest')
   * @returns Texture или fallback в случае отсутствия текстуры
   */
  public getBackgroundTexture(bgName: string): Texture {
    const bgTexture = this.assets.backgrounds?.[bgName];
    if (bgTexture) {
      return bgTexture;
    }
    

    return Texture.WHITE;
  }

  /**
   * Получение UI текстуры
   * 
   * @param uiName - имя UI элемента (например, 'gold')
   * @returns Texture или fallback в случае отсутствия текстуры
   */
  public getUITexture(uiName: string): Texture {
    const uiTexture = this.assets.ui?.[uiName];
    if (uiTexture) {
      return uiTexture;
    }
    

    return Texture.WHITE;
  }

  /**
   * Получение значка уровня
   * 
   * @param levelName - имя уровня (например, 'bronze', 'silver')
   * @returns Texture или fallback в случае отсутствия текстуры
   */
  public getLevelTexture(levelName: string): Texture {
    const levelTexture = this.assets.levels?.[levelName];
    if (levelTexture) {
      return levelTexture;
    }
    

    return Texture.WHITE;
  }

  /**
   * Получение иконки героя для прогресс-бара
   * 
   * @param heroName - имя героя (например, 'juggernaut')
   * @returns Texture или fallback в случае отсутствия текстуры
   */
  public getHeroIconTexture(heroName: string): Texture {
    const heroIconTexture = this.assets.heroIcons?.[heroName];
    if (heroIconTexture) {
      return heroIconTexture;
    }
    

    return Texture.WHITE;
  }

  /**
   * Подписка на обновления прогресса загрузки
   * Позволяет компонентам UI получать уведомления о прогрессе
   * 
   * @param callback - функция, которая будет вызываться при изменении прогресса
   */
  public onProgress(callback: (progress: LoadingProgress) => void): void {
    // Добавляем колбэк в массив подписчиков
    this.progressCallbacks.push(callback);
    
    // Сразу вызываем колбэк с текущим прогрессом, чтобы инициализировать UI
    callback({ ...this.loadingProgress });
  }

  /**
   * Отписка от обновлений прогресса
   * Важно вызывать при удалении компонента, чтобы избежать утечек памяти
   * 
   * @param callback - функция, которую нужно удалить из подписчиков
   */
  public offProgress(callback: (progress: LoadingProgress) => void): void {
    // Находим индекс колбэка в массиве
    const index = this.progressCallbacks.indexOf(callback);
    
    // Если колбэк найден, удаляем его
    if (index > -1) {
      this.progressCallbacks.splice(index, 1);
    }
  }

  /**
   * Проверка завершения загрузки всех ресурсов
   * 
   * @returns true если все ресурсы загружены, иначе false
   */
  public getIsLoaded(): boolean {
    return this.isLoaded;
  }

  /**
   * Получение текущего прогресса загрузки
   * 
   * @returns объект с информацией о прогрессе загрузки
   */
  public getProgress(): LoadingProgress {
    // Возвращаем копию объекта прогресса, чтобы избежать мутаций
    return { ...this.loadingProgress };
  }

  /**
   * Определение максимального размера текстуры устройства
   * 
   * Используется для адаптации под ограничения мобильных устройств
   * @returns Максимальный размер текстуры в пикселях
   */
  private detectMaxTextureSize(): number {
    try {
      // Создаем временный canvas для получения WebGL контекста
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') as WebGLRenderingContext || 
                  canvas.getContext('experimental-webgl') as WebGLRenderingContext;
      
      if (gl) {
        const maxSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
        
        // Предупреждение для устройств с ограничениями
        if (maxSize < 4096) {
          console.warn('⚠️ Устройство поддерживает ограниченный размер текстур!');
          console.warn(`   Максимум: ${maxSize}x${maxSize}, но спрайтшиты крипов: 8192x7168`);
          console.warn('   Некоторые спрайты могут отображаться как черные квадраты');
        }
        
        return maxSize;
      } else {
        console.warn('⚠️ WebGL недоступен, используем безопасное значение: 2048x2048');
        return 2048; // Безопасное значение для старых устройств
      }
    } catch (error) {
      console.warn('⚠️ Ошибка определения размера текстуры:', error);
      return 2048; // Безопасное значение
    }
  }
}

// Создаем и экспортируем единственный экземпляр менеджера ресурсов
// Это позволяет импортировать его в любом месте приложения
export const assetsManager = AssetsManager.getInstance();

// Экспортируем тип для использования в других файлах
export type { LoadingProgress };