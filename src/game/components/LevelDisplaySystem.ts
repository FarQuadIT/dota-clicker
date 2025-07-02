/**
 * Система отображения уровня с красивыми значками и прогресс-баром
 * 
 * Логика работы:
 * 1. При старте уровня - показ значка уровня с цифрой на 3 секунды
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
  private currentProgress: number = 0; // 0-10
  private readonly TOTAL_PROGRESS = 10;
  private readonly PROGRESS_DIVISIONS = 9; // 9 делений = 10 границ
  // ====================================
  
  // ======= НАСТРОЙКИ ОТОБРАЖЕНИЯ =======
  private readonly LEVEL_ICON_DISPLAY_TIME = 3000; // 3 секунды
  private readonly PROGRESS_BAR_HEIGHT = 12;
  private readonly JUGGERNAUT_SIZE = 32;
  private readonly PROGRESS_BAR_MIN_WIDTH = 300; // Минимальная ширина
  private readonly PROGRESS_BAR_MAX_WIDTH = 500; // Максимальная ширина
  private readonly PROGRESS_BAR_MARGIN = 40; // Отступы от краев экрана
  
  // ======= НАСТРОЙКИ АНИМАЦИИ =======
  private readonly FADE_IN_DURATION = 500; // Время появления (мс)
  private readonly FADE_OUT_DURATION = 300; // Время исчезновения (мс)
  // ===================================

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
   * Показать значок уровня с номером на 3 секунды
   */
  public async showLevelIcon(level: number): Promise<void> {
    console.log(`🎯 Показываем значок уровня ${level}`);
    
    this.currentMode = DisplayMode.LEVEL_ICON;
    this.clearDisplay();
    
    try {
      // Получаем имя файла значка для уровня
      const iconFileName = this.getLevelIconFileName(level);
      
      // Получаем текстуру из AssetsManager
      const iconTexture = assetsManager.getLevelTexture(iconFileName.split('.')[0]);
      
      // Создаем спрайт значка
      this.levelIconSprite = new Sprite(iconTexture);
      this.levelIconSprite.anchor.set(0.5);
      this.levelIconSprite.scale.set(0.8); // Немного уменьшаем
      this.levelIconSprite.alpha = 0; // Начинаем с прозрачности
      
      // Создаем текст с номером уровня
      this.levelNumberText = new Text(level.toString(), {
        fontFamily: 'Arial',
        fontSize: 36,
        fontWeight: 'bold',
        fill: '#ffffff',
        stroke: { width: 3, color: '#000000' },
        dropShadow: {
          alpha: 0.8,
          angle: Math.PI / 6,
          blur: 2,
          distance: 2,
          color: '#000000'
        }
      });
      this.levelNumberText.anchor.set(0.5);
      this.levelNumberText.alpha = 0; // Начинаем с прозрачности
      
      // Добавляем элементы в контейнер
      this.container.addChild(this.levelIconSprite);
      this.container.addChild(this.levelNumberText);
      
      // Позиционируем по центру сверху
      this.updatePositioning();
      
      // Плавное появление значка
      this.fadeIn(this.levelIconSprite);
      this.fadeIn(this.levelNumberText, () => {
        // После появления запускаем таймер на 3 секунды
        this.levelIconTimer = Date.now() + this.FADE_IN_DURATION;
        console.log('✨ Значок уровня появился плавно');
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
    console.log('📊 Показываем полоску прогресса');
    
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
      
      // Добавляем в основной контейнер
      this.container.addChild(this.progressContainer);
      
      // Позиционируем
      this.updatePositioning();
      
      // Плавное появление прогресс-бара
      this.fadeIn(this.progressContainer, () => {
        console.log('✨ Прогресс-бар появился плавно');
      });
      
    } catch (error) {
      console.error('❌ Ошибка создания прогресс-бара:', error);
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
    
    console.log(`⚔️ Обновляем прогресс: ${this.currentProgress}/${this.TOTAL_PROGRESS}`);
    
    // ИСПРАВЛЕНО: Рассчитываем позицию джаггернаута по границам делений
    // У нас 9 делений = 10 границ (позиций для джаггернаута)
    // Позиции границ: 0/9, 1/9, 2/9, ..., 9/9 от ширины прогресс-бара
    // Ограничиваем прогресс до 9, чтобы джаггернаут не ушел за правый край
    const clampedProgress = Math.min(this.currentProgress, this.PROGRESS_DIVISIONS);
    const progressRatio = clampedProgress / this.PROGRESS_DIVISIONS;
    const progressBarWidth = this.getProgressBarWidth();
    const newX = -progressBarWidth / 2 + (progressRatio * progressBarWidth);
    
    console.log(`📍 Позиция джаггернаута: прогресс ${this.currentProgress} -> ${clampedProgress}, ratio ${progressRatio.toFixed(3)}, x=${newX.toFixed(1)}`);
    
    // Плавная анимация перемещения
    this.animateJuggernautMovement(newX);
  }

  /**
   * Плавный переход от значка уровня к прогресс-бару
   */
  private transitionToProgressBar(): void {
    console.log('🔄 Плавный переход к прогресс-бару');
    
    // Плавно скрываем значок уровня
    if (this.levelIconSprite) {
      this.fadeOut(this.levelIconSprite);
    }
    
    if (this.levelNumberText) {
      this.fadeOut(this.levelNumberText, () => {
        // После исчезновения значка показываем прогресс-бар
        console.log('✨ Значок уровня исчез плавно');
        this.showProgressBar();
      });
    } else {
      // Если текста нет, сразу показываем прогресс-бар
      this.showProgressBar();
    }
  }

  /**
   * Плавно скрыть прогресс-бар и показать новый значок уровня
   */
  public transitionToNewLevel(newLevel: number): void {
    console.log('🔄 Плавный переход к новому уровню');
    
    if (this.currentMode === DisplayMode.PROGRESS_BAR && this.progressContainer) {
      // Плавно скрываем прогресс-бар
      this.fadeOut(this.progressContainer, () => {
        console.log('✨ Прогресс-бар исчез плавно');
        // После исчезновения показываем новый значок уровня
        this.showLevelIcon(newLevel);
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
    console.log('🙈 Скрываем отображение уровня');
    
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
        this.levelIconSprite.x = centerX;
        this.levelIconSprite.y = topY;
      }
      
      if (this.levelNumberText) {
        this.levelNumberText.x = centerX;
        this.levelNumberText.y = topY;
      }
      
    } else if (this.currentMode === DisplayMode.PROGRESS_BAR && this.progressContainer) {
      // Прогресс-бар - по центру сверху
      this.progressContainer.x = screenWidth / 2;
      this.progressContainer.y = 60;
      
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
    
    // Создаем заново с новой шириной
    this.createProgressBar();
    this.createJuggernautIcon();
    
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
      
      console.log(`🎯 Джаггернаут создан в позиции x=${initialX} (начальная граница)`);
      
      this.progressContainer!.addChild(this.juggernautSprite);
      
    } catch (error) {
      console.error('❌ Ошибка создания иконки джаггернаута:', error);
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