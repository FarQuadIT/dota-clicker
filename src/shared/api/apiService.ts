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
 * Типы ответов от /user_info API
 */
export type UserInfoResponse = 
  | { message: 'first_login' }
  | { message: 'no_heroes'; user_name: string }
  | { 
      user_name: string;
      user_diamonds?: number;
      enabled_heroes: number[];
      disabled_heroes: number[];
    };

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
    
    // Маппинг данных с сервера в наш формат
    const mappedStats = mapHeroData(rawData);
    
    
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
    
    // НЕ передаем heroId, чтобы получить текущего активного героя (а не устанавливать нового)
    const query = new URLSearchParams({ userId }).toString();
    const response = await fetch(`${API_BASE_URL}/hero_data?${query}`);
    
    
    if (!response.ok) {
      throw new Error(`Ошибка получения данных героя: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Согласно backend коду, ответ содержит heroId
    const activeHeroId = data.heroId;
    
    if (activeHeroId) {
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
    
    
    // Отправляем POST запрос для смены активного героя
    const response = await fetch(`${API_BASE_URL}/update_user_money`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    
    // Проверяем успешность запроса
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Ошибка ответа сервера:', errorText);
      throw new Error(`Ошибка смены героя: ${response.status} ${response.statusText}`);
    }
    
    // Проверяем ответ сервера
    const result = await response.json();

    const success = result.message === 'completed';
    
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
 * Обрабатывает все сценарии: первый вход, нет героя, полные данные
 * 
 * @param userId - ID пользователя
 * @returns Объект с типом ответа или null в случае ошибки
 */
export async function fetchUserInfo(userId: string): Promise<UserInfoResponse | null> {
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
    
    // Возвращаем данные в зависимости от типа ответа
    if (userData.message === 'first_login') {
      return { message: 'first_login' };
    }
    
    if (userData.message === 'no_heroes') {
      return { 
        message: 'no_heroes', 
        user_name: userData.user_name 
      };
    }
    
    // Полные данные пользователя
    return {
      user_name: userData.user_name,
      user_diamonds: userData.user_diamonds ?? 0,
      enabled_heroes: userData.enabled_heroes ?? [],
      disabled_heroes: userData.disabled_heroes ?? []
    };
  } catch (error) {
    console.error('❌ Ошибка при загрузке информации о пользователе:', error);
    return null;
  }
}

/**
 * Функция для установки имени пользователя
 * 
 * @param userId - ID пользователя
 * @param userName - Имя пользователя
 * @returns Promise<boolean> - true при успехе, false при ошибке
 */
export async function setUserName(userId: string, userName: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/set_user_name`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: parseInt(userId),
        userName: userName
      })
    });
    
    if (!response.ok) {
      throw new Error(`Ошибка установки имени: ${response.status} ${response.statusText}`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Ошибка при установке имени пользователя:', error);
    return false;
  }
}

/**
 * Функция для выбора стартового героя
 * Использует существующий API /update_user_money для выбора героя
 * 
 * @param userId - ID пользователя 
 * @param heroId - ID выбранного героя
 * @returns Promise<boolean> - true в случае успеха, false при ошибке
 */
export async function selectStarterHero(userId: string, heroId: number): Promise<boolean> {
  return await switchActiveHero(userId, heroId);
}

/**
 * Функция для повышения уровня текущего активного героя
 * 
 * @param userId - ID пользователя
 * @returns Promise<boolean> - true при успехе, false при ошибке
 */
export async function levelUpActiveHero(userId: string): Promise<boolean> {
  try {
    
    // Создаем параметры запроса
    const query = new URLSearchParams({ userId }).toString();
    
    // Выполняем PUT запрос к API level_up (сервер требует именно PUT)
    const response = await fetch(`${API_BASE_URL}/level_up?${query}`, {
      method: 'PUT'
    });
    
    
    // Проверяем успешность запроса
    if (!response.ok) {
      throw new Error(`Ошибка повышения уровня: ${response.status} ${response.statusText}`);
    }
    
    // Получаем ответ от сервера
    const result = await response.json();
    
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
    
    // Используем существующую функцию fetchActiveHeroStats
    const heroData = await fetchActiveHeroStats(userId);
    
    if (!heroData || !heroData.stats) {
      console.warn('⚠️ Не удалось получить данные героя');
      return null;
    }
    
    const level = heroData.stats.level;
    
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
    const { TEST_USER_ID } = await import('../constants');
    
    try {
      // Сначала проверим текущего активного героя
      const currentHero = await getCurrentActiveHero(TEST_USER_ID);
      
      if (currentHero === heroId) {
        return;
      }
      
      // Выполняем смену героя
      const success = await switchActiveHero(TEST_USER_ID, heroId);
      
      if (success) {
        // Проверяем что герой действительно сменился
        setTimeout(async () => {
          try {

            const newActiveHero = await getCurrentActiveHero(TEST_USER_ID);

            
            if (newActiveHero === heroId) {
            } else {
              
              setTimeout(async () => {
                const retryActiveHero = await getCurrentActiveHero(TEST_USER_ID);
                
                if (retryActiveHero === heroId) {
                } else {
                  console.error(`❌ Смена все еще не произошла. Возможна проблема с API или БД.`);
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
    const { TEST_USER_ID } = await import('../constants');
    

    
    // Показываем текущего активного героя из констант
    try {
      const { TEST_HERO_ID } = await import('../constants');
    } catch (error) {
      console.warn('⚠️ Не удалось получить TEST_HERO_ID');
    }
    
    // Показываем текущего активного героя с сервера
    try {
      const serverActiveHero = await getCurrentActiveHero(TEST_USER_ID);
    } catch (error) {
      console.warn('⚠️ Не удалось получить активного героя с сервера');
    }
  };

  (window as any).checkCurrentHero = async () => {

    const { TEST_USER_ID } = await import('../constants');
    
    try {
      const activeHero = await getCurrentActiveHero(TEST_USER_ID);
      
      const heroNames = { 1: 'Джаггернаут', 2: 'Кентавр' };
      const heroName = heroNames[activeHero as keyof typeof heroNames] || 'Неизвестный';
      
      return activeHero;
    } catch (error) {
      console.error('❌ Ошибка при проверке активного героя:', error);
      return null;
    }
  };

  (window as any).switchHeroDirectly = async (heroId: number) => {

    const { TEST_USER_ID } = await import('../constants');
    
    try {

      const success = await switchActiveHero(TEST_USER_ID, heroId);
      
      
      if (success) {
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

    const { TEST_USER_ID } = await import('../constants');
    
    try {
      // Запрашиваем конкретного героя напрямую
      const query = new URLSearchParams({ userId: TEST_USER_ID, heroId: heroId.toString() }).toString();
      const response = await fetch(`${API_BASE_URL}/hero_data?${query}`);
      
      
      if (!response.ok) {
        console.error(`❌ Ошибка получения героя ${heroId}:`, response.status, response.statusText);
        return null;
      }
      
      const data = await response.json();
      
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

      const success = await addDiamonds(String(userId), diamonds);
      if (success) {
        
        // Обновляем UI - просто добавляем к текущему значению
        if ((window as any).updateDiamondsFromExternal && (window as any).getCurrentDiamonds) {
          const currentDiamonds = (window as any).getCurrentDiamonds();
          const newTotal = currentDiamonds + diamonds;
          (window as any).updateDiamondsFromExternal(newTotal); 
        } else {
          console.warn('⚠️ Функции UI для осколков недоступны, обновляем напрямую');
          if ((window as any).updateDiamondsFromExternal) {
            (window as any).updateDiamondsFromExternal(diamonds);
          }
        }
      } else {
      }
      return success;
    };

    // Тестовая функция для начисления золота на сервер
    (window as any).testAddGold = async (userId: string | number, goldAmount: number) => {
      const success = await addGoldToServer(String(userId), goldAmount);
      if (success) {
        
        // Обновляем UI золота в контексте
        if ((window as any).updateGoldFromGameController) {
          // Получаем текущее золото и добавляем к нему
          if ((window as any).getCurrentGold) {
            const currentGold = (window as any).getCurrentGold();
            const newTotal = currentGold + goldAmount;
            (window as any).updateGoldFromGameController(newTotal);
          } else {
            console.warn('⚠️ Функция getCurrentGold недоступна, обновляем напрямую');
          }
        } else {
          console.warn('⚠️ Функция updateGoldFromGameController недоступна');
        }
      } else {
      }
      return success;
    };

    // Тестовые функции для квестов
    (window as any).testFetchQuests = async (userId: string | number) => {
      const quests = await fetchUserQuests(String(userId));
      if (quests) {
        
        // Импортируем функции для работы с наградами
        const { getQuestRewardConfig, calculateQuestReward } = await import('../constants/questRewards');
        
        quests.quests.forEach((quest, index) => {
          const rewardConfig = getQuestRewardConfig(quest.questId);
          const rewardAmount = calculateQuestReward(quest.questId, quest.questGoal);
          
        });
      } else {
      }
      return quests;
    };

    (window as any).testClaimQuestReward = async (userId: string | number, questId: number) => {
      
      // Сначала получаем текущие данные квеста
      const questsData = await fetchUserQuests(String(userId));
      if (!questsData) {
        return false;
      }

      const quest = questsData.quests.find(q => q.questId === questId);
      if (!quest) {
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
        
        // Перезагружаем квесты в модальном окне, если оно открыто
        if ((window as any).reloadQuests) {
          (window as any).reloadQuests();
        }
      } else {
      }
      return success;
    };

    // Тестовая функция с точным форматом из примера пользователя
    (window as any).testRawQuestUpdate = async (userId: string | number, questId: number, currentValue: number, claimedReward: boolean) => {
      
      const rawPayload = {
        "userId": Number(userId),
        "quests": [{
          "questId": questId,
          "currentValue": currentValue,
          "claimedReward": claimedReward
        }]
      };


      try {
        const response = await fetch(`${API_BASE_URL}/update_user_quests`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(rawPayload)
        });

        
        if (!response.ok) {
          const errorText = await response.text();
          return false;
        }

        const result = await response.json();
        
        // Перезагружаем квесты в модальном окне, если оно открыто
        if ((window as any).reloadQuests) {
          (window as any).reloadQuests();
        }
        
        return true;
      } catch (error) {
        return false;
      }
    };

    (window as any).testUpdateQuestProgress = async (userId: string | number, questId: number, newValue: number) => {
      const success = await updateUserQuests({
        userId: Number(userId),
        quests: [{
          questId: questId,
          currentValue: newValue
        }]
      });
      
      if (success) {
        
        // Перезагружаем квесты в модальном окне, если оно открыто
        if ((window as any).reloadQuests) {
          (window as any).reloadQuests();
        }
      } else {
      }
      return success;
    };

    (window as any).testIncrementQuestProgress = async (userId: string | number, questId: number, increment: number = 1) => {
      
      // Сначала получаем текущие квесты
      const quests = await fetchUserQuests(String(userId));
      if (!quests) {
        return false;
      }

      // Находим нужный квест
      const quest = quests.quests.find(q => q.questId === questId);
      if (!quest) {
        return false;
      }

      const currentValue = quest.questCurrentValue;
      const newValue = currentValue + increment;
      
      
      const success = await updateUserQuests({
        userId: Number(userId),
        quests: [{
          questId: questId,
          currentValue: newValue
        }]
      });
      
      if (success) {
        if (quest.questGoal && newValue >= quest.questGoal) {
        }
        
        // Перезагружаем квесты в модальном окне, если оно открыто
        if ((window as any).reloadQuests) {
          (window as any).reloadQuests();
        }
      } else {
      }
      return success;
    };

    (window as any).testQuestAPI = async () => {
      const { TEST_USER_ID } = await import('../constants');
      
      
      // Показываем текущие квесты
      const quests = await (window as any).testFetchQuests(TEST_USER_ID);
      return quests;
    };

    // Быстрое тестирование наград
    (window as any).testQuestRewards = async () => {
      const { TEST_USER_ID } = await import('../constants');
      
    };

    // Тестовые функции для уровней героя
    (window as any).testLevelUp = async (userId: string | number) => {
      
      const success = await levelUpActiveHero(String(userId));
      if (success) {
        
        
        // Проверяем новый уровень
        const newLevel = await getActiveHeroLevel(String(userId));
        if (newLevel !== null) {
          
        }
        
        // Обновляем UI если есть функция
        if ((window as any).updateHeroLevelFromServer) {
          (window as any).updateHeroLevelFromServer(newLevel);
          
        }
      } else {
        
      }
      return success;
    };

    (window as any).testGetLevel = async (userId: string | number) => {
      
      const level = await getActiveHeroLevel(String(userId));
      if (level !== null) {
        
      } else {
        
      }
      return level;
    };

    (window as any).testLevelAPI = async () => {
      
      const { TEST_USER_ID } = await import('../constants');

      
      // Показываем текущий уровень
      const currentLevel = await (window as any).testGetLevel(TEST_USER_ID);
      return currentLevel;
    };

  }