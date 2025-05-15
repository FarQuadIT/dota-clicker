// src/pages/ShopPage/ShopPage.tsx

import { useState, useEffect } from 'react';
import { shopCategories } from '../../shared/constants/shopConfig';
import { testShopItems } from '../../shared/constants/shopItems';
import type { ShopItem } from '../../shared/types';
import { useGold } from '../../contexts/GoldContext';
import { useHeroStore, type HeroStats } from '../../contexts/heroStore'; // Импортируем наше хранилище
import ShopItemCard from '../../features/shop/ShopItemCard/ShopItemCard';
import './ShopPage.css';
 
/**
 * Компонент страницы магазина
 * 
 * Отображает категории товаров и список предметов текущей категории
 * Позволяет покупать предметы за золото и улучшать характеристики героя
 */
export default function ShopPage() {
  // Состояние для хранения активной категории
  const [activeCategory, setActiveCategory] = useState<string>("max-health");
  
  // Получаем золото и функции для его изменения из контекста
  const { gold, setGold, setPassiveIncome } = useGold();
  
  // Получаем характеристики героя и функции для их изменения из хранилища
  const stats = useHeroStore((state) => state.stats);
  const updateStat = useHeroStore((state) => state.updateStat);
  const setStats = useHeroStore((state) => state.setStats);
  
  // Получаем список предметов для активной категории (или пустой массив)
  const categoryItems = testShopItems[activeCategory] || [];

  // Для демонстрации - создаем тестовые характеристики героя при первой загрузке
  useEffect(() => {
    // Если характеристики еще не установлены, создаем тестовые
    if (!stats) {
      const initialStats: HeroStats = {
        "max-health": 100,
        "health-regen": 1,
        "max-mana": 50,
        "mana-regen": 0.5,
        "damage": 10,
        "vampirism": 0,
        "movement-speed": 5,
        "income": 5,
        heroId: "1"
      };
      setStats(initialStats);
    }
  }, [stats, setStats]);

  /**
   * Функция для покупки предмета
   * 
   * @param item - Предмет, который нужно купить
   */
  const buyItem = (item: ShopItem) => {
    // Проверяем, достаточно ли золота для покупки
    if (gold < item.currentPrice) {
      console.log(`Недостаточно золота для покупки ${item.title}. Нужно: ${item.currentPrice}, доступно: ${gold.toFixed(2)}`);
      return; // Выходим из функции, если золота недостаточно
    }
    
    // Проверяем, инициализированы ли характеристики героя
    if (!stats) {
      console.log('Характеристики героя не инициализированы');
      return;
    }
    
    // Уменьшаем золото на стоимость предмета
    setGold(gold - item.currentPrice);
    
    // Обновляем характеристику героя в зависимости от категории предмета
    const newValue = Number(stats[activeCategory]) + item.baseValue;
    updateStat(activeCategory as keyof HeroStats, newValue);
    
    // Если это предмет, увеличивающий доход, обновляем пассивный доход
    if (activeCategory === 'income') {
      setPassiveIncome(newValue);
    }
    
    console.log(`Куплен предмет ${item.title} за ${item.currentPrice} золота`);
    console.log(`Характеристика ${activeCategory} увеличена до ${newValue}`);
  };

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
          {categoryItems.length > 0 ? (
            // Отображаем карточки предметов, если они есть
            categoryItems.map((item) => (
              <ShopItemCard
                key={item.id}
                item={item}
                category={shopCategories[activeCategory]}
                isAffordable={gold >= item.currentPrice} // Проверяем, хватает ли золота
                currentValue={stats ? Number(stats[activeCategory]) : 0} // Текущее значение характеристики
                onBuy={() => buyItem(item)} // Передаем функцию покупки
              />
            ))
          ) : (
            // Заглушка, если предметов нет
            <div className="item-placeholder">
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
          )}
        </div>
      </div>
    </div>
  );
}