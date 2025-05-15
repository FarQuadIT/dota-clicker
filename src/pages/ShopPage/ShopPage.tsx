// src/pages/ShopPage/ShopPage.tsx

import { useState } from 'react';
import { shopCategories } from '../../shared/constants/shopConfig';
import { testShopItems } from '../../shared/constants/shopItems';
import type { ShopItem } from '../../shared/types'; // Импортируем тип
import { useGold } from '../../contexts/GoldContext';
import ShopItemCard from '../../features/shop/ShopItemCard/ShopItemCard';
import './ShopPage.css';

/**
 * Компонент страницы магазина
 * 
 * Отображает категории товаров и список предметов текущей категории
 * Позволяет покупать предметы за золото
 */
export default function ShopPage() {
  // Состояние для хранения активной категории
  const [activeCategory, setActiveCategory] = useState<string>("max-health");
  
  // Получаем золото и функцию для его изменения из контекста
  const { gold, setGold } = useGold();
  
  // Получаем список предметов для активной категории (или пустой массив)
  const categoryItems = testShopItems[activeCategory] || [];

  /**
   * Функция для покупки предмета
   * 
   * @param item - Предмет, который нужно купить
   */
  const buyItem = (item: ShopItem) => { // Добавляем явный тип ShopItem
    // Проверяем, достаточно ли золота для покупки
      // Добавим дополнительную проверку здесь
    if (gold < item.currentPrice) {
      console.log(`Недостаточно золота для покупки ${item.title}. Нужно: ${item.currentPrice}, доступно: ${gold.toFixed(2)}`);
      return; // Выходим из функции, если золота недостаточно
    }
    if (gold >= item.currentPrice) {
      // Уменьшаем золото на стоимость предмета
      setGold(gold - item.currentPrice);
      // Выводим сообщение в консоль (временно, потом заменим на реальную покупку)
      console.log(`Куплен предмет ${item.title} за ${item.currentPrice} золота`);
    }
  };

  return (
    <div className="shop-page">
      {/* Верхняя часть с фоном башни */}
      <div className="shop-top">
        <div className="characteristics">
          <span>
            {shopCategories[activeCategory].name}: 100.00
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
                currentValue={100} // Временное значение (позже заменим на реальное)
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