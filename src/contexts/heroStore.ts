// src/contexts/heroStore.ts

import { create } from "zustand";

/**
 * Интерфейс описывает характеристики героя
 * Используются строковые ключи для совместимости с API и категориями магазина
 */
export interface HeroStats {
  [key: string]: number | string;  // Индексная сигнатура для доступа по строковому ключу
  "max-health": number;       // Максимальное здоровье
  "health-regen": number;     // Регенерация здоровья
  "max-mana": number;         // Максимальная мана
  "mana-regen": number;       // Регенерация маны
  "damage": number;           // Урон
  "vampirism": number;        // Вампиризм
  "movement-speed": number;   // Скорость передвижения
  "income": number;           // Пассивный доход
  heroId: string;             // ID героя (нужен для API)
}

/**
 * Интерфейс хранилища героя
 * Содержит текущие характеристики и методы для их изменения
 */
interface HeroStore {
  stats: HeroStats | null;                            // Текущие характеристики героя
  setStats: (stats: HeroStats) => void;               // Полная установка всех характеристик
  updateStat: (key: keyof HeroStats, value: number) => void; // Обновление конкретного параметра
}

/**
 * Zustand-хранилище для характеристик героя
 * Позволяет получать, устанавливать и обновлять характеристики героя
 * 
 * Пример использования:
 * const stats = useHeroStore((state) => state.stats);  // Получение характеристик
 * const setStats = useHeroStore((state) => state.setStats);  // Получение функции установки характеристик
 * const updateStat = useHeroStore((state) => state.updateStat);  // Получение функции обновления характеристики
 * 
 * // Установка характеристик
 * setStats({
 *   "max-health": 100,
 *   "health-regen": 1,
 *   "max-mana": 50,
 *   "mana-regen": 0.5,
 *   "damage": 10,
 *   "vampirism": 0,
 *   "movement-speed": 5,
 *   "income": 5,
 *   heroId: "1"
 * });
 * 
 * // Обновление одной характеристики
 * updateStat("damage", 15);
 */
export const useHeroStore = create<HeroStore>((set) => ({
  stats: null, // Изначально данных о герое нет

  // Устанавливаем все характеристики сразу
  setStats: (stats) => set({ stats }),

  // Обновляем одну конкретную характеристику
  updateStat: (key, value) =>
    set((state) =>
      state.stats
        ? { stats: { ...state.stats, [key]: value } } // Обновляем только одно поле
        : state // Если stats = null, ничего не меняем
    ),
}));