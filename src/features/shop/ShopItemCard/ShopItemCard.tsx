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
  // Добавляем базовое значение предмета к текущему значению характеристики
  const nextValue = (currentValue + item.baseValue).toFixed(2);
  
  // Определяем, является ли цена большим числом (для применения специальных стилей)
  const isLargePrice = item.currentPrice >= 1000;

  return (
    <div className="shop-item-card">
      {/* Контейнер для иконки предмета с уровнем */}
      <div className="item-icon-wrapper">
        <img 
          src={item.img} 
          alt={item.title} 
          className="item-icon"
        />
        <div className="item-level">Ур. {item.level}</div>
      </div>
      
      {/* Детали предмета: название и показатели характеристик */}
      <div className="item-details">
        <h3 className="item-title">{item.title}</h3>
        <div className="item-stats">
          {/* Текущий бонус от предмета */}
          <span className="stat-current">+{item.baseValue}</span>
          {/* Стрелка указывает на изменение */}
          <span className="stat-arrow">→</span>
          {/* Новое значение характеристики после покупки */}
          <span className="stat-next">{nextValue}</span>
        </div>
      </div>
      
      {/* Кнопка покупки предмета с ценой */}
      <button 
        className={`item-buy-button ${!isAffordable ? 'disabled' : ''} ${isLargePrice ? 'large-price' : ''}`}
        onClick={isAffordable ? onBuy : undefined}
        disabled={!isAffordable}
        aria-label={`Купить ${item.title} за ${item.currentPrice} золота`}
      >
        {/* Отображение цены предмета */}
        <span className="button-price">{item.currentPrice}</span>
        {/* Иконка золота */}
        <img 
          src="/media/shop/images/gold.png" 
          alt="Золото" 
          className="button-icon"
        />
      </button>
    </div>
  );
}