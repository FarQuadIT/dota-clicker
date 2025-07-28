// src/services/apiService.ts

import { API_BASE_URL } from '../constants/index';
import { mapHeroData, mapItemsData } from './mappers';
import type { ShopItem, UpdateItemPayload, QuestsResponse, UpdateQuestsPayload } from '../types';

/**
 * Интерфейс для информации о пользователе
 */
export interface UserInfo {
  userName: string;
  diamonds: number;
  enabledHeroes: number[];
  disabledHeroes: number[];
}

/**
 * Функция для получения характеристик АКТИВНОГО героя с сервера
 * 
 * Запрашивает данные активного героя пользователя без указания конкретного heroId.
 * Сервер автоматически вернет данные героя с флагом is_current_hero = true.
 * 
 * @param userId - ID пользователя
 * @returns Объект с характеристиками активного героя, золотом и доходом, или null в случае ошибки
 */
export async function fetchActiveHeroStats(userId: string) {
  try {
    console.log('🔍 Загружаем данные АКТИВНОГО героя для пользователя:', userId);
    
    // Создаем параметры запроса БЕЗ heroId - сервер вернет активного героя
    const query = new URLSearchParams({ userId }).toString();
    
    // Выполняем GET запрос к API
    const response = await fetch(`${API_BASE_URL}/hero_data?${query}`);
    
    // Проверяем успешность запроса
    if (!response.ok) {
      throw new Error(`Ошибка загрузки активного героя: ${response.status} ${response.statusText}`);
    }
    
    // Преобразуем ответ в JSON
    const rawData = await response.json();
    console.log('📦 Данные активного героя с сервера:', rawData);
    
    // Маппинг данных с сервера в наш формат
    const mappedStats = mapHeroData(rawData);
    
    console.log('✅ Активный герой загружен:', rawData.heroId, rawData.heroName);
    
    // Возвращаем как маппированные данные, так и дополнительную информацию
    return {
      stats: mappedStats,
      gold: rawData.coins ?? 0,
      income: rawData.currentIncome ?? 0,
      heroId: rawData.heroId // Добавляем ID активного героя для информации
    };
  } catch (error) {
    console.error('❌ Ошибка при загрузке активного героя:', error);
    // Критически важная ошибка для обработки
    return null;
  }
}

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

/**
 * Функция для получения текущего активного героя пользователя
 * 
 * @param userId - ID пользователя
 * @returns Promise<number | null> - ID активного героя или null при ошибке
 */
export async function getCurrentActiveHero(userId: string): Promise<number | null> {
  try {
    console.log('🔍 Запрашиваем текущего активного героя для пользователя:', userId);
    
    // НЕ передаем heroId, чтобы получить текущего активного героя (а не устанавливать нового)
    const query = new URLSearchParams({ userId }).toString();
    const response = await fetch(`${API_BASE_URL}/hero_data?${query}`);
    
    console.log('📥 Ответ API hero_data - статус:', response.status);
    
    if (!response.ok) {
      throw new Error(`Ошибка получения данных героя: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('📦 Данные текущего героя:', data);
    
    // Согласно backend коду, ответ содержит heroId
    const activeHeroId = data.heroId;
    
    if (activeHeroId) {
      console.log('✅ Текущий активный герой:', activeHeroId);
      return parseInt(activeHeroId);
    } else {
      console.warn('⚠️ Не удалось определить активного героя из ответа');
      console.warn('📋 Структура ответа:', Object.keys(data));
      return null;
    }
    
  } catch (error) {
    console.error('❌ Ошибка при получении активного героя:', error);
    return null;
  }
}

/**
 * Функция для смены активного героя пользователя
 * 
 * Отправляет запрос на сервер для установки указанного героя как активного.
 * Сервер автоматически снимает флаг is_current_hero с других героев и устанавливает его для указанного.
 * 
 * @param userId - ID пользователя 
 * @param heroId - ID героя, которого нужно сделать активным
 * @returns Promise<boolean> - true в случае успеха, false при ошибке
 */
export async function switchActiveHero(userId: string, heroId: number): Promise<boolean> {
  try {
    const payload = {
      userId: parseInt(userId),
      heroId: heroId,
      income: 0 // При смене героя не добавляем дополнительного дохода
    };
    
    console.log('🔄 Отправляем запрос смены героя:', payload);
    console.log('📡 URL:', `${API_BASE_URL}/update_user_money`);
    
    // Отправляем POST запрос для смены активного героя
    const response = await fetch(`${API_BASE_URL}/update_user_money`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    console.log('📥 Ответ сервера - статус:', response.status, response.statusText);
    
    // Проверяем успешность запроса
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Ошибка ответа сервера:', errorText);
      throw new Error(`Ошибка смены героя: ${response.status} ${response.statusText}`);
    }
    
    // Проверяем ответ сервера
    const result = await response.json();
    console.log('📦 Результат от сервера:', result);
    
    const success = result.message === 'completed';
    console.log(success ? '✅ Сервер подтвердил смену героя' : '❌ Сервер не подтвердил смену героя');
    
    return success;
    
  } catch (error) {
    console.error('❌ Ошибка при смене активного героя:', error);
    return false;
  }
}

/**
 * Функция для получения ежедневных заданий пользователя
 * 
 * @param userId - ID пользователя
 * @returns Promise<QuestsResponse | null> - объект с заданиями или null при ошибке
 */
export async function fetchUserQuests(userId: string): Promise<QuestsResponse | null> {
  try {
    // Создаем параметры запроса
    const query = new URLSearchParams({ userId }).toString();
    
    // Выполняем GET запрос к API
    const response = await fetch(`${API_BASE_URL}/get_user_quests?${query}`);
    
    // Проверяем успешность запроса
    if (!response.ok) {
      throw new Error(`Ошибка загрузки заданий: ${response.status} ${response.statusText}`);
    }
    
    // Преобразуем ответ в JSON
    const data = await response.json();
    
    // Проверяем структуру ответа
    if (!data.quests || !Array.isArray(data.quests)) {
      throw new Error('Неверная структура ответа API заданий');
    }
    
    return data as QuestsResponse;
  } catch (error) {
    return null;
  }
}

/**
 * Функция для обновления заданий пользователя
 * 
 * @param payload - Данные для обновления заданий
 * @returns Promise<boolean> - true при успехе, false при ошибке
 */
export async function updateUserQuests(payload: UpdateQuestsPayload): Promise<boolean> {
  try {
    // Выполняем POST запрос к API
    const response = await fetch(`${API_BASE_URL}/update_user_quests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    // Проверяем успешность запроса
    if (!response.ok) {
      throw new Error(`Ошибка обновления заданий: ${response.status} ${response.statusText}`);
    }
    
    // Преобразуем ответ в JSON
    await response.json();
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Функция для списания осколков у пользователя
 * 
 * @param userId - ID пользователя
 * @param heroId - ID героя, которого покупает игрок
 * @param diamond - Количество осколков для списания
 * @returns Promise<boolean> - true при успехе, false при ошибке
 */
export async function spendDiamonds(userId: string, heroId: string, diamond: number): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/update_user_money`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: parseInt(userId),
        heroId: parseInt(heroId),
        diamond: diamond
      })
    });
    
    if (!response.ok) {
      throw new Error(`Ошибка списания осколков: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    return true;
  } catch (error) {
    console.error('❌ Ошибка при списании осколков:', error);
    return false;
  }
}

/**
 * Функция для начисления осколков пользователю
 * 
 * @param userId - ID пользователя
 * @param diamonds - Количество осколков для начисления
 * @returns Promise<boolean> - true при успехе, false при ошибке
 */
export async function addDiamonds(userId: string, diamonds: number): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/add_diamonds?userId=${userId}&diamonds=${diamonds}`, {
      method: 'PUT'
    });
    
    if (!response.ok) {
      throw new Error(`Ошибка начисления осколков: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    return true;
  } catch (error) {
    console.error('❌ Ошибка при начислении осколков:', error);
    return false;
  }
}

/**
 * Функция для начисления золота пользователю (аналогично убийству крипов)
 * 
 * @param userId - ID пользователя
 * @param goldAmount - Количество золота для начисления
 * @returns Promise<boolean> - true при успехе, false при ошибке
 */
export async function addGoldToServer(userId: string, goldAmount: number): Promise<boolean> {
  try {
    // Получаем ID активного героя (используем функцию из контекста)
    let activeHeroId = 'unknown';
    try {
      if (typeof window !== 'undefined' && (window as any).getActiveHeroId) {
        activeHeroId = (window as any).getActiveHeroId();
      } else {
        // Fallback - получаем из heroStore
        const { useHeroStore } = await import('../../contexts/heroStore');
        const currentStats = useHeroStore.getState().stats;
        activeHeroId = currentStats?.heroId || '1'; // Fallback к герою 1
      }
    } catch (error) {
      activeHeroId = '1';
    }
    
    const payload = {
      userId: parseInt(userId),
      heroId: parseInt(activeHeroId),
      income: goldAmount
    };
    
    // Отправляем запрос на сервер
    const response = await fetch(`${API_BASE_URL}/update_user_money`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`Ошибка начисления золота: ${response.status} ${response.statusText}`);
    }
    
    await response.json();
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Функция для получения информации о пользователе с сервера
 * 
 * @param userId - ID пользователя
 * @returns Объект с информацией о пользователе, включая осколки, или null в случае ошибки
 */
export async function fetchUserInfo(userId: string): Promise<UserInfo | null> {
  try {
    // Создаем параметры запроса
    const query = new URLSearchParams({ userId }).toString();
    
    // Выполняем GET запрос к API
    const response = await fetch(`${API_BASE_URL}/user_info?${query}`);
    
    // Проверяем успешность запроса
    if (!response.ok) {
      throw new Error(`Ошибка загрузки информации о пользователе: ${response.status} ${response.statusText}`);
    }
    
    // Преобразуем ответ в JSON
    const userData = await response.json();
    
    // Проверяем что пользователь существует
    if (userData.message === 'first_login') {
      return null;
    }
    
    if (userData.message === 'no_heroes') {
      return null;
    }
    
    // Возвращаем данные пользователя
    return {
      userName: userData.user_name,
      diamonds: userData.user_diamonds ?? 0, // Осколки пользователя
      enabledHeroes: userData.enabled_heroes ?? [],
      disabledHeroes: userData.disabled_heroes ?? []
    };
  } catch (error) {
    console.error('❌ Ошибка при загрузке информации о пользователе:', error);
    return null;
  }
}

/**
 * Функция для повышения уровня текущего активного героя
 * 
 * @param userId - ID пользователя
 * @returns Promise<boolean> - true при успехе, false при ошибке
 */
export async function levelUpActiveHero(userId: string): Promise<boolean> {
  try {
    console.log('⬆️ Повышаем уровень активного героя для пользователя:', userId);
    
    // Создаем параметры запроса
    const query = new URLSearchParams({ userId }).toString();
    
    // Выполняем PUT запрос к API level_up (сервер требует именно PUT)
    const response = await fetch(`${API_BASE_URL}/level_up?${query}`, {
      method: 'PUT'
    });
    
    console.log('📥 Ответ API level_up - статус:', response.status);
    
    // Проверяем успешность запроса
    if (!response.ok) {
      throw new Error(`Ошибка повышения уровня: ${response.status} ${response.statusText}`);
    }
    
    // Получаем ответ от сервера
    const result = await response.json();
    console.log('✅ Уровень успешно повышен:', result);
    
    return true;
  } catch (error) {
    console.error('❌ Ошибка при повышении уровня:', error);
    return false;
  }
}

/**
 * Функция для получения уровня активного героя
 * 
 * @param userId - ID пользователя
 * @returns Promise<number | null> - уровень героя или null при ошибке
 */
export async function getActiveHeroLevel(userId: string): Promise<number | null> {
  try {
    console.log('🔍 Получаем уровень активного героя для пользователя:', userId);
    
    // Используем существующую функцию fetchActiveHeroStats
    const heroData = await fetchActiveHeroStats(userId);
    
    if (!heroData || !heroData.stats) {
      console.warn('⚠️ Не удалось получить данные героя');
      return null;
    }
    
    const level = heroData.stats.level;
    console.log('📊 Текущий уровень активного героя:', level);
    
    return level;
  } catch (error) {
    console.error('❌ Ошибка при получении уровня героя:', error);
    return null;
  }
}

// ==================================================================================
// ГЛОБАЛЬНЫЕ ФУНКЦИИ ДЛЯ ТЕСТИРОВАНИЯ (ДОСТУПНЫ В КОНСОЛИ БРАУЗЕРА)
// ==================================================================================

// Добавляем глобальные функции для тестирования в консоли браузера
if (typeof window !== 'undefined') {
  (window as any).testSwitchHero = async (heroId: number) => {
    console.log(`🧪 Тестируем переключение на героя ${heroId}...`);
    const { TEST_USER_ID } = await import('../constants');
    
    try {
      // Сначала проверим текущего активного героя
      console.log('1️⃣ Проверяем текущего активного героя...');
      const currentHero = await getCurrentActiveHero(TEST_USER_ID);
      console.log(`📍 Текущий активный герой: ${currentHero}`);
      
      if (currentHero === heroId) {
        console.log(`ℹ️ Герой ${heroId} уже активен, смена не требуется`);
        return;
      }
      
      // Выполняем смену героя
      console.log(`2️⃣ Переключаемся на героя ${heroId}...`);
      const success = await switchActiveHero(TEST_USER_ID, heroId);
      
      if (success) {
        // Проверяем что герой действительно сменился
        console.log('3️⃣ Проверяем результат смены...');
        console.log('⏳ Ждем 2 секунды для синхронизации с БД...');
        
        setTimeout(async () => {
          try {
            console.log('🔍 Запрашиваем обновленные данные с сервера...');
            const newActiveHero = await getCurrentActiveHero(TEST_USER_ID);
            console.log(`📍 Новый активный герой: ${newActiveHero}`);
            
            if (newActiveHero === heroId) {
              console.log(`✅ Герой успешно сменен на ${heroId}!`);
              console.log('💡 Для обновления интерфейса обновите данные в приложении или перезагрузите страницу');
            } else {
              console.error(`❌ Смена не произошла. Ожидали ${heroId}, получили ${newActiveHero}`);
              console.log('🔄 Попробуем еще раз через 3 секунды...');
              
              setTimeout(async () => {
                const retryActiveHero = await getCurrentActiveHero(TEST_USER_ID);
                console.log(`🔄 Повторная проверка: ${retryActiveHero}`);
                
                if (retryActiveHero === heroId) {
                  console.log(`✅ Герой сменен после повторной проверки!`);
                  console.log('💡 Для обновления интерфейса обновите данные в приложении или перезагрузите страницу');
                } else {
                  console.error(`❌ Смена все еще не произошла. Возможна проблема с API или БД.`);
                  console.log('💡 Попробуйте выполнить checkCurrentHero() чтобы проверить состояние');
                }
              }, 3000);
            }
          } catch (error) {
            console.error('❌ Ошибка при проверке результата смены:', error);
          }
        }, 2000); // Увеличиваем задержку до 2 секунд
      } else {
        console.error(`❌ Сервер не подтвердил смену на героя ${heroId}`);
      }
    } catch (error) {
      console.error(`❌ Ошибка при тестировании героя ${heroId}:`, error);
    }
  };

  (window as any).testHeroAPI = async () => {
    console.log('🧪 Тестируем API смены героев...');
    const { TEST_USER_ID } = await import('../constants');
    
    console.log('📋 Доступные команды:');
    console.log('• testSwitchHero(1) - переключиться на Джаггернаута (с проверками)');
    console.log('• testSwitchHero(2) - переключиться на Кентавра (с проверками)');
    console.log('• switchHeroDirectly(2) - прямое переключение без проверок');
    console.log('• checkCurrentHero() - проверить текущего активного героя');
    console.log('• checkHeroData(2) - проверить данные конкретного героя');
    console.log(`• Текущий пользователь: ${TEST_USER_ID}`);
    
    // Показываем текущего активного героя из констант
    try {
      const { TEST_HERO_ID } = await import('../constants');
      console.log(`• TEST_HERO_ID (константа): ${TEST_HERO_ID}`);
    } catch (error) {
      console.warn('⚠️ Не удалось получить TEST_HERO_ID');
    }
    
    // Показываем текущего активного героя с сервера
    try {
      const serverActiveHero = await getCurrentActiveHero(TEST_USER_ID);
      console.log(`• Активный герой (с сервера): ${serverActiveHero}`);
    } catch (error) {
      console.warn('⚠️ Не удалось получить активного героя с сервера');
    }
  };

  (window as any).checkCurrentHero = async () => {
    console.log('🔍 Проверяем текущего активного героя...');
    const { TEST_USER_ID } = await import('../constants');
    
    try {
      const activeHero = await getCurrentActiveHero(TEST_USER_ID);
      console.log(`📍 Текущий активный герой: ${activeHero}`);
      
      const heroNames = { 1: 'Джаггернаут', 2: 'Кентавр' };
      const heroName = heroNames[activeHero as keyof typeof heroNames] || 'Неизвестный';
      console.log(`👤 Имя героя: ${heroName}`);
      
      return activeHero;
    } catch (error) {
      console.error('❌ Ошибка при проверке активного героя:', error);
      return null;
    }
  };

  (window as any).switchHeroDirectly = async (heroId: number) => {
    console.log(`🎯 Прямое переключение на героя ${heroId} (без проверок и перезагрузок)...`);
    const { TEST_USER_ID } = await import('../constants');
    
    try {
      console.log('📤 Отправляем API запрос...');
      const success = await switchActiveHero(TEST_USER_ID, heroId);
      
      console.log(`📥 Результат API: ${success ? 'SUCCESS' : 'FAILED'}`);
      
      if (success) {
        console.log('✅ API запрос выполнен успешно');
        console.log('💡 Выполните checkCurrentHero() через несколько секунд для проверки');
      } else {
        console.error('❌ API запрос не выполнен');
      }
      
      return success;
    } catch (error) {
      console.error('❌ Ошибка при прямом переключении:', error);
      return false;
    }
  };

  (window as any).checkHeroData = async (heroId: number) => {
    console.log(`🔍 Проверяем данные героя ${heroId} напрямую через API...`);
    const { TEST_USER_ID } = await import('../constants');
    
    try {
      // Запрашиваем конкретного героя напрямую
      const query = new URLSearchParams({ userId: TEST_USER_ID, heroId: heroId.toString() }).toString();
      const response = await fetch(`${API_BASE_URL}/hero_data?${query}`);
      
      console.log(`📥 Ответ для героя ${heroId} - статус:`, response.status);
      
      if (!response.ok) {
        console.error(`❌ Ошибка получения героя ${heroId}:`, response.status, response.statusText);
        return null;
      }
      
      const data = await response.json();
      console.log(`📦 Данные героя ${heroId}:`, data);
      
      return data;
    } catch (error) {
      console.error(`❌ Ошибка при проверке героя ${heroId}:`, error);
      return null;
    }
  };

}

  // Тестовые функции для проверки работы с осколками
  if (typeof window !== 'undefined') {
    // Тестовая функция для начисления осколков  
    (window as any).testAddDiamonds = async (userId: string | number, diamonds: number) => {
      console.log('🧪 Тестируем начисление осколков...');
      const success = await addDiamonds(String(userId), diamonds);
      if (success) {
        console.log(`✅ Тест начисления осколков прошел успешно! Начислено ${diamonds} осколков`);
        
        // Обновляем UI - просто добавляем к текущему значению
        if ((window as any).updateDiamondsFromExternal && (window as any).getCurrentDiamonds) {
          const currentDiamonds = (window as any).getCurrentDiamonds();
          const newTotal = currentDiamonds + diamonds;
          (window as any).updateDiamondsFromExternal(newTotal);
          console.log(`🔄 UI обновлен: ${currentDiamonds} + ${diamonds} = ${newTotal} осколков`);
        } else {
          console.warn('⚠️ Функции UI для осколков недоступны, обновляем напрямую');
          if ((window as any).updateDiamondsFromExternal) {
            (window as any).updateDiamondsFromExternal(diamonds);
          }
        }
      } else {
        console.log('❌ Тест начисления осколков провален');
      }
      return success;
    };

    // Тестовая функция для начисления золота на сервер
    (window as any).testAddGold = async (userId: string | number, goldAmount: number) => {
      console.log('🧪 Тестируем начисление золота на сервер...');
      const success = await addGoldToServer(String(userId), goldAmount);
      if (success) {
        console.log(`✅ Тест начисления золота прошел успешно! Начислено ${goldAmount} золота`);
        
        // Обновляем UI золота в контексте
        if ((window as any).updateGoldFromGameController) {
          // Получаем текущее золото и добавляем к нему
          if ((window as any).getCurrentGold) {
            const currentGold = (window as any).getCurrentGold();
            const newTotal = currentGold + goldAmount;
            (window as any).updateGoldFromGameController(newTotal);
            console.log(`🔄 UI обновлен: ${currentGold} + ${goldAmount} = ${newTotal} золота`);
          } else {
            console.warn('⚠️ Функция getCurrentGold недоступна, обновляем напрямую');
          }
        } else {
          console.warn('⚠️ Функция updateGoldFromGameController недоступна');
        }
      } else {
        console.log('❌ Тест начисления золота провален');
      }
      return success;
    };

    // Тестовые функции для квестов
    (window as any).testFetchQuests = async (userId: string | number) => {
      console.log('🎯 Тестируем загрузку квестов...');
      const quests = await fetchUserQuests(String(userId));
      if (quests) {
        console.log(`✅ Загружено ${quests.quests.length} квестов:`, quests);
        
        // Импортируем функции для работы с наградами
        const { getQuestRewardConfig, calculateQuestReward } = await import('../constants/questRewards');
        
        quests.quests.forEach((quest, index) => {
          const rewardConfig = getQuestRewardConfig(quest.questId);
          const rewardAmount = calculateQuestReward(quest.questId, quest.questGoal);
          
          console.log(`${index + 1}. ${quest.questTitle} (ID: ${quest.questId})`);
          console.log(`   Прогресс: ${quest.questCurrentValue}/${quest.questGoal || '∞'}`);
          console.log(`   Награда: ${rewardAmount} ${rewardConfig.currency} (${rewardConfig.type})`);
          console.log(`   Награда получена: ${quest.claimedReward ? 'Да' : 'Нет'}`);
          console.log('');
        });
      } else {
        console.log('❌ Не удалось загрузить квесты');
      }
      return quests;
    };

    (window as any).testClaimQuestReward = async (userId: string | number, questId: number) => {
      console.log(`🎁 Тестируем получение награды за квест ${questId}...`);
      
      // Сначала получаем текущие данные квеста
      const questsData = await fetchUserQuests(String(userId));
      if (!questsData) {
        console.log('❌ Не удалось загрузить квесты для получения currentValue');
        return false;
      }

      const quest = questsData.quests.find(q => q.questId === questId);
      if (!quest) {
        console.log(`❌ Квест с ID ${questId} не найден`);
        return false;
      }

      const success = await updateUserQuests({
        userId: Number(userId),
        quests: [{
          questId: questId,
          currentValue: quest.questCurrentValue,
          claimedReward: true
        }]
      });
      
      if (success) {
        console.log(`✅ Награда за квест ${questId} успешно получена!`);
        
        // Перезагружаем квесты в модальном окне, если оно открыто
        if ((window as any).reloadQuests) {
          (window as any).reloadQuests();
        }
      } else {
        console.log(`❌ Не удалось получить награду за квест ${questId}`);
      }
      return success;
    };

    // Тестовая функция с точным форматом из примера пользователя
    (window as any).testRawQuestUpdate = async (userId: string | number, questId: number, currentValue: number, claimedReward: boolean) => {
      console.log(`🧪 Тестируем RAW обновление квеста ${questId}...`);
      
      const rawPayload = {
        "userId": Number(userId),
        "quests": [{
          "questId": questId,
          "currentValue": currentValue,
          "claimedReward": claimedReward
        }]
      };

      console.log('📤 RAW JSON payload:', JSON.stringify(rawPayload));

      try {
        const response = await fetch(`${API_BASE_URL}/update_user_quests`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(rawPayload)
        });

        console.log('📥 RAW ответ статус:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.log('📄 RAW текст ошибки:', errorText);
          return false;
        }

        const result = await response.json();
        console.log('📦 RAW результат:', result);
        console.log('✅ RAW обновление успешно!');
        
        // Перезагружаем квесты в модальном окне, если оно открыто
        if ((window as any).reloadQuests) {
          (window as any).reloadQuests();
        }
        
        return true;
      } catch (error) {
        console.error('❌ RAW ошибка:', error);
        return false;
      }
    };

    (window as any).testUpdateQuestProgress = async (userId: string | number, questId: number, newValue: number) => {
      console.log(`📈 Тестируем обновление прогресса квеста ${questId} до значения ${newValue}...`);
      const success = await updateUserQuests({
        userId: Number(userId),
        quests: [{
          questId: questId,
          currentValue: newValue
        }]
      });
      
      if (success) {
        console.log(`✅ Прогресс квеста ${questId} обновлен до ${newValue}!`);
        
        // Перезагружаем квесты в модальном окне, если оно открыто
        if ((window as any).reloadQuests) {
          (window as any).reloadQuests();
        }
      } else {
        console.log(`❌ Не удалось обновить прогресс квеста ${questId}`);
      }
      return success;
    };

    (window as any).testIncrementQuestProgress = async (userId: string | number, questId: number, increment: number = 1) => {
      console.log(`⬆️ Тестируем увеличение прогресса квеста ${questId} на ${increment}...`);
      
      // Сначала получаем текущие квесты
      const quests = await fetchUserQuests(String(userId));
      if (!quests) {
        console.log('❌ Не удалось загрузить квесты');
        return false;
      }

      // Находим нужный квест
      const quest = quests.quests.find(q => q.questId === questId);
      if (!quest) {
        console.log(`❌ Квест с ID ${questId} не найден`);
        return false;
      }

      const currentValue = quest.questCurrentValue;
      const newValue = currentValue + increment;
      
      console.log(`📊 Текущий прогресс: ${currentValue}, новый прогресс: ${newValue}`);
      
      const success = await updateUserQuests({
        userId: Number(userId),
        quests: [{
          questId: questId,
          currentValue: newValue
        }]
      });
      
      if (success) {
        console.log(`✅ Прогресс квеста ${questId} увеличен с ${currentValue} до ${newValue}!`);
        if (quest.questGoal && newValue >= quest.questGoal) {
          console.log(`🎉 Квест ${questId} выполнен! Можно получить награду!`);
        }
        
        // Перезагружаем квесты в модальном окне, если оно открыто
        if ((window as any).reloadQuests) {
          (window as any).reloadQuests();
        }
      } else {
        console.log(`❌ Не удалось увеличить прогресс квеста ${questId}`);
      }
      return success;
    };

    (window as any).testQuestAPI = async () => {
      console.log('🎯 Тестируем API квестов...');
      const { TEST_USER_ID } = await import('../constants');
      
      console.log('📋 Доступные команды для квестов:');
      console.log(`• testFetchQuests(${TEST_USER_ID}) - загрузить квесты пользователя`);
      console.log('• testUpdateQuestProgress(userId, questId, newValue) - установить конкретное значение прогресса');
      console.log('• testIncrementQuestProgress(userId, questId, increment) - увеличить прогресс на указанное значение');
      console.log('• testClaimQuestReward(userId, questId) - получить награду за квест');
      console.log('• testRawQuestUpdate(userId, questId, currentValue, claimedReward) - RAW обновление с точным форматом');
      console.log('• testAddGold(userId, goldAmount) - добавить золото на сервер');
      console.log('• testAddDiamonds(userId, diamonds) - добавить осколки на сервер');
      console.log('• testQuestRewards() - показать примеры наград');
      console.log('');
      console.log('🔧 Примеры использования:');
      console.log('• testUpdateQuestProgress(6969, 3, 10) - установить прогресс квеста 3 в значение 10');
      console.log('• testIncrementQuestProgress(6969, 3, 5) - увеличить прогресс квеста 3 на 5');
      console.log('• testIncrementQuestProgress(6969, 3) - увеличить прогресс квеста 3 на 1');
      console.log('• testClaimQuestReward(6969, 3) - получить награду за квест 3');
      console.log('• testRawQuestUpdate(6969, 3, 10, true) - RAW получение награды за квест 3');
      console.log('• testAddGold(6969, 100) - добавить 100 золота напрямую на сервер');
      console.log('• testAddDiamonds(6969, 10) - добавить 10 осколков напрямую на сервер');
      console.log('');
      console.log('💡 Подсказки:');
      console.log('• Откройте модальное окно заданий ПЕРЕД тестированием для автоматического обновления');
      console.log('• Изменения прогресса будут видны в реальном времени в интерфейсе');
      console.log('• Нечетные квесты (1,3,5,7,9,11,13,15) дают осколки 💎');
      console.log('• Четные квесты (2,4,6,8,10,12,14) дают золото 💰');
      console.log('• При ошибке 500 попробуйте testRawQuestUpdate() для диагностики');
      console.log(`• Текущий пользователь: ${TEST_USER_ID}`);
      
      // Показываем текущие квесты
      const quests = await (window as any).testFetchQuests(TEST_USER_ID);
      return quests;
    };

    // Быстрое тестирование наград
    (window as any).testQuestRewards = async () => {
      console.log('🎁 Тестируем систему наград квестов...');
      const { TEST_USER_ID } = await import('../constants');
      
      console.log('📋 Примеры наград:');
      console.log('💎 ОСКОЛКИ (нечетные):');
      console.log('• testClaimQuestReward(6969, 1) - ~10 осколков');
      console.log('• testClaimQuestReward(6969, 3) - ~15 осколков');
      console.log('• testClaimQuestReward(6969, 5) - ~20 осколков');
      console.log('');
      console.log('💰 ЗОЛОТО (четные):');
      console.log('• testClaimQuestReward(6969, 2) - ~100 золота');
      console.log('• testClaimQuestReward(6969, 4) - ~200 золота');
      console.log('• testClaimQuestReward(6969, 6) - ~300 золота');
      console.log('');
      console.log('🧪 ПРЯМОЕ ТЕСТИРОВАНИЕ:');
      console.log('• testAddGold(6969, 100) - добавить 100 золота на сервер');
      console.log('• testAddDiamonds(6969, 10) - добавить 10 осколков на сервер');
      console.log('');
      console.log('⚠️ Сначала убедитесь что квесты выполнены!');
    };

    // Тестовые функции для уровней героя
    (window as any).testLevelUp = async (userId: string | number) => {
      console.log('⬆️ Тестируем повышение уровня героя...');
      const success = await levelUpActiveHero(String(userId));
      if (success) {
        console.log('✅ Тест повышения уровня прошел успешно!');
        
        // Проверяем новый уровень
        const newLevel = await getActiveHeroLevel(String(userId));
        if (newLevel !== null) {
          console.log(`📊 Новый уровень героя: ${newLevel}`);
        }
        
        // Обновляем UI если есть функция
        if ((window as any).updateHeroLevelFromServer) {
          (window as any).updateHeroLevelFromServer(newLevel);
          console.log('🔄 UI обновлен с новым уровнем');
        }
      } else {
        console.log('❌ Тест повышения уровня провален');
      }
      return success;
    };

    (window as any).testGetLevel = async (userId: string | number) => {
      console.log('📊 Тестируем получение уровня героя...');
      const level = await getActiveHeroLevel(String(userId));
      if (level !== null) {
        console.log(`✅ Текущий уровень активного героя: ${level}`);
      } else {
        console.log('❌ Не удалось получить уровень героя');
      }
      return level;
    };

    (window as any).testLevelAPI = async () => {
      console.log('🆙 Тестируем API уровней героя...');
      const { TEST_USER_ID } = await import('../constants');
      
      console.log('📋 Доступные команды для уровней:');
      console.log(`• testGetLevel(${TEST_USER_ID}) - получить текущий уровень активного героя`);
      console.log(`• testLevelUp(${TEST_USER_ID}) - повысить уровень активного героя на 1`);
      console.log('');
      console.log('🔧 Примеры использования:');
      console.log('• testGetLevel(6969) - показать текущий уровень');
      console.log('• testLevelUp(6969) - повысить уровень на 1');
      console.log('');
      console.log('💡 Подсказки:');
      console.log('• Уровень повышается только у активного героя');
      console.log('• После повышения UI автоматически обновится');
      console.log('• Максимальный уровень: 30');
      console.log(`• Текущий пользователь: ${TEST_USER_ID}`);
      
      // Показываем текущий уровень
      const currentLevel = await (window as any).testGetLevel(TEST_USER_ID);
      return currentLevel;
    };

  }