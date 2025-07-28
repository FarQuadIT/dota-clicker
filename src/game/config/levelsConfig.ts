/**
 * Конфигурация уровней для системы прогрессии крипов
 * 
 * Принцип: каждый побежденный босс становится обычным крипом на следующем уровне
 * Уровень 1: 2 типа в девятке + новый босс
 * Уровень 2: все предыдущие + новый босс
 * И так далее...
 */

export interface LevelConfig {
  /** Номер уровня (1-30) */
  level: number;
  
  /** Количество обычных крипов (без учета босса) */
  creepCount: number;
  
  /** Крипы в первой девятке (случайный порядок) */
  normalCreeps: string[];
  
  /** Босс на 10-й позиции */
  bossCreep: string;
  
  /** Новый крип, который вводится как босс (если есть) */
  newCreepIntroduced?: string;
  
  /** Описание уровня */
  description: string;
}

/**
 * Конфигурация всех 30 уровней
 * Основана на логике старого проекта с постепенным введением новых крипов
 */
const LEVELS_CONFIG: LevelConfig[] = [
  // БРОНЗА (1-5)
  {
    level: 1,
    creepCount: 4,
    normalCreeps: ['direCreep'],
    bossCreep: 'direCreep',
    newCreepIntroduced: 'shishka',
    description: 'Начальный уровень. Встречаются Dire Creep. Босс - Dire Creep.'
  },
  {
    level: 2,
    creepCount: 5,
    normalCreeps: ['direCreep'],
    bossCreep: 'direCreep',
    newCreepIntroduced: 'direCreep',
    description: 'Dire Creep обычный крип. Босс - Dire Creep.'
  },
  {
    level: 3,
    creepCount: 3,
    normalCreeps: ['direCreep'],
    bossCreep: 'direCreep',
    newCreepIntroduced: 'voul',
    description: 'Dire Creep стал обычным крипом. Босс - Dire Creep.'
  },
  {
    level: 4,
    creepCount: 12,
    normalCreeps: ['direCreep'],
    bossCreep: 'direCreep',
    newCreepIntroduced: 'medved',
    description: 'Dire Creep стал обычным крипом. Босс - Dire Creep.'
  },
  {
    level: 5,
    creepCount: 9,
    normalCreeps: ['direCreep'],
    bossCreep: 'direCreep', // Цикличность - возвращаемся к первому крипу как боссу
    description: 'Все крипы освоены. Босс - усиленный Dire Creep.'
  },

  // СЕРЕБРО (6-10)
  {
    level: 6,
    creepCount: 1,
    normalCreeps: ['direCreep'],
    bossCreep: 'direCreep',
    description: 'Серебряный уровень. Босс - усиленный Dire Creep.'
  },
  {
    level: 7,
    creepCount: 9,
    normalCreeps: ['direCreep'],
    bossCreep: 'direCreep',
    description: 'Босс - усиленный Dire Creep.'
  },
  {
    level: 8,
    creepCount: 9,
    normalCreeps: ['direCreep'],
    bossCreep: 'direCreep',
    description: 'Босс - усиленный Dire Creep.'
  },
  {
    level: 9,
    creepCount: 16,
    normalCreeps: ['direCreep'],
    bossCreep: 'direCreep',
    description: 'Босс - усиленный Dire Creep.'
  },
  {
    level: 10,
    creepCount: 16,
    normalCreeps: ['direCreep'],
    bossCreep: 'direCreep',
    description: 'Финал серебра. Босс - усиленный Dire Creep.'
  },

  // ЗОЛОТО (11-15)
  {
    level: 11,
    creepCount: 9,
    normalCreeps: ['direCreep'],
    bossCreep: 'direCreep',
    description: 'Золотой уровень. Все враги усилены.'
  },
  {
    level: 12,
    creepCount: 9,
    normalCreeps: ['direCreep'],
    bossCreep: 'direCreep',
    description: 'Золотой уровень. Босс - золотой Dire Creep.'
  },
  {
    level: 13,
    creepCount: 9,
    normalCreeps: ['direCreep'],
    bossCreep: 'direCreep',
    description: 'Золотой уровень. Босс - золотой Dire Creep.'
  },
  {
    level: 14,
    creepCount: 9,
    normalCreeps: ['direCreep'],
    bossCreep: 'direCreep',
    description: 'Золотой уровень. Босс - золотой Dire Creep.'
  },
  {
    level: 15,
    creepCount: 9,
    normalCreeps: ['direCreep'],
    bossCreep: 'direCreep',
    description: 'Финал золота. Босс - золотой Dire Creep.'
  },

  // ПЛАТИНА (16-20)
  {
    level: 16,
    creepCount: 9,
    normalCreeps: ['direCreep'],
    bossCreep: 'direCreep',
    description: 'Платиновый уровень. Босс - платиновый Dire Creep.'
  },
  {
    level: 17,
    creepCount: 9,
    normalCreeps: ['direCreep'],
    bossCreep: 'direCreep',
    description: 'Платиновый уровень. Босс - платиновый Dire Creep.'
  },
  {
    level: 18,
    creepCount: 9,
    normalCreeps: ['direCreep'],
    bossCreep: 'direCreep',
    description: 'Платиновый уровень. Босс - платиновый Dire Creep.'
  },
  {
    level: 19,
    creepCount: 9,
    normalCreeps: ['direCreep'],
    bossCreep: 'direCreep',
    description: 'Платиновый уровень. Босс - платиновый Dire Creep.'
  },
  {
    level: 20,
    creepCount: 9,
    normalCreeps: ['direCreep'],
    bossCreep: 'direCreep',
    description: 'Финал платины. Босс - платиновый Dire Creep.'
  },

  // МАСТЕР (21-25)
  {
    level: 21,
    creepCount: 9,
    normalCreeps: ['direCreep'],
    bossCreep: 'direCreep',
    description: 'Мастерский уровень. Босс - мастерский Dire Creep.'
  },
  {
    level: 22,
    creepCount: 9,
    normalCreeps: ['direCreep'],
    bossCreep: 'direCreep',
    description: 'Мастерский уровень. Босс - мастерский Dire Creep.'
  },
  {
    level: 23,
    creepCount: 9,
    normalCreeps: ['direCreep'],
    bossCreep: 'direCreep',
    description: 'Мастерский уровень. Босс - мастерский Dire Creep.'
  },
  {
    level: 24,
    creepCount: 9,
    normalCreeps: ['direCreep'],
    bossCreep: 'direCreep',
    description: 'Мастерский уровень. Босс - мастерский Dire Creep.'
  },
  {
    level: 25,
    creepCount: 9,
    normalCreeps: ['direCreep'],
    bossCreep: 'direCreep',
    description: 'Финал мастера. Босс - мастерский Dire Creep.'
  },

  // ГРАНДМАСТЕР (26-30)
  {
    level: 26,
    creepCount: 9,
    normalCreeps: ['direCreep'],
    bossCreep: 'direCreep',
    description: 'Грандмастерский уровень. Босс - грандмастерский Dire Creep.'
  },
  {
    level: 27,
    creepCount: 9,
    normalCreeps: ['direCreep'],
    bossCreep: 'direCreep',
    description: 'Грандмастерский уровень. Босс - грандмастерский Dire Creep.'
  },
  {
    level: 28,
    creepCount: 9,
    normalCreeps: ['direCreep'],
    bossCreep: 'direCreep',
    description: 'Грандмастерский уровень. Босс - грандмастерский Dire Creep.'
  },
  {
    level: 29,
    creepCount: 9,
    normalCreeps: ['direCreep'],
    bossCreep: 'direCreep',
    description: 'Предпоследний уровень. Босс - грандмастерский Dire Creep.'
  },
  {
    level: 30,
    creepCount: 9,
    normalCreeps: ['direCreep'],
    bossCreep: 'direCreep',
    description: 'ФИНАЛЬНЫЙ УРОВЕНЬ! Босс - легендарный Dire Creep!'
  }
];

/**
 * Получить конфигурацию для указанного уровня
 */
export function getLevelConfig(level: number): LevelConfig {
  if (level < 1 || level > 30) {
    throw new Error(`Неверный уровень: ${level}. Допустимые уровни: 1-30`);
  }
  
  return LEVELS_CONFIG[level - 1];
}

/**
 * Получить список доступных крипов для указанного уровня (первая девятка)
 */
export function getAvailableCreepsForLevel(level: number): string[] {
  const config = getLevelConfig(level);
  return [...config.normalCreeps]; // Возвращаем копию массива
}

/**
 * Получить босса для указанного уровня (10-й крип)
 */
export function getBossForLevel(level: number): string {
  const config = getLevelConfig(level);
  return config.bossCreep;
}

/**
 * Получить количество обычных крипов для указанного уровня
 */
export function getCreepCountForLevel(level: number): number {
  const config = getLevelConfig(level);
  return config.creepCount;
}

/**
 * Получить информацию о новом крипе, который вводится на этом уровне
 */
export function getNewCreepIntroduced(level: number): string | undefined {
  const config = getLevelConfig(level);
  return config.newCreepIntroduced;
}

/**
 * Получить описание уровня
 */
export function getLevelDescription(level: number): string {
  const config = getLevelConfig(level);
  return config.description;
}

/**
 * Проверить доступен ли крип на указанном уровне
 */
export function isCreepAvailableOnLevel(creepType: string, level: number): boolean {
  const config = getLevelConfig(level);
  return config.normalCreeps.includes(creepType) || config.bossCreep === creepType;
}

/**
 * Получить все доступные уровни
 */
export function getAllLevels(): LevelConfig[] {
  return [...LEVELS_CONFIG]; // Возвращаем копию массива
}

/**
 * Глобальные функции для тестирования в консоли браузера
 */
if (typeof window !== 'undefined') {
  (window as any).getLevelConfig = getLevelConfig;
  (window as any).getAvailableCreepsForLevel = getAvailableCreepsForLevel;
  (window as any).getBossForLevel = getBossForLevel;
  (window as any).getCreepCountForLevel = getCreepCountForLevel;
  (window as any).getNewCreepIntroduced = getNewCreepIntroduced;
  (window as any).getLevelDescription = getLevelDescription;
  (window as any).isCreepAvailableOnLevel = isCreepAvailableOnLevel;
  (window as any).getAllLevels = getAllLevels;
  
  
} 