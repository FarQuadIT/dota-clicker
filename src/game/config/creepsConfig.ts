/**
 * Конфигурация типов крипов для системы волн
 * 
 * Определяет индивидуальные характеристики каждого типа крипа:
 * - Здоровье (сколько ударов нужно для убийства)
 * - Визуальные параметры (размер, позиция)
 * - Зона коллизии
 * - Сложность (для балансировки уровней)
 * - Адаптивные спрайт-листы для разных устройств
 * 
 * ПРИМЕЧАНИЕ: Скорость движения у всех крипов одинаковая,
 * привязана к скорости фона и настраивается в GameConfig.ts
 */

// Импорт интерфейсов для спрайт-листов
import type { SpriteSheetConfig, AdaptiveSpriteSheetConfig } from '../managers/AssetsManager';

/**
 * Интерфейс конфигурации типа крипа
 */
export interface CreepTypeConfig {
  /** Название типа крипа */
  name: string;
  
  /** Здоровье крипа (количество ударов для убийства) */
  health: number;
  
  /** Уровень сложности (1-5, где 1 = простой, 5 = сложный) */
  difficulty: number;
  
  /** Описание крипа */
  description: string;
  
  // === ВИЗУАЛЬНЫЕ ПАРАМЕТРЫ (из GameConfig.ts) ===
  
  /** Визуальный масштаб крипа (из GameConfig.CREEP.scales) */
  visualScale: number;
  
  /** Позиция по высоте экрана 0-1 (из GameConfig.CREEP.positionsY) */
  positionY: number;
  
  /** Зона коллизии - множитель для обнаружения столкновений (из GameConfig.CREEP.collisionZones) */
  collisionZone: number;
  
  // === БОЕВЫЕ ХАРАКТЕРИСТИКИ (из старого проекта) ===
  
  /** Максимальное здоровье крипа (HP) */
  maxHealth: number;
  
  /** Урон который наносит крип герою */
  damage: number;
  
  /** Сколько золота дает за убийство */
  goldReward: number;
  
  /** На каком уровне героя открывается крип */
  requiredHeroLevel: number;
  
  /** Особые способности крипа */
  specialAbilities?: string[];
  
  /** Процент от максимальной маны который отнимает manaburn (для сатира) */
  manaburnPercent?: number;
  
  // === ПАРАМЕТРЫ ПОЗИЦИОНИРОВАНИЯ ПОЛОСОК ЗДОРОВЬЯ ===
  
  /** Смещение полоски здоровья по X относительно центра крипа (в пикселях, автоматически масштабируется под размер экрана) */
  healthBarOffsetX: number;
  
  /** Смещение полоски здоровья по Y относительно центра крипа (в пикселях, отрицательные значения = выше крипа, автоматически масштабируется под размер экрана) */
  healthBarOffsetY: number;
  
  /** Ширина полоски здоровья (множитель от ширины крипа, например 0.5 = половина ширины крипа) */
  healthBarWidthRatio: number;
  
  /** Минимальная ширина полоски здоровья в пикселях (предотвращает слишком узкие полоски на маленьких экранах) */
  healthBarMinWidth?: number;
  
  /** Коррекция позиции по Y для боссов (в относительных единицах, отрицательные значения = выше) */
  bossPositionOffsetY?: number;
  
  /** Множитель зоны коллизии для боссов (например, 1.5 = босс имеет в 1.5 раза большую зону коллизии чем обычный крип) */
  bossCollisionZoneMultiplier?: number;
  
  // === КОНФИГУРАЦИЯ СПРАЙТ-ЛИСТОВ ===
  
  /** Конфигурации анимаций крипа (может быть обычной или адаптивной) */
  animations?: {
    /** Анимация покоя (idle) */
    idle?: SpriteSheetConfig | AdaptiveSpriteSheetConfig;
    
    /** Анимация атаки (attack) */
    attack?: SpriteSheetConfig | AdaptiveSpriteSheetConfig;
    
    /** Анимация смерти (death) */
    death?: SpriteSheetConfig | AdaptiveSpriteSheetConfig;
  };
}

/**
 * Конфигурация всех типов крипов
 * 
 * Включает как игровые характеристики, так и визуальные параметры
 * из GameConfig.ts для централизованного управления
 */
export const CREEP_TYPES: Record<string, CreepTypeConfig> = {
  
  /**
   * Dire Creep - стандартный базовый крип
   * Хорошо сбалансированный, подходит для любого уровня
   * ОБНОВЛЕН: теперь использует адаптивные спрайт-листы
   */
  direCreep: {
    name: 'Dire Creep',
    health: 1,        // Убивается одним ударом (стандарт)
    difficulty: 2,    // Легкий-средний
    description: 'Стандартный крип, хорошо сбалансированный',
    // Визуальные параметры из GameConfig.ts
    visualScale: 0.7,    // ИСПРАВЛЕНО: Увеличен с 0.75 до 1.0 для лучшей видимости
    positionY: 0.72,     // 72% от высоты экрана
    collisionZone: 1.5,  // Стандартная зона коллизии
    // Боевые характеристики из старого проекта
    maxHealth: 10,    // creepHealthTotal: 10000 (для тестирования регенерации)
    damage: 1,        // creepDamage: 1000 (для тестирования регенерации)
    goldReward: 100,       // coinsEarned: 1
    requiredHeroLevel: 0, // unlockedLevel: 0
    // Позиционирование полоски здоровья (настраиваемое от центра верхнего края спрайта)
    // ВАЖНО: Значения задаются для HD качества (1024×1024), система автоматически 
    // адаптирует их для MD (512×512) и LD (256×256) пропорционально
    healthBarOffsetX: 120,   // Смещение по X от центра спрайта (+ вправо, - влево) [базово для HD]
    healthBarOffsetY: 200,   // Смещение по Y от базовой позиции (+ вниз, - вверх) [базово для HD]
    healthBarWidthRatio: 0.4, // 60% от ширины крипа
    healthBarMinWidth: 80,    // Минимальная ширина 45px на маленьких экранах
    bossPositionOffsetY: -0.05, // Боссы поднимаются выше на 5% от высоты экрана
    bossCollisionZoneMultiplier: 0.01, // Боссы имеют на 20% большую зону коллизии
    
    // Адаптивные конфигурации спрайт-листов с тремя уровнями качества
    animations: {
      idle: {
        // HD качество (1024x1024) - для мощных устройств
        hd: {
          path: '/media/game/assets/creeps/direCreep/direCreep_idle/direCreep_idle_hd.webp',
          frameWidth: 1024,
          frameHeight: 1024,
          framesX: 7,
          framesY: 6,
          totalFrames: 40
        },
        // MD качество (512x512) - для средних устройств
        md: {
          path: '/media/game/assets/creeps/direCreep/direCreep_idle/direCreep_idle_md.webp',
          frameWidth: 512,
          frameHeight: 512,
          framesX: 7,
          framesY: 6,
          totalFrames: 40
        },
        // LD качество (256x256) - для слабых устройств
        ld: {
          path: '/media/game/assets/creeps/direCreep/direCreep_idle/direCreep_idle_ld.webp',
          frameWidth: 256,
          frameHeight: 256,
          framesX: 7,
          framesY: 6,
          totalFrames: 40
        }
      },
      attack: {
        // HD качество (1024x1024) - для мощных устройств
        hd: {
          path: '/media/game/assets/creeps/direCreep/direCreep_attack/direCreep_attack_hd.webp',
          frameWidth: 1024,
          frameHeight: 1024,
          framesX: 5,
          framesY: 5,
          totalFrames: 23
        },
        // MD качество (512x512) - для средних устройств
        md: {
          path: '/media/game/assets/creeps/direCreep/direCreep_attack/direCreep_attack_md.webp',
          frameWidth: 512,
          frameHeight: 512,
          framesX: 5,
          framesY: 5,
          totalFrames: 23
        },
        // LD качество (256x256) - для слабых устройств
        ld: {
          path: '/media/game/assets/creeps/direCreep/direCreep_attack/direCreep_attack_ld.webp',
          frameWidth: 256,
          frameHeight: 256,
          framesX: 5,
          framesY: 5,
          totalFrames: 23
        }
      },
      death: {
        // HD качество (1024x1024) - для мощных устройств
        hd: {
          path: '/media/game/assets/creeps/direCreep/direCreep_death/direCreep_death_hd.webp',
          frameWidth: 1024,
          frameHeight: 1024,
          framesX: 6,
          framesY: 5,
          totalFrames: 27
        },
        // MD качество (512x512) - для средних устройств
        md: {
          path: '/media/game/assets/creeps/direCreep/direCreep_death/direCreep_death_md.webp',
          frameWidth: 512,
          frameHeight: 512,
          framesX: 6,
          framesY: 5,
          totalFrames: 27
        },
        // LD качество (256x256) - для слабых устройств
        ld: {
          path: '/media/game/assets/creeps/direCreep/direCreep_death/direCreep_death_ld.webp',
          frameWidth: 256,
          frameHeight: 256,
          framesX: 6,
          framesY: 5,
          totalFrames: 27
        }
      }
    }
  },
  
  /**
   * Wolf - ловкий крип
   * Низкое здоровье, но высокий урон
   */
  wolf: {
    name: 'Wolf',
    health: 1,        // Убивается одним ударом
    difficulty: 3,    // Средний (агрессивность)
    description: 'Ловкий волк с большой зоной атаки',
    // Визуальные параметры из GameConfig.ts
    visualScale: 1.0,    // Стандартный размер
    positionY: 0.72,     // 72% от высоты экрана
    collisionZone: 1.7,  // Большая зона коллизии (агрессивный)
    // Боевые характеристики из старого проекта
    maxHealth: 10000,    // creepHealthTotal: 10000 (для тестирования регенерации)
    damage: 1000,        // creepDamage: 1000 (для тестирования регенерации)
    goldReward: 1,       // coinsEarned: 1
    requiredHeroLevel: 3, // unlockedLevel: 3
    // Позиционирование полоски здоровья (настраиваемое от центра верхнего края спрайта)
    healthBarOffsetX: -15,   // Смещение по X от центра спрайта (wolf - чуть левее)
    healthBarOffsetY: 0,     // Смещение по Y от базовой позиции (стандартное)
    healthBarWidthRatio: 0.5, // 70% от ширины крипа
    healthBarMinWidth: 80,    // Минимальная ширина 40px на маленьких экранах
    bossPositionOffsetY: -0.05, // Боссы поднимаются выше на 4% от высоты экрана
    bossCollisionZoneMultiplier: 0.6, // Боссы имеют еще большую зону коллизии (агрессивные)
  },
  
  /**
   * Satyr - крип с особой способностью "manaburn"
   * Средние характеристики, но сжигает ману героя
   */
  satyr: {
    name: 'Satyr',
    health: 1000,        
    difficulty: 2,    // Легкий-средний (размер компенсирует сложность)
    description: 'Крупный сатир, внушительный размер',
    // Визуальные параметры из GameConfig.ts
    visualScale: 1.8,    // Очень большой
    positionY: 0.735,    // Выше стандартного (прыгучий)
    collisionZone: 0.9,  // Уменьшенная зона (нужно подойти ближе)
    // Боевые характеристики из старого проекта
    maxHealth: 10000,    // creepHealthTotal: 10000 (для тестирования регенерации)
    damage: 1000,        // creepDamage: 1000 (для тестирования регенерации)
    goldReward: 1,       // coinsEarned: 1
    requiredHeroLevel: 4, // unlockedLevel: 4
    specialAbilities: ["manaburn"], // Лишение маны при ударе
    manaburnPercent: 20, // Отнимает 15% от максимальной маны героя
    // Позиционирование полоски здоровья (настраиваемое от центра верхнего края спрайта)
    healthBarOffsetX: 10,    // Смещение по X от центра спрайта (satyr - чуть правее)
    healthBarOffsetY: -15,   // Смещение по Y от базовой позиции (satyr большой, выше)
    healthBarWidthRatio: 0.3, // 50% от ширины крипа (большой крип)
    healthBarMinWidth: 80,    // Минимальная ширина 55px (satyr большой)
    bossPositionOffsetY: -0.05, // Боссы поднимаются выше на 8% от высоты экрана (большой крип)
    bossCollisionZoneMultiplier: 0.01, // Боссы имеют меньшую зону коллизии (нужно подойти ближе к большому крипу)
  },
  
  /**
   * Shishka - живучий крип
   * Высокое здоровье, умеренный урон
   */
  shishka: {
    name: 'Shishka',
    health: 2,        // Требует 2 удара (более живучий)
    difficulty: 4,    // Сложный (высокая живучесть)
    description: 'Живучая шишка, требует несколько ударов',
    // Визуальные параметры из GameConfig.ts
    visualScale: 1.5,    // Больше стандартного
    positionY: 0.71,     // Высоко (летает)
    collisionZone: 1.5,  // Увеличенная зона
    // Боевые характеристики из старого проекта
    maxHealth: 10000,    // creepHealthTotal: 10000 (для тестирования регенерации)
    damage: 1000,        // creepDamage: 1000 (для тестирования регенерации)
    goldReward: 1,       // coinsEarned: 1
    requiredHeroLevel: 1, // unlockedLevel: 1
    // Позиционирование полоски здоровья (настраиваемое от центра верхнего края спрайта)
    healthBarOffsetX: -5,    // Смещение по X от центра спрайта (shishka - чуть левее)
    healthBarOffsetY: 5,     // Смещение по Y от базовой позиции (shishka летает, ниже)
    healthBarWidthRatio: 0.2, // 80% от ширины крипа
    healthBarMinWidth: 80,    // Минимальная ширина 50px на маленьких экранах
    bossPositionOffsetY: -0.05, // Боссы поднимаются выше на 6% от высоты экрана
    bossCollisionZoneMultiplier: 0.5, // Боссы имеют большую зону коллизии (летающий, атакует издалека)
  },
  
  /**
   * Voul - крип с особой способностью "poison"
   * Средние характеристики, но отключает регенерацию героя
   */
  voul: {
    name: 'Voul',
    health: 3,        // Требует 3 удара (танк)
    difficulty: 4,    // Сложный (высокая живучесть)
    description: 'Крепкий вул, настоящий танк',
    // Визуальные параметры из GameConfig.ts
    visualScale: 1.1,    // Немного больше стандартного
    positionY: 0.665,    // Ниже стандартного (ползает)
    collisionZone: 1.3,  // Увеличенная зона
    // Боевые характеристики из старого проекта
    maxHealth: 10000,    // creepHealthTotal: 10000 (для тестирования регенерации)
    damage: 1000,        // creepDamage: 1000 (для тестирования регенерации)
    goldReward: 1,       // coinsEarned: 1
    requiredHeroLevel: 5, // unlockedLevel: 5
    specialAbilities: ["poison"], // Отравление - отключает регенерацию HP на 1 секунду
    // Позиционирование полоски здоровья (настраиваемое от центра верхнего края спрайта)
    healthBarOffsetX: 20,    // Смещение по X от центра спрайта (voul - правее)
    healthBarOffsetY: -5,    // Смещение по Y от базовой позиции (voul ползает, чуть выше)
    healthBarWidthRatio: 0.3, // 60% от ширины крипа
    healthBarMinWidth: 100,    // Минимальная ширина 42px на маленьких экранах
    bossPositionOffsetY: -0.05, // Боссы поднимаются выше на 4% от высоты экрана
    bossCollisionZoneMultiplier: 0.4, // Боссы имеют увеличенную зону коллизии (танк, массивный)
  },
  
  /**
   * Medved - босс-крип
   * Низкий урон, но умеренное здоровье
   */
  medved: {
    name: 'Medved',
    health: 4,        // Требует 4 удара (мини-босс)
    difficulty: 5,    // Очень сложный (максимальная живучесть)
    description: 'Опасный медведь, максимальная живучесть',
    // Визуальные параметры из GameConfig.ts
    visualScale: 1.0,    // Стандартный размер
    positionY: 0.69,     // Ниже стандартного (большой, на земле)
    collisionZone: 2.0,  // Большая зона коллизии (коллизия на расстоянии)
    // Боевые характеристики из старого проекта
    maxHealth: 10000,    // creepHealthTotal: 10000 (для тестирования регенерации)
    damage: 1000,        // creepDamage: 1000 (для тестирования регенерации)
    goldReward: 1,       // coinsEarned: 1
    requiredHeroLevel: 2, // unlockedLevel: 2
    // Позиционирование полоски здоровья (настраиваемое от центра верхнего края спрайта)
    healthBarOffsetX: 0,     // Смещение по X от центра спрайта (medved - по центру)
    healthBarOffsetY: -20,   // Смещение по Y от базовой позиции (medved большой, выше)
    healthBarWidthRatio: 0.5, // 70% от ширины крипа
    healthBarMinWidth: 100,    // Минимальная ширина 48px на маленьких экранах
    bossPositionOffsetY: -0.075, // Боссы поднимаются выше на 5% от высоты экрана
    bossCollisionZoneMultiplier: 0.5, // Боссы имеют немного меньшую зону коллизии (самый крупный, нужно ближе подойти)
  }
  
};

/**
 * Получить конфигурацию крипа по его типу
 * 
 * @param creepType - тип крипа
 * @returns конфигурация крипа или undefined если тип не найден
 */
export function getCreepConfig(creepType: string): CreepTypeConfig | undefined {
  return CREEP_TYPES[creepType];
}

/**
 * Получить список всех доступных типов крипов
 * 
 * @returns массив названий типов крипов
 */
export function getAllCreepTypes(): string[] {
  return Object.keys(CREEP_TYPES);
}

/**
 * Получить крипов по уровню сложности
 * 
 * @param difficulty - уровень сложности (1-5)
 * @returns массив типов крипов соответствующей сложности
 */
export function getCreepsByDifficulty(difficulty: number): string[] {
  return Object.entries(CREEP_TYPES)
    .filter(([_, config]) => config.difficulty === difficulty)
    .map(([type, _]) => type);
}

/**
 * Получить крипов для определенного уровня игры
 * 
 * @param level - уровень игры (1-30)
 * @returns массив подходящих типов крипов
 */
export function getCreepsForLevel(level: number): string[] {
  // Логика выбора крипов по уровню:
  // Уровни 1-5: только простые крипы (difficulty 1-2)
  // Уровни 6-15: простые и средние крипы (difficulty 1-3)  
  // Уровни 16-25: средние и сложные крипы (difficulty 2-4)
  // Уровни 26-30: все крипы включая самых сложных (difficulty 1-5)
  
  if (level <= 5) {
    // Начальные уровни: только простые крипы
    return getCreepsByDifficulty(1).concat(getCreepsByDifficulty(2));
  } else if (level <= 15) {
    // Средние уровни: простые и средние крипы
    return getCreepsByDifficulty(1)
      .concat(getCreepsByDifficulty(2))
      .concat(getCreepsByDifficulty(3));
  } else if (level <= 25) {
    // Продвинутые уровни: средние и сложные крипы
    return getCreepsByDifficulty(2)
      .concat(getCreepsByDifficulty(3))
      .concat(getCreepsByDifficulty(4));
  } else {
    // Финальные уровни: все крипы
    return getAllCreepTypes();
  }
}

/**
 * Создать случайный набор крипов для уровня
 * 
 * @param level - уровень игры
 * @param count - количество крипов нужное для уровня
 * @returns массив случайно выбранных типов крипов
 */
export function generateRandomCreepsForLevel(level: number, count: number): string[] {
  const availableTypes = getCreepsForLevel(level);
  const result: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * availableTypes.length);
    result.push(availableTypes[randomIndex]);
  }
  
  return result;
}

/**
 * Получить боевые характеристики крипа
 * Удобная функция для получения только боевых параметров
 * 
 * @param creepType - тип крипа
 * @returns объект с боевыми характеристиками или null если крип не найден
 */
export function getCreepCombatStats(creepType: string): {
  maxHealth: number;
  damage: number;
  goldReward: number;
  requiredHeroLevel: number;
  specialAbilities?: string[];
} | null {
  const config = getCreepConfig(creepType);
  if (!config) return null;
  
  return {
    maxHealth: config.maxHealth,
    damage: config.damage,
    goldReward: config.goldReward,
    requiredHeroLevel: config.requiredHeroLevel,
    specialAbilities: config.specialAbilities
  };
}

/**
 * Проверить, доступен ли крип на определенном уровне героя
 * 
 * @param creepType - тип крипа
 * @param heroLevel - уровень героя
 * @returns true если крип доступен, false если нет
 */
export function isCreepUnlockedForHeroLevel(creepType: string, heroLevel: number): boolean {
  const config = getCreepConfig(creepType);
  if (!config) return false;
  
  return heroLevel >= config.requiredHeroLevel;
}

/**
 * Получить список крипов доступных на определенном уровне героя
 * 
 * @param heroLevel - уровень героя
 * @returns массив доступных типов крипов
 */
export function getUnlockedCreepsForHeroLevel(heroLevel: number): string[] {
  return getAllCreepTypes().filter(creepType => 
    isCreepUnlockedForHeroLevel(creepType, heroLevel)
  );
}

/**
 * Проверить, имеет ли крип особые способности
 * 
 * @param creepType - тип крипа
 * @param ability - проверяемая способность
 * @returns true если крип имеет эту способность
 */
export function creepHasAbility(creepType: string, ability: string): boolean {
  const config = getCreepConfig(creepType);
  if (!config || !config.specialAbilities) return false;
  
  return config.specialAbilities.includes(ability);
}

/**
 * Получить конфигурацию анимации для конкретного крипа
 * 
 * @param creepType - тип крипа
 * @param animationType - тип анимации ('idle', 'attack', 'death')
 * @returns Конфигурация спрайт-листа для анимации (обычная или адаптивная) или null
 */
export function getCreepAnimationConfig(creepType: string, animationType: 'idle' | 'attack' | 'death'): SpriteSheetConfig | AdaptiveSpriteSheetConfig | null {
  const creepConfig = getCreepConfig(creepType);
  if (!creepConfig || !creepConfig.animations) {
    return null;
  }
  
  const animationConfig = creepConfig.animations[animationType];
  return animationConfig || null;
}

/**
 * Проверить, использует ли крип адаптивные спрайт-листы
 * 
 * @param creepType - тип крипа
 * @returns true если крип использует адаптивные спрайт-листы
 */
export function creepUsesAdaptiveSprites(creepType: string): boolean {
  const config = getCreepConfig(creepType);
  if (!config || !config.animations) return false;
  
  // Проверяем есть ли хотя бы одна адаптивная анимация
  const animations = config.animations;
  const hasAdaptiveIdle = Boolean(animations.idle && typeof animations.idle === 'object' && 'hd' in animations.idle);
  const hasAdaptiveAttack = Boolean(animations.attack && typeof animations.attack === 'object' && 'hd' in animations.attack);
  const hasAdaptiveDeath = Boolean(animations.death && typeof animations.death === 'object' && 'hd' in animations.death);
  
  return hasAdaptiveIdle || hasAdaptiveAttack || hasAdaptiveDeath;
}

/**
 * Получить список крипов, использующих адаптивные спрайт-листы
 * 
 * @returns Массив типов крипов с адаптивными спрайт-листами
 */
export function getAdaptiveCreeps(): string[] {
  return getAllCreepTypes().filter(creepType => creepUsesAdaptiveSprites(creepType));
}

 