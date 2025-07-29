/**
 * @fileoverview Система уровней героя (1-30) 
 * 
 * Реализует логику повышения уровня героя с сохранением в API сервера.
 * Поддерживает 6 градаций уровней от Бронзы до Грандмастера.
 * Использует EventEmitter для уведомления о событиях изменения уровня.
 */

import { SimpleEventEmitter } from '../../game/core/EventEmitter';
import { levelUpActiveHero, getActiveHeroLevel } from '../../shared/api/apiService';
import { TEST_USER_ID } from '../../shared/constants';

/**
 * Интерфейс для данных уровня героя
 */
export interface HeroLevelData {
  currentLevel: number;
  maxLevel: number;
  levelName: string;
}

/**
 * Система уровней героя
 * 
 * Управляет уровнем активного героя (1-30) с сохранением на сервере.
 * Предоставляет события для отслеживания изменений уровня.
 */
export class HeroLevelSystem extends SimpleEventEmitter {
  // Явно объявляем методы EventEmitter для TypeScript
  declare emit: (event: string, ...args: any[]) => void;
  declare on: (event: string, listener: Function) => void;
  declare off: (event: string, listener: Function) => void;
  private currentLevel: number = 1;
  private readonly maxLevel: number = 30;
  private isLoading: boolean = false;

  constructor() {
    super();
    this.loadFromServer();
  }

  /**
   * Получить текущий уровень героя
   */
  getCurrentLevel(): number {
    return this.currentLevel;
  }

  /**
   * Повысить уровень героя на 1 (через API)
   */
  async levelUp(): Promise<void> {
    if (!this.canLevelUp() || this.isLoading) {
      console.warn('⚠️ Нельзя повысить уровень: максимум достигнут или идет загрузка');
      return;
    }

    this.isLoading = true;
    
    try {
      
      // Вызываем API для повышения уровня
      const success = await levelUpActiveHero(TEST_USER_ID);
      
      if (success) {
        // Получаем обновленный уровень с сервера
        const newLevel = await getActiveHeroLevel(TEST_USER_ID);
        
        if (newLevel !== null && newLevel > this.currentLevel) {
          const oldLevel = this.currentLevel;
          this.currentLevel = newLevel;
          

          this.emit('levelUp', this.currentLevel);
        } else {
          console.warn('⚠️ Сервер не подтвердил повышение уровня');
        }
      } else {
        console.error('❌ Не удалось повысить уровень на сервере');
      }
    } catch (error) {
      console.error('❌ Ошибка при повышении уровня:', error);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Получить максимальный уровень
   */
  getMaxLevel(): number {
    return this.maxLevel;
  }

  /**
   * Проверить, можно ли повысить уровень
   */
  canLevelUp(): boolean {
    return this.currentLevel < this.maxLevel;
  }

  /**
   * Получить название уровня в зависимости от текущего уровня
   */
  getLevelName(): string {
    if (this.currentLevel >= 1 && this.currentLevel <= 5) {
      return "Бронза";
    } else if (this.currentLevel >= 6 && this.currentLevel <= 10) {
      return "Серебро";
    } else if (this.currentLevel >= 11 && this.currentLevel <= 15) {
      return "Золото";
    } else if (this.currentLevel >= 16 && this.currentLevel <= 20) {
      return "Платина";
    } else if (this.currentLevel >= 21 && this.currentLevel <= 25) {
      return "Мастер";
    } else if (this.currentLevel >= 26 && this.currentLevel <= 30) {
      return "Грандмастер";
    }
    return "Неизвестно";
  }

  /**
   * Получить полные данные об уровне
   */
  getLevelData(): HeroLevelData {
    return {
      currentLevel: this.currentLevel,
      maxLevel: this.maxLevel,
      levelName: this.getLevelName()
    };
  }

  /**
   * Установить уровень героя (для синхронизации с сервером)
   */
  setLevel(level: number): void {
    if (level >= 1 && level <= this.maxLevel) {
      const oldLevel = this.currentLevel;
      this.currentLevel = level;

      this.emit('levelChanged', this.currentLevel);
    }
  }

  /**
   * Сбросить уровень к начальному
   */
  resetLevel(): void {
    this.currentLevel = 1;

    this.emit('levelReset');
  }

  /**
   * Загрузка уровня с сервера
   */
  private async loadFromServer(): Promise<void> {
    if (this.isLoading) return;
    
    this.isLoading = true;
    
    try {

      
      const level = await getActiveHeroLevel(TEST_USER_ID);
      
      if (level !== null && level >= 1 && level <= this.maxLevel) {
        const oldLevel = this.currentLevel;
        this.currentLevel = level;

        
        if (oldLevel !== level) {
          this.emit('levelChanged', this.currentLevel);
        }
      } else {
        console.warn('⚠️ Некорректный уровень с сервера, используем значение по умолчанию');
        this.currentLevel = 1;
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки уровня с сервера:', error);
      this.currentLevel = 1; // Сброс на начальный уровень при ошибке
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Принудительная перезагрузка уровня с сервера
   */
  async reloadFromServer(): Promise<void> {
    await this.loadFromServer();
  }
}

/**
 * Глобальный экземпляр системы уровней героя
 */
export const heroLevelSystem = new HeroLevelSystem();

// Добавляем глобальные функции для отладки
if (typeof window !== 'undefined') {
  (window as any).heroLevelSystem = heroLevelSystem;
  
  // Функция для обновления уровня из внешних источников
  (window as any).updateHeroLevelFromServer = (newLevel: number) => {
    if (newLevel && newLevel >= 1 && newLevel <= 30) {
      heroLevelSystem.setLevel(newLevel);

    }
  };
} 