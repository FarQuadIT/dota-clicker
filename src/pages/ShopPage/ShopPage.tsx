// src/pages/ShopPage/ShopPage.tsx

import { useState, useEffect } from 'react';
import { shopCategories } from '../../shared/constants/shopConfig';
import type { ShopItem, HeroStats } from '../../shared/types';
import { useGold } from '../../contexts/GoldContext';
import { useHeroStore } from '../../contexts/heroStore';
import ShopItemCard from '../../features/shop/ShopItemCard/ShopItemCard';
import './ShopPage.css';
import { SHOP_CATEGORIES, TEST_USER_ID, TEST_HERO_ID } from '../../shared/constants';
import { fetchHeroItems , updateItemLevel } from '../../shared/api/apiService';

/**
 * Компонент страницы магазина
 * 
 * Отображает категории товаров и список предметов текущей категории
 * Позволяет покупать предметы за золото и улучшать характеристики героя
 */
export default function ShopPage() {
  // Состояние для хранения активной категории
  const [activeCategory, setActiveCategory] = useState<string>(SHOP_CATEGORIES.MAX_HEALTH);
  
  // Состояние для хранения всех предметов магазина
  const [items, setItems] = useState<Record<string, ShopItem[]>>({});
  
  // Состояние для отслеживания процесса загрузки первоначальных данных
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  
  // Состояние для отслеживания процесса покупки (для отдельных предметов)
  const [purchasingItemIds, setPurchasingItemIds] = useState<Set<string>>(new Set());
  
  // Состояние ошибки
  const [error, setError] = useState<string | null>(null);
  
  // Получаем золото и функции для его изменения из контекста
  const { gold, setGold, setPassiveIncome, syncGoldWithServer } = useGold();
  
  // Получаем характеристики героя и функции для их изменения из хранилища
  const stats = useHeroStore((state) => state.stats);
  const updateStat = useHeroStore((state) => state.updateStat);
  
  // Эффект для загрузки предметов с сервера при монтировании компонента
  useEffect(() => {
    const loadItems = async () => {
      if (Object.keys(items).length > 0) return; // Предотвращаем повторную загрузку
      
      setIsInitialLoading(true);
      setError(null);
      
      try {
        console.log('🔍 Загружаем предметы магазина...');
        const fetchedItems = await fetchHeroItems(TEST_USER_ID, TEST_HERO_ID);
        
        if (fetchedItems) {
          console.log('✅ Предметы успешно загружены:', fetchedItems);
          setItems(fetchedItems);
        } else {
          throw new Error('Не удалось загрузить предметы');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Ошибка загрузки предметов';
        console.error('❌', errorMessage);
        setError(errorMessage);
      } finally {
        setIsInitialLoading(false);
      }
    };
    
    loadItems();
  }, []);
  
 /**
 * Функция покупки предмета - обновляет предмет и отправляет данные на сервер
 */
/**
 * Функция покупки предмета - обновляет предмет и отправляет данные на сервер
 */
const buyItem = async (category: string, itemIndex: number) => {
  // Получаем текущий предмет
  const item = items[category][itemIndex];
  
  // Если предмет уже в процессе покупки, предотвращаем повторное нажатие
  if (purchasingItemIds.has(item.id)) return;
  
  // Проверяем, хватает ли золота
  if (gold < item.currentPrice) {
    console.log(`Недостаточно золота для ${item.title}. Нужно: ${item.currentPrice}, доступно: ${gold}`);
    return;
  }
  
  // Проверяем, инициализированы ли характеристики героя
  if (!stats) {
    console.log('Характеристики героя не инициализированы');
    return;
  }
  
  // Отмечаем предмет как покупаемый (для показа индикатора загрузки)
  setPurchasingItemIds(prev => new Set(prev).add(item.id));
  
  try {
    // Сохраняем текущую стоимость для отправки на сервер (то, сколько заплатили)
    const cost = item.currentPrice;
    
    // Уменьшаем золото на стоимость предмета
    setGold(prev => prev - cost);
    
    // Обновляем характеристику героя в зависимости от категории предмета
    const newStatValue = Number(stats[category]) + item.baseValue;
    updateStat(category as keyof HeroStats, newStatValue);
    
    // Если это предмет, увеличивающий доход, обновляем пассивный доход
    if (category === SHOP_CATEGORIES.INCOME) {
      setPassiveIncome(newStatValue);
    }
    
    // Создаем обновленный предмет с новым уровнем и ценой
    const updatedItem = {
      ...item,
      level: item.level + 1,
      currentPrice: item.priceFormula(item.currentPrice),
    };
    
    // Обновляем только этот конкретный предмет в массиве предметов
    setItems(prev => {
      const newItems = { ...prev };
      newItems[category] = [...newItems[category]]; // Создаем новый массив
      newItems[category][itemIndex] = updatedItem;  // Заменяем только конкретный предмет
      return newItems;
    });
    
    console.log(`Куплен предмет ${item.title} за ${cost} золота`);
    console.log(`Характеристика ${category} увеличена до ${newStatValue}`);
    
    // Получаем обновленные характеристики героя для отправки на сервер
    const currentStats = useHeroStore.getState().stats!;
    
    // Создаем payload для отправки на сервер, соблюдая формат сервера
    const payload = {
      userId: TEST_USER_ID,
      heroId: TEST_HERO_ID,
      itemId: item.id,
      currentLevel: updatedItem.level,
      currentValue: newStatValue, // Текущее значение характеристики (после покупки)
      cost: cost, // Стоимость, которую заплатили
      currentPrice: updatedItem.currentPrice, // Новая цена для следующей покупки
      maxHealth: currentStats["max-health"],
      healthRegen: currentStats["health-regen"],
      maxEnergy: currentStats["max-mana"],
      energyRegen: currentStats["mana-regen"],
      damage: currentStats["damage"],
      movementSpeed: currentStats["movement-speed"],
      vampirism: currentStats["vampirism"],
      currentIncome: currentStats["income"]
    };
    
    console.log("🟡 === CLIENT DEBUG ===");
    console.log("Gold (до):", gold);
    console.log("Item ID:", item.id);
    console.log("Cost:", cost);
    console.log("Level:", updatedItem.level);
    console.log("Price (следующий):", updatedItem.currentPrice);
    console.log("Current stats:", currentStats);
    console.log("Payload, отправляемый на сервер:", payload);
    console.log("🟡 ====================\n");
    
    // Отправляем данные на сервер
    await updateItemLevel(payload);
    
    // Синхронизируем золото с сервером
    await syncGoldWithServer(category === SHOP_CATEGORIES.INCOME);
    
  } catch (error) {
    console.error('❌ Ошибка при покупке предмета:', error);
    // Возвращаем золото, если произошла ошибка
    setGold(prev => prev + item.currentPrice);
  } finally {
    // Снимаем флаг "в процессе покупки"
    setPurchasingItemIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(item.id);
      return newSet;
    });
  }
};

  // Получаем список предметов для активной категории (или пустой массив)
  const categoryItems = items[activeCategory] || [];

  return (
    <div className="shop-page">
      {/* Верхняя часть с фоном башни */}
      <div className="shop-top">
        <div className="characteristics">
          <span>
            {shopCategories[activeCategory]?.name}: {stats 
              ? Number(stats[activeCategory]).toFixed(2) 
              : '0.00'}
          </span>
        </div>
      </div>

      {/* Меню категорий */}
      <div className="menu-container">
        <div className="menu-grid">
          {Object.entries(shopCategories).map(([key, category]) => (
            <div
              key={key}
              className={`menu-item ${activeCategory === key ? "active" : ""}`}
              onClick={() => setActiveCategory(key)}
              title={category.name}
              style={{
                background: `linear-gradient(to bottom, ${category.color}99, rgba(0,0,0,0.1))`,
                borderColor: category.color,
                color: category.color,
              }}
            >
              <img
                className="menu-icon"
                src={category.icon}
                alt={category.name}
                style={{ filter: category.filter }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Нижняя часть со списком предметов */}
      <div className="shop-bottom">
        <div className="items-scroll-area">
          {isInitialLoading ? (
            // Отображаем скелетон-загрузку, если идет первоначальная загрузка предметов
            Array(3).fill(0).map((_, index) => (
              <div key={`skeleton-${index}`} className="item-placeholder">
                <div className="item-icon-wrapper">
                  <div className="item-icon-placeholder"></div>
                  <div className="item-level">Ур. 1</div>
                </div>
                <div className="item-details-placeholder">
                  <div className="item-title-placeholder"></div>
                  <div className="item-stats-placeholder">
                    <div className="stat-value"></div>
                    <div className="stat-arrow">→</div>
                    <div className="stat-next"></div>
                  </div>
                </div>
                <div className="item-button-placeholder">
                  <div className="button-price"></div>
                  <div className="button-icon"></div>
                </div>
              </div>
            ))
          ) : error ? (
            // Отображаем сообщение об ошибке, если загрузка не удалась
            <div style={{ 
              padding: '20px', 
              textAlign: 'center', 
              color: '#ff6b6b' 
            }}>
              <p>{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                style={{
                  padding: '8px 16px',
                  background: '#1a1a1a',
                  color: 'white',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  marginTop: '10px',
                  cursor: 'pointer'
                }}
              >
                Попробовать снова
              </button>
            </div>
          ) : categoryItems.length > 0 ? (
            // Отображаем карточки предметов, если они есть
            categoryItems.map((item, index) => (
              <ShopItemCard
                key={item.id}
                item={item}
                category={shopCategories[activeCategory]}
                isAffordable={gold >= item.currentPrice} // Проверяем, хватает ли золота
                currentValue={stats ? Number(stats[activeCategory]) : 0} // Текущее значение характеристики
                onBuy={() => buyItem(activeCategory, index)} // Передаем функцию покупки
                isPurchasing={purchasingItemIds.has(item.id)} // Флаг покупки для анимации
              />
            ))
          ) : (
            // Заглушка, если предметов в категории нет
            <div style={{ 
              padding: '20px', 
              textAlign: 'center', 
              color: 'white' 
            }}>
              <p>В этой категории пока нет предметов</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}