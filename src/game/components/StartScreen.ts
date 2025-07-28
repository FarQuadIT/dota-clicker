/**
 * Компонент стартового экрана с надписью для начала игры
 * Отображается когда игра находится в состоянии WAITING_FOR_START
 */

import { Container, Text, TextStyle, Graphics, Application } from 'pixi.js';

export class StartScreen extends Container {
  private app: Application;
  private backgroundOverlay!: Graphics;
  private titleText!: Text;
  private pulseDirection: number = 1;
  private currentOpacity: number = 0.8; // 🔥 ИСПРАВЛЕНИЕ: Изменяем стартовую прозрачность на 0.8

  constructor(app: Application) {
    super();
    this.app = app;
    
    // 🔥 ИСПРАВЛЕНИЕ: Устанавливаем высокий zIndex чтобы быть поверх всех элементов
    this.zIndex = 9999; // Выше всех игровых элементов включая health/mana bars
    
    this.createBackground();
    this.createTexts();
    this.updatePosition();
    
    // Запускаем анимацию пульсации
    this.app.ticker.add(this.animatePulse.bind(this));
  }

  /**
   * Создание полупрозрачного фона
   */
  private createBackground(): void {
    this.backgroundOverlay = new Graphics();
    this.backgroundOverlay.rect(0, 0, this.app.screen.width, this.app.screen.height);
    this.backgroundOverlay.fill({ color: 0x000000, alpha: 0.7 }); // 🔥 ИСПРАВЛЕНИЕ: Увеличена прозрачность для лучшего затемнения
    this.addChild(this.backgroundOverlay);
  }

  /**
   * Определение типа устройства для адаптивного текста
   */
  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = this.app.screen.width;
    const userAgent = navigator.userAgent;
    
    // Проверяем мобильные устройства
    if (/Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) || width <= 768) {
      return 'mobile';
    }
    
    // Проверяем планшеты
    if (/iPad/i.test(userAgent) || (width > 768 && width <= 1024)) {
      return 'tablet';
    }
    
    return 'desktop';
  }

  /**
   * Получение адаптивного текста в зависимости от устройства
   */
  private getAdaptiveText(): string {
    const deviceType = this.getDeviceType();
    
    switch (deviceType) {
      case 'mobile':
        return 'Коснись, чтобы начать путешествие...';
      case 'tablet':
        return 'Коснись, чтобы начать путешествие...';
      case 'desktop':
      default:
        return 'Кликни, чтобы начать путешествие...';
    }
  }

  /**
   * Вычисление адаптивного размера шрифта на основе размера экрана
   */
  private calculateAdaptiveFontSize(): number {
    const width = this.app.screen.width;
    const height = this.app.screen.height;
    
    // Используем меньшую сторону экрана как базу для расчета
    const minDimension = Math.min(width, height);
    
    // Рассчитываем размер шрифта как процент от меньшей стороны экрана
    let fontSize = minDimension * 0.02; // 🔥 ИСПРАВЛЕНИЕ: 3.5% вместо 4% (еще чуть меньше)
    
    // Устанавливаем разумные границы
    const minFontSize = 18;
    const maxFontSize = 48;
    
    fontSize = Math.max(minFontSize, Math.min(maxFontSize, fontSize));
    
    return Math.round(fontSize);
  }

  /**
   * Создание текстовых элементов
   */
  private createTexts(): void {
    // Основной текст с адаптивным содержимым
    const titleStyle = new TextStyle({
      fontFamily: 'Doka', // 🔥 ИСПРАВЛЕНИЕ: Используем шрифт Doka как в приложении
      fontSize: this.calculateAdaptiveFontSize(), // 🔥 ИСПРАВЛЕНИЕ: Используем адаптивный размер шрифта
      fontWeight: 'normal', // 🔥 ИСПРАВЛЕНИЕ: Убираем толстый шрифт
      fill: 0xE6E6E6, // 🔥 ИСПРАВЛЕНИЕ: Используем hex цвет
      align: 'center',
      wordWrap: true,
      wordWrapWidth: this.app.screen.width * 0.8
    });

    this.titleText = new Text({
      text: this.getAdaptiveText(), // 🔥 ИСПРАВЛЕНИЕ: Используем адаптивный текст
      style: titleStyle
    });

    this.titleText.anchor.set(0.5);
    this.titleText.alpha = 0.8; // 🔥 НОВОЕ: Добавляем прозрачность 80% к самому тексту
    this.addChild(this.titleText);

    // 🔥 ИСПРАВЛЕНИЕ: Убираем subtitleText полностью
  }

  /**
   * Обновление позиции элементов
   */
  public updatePosition(): void {
    // Обновляем размер фона
    if (this.backgroundOverlay) {
      this.backgroundOverlay.clear();
      this.backgroundOverlay.rect(0, 0, this.app.screen.width, this.app.screen.height);
      this.backgroundOverlay.fill({ color: 0x000000, alpha: 0.7 }); // 🔥 ИСПРАВЛЕНИЕ: Используем ту же прозрачность
    }

    // Позиционируем текст
    const centerX = this.app.screen.width / 2;
    const textY = this.app.screen.height * 0.35; // 🔥 ИСПРАВЛЕНИЕ: 25% от верха вместо центра

    if (this.titleText) {
      this.titleText.x = centerX;
      this.titleText.y = textY; // 🔥 ИСПРАВЛЕНИЕ: Используем новую позицию
      
      // 🔥 НОВОЕ: Обновляем адаптивный текст при изменении размера экрана
      this.titleText.text = this.getAdaptiveText();
      
      // Обновляем размер шрифта при изменении экрана
      const newTitleSize = this.calculateAdaptiveFontSize();
      this.titleText.style.fontSize = newTitleSize;
      
      // Обновляем ширину переноса строк
      this.titleText.style.wordWrapWidth = this.app.screen.width * 0.8;
    }

    // 🔥 ИСПРАВЛЕНИЕ: Убираем subtitleText полностью
  }

  /**
   * Анимация пульсации текста
   */
  private animatePulse(): void {
    // Изменяем прозрачность для эффекта пульсации
    this.currentOpacity += this.pulseDirection * 0.007; // 🔥 ИСПРАВЛЕНИЕ: 0.008 вместо 0.02 (замедлено в ~2.5 раза)
    
    if (this.currentOpacity >= 0.9) { // 🔥 ИСПРАВЛЕНИЕ: Максимум 0.9 вместо 1.0
      this.currentOpacity = 0.9;
      this.pulseDirection = -1;
    } else if (this.currentOpacity <= 0.5) { // 🔥 ИСПРАВЛЕНИЕ: Минимум 0.5 вместо 0.6
      this.currentOpacity = 0.5;
      this.pulseDirection = 1;
    }

    if (this.titleText) {
      this.titleText.alpha = this.currentOpacity;
    }
    
    // 🔥 ИСПРАВЛЕНИЕ: Убираем анимацию subtitleText
  }

  /**
   * Показать стартовый экран
   */
  public show(): void {
    this.visible = true;
    this.updatePosition();
  }

  /**
   * Скрыть стартовый экран
   */
  public hide(): void {
    this.visible = false;
  }

  /**
   * Очистка ресурсов
   */
  public destroy(): void {
    // Останавливаем анимацию
    this.app.ticker.remove(this.animatePulse.bind(this));
    
    // Уничтожаем элементы
    if (this.backgroundOverlay) {
      this.backgroundOverlay.destroy();
    }
    if (this.titleText) {
      this.titleText.destroy();
    }
    // 🔥 ИСПРАВЛЕНИЕ: Убираем уничтожение subtitleText так как его больше нет
    
    super.destroy();
  }
} 