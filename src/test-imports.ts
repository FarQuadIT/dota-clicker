// Проверяем, что можем импортировать React Router
import { BrowserRouter } from 'react-router-dom';

// Проверяем, что можем импортировать Zustand
import { create } from 'zustand';

// Тестовая функция
export function testImports() {
  console.log('✅ React Router импортирован успешно');
  console.log('✅ Zustand импортирован успешно');
  console.log('📦 Тип BrowserRouter:', typeof BrowserRouter);
  console.log('📦 Тип create:', typeof create);
}

// Экспортируем для использования
export { BrowserRouter, create };