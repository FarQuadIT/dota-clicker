/**
 * Компонент для визуальных эффектов урона
 * Создает частицы крови/искр при нанесении урона
 */

import { Container, Graphics, Application } from 'pixi.js';

/**
 * Конфигурация эффекта урона
 */
interface DamageEffectConfig {
  /** Количество частиц */
  particleCount?: number;
  /** Цвет частиц */
  color?: number;
  /** Размер частиц */
  particleSize?: number;
  /** Скорость разлета */
  speed?: number;
  /** Время жизни эффекта (мс) */
  duration?: number;
  /** Гравитация (для падения частиц) */
  gravity?: number;
}

/**
 * Одна частица эффекта
 */
class DamageParticle extends Graphics {
  public velocityX: number = 0;
  public velocityY: number = 0;
  public lifeTime: number = 0;
  public maxLifeTime: number = 1000;
  public gravity: number = 0.2;
  
  constructor(color: number, size: number) {
    super();
    
    // Создаем частицу как кружок
    this.circle(0, 0, size);
    this.fill(color);
    
    // Устанавливаем anchor по центру
    this.pivot.set(size / 2, size / 2);
  }
  
  /**
   * Обновление частицы
   */
  public update(deltaTime: number): boolean {
    // Обновляем время жизни
    this.lifeTime += deltaTime;
    
    // Применяем скорость
    this.x += this.velocityX * deltaTime / 16.6; // Нормализуем к 60fps
    this.y += this.velocityY * deltaTime / 16.6;
    
    // Применяем гравитацию
    this.velocityY += this.gravity * deltaTime / 16.6;
    
    // Замедляем горизонтальную скорость (сопротивление воздуха)
    this.velocityX *= 0.98;
    
    // Вычисляем прозрачность (fade out)
    const lifeProgress = this.lifeTime / this.maxLifeTime;
    this.alpha = Math.max(0, 1 - lifeProgress);
    
    // Уменьшаем размер со временем
    const scale = Math.max(0.1, 1 - lifeProgress * 0.5);
    this.scale.set(scale);
    
    // Возвращаем true если частица еще жива
    return this.lifeTime < this.maxLifeTime;
  }
}

/**
 * Контейнер эффекта урона
 */
export class DamageEffect extends Container {
  private particles: DamageParticle[] = [];
  private app: Application;
  private config: Required<DamageEffectConfig>;
  
  constructor(app: Application, config: DamageEffectConfig = {}) {
    super();
    
    this.app = app;
    this.config = {
      particleCount: config.particleCount ?? 8,
      color: config.color ?? 0xff4444, // Красный цвет крови
      particleSize: config.particleSize ?? 3,
      speed: config.speed ?? 5,
      duration: config.duration ?? 1000,
      gravity: config.gravity ?? 0.2,
    };
    
    // Устанавливаем zIndex для отображения поверх других элементов
    this.zIndex = 1000;
  }
  
  /**
   * Создание эффекта урона в указанной точке
   */
  public createDamageEffect(x: number, y: number): void {
    // Устанавливаем позицию эффекта
    this.position.set(x, y);
    
    // Создаем частицы
    for (let i = 0; i < this.config.particleCount; i++) {
      const particle = new DamageParticle(this.config.color, this.config.particleSize);
      
      // Случайное направление разлета (в радианах)
      const angle = (Math.PI * 2 * i) / this.config.particleCount + (Math.random() - 0.5) * 0.5;
      
      // Случайная скорость
      const speed = this.config.speed * (0.5 + Math.random() * 0.5);
      
      // Устанавливаем скорость
      particle.velocityX = Math.cos(angle) * speed;
      particle.velocityY = Math.sin(angle) * speed - 2; // Начальный импульс вверх
      
      // Случайное время жизни
      particle.maxLifeTime = this.config.duration * (0.7 + Math.random() * 0.6);
      particle.gravity = this.config.gravity;
      
      // Добавляем частицу
      this.addChild(particle);
      this.particles.push(particle);
    }
    
    console.log(`💥 Создан эффект урона в позиции (${x}, ${y}) с ${this.config.particleCount} частицами`);
  }
  
  /**
   * Обновление эффекта (нужно вызывать в каждом кадре)
   */
  public update(deltaTime: number): boolean {
    // Обновляем все частицы
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      const isAlive = particle.update(deltaTime);
      
      // Удаляем мертвые частицы
      if (!isAlive) {
        this.removeChild(particle);
        this.particles.splice(i, 1);
        particle.destroy();
      }
    }
    
    // Возвращаем true если эффект еще активен
    return this.particles.length > 0;
  }
  
  /**
   * Очистка эффекта
   */
  public cleanup(): void {
    // Удаляем все частицы
    for (const particle of this.particles) {
      this.removeChild(particle);
      particle.destroy();
    }
    this.particles = [];
  }
  
  /**
   * Уничтожение эффекта
   */
  public destroy(): void {
    this.cleanup();
    super.destroy();
  }
}

/**
 * Менеджер эффектов урона
 * Управляет множественными эффектами и их жизненным циклом
 */
export class DamageEffectManager {
  private effects: DamageEffect[] = [];
  private app: Application;
  
  constructor(app: Application) {
    this.app = app;
    
    // Включаем сортировку по zIndex
    this.app.stage.sortableChildren = true;
  }
  
  /**
   * Создание эффекта урона крипу
   */
  public createCreepDamageEffect(x: number, y: number): void {
    const effect = new DamageEffect(this.app, {
      particleCount: 6,
      color: 0xff4444, // Красный
      particleSize: 2,
      speed: 4,
      duration: 800,
      gravity: 0.15,
    });
    
    effect.createDamageEffect(x, y);
    this.app.stage.addChild(effect);
    this.effects.push(effect);
  }
  
  /**
   * Создание эффекта урона герою
   */
  public createHeroDamageEffect(x: number, y: number): void {
    const effect = new DamageEffect(this.app, {
      particleCount: 8,
      color: 0xff0000, // Ярко-красный
      particleSize: 3,
      speed: 6,
      duration: 1000,
      gravity: 0.2,
    });
    
    effect.createDamageEffect(x, y);
    this.app.stage.addChild(effect);
    this.effects.push(effect);
  }
  
  /**
   * Создание эффекта урона по мане (manaburn)
   */
  public createManaburnEffect(x: number, y: number): void {
    const effect = new DamageEffect(this.app, {
      particleCount: 5,
      color: 0x4444ff, // Синий
      particleSize: 2,
      speed: 3,
      duration: 600,
      gravity: 0.1,
    });
    
    effect.createDamageEffect(x, y);
    this.app.stage.addChild(effect);
    this.effects.push(effect);
  }
  
  /**
   * Обновление всех эффектов
   */
  public update(deltaTime: number): void {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const effect = this.effects[i];
      const isActive = effect.update(deltaTime);
      
      // Удаляем завершенные эффекты
      if (!isActive) {
        this.app.stage.removeChild(effect);
        effect.destroy();
        this.effects.splice(i, 1);
      }
    }
  }
  
  /**
   * Очистка всех эффектов
   */
  public cleanup(): void {
    for (const effect of this.effects) {
      this.app.stage.removeChild(effect);
      effect.destroy();
    }
    this.effects = [];
  }
} 