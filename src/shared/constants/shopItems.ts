// src/shared/constants/shopItems.ts

import type { ShopItem } from '../types';

// Временные данные для тестирования
export const testShopItems: Record<string, ShopItem[]> = {
  "max-health": [
    {
      id: "1",
      img: "/media/shop/items/gauntlets_of_strength.jpg",
      title: "Перчатки силы",
      value: 3,
      baseValue: 3,
      level: 1,
      basePrice: 150,
      currentPrice: 150,
      priceFormula: (price) => Math.ceil(price * 1.15)
    },
    {
      id: "2",
      img: "/media/shop/items/belt_of_strength.jpg",
      title: "Пояс силы",
      value: 6,
      baseValue: 6,
      level: 1,
      basePrice: 450,
      currentPrice: 450,
      priceFormula: (price) => Math.ceil(price * 1.15)
    },
    {
      id: "3",
      img: "/media/shop/items/ogre_axe.jpg",
      title: "Топор огра",
      value: 10,
      baseValue: 10,
      level: 1,
      basePrice: 1000,
      currentPrice: 1000,
      priceFormula: (price) => Math.ceil(price * 1.15)
    }
  ],
  "income": [
    {
      id: "44",
      img: "/media/shop/items/hand_of_midas.jpg",
      title: "Рука Мидаса",
      value: 2,
      baseValue: 2,
      level: 1,
      basePrice: 200,
      currentPrice: 200,
      priceFormula: (price) => Math.ceil(price * 1.15)
    },
    {
      id: "45",
      img: "/media/shop/items/battle_fury.jpg",
      title: "Боевое Неистовство",
      value: 5,
      baseValue: 5,
      level: 1,
      basePrice: 500,
      currentPrice: 500,
      priceFormula: (price) => Math.ceil(price * 1.15)
    }
  ]
};