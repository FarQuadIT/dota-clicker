/**
 * Компонент полосок здоровья крипа
 * 
 * Отображает полоску здоровья над крипом в стиле старого проекта:
 * - Красная полоска с фоном rgba(255, 0, 0, 0.8)
 * - Заполнение #ff4d4d 
 * - Текст "currentHP/maxHP" белым цветом 10px Arial
 * - Адаптивное позиционирование через xBarDelta/yBarDelta
 * 
 * Основано на методе drawHealthBar() из old_project_game/front1/game/creepData/creep.js
 */

import { Container, Graphics, Text } from 'pixi.js';
import type { CreepTypeConfig } from '../config/creepsConfig';

export class CreepHealthBar extends Container {
  // Компоненты PixiJS
  private backgroundBar!: Graphics;
  private healthBar!: Graphics;
  private healthText!: Text;
  
  // Параметры из старого проекта
  private readonly barHeight: number = 15; // Фиксированная высота как в старом проекте
  private barWidth: number = 0; // Будет вычисляться динамически
  private minBarWidth: number; // Минимальная ширина полоски на маленьких экранах
  
  // Параметры шрифта (адаптивные как у героя)
  private baseFontSize: number = 12;       // Базовый размер шрифта (увеличен с 10 до 12)
  private minFontSize: number = 10;        // Минимальный размер шрифта для читаемости
  private currentFontSize: number = 12;    // Текущий размер шрифта (динамический)
  
  // Состояние крипа
  private currentHealth: number = 0;
  private maxHealth: number = 0;
  

  
  // Конфигурация позиционирования
  private config: CreepTypeConfig;
  
  /**
   * Конструктор полосок здоровья крипа
   * 
   * @param config - конфигурация типа крипа для позиционирования
   * @param creepWidth - ширина крипа для расчета ширины полоски
   * @param scale - масштаб крипа для расчета размеров
   * @param maxHealth - максимальное здоровье крипа
   */
  constructor(config: CreepTypeConfig, creepWidth: number, scale: number, maxHealth: number) {
    super();
    
    // Устанавливаем zIndex для полосок здоровья крипов (выше крипов, но ниже полосок героя)
    this.zIndex = 500;
    
    this.config = config;
    this.maxHealth = maxHealth;
    this.currentHealth = maxHealth;
    
    // Устанавливаем минимальную ширину из конфигурации или значение по умолчанию
    this.minBarWidth = config.healthBarMinWidth || 50;
    
    // Вычисляем ширину полоски с учетом минимального размера
    const calculatedWidth = creepWidth * scale * config.healthBarWidthRatio;
    this.barWidth = Math.max(this.minBarWidth, calculatedWidth);
    
    // Создаем графические компоненты
    this.createComponents();
    
    // Изначально полоска видима
    this.visible = true;
  }
  
  /**
   * Создание графических компонентов полоски здоровья
   */
  private createComponents(): void {
    // Фон полоски (красный полупрозрачный)
    this.backgroundBar = new Graphics();
    this.addChild(this.backgroundBar);
    
    // Полоска здоровья (красная заливка)
    this.healthBar = new Graphics();
    this.addChild(this.healthBar);
    
    // Текст здоровья (белый, адаптивный размер Arial, по центру)
    this.healthText = new Text({
      text: '',
      style: {
        fontFamily: 'Doka',
        fontSize: this.currentFontSize,
        fill: '#ffffff',
        align: 'center'
      }
    });
    this.addChild(this.healthText);
    
    // Обновляем отображение
    this.updateDisplay();
  }
  
  /**
   * Обновление позиции полоски относительно крипа
   * 
   * @param creepX - позиция крипа по X
   * @param creepY - позиция крипа по Y
   * @param creepWidth - ширина крипа
   * @param scale - масштаб крипа
   */
  public updatePosition(creepX: number, creepY: number, creepWidth: number, scale: number): void {
    // Пересчитываем ширину полоски для адаптивности
    this.updateBarWidth(creepWidth, scale);
    
    // Обновляем размер шрифта в зависимости от масштаба крипа (аналогично герою)
    this.updateFontSize(scale);
    
    // АДАПТИВНОЕ позиционирование с учетом масштаба (как у героя)
    // Преобразуем фиксированные смещения в относительные к масштабу крипа
    const adaptiveOffsetX = this.config.healthBarOffsetX * scale;
    const adaptiveOffsetY = this.config.healthBarOffsetY * scale;
    
    // Позиционирование с учетом адаптивных смещений
    const barX = creepX - this.barWidth / 2 + adaptiveOffsetX; // Центрируем по крипу + адаптивное смещение
    const barY = creepY + adaptiveOffsetY; // Позиция с учетом адаптивного смещения
    
    this.x = barX;
    this.y = barY;
  }

  /**
   * Обновление ширины полоски с учетом минимального размера
   * 
   * @param creepWidth - ширина крипа
   * @param scale - масштаб крипа
   */
  private updateBarWidth(creepWidth: number, scale: number): void {
    const calculatedWidth = creepWidth * scale * this.config.healthBarWidthRatio;
    const newBarWidth = Math.max(this.minBarWidth, calculatedWidth);
    
    // Если ширина изменилась, обновляем отображение
    if (this.barWidth !== newBarWidth) {
      this.barWidth = newBarWidth;
      this.updateDisplay();
    }
  }
  
  /**
   * Обновление размера шрифта в зависимости от масштаба крипа (аналогично герою)
   * 
   * @param scale - масштаб крипа
   */
  private updateFontSize(scale: number): void {
    const newFontSize = Math.max(this.minFontSize, this.baseFontSize * scale);
    
    // Если размер шрифта изменился, обновляем стиль текста
    if (this.currentFontSize !== newFontSize) {
      this.currentFontSize = newFontSize;
      
      // Обновляем стиль текста
      this.healthText.style = {
        fontFamily: 'Doka',
        fontSize: this.currentFontSize,
        fill: '#ffffff',
        align: 'center'
      };
    }
  }
  
  /**
   * Обновление здоровья крипа
   * 
   * @param currentHealth - текущее здоровье
   * @param maxHealth - максимальное здоровье (опционально, если изменилось)
   */
  public updateHealth(currentHealth: number, maxHealth?: number): void {
    this.currentHealth = Math.max(0, currentHealth);
    
    if (maxHealth !== undefined) {
      this.maxHealth = maxHealth;
    }
    
    this.updateDisplay();
  }
  
  /**
   * Установка состояния смерти крипа
   * 
   * @param isDying - true если крип умирает
   */
  public setDying(isDying: boolean): void {
    
    // Скрываем полоску если крип умирает (как в старом проекте)
    this.visible = !isDying;
  }
  
  /**
   * Обновление отображения полоски и текста
   */
  private updateDisplay(): void {
    // Очищаем графику
    this.backgroundBar.clear();
    this.healthBar.clear();
    
    // Рисуем фон полоски (rgba(255, 0, 0, 0.8))
    this.backgroundBar.rect(0, 0, this.barWidth, this.barHeight);
    this.backgroundBar.fill({ color: 0xff0000, alpha: 0.8 });
    
    // Рисуем текущее здоровье (#ff4d4d)
    const healthPercentage = this.maxHealth > 0 ? this.currentHealth / this.maxHealth : 0;
    const healthWidth = this.barWidth * healthPercentage;
    
    this.healthBar.rect(0, 0, healthWidth, this.barHeight);
    this.healthBar.fill({ color: 0xff4d4d, alpha: 1.0 });
    
    // Обновляем текст здоровья
    this.healthText.text = `${Math.round(this.currentHealth)}/${this.maxHealth}`;
    
    // Центрируем текст по полоске
    this.healthText.x = this.barWidth / 2 - this.healthText.width / 2;
    this.healthText.y = this.barHeight / 2 - this.healthText.height / 2;
  }
  
  /**
   * Получить текущее здоровье в процентах
   * 
   * @returns процент здоровья от 0 до 1
   */
  public getHealthPercentage(): number {
    return this.maxHealth > 0 ? this.currentHealth / this.maxHealth : 0;
  }
  
  /**
   * Проверка, жив ли крип
   * 
   * @returns true если здоровье больше 0
   */
  public isAlive(): boolean {
    return this.currentHealth > 0;
  }
  
  /**
   * Обработка изменения размера экрана
   * 
   * Обновляет адаптивные параметры полоски здоровья при изменении размера экрана.
   * Должен вызываться из Creep.onResize() для синхронизации с родительским объектом.
   * 
   * @param creepX - текущая позиция крипа по X
   * @param creepY - текущая позиция крипа по Y
   * @param creepWidth - ширина крипа
   * @param scale - масштаб крипа
   */
  public onResize(creepX: number, creepY: number, creepWidth: number, scale: number): void {
    // Обновляем позицию полоски с новыми размерами экрана
    this.updatePosition(creepX, creepY, creepWidth, scale);
  }
} 