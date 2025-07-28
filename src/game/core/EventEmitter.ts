/**
 * @fileoverview Простая реализация EventEmitter для браузера
 * 
 * Предоставляет базовую функциональность для работы с событиями:
 * - Подписка на события (on)
 * - Отписка от событий (off)
 * - Генерация событий (emit)
 */

/**
 * Простая реализация EventEmitter для использования в игровых системах
 */
export class SimpleEventEmitter {
  private events: Map<string, Function[]> = new Map();

  /**
   * Генерирует событие с указанными аргументами
   * @param event - Название события
   * @param args - Аргументы события
   */
  emit(event: string, ...args: any[]): void {
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(...args));
    }
  }

  /**
   * Подписывается на событие
   * @param event - Название события
   * @param listener - Функция-обработчик
   */
  on(event: string, listener: Function): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(listener);
  }

  /**
   * Отписывается от события
   * @param event - Название события
   * @param listener - Функция-обработчик для удаления
   */
  off(event: string, listener: Function): void {
    const listeners = this.events.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Очищает все обработчики событий
   */
  removeAllListeners(): void {
    this.events.clear();
  }
} 