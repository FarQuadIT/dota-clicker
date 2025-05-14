// src/shared/types/index.ts

// Базовые типы для всего приложения

// Тип для характеристик героя
export interface HeroStats {
    "max-health": number;       // Максимальное здоровье
    "health-regen": number;     // Регенерация здоровья
    "max-mana": number;         // Максимальная мана
    "mana-regen": number;       // Регенерация маны
    "damage": number;           // Урон
    "vampirism": number;        // Вампиризм (кража жизни)
    "movement-speed": number;   // Скорость передвижения
    "income": number;           // Пассивный доход
    heroId: string;             // ID героя
  }
  
  // Тип для предмета в магазине
  export interface ShopItem {
    id: string;                 // Уникальный ID предмета
    img: string;                // Путь к изображению
    title: string;              // Название предмета
    value: number;              // Текущее значение бонуса
    baseValue: number;          // Базовое значение бонуса
    level: number;              // Уровень предмета
    basePrice: number;          // Базовая цена
    currentPrice: number;       // Текущая цена
    priceFormula: (currentPrice: number) => number; // Формула расчета цены
  }
  
  // Тип для категории магазина
  export interface ShopCategory {
    name: string;               // Название категории
    icon: string;               // Путь к иконке
    color: string;              // Цвет категории
    filter: string;             // CSS фильтр для иконки
  }