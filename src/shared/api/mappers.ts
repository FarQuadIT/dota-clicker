// src/shared/api/mappers.ts

import type { HeroStats, ShopItem } from '../types';
import { PRICE_MULTIPLIER } from '../constants';

/**
 * Интерфейс для сырых данных о герое, полученных с сервера
 */
export interface RawHeroData {
  heroId: string;
  heroName: string;
  userId: string;
  coins: number;
  maxHealth: number;
  healthRegen: number;
  maxEnergy: number;
  energyRegen: number;
  damage: number;
  movementSpeed: number;
  vampirism: number;
  currentIncome: number;
  level: number;
}

/**
 * Функция для преобразования данных героя с сервера в формат приложения
 * @param data Данные героя с сервера
 * @returns Преобразованные данные героя в формате приложения
 */
export function mapHeroData(data: RawHeroData): HeroStats {
  return {
    "heroId": data.heroId,
    "max-health": data.maxHealth,
    "health-regen": data.healthRegen,
    "max-mana": data.maxEnergy,
    "mana-regen": data.energyRegen,
    "damage": data.damage,
    "vampirism": data.vampirism,
    "movement-speed": data.movementSpeed,
    "income": data.currentIncome,
  };
}

/**
 * Интерфейс для сырого ответа API со списком предметов
 */
export interface RawHeroItemsResponse {
  userId: string;
  heroId: string;
  items: {
    [category: string]: {
      [itemId: string]: {
        itemId: number | string;
        itemName: string;
        baseValue: number;
        currentLevel: number;
        currentValue: number;
        currentPrice: number;
      };
    };
  };
}

/**
 * Функция для преобразования данных предметов с сервера в формат приложения
 * @param data Данные предметов с сервера
 * @returns Объект с предметами, сгруппированными по категориям
 */
export function mapItemsData(data: RawHeroItemsResponse): Record<string, ShopItem[]> {
  const result: Record<string, ShopItem[]> = {};

  // Проходим по всем категориям предметов
  for (const category in data.items) {
    const items: ShopItem[] = [];

    // Проходим по всем предметам в текущей категории
    for (const itemId in data.items[category]) {
      const rawItem = data.items[category][itemId];
      
      // Формула для расчета цены предмета при покупке
      const priceFormula = (price: number) => Math.ceil(price * PRICE_MULTIPLIER);
      
      // Получаем путь к изображению предмета
      const imgPath = getItemImagePath(rawItem.itemName);
      
      // Преобразуем сырые данные в формат предмета для приложения
      items.push({
        id: String(rawItem.itemId),
        title: rawItem.itemName,
        img: imgPath,
        value: rawItem.currentValue,
        baseValue: rawItem.baseValue,
        level: rawItem.currentLevel,
        basePrice: rawItem.currentPrice, // Базовая цена (без учета уровня)
        currentPrice: rawItem.currentPrice, // Текущая цена
        priceFormula: priceFormula
      });
    }
    
    // Сортируем предметы по цене (от дешевых к дорогим)
    items.sort((a, b) => a.currentPrice - b.currentPrice);
    
    // Добавляем отсортированный список предметов для текущей категории
    result[category] = items;
  }

  return result;
}

/**
 * Функция для получения пути к изображению предмета по его названию
 * @param itemName Название предмета
 * @returns Путь к изображению предмета
 */
function getItemImagePath(itemName: string): string {
  // Нормализуем название предмета: переводим в нижний регистр и заменяем пробелы на подчеркивания
  const normalized = itemName
    .toLowerCase()
    .replace(/['"]/g, "") // Удаляем апострофы и кавычки
    .replace(/\s+/g, "_"); // Пробелы заменяем на _
  
  // Формируем путь к изображению на основе нормализованного названия
  return `/media/shop/items/${normalized}.jpg`;
}