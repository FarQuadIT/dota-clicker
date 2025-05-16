// src/features/shop/ShopItemCard/ShopItemCard.tsx

/**
 * @fileoverview Компонент карточки предмета в магазине игры
 * 
 * Данный компонент отображает отдельный предмет в магазине, включая его изображение,
 * название, текущий уровень, цену и эффект от покупки. Позволяет игроку взаимодействовать
 * с предметом (покупать его) и визуально отображает состояние процесса покупки.
 * 
 * Компонент обладает следующими возможностями:
 * - Отображение информации о предмете (название, уровень, изображение)
 * - Визуализация эффекта от покупки (текущее → новое значение)
 * - Кнопка покупки с отображением цены и состояния доступности
 * - Визуальная обратная связь при взаимодействии (анимация нажатия)
 * - Индикация процесса покупки (загрузка)
 * - Обработка ошибок загрузки изображений
 */

import './ShopItemCard.css';
import type { ShopItem, ShopCategory } from '../../../shared/types'; 
import { useState, useCallback } from 'react';
import React from 'react';

/**
 * Свойства компонента карточки предмета
 * 
 * @property {ShopItem} item - Объект предмета с информацией (уровень, цена и т.д.)
 * @property {ShopCategory} category - Категория предмета для стилизации
 * @property {boolean} isAffordable - Флаг доступности предмета для покупки (хватает ли золота)
 * @property {number} currentValue - Текущее значение характеристики героя
 * @property {function} onBuy - Функция-обработчик покупки предмета
 * @property {boolean} [isPurchasing=false] - Флаг, указывающий, что предмет в процессе покупки
 */
interface ShopItemCardProps {
  item: ShopItem;
  category: ShopCategory;
  isAffordable: boolean;
  currentValue: number;
  onBuy: () => void;
  isPurchasing?: boolean;
}

/**
 * Компонент карточки предмета в магазине
 * 
 * Отображает информацию о предмете, его свойства и визуализирует изменения
 * характеристик героя при покупке. Также обрабатывает взаимодействия пользователя.
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
  const nextValue = (currentValue + item.baseValue).toFixed(2).replace(/\.?0+$/, '');
  
  // Определяем, является ли цена большим числом (для применения специальных стилей)
  const isLargePrice = item.currentPrice >= 1000;
  
  // Флаг активности кнопки покупки
  const isButtonActive = isAffordable && !isPurchasing;
  
  /**
   * Форматирует число, добавляя разделители тысяч для улучшения читаемости
   * Использует Intl.NumberFormat для корректного форматирования согласно локали
   * 
   * @param num - Число для форматирования
   * @returns Отформатированная строка с разделителями
   */
  const formatNumber = useCallback((num: number): string => {
    // Для очень больших чисел используем сокращенный формат
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return new Intl.NumberFormat('ru-RU').format(num);
  }, []);
  
  /**
   * Обработчик нажатия на кнопку покупки
   * Устанавливает состояние нажатия для визуального эффекта
   */
  const handleMouseDown = useCallback(() => {
    if (isButtonActive) {
      setIsPressing(true);
    }
  }, [isButtonActive]);
  
  /**
   * Обработчик отпускания кнопки мыши
   * Сбрасывает состояние нажатия
   */
  const handleMouseUp = useCallback(() => {
    setIsPressing(false);
  }, []);
  
  /**
   * Обработчик выхода курсора за пределы кнопки
   * Сбрасывает состояние нажатия, если пользователь увел мышь с кнопки
   */
  const handleMouseLeave = useCallback(() => {
    setIsPressing(false);
  }, []);

  /**
   * Обработчик ошибки загрузки изображения
   * Заменяет несуществующее изображение на заглушку
   */
  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.src = '/media/shop/items/placeholder.jpg';
    // Убираем console.warn в продакшн версии
    if (import.meta.env.MODE !== 'production') {
      console.warn(`Ошибка загрузки изображения: ${item.img}`);
    }
  }, [item.img]);

  // Стиль кнопки, зависящий от доступности предмета
  const buttonStyle = {
    borderColor: isButtonActive ? category.color : '#555',
    background: isButtonActive 
      ? `linear-gradient(to bottom, ${category.color}99, #040266)`
      : 'linear-gradient(to bottom, #333, #111)'
  };

  return (
    <div className="shop-item-card">
      {/* Контейнер для иконки предмета с уровнем */}
      <div className="item-icon-wrapper">
        <img 
          src={item.img} 
          alt={item.title} 
          className="item-icon"
          onError={handleImageError}
        />
        <div className="item-level">Ур. {item.level}</div>
      </div>
      
      {/* Детали предмета: название и показатели характеристик */}
      <div className="item-details">
        <h3 className="item-title">{item.title}</h3>
        <div className="item-stats">
          <span className="stat-current">+{item.baseValue}</span>
          <span className="stat-arrow">→</span>
          <span className="stat-next">{nextValue}</span>
        </div>
      </div>
      
      {/* Кнопка покупки предмета с ценой */}
      <button 
        className={`item-buy-button ${!isButtonActive ? 'disabled' : ''} ${isLargePrice ? 'large-price' : ''} ${isPressing ? 'pressing' : ''}`}
        onClick={isButtonActive ? onBuy : undefined}
        disabled={!isButtonActive}
        aria-label={`Купить ${item.title} за ${item.currentPrice} золота`}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={buttonStyle}
      >
        {isPurchasing ? (
          // Индикатор загрузки в процессе покупки
          <span className="loading-indicator">
            <span className="loading-dot"></span>
            <span className="loading-dot"></span>
            <span className="loading-dot"></span>
          </span>
        ) : (
          // Отображение цены предмета
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

/**
 * Мемоизированная версия компонента карточки предмета
 * 
 * Предотвращает лишние ререндеры при изменении внешних состояний,
 * которые не влияют на отображение этого конкретного предмета.
 * 
 * Компонент перерендерится только при изменении:
 * - Уровня предмета
 * - Текущей цены
 * - Доступности для покупки
 * - Значения характеристики
 * - Состояния процесса покупки
 */
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