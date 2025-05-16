// src/shared/constants/shopConfig.ts

import type { ShopCategory } from '../types';

/**
 * Конфигурация категорий магазина
 * 
 * Данный файл содержит настройки визуального представления и стилизации
 * всех категорий товаров в магазине игры. Каждая категория соответствует
 * одной из характеристик героя и имеет уникальные визуальные параметры.
 * 
 * Структура объекта:
 * - Ключи объекта соответствуют свойствам в объекте HeroStats
 * - Значения содержат параметры визуализации для UI компонентов
 */
export const shopCategories: Record<string, ShopCategory> = {
  "max-health": {
    name: "Максимальное здоровье",
    icon: "/media/shop/main/health.png",
    color: "#77d87a",
    filter: "invert(63%) sepia(26%) saturate(5174%) hue-rotate(78deg) brightness(100%) contrast(100%)",
  },
  "health-regen": {
    name: "Восстановление здоровья",
    icon: "/media/shop/main/healing.png",
    color: "#bc9520",
    filter: "invert(50%) sepia(20%) saturate(400%) hue-rotate(30deg) brightness(90%) contrast(85%)",
  },
  "max-mana": {
    name: "Максимальная мана",
    icon: "/media/shop/main/mana.png",
    color: "#2d52e4",
    filter: "invert(40%) sepia(50%) saturate(3000%) hue-rotate(220deg) brightness(85%) contrast(90%)",
  },
  "mana-regen": {
    name: "Восстановление маны",
    icon: "/media/shop/main/regmana.png",
    color: "#6404be",
    filter: "invert(35%) sepia(75%) saturate(700%) hue-rotate(260deg) brightness(80%) contrast(95%)",
  },
  "damage": {
    name: "Урон",
    icon: "/media/shop/main/damage.png",
    color: "#c00000",
    filter: "invert(60%) sepia(70%) saturate(6000%) hue-rotate(0deg) brightness(80%) contrast(90%)",
  },
  "vampirism": {
    name: "Вампиризм",
    icon: "/media/shop/main/vampiric.png",
    color: "#d1007a",
    filter: "invert(40%) sepia(80%) saturate(1500%) hue-rotate(310deg) brightness(75%) contrast(100%)",
  },
  "movement-speed": {
    name: "Скорость бега",
    icon: "/media/shop/main/speed.png",
    color: "#c63f00",
    filter: "invert(45%) sepia(70%) saturate(500%) hue-rotate(25deg) brightness(85%) contrast(90%)",
  },
  "income": {
    name: "Доход",
    icon: "/media/shop/main/gold.png",
    color: "#d6de00",
    filter: "invert(80%) sepia(40%) saturate(500%) hue-rotate(60deg) brightness(95%) contrast(105%)",
  },
} as const;