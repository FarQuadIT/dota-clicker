// src/shared/types/index.ts - расширенная версия

// Базовые типы для всего приложения

/**
 * Тип для характеристик героя
 * Используется в heroStore и компонентах отображения героя
 */
export interface HeroStats {
  [key: string]: number | string;  // Индексная сигнатура для доступа по строковому ключу
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

/**
 * Тип для предмета в магазине
 * Используется для отображения и покупки предметов
 */
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

/**
 * Тип для категории магазина
 * Определяет визуальное представление категории в UI
 */
export interface ShopCategory {
  name: string;               // Название категории
  icon: string;               // Путь к иконке
  color: string;              // Цвет категории
  filter: string;             // CSS фильтр для иконки
}

/**
 * Тип для API запроса обновления предмета
 * Используется при отправке данных на сервер после покупки предмета
 */
export interface UpdateItemPayload {
  userId: string;             // ID пользователя
  heroId: string;             // ID героя
  itemId: string;             // ID предмета
  currentLevel: number;       // Текущий уровень предмета
  currentValue: number;       // Текущее значение бонуса
  cost: number;               // Стоимость покупки
  currentPrice: number;       // Новая цена предмета
  maxHealth?: number;         // Максимальное здоровье героя
  healthRegen?: number;       // Регенерация здоровья
  maxEnergy?: number;         // Максимальная мана (энергия)
  energyRegen?: number;       // Регенерация маны
  damage?: number;            // Урон
  movementSpeed?: number;     // Скорость передвижения
  vampirism?: number;         // Вампиризм
  currentIncome?: number;     // Текущий пассивный доход
}

/**
 * Тип для API запроса обновления золота
 * Используется при отправке данных на сервер для обновления золота
 */
export interface UpdateGoldPayload {
  userId: string;             // ID пользователя 
  heroId: string;             // ID героя
  income: number;             // Доход (прибавка к золоту)
}

/**
 * Тип для ответа API с данными о герое
 * Используется при получении данных о герое с сервера
 */
export interface HeroDataResponse {
  heroId: string;             // ID героя
  heroName: string;           // Имя героя
  userId: string;             // ID пользователя
  coins: number;              // Количество золота
  maxHealth: number;          // Максимальное здоровье
  healthRegen: number;        // Регенерация здоровья
  maxEnergy: number;          // Максимальная мана (энергия)
  energyRegen: number;        // Регенерация маны
  damage: number;             // Урон
  movementSpeed: number;      // Скорость передвижения
  vampirism: number;          // Вампиризм
  currentIncome: number;      // Текущий пассивный доход
  level: number;              // Уровень героя
}

/**
 * Тип для сырого ответа API со списком предметов
 * Используется при получении данных о предметах с сервера
 */
export interface RawHeroItemsResponse {
  userId: string;             // ID пользователя
  heroId: string;             // ID героя
  items: {
    [category: string]: {
      [itemId: string]: {
        itemId: string;           // ID предмета
        itemName: string;         // Название предмета
        baseValue: number;        // Базовое значение бонуса
        currentLevel: number;     // Текущий уровень предмета
        currentValue: number;     // Текущее значение бонуса
        currentPrice: number;     // Текущая цена предмета
      };
    };
  };
}

/**
 * Тип для одного предмета из ответа API
 * Используется для преобразования данных API в формат приложения
 */
export interface ApiItem {
  itemName: string;           // Название предмета
  currentValue: number;       // Текущее значение бонуса
  baseValue: number;          // Базовое значение бонуса
  currentLevel: number;       // Текущий уровень предмета
  currentPrice: number;       // Текущая цена предмета
}

/**
 * Тип для состояния игры
 * Базовый интерфейс для игрового состояния
 */
export interface GameState {
  level: number;              // Текущий уровень
  enemiesKilled: number;      // Количество убитых врагов
  goldEarned: number;         // Заработанное золото
  isRunning: boolean;         // Запущена ли игра
  isPaused: boolean;          // Приостановлена ли игра
}

/**
 * Тип для характеристик игрового существа (герой или враг)
 * Базовые параметры, общие для героя и врагов
 */
export interface EntityStats {
  health: number;             // Текущее здоровье
  maxHealth: number;          // Максимальное здоровье
  damage: number;             // Наносимый урон
  attackSpeed: number;        // Скорость атаки
  position: {                 // Позиция на экране
    x: number;
    y: number;
  };
}