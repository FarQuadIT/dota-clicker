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

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { CreepTypeConfig } from '../config/creepsConfig';
import { assetsManager } from '../managers/AssetsManager';

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
    
    // Текст здоровья с улучшенным стилем
    this.healthText = new Text({
      text: '',
      style: {
        fontFamily: 'Doka',
        fontSize: this.currentFontSize,
        fill: '#ffffff',
        align: 'center',
        stroke: { color: '#000000', width: 1, alpha: 0.7 }, // Тонкая полупрозрачная обводка
        dropShadow: {
          color: '#000000',
          blur: 2,
          angle: Math.PI / 6,
          distance: 1,
          alpha: 0.8
        }
      }
    });
    this.addChild(this.healthText);
    
    // Обновляем отображение
    this.updateDisplay();
  }
  
  /**
   * УПРОЩЕННОЕ позиционирование полоски относительно крипа
   * 
   * Полоска всегда в центре верхнего края спрайта крипа
   * 
   * @param creepX - позиция крипа по X
   * @param creepY - позиция крипа по Y
   * @param creepWidth - ширина крипа
   * @param creepHeight - высота крипа
   * @param scale - масштаб крипа
   */
  public updatePosition(creepX: number, creepY: number, creepWidth: number, creepHeight: number, scale: number): void {
    // Пересчитываем ширину полоски для адаптивности
    this.updateBarWidth(creepWidth, scale);
    
    // Обновляем размер шрифта в зависимости от масштаба крипа (аналогично герою)
    this.updateFontSize(scale);
    
    // НАСТРАИВАЕМОЕ позиционирование с учетом anchor.set(0.5)
    // У крипа anchor.set(0.5), поэтому creepX/creepY указывают на ЦЕНТР спрайта
    const centerX = creepX; // creepX уже центр спрайта (anchor 0.5)
    const topY = creepY - creepHeight / 2; // Верхний край = центр - половина высоты
    
    // Базовая позиция: полоска на верхнем краю спрайта с отступом
    const baseBarY = topY - 25; // 25px над спрайтом
    
    // Применяем пользовательские смещения из конфигурации крипа
    // ВАЖНО: Учитываем размер спрайт-листа для пропорциональных смещений
    const spriteAdaptationFactor = this.getSpriteSheetAdaptationFactor();
    const offsetX = this.config.healthBarOffsetX * scale * spriteAdaptationFactor; // Смещение с учетом масштаба И размера спрайт-листа
    const offsetY = this.config.healthBarOffsetY * scale * spriteAdaptationFactor; // Смещение с учетом масштаба И размера спрайт-листа
    
    // Центрируем по X + пользовательское смещение
    const barX = centerX - this.barWidth / 2 + offsetX;
    const barY = baseBarY + offsetY; // Применяем смещение по Y
    
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
      
      // Обновляем стиль текста с улучшенным оформлением
      this.healthText.style = {
        fontFamily: 'Doka',
        fontSize: this.currentFontSize,
        fill: '#ffffff',
        align: 'center',
        stroke: { color: '#000000', width: 1, alpha: 0.7 }, // Тонкая полупрозрачная обводка
        dropShadow: {
          color: '#000000',
          blur: 2,
          angle: Math.PI / 6,
          distance: 1,
          alpha: 0.8
        }
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
    const cornerRadius = 3; // Скругленные углы для современного вида
    
    // Очищаем графику
    this.backgroundBar.clear();
    this.healthBar.clear();
    
    // Красные цвета для здоровья крипа (не яркие)
    const bgColor = 0x2d0000; // Темно-красный фон
    const borderColor = 0x660000; // Темная красная рамка
    const fillColor = 0xcc4444; // Спокойный красный (не яркий)
    const fillHighlight = 0xdd6666; // Светло-красный градиент сверху
    
    // Рисуем тень полоски (чуть сдвинута вниз и вправо)
    this.backgroundBar.roundRect(1, 1, this.barWidth, this.barHeight, cornerRadius);
    this.backgroundBar.fill({ color: 0x000000, alpha: 0.4 });
    
    // Рисуем основной фон полоски со скругленными углами
    this.backgroundBar.roundRect(0, 0, this.barWidth, this.barHeight, cornerRadius);
    this.backgroundBar.fill({ color: bgColor, alpha: 0.9 });
    
    // Рисуем рамку
    this.backgroundBar.roundRect(0, 0, this.barWidth, this.barHeight, cornerRadius);
    this.backgroundBar.stroke({ color: borderColor, width: 1, alpha: 0.8 });
    
    // Рисуем заполнение полоски с градиентом
    const healthPercentage = this.maxHealth > 0 ? this.currentHealth / this.maxHealth : 0;
    if (healthPercentage > 0) {
      const fillWidth = this.barWidth * healthPercentage;
      
      // Основное заполнение
      this.healthBar.roundRect(1, 1, fillWidth - 2, this.barHeight - 2, cornerRadius - 1);
      this.healthBar.fill({ color: fillColor, alpha: 0.9 });
      
      // Верхний блик для объема (градиент эффект)
      const highlightHeight = Math.max(1, (this.barHeight - 2) * 0.4);
      this.healthBar.roundRect(1, 1, fillWidth - 2, highlightHeight, cornerRadius - 1);
      this.healthBar.fill({ color: fillHighlight, alpha: 0.3 });
      
      // Внутренняя рамка заполнения для четкости
      this.healthBar.roundRect(1, 1, fillWidth - 2, this.barHeight - 2, cornerRadius - 1);
      this.healthBar.stroke({ color: fillColor, width: 0.5, alpha: 0.6 });
    }
    
    // Обновляем текст здоровья
    this.healthText.text = `${Math.round(this.currentHealth)}/${this.maxHealth}`;
    
    // Автоматически подгоняем размер шрифта чтобы текст помещался в полоску
    this.fitTextToBar(this.healthText, this.barWidth);
    
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
   * @param creepHeight - высота крипа
   * @param scale - масштаб крипа
   */
  public onResize(creepX: number, creepY: number, creepWidth: number, creepHeight: number, scale: number): void {
        // Обновляем позицию полоски с новыми размерами экрана
    this.updatePosition(creepX, creepY, creepWidth, creepHeight, scale);
  }

  /**
   * Автоматически подгоняет размер шрифта текста чтобы он помещался в полоску
   * 
   * @param textElement - элемент текста для подгонки
   * @param maxWidth - максимальная ширина полоски
   */
  private fitTextToBar(textElement: Text, maxWidth: number): void {
    const padding = 8; // Отступ от краев полоски
    const availableWidth = maxWidth - padding;
    
    // Получаем изначальный размер шрифта
    let fontSize = this.currentFontSize;
    
    // Уменьшаем размер шрифта пока текст не поместится
    while (textElement.width > availableWidth && fontSize > this.minFontSize) {
      fontSize = Math.max(this.minFontSize, fontSize - 1);
      
      // Создаем новый стиль с уменьшенным размером шрифта
      const newStyle = new TextStyle({
        fontFamily: 'Doka',
        fontSize: fontSize,
        fill: '#ffffff',
        align: 'center',
        stroke: { color: '#000000', width: 1, alpha: 0.7 },
        dropShadow: {
          color: '#000000',
          blur: 2,
          angle: Math.PI / 6,
          distance: 1,
          alpha: 0.8
        }
      });
      
      textElement.style = newStyle;
    }
  }

  /**
   * Вычисляет коэффициент адаптации на основе размера спрайт-листа
   * 
   * Обеспечивает пропорциональные смещения независимо от качества:
   * - HD (1024×1024): коэффициент = 1.0 (базовый размер)
   * - MD (512×512): коэффициент = 0.5 (вдвое меньше смещения)  
   * - LD (256×256): коэффициент = 0.25 (вчетверо меньше смещения)
   */
  private getSpriteSheetAdaptationFactor(): number {
    const qualityInfo = assetsManager.getQualityInfo();
    
    switch (qualityInfo.quality) {
      case 'hd': return 1.0;    // 1024px - базовый размер (смещения как есть)
      case 'md': return 0.5;    // 512px - вдвое меньше смещения  
      case 'ld': return 0.25;   // 256px - вчетверо меньше смещения
      default: return 1.0;      // Fallback на базовый размер
    }
  }

  /**
   * Получение центра healthbar по X координате
   * Используется для точного позиционирования чисел урона
   */
  public getCenterX(): number {
    return this.x + this.barWidth / 2;
  }
  
  /**
   * Получение Y координаты healthbar для позиционирования над ним
   */
  public getTopY(): number {
    return this.y;
  }
  
  /**
   * Получение ширины healthbar
   */
  public getBarWidth(): number {
    return this.barWidth;
  }
}  