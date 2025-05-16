// src/shared/api/mappers.ts

/**
 * @fileoverview Модуль для преобразования данных между форматом сервера и клиента
 * 
 * Данный файл содержит функции и интерфейсы для преобразования (маппинга) данных,
 * полученных с сервера API, в формат, используемый в клиентском приложении.
 * 
 * Основные функции:
 * - mapHeroData: преобразует данные о характеристиках героя
 * - mapItemsData: преобразует данные о предметах героя
 * - getItemImagePath: генерирует путь к изображению предмета на основе его названия
 */

import type { HeroStats, ShopItem } from '../types';
import { PRICE_MULTIPLIER } from '../constants';

/**
 * Интерфейс для сырых данных о герое, полученных с сервера
 * 
 * Описывает структуру данных, возвращаемую API при запросе характеристик героя.
 * Эти данные требуют преобразования для использования в клиентском приложении,
 * поскольку именование полей и структура отличаются от используемых в клиенте.
 */
export interface RawHeroData {
  /** Уникальный идентификатор героя */
  heroId: string;
  
  /** Имя героя */
  heroName: string;
  
  /** Идентификатор пользователя-владельца */
  userId: string;
  
  /** Текущее количество золота пользователя */
  coins: number;
  
  /** Максимальное здоровье героя */
  maxHealth: number;
  
  /** Скорость восстановления здоровья (в единицах в секунду) */
  healthRegen: number;
  
  /** Максимальный запас маны/энергии */
  maxEnergy: number;
  
  /** Скорость восстановления маны/энергии (в единицах в секунду) */
  energyRegen: number;
  
  /** Базовый урон героя */
  damage: number;
  
  /** Скорость передвижения героя */
  movementSpeed: number;
  
  /** Процент вампиризма (кражи жизни) */
  vampirism: number;
  
  /** Пассивный доход золота в секунду */
  currentIncome: number;
  
  /** Текущий уровень героя */
  level: number;
}

/**
 * Преобразует данные о герое из формата сервера в формат клиента
 * 
 * Функция выполняет маппинг полей из формата RawHeroData в формат HeroStats,
 * который используется в клиентском приложении. При этом изменяются не только
 * названия полей, но и их структура (например, kebab-case вместо camelCase).
 * 
 * @param data - Данные героя, полученные с сервера
 * @returns Преобразованные данные героя в формате приложения
 * @throws Error если переданы невалидные данные
 */
export function mapHeroData(data: RawHeroData): HeroStats {
  // Проверяем наличие обязательных полей
  if (!data || typeof data !== 'object') {
    throw new Error('Невалидные данные героя: данные отсутствуют или имеют неверный формат');
  }
  
  // Проверяем наличие обязательного поля heroId
  if (!data.heroId) {
    throw new Error('Невалидные данные героя: отсутствует heroId');
  }
  
  // Преобразуем данные, подставляя значения по умолчанию для отсутствующих полей
  return {
    "heroId": data.heroId,
    "max-health": data.maxHealth ?? 100,
    "health-regen": data.healthRegen ?? 1,
    "max-mana": data.maxEnergy ?? 50,
    "mana-regen": data.energyRegen ?? 0.5,
    "damage": data.damage ?? 10,
    "vampirism": data.vampirism ?? 0,
    "movement-speed": data.movementSpeed ?? 5,
    "income": data.currentIncome ?? 5,
  };
}

/**
 * Интерфейс для сырого ответа API со списком предметов героя
 * 
 * Описывает структуру данных, возвращаемую API при запросе предметов героя.
 * Эти данные имеют сложную вложенную структуру с несколькими уровнями вложенности:
 * 1. Категории предметов (например, "max-health", "damage")
 * 2. Предметы внутри каждой категории, индексированные по ID
 */
export interface RawHeroItemsResponse {
  /** Идентификатор пользователя-владельца */
  userId: string;
  
  /** Идентификатор героя */
  heroId: string;
  
  /** Структура предметов героя по категориям */
  items: {
    /** Категория предметов (ключ - строка категории) */
    [category: string]: {
      /** Предметы в категории (ключ - ID предмета) */
      [itemId: string]: {
        /** ID предмета (может быть строкой или числом) */
        itemId: number | string;
        
        /** Название предмета */
        itemName: string;
        
        /** Базовое значение бонуса предмета */
        baseValue: number;
        
        /** Текущий уровень предмета */
        currentLevel: number;
        
        /** Текущее значение бонуса предмета */
        currentValue: number;
        
        /** Текущая цена предмета */
        currentPrice: number;
      };
    };
  };
}

/**
 * Преобразует данные о предметах из формата сервера в формат клиента
 * 
 * Функция выполняет сложное преобразование вложенной структуры предметов
 * из формата RawHeroItemsResponse в плоскую структуру, сгруппированную по категориям.
 * При этом для каждого предмета создается объект ShopItem с дополнительными полями,
 * такими как путь к изображению и функция расчета цены.
 * 
 * @param data - Данные о предметах героя, полученные с сервера
 * @returns Объект с предметами, сгруппированными по категориям
 * @throws Error если переданы невалидные данные
 */
export function mapItemsData(data: RawHeroItemsResponse): Record<string, ShopItem[]> {
  // Проверяем наличие обязательных полей
  if (!data || typeof data !== 'object') {
    throw new Error('Невалидные данные предметов: данные отсутствуют или имеют неверный формат');
  }
  
  // Проверяем наличие структуры предметов
  if (!data.items || typeof data.items !== 'object') {
    throw new Error('Невалидные данные предметов: отсутствует структура предметов');
  }
  
  const result: Record<string, ShopItem[]> = {};

  // Проходим по всем категориям предметов
  for (const category in data.items) {
    const categoryItems = data.items[category];
    
    // Проверяем, что категория содержит объект с предметами
    if (!categoryItems || typeof categoryItems !== 'object') {
      // Пропускаем категорию, если она не содержит валидных данных
      continue;
    }
    
    const items: ShopItem[] = [];

    // Проходим по всем предметам в текущей категории
    for (const itemId in categoryItems) {
      const rawItem = categoryItems[itemId];
      
      // Проверяем валидность данных о предмете
      if (!rawItem || typeof rawItem !== 'object' || !rawItem.itemName) {
        // Пропускаем предмет, если данные невалидны
        continue;
      }
      
      // Формула для расчета цены предмета при покупке (гарантирует целое число)
      const priceFormula = (price: number): number => Math.ceil(price * PRICE_MULTIPLIER);
      
      // Получаем путь к изображению предмета
      const imgPath = getItemImagePath(rawItem.itemName);
      
      // Преобразуем сырые данные в формат предмета для приложения
      items.push({
        id: String(rawItem.itemId ?? itemId), // Используем itemId как резервный вариант
        title: rawItem.itemName,
        img: imgPath,
        value: rawItem.currentValue ?? rawItem.baseValue ?? 0,
        baseValue: rawItem.baseValue ?? 0,
        level: rawItem.currentLevel ?? 1,
        basePrice: rawItem.currentPrice ?? 100, // Базовая цена (без учета уровня)
        currentPrice: rawItem.currentPrice ?? 100, // Текущая цена
        priceFormula: priceFormula
      });
    }
    
    // Добавляем предметы категории только если они есть
    if (items.length > 0) {
      // Сортируем предметы по базовому значению (от простых к сложным)
      items.sort((a, b) => a.baseValue - b.baseValue);
      
      // Добавляем отсортированный список предметов для текущей категории
      result[category] = items;
    }
  }

  return result;
}

/**
 * Генерирует путь к изображению предмета на основе его названия
 * 
 * Функция преобразует название предмета в нормализованное имя файла,
 * которое используется для формирования пути к изображению в директории
 * статических ресурсов.
 * 
 * @param itemName - Название предмета
 * @returns Путь к изображению предмета или путь к изображению по умолчанию
 */
function getItemImagePath(itemName: string): string {
  // Проверяем валидность входных данных
  if (!itemName || typeof itemName !== 'string') {
    // Возвращаем изображение по умолчанию для невалидных данных
    return `/media/shop/items/default_item.jpg`;
  }
  
  try {
    // Нормализуем название предмета для использования в пути к файлу:
    // 1. Переводим в нижний регистр
    // 2. Удаляем апострофы, кавычки и другие специальные символы
    // 3. Заменяем пробелы и дефисы на подчеркивания
    // 4. Удаляем множественные подчеркивания
    const normalized = itemName
      .toLowerCase()
      .trim()
      .replace(/['",.:()\[\]{}]/g, "") // Удаляем специальные символы
      .replace(/[-\s]+/g, "_") // Пробелы и дефисы заменяем на _
      .replace(/_+/g, "_") // Множественные _ заменяем на один _
      .replace(/^_|_$/g, ""); // Удаляем _ в начале и конце строки
    
    // Проверяем, что после нормализации осталась непустая строка
    if (!normalized) {
      return `/media/shop/items/default_item.jpg`;
    }
    
    // Формируем путь к изображению на основе нормализованного названия
    return `/media/shop/items/${normalized}.jpg`;
  } catch (error) {
    // В случае ошибки при обработке строки возвращаем изображение по умолчанию
    return `/media/shop/items/default_item.jpg`;
  }
}