/**
 * Менеджер ресурсов для игры Dota Clicker
 * 
 * Принципы работы:
 * 1. Загружает все игровые ресурсы (текстуры, звуки, спрайтшиты)
 * 2. Кэширует загруженные ресурсы для быстрого доступа
 * 3. Предоставляет информацию о прогрессе загрузки
 * 4. Использует PixiJS Assets API для оптимальной загрузки
 * 
 * Документация: 
 * - PixiJS Assets: https://pixijs.download/release/docs/assets.Assets.html
 * - В all_pixijs_content.txt раздел "Assets"
 */

import { Assets, Texture } from 'pixi.js';

// ==================================================================================
// ТИПЫ ДАННЫХ ДЛЯ МЕНЕДЖЕРА РЕСУРСОВ
// ==================================================================================

/**
 * Основной интерфейс для всех игровых ресурсов
 * Структурирует ресурсы по категориям для организованного доступа
 */
interface GameAssets {
  // Текстуры персонажей
      /**
     * Индексная сигнатура, позволяющая хранить героев с любым именем
     * 
     * Пример практического использования:
     * 
     * // Добавление нового героя в игру
     * this.assets.heroes["axe"] = { 
     *   idle: axeIdleTexture, 
     *   run: axeRunTexture, 
     *   attack: axeAttackTexture 
     * };
     * 
     * // Доступ к текстурам героя по строковому ключу (например, из конфига)
     * const heroTexture = this.assets.heroes[heroConfig.name].idle;
     */
  heroes: {
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
 * Интерфейс текстур для героев
 * Содержит набор анимаций с их текстурами
 * Индексная сигнатура [animation: string] позволяет доступ по строковому ключу
 */
interface HeroAssets {
  [animation: string]: Texture;
  idle: Texture;      // Анимация ожидания
  run: Texture;       // Анимация бега
  attack: Texture;    // Анимация атаки
}

/**
 * Интерфейс текстур для врагов (крипов)
 * Содержит набор анимаций с их текстурами
 * Индексная сигнатура позволяет доступ по строковому ключу
 */
interface CreepAssets {
  [animation: string]: Texture;
  idle: Texture;      // Анимация ожидания
  attack: Texture;    // Анимация атаки
  death: Texture;     // Анимация смерти
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
    console.log('🎨 Создание менеджера ресурсов');
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
      console.log('📦 Начинаем загрузку игровых ресурсов...');
      
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
      console.log('✅ Все ресурсы загружены успешно');
      
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
      // Ресурсы героев - пути к изображениям для разных анимаций
      heroes: {
        juggernaut: {
          idle: '/media/game/assets/heroes/juggernaut_idle.png',
          run: '/media/game/assets/heroes/juggernaut_run.png', 
          attack: '/media/game/assets/heroes/juggernaut_attack.png'
        }
      },
      
      // Ресурсы врагов (крипов) - пути к изображениям для разных анимаций
      creeps: {
        direCreep: {
          idle: '/media/game/assets/creeps/dire_creep_idle.png',
          attack: '/media/game/assets/creeps/dire_creep_attack.png',
          death: '/media/game/assets/creeps/dire_creep_death.png'
        },
        wolf: {
          idle: '/media/game/assets/creeps/wolf_idle.png',
          attack: '/media/game/assets/creeps/wolf_attack.png', 
          death: '/media/game/assets/creeps/wolf_death.png'
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
   * Загрузка ресурсов героев
   * 
   * @param heroManifest - Объект с путями к ресурсам героев
   */
  private async loadHeroAssets(heroManifest: any): Promise<void> {
    console.log('🦸 Загружаем ресурсы героев...');
    
    // Инициализируем объект для хранения ресурсов героев
    this.assets.heroes = {};
    
    // Перебираем всех героев в манифесте
    for (const [heroName, heroPaths] of Object.entries(heroManifest)) {
      this.loadingProgress.currentAsset = `Герой: ${heroName}`;
      this.notifyProgress();
      
      // Создаем объект для хранения текстур анимаций героя
      const heroAssets: HeroAssets = {} as HeroAssets;
      
      // Загружаем каждую анимацию героя
      for (const [animName, path] of Object.entries(heroPaths as any)) {
        try {
          // Обновляем информацию о текущем загружаемом ресурсе
          this.loadingProgress.currentAsset = `${heroName} - ${animName}`;
          this.notifyProgress();
          
          // Используем Assets.load() из PixiJS для загрузки текстуры
          // Это асинхронная операция, поэтому используем await
          const texture = await Assets.load(path as string);
          heroAssets[animName] = texture;
          
          // Увеличиваем счетчик загруженных ресурсов
          this.incrementProgress();
          
          console.log(`✅ Загружена анимация ${animName} для героя ${heroName}`);
          
        } catch (error) {
          // В случае ошибки загрузки, используем белую текстуру как запасной вариант
          console.error(`❌ Ошибка загрузки ${path}:`, error);
          heroAssets[animName] = Texture.WHITE; // Texture.WHITE - пустая белая текстура из PixiJS
          this.incrementProgress();
        }
      }
      
      // Сохраняем загруженные текстуры героя в общий объект ресурсов
      this.assets.heroes![heroName] = heroAssets;
    }
  }

  /**
   * Загрузка ресурсов врагов (крипов)
   * Принцип работы аналогичен loadHeroAssets
   * 
   * @param creepManifest - Объект с путями к ресурсам врагов
   */
  private async loadCreepAssets(creepManifest: any): Promise<void> {
    console.log('👹 Загружаем ресурсы врагов...');
    
    // Инициализируем объект для хранения ресурсов врагов
    this.assets.creeps = {};
    
    // Перебираем всех врагов в манифесте
    for (const [creepName, creepPaths] of Object.entries(creepManifest)) {
      this.loadingProgress.currentAsset = `Враг: ${creepName}`;
      this.notifyProgress();
      
      // Создаем объект для хранения текстур анимаций врага
      const creepAssets: CreepAssets = {} as CreepAssets;
      
      // Загружаем каждую анимацию врага
      for (const [animName, path] of Object.entries(creepPaths as any)) {
        try {
          this.loadingProgress.currentAsset = `${creepName} - ${animName}`;
          this.notifyProgress();
          
          // Загружаем текстуру и сохраняем её
          const texture = await Assets.load(path as string);
          creepAssets[animName] = texture;
          
          this.incrementProgress();
          
          console.log(`✅ Загружена анимация ${animName} для врага ${creepName}`);
          
        } catch (error) {
          console.error(`❌ Ошибка загрузки ${path}:`, error);
          creepAssets[animName] = Texture.WHITE;
          this.incrementProgress();
        }
      }
      
      // Сохраняем загруженные текстуры врага в общий объект ресурсов
      this.assets.creeps![creepName] = creepAssets;
    }
  }

  /**
   * Загрузка фоновых изображений
   * 
   * @param bgManifest - Объект с путями к фоновым изображениям
   */
  private async loadBackgroundAssets(bgManifest: any): Promise<void> {
    console.log('🌲 Загружаем фоновые изображения...');
    
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
        
        console.log(`✅ Загружен фон ${bgName}`);
        
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
    console.log('🎮 Загружаем UI элементы...');
    
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
        
        console.log(`✅ Загружен UI элемент ${uiName}`);
        
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
   * Получение текстуры героя
   * 
   * @param heroName - имя героя (например, 'juggernaut')
   * @param animation - тип анимации ('idle', 'run', 'attack')
   * @returns Texture или fallback в случае отсутствия текстуры
   */
  public getHeroTexture(heroName: string, animation: string): Texture {
    // Получаем объект с текстурами для указанного героя
    const heroAssets = this.assets.heroes?.[heroName];
    
    // Проверяем, существует ли герой и требуемая анимация
    if (heroAssets && heroAssets[animation]) {
      return heroAssets[animation];
    }
    
    // Если текстура не найдена, выводим предупреждение и возвращаем белую текстуру
    console.warn(`⚠️ Текстура героя не найдена: ${heroName}.${animation}`);
    return Texture.WHITE; // Fallback - белая текстура
  }

  /**
   * Получение текстуры врага
   * 
   * @param creepName - имя врага (например, 'direCreep')
   * @param animation - тип анимации ('idle', 'attack', 'death')
   * @returns Texture или fallback в случае отсутствия текстуры
   */
  public getCreepTexture(creepName: string, animation: string): Texture {
    const creepAssets = this.assets.creeps?.[creepName];
    if (creepAssets && creepAssets[animation]) {
      return creepAssets[animation];
    }
    
    console.warn(`⚠️ Текстура врага не найдена: ${creepName}.${animation}`);
    return Texture.WHITE;
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