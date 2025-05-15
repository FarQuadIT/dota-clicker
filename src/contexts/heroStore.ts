// src/contexts/heroStore.ts

import { create } from "zustand";
import type { HeroStats } from "../shared/types";

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