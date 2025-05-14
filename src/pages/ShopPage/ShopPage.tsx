// src/pages/ShopPage/ShopPage.tsx

import { useState } from 'react';
import { shopCategories } from '../../shared/constants/shopConfig';
import './ShopPage.css';

export default function ShopPage() {
  // Состояние для активной категории
  const [activeCategory, setActiveCategory] = useState<string>("max-health");

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

      {/* Нижняя часть для предметов */}
      <div className="shop-bottom">
        <div className="items-scroll-area">
          <p style={{ textAlign: 'center', marginTop: '20px' }}>
            Здесь будут предметы категории "{shopCategories[activeCategory].name}"
          </p>
        </div>
      </div>
    </div>
  );
}