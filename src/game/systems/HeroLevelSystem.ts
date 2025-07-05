export interface HeroLevelData {
  currentLevel: number;
  maxLevel: number;
  levelName: string;
}

// Простая реализация EventEmitter для браузера
class SimpleEventEmitter {
  private events: Map<string, Function[]> = new Map();

  emit(event: string, ...args: any[]): void {
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(...args));
    }
  }

  on(event: string, listener: Function): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(listener);
  }

  off(event: string, listener: Function): void {
    const listeners = this.events.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
}

export class HeroLevelSystem extends SimpleEventEmitter {
  private currentLevel: number = 1;
  private readonly maxLevel: number = 30;
  private readonly STORAGE_KEY = 'heroLevel';

  constructor() {
    super();
    this.loadFromStorage();
  }

  /**
   * Получить текущий уровень героя (1-30)
   */
  getCurrentLevel(): number {
    return this.currentLevel;
  }

  /**
   * Повысить уровень героя на 1
   */
  levelUp(): void {
    if (this.canLevelUp()) {
      this.currentLevel++;
      this.saveToStorage();
      this.emit('levelUp', this.currentLevel);
  
    }
  }

  /**
   * Получить максимальный уровень (30)
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
   * Получить название градации уровня
   */
  getLevelName(): string {
    if (this.currentLevel >= 1 && this.currentLevel <= 5) {
      return 'Бронза';
    } else if (this.currentLevel >= 6 && this.currentLevel <= 10) {
      return 'Серебро';
    } else if (this.currentLevel >= 11 && this.currentLevel <= 15) {
      return 'Золото';
    } else if (this.currentLevel >= 16 && this.currentLevel <= 20) {
      return 'Платина';
    } else if (this.currentLevel >= 21 && this.currentLevel <= 25) {
      return 'Мастер';
    } else if (this.currentLevel >= 26 && this.currentLevel <= 30) {
      return 'Грандмастер';
    } else {
      return 'Неизвестно';
    }
  }

  /**
   * Получить полную информацию об уровне
   */
  getLevelData(): HeroLevelData {
    return {
      currentLevel: this.currentLevel,
      maxLevel: this.maxLevel,
      levelName: this.getLevelName()
    };
  }

  /**
   * Установить уровень напрямую (для тестирования)
   */
  setLevel(level: number): void {
    if (level >= 1 && level <= this.maxLevel) {
      this.currentLevel = level;
      this.saveToStorage();
      this.emit('levelChanged', this.currentLevel);

    } else {
      // Некорректный уровень - игнорируем
    }
  }

  /**
   * Сброс уровня до 1 (для перерождения)
   */
  resetLevel(): void {
    this.currentLevel = 1;
    this.saveToStorage();
    this.emit('levelReset');

  }

  /**
   * Сохранение в localStorage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        currentLevel: this.currentLevel,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('❌ Ошибка сохранения уровня героя:', error);
    }
  }

  /**
   * Загрузка из localStorage
   */
  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.currentLevel && data.currentLevel >= 1 && data.currentLevel <= this.maxLevel) {
          this.currentLevel = data.currentLevel;
    
        }
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки уровня героя:', error);
      this.currentLevel = 1; // Сброс на начальный уровень при ошибке
    }
  }
}

// Экспорт единственного экземпляра (Singleton)
export const heroLevelSystem = new HeroLevelSystem(); 