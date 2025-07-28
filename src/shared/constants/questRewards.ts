// src/shared/constants/questRewards.ts

/**
 * Типы наград за выполнение заданий
 */
export enum RewardType {
  GOLD = 'gold',
  DIAMONDS = 'diamonds'
}

/**
 * Интерфейс для конфигурации награды за задание
 */
export interface QuestRewardConfig {
  /** Тип награды */
  type: RewardType;
  
  /** Базовое значение награды */
  baseAmount: number;
  
  /** Иконка для отображения в UI */
  icon: string;
  
  /** Цвет для отображения */
  color: string;
  
  /** Название валюты */
  currency: string;
}

/**
 * Конфигурация наград для заданий 1-15
 * Четные номера (2, 4, 6, 8, 10, 12, 14) - золото
 * Нечетные номера (1, 3, 5, 7, 9, 11, 13, 15) - осколки
 */
export const QUEST_REWARDS_CONFIG: Record<number, QuestRewardConfig> = {
  // Нечетные - осколки
  1: {
    type: RewardType.DIAMONDS,
    baseAmount: 10,
    icon: '/media/interface_icons/diamonds.png',
    color: '#ff8c00',
    currency: 'осколков'
  },
  3: {
    type: RewardType.DIAMONDS,
    baseAmount: 15,
    icon: '/media/interface_icons/diamonds.png',
    color: '#ff8c00',
    currency: 'осколков'
  },
  5: {
    type: RewardType.DIAMONDS,
    baseAmount: 20,
    icon: '/media/interface_icons/diamonds.png',
    color: '#ff8c00',
    currency: 'осколков'
  },
  7: {
    type: RewardType.DIAMONDS,
    baseAmount: 25,
    icon: '/media/interface_icons/diamonds.png',
    color: '#ff8c00',
    currency: 'осколков'
  },
  9: {
    type: RewardType.DIAMONDS,
    baseAmount: 30,
    icon: '/media/interface_icons/diamonds.png',
    color: '#ff8c00',
    currency: 'осколков'
  },
  11: {
    type: RewardType.DIAMONDS,
    baseAmount: 35,
    icon: '/media/interface_icons/diamonds.png',
    color: '#ff8c00',
    currency: 'осколков'
  },
  13: {
    type: RewardType.DIAMONDS,
    baseAmount: 40,
    icon: '/media/interface_icons/diamonds.png',
    color: '#ff8c00',
    currency: 'осколков'
  },
  15: {
    type: RewardType.DIAMONDS,
    baseAmount: 50,
    icon: '/media/interface_icons/diamonds.png',
    color: '#ff8c00',
    currency: 'осколков'
  },

  // Четные - золото
  2: {
    type: RewardType.GOLD,
    baseAmount: 100,
    icon: '/media/shop/images/gold.png',
    color: '#ffd700',
    currency: 'золота'
  },
  4: {
    type: RewardType.GOLD,
    baseAmount: 200,
    icon: '/media/shop/images/gold.png',
    color: '#ffd700',
    currency: 'золота'
  },
  6: {
    type: RewardType.GOLD,
    baseAmount: 300,
    icon: '/media/shop/images/gold.png',
    color: '#ffd700',
    currency: 'золота'
  },
  8: {
    type: RewardType.GOLD,
    baseAmount: 500,
    icon: '/media/shop/images/gold.png',
    color: '#ffd700',
    currency: 'золота'
  },
  10: {
    type: RewardType.GOLD,
    baseAmount: 750,
    icon: '/media/shop/images/gold.png',
    color: '#ffd700',
    currency: 'золота'
  },
  12: {
    type: RewardType.GOLD,
    baseAmount: 1000,
    icon: '/media/shop/images/gold.png',
    color: '#ffd700',
    currency: 'золота'
  },
  14: {
    type: RewardType.GOLD,
    baseAmount: 1500,
    icon: '/media/shop/images/gold.png',
    color: '#ffd700',
    currency: 'золота'
  }
};

/**
 * Получить конфигурацию награды для задания
 */
export function getQuestRewardConfig(questId: number): QuestRewardConfig {
  const config = QUEST_REWARDS_CONFIG[questId];
  
  if (!config) {
    // Fallback для неизвестных заданий
    console.warn(`Не найдена конфигурация награды для задания ${questId}, используем золото по умолчанию`);
    return {
      type: RewardType.GOLD,
      baseAmount: 100,
      icon: '/media/shop/images/gold.png',
      color: '#ffd700',
      currency: 'золота'
    };
  }
  
  return config;
}

/**
 * Вычислить финальную награду за задание с учетом цели
 */
export function calculateQuestReward(questId: number, questGoal: number | null): number {
  const config = getQuestRewardConfig(questId);
  
  if (!questGoal) {
    return config.baseAmount;
  }
  
  // Для более сложных заданий (с большей целью) увеличиваем награду
  const goalMultiplier = Math.max(1, Math.log10(questGoal) / 2);
  return Math.floor(config.baseAmount * goalMultiplier);
}

/**
 * Проверить, является ли награда осколками
 */
export function isRewardDiamonds(questId: number): boolean {
  return getQuestRewardConfig(questId).type === RewardType.DIAMONDS;
}

/**
 * Проверить, является ли награда золотом
 */
export function isRewardGold(questId: number): boolean {
  return getQuestRewardConfig(questId).type === RewardType.GOLD;
} 