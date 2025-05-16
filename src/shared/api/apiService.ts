// src/services/apiService.ts

import { API_BASE_URL, TEST_USER_ID, TEST_HERO_ID } from '../constants/index';
import { mapHeroData, mapItemsData } from './mappers';
import type { ShopItem } from '../types';
/**
 * Функция для тестирования подключения к серверу API
 * Проверяет доступность сервера и возвращает данные о герое
 */
export async function testApiConnection() {
  console.log('Тестирование подключения к API...');
  console.log(`Базовый URL: ${API_BASE_URL}`);
  console.log(`Тестовый пользователь: ${TEST_USER_ID}`);
  console.log(`Тестовый герой: ${TEST_HERO_ID}`);

  // Создаем параметры запроса
  const queryParams = new URLSearchParams({
    userId: TEST_USER_ID,
    heroId: TEST_HERO_ID
  }).toString();

  try {
    // Проверяем эндпоинт /hero_data
    console.log(`Запрос к ${API_BASE_URL}/hero_data?${queryParams}`);
    const heroResponse = await fetch(`${API_BASE_URL}/hero_data?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!heroResponse.ok) {
      throw new Error(`Ошибка при запросе hero_data: ${heroResponse.status} ${heroResponse.statusText}`);
    }

    const heroData = await heroResponse.json();
    console.log('✅ Успешно получены данные о герое:', heroData);

    // Проверяем эндпоинт /hero_items
    console.log(`Запрос к ${API_BASE_URL}/hero_items?${queryParams}`);
    const itemsResponse = await fetch(`${API_BASE_URL}/hero_items?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!itemsResponse.ok) {
      throw new Error(`Ошибка при запросе hero_items: ${itemsResponse.status} ${itemsResponse.statusText}`);
    }

    const itemsData = await itemsResponse.json();
    console.log('✅ Успешно получены данные о предметах:', itemsData);

    return {
      success: true,
      heroData,
      itemsData
    };
  } catch (error) {
    console.error('❌ Ошибка при тестировании API:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    };
  }
}

/**
 * Функция для проверки доступности сервера через простой пинг
 * В отличие от testApiConnection, эта функция не требует правильных параметров
 */
/**
 * Функция для проверки доступности сервера через простой пинг
 * Используем существующий эндпоинт вместо корневого пути
 */
export async function pingServer() {
  try {
    console.log(`Пинг сервера ${API_BASE_URL}...`);
    // Используем существующий эндпоинт hero_data для проверки
    const response = await fetch(`${API_BASE_URL}/hero_data?userId=${TEST_USER_ID}`, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json'
      },
      // Устанавливаем небольшой таймаут, чтобы не ждать долго
      signal: AbortSignal.timeout(5000)
    });
    
    console.log('Статус ответа:', response.status);
    return {
      success: response.ok,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('❌ Сервер недоступен:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    };
  }
}

/**
 * Тестовая функция для отправки POST запроса с минимальными данными
 */
export async function testPostRequest() {
  const testPayload = {
    userId: TEST_USER_ID,
    heroId: TEST_HERO_ID,
    income: 0
  };

  try {
    console.log(`Отправка тестового POST запроса на ${API_BASE_URL}/update_user_money`);
    console.log('Данные запроса:', testPayload);
    
    const response = await fetch(`${API_BASE_URL}/update_user_money`, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });

    if (!response.ok) {
      throw new Error(`Ошибка при отправке POST запроса: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Успешно отправлен POST запрос:', data);
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('❌ Ошибка при отправке POST запроса:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    };
  }
}

// Добавим в src/shared/api/apiService.ts

/**
 * Функция для получения характеристик героя с сервера
 * @param userId ID пользователя
 * @param heroId ID героя
 * @returns Характеристики героя или null в случае ошибки
 */
export async function fetchHeroStats(userId: string, heroId: string) {
  try {
    console.log(`🔍 Запрашиваем характеристики героя: userId=${userId}, heroId=${heroId}`);
    
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
    console.log('📊 Получены данные героя:', rawData);
    
    // Маппинг данных с сервера в наш формат
    const mappedStats = mapHeroData(rawData);
    
    // Возвращаем как маппированные данные, так и дополнительную информацию
    return {
      stats: mappedStats,
      gold: rawData.coins ?? 0,
      income: rawData.currentIncome ?? 0
    };
  } catch (error) {
    console.error('❌ Ошибка при загрузке характеристик героя:', error);
    return null;
  }
}

/**
 * Функция для получения предметов героя с сервера
 * @param userId ID пользователя
 * @param heroId ID героя
 * @returns Объект с предметами по категориям или пустой объект в случае ошибки
 */
export async function fetchHeroItems(userId: string, heroId: string): Promise<Record<string, ShopItem[]> | null> {
  try {
    console.log(`🔍 Запрашиваем предметы героя: userId=${userId}, heroId=${heroId}`);
    
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
    console.log('🛍️ Получены данные о предметах:', rawData);
    
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
    console.error('❌ Ошибка при загрузке предметов героя:', error);
    return null;
  }
}

// Обновим в src/shared/api/apiService.ts

/**
 * Функция для тестирования загрузки характеристик героя в консоли
 */
export async function testHeroStats() {
  console.log('🧪 Тестирование загрузки характеристик героя...');
  const result = await fetchHeroStats(TEST_USER_ID, TEST_HERO_ID);
  
  if (result) {
    console.log('✅ Успешно загружены характеристики героя:');
    console.log('Сырые данные:', result);
    console.log('Маппированные характеристики:', result.stats);
    return result;
  } else {
    console.error('❌ Не удалось загрузить характеристики героя');
    return null;
  }
}

/**
 * Функция для тестирования загрузки предметов героя в консоли
 */
export async function testHeroItems() {
  console.log('🧪 Тестирование загрузки предметов героя...');
  const items = await fetchHeroItems(TEST_USER_ID, TEST_HERO_ID);
  
  if (items) {
    console.log('✅ Успешно загружены предметы героя:');
    console.log('Маппированные предметы:', items);
    
    // Выведем общее количество предметов и категорий
    const totalItems = Object.values(items).reduce((sum, arr) => sum + arr.length, 0);
    console.log(`Всего категорий: ${Object.keys(items).length}`);
    console.log(`Всего предметов: ${totalItems}`);
    
    // Выведем пример предмета из первой категории
    const firstCategory = Object.keys(items)[0];
    if (firstCategory && items[firstCategory].length > 0) {
      console.log('Пример предмета:', items[firstCategory][0]);
    }
    
    return items;
  } else {
    console.error('❌ Не удалось загрузить предметы героя');
    return null;
  }
}
// Можно вызвать эту функцию в консоли браузера:
// import { testHeroStats } from './src/shared/api/apiService';
// testHeroStats().then(data => console.log('Результат:', data));

/**
 * Функция для обновления уровня предмета на сервере
 * @param payload - Данные для отправки на сервер
 * @returns Promise с результатом запроса
 */
export async function updateItemLevel(payload: {
  userId: string;
  heroId: string;
  itemId: string;
  currentLevel: number;
  currentValue: number;
  cost: number;
  currentPrice: number;
  maxHealth: number;
  healthRegen: number;
  maxEnergy: number;
  energyRegen: number;
  damage: number;
  movementSpeed: number;
  vampirism: number;
  currentIncome: number;
}) {
  try {
    console.log('📤 Отправка запроса на обновление предмета:', payload);
    
    const response = await fetch(`${API_BASE_URL}/update_item_level`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`Ошибка при обновлении предмета: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('📥 Ответ сервера:', data);
    
    return data;
  } catch (error) {
    console.error('❌ Ошибка отправки уровня предмета:', error);
    throw error; // Пробрасываем ошибку дальше для обработки в компоненте
  }
}