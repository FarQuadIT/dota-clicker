/**
 * Менеджер ресурсов для игры Dota Clicker
 * 
 * Принципы работы:
 * 1. Загружает все игровые ресурсы (текстуры, звуки, спрайтшиты)
 * 2. Кэширует загруженные ресурсы для быстрого доступа
 * 3. Разбивает спрайтшиты на отдельные кадры для анимаций
 * 4. Предоставляет информацию о прогрессе загрузки
 * 5. Использует PixiJS Assets API для оптимальной загрузки
 * 
 * Документация: 
 * - PixiJS Assets: https://pixijs.download/release/docs/assets.Assets.html
 * - В all_pixijs_content.txt раздел "Assets"
 */

import { Assets, Texture, Rectangle } from 'pixi.js';

// ==================================================================================
// ТИПЫ ДАННЫХ ДЛЯ МЕНЕДЖЕРА РЕСУРСОВ
// ==================================================================================

/**
 * Конфигурация спрайтшита для анимации
 */
interface SpriteSheetConfig {
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
   */
  public async loadGameAssets(): Promise<void> {
    try {

      
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

      // Устанавливаем флаг завершения загрузки
      this.isLoaded = true;

      
    } catch (error) {
      // Обработка ошибок загрузки
      console.error('❌ Ошибка загрузки ресурсов:', error);
      throw error; // Пробрасываем ошибку дальше для обработки на уровне выше
    }
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
    return {
      // Ресурсы героев - конфигурации спрайтшитов для разных анимаций
      heroes: {
        juggernaut: {
          idle: {
            path: '/media/game/assets/heroes/juggernaut_idle.png',
            frameWidth: 512,
            frameHeight: 512,
            framesX: 6,
            framesY: 6,
            totalFrames: 35
          },
          run: {
            path: '/media/game/assets/heroes/juggernaut_run.png',
            frameWidth: 512,
            frameHeight: 512,
            framesX: 7,
            framesY: 3,
            totalFrames: 21
          },
          attack: {
            path: '/media/game/assets/heroes/juggernaut_attack.png',
            frameWidth: 512,
            frameHeight: 512,
            framesX: 6,
            framesY: 5,
            totalFrames: 30
          }
        }
      },
      
      // Ресурсы врагов (крипов) - конфигурации спрайтшитов для разных анимаций
      creeps: {
        direCreep: {
          idle: {
            path: '/media/game/assets/creeps/dire_creep_idle.png',
            frameWidth: 1024,
            frameHeight: 1024,
            framesX: 8,
            framesY: 7,
            totalFrames: 52
          },
          attack: {
            path: '/media/game/assets/creeps/dire_creep_attack.png',
            frameWidth: 1024,
            frameHeight: 1024,
            framesX: 6,
            framesY: 5,
            totalFrames: 29
          },
          death: {
            path: '/media/game/assets/creeps/dire_creep_death.png',
            frameWidth: 1024,
            frameHeight: 1024,
            framesX: 6,
            framesY: 5,
            totalFrames: 29
          }
        },
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
      },
      
      // Фоновые изображения для игровых локаций
      backgrounds: {
        forest: '/media/game/images/forest_background.png'
      },
      
      // Элементы пользовательского интерфейса
      ui: {
        gold: '/media/shop/images/gold.png',
        health: '/media/shop/main/health.png',
        mana: '/media/shop/main/mana.png'
      }
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
    
    console.warn(`⚠️ Кадры анимации героя не найдены: ${heroName}.${animation}`);
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
    
    console.warn(`⚠️ Кадры анимации врага не найдены: ${creepName}.${animation}`);
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
    
    console.warn(`⚠️ Фоновая текстура не найдена: ${bgName}`);
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
    
    console.warn(`⚠️ UI текстура не найдена: ${uiName}`);
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
}

// Создаем и экспортируем единственный экземпляр менеджера ресурсов
// Это позволяет импортировать его в любом месте приложения
export const assetsManager = AssetsManager.getInstance();

// Экспортируем тип для использования в других файлах
export type { LoadingProgress };