// src/shared/constants/index.ts

// Базовые константы приложения
// Эти значения используются по всему приложению

// URL сервера API
export const API_BASE_URL = 'http://176.124.212.234:5000';

// Игровые константы
export const INITIAL_GOLD = 1000;          // Стартовое золото игрока
export const BASE_PASSIVE_INCOME = 5;      // Базовый доход в секунду
export const GOLD_UPDATE_INTERVAL = 1000;  // Интервал обновления золота (мс)

// ID для тестирования
export const TEST_USER_ID = "222";         // ID тестового пользователя
export const TEST_HERO_ID = "1";           // ID тестового героя

// Проверочная функция
export function logConstants() {
  console.log('📋 Константы приложения:');
  console.log(`🌐 API URL: ${API_BASE_URL}`);
  console.log(`💰 Начальное золото: ${INITIAL_GOLD}`);
  console.log(`📈 Базовый доход: ${BASE_PASSIVE_INCOME}/сек`);
  console.log(`👤 Тестовый пользователь: ${TEST_USER_ID}`);
  console.log(`🦸 Тестовый герой: ${TEST_HERO_ID}`);
}

// src/shared/constants/index.ts - добавить только следующее:

// Категории товаров
export const SHOP_CATEGORIES = {
  MAX_HEALTH: "max-health",
  HEALTH_REGEN: "health-regen",
  MAX_MANA: "max-mana",
  MANA_REGEN: "mana-regen",
  DAMAGE: "damage",
  VAMPIRISM: "vampirism",
  MOVEMENT_SPEED: "movement-speed",
  INCOME: "income"
};

// Формула расчета цены предметов
export const PRICE_MULTIPLIER = 1.15;      // Множитель цены при покупке предмета