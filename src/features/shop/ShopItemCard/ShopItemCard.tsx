// src/features/shop/ShopItemCard/ShopItemCard.tsx

import './ShopItemCard.css';
import type { ShopItem, ShopCategory } from '../../../shared/types'; 
import { useState } from 'react';
import React from 'react';

interface ShopItemCardProps {
  item: ShopItem;
  category: ShopCategory;
  isAffordable: boolean;
  currentValue: number;
  onBuy: () => void;
  isPurchasing?: boolean; // Новый пропс для отслеживания процесса покупки
}

/**
 * Компонент карточки предмета в магазине
 * 
 * Отображает информацию о предмете и позволяет его купить
 */
function ShopItemCard({ 
  item, 
  category, 
  isAffordable, 
  currentValue,
  onBuy,
  isPurchasing = false
}: ShopItemCardProps) {
  // Состояние для анимации нажатия кнопки
  const [isPressing, setIsPressing] = useState(false);
  
  // Расчёт следующего значения характеристики после покупки
  // Добавляем базовое значение предмета к текущему значению характеристики
  const nextValue = (currentValue + item.baseValue).toFixed(2);
  
  // Определяем, является ли цена большим числом (для применения специальных стилей)
  const isLargePrice = item.currentPrice >= 1000;
  
  // Обработчики событий для анимации кнопки
  const handleMouseDown = () => {
    if (isAffordable && !isPurchasing) {
      setIsPressing(true);
    }
  };
  
  const handleMouseUp = () => {
    setIsPressing(false);
  };
  
  const handleMouseLeave = () => {
    setIsPressing(false);
  };

  // Красивый форматтер для чисел (добавляет разделители тысяч)
  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('ru-RU').format(num);
  };

  return (
    <div className="shop-item-card">
      {/* Контейнер для иконки предмета с уровнем */}
      <div className="item-icon-wrapper">
        <img 
          src={item.img} 
          alt={item.title} 
          className="item-icon"
          onError={(e) => {
            // Если изображение не загрузилось, заменяем на заглушку
            const target = e.target as HTMLImageElement;
            target.src = '/media/shop/items/placeholder.jpg';
            console.warn(`Ошибка загрузки изображения: ${item.img}`);
          }}
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
        className={`item-buy-button ${!isAffordable || isPurchasing ? 'disabled' : ''} ${isLargePrice ? 'large-price' : ''} ${isPressing ? 'pressing' : ''}`}
        onClick={isAffordable && !isPurchasing ? onBuy : undefined}
        disabled={!isAffordable || isPurchasing} // Блокируем кнопку, если нельзя купить или идет покупка
        aria-label={`Купить ${item.title} за ${item.currentPrice} золота`}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{
          // Применяем цвет категории к кнопке для активных кнопок
          borderColor: isAffordable && !isPurchasing ? category.color : '#555',
          background: isAffordable && !isPurchasing 
            ? `linear-gradient(to bottom, ${category.color}99, #040266)`
            : 'linear-gradient(to bottom, #333, #111)'
        }}
      >
        {isPurchasing ? (
          // Показываем индикатор загрузки во время покупки
          <span className="loading-indicator">
            <span className="loading-dot"></span>
            <span className="loading-dot"></span>
            <span className="loading-dot"></span>
          </span>
        ) : (
          // Обычное отображение цены
          <>
            <span className="button-price">{formatNumber(item.currentPrice)}</span>
            <img 
              src="/media/shop/images/gold.png" 
              alt="Золото" 
              className="button-icon"
            />
          </>
        )}
      </button>
    </div>
  );
}

// Оборачиваем компонент в React.memo для оптимизации ререндеров
export default React.memo(ShopItemCard, (prevProps, nextProps) => {
  // Возвращаем true, если пропсы не изменились (компонент не будет перерендерен)
  return (
    prevProps.item.level === nextProps.item.level &&
    prevProps.item.currentPrice === nextProps.item.currentPrice &&
    prevProps.isAffordable === nextProps.isAffordable &&
    prevProps.currentValue === nextProps.currentValue &&
    prevProps.isPurchasing === nextProps.isPurchasing
  );
});