// src/features/shop/ShopItemCard/ShopItemCard.tsx

import './ShopItemCard.css';
import type { ShopItem, ShopCategory } from '../../../shared/types';

interface ShopItemCardProps {
  item: ShopItem;
  category: ShopCategory;
  isAffordable: boolean;
  currentValue: number;
  onBuy: () => void;
}

export default function ShopItemCard({ 
  item, 
  category, 
  isAffordable, 
  currentValue,
  onBuy 
}: ShopItemCardProps) {
  // Расчёт следующего значения характеристики после покупки
  const nextValue = (currentValue + item.baseValue).toFixed(2);

  return (
    <div className="shop-item-card">
      <div className="item-icon-wrapper">
        <img 
          src={item.img} 
          alt={item.title} 
          className="item-icon"
        />
        <div className="item-level">Ур. {item.level}</div>
      </div>
      
      <div className="item-details">
        <h3 className="item-title">{item.title}</h3>
        <div className="item-stats">
          <span className="stat-current">+{item.baseValue}</span>
          <span className="stat-arrow">→</span>
          <span className="stat-next">{nextValue}</span>
        </div>
      </div>
      
      <button 
        className={`item-buy-button ${!isAffordable ? 'disabled' : ''}`}
        onClick={isAffordable ? onBuy : undefined}
        disabled={!isAffordable}
      >
        <span className="button-price">{item.currentPrice}</span>
        <img 
          src="/media/shop/images/gold.png" 
          alt="Золото" 
          className="button-icon"
        />
      </button>
    </div>
  );
}