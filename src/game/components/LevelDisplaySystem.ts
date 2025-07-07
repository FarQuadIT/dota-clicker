/**
 * Система отображения уровня с красивыми значками и прогресс-баром
 * 
 * Логика работы:
 * 1. При старте уровня - показ значка уровня с цифрой на 2 секунды
 * 2. Потом показ полоски прогресса с 9 делениями и джаггернаутом
 * 3. При убийстве крипа - движение джаггернаута к следующей границе
 */

import { Application, Container, Sprite, Text, Graphics } from 'pixi.js';
import { heroLevelSystem } from '../systems/HeroLevelSystem';
import { assetsManager } from '../managers/AssetsManager';

/**
 * Режимы отображения
 */
enum DisplayMode {
  HIDDEN = 'hidden',
  LEVEL_ICON = 'level_icon', 
  PROGRESS_BAR = 'progress_bar'
}

/**
 * Система отображения прогресса уровня
 */
export class LevelDisplaySystem {
  private app: Application;
  private container: Container;
  private currentMode: DisplayMode = DisplayMode.HIDDEN;
  
  // ======= ЭЛЕМЕНТЫ ЗНАЧКА УРОВНЯ =======
  private levelIconSprite: Sprite | null = null;
  private levelNumberText: Text | null = null;
  private levelIconTimer: number = 0;
  // =====================================
  
  // ======= ЭЛЕМЕНТЫ ПРОГРЕСС-БАРА =======
  private progressContainer: Container | null = null;
  private progressBar: Graphics | null = null;
  private juggernautSprite: Sprite | null = null;
  private creepCountText: Text | null = null; // Счетчик убитых крипов
  private currentProgress: number = 0; // 0-10
  private readonly TOTAL_PROGRESS = 10;
  private readonly PROGRESS_DIVISIONS = 9; // 9 делений = 10 границ
  // ====================================
  
  // ======= НАСТРОЙКИ ОТОБРАЖЕНИЯ =======
  private readonly LEVEL_ICON_DISPLAY_TIME = 2000; // 2 секунды
  private readonly PROGRESS_BAR_HEIGHT = 12;
  private readonly JUGGERNAUT_SIZE = 32;
  private readonly PROGRESS_BAR_MIN_WIDTH = 300; // Минимальная ширина
  private readonly PROGRESS_BAR_MAX_WIDTH = 500; // Максимальная ширина
  private readonly PROGRESS_BAR_MARGIN = 40; // Отступы от краев экрана
  
  // ======= НАСТРОЙКИ АНИМАЦИИ =======
  private readonly FADE_IN_DURATION = 500; // Время появления (мс)
  private readonly FADE_OUT_DURATION = 300; // Время исчезновения (мс)
  private readonly SCALE_ANIMATION_DURATION = 800; // Время масштабирования (мс)
  private readonly SMALL_SCALE_FACTOR = 0.6; // Коэффициент уменьшения (60% от оригинала)
  private readonly ELEMENT_SPACING = 16; // Расстояние между элементами
  // ===================================
  
  // ======= НАСТРОЙКИ ПОЗИЦИИ И РАЗМЕРА ЦИФР =======
  // Размер значка: Math.max(80, Math.min(120, screenWidth * 0.12))
  // Размер шрифта: Math.max(24, Math.min(40, screenWidth * 0.06))
  // Для настройки позиции цифр ищите в updatePositioning():
  // const horizontalOffset = 2; // сдвиг вправо (+) / влево (-)
  // const verticalOffset = 0;   // сдвиг вниз (+) / вверх (-)
  // ================================================

  constructor(app: Application) {
    this.app = app;
    this.container = new Container();
    this.container.sortableChildren = true;
    
    // Добавляем контейнер на сцену с высоким zIndex
    this.container.zIndex = 1000;
    this.app.stage.addChild(this.container);
    
    // Обновляем позиционирование при изменении размера экрана
    this.updatePositioning();
  }

  /**
   * Получить адаптивную ширину полоски прогресса
   */
  private getProgressBarWidth(): number {
    const screenWidth = this.app.screen.width;
    const availableWidth = screenWidth - (this.PROGRESS_BAR_MARGIN * 2);
    
    // Ограничиваем ширину между минимумом и максимумом
    return Math.max(
      this.PROGRESS_BAR_MIN_WIDTH,
      Math.min(this.PROGRESS_BAR_MAX_WIDTH, availableWidth)
    );
  }

  /**
   * Показать значок уровня с номером на 2 секунды
   */
  public async showLevelIcon(level: number): Promise<void> {
    this.currentMode = DisplayMode.LEVEL_ICON;
    this.clearDisplay();
    
    try {
      // Получаем имя файла значка для уровня
      const iconFileName = this.getLevelIconFileName(level);
      
      // Получаем текстуру из AssetsManager
      const iconTexture = assetsManager.getLevelTexture(iconFileName.split('.')[0]);
      
      // Создаем спрайт значка с адаптивным размером
      this.levelIconSprite = new Sprite(iconTexture);
      this.levelIconSprite.anchor.set(0.5);
      
      // Адаптивный размер значка (увеличенный размер)
      const screenWidth = this.app.screen.width;
      const adaptiveIconSize = Math.max(80, Math.min(120, screenWidth * 0.12));
      const iconScale = adaptiveIconSize / Math.max(iconTexture.width, iconTexture.height);
      this.levelIconSprite.scale.set(iconScale);
      this.levelIconSprite.alpha = 0; // Начинаем с прозрачности
      
      // Адаптивный размер шрифта (увеличенный размер)
      const adaptiveFontSize = Math.max(24, Math.min(40, screenWidth * 0.06));
      
      // Создаем текст с номером уровня в том же стиле что на главной странице
      this.levelNumberText = new Text({
        text: level.toString(),
        style: {
          fontFamily: 'Arial, sans-serif',
          fontSize: adaptiveFontSize,
          fontWeight: 'bold',
          fill: '#ffffff',
          stroke: { width: Math.max(3, adaptiveFontSize * 0.15), color: '#000000' },
          dropShadow: {
            alpha: 1,
            angle: Math.PI / 4,
            blur: 6,
            distance: 3,
            color: '#000000'
          }
        }
      });
      this.levelNumberText.anchor.set(0.5, 0.5); // Центрируем и по X и по Y
      this.levelNumberText.alpha = 0; // Начинаем с прозрачности
      
      // Добавляем элементы в контейнер
      this.container.addChild(this.levelIconSprite);
      this.container.addChild(this.levelNumberText);
      
      // Позиционируем по центру сверху (настройка смещения в updatePositioning)
      this.updatePositioning();
      
      // Плавное появление значка
      this.fadeIn(this.levelIconSprite);
      this.fadeIn(this.levelNumberText, () => {
        // После появления запускаем таймер на 2 секунды
        this.levelIconTimer = Date.now() + this.FADE_IN_DURATION;
      });
      
    } catch (error) {
      console.error('❌ Ошибка загрузки значка уровня:', error);
      // Если значок не загрузился, сразу показываем прогресс-бар
      setTimeout(() => this.showProgressBar(), 100);
    }
  }

  /**
   * Показать полоску прогресса с джаггернаутом
   */
  public showProgressBar(): void {
    this.currentMode = DisplayMode.PROGRESS_BAR;
    this.clearDisplay();
    this.currentProgress = 0;
    
    try {
      // Создаем контейнер для прогресс-бара
      this.progressContainer = new Container();
      this.progressContainer.alpha = 0; // Начинаем с прозрачности
      
      // Создаем полоску прогресса
      this.createProgressBar();
      
      // Создаем джаггернаута
      this.createJuggernautIcon();
      
      // Создаем счетчик крипов
      this.createCreepCounter();
      
      // Добавляем в основной контейнер
      this.container.addChild(this.progressContainer);
      
      // Позиционируем
      this.updatePositioning();
      
      // Плавное появление прогресс-бара
      this.fadeIn(this.progressContainer);
      
    } catch (error) {
      console.error('❌ Ошибка создания прогресс-бара:', error);
    }
  }

  /**
   * Создать скрытый прогресс-бар (для анимации)
   */
  private createProgressBarHidden(): void {
    this.currentProgress = 0;
    
    try {
      // Создаем контейнер для прогресс-бара
      this.progressContainer = new Container();
      this.progressContainer.alpha = 0; // Полностью скрыт
      
      // Создаем полоску прогресса
      this.createProgressBar();
      
      // Создаем джаггернаута
      this.createJuggernautIcon();
      
      // Создаем счетчик крипов
      this.createCreepCounter();
      
      // Добавляем в основной контейнер
      this.container.addChild(this.progressContainer);
      
      // Позиционируем прогресс-бар под уменьшенным значком с равным расстоянием
      const screenWidth = this.app.screen.width;
      const iconY = 60 - this.ELEMENT_SPACING; // Позиция значка (44)
      this.progressContainer.x = screenWidth / 2;
      this.progressContainer.y = iconY + this.ELEMENT_SPACING * 2.5; // Под значком с увеличенным расстоянием
      
    } catch (error) {
      console.error('❌ Ошибка создания скрытого прогресс-бара:', error);
    }
  }

  /**
   * Показать скрытый прогресс-бар (плавное появление)
   */
  private showHiddenProgressBar(): void {
    this.currentMode = DisplayMode.PROGRESS_BAR;
    
    if (this.progressContainer) {
      // Плавное появление прогресс-бара
      this.fadeIn(this.progressContainer);
    }
  }

  /**
   * Создать скрытый значок уровня (маленький размер над прогресс-баром)
   */
  private createLevelIconHidden(level: number): void {
    try {
      // Получаем имя файла значка для уровня
      const iconFileName = this.getLevelIconFileName(level);
      
      // Получаем текстуру из AssetsManager
      const iconTexture = assetsManager.getLevelTexture(iconFileName.split('.')[0]);
      
      // Создаем спрайт значка
      this.levelIconSprite = new Sprite(iconTexture);
      this.levelIconSprite.anchor.set(0.5);
      
      // Маленький размер и позиция над прогресс-баром
      const screenWidth = this.app.screen.width;
      const adaptiveIconSize = Math.max(80, Math.min(120, screenWidth * 0.12));
      const iconScale = adaptiveIconSize / Math.max(iconTexture.width, iconTexture.height);
      const smallScale = iconScale * this.SMALL_SCALE_FACTOR;
      
      this.levelIconSprite.scale.set(smallScale);
      this.levelIconSprite.x = screenWidth / 2;
      this.levelIconSprite.y = 60 - this.ELEMENT_SPACING; // Позиция маленького значка
      this.levelIconSprite.alpha = 1; // Видимый
      
      // Создаем текст с номером уровня
      const adaptiveFontSize = Math.max(24, Math.min(40, screenWidth * 0.06));
      const smallFontSize = adaptiveFontSize * this.SMALL_SCALE_FACTOR;
      
      this.levelNumberText = new Text({
        text: level.toString(),
        style: {
          fontFamily: 'Arial, sans-serif',
          fontSize: smallFontSize,
          fontWeight: 'bold',
          fill: '#ffffff',
          stroke: { width: Math.max(1, smallFontSize * 0.15), color: '#000000' },
          dropShadow: {
            alpha: 1,
            angle: Math.PI / 4,
            blur: 6,
            distance: 3,
            color: '#000000'
          }
        }
      });
      this.levelNumberText.anchor.set(0.5, 0.5);
      
      // Настройка смещения относительно значка (можно изменить здесь)
      const horizontalOffset = 2.3; // сдвиг от центра значка
      const verticalOffset = 0;
      
      this.levelNumberText.x = (screenWidth / 2) + horizontalOffset;
      this.levelNumberText.y = (60 - this.ELEMENT_SPACING) + verticalOffset; // Позиция текста маленького значка
      this.levelNumberText.alpha = 1; // Видимый
      
      // Добавляем элементы в контейнер
      this.container.addChild(this.levelIconSprite);
      this.container.addChild(this.levelNumberText);
      
    } catch (error) {
      console.error('❌ Ошибка создания скрытого значка уровня:', error);
    }
  }

  /**
   * Обновить номер уровня в тексте
   */
  private updateLevelNumber(level: number): void {
    if (this.levelNumberText) {
      this.levelNumberText.text = level.toString();
    }
  }

  /**
   * Обновить прогресс (позицию джаггернаута)
   */
  public updateProgress(current: number): void {
    if (this.currentMode !== DisplayMode.PROGRESS_BAR || !this.juggernautSprite) {
      return;
    }
    
    this.currentProgress = Math.max(0, Math.min(current, this.TOTAL_PROGRESS));
    
    // Обновляем текст счетчика крипов
    if (this.creepCountText) {
      this.creepCountText.text = `${this.currentProgress}/${this.TOTAL_PROGRESS}`;
    }
    
    // ИСПРАВЛЕНО: Рассчитываем позицию джаггернаута по границам делений
    // У нас 9 делений = 10 границ (позиций для джаггернаута)
    // Позиции границ: 0/9, 1/9, 2/9, ..., 9/9 от ширины прогресс-бара
    // Ограничиваем прогресс до 9, чтобы джаггернаут не ушел за правый край
    const clampedProgress = Math.min(this.currentProgress, this.PROGRESS_DIVISIONS);
    const progressRatio = clampedProgress / this.PROGRESS_DIVISIONS;
    const progressBarWidth = this.getProgressBarWidth();
    const newX = -progressBarWidth / 2 + (progressRatio * progressBarWidth);
    
    // Плавная анимация перемещения
    this.animateJuggernautMovement(newX);
  }

  /**
   * Плавный переход от значка уровня к прогресс-бару
   */
  private transitionToProgressBar(): void {
    // Создаем прогресс-бар заранее (но скрытый)
    this.createProgressBarHidden();
    
    // Анимируем уменьшение и перемещение значка
    this.animateIconToSmall(() => {
      // После завершения анимации значка показываем прогресс-бар
      this.showHiddenProgressBar();
    });
  }

  /**
   * Плавно скрыть прогресс-бар и показать новый значок уровня
   */
  public transitionToNewLevel(newLevel: number): void {
    if (this.currentMode === DisplayMode.PROGRESS_BAR && this.progressContainer) {
      // Очищаем старые элементы значка (если есть)
      if (this.levelIconSprite) {
        this.container.removeChild(this.levelIconSprite);
        this.levelIconSprite = null;
      }
      if (this.levelNumberText) {
        this.container.removeChild(this.levelNumberText);
        this.levelNumberText = null;
      }
      
      // Создаем новый значок уровня (скрытый и маленький)
      this.createLevelIconHidden(newLevel);
      
      // Плавно скрываем прогресс-бар
      this.fadeOut(this.progressContainer, () => {
        // После исчезновения прогресс-бара анимируем увеличение значка
        this.animateIconToLarge(() => {
          // После завершения анимации устанавливаем правильный режим
          this.currentMode = DisplayMode.LEVEL_ICON;
          this.levelIconTimer = Date.now() + this.FADE_IN_DURATION;
        });
      });
    } else {
      // Если прогресс-бара нет, сразу показываем новый значок
      this.showLevelIcon(newLevel);
    }
  }

  /**
   * Скрыть отображение уровня
   */
  public hideLevelDisplay(): void {
    this.currentMode = DisplayMode.HIDDEN;
    this.clearDisplay();
  }

  /**
   * Обновление каждый кадр
   */
  public update(deltaTime: number): void {
    // Проверяем таймер значка уровня
    if (this.currentMode === DisplayMode.LEVEL_ICON && this.levelIconTimer > 0) {
      const elapsed = Date.now() - this.levelIconTimer;
      
      if (elapsed >= this.LEVEL_ICON_DISPLAY_TIME) {
        // Время истекло - плавно убираем значок и показываем прогресс-бар
        this.levelIconTimer = 0; // Сбрасываем таймер
        this.transitionToProgressBar();
      }
    }
  }

  /**
   * Обновить позиционирование при изменении размера экрана
   */
  public updatePositioning(): void {
    const screenWidth = this.app.screen.width;
    const screenHeight = this.app.screen.height;
    
    if (this.currentMode === DisplayMode.LEVEL_ICON) {
      // Значок уровня - по центру сверху
      const centerX = screenWidth / 2;
      const topY = 80; // Отступ сверху
      
      if (this.levelIconSprite) {
        // Пересчитываем адаптивный размер значка при изменении экрана (увеличенный)
        const adaptiveIconSize = Math.max(80, Math.min(120, screenWidth * 0.12));
        const iconScale = adaptiveIconSize / Math.max(this.levelIconSprite.texture.width, this.levelIconSprite.texture.height);
        this.levelIconSprite.scale.set(iconScale);
        
        this.levelIconSprite.x = centerX;
        this.levelIconSprite.y = topY;
      }
      
      if (this.levelNumberText) {
        // Пересчитываем адаптивный размер шрифта при изменении экрана (увеличенный)
        const adaptiveFontSize = Math.max(24, Math.min(40, screenWidth * 0.06));
        this.levelNumberText.style.fontSize = adaptiveFontSize;
        this.levelNumberText.style.stroke = { width: Math.max(3, adaptiveFontSize * 0.15), color: '#000000' };
        
        // Убеждаемся что anchor установлен по центру
        this.levelNumberText.anchor.set(0.5, 0.5);
        
        // Позиционирование цифры на значке (можно настроить смещение здесь)
        const horizontalOffset = 2.3; // НАСТРОЙКА: сдвиг вправо в пикселях (0 = по центру)
        const verticalOffset = 0;   // НАСТРОЙКА: сдвиг вниз в пикселях (0 = по центру)
        
        this.levelNumberText.x = centerX + horizontalOffset;
        this.levelNumberText.y = topY + verticalOffset;
      }
      
    } else if (this.currentMode === DisplayMode.PROGRESS_BAR && this.progressContainer) {
      // Прогресс-бар - по центру с правильным расстоянием
      const iconY = 60 - this.ELEMENT_SPACING; // Позиция значка (44)
      this.progressContainer.x = screenWidth / 2;
      this.progressContainer.y = iconY + this.ELEMENT_SPACING * 2.5;
      
      // ИСПРАВЛЕНО: При изменении размера экрана пересоздаем полоску прогресса
      // чтобы она адаптировалась к новой ширине
      this.recreateProgressBarForResize();
    }
  }

  /**
   * Пересоздать полоску прогресса при изменении размера экрана
   */
  private recreateProgressBarForResize(): void {
    if (!this.progressContainer) return;
    
    // Сохраняем текущий прогресс
    const savedProgress = this.currentProgress;
    
    // Очищаем старые элементы прогресс-бара
    this.progressContainer.removeChildren();
    this.progressBar = null;
    this.juggernautSprite = null;
    this.creepCountText = null; // Очищаем счетчик крипов
    
    // Создаем заново с новой шириной
    this.createProgressBar();
    this.createJuggernautIcon();
    this.createCreepCounter(); // Пересоздаем счетчик крипов
    
    // Восстанавливаем позицию джаггернаута
    if (savedProgress > 0) {
      this.updateProgress(savedProgress);
    }
  }

  /**
   * Очистить текущее отображение
   */
  private clearDisplay(): void {
    this.container.removeChildren();
    
    this.levelIconSprite = null;
    this.levelNumberText = null;
    this.progressContainer = null;
    this.progressBar = null;
    this.juggernautSprite = null;
    this.creepCountText = null; // Очищаем счетчик крипов
    this.levelIconTimer = 0;
  }

  /**
   * Получить имя файла значка для уровня
   */
  private getLevelIconFileName(level: number): string {
    const levelData = heroLevelSystem.getLevelData();
    const levelName = levelData.levelName.toLowerCase();
    
    // Маппинг названий на файлы
    const fileMapping: Record<string, string> = {
      'бронза': 'bronze.jpg',
      'серебро': 'silver.webp', 
      'золото': 'gold.JPG',
      'платина': 'platinum.webp',
      'мастер': 'master.webp',
      'грандмастер': 'grandmaster.webp'
    };
    
    return fileMapping[levelName] || 'bronze.jpg';
  }

  /**
   * Создать полоску прогресса
   */
  private createProgressBar(): void {
    this.progressBar = new Graphics();
    
    const progressBarWidth = this.getProgressBarWidth();
    
    // Фон полоски (темно-красный по обновленным требованиям)
    this.progressBar.rect(-progressBarWidth / 2, -this.PROGRESS_BAR_HEIGHT / 2, 
                         progressBarWidth, this.PROGRESS_BAR_HEIGHT);
    this.progressBar.fill(0x8B0000); // Темно-красный цвет
    
    // Обводка
    this.progressBar.rect(-progressBarWidth / 2, -this.PROGRESS_BAR_HEIGHT / 2,
                         progressBarWidth, this.PROGRESS_BAR_HEIGHT);
    this.progressBar.stroke({ width: 2, color: 0x000000 });
    
    // Деления (9 делений = 8 внутренних линий + 2 крайние = 10 границ)
    // Границы находятся в позициях: 0/9, 1/9, 2/9, 3/9, 4/9, 5/9, 6/9, 7/9, 8/9, 9/9
    // Рисуем только внутренние линии (i=1 до i=8), крайние границы - это края прогресс-бара
    for (let i = 1; i < this.PROGRESS_DIVISIONS; i++) {
      const x = -progressBarWidth / 2 + (i / this.PROGRESS_DIVISIONS) * progressBarWidth;
      
      this.progressBar.moveTo(x, -this.PROGRESS_BAR_HEIGHT / 2);
      this.progressBar.lineTo(x, this.PROGRESS_BAR_HEIGHT / 2);
      this.progressBar.stroke({ width: 1, color: 0x000000 });
    }
    
    this.progressContainer!.addChild(this.progressBar);
  }

  /**
   * Создать иконку джаггернаута
   */
  private createJuggernautIcon(): void {
    try {
      // Получаем текстуру из AssetsManager
      const texture = assetsManager.getHeroIconTexture('juggernaut');
      
      this.juggernautSprite = new Sprite(texture);
      this.juggernautSprite.anchor.set(0.5);
      this.juggernautSprite.width = this.JUGGERNAUT_SIZE;
      this.juggernautSprite.height = this.JUGGERNAUT_SIZE;
      
      // ИСПРАВЛЕНО: Начальная позиция рассчитывается по той же логике что и в updateProgress
      // При currentProgress = 0 джаггернаут должен быть на первой границе (слева)
      const initialProgressRatio = 0 / this.PROGRESS_DIVISIONS; // 0/9 = 0
      const progressBarWidth = this.getProgressBarWidth();
      const initialX = -progressBarWidth / 2 + (initialProgressRatio * progressBarWidth);
      
      this.juggernautSprite.x = initialX;
      this.juggernautSprite.y = 0;
      
      this.progressContainer!.addChild(this.juggernautSprite);
      
    } catch (error) {
      console.error('❌ Ошибка создания иконки джаггернаута:', error);
    }
  }

  /**
   * Создать счетчик убитых крипов
   */
  private createCreepCounter(): void {
    try {
      // Создаем текст счетчика крипов (формат: "1/10")
      this.creepCountText = new Text({ 
        text: `${this.currentProgress}/${this.TOTAL_PROGRESS}`, 
        style: {
          fontFamily: 'Doka',
          fontSize: 16,
          fontWeight: 'bold',
          fill: '#ffffff', // Белый текст
          stroke: { width: 2, color: '#000000' }, // Черная обводка
          dropShadow: {
            alpha: 0.8,
            angle: Math.PI / 6,
            blur: 2,
            distance: 2,
            color: '#000000'
          }
        }
      });
      
      // Якорь по центру сверху, чтобы текст располагался под полоской по центру
      this.creepCountText.anchor.set(0.5, 0);
      
      // Позиционируем под прогресс-баром по центру с равным расстоянием
      this.creepCountText.x = 0; // По центру полоски
      this.creepCountText.y = this.ELEMENT_SPACING; // Равное расстояние под полоской
      
      this.progressContainer!.addChild(this.creepCountText);
      
    } catch (error) {
      console.error('❌ Ошибка создания счетчика крипов:', error);
    }
  }

  /**
   * Анимация движения джаггернаута
   */
  private animateJuggernautMovement(targetX: number): void {
    if (!this.juggernautSprite) return;
    
    const startX = this.juggernautSprite.x;
    const distance = targetX - startX;
    const duration = 500; // 0.5 секунды
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing функция (ease-out)
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      
      if (this.juggernautSprite) {
        this.juggernautSprite.x = startX + (distance * easedProgress);
      }
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }

  /**
   * Плавное появление элемента (fade in)
   */
  private fadeIn(element: Container | Sprite | Text, onComplete?: () => void): void {
    if (!element) return;
    
    element.alpha = 0;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / this.FADE_IN_DURATION, 1);
      
      // Easing функция (ease-out)
      const easedProgress = 1 - Math.pow(1 - progress, 2);
      
      element.alpha = easedProgress;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        element.alpha = 1;
        if (onComplete) onComplete();
      }
    };
    
    animate();
  }

  /**
   * Плавное исчезновение элемента (fade out)
   */
  private fadeOut(element: Container | Sprite | Text, onComplete?: () => void): void {
    if (!element) return;
    
    const startTime = Date.now();
    const startAlpha = element.alpha;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / this.FADE_OUT_DURATION, 1);
      
      // Easing функция (ease-in)
      const easedProgress = Math.pow(progress, 2);
      
      element.alpha = startAlpha * (1 - easedProgress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        element.alpha = 0;
        if (onComplete) onComplete();
      }
    };
    
    animate();
  }

  /**
   * Анимация уменьшения и перемещения значка над прогресс-баром
   */
  private animateIconToSmall(onComplete?: () => void): void {
    if (!this.levelIconSprite || !this.levelNumberText) return;
    
    const screenWidth = this.app.screen.width;
    const startTime = Date.now();
    
    // Начальные позиции и размеры
    const startX = this.levelIconSprite.x;
    const startY = this.levelIconSprite.y;
    const startScale = this.levelIconSprite.scale.x;
    const startFontSize = this.levelNumberText.style.fontSize as number;
    
    // Целевые позиции и размеры
    const targetX = screenWidth / 2;
    const targetY = 60 - this.ELEMENT_SPACING; // Позиция маленького значка
    const targetScale = startScale * this.SMALL_SCALE_FACTOR;
    const targetFontSize = startFontSize * this.SMALL_SCALE_FACTOR;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / this.SCALE_ANIMATION_DURATION, 1);
      
      // Easing функция (ease-in-out)
      const easedProgress = progress < 0.5 ? 
        2 * progress * progress : 
        1 - Math.pow(-2 * progress + 2, 3) / 2;
      
      // Интерполяция позиций (с null-проверками)
      if (this.levelIconSprite) {
        this.levelIconSprite.x = startX + (targetX - startX) * easedProgress;
        this.levelIconSprite.y = startY + (targetY - startY) * easedProgress;
        this.levelIconSprite.scale.set(startScale + (targetScale - startScale) * easedProgress);
      }
      
      // Интерполяция текста относительно значка (с null-проверками)
      if (this.levelNumberText && this.levelIconSprite) {
        // Настройка смещения (можно изменить здесь)
        const horizontalOffset = 2.3; // сдвиг от центра значка
        const verticalOffset = 0;
        
        this.levelNumberText.x = this.levelIconSprite.x + horizontalOffset;
        this.levelNumberText.y = this.levelIconSprite.y + verticalOffset;
        this.levelNumberText.style.fontSize = startFontSize + (targetFontSize - startFontSize) * easedProgress;
        this.levelNumberText.style.stroke = { 
          width: Math.max(1, (targetFontSize * 0.15) + ((startFontSize * 0.15) - (targetFontSize * 0.15)) * (1 - easedProgress)), 
          color: '#000000' 
        };
      }
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Финальные значения (с null-проверками)
        if (this.levelIconSprite) {
          this.levelIconSprite.x = targetX;
          this.levelIconSprite.y = targetY;
          this.levelIconSprite.scale.set(targetScale);
        }
        if (this.levelNumberText) {
          // Настройка смещения (можно изменить здесь)
          const horizontalOffset = 2.3; // сдвиг от центра значка
          const verticalOffset = 0;
          
          this.levelNumberText.x = targetX + horizontalOffset;
          this.levelNumberText.y = targetY + verticalOffset;
          this.levelNumberText.style.fontSize = targetFontSize;
        }
        
        if (onComplete) onComplete();
      }
    };
    
    animate();
  }

  /**
   * Анимация увеличения и перемещения значка на место прогресс-бара
   */
  private animateIconToLarge(onComplete?: () => void): void {
    if (!this.levelIconSprite || !this.levelNumberText) return;
    
    const screenWidth = this.app.screen.width;
    const startTime = Date.now();
    
    // Начальные позиции и размеры (маленький значок)
    const startX = this.levelIconSprite.x;
    const startY = this.levelIconSprite.y;
    const startScale = this.levelIconSprite.scale.x;
    const startFontSize = this.levelNumberText.style.fontSize as number;
    
    // Целевые позиции и размеры (большой значок)
    const targetX = screenWidth / 2;
    const targetY = 80; // Место где обычно показывается большой значок
    const targetScale = startScale / this.SMALL_SCALE_FACTOR; // Увеличиваем обратно
    const targetFontSize = startFontSize / this.SMALL_SCALE_FACTOR;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / this.SCALE_ANIMATION_DURATION, 1);
      
      // Easing функция (ease-in-out)
      const easedProgress = progress < 0.5 ? 
        2 * progress * progress : 
        1 - Math.pow(-2 * progress + 2, 3) / 2;
      
      // Интерполяция позиций (с null-проверками)
      if (this.levelIconSprite) {
        this.levelIconSprite.x = startX + (targetX - startX) * easedProgress;
        this.levelIconSprite.y = startY + (targetY - startY) * easedProgress;
        this.levelIconSprite.scale.set(startScale + (targetScale - startScale) * easedProgress);
      }
      
      // Интерполяция текста относительно значка (с null-проверками)
      if (this.levelNumberText && this.levelIconSprite) {
        // Настройка смещения (можно изменить здесь)
        const horizontalOffset = 2.3; // сдвиг от центра значка
        const verticalOffset = 0;
        
        this.levelNumberText.x = this.levelIconSprite.x + horizontalOffset;
        this.levelNumberText.y = this.levelIconSprite.y + verticalOffset;
        this.levelNumberText.style.fontSize = startFontSize + (targetFontSize - startFontSize) * easedProgress;
        this.levelNumberText.style.stroke = { 
          width: Math.max(1, (startFontSize * 0.15) + ((targetFontSize * 0.15) - (startFontSize * 0.15)) * easedProgress), 
          color: '#000000' 
        };
      }
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Финальные значения (с null-проверками)
        if (this.levelIconSprite) {
          this.levelIconSprite.x = targetX;
          this.levelIconSprite.y = targetY;
          this.levelIconSprite.scale.set(targetScale);
        }
        if (this.levelNumberText) {
          // Настройка смещения (можно изменить здесь)
          const horizontalOffset = 2.3; // сдвиг от центра значка
          const verticalOffset = 0;
          
          this.levelNumberText.x = targetX + horizontalOffset;
          this.levelNumberText.y = targetY + verticalOffset;
          this.levelNumberText.style.fontSize = targetFontSize;
        }
        
        if (onComplete) onComplete();
      }
    };
    
    animate();
  }

  /**
   * Уничтожение компонента
   */
  public destroy(): void {
    this.clearDisplay();
    
    if (this.container.parent) {
      this.container.parent.removeChild(this.container);
    }
    
    this.container.destroy();
  }
} 