// src/pages/ShopPage/ShopPage.tsx

import { useState } from 'react';
import { shopCategories } from '../../shared/constants/shopConfig';
import './ShopPage.css';

export default function ShopPage() {
  const [activeCategory, setActiveCategory] = useState<string>("max-health");
  const mockItems = [1, 2, 3, 4, 5];

  return (
    <div className="shop-page">
      <div className="shop-top">
        <div className="characteristics">
          <span>
            {shopCategories[activeCategory].name}: 100.00
          </span>
        </div>
      </div>

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

      <div className="shop-bottom">
        <div className="items-scroll-area">
          {mockItems.map((item) => (
            <div key={item} className="item-placeholder">
              <div className="item-icon-wrapper">
                <div className="item-icon-placeholder"></div>
                <div className="item-level">Ур. {item}</div>
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
          ))}
        </div>
      </div>
    </div>
  );
}