/**
 * Конфигурация типов героев для системы игры
 * 
 * Определяет индивидуальные характеристики каждого типа героя:
 * - Визуальные параметры (масштаб, позиция)
 * - Конфигурации спрайт-листов для анимаций
 * - Звуковые эффекты
 * - Скорость анимаций
 * 
 * По аналогии с creepsConfig.ts для легкого добавления новых героев
 */

// Импорт интерфейса для спрайт-листов
import type { SpriteSheetConfig, AdaptiveSpriteSheetConfig } from '../managers/AssetsManager';
import { GAME_CONFIG } from './GameConfig';

// ==================================================================================
// ИНТЕРФЕЙСЫ
// ==================================================================================

/**
 * Интерфейс конфигурации типа героя
 */
export interface HeroTypeConfig {
  /** Числовой ID героя для работы с API (1, 2, 3...) */
  hero_id: number;
  
  /** Техническое имя героя ("juggernaut", "centaur") */
  hero_name: string;
  
  /** Уникальный идентификатор героя (для обратной совместимости) */
  id: string;
  
  /** Отображаемое имя героя */
  name: string;
  
  /** Описание героя */
  description: string;
  
  // === ВИЗУАЛЬНЫЕ ПАРАМЕТРЫ ===
  
  /** Базовый масштаб героя (например, 0.3 для Джаггернаута) */
  scale: number;
  
  /** Позиция по X относительно ширины экрана (0-1) */
  positionX: number;
  
  /** Позиция по Y относительно высоты экрана (0-1) */
  positionY: number;
  
  /** Зона коллизии - множитель для расстояния обнаружения крипов (1.0 = стандартная) */
  collisionZone: number;
  
  /** Путь к иконке героя для отображения на полоске прогресса */
  icon: string;
  
  // === НАСТРОЙКИ ПОЛОСОК ЗДОРОВЬЯ И МАНЫ ===
  
  /** Конфигурация полосок здоровья и маны */
  healthBars: {
    /** Базовая ширина полосок при масштабе 1.0 */
    baseWidth: number;
    
    /** Минимальная ширина полосок для удобства использования */
    minWidth: number;
    
    /** Смещение по X относительно центра героя (в пикселях) */
    offsetX: number;
    
    /** Смещение по Y относительно центра героя (в пикселях, отрицательное = выше) */
    offsetY: number;
  };
  
  // === КОНФИГУРАЦИЯ СПРАЙТ-ЛИСТОВ ===
  
  /** Конфигурации анимаций героя */
  animations: {
    /** Анимация покоя (idle) - может быть обычной или адаптивной */
    idle: SpriteSheetConfig | AdaptiveSpriteSheetConfig;
    
    /** Анимация бега (run) - может быть обычной или адаптивной */
    run: SpriteSheetConfig | AdaptiveSpriteSheetConfig;
    
    /** Анимация атаки (attack) - может быть обычной или адаптивной */
    attack: SpriteSheetConfig | AdaptiveSpriteSheetConfig;
    
    /** Анимация фронтальной стойки (front) - для отображения на главной странице */
    front?: SpriteSheetConfig | AdaptiveSpriteSheetConfig;
  };
  
  // === ЗВУКОВЫЕ ЭФФЕКТЫ ===
  
  /** Звуковые эффекты героя */
  sounds?: {
    /** Звук бега */
    run?: string;
    
    /** Звуки атаки (массив для случайного выбора) */
    attack?: string[];
  };
  
  // === ОСОБЕННОСТИ АНИМАЦИЙ ===
  
  /** Кастомные скорости анимаций (переопределяют стандартные из GameConfig) */
  animationSpeeds?: {
    /** Скорость анимации idle (кадров в секунду) */
    idle?: number;
    
    /** Скорость анимации run (кадров в секунду) */
    run?: number;
    
    /** Скорость анимации attack (кадров в секунду) */
    attack?: number;
  };
  
  /** Кадр нанесения урона в анимации атаки (начиная с 0) */
  damageFrame?: number;
  
  // === ИГРОВЫЕ ХАРАКТЕРИСТИКИ ===
  
  /** На каком уровне игры разблокируется герой */
  requiredLevel?: number;
  
  /** Особые способности героя */
  specialAbilities?: string[];
}

// ==================================================================================
// КОНФИГУРАЦИЯ ВСЕХ ГЕРОЕВ
// ==================================================================================

/**
 * Конфигурация всех типов героев
 * 
 * Включает визуальные параметры, анимации и звуки
 * Данные для Джаггернаута перенесены из AssetsManager.ts
 */
export const HERO_TYPES: Record<string, HeroTypeConfig> = {
  
  /**
   * Джаггернаут - основной герой, доступен с самого начала
   * Сбалансированный боец ближнего боя
   */
  juggernaut: {
    hero_id: 1,
    hero_name: "juggernaut",
    id: 'juggernaut',
    name: 'Джаггернаут',
    description: 'Мастер клинка, быстрый и смертоносный воин',
    
    // Визуальные параметры джаггернаута - быстрый и подвижный герой
    scale: 0.6,                               // Меньше кентавра (более агильный)
    positionX: 0.3,                           // 20% от левого края
    positionY: 0.72,                           // Выше кентавра (более подвижный)
    collisionZone: 0.5,                       // Стандартная зона коллизии
      icon: '/media/game/assets/heroes/juggernaut/juggernaut_icons/Juggernaut_mini_icon.webp', // Иконка для полоски прогресса
    
    // Настройки полосок здоровья и маны (настраиваемое позиционирование)
    // ВАЖНО: offsetX/Y задаются для HD качества (1024×1024), система автоматически
    // адаптирует их для MD (512×512) и LD (256×256) пропорционально
    healthBars: {
      baseWidth: 120,     // Базовая ширина при масштабе 1.0
      minWidth: 80,       // Минимальная ширина для читаемости
      offsetX: -90,         
      offsetY: 150,         
    },
    
    // Адаптивные конфигурации спрайт-листов с тремя уровнями качества
    animations: {
      idle: {
        // HD качество (1024x1024) - для мощных устройств
        hd: {
          path: '/media/game/assets/heroes/juggernaut/juggernaut_idle/juggernaut_idle_hd.webp',
          frameWidth: 1024,
          frameHeight: 1024,
          framesX: 8,
          framesY: 8,
          totalFrames: 62
        },
        // MD качество (512x512) - для средних устройств
        md: {
          path: '/media/game/assets/heroes/juggernaut/juggernaut_idle/juggernaut_idle_md.webp',
          frameWidth: 512,
          frameHeight: 512,
          framesX: 8,
          framesY: 8,
          totalFrames: 62
        },
        // LD качество (256x256) - для слабых устройств
        ld: {
          path: '/media/game/assets/heroes/juggernaut/juggernaut_idle/juggernaut_idle_ld.webp',
          frameWidth: 256,
          frameHeight: 256,
          framesX: 8,
          framesY: 8,
          totalFrames: 62
        }
      },
      run: {
        // HD качество (1024x1024) - для мощных устройств
        hd: {
          path: '/media/game/assets/heroes/juggernaut/juggernaut_run/juggernaut_run_hd.webp',
          frameWidth: 1024,
          frameHeight: 1024,
          framesX: 5,
          framesY: 4,
          totalFrames: 19
        },
        // MD качество (512x512) - для средних устройств
        md: {
          path: '/media/game/assets/heroes/juggernaut/juggernaut_run/juggernaut_run_md.webp',
          frameWidth: 512,
          frameHeight: 512,
          framesX: 5,
          framesY: 4,
          totalFrames: 19
        },
        // LD качество (256x256) - для слабых устройств
        ld: {
          path: '/media/game/assets/heroes/juggernaut/juggernaut_run/juggernaut_run_ld.webp',
          frameWidth: 256,
          frameHeight: 256,
          framesX: 5,
          framesY: 4,
          totalFrames: 19
        }
      },
      attack: {
        // HD качество (1024x1024) - для мощных устройств
        hd: {
          path: '/media/game/assets/heroes/juggernaut/juggernaut_attack/juggernaut_attack_hd.webp',
          frameWidth: 1024,
          frameHeight: 1024,
          framesX: 5,
          framesY: 5,
          totalFrames: 23
        },
        // MD качество (512x512) - для средних устройств
        md: {
          path: '/media/game/assets/heroes/juggernaut/juggernaut_attack/juggernaut_attack_md.webp',
          frameWidth: 512,
          frameHeight: 512,
          framesX: 5,
          framesY: 5,
          totalFrames: 23
        },
        // LD качество (256x256) - для слабых устройств
        ld: {
          path: '/media/game/assets/heroes/juggernaut/juggernaut_attack/juggernaut_attack_ld.webp',
          frameWidth: 256,
          frameHeight: 256,
          framesX: 5,
          framesY: 5,
          totalFrames: 23
        }
      },
      front: {
        // HD качество (1024x1024) - для мощных устройств
        hd: {
          path: '/media/game/assets/heroes/juggernaut/juggernaut_front/juggernaut_front_hd.webp',
          frameWidth: 1024,
          frameHeight: 1024,
          framesX: 8,
          framesY: 8,
          totalFrames: 60
        },
        // MD качество (512x512) - для средних устройств
        md: {
          path: '/media/game/assets/heroes/juggernaut/juggernaut_front/juggernaut_front_md.webp',
          frameWidth: 512,
          frameHeight: 512,
          framesX: 8,
          framesY: 8,
          totalFrames: 60
        },
        // LD качество (256x256) - для слабых устройств
        ld: {
          path: '/media/game/assets/heroes/juggernaut/juggernaut_front/juggernaut_front_ld.webp',
          frameWidth: 256,
          frameHeight: 256,
          framesX: 8,
          framesY: 8,
          totalFrames: 60
        }
      }
    },
    
    // Звуковые эффекты
    sounds: {
      run: '/media/game/sounds/heroes/juggernaut/run/jugger_run.mp3',
      attack: [
        '/media/game/sounds/heroes/juggernaut/attack/jugger_attack_0.mp3',
        '/media/game/sounds/heroes/juggernaut/attack/jugger_attack_1.mp3',
        '/media/game/sounds/heroes/juggernaut/attack/jugger_attack_2.mp3',
        '/media/game/sounds/heroes/juggernaut/attack/jugger_attack_3.mp3',
        '/media/game/sounds/heroes/juggernaut/attack/jugger_attack_4.mp3',
        '/media/game/sounds/heroes/juggernaut/attack/jugger_attack_5.mp3'
      ]
    },
    
    // Индивидуальные скорости анимаций джаггернаута - быстрый агильный герой
    animationSpeeds: {
      idle: 24,          // Быстрее кентавра (22 -> 24)
      run: 38,           // Быстрее кентавра (40 -> 45) 
      attack: 70        // Быстрее кентавра (80 -> 90)
    },
    
    // Кадр нанесения урона - джаггернаут наносит урон раньше (быстрая атака)
    damageFrame: 6,     // Раньше кентавра (10 -> 6) - более быстрая атака
    
    // Игровые характеристики
    requiredLevel: 1,  // Доступен с самого начала
    specialAbilities: ['blade_dance'] // Особая способность - критический удар
  },

  /**
   * Кентавр Завоеватель - массивный танк ближнего боя
   * Медленный но мощный, больше по размеру чем Джаггернаут
   */
  centaur: {
    hero_id: 2,
    hero_name: "centaur",
    id: 'centaur',
    name: 'Кентавр Завоеватель',
    description: 'Массивный воин-кентавр с огромной силой и выносливостью',
    
    // Визуальные параметры - кентавр крупнее и ниже джаггернаута
    scale: 0.75,                                   // Больше джаггернаута
    positionX: 0.35,                              // Немного левее джаггернаута (15% от края)
          positionY: 0.72,                              // Ниже чем джаггернаут (более массивный)
      collisionZone: 0.7,                           // Увеличенная зона коллизии (больше героя)
      icon: '/media/game/assets/heroes/centaur/centaur_icons/Centaur_mini_icon.webp', // Иконка для полоски прогресса
    
    // Настройки полосок здоровья и маны (настраиваемое позиционирование)
    // ВАЖНО: offsetX/Y задаются для HD качества (1024×1024), система автоматически
    // адаптирует их для MD (512×512) и LD (256×256) пропорционально
    healthBars: {
      baseWidth: 140,     
      minWidth: 100,      
      offsetX: -70,        
      offsetY: 150,       
    },
    
    // Адаптивные конфигурации спрайт-листов с тремя уровнями качества
    animations: {
      idle: {
        // HD качество (1024x1024) - для мощных устройств
        hd: {
          path: '/media/game/assets/heroes/centaur/centaur_idle/centaur_idle_hd.webp',
        frameWidth: 1024,
        frameHeight: 1024,
          framesX: 7,
          framesY: 7,
          totalFrames: 48
        },
        // MD качество (512x512) - для средних устройств
        md: {
          path: '/media/game/assets/heroes/centaur/centaur_idle/centaur_idle_md.webp',
          frameWidth: 512,
          frameHeight: 512,
          framesX: 7,
          framesY: 7,
          totalFrames: 48
        },
        // LD качество (256x256) - для слабых устройств
        ld: {
          path: '/media/game/assets/heroes/centaur/centaur_idle/centaur_idle_ld.webp',
          frameWidth: 256,
          frameHeight: 256,
          framesX: 7,
          framesY: 7,
          totalFrames: 48
        }
      },
      run: {
        // HD качество (1024x1024) - для мощных устройств
        hd: {
          path: '/media/game/assets/heroes/centaur/centaur_run/centaur_run_hd.webp',
          frameWidth: 1024,
          frameHeight: 1024,
          framesX: 7,
          framesY: 6,
          totalFrames: 37
        },
        // MD качество (512x512) - для средних устройств
        md: {
          path: '/media/game/assets/heroes/centaur/centaur_run/centaur_run_md.webp',
          frameWidth: 512,
          frameHeight: 512,
          framesX: 7,
          framesY: 6,
          totalFrames: 37
        },
        // LD качество (256x256) - для слабых устройств
        ld: {
          path: '/media/game/assets/heroes/centaur/centaur_run/centaur_run_ld.webp',
          frameWidth: 256,
          frameHeight: 256,
          framesX: 7,
          framesY: 6,
          totalFrames: 37
        }
      },
      attack: {
        // HD качество (1024x1024) - для мощных устройств
        hd: {
          path: '/media/game/assets/heroes/centaur/centaur_attack/centaur_attack_hd.webp',
        frameWidth: 1024,
        frameHeight: 1024,
        framesX: 5,
        framesY: 4,
          totalFrames: 20
        },
        // MD качество (512x512) - для средних устройств
        md: {
          path: '/media/game/assets/heroes/centaur/centaur_attack/centaur_attack_md.webp',
          frameWidth: 512,
          frameHeight: 512,
          framesX: 5,
          framesY: 4,
          totalFrames: 20
        },
        // LD качество (256x256) - для слабых устройств
        ld: {
          path: '/media/game/assets/heroes/centaur/centaur_attack/centaur_attack_ld.webp',
          frameWidth: 256,
          frameHeight: 256,
          framesX: 5,
          framesY: 4,
          totalFrames: 20
        }
      }
    },
    
    // Звуковые эффекты (пока используем звуки джаггернаута как fallback)
    sounds: {
      run: '/media/game/sounds/heroes/juggernaut/run/jugger_run.mp3',  // TODO: добавить звуки кентавра
      attack: [
        '/media/game/sounds/heroes/juggernaut/attack/jugger_attack_0.mp3',
        '/media/game/sounds/heroes/juggernaut/attack/jugger_attack_1.mp3'
      ]
    },
    
    // Кастомные скорости анимаций - кентавр медленнее джаггернаута
    animationSpeeds: {
      idle: 22,          // Медленнее idle (22 -> 18)
      run: 40,           // Медленнее run (40 -> 30) 
      attack: 80        // Медленнее attack (80 -> 60)
    },
    
    // Кадр нанесения урона (может отличаться от джаггернаута)
    damageFrame: 10,   // Предположительно позже в анимации (более медленная атака)
    
    // Игровые характеристики
    requiredLevel: 1,  // Доступен с самого начала
    specialAbilities: ['retaliate'] // Пассивная способность - отражение урона
  }
};

// ==================================================================================
// ФУНКЦИИ ДЛЯ РАБОТЫ С КОНФИГУРАЦИЕЙ
// ==================================================================================

/**
 * Получить конфигурацию героя по ID
 * 
 * @param heroId - Идентификатор героя (например, 'juggernaut')
 * @returns Конфигурация героя
 * @throws Error если герой не найден
 */
export function getHeroConfig(heroId: string): HeroTypeConfig {
  const config = HERO_TYPES[heroId];
  if (!config) {
    throw new Error(`Конфигурация героя "${heroId}" не найдена. Доступные герои: ${getAllHeroTypes().join(', ')}`);
  }
  return config;
}

/**
 * Получить список всех доступных типов героев
 * 
 * @returns Массив идентификаторов героев
 */
export function getAllHeroTypes(): string[] {
  return Object.keys(HERO_TYPES);
}

/**
 * Получить конфигурацию анимации для конкретного героя
 * 
 * @param heroId - Идентификатор героя
 * @param animationType - Тип анимации ('idle', 'run', 'attack')
 * @returns Конфигурация спрайт-листа для анимации (обычная или адаптивная)
 * @throws Error если герой или анимация не найдены
 */
export function getHeroAnimationConfig(heroId: string, animationType: 'idle' | 'run' | 'attack'): SpriteSheetConfig | AdaptiveSpriteSheetConfig {
  const heroConfig = getHeroConfig(heroId);
  const animationConfig = heroConfig.animations[animationType];
  
  if (!animationConfig) {
    throw new Error(`Анимация "${animationType}" не найдена для героя "${heroId}"`);
  }
  
  return animationConfig;
}

/**
 * Получить героев доступных на определенном уровне
 * 
 * @param level - Уровень игры
 * @returns Массив идентификаторов доступных героев
 */
export function getHeroesForLevel(level: number): string[] {
  return getAllHeroTypes().filter(heroId => {
    const config = getHeroConfig(heroId);
    return (config.requiredLevel || 1) <= level;
  });
}

/**
 * Проверить существует ли герой с указанным ID
 * 
 * @param heroId - Идентификатор героя
 * @returns true если герой существует
 */
export function heroExists(heroId: string): boolean {
  return heroId in HERO_TYPES;
}

/**
 * Получить звуки атаки для героя (случайный выбор)
 * 
 * @param heroId - Идентификатор героя
 * @returns Путь к звуковому файлу или null если звуков нет
 */
export function getRandomAttackSound(heroId: string): string | null {
  const config = getHeroConfig(heroId);
  const attackSounds = config.sounds?.attack;
  
  if (!attackSounds || attackSounds.length === 0) {
    return null;
  }
  
  const randomIndex = Math.floor(Math.random() * attackSounds.length);
  return attackSounds[randomIndex];
}

/**
 * Получить конфигурацию героя с возможными переопределениями
 * 
 * @param heroId - Идентификатор героя
 * @param overrides - Переопределения для базовой конфигурации
 * @returns Итоговая конфигурация героя
 */
export function getHeroConfigWithOverrides(heroId: string, overrides?: Partial<HeroTypeConfig>): HeroTypeConfig {
  const baseConfig = getHeroConfig(heroId);
  
  if (!overrides) {
    return baseConfig;
  }
  
  return {
    ...baseConfig,
    ...overrides,
    // Объединяем вложенные объекты
    animations: {
      ...baseConfig.animations,
      ...overrides.animations
    },
    sounds: {
      ...baseConfig.sounds,
      ...overrides.sounds
    },
    animationSpeeds: {
      ...baseConfig.animationSpeeds,
      ...overrides.animationSpeeds
    }
  };
}

/**
 * Получить конфигурацию героя по числовому ID
 * 
 * @param heroId - Числовой идентификатор героя (1, 2, 3...)
 * @returns Конфигурация героя
 * @throws Error если герой не найден
 */
export function getHeroConfigByNumericId(heroId: number): HeroTypeConfig {
  const heroTypes = Object.values(HERO_TYPES);
  const config = heroTypes.find(hero => hero.hero_id === heroId);
  if (!config) {
    throw new Error(`Конфигурация героя с ID "${heroId}" не найдена. Доступные ID: ${heroTypes.map(h => h.hero_id).join(', ')}`);
  }
  return config;
}

/**
 * Получить техническое имя героя по числовому ID
 * 
 * @param heroId - Числовой идентификатор героя (1, 2, 3...)
 * @returns Техническое имя героя ("juggernaut", "centaur")
 * @throws Error если герой не найден
 */
export function getHeroNameByNumericId(heroId: number): string {
  const config = getHeroConfigByNumericId(heroId);
  return config.hero_name;
}

/**
 * Маппинг числового ID в техническое имя героя
 * 
 * @param heroId - Числовой идентификатор героя (1, 2, 3...)
 * @returns Техническое имя героя ("juggernaut", "centaur")
 * @throws Error если герой не найден
 */
export function mapNumericIdToHeroName(heroId: number): string {
  return getHeroNameByNumericId(heroId);
}
