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
  private baseBarWidth: number = 120;      // Базовая ширина при масштабе 1.0
  private minBarWidth: number = 80;        // Минимальная ширина для удобства использования
  private barWidth: number = 120;          // Текущая ширина (динамическая)
  private readonly barHeight: number = 20;
  private readonly barSpacing: number = 5;
  
  // Параметры шрифта
  private baseFontSize: number = 12;       // Базовый размер шрифта при масштабе 1.0
  private minFontSize: number = 10;        // Минимальный размер шрифта для читаемости
  private currentFontSize: number = 12;    // Текущий размер шрифта (динамический)
  
  // Плавная анимация (как в старом проекте)
  private healthInterpolation: number = 0;
  private manaInterpolation: number = 0;
  
  // Плавная анимация текста (для более игрового отображения цифр)
  private displayedHealth: number = 0;
  private displayedMana: number = 0;
  
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
      fontFamily: 'Doka',
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
      fontFamily: 'Doka',
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
      this.displayedHealth = currentHealth;
      this.displayedMana = currentMana;
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
      
      // Плавная анимация отображаемых цифр (медленнее чем полоски для более игрового эффекта)
      const textAnimationSpeed = 0.003; // Медленнее чем полоски
      
      // Анимация цифр здоровья
      if (Math.abs(this.displayedHealth - currentHealth) > 0.1) {
        if (this.displayedHealth < currentHealth) {
          this.displayedHealth += (currentHealth - this.displayedHealth) * deltaTime * textAnimationSpeed;
        } else {
          this.displayedHealth = currentHealth; // Мгновенное обновление при уменьшении (урон)
        }
      } else {
        this.displayedHealth = currentHealth; // Фиксируем значение когда близко
      }
      
      // Анимация цифр маны
      if (Math.abs(this.displayedMana - currentMana) > 0.1) {
        if (this.displayedMana < currentMana) {
          this.displayedMana += (currentMana - this.displayedMana) * deltaTime * textAnimationSpeed;
        } else {
          this.displayedMana = currentMana; // Мгновенное обновление при уменьшении (трата маны)
        }
      } else {
        this.displayedMana = currentMana; // Фиксируем значение когда близко
      }
    }
    
    // Отрисовка полоски здоровья
    this.drawHealthBar(this.healthInterpolation, maxHealth, healthRegen);
    
    // Отрисовка полоски маны
    this.drawManaBar(this.manaInterpolation, maxMana, manaRegen);

    // Обновление анимации предупреждения о мане
    this.updateManaWarning(deltaTime);
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
    
    // Обновляем текст с плавной анимацией и округлением до целых чисел для игрового вида
    const displayedHealthRounded = Math.round(this.displayedHealth);
    this.healthText.text = `${displayedHealthRounded}/${maxHealth}`;
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
    
    // Обновляем текст с плавной анимацией и округлением до целых чисел для игрового вида
    const displayedManaRounded = Math.round(this.displayedMana);
    this.manaText.text = `${displayedManaRounded}/${maxMana}`;
    this.manaText.x = this.barWidth / 2;
    this.manaText.y = manaY + this.barHeight / 2;
  }
  
  /**
   * Установка позиции полосок над героем
   * 
   * @param heroX - позиция героя по X
   * @param heroY - позиция героя по Y 
   * @param heroWidth - ширина героя
   * @param heroScale - масштаб героя
   */
  public positionAboveHero(heroX: number, heroY: number, heroWidth: number, heroScale: number): void {
    // Обновляем ширину полосок в зависимости от масштаба героя (с минимальным ограничением)
    this.barWidth = Math.max(this.minBarWidth, this.baseBarWidth * heroScale);
    
    // Обновляем размер шрифта в зависимости от масштаба героя (с минимальным ограничением)
    this.currentFontSize = Math.max(this.minFontSize, this.baseFontSize * heroScale);
    this.updateTextStyles();
    
    // Позиционируем полоски чуть выше героя
    const offsetX = (heroWidth - this.barWidth) / 2;
    const offsetY = 90 * heroScale; // Динамическое смещение вверх в зависимости от масштаба
    
    this.x = heroX + offsetX;
    this.y = heroY + offsetY;
  }
  
  /**
   * Обновление стилей текста в зависимости от текущего размера шрифта
   */
  private updateTextStyles(): void {
    // Обновляем стиль текста здоровья
    const healthTextStyle = new TextStyle({
      fontFamily: 'Doka',
      fontSize: this.currentFontSize,
      fill: '#ffffff',
      align: 'center'
    });
    this.healthText.style = healthTextStyle;
    
    // Обновляем стиль текста маны
    const manaTextStyle = new TextStyle({
      fontFamily: 'Doka',
      fontSize: this.currentFontSize,
      fill: '#ffffff',
      align: 'center'
    });
    this.manaText.style = manaTextStyle;
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
    this.manaWarningText?.destroy();
    
    super.destroy();
  }

  // ==================================================================================
  // СИСТЕМА ПРЕДУПРЕЖДЕНИЯ О НЕДОСТАТКЕ МАНЫ
  // ==================================================================================

  private manaWarningText?: Text;
  private manaWarningTimer: number = 0;
  private isManaWarningActive: boolean = false;

  /**
   * Показать предупреждение "Недостаточно маны" над полосками
   * Появляется на 1 секунду с плавным исчезновением и движением вверх
   */
  public showManaWarning(): void {
    // Если уже показываем предупреждение - не создаем новое
    if (this.isManaWarningActive) return;

    // Создаем текст предупреждения если его нет
    if (!this.manaWarningText) {
             const warningStyle = new TextStyle({
         fontFamily: 'Doka',
         fontSize: 14,
         fill: '#ff6b6b',
         stroke: { color: '#000000', width: 2 },
         align: 'center',
         fontWeight: 'bold'
       });

      this.manaWarningText = new Text({
        text: 'Недостаточно маны!',
        style: warningStyle
      });

      this.manaWarningText.anchor.set(0.5);
      this.addChild(this.manaWarningText);
    }

    // Сбрасываем состояние анимации
    this.manaWarningText.alpha = 1.0;
    this.manaWarningText.x = this.barWidth / 2;
    this.manaWarningText.y = -25; // Над полосками здоровья и маны

    // Активируем предупреждение
    this.isManaWarningActive = true;
    this.manaWarningTimer = 0;


  }

  /**
   * Обновление анимации предупреждения о мане
   * Вызывается в updateBars для обновления эффекта
   * 
   * @param deltaTime время между кадрами в миллисекундах
   */
  private updateManaWarning(deltaTime: number): void {
    if (!this.isManaWarningActive || !this.manaWarningText) return;

    // Обновляем таймер
    this.manaWarningTimer += deltaTime;

    const duration = 1000; // 1 секунда
    const progress = Math.min(1, this.manaWarningTimer / duration);

    // Анимация движения вверх
    const initialY = -25;
    const finalY = -45; // Движение на 20 пикселей вверх
    this.manaWarningText.y = initialY + (finalY - initialY) * progress;

    // Анимация затухания (начинается с 50% времени)
    if (progress > 0.5) {
      const fadeProgress = (progress - 0.5) / 0.5; // 0-1 для второй половины анимации
      this.manaWarningText.alpha = 1 - fadeProgress;
    }

    // Завершение анимации
    if (progress >= 1) {
      this.isManaWarningActive = false;
      this.manaWarningText.alpha = 0;

    }
  }
} 