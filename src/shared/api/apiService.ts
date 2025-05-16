// src/services/apiService.ts

import { API_BASE_URL, TEST_USER_ID, TEST_HERO_ID } from '../constants/index';

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