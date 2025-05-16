// src/services/apiService.ts

import { API_BASE_URL } from '../constants/index';
import { mapHeroData, mapItemsData } from './mappers';
import type { ShopItem, UpdateItemPayload } from '../types';

/**
 * Функция для получения характеристик героя с сервера
 * 
 * Запрашивает данные о герое по указанным идентификаторам пользователя и героя,
 * преобразует полученные данные в формат, используемый в приложении.
 * 
 * @param userId - ID пользователя
 * @param heroId - ID героя
 * @returns Объект с характеристиками героя, золотом и доходом, или null в случае ошибки
 */
export async function fetchHeroStats(userId: string, heroId: string) {
  try {
    // Создаем параметры запроса
    const query = new URLSearchParams({ userId, heroId }).toString();
    
    // Выполняем GET запрос к API
    const response = await fetch(`${API_BASE_URL}/hero_data?${query}`);
    
    // Проверяем успешность запроса
    if (!response.ok) {
      throw new Error(`Ошибка загрузки героя: ${response.status} ${response.statusText}`);
    }
    
    // Преобразуем ответ в JSON
    const rawData = await response.json();
    
    // Маппинг данных с сервера в наш формат
    const mappedStats = mapHeroData(rawData);
    
    // Возвращаем как маппированные данные, так и дополнительную информацию
    return {
      stats: mappedStats,
      gold: rawData.coins ?? 0,
      income: rawData.currentIncome ?? 0
    };
  } catch (error) {
    // Критически важная ошибка для обработки
    return null;
  }
}

/**
 * Функция для получения предметов героя с сервера
 * 
 * Запрашивает список предметов по указанным идентификаторам пользователя и героя,
 * преобразует полученные данные в формат, используемый в приложении и сортирует
 * предметы внутри каждой категории.
 * 
 * @param userId - ID пользователя
 * @param heroId - ID героя
 * @returns Объект с предметами, сгруппированными по категориям, или null в случае ошибки
 */
export async function fetchHeroItems(userId: string, heroId: string): Promise<Record<string, ShopItem[]> | null> {
  try {
    // Создаем параметры запроса
    const query = new URLSearchParams({ userId, heroId }).toString();
    
    // Выполняем GET запрос к API
    const response = await fetch(`${API_BASE_URL}/hero_items?${query}`);
    
    // Проверяем успешность запроса
    if (!response.ok) {
      throw new Error(`Ошибка получения предметов: ${response.status} ${response.statusText}`);
    }
    
    // Преобразуем ответ в JSON
    const rawData = await response.json();
    
    // Используем функцию маппинга для преобразования данных
    const items = mapItemsData(rawData);
    
    // Сортировка предметов по baseValue в каждой категории
    Object.keys(items).forEach(category => {
      if (Array.isArray(items[category])) {
        items[category].sort((a, b) => a.baseValue - b.baseValue);
      }
    });
    
    return items;
  } catch (error) {
    // Критически важная ошибка для обработки
    return null;
  }
}

/**
 * Функция для обновления уровня предмета на сервере
 * 
 * Отправляет запрос на сервер для обновления уровня предмета и соответствующих характеристик героя.
 * После успешного обновления возвращает обновленные данные, которые можно использовать для
 * обновления локального состояния.
 * 
 * @param payload - Данные для обновления предмета и характеристик героя
 * @returns Объект с результатом операции или null в случае ошибки
 */
export async function updateItemLevel(payload: UpdateItemPayload) {
  try {
    // Выполняем POST запрос к API
    const response = await fetch(`${API_BASE_URL}/update_item_level`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    // Проверяем успешность запроса
    if (!response.ok) {
      throw new Error(`Ошибка обновления предмета: ${response.status} ${response.statusText}`);
    }
    
    // Преобразуем ответ в JSON
    const data = await response.json();
    
    // Возвращаем результат операции
    return {
      success: true,
      data
    };
  } catch (error) {
    // Критически важная ошибка для обработки
    return null;
  }
}