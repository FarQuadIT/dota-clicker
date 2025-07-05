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
    normalCreeps: ['satyr', 'wolf'],
    bossCreep: 'shishka',
    newCreepIntroduced: 'shishka',
    description: 'Начальный уровень. Встречаются Сатир и Волк. Босс - Шишка.'
  },
  {
    level: 2,
    normalCreeps: ['satyr', 'wolf', 'shishka'],
    bossCreep: 'direCreep',
    newCreepIntroduced: 'direCreep',
    description: 'Шишка теперь обычный крип. Новый босс - Dire Creep.'
  },
  {
    level: 3,
    normalCreeps: ['satyr', 'wolf', 'shishka', 'direCreep'],
    bossCreep: 'voul',
    newCreepIntroduced: 'voul',
    description: 'Dire Creep стал обычным крипом. Новый босс - Voul с ядом.'
  },
  {
    level: 4,
    normalCreeps: ['satyr', 'wolf', 'shishka', 'direCreep', 'voul'],
    bossCreep: 'medved',
    newCreepIntroduced: 'medved',
    description: 'Voul стал обычным крипом. Новый босс - Медведь.'
  },
  {
    level: 5,
    normalCreeps: ['satyr', 'wolf', 'shishka', 'direCreep', 'voul', 'medved'],
    bossCreep: 'satyr', // Цикличность - возвращаемся к первому крипу как боссу
    description: 'Все крипы освоены. Босс - усиленный Сатир.'
  },

  // СЕРЕБРО (6-10)
  {
    level: 6,
    normalCreeps: ['satyr', 'wolf', 'shishka', 'direCreep', 'voul', 'medved'],
    bossCreep: 'wolf',
    description: 'Серебряный уровень. Босс - усиленный Волк.'
  },
  {
    level: 7,
    normalCreeps: ['satyr', 'wolf', 'shishka', 'direCreep', 'voul', 'medved'],
    bossCreep: 'shishka',
    description: 'Босс - усиленная Шишка.'
  },
  {
    level: 8,
    normalCreeps: ['satyr', 'wolf', 'shishka', 'direCreep', 'voul', 'medved'],
    bossCreep: 'direCreep',
    description: 'Босс - усиленный Dire Creep.'
  },
  {
    level: 9,
    normalCreeps: ['satyr', 'wolf', 'shishka', 'direCreep', 'voul', 'medved'],
    bossCreep: 'voul',
    description: 'Босс - усиленный Voul с ядом.'
  },
  {
    level: 10,
    normalCreeps: ['satyr', 'wolf', 'shishka', 'direCreep', 'voul', 'medved'],
    bossCreep: 'medved',
    description: 'Финал серебра. Босс - усиленный Медведь.'
  },

  // ЗОЛОТО (11-15)
  {
    level: 11,
    normalCreeps: ['satyr', 'wolf', 'shishka', 'direCreep', 'voul', 'medved'],
    bossCreep: 'satyr',
    description: 'Золотой уровень. Все враги усилены.'
  },
  {
    level: 12,
    normalCreeps: ['satyr', 'wolf', 'shishka', 'direCreep', 'voul', 'medved'],
    bossCreep: 'wolf',
    description: 'Золотой уровень. Босс - золотой Волк.'
  },
  {
    level: 13,
    normalCreeps: ['satyr', 'wolf', 'shishka', 'direCreep', 'voul', 'medved'],
    bossCreep: 'shishka',
    description: 'Золотой уровень. Босс - золотая Шишка.'
  },
  {
    level: 14,
    normalCreeps: ['satyr', 'wolf', 'shishka', 'direCreep', 'voul', 'medved'],
    bossCreep: 'direCreep',
    description: 'Золотой уровень. Босс - золотой Dire Creep.'
  },
  {
    level: 15,
    normalCreeps: ['satyr', 'wolf', 'shishka', 'direCreep', 'voul', 'medved'],
    bossCreep: 'voul',
    description: 'Финал золота. Босс - золотой Voul с мощным ядом.'
  },

  // ПЛАТИНА (16-20)
  {
    level: 16,
    normalCreeps: ['satyr', 'wolf', 'shishka', 'direCreep', 'voul', 'medved'],
    bossCreep: 'medved',
    description: 'Платиновый уровень. Босс - платиновый Медведь.'
  },
  {
    level: 17,
    normalCreeps: ['satyr', 'wolf', 'shishka', 'direCreep', 'voul', 'medved'],
    bossCreep: 'satyr',
    description: 'Платиновый уровень. Босс - платиновый Сатир.'
  },
  {
    level: 18,
    normalCreeps: ['satyr', 'wolf', 'shishka', 'direCreep', 'voul', 'medved'],
    bossCreep: 'wolf',
    description: 'Платиновый уровень. Босс - платиновый Волк.'
  },
  {
    level: 19,
    normalCreeps: ['satyr', 'wolf', 'shishka', 'direCreep', 'voul', 'medved'],
    bossCreep: 'shishka',
    description: 'Платиновый уровень. Босс - платиновая Шишка.'
  },
  {
    level: 20,
    normalCreeps: ['satyr', 'wolf', 'shishka', 'direCreep', 'voul', 'medved'],
    bossCreep: 'direCreep',
    description: 'Финал платины. Босс - платиновый Dire Creep.'
  },

  // МАСТЕР (21-25)
  {
    level: 21,
    normalCreeps: ['satyr', 'wolf', 'shishka', 'direCreep', 'voul', 'medved'],
    bossCreep: 'voul',
    description: 'Мастерский уровень. Босс - мастерский Voul.'
  },
  {
    level: 22,
    normalCreeps: ['satyr', 'wolf', 'shishka', 'direCreep', 'voul', 'medved'],
    bossCreep: 'medved',
    description: 'Мастерский уровень. Босс - мастерский Медведь.'
  },
  {
    level: 23,
    normalCreeps: ['satyr', 'wolf', 'shishka', 'direCreep', 'voul', 'medved'],
    bossCreep: 'satyr',
    description: 'Мастерский уровень. Босс - мастерский Сатир.'
  },
  {
    level: 24,
    normalCreeps: ['satyr', 'wolf', 'shishka', 'direCreep', 'voul', 'medved'],
    bossCreep: 'wolf',
    description: 'Мастерский уровень. Босс - мастерский Волк.'
  },
  {
    level: 25,
    normalCreeps: ['satyr', 'wolf', 'shishka', 'direCreep', 'voul', 'medved'],
    bossCreep: 'shishka',
    description: 'Финал мастера. Босс - мастерская Шишка.'
  },

  // ГРАНДМАСТЕР (26-30)
  {
    level: 26,
    normalCreeps: ['satyr', 'wolf', 'shishka', 'direCreep', 'voul', 'medved'],
    bossCreep: 'direCreep',
    description: 'Грандмастерский уровень. Босс - грандмастерский Dire Creep.'
  },
  {
    level: 27,
    normalCreeps: ['satyr', 'wolf', 'shishka', 'direCreep', 'voul', 'medved'],
    bossCreep: 'voul',
    description: 'Грандмастерский уровень. Босс - грандмастерский Voul.'
  },
  {
    level: 28,
    normalCreeps: ['satyr', 'wolf', 'shishka', 'direCreep', 'voul', 'medved'],
    bossCreep: 'medved',
    description: 'Грандмастерский уровень. Босс - грандмастерский Медведь.'
  },
  {
    level: 29,
    normalCreeps: ['satyr', 'wolf', 'shishka', 'direCreep', 'voul', 'medved'],
    bossCreep: 'satyr',
    description: 'Предпоследний уровень. Босс - грандмастерский Сатир.'
  },
  {
    level: 30,
    normalCreeps: ['satyr', 'wolf', 'shishka', 'direCreep', 'voul', 'medved'],
    bossCreep: 'wolf',
    description: 'ФИНАЛЬНЫЙ УРОВЕНЬ! Босс - легендарный Волк!'
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
  (window as any).getNewCreepIntroduced = getNewCreepIntroduced;
  (window as any).getLevelDescription = getLevelDescription;
  (window as any).isCreepAvailableOnLevel = isCreepAvailableOnLevel;
  (window as any).getAllLevels = getAllLevels;
  
  
} 