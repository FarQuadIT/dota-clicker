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
    filter: "invert(59%) sepia(91%) saturate(799%) hue-rotate(58deg) brightness(109%) contrast(120%)",
  },
  "health-regen": {
    name: "Восстановление здоровья",
    icon: "/media/shop/main/healing.png",
    color: "#bc9520",
    filter: "invert(75%) sepia(91%) saturate(1544%) hue-rotate(82deg) brightness(97%) contrast(108%)",
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
    color: "#9eff00",
    filter: "invert(45%) sepia(42%) saturate(2939%) hue-rotate(1deg) brightness(105%) contrast(101%)",
  },
} as const;