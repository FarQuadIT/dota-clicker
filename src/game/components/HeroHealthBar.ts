import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { HeroStats } from '../../shared/types';
import { assetsManager } from '../managers/AssetsManager';

/**
 * Интерфейс настроек полосок здоровья и маны
 */
interface HealthBarConfig {
  baseWidth: number;
  minWidth: number;
  offsetX: number;
  offsetY: number;
}

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
  
  // Параметры полосок (настраиваемые из конфигурации героя)
  private config: HealthBarConfig;
  private barWidth: number;                // Текущая ширина (динамическая)
  private readonly barHeight: number = 20;
  private readonly barSpacing: number = 0;
  
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

  
  constructor(config: HealthBarConfig) {
    super();
    
    // Сохраняем конфигурацию
    this.config = config;
    this.barWidth = config.baseWidth; // Инициализируем базовой шириной
    
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
    
    // Текст здоровья с улучшенным стилем
    const healthTextStyle = new TextStyle({
      fontFamily: 'Doka',
      fontSize: 12,
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
    
    // Текст маны с улучшенным стилем
    const manaTextStyle = new TextStyle({
      fontFamily: 'Doka',
      fontSize: 12,
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
    const cornerRadius = 3; // Скругленные углы для современного вида
    
    // Очищаем графику
    this.healthBarBg.clear();
    this.healthBarFill.clear();
    
    // Зеленые цвета для здоровья героя
    const bgColor = 0x1a2d00; // Темно-зеленый фон
    const borderColor = 0x2d4400; // Темная зеленая рамка
    const fillColor = 0x4d9900; // Спокойный зеленый (не яркий)
    const fillHighlight = 0x66bb00; // Светло-зеленый градиент сверху
    
    // Рисуем тень полоски (чуть сдвинута вниз и вправо)
    this.healthBarBg.roundRect(1, 1, this.barWidth, this.barHeight, cornerRadius);
    this.healthBarBg.fill({ color: 0x000000, alpha: 0.4 });
    
    // Рисуем основной фон полоски со скругленными углами
    this.healthBarBg.roundRect(0, 0, this.barWidth, this.barHeight, cornerRadius);
    this.healthBarBg.fill({ color: bgColor, alpha: 0.9 });
    
    // Рисуем рамку
    this.healthBarBg.roundRect(0, 0, this.barWidth, this.barHeight, cornerRadius);
    this.healthBarBg.stroke({ color: borderColor, width: 1, alpha: 0.8 });
    
    // Рисуем заполнение полоски с градиентом
    if (healthPercentage > 0) {
      const fillWidth = this.barWidth * healthPercentage;
      
      // Основное заполнение
      this.healthBarFill.roundRect(1, 1, fillWidth - 2, this.barHeight - 2, cornerRadius - 1);
      this.healthBarFill.fill({ color: fillColor, alpha: 0.9 });
      
      // Верхний блик для объема (градиент эффект)
      const highlightHeight = Math.max(1, (this.barHeight - 2) * 0.4);
      this.healthBarFill.roundRect(1, 1, fillWidth - 2, highlightHeight, cornerRadius - 1);
      this.healthBarFill.fill({ color: fillHighlight, alpha: 0.3 });
      
      // Внутренняя рамка заполнения для четкости
      this.healthBarFill.roundRect(1, 1, fillWidth - 2, this.barHeight - 2, cornerRadius - 1);
      this.healthBarFill.stroke({ color: fillColor, width: 0.5, alpha: 0.6 });
    }
    
    // Обновляем текст с плавной анимацией и округлением до целых чисел для игрового вида
    const displayedHealthRounded = Math.round(this.displayedHealth);
    this.healthText.text = `${displayedHealthRounded}/${maxHealth}`;
    
    // Автоматически подгоняем размер шрифта чтобы текст помещался в полоску
    this.fitTextToBar(this.healthText, this.barWidth);
    
    this.healthText.x = this.barWidth / 2;
    this.healthText.y = this.barHeight / 2;
  }
  
  /**
   * Отрисовка полоски маны
   */
  private drawManaBar(currentMana: number, maxMana: number, manaRegen: number): void {
    const manaPercentage = Math.max(0, Math.min(1, currentMana / maxMana));
    const cornerRadius = 3; // Скругленные углы для современного вида
    
    // Позиция полоски маны (под полоской здоровья)
    const manaY = this.barHeight + this.barSpacing;
    
    // Очищаем графику
    this.manaBarBg.clear();
    this.manaBarFill.clear();
    
    // Улучшенные цвета в стиле Dota (синие тона)
    const bgColor = manaRegen > 0 ? 0x00001a : 0x000808; // Темно-синий фон
    const borderColor = manaRegen > 0 ? 0x003366 : 0x001122; // Темная синяя рамка
    const fillColor = 0x0099ff; // Яркий синий
    const fillHighlight = 0x33aaff; // Светло-синий градиент сверху
    
    // Рисуем тень полоски (чуть сдвинута вниз и вправо)
    this.manaBarBg.roundRect(1, manaY + 1, this.barWidth, this.barHeight, cornerRadius);
    this.manaBarBg.fill({ color: 0x000000, alpha: 0.4 });
    
    // Рисуем основной фон полоски со скругленными углами
    this.manaBarBg.roundRect(0, manaY, this.barWidth, this.barHeight, cornerRadius);
    this.manaBarBg.fill({ color: bgColor, alpha: 0.9 });
    
    // Рисуем рамку
    this.manaBarBg.roundRect(0, manaY, this.barWidth, this.barHeight, cornerRadius);
    this.manaBarBg.stroke({ color: borderColor, width: 1, alpha: 0.8 });
    
    // Рисуем заполнение полоски с градиентом
    if (manaPercentage > 0) {
      const fillWidth = this.barWidth * manaPercentage;
      
      // Основное заполнение
      this.manaBarFill.roundRect(1, manaY + 1, fillWidth - 2, this.barHeight - 2, cornerRadius - 1);
      this.manaBarFill.fill({ color: fillColor, alpha: 0.9 });
      
      // Верхний блик для объема (градиент эффект)
      const highlightHeight = Math.max(1, (this.barHeight - 2) * 0.4);
      this.manaBarFill.roundRect(1, manaY + 1, fillWidth - 2, highlightHeight, cornerRadius - 1);
      this.manaBarFill.fill({ color: fillHighlight, alpha: 0.3 });
      
      // Внутренняя рамка заполнения для четкости
      this.manaBarFill.roundRect(1, manaY + 1, fillWidth - 2, this.barHeight - 2, cornerRadius - 1);
      this.manaBarFill.stroke({ color: fillColor, width: 0.5, alpha: 0.6 });
    }
    
    // Обновляем текст с плавной анимацией и округлением до целых чисел для игрового вида
    const displayedManaRounded = Math.round(this.displayedMana);
    this.manaText.text = `${displayedManaRounded}/${maxMana}`;
    
    // Автоматически подгоняем размер шрифта чтобы текст помещался в полоску
    this.fitTextToBar(this.manaText, this.barWidth);
    
    this.manaText.x = this.barWidth / 2;
    this.manaText.y = manaY + this.barHeight / 2;
  }
  
  /**
   * УПРОЩЕННОЕ позиционирование полосок над героем
   * 
   * Полоска маны - всегда в центре верхнего края спрайта
   * Полоска здоровья - всегда над полоской маны
   * 
   * @param heroX - позиция героя по X
   * @param heroY - позиция героя по Y 
   * @param heroWidth - ширина героя
   * @param heroHeight - высота героя
   * @param heroScale - масштаб героя
   * @param screenWidth - ширина экрана для ограничения позиции
   */
  public positionAboveHero(heroX: number, heroY: number, heroWidth: number, heroHeight: number, heroScale: number, screenWidth?: number): void {
    // Обновляем ширину полосок в зависимости от масштаба героя (с минимальным ограничением)
    this.barWidth = Math.max(this.config.minWidth, this.config.baseWidth * heroScale);
    
    // Обновляем размер шрифта в зависимости от масштаба героя (с минимальным ограничением)
    this.currentFontSize = Math.max(this.minFontSize, this.baseFontSize * heroScale);
    this.updateTextStyles();
    
    // НАСТРАИВАЕМОЕ позиционирование с учетом anchor.set(0.5, 0.5)
    // У героя anchor.set(0.5, 0.5), поэтому heroX/heroY указывают на ЦЕНТР спрайта
    const centerX = heroX; // heroX уже центр спрайта (anchor 0.5)
    const topY = heroY - heroHeight / 2; // Верхний край = центр - половина высоты
    
    // Базовая позиция: полоска маны на верхнем краю спрайта с отступом
    const baseManaBarY = topY - 30; // 30px над спрайтом
    
    // Применяем пользовательские смещения из конфигурации героя
    // ВАЖНО: Учитываем размер спрайт-листа для пропорциональных смещений
    const spriteAdaptationFactor = this.getSpriteSheetAdaptationFactor();
    const offsetX = this.config.offsetX * heroScale * spriteAdaptationFactor; // Смещение с учетом масштаба И размера спрайт-листа
    const offsetY = this.config.offsetY * heroScale * spriteAdaptationFactor; // Смещение с учетом масштаба И размера спрайт-листа
    
    const manaBarY = baseManaBarY + offsetY; // Применяем смещение по Y
    const healthBarY = manaBarY - this.barHeight - this.barSpacing; // Здоровье над маной
    
    // Центрируем по X + пользовательское смещение
    let finalX = centerX - this.barWidth / 2 + offsetX;
    
    // Определяем ширину экрана для ограничений
    let actualScreenWidth = screenWidth || 800;
    
    if (!screenWidth) {
      actualScreenWidth = 800; // fallback
      
      if (this.parent && 'screen' in this.parent) {
        actualScreenWidth = (this.parent as any).screen.width;
      } else if (this.parent?.parent && 'screen' in this.parent.parent) {
        actualScreenWidth = (this.parent.parent as any).screen.width;
      } else if (this.parent) {
        const bounds = this.parent.getBounds();
        actualScreenWidth = bounds.width > 0 ? bounds.width : 800;
      }
    }
    
    // Ограничиваем позицию полосок границами экрана с отступом
    const margin = 20; // Минимальный отступ от краев экрана
    const minX = margin;
    const maxX = actualScreenWidth - this.barWidth - margin;
    
    // Применяем ограничения
    finalX = Math.max(minX, Math.min(maxX, finalX));
    
    // Устанавливаем позицию полосок
    this.x = finalX;
    this.y = healthBarY; // Полоски начинаются с полоски здоровья (верхняя)
  }
  
  /**
   * Обновление стилей текста в зависимости от текущего размера шрифта
   */
  private updateTextStyles(): void {
    // Обновляем стиль текста здоровья с улучшенным оформлением
    const healthTextStyle = new TextStyle({
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
    });
    this.healthText.style = healthTextStyle;
    
    // Обновляем стиль текста маны с улучшенным оформлением
    const manaTextStyle = new TextStyle({
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
    });
        this.manaText.style = manaTextStyle;
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
   * Обработка изменения размера экрана
   */
  public onResize(): void {
    // Полоски автоматически позиционируются через positionAboveHero
    // Дополнительная логика при необходимости
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
        fill: '#ff4444',
        align: 'center',
        fontWeight: 'bold',
        stroke: { color: '#000000', width: 3 }, // Более толстая обводка для выделения
        dropShadow: {
          color: '#660000',
          blur: 4,
          angle: Math.PI / 6,
          distance: 2,
          alpha: 0.9
        }
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