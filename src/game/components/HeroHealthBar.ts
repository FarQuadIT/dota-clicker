import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { HeroStats } from '../../shared/types';

/**
 * Компонент для отображения полосок здоровья и маны героя
 * 
 * Основан на системе из старого проекта (old_project_game/front1/game/heroes/hero.js)
 * но использует современный PixiJS v8 вместо Canvas 2D
 */
export class HeroHealthBar extends Container {
  private healthBarBg!: Graphics;
  private healthBarFill!: Graphics;
  private healthText!: Text;
  
  private manaBarBg!: Graphics;
  private manaBarFill!: Graphics;
  private manaText!: Text;
  
  // Параметры полосок (из старого проекта)
  private readonly barWidth: number = 120;
  private readonly barHeight: number = 20;
  private readonly barSpacing: number = 5;
  
  // Плавная анимация (как в старом проекте)
  private healthInterpolation: number = 0;
  private manaInterpolation: number = 0;
  
  // Флаг первой инициализации для мгновенного отображения полных полосок
  private isFirstUpdate: boolean = true;

  
  constructor() {
    super();
    
    // Устанавливаем высокий zIndex чтобы полоски были поверх героя
    this.zIndex = 1000;
    
    this.createHealthBar();
    this.createManaBar();
  }
  
  /**
   * Создание полоски здоровья
   */
  private createHealthBar(): void {
    // Фон полоски здоровья
    this.healthBarBg = new Graphics();
    this.addChild(this.healthBarBg);
    
    // Заполнение полоски здоровья
    this.healthBarFill = new Graphics();
    this.addChild(this.healthBarFill);
    
    // Текст здоровья
    const healthTextStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 12,
      fill: '#ffffff',
      align: 'center'
    });
    
    this.healthText = new Text({
      text: '100/100',
      style: healthTextStyle
    });
    
    this.healthText.anchor.set(0.5);
    this.addChild(this.healthText);
  }
  
  /**
   * Создание полоски маны
   */
  private createManaBar(): void {
    // Фон полоски маны
    this.manaBarBg = new Graphics();
    this.addChild(this.manaBarBg);
    
    // Заполнение полоски маны
    this.manaBarFill = new Graphics();
    this.addChild(this.manaBarFill);
    
    // Текст маны
    const manaTextStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 12,
      fill: '#ffffff',
      align: 'center'
    });
    
    this.manaText = new Text({
      text: '50/50',
      style: manaTextStyle
    });
    
    this.manaText.anchor.set(0.5);
    this.addChild(this.manaText);
  }
  
  /**
   * Обновление полосок на основе статов героя
   * 
   * @param stats - характеристики героя из heroStore
   * @param deltaTime - время между кадрами для плавной анимации
   */
  public updateBars(stats: HeroStats, deltaTime: number = 16.6): void {
    const currentHealth = stats['current-health'];
    const maxHealth = stats['max-health'];
    const currentMana = stats['current-mana'];
    const maxMana = stats['max-mana'];
    const healthRegen = stats['health-regen'];
    const manaRegen = stats['mana-regen'];
    
    // При первом обновлении сразу устанавливаем полные значения (без анимации)
    if (this.isFirstUpdate) {
      this.healthInterpolation = currentHealth;
      this.manaInterpolation = currentMana;
      this.isFirstUpdate = false;
    } else {
      // Плавная анимация здоровья (как в старом проекте)
      if (this.healthInterpolation < currentHealth) {
        this.healthInterpolation += (currentHealth - this.healthInterpolation) * deltaTime * 0.005;
      } else {
        this.healthInterpolation = currentHealth; // Мгновенное обновление при уменьшении
      }
      
      // Плавная анимация маны (как в старом проекте)
      if (this.manaInterpolation < currentMana) {
        this.manaInterpolation += (currentMana - this.manaInterpolation) * deltaTime * 0.005;
      } else {
        this.manaInterpolation = currentMana; // Мгновенное обновление при уменьшении
      }
    }
    
    // Отрисовка полоски здоровья
    this.drawHealthBar(this.healthInterpolation, maxHealth, healthRegen);
    
    // Отрисовка полоски маны
    this.drawManaBar(this.manaInterpolation, maxMana, manaRegen);
  }
  
  /**
   * Отрисовка полоски здоровья
   */
  private drawHealthBar(currentHealth: number, maxHealth: number, healthRegen: number): void {
    const healthPercentage = Math.max(0, Math.min(1, currentHealth / maxHealth));
    
    // Очищаем графику
    this.healthBarBg.clear();
    this.healthBarFill.clear();
    
    // Цвета из старого проекта
    const bgColor = healthRegen > 0 ? 0xff0000 : 0x426600; // Красный или зеленый фон
    const bgAlpha = 0.8;
    const fillColor = healthRegen > 0 ? 0xff4d4d : 0x88cc00; // Красное или зеленое заполнение
    
    // Рисуем фон полоски
    this.healthBarBg.rect(0, 0, this.barWidth, this.barHeight);
    this.healthBarBg.fill({ color: bgColor, alpha: bgAlpha });
    
    // Рисуем заполнение полоски
    if (healthPercentage > 0) {
      this.healthBarFill.rect(0, 0, this.barWidth * healthPercentage, this.barHeight);
      this.healthBarFill.fill({ color: fillColor });
    }
    
    // Обновляем текст
    this.healthText.text = `${Math.round(currentHealth * 10) / 10}/${maxHealth}`;
    this.healthText.x = this.barWidth / 2;
    this.healthText.y = this.barHeight / 2;
  }
  
  /**
   * Отрисовка полоски маны
   */
  private drawManaBar(currentMana: number, maxMana: number, manaRegen: number): void {
    const manaPercentage = Math.max(0, Math.min(1, currentMana / maxMana));
    
    // Позиция полоски маны (под полоской здоровья)
    const manaY = this.barHeight + this.barSpacing;
    
    // Очищаем графику
    this.manaBarBg.clear();
    this.manaBarFill.clear();
    
    // Цвета из старого проекта
    const bgColor = manaRegen > 0 ? 0x0000ff : 0x000029; // Синий или темно-синий фон
    const bgAlpha = 0.8;
    const fillColor = 0x00bfff; // Голубое заполнение
    
    // Рисуем фон полоски
    this.manaBarBg.rect(0, manaY, this.barWidth, this.barHeight);
    this.manaBarBg.fill({ color: bgColor, alpha: bgAlpha });
    
    // Рисуем заполнение полоски
    if (manaPercentage > 0) {
      this.manaBarFill.rect(0, manaY, this.barWidth * manaPercentage, this.barHeight);
      this.manaBarFill.fill({ color: fillColor });
    }
    
    // Обновляем текст
    this.manaText.text = `${Math.round(currentMana * 10) / 10}/${maxMana}`;
    this.manaText.x = this.barWidth / 2;
    this.manaText.y = manaY + this.barHeight / 2;
  }
  
  /**
   * Позиционирование полосок над героем
   * 
   * @param heroX - X координата героя
   * @param heroY - Y координата героя
   * @param heroWidth - ширина героя
   * @param heroScale - масштаб героя
   */
  public positionAboveHero(heroX: number, heroY: number, heroWidth: number, heroScale: number): void {
    // Позиционируем полоски над героем
    this.x = heroX + (heroWidth - this.barWidth) / 2;
    
    // Адаптивное позиционирование как в старом проекте: 10% от высоты героя выше героя
    // Это гарантирует что полоски всегда будут над героем независимо от размера экрана
    this.y = Math.max(50, heroY + 0.15 * heroY);
    
    // Масштабируем полоски пропорционально герою
    const scale = Math.max(0.8, Math.min(1.2, heroScale));
    this.scale.set(scale);
  }
  
  /**
   * Обработка изменения размера экрана
   */
  public onResize(): void {
    // Полоски автоматически позиционируются через positionAboveHero
    // Дополнительная логика при необходимости
  }
  
  /**
   * Очистка ресурсов
   */
  public destroy(): void {
    this.healthBarBg?.destroy();
    this.healthBarFill?.destroy();
    this.healthText?.destroy();
    this.manaBarBg?.destroy();
    this.manaBarFill?.destroy();
    this.manaText?.destroy();
    
    super.destroy();
  }
} 