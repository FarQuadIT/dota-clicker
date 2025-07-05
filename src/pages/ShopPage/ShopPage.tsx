// src/pages/ShopPage/ShopPage.tsx

/**
 * @fileoverview Страница магазина игры Dota Clicker
 * 
 * Данный компонент представляет основную страницу магазина, где игрок может
 * приобретать предметы для улучшения различных характеристик своего героя.
 * Магазин разделен на категории по типам улучшаемых характеристик (здоровье,
 * мана, урон и т.д.). Каждая покупка мгновенно влияет на соответствующую
 * характеристику героя и синхронизируется с сервером.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { shopCategories } from '../../shared/constants/shopConfig';
import type { ShopItem, HeroStats } from '../../shared/types';
import { useGold } from '../../contexts/GoldContext';
import { useHeroStore } from '../../contexts/heroStore';
import ShopItemCard from '../../features/shop/ShopItemCard/ShopItemCard';
import './ShopPage.css';
import { SHOP_CATEGORIES, TEST_USER_ID, TEST_HERO_ID } from '../../shared/constants';
import { fetchHeroItems, updateItemLevel } from '../../shared/api/apiService';
import { audioManager } from '../../game/managers/SoundManager';

/**
 * Компонент страницы магазина
 * 
 * Отображает категории товаров и список предметов текущей категории,
 * позволяет покупать предметы за золото и улучшать характеристики героя.
 * Включает в себя меню категорий, информацию о текущей характеристике
 * и список доступных предметов для покупки.
 */
export default function ShopPage() {
  // Ref для отслеживания состояния монтирования компонента
  const isMountedRef = useRef(true);

  // Cleanup при размонтировании
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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
  
  /**
   * Загружает предметы с сервера
   * 
   * Выполняет запрос за доступными предметами для героя,
   * устанавливает их в состояние или обрабатывает ошибку
   */
  const loadItems = useCallback(async () => {
    // Проверяем, что компонент все еще смонтирован
    if (!isMountedRef.current) return;
    
    // Предотвращаем повторную загрузку, если данные уже есть
    if (Object.keys(items).length > 0) return;
    
    setIsInitialLoading(true);
    setError(null);
    
    try {
      const fetchedItems = await fetchHeroItems(TEST_USER_ID, TEST_HERO_ID);
      
      // Проверяем, что компонент все еще смонтирован
      if (!isMountedRef.current) return;
      
      if (fetchedItems) {
        setItems(fetchedItems);
      } else {
        throw new Error('Не удалось загрузить предметы магазина');
      }
    } catch (error) {
      // Проверяем, что компонент все еще смонтирован
      if (!isMountedRef.current) return;
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Ошибка загрузки предметов магазина';
      setError(errorMessage);
    } finally {
      // Проверяем, что компонент все еще смонтирован
      if (!isMountedRef.current) return;
      
      setIsInitialLoading(false);
    }
  }, [items]);
  
  // Эффект для загрузки предметов при монтировании компонента
  useEffect(() => {
    loadItems();
  }, [loadItems]);
  
  /**
   * Устанавливает флаг покупки для предмета
   * 
   * @param itemId - ID предмета
   * @param isPurchasing - Устанавливаемый флаг покупки
   */
  const setItemPurchasingState = useCallback((itemId: string, isPurchasing: boolean) => {
    // Проверяем, что компонент все еще смонтирован
    if (!isMountedRef.current) return;
    
    setPurchasingItemIds(prev => {
      const newSet = new Set(prev);
      if (isPurchasing) {
        newSet.add(itemId);
      } else {
        newSet.delete(itemId);
      }
      return newSet;
    });
  }, []);
  
  /**
   * Обрабатывает покупку предмета
   * 
   * Проверяет возможность покупки, обновляет характеристики героя,
   * синхронизирует изменения с сервером
   * 
   * @param category - Категория предмета
   * @param itemIndex - Индекс предмета в массиве данной категории
   */
  const buyItem = useCallback(async (category: string, itemIndex: number) => {
    // Уведомляем AudioManager о пользовательском взаимодействии (для разблокировки звуков в браузере)
    try {
      audioManager.onUserInteraction();
    } catch (error) {
      console.warn('⚠️ Не удалось разблокировать звуки:', error);
    }
    
    // Проверяем, что компонент все еще смонтирован
    if (!isMountedRef.current) return;
    
    // Получаем текущий предмет
    const item = items[category][itemIndex];
    
    // Проверяем возможность покупки
    if (purchasingItemIds.has(item.id) || gold < item.currentPrice || !stats) {
      return;
    }
    
    // Отмечаем предмет как покупаемый (для индикатора загрузки)
    setItemPurchasingState(item.id, true);
    
    try {
      // Проверяем, что компонент все еще смонтирован
      if (!isMountedRef.current) return;
      
      // Стоимость предмета
      const cost = item.currentPrice;
      
      // Уменьшаем золото
      setGold(prev => prev - cost);
      
      // Рассчитываем новое значение характеристики
      const newStatValue = Number(stats[category]) + item.baseValue;
      
      // Обновляем характеристику героя
      updateStat(category as keyof HeroStats, newStatValue);
      
      // Если это предмет дохода, обновляем также пассивный доход
      if (category === SHOP_CATEGORIES.INCOME) {
        setPassiveIncome(newStatValue);
      }
      
      // Создаем обновленный предмет с новым уровнем и ценой
      const updatedItem = {
        ...item,
        level: item.level + 1,
        currentPrice: item.priceFormula(item.currentPrice),
      };
      
      // Проверяем, что компонент все еще смонтирован
      if (!isMountedRef.current) return;
      
      // Обновляем только этот конкретный предмет в массиве
      setItems(prev => {
        const newItems = { ...prev };
        newItems[category] = [...newItems[category]];
        newItems[category][itemIndex] = updatedItem;
        return newItems;
      });
      
      // Получаем обновленные характеристики героя
      const currentStats = useHeroStore.getState().stats!;
      
      // Создаем данные для отправки на сервер
      const payload = {
        userId: TEST_USER_ID,
        heroId: TEST_HERO_ID,
        itemId: item.id,
        currentLevel: updatedItem.level,
        currentValue: newStatValue,
        cost: cost,
        currentPrice: updatedItem.currentPrice,
        maxHealth: currentStats["max-health"],
        healthRegen: currentStats["health-regen"],
        maxEnergy: currentStats["max-mana"],
        energyRegen: currentStats["mana-regen"],
        damage: currentStats["damage"],
        movementSpeed: currentStats["movement-speed"],
        vampirism: currentStats["vampirism"],
        currentIncome: currentStats["income"]
      };
      
      // Отправляем данные на сервер
      await updateItemLevel(payload);
      
      // Воспроизводим звук успешной покупки
      try {
        audioManager.playSound('shop_buy');
      } catch (error) {
        console.warn('⚠️ Не удалось воспроизвести звук покупки:', error);
      }
      
      // Синхронизируем золото с сервером (с флагом, если обновлен доход)
      await syncGoldWithServer(category === SHOP_CATEGORIES.INCOME);
      
    } catch (error) {
      // Проверяем, что компонент все еще смонтирован
      if (!isMountedRef.current) return;
      
      // В случае ошибки возвращаем золото
      setGold(prev => prev + item.currentPrice);
      
      // Оповещаем пользователя об ошибке
      setError('Ошибка при покупке предмета. Попробуйте еще раз.');
      
      // Сбрасываем ошибку через 3 секунды
      setTimeout(() => {
        if (isMountedRef.current) {
          setError(null);
        }
      }, 3000);
    } finally {
      // Проверяем, что компонент все еще смонтирован
      if (!isMountedRef.current) return;
      
      // Снимаем флаг покупки
      setItemPurchasingState(item.id, false);
    }
      }, [items, purchasingItemIds, gold, stats, setItemPurchasingState, setGold, updateStat, setPassiveIncome, syncGoldWithServer]);

  // Получаем список предметов для активной категории (или пустой массив)
  const categoryItems = items[activeCategory] || [];

  /**
   * Обработчик перезагрузки страницы при ошибке
   */
  const handleRetry = useCallback(() => {
    // Проверяем, что компонент все еще смонтирован
    if (!isMountedRef.current) return;
    
    setError(null);
    loadItems();
  }, [loadItems]);

  return (
    <div className="shop-page">
      {/* Верхняя часть с фоном башни */}
      <div className="shop-top">
        <div className="characteristics">
          <span>
            {shopCategories[activeCategory]?.name}: {' '}
            <span 
              className="characteristics-value"
              style={{ 
                color: 'white',
                filter: shopCategories[activeCategory]?.filter || 'none'
              }}
            >
              {stats 
                ? Number(stats[activeCategory]).toFixed(2).replace(/\.?0+$/, '')
                : '0'}
            </span>
            {shopCategories[activeCategory] && (
              <img 
                src={shopCategories[activeCategory].icon} 
                alt={shopCategories[activeCategory].name}
                className="characteristics-icon"
                style={{ filter: shopCategories[activeCategory].filter }}
              />
            )}
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
              onClick={() => {
                // Уведомляем AudioManager о пользовательском взаимодействии
                try {
                  audioManager.onUserInteraction();
                } catch (error) {
                  console.warn('⚠️ Не удалось разблокировать звуки:', error);
                }
                
                // Воспроизводим звук клика по категории
                try {
                  audioManager.playSound('ui_click');
                } catch (error) {
                  console.warn('⚠️ Не удалось воспроизвести звук клика:', error);
                }
                setActiveCategory(key);
              }}
              title={category.name}
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
            // Скелетон-загрузка для предметов
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
            // Сообщение об ошибке с возможностью повторить
            <div style={{ 
              padding: '20px', 
              textAlign: 'center', 
              color: '#ff6b6b' 
            }}>
              <p>{error}</p>
              <button 
                onClick={handleRetry} 
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
            // Карточки предметов для выбранной категории
            categoryItems.map((item, index) => (
              <ShopItemCard
                key={item.id}
                item={item}
                isAffordable={gold >= item.currentPrice}
                currentValue={stats ? Number(stats[activeCategory]) : 0}
                onBuy={() => buyItem(activeCategory, index)}
                isPurchasing={purchasingItemIds.has(item.id)}
                categoryKey={activeCategory}
              />
            ))
          ) : (
            // Заглушка для пустых категорий
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