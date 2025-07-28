/**
 * Система отображения уровня с красивыми значками и прогресс-баром
 * 
 * Логика работы:
 * 1. При старте уровня - показ значка уровня с цифрой на 2 секунды
 * 2. Потом показ полоски прогресса с динамическим количеством делений
 * 3. При убийстве крипа - движение джаггернаута к следующей границе
 */

import { Application, Container, Sprite, Text, Graphics } from 'pixi.js';
import { heroLevelSystem } from '../systems/HeroLevelSystem';
import { assetsManager } from '../managers/AssetsManager';
import { AudioManager } from '../managers/SoundManager';
import { getLevelConfig, getAvailableCreepsForLevel, getBossForLevel } from '../config/levelsConfig';

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
  private currentHeroId: string = 'juggernaut'; // По умолчанию джаггернаут
  
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
  private currentProgress: number = 0; // 0 до totalCreepsOnLevel
  
  // 🔥 НОВАЯ ДИНАМИЧЕСКАЯ ЛОГИКА: Количество крипов зависит от уровня
  private totalCreepsOnLevel: number = 10; // Будет вычисляться из levelsConfig
  private progressDivisions: number = 9;   // Будет вычисляться как (totalCreepsOnLevel - 1)
  
  // УДАЛЕНЫ старые константы:
  // private readonly TOTAL_PROGRESS = 10;
  // private readonly PROGRESS_DIVISIONS = 9; 
  // ====================================
  
  // ======= НАСТРОЙКИ ОТОБРАЖЕНИЯ =======
  private readonly LEVEL_ICON_DISPLAY_TIME = 2000; // 2 секунды
  private readonly PROGRESS_BAR_HEIGHT = 12;
  private readonly JUGGERNAUT_SIZE = 32;
  
  // 🔥 УЛУЧШЕННАЯ АДАПТИВНОСТЬ: Более гибкие параметры ширины
  private readonly PROGRESS_BAR_MIN_WIDTH = 250; // Уменьшили минимум для мобильных
  private readonly PROGRESS_BAR_MAX_WIDTH = 600; // Увеличили максимум для больших экранов
  private readonly PROGRESS_BAR_SIDE_MARGIN = 20; // Отступы от краев экрана (уменьшили)
  
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
   * Установить текущего героя для отображения его иконки
   * 
   * @param heroId - Идентификатор героя (например, 'juggernaut', 'centaur')
   */
  public setCurrentHero(heroId: string): void {
    this.currentHeroId = heroId;
    
    // Если прогресс-бар активен, пересоздаем иконку героя
    if (this.currentMode === DisplayMode.PROGRESS_BAR && this.progressContainer) {
      this.createHeroIcon();
    }
  }

  /**
   * 🔥 НОВЫЙ МЕТОД: Обновить параметры уровня
   * Вызывается при смене уровня для пересчета количества крипов
   */
  public updateLevelParameters(level: number): void {
    try {
      const levelConfig = getLevelConfig(level);
      const normalCreeps = getAvailableCreepsForLevel(level);
      const bossCreep = getBossForLevel(level);
      
      // Общее количество крипов = количество обычных крипов из конфигурации + босс
      this.totalCreepsOnLevel = levelConfig.creepCount + 1; // +1 за босса
      
      // Количество делений = общее количество - 1 (так как джаггернаут двигается по границам)
      this.progressDivisions = Math.max(1, this.totalCreepsOnLevel - 1);
      
      console.log(`📊 Уровень ${level}: ${levelConfig.creepCount} обычных крипов + 1 босс = ${this.totalCreepsOnLevel} всего, делений: ${this.progressDivisions}`);
      
    } catch (error) {
      console.error(`❌ Ошибка получения конфигурации уровня ${level}:`, error);
      // Fallback к старым значениям
      this.totalCreepsOnLevel = 10;
      this.progressDivisions = 9;
    }
  }

  /**
   * 🔥 УЛУЧШЕННЫЙ МЕТОД: Получить адаптивную ширину полоски прогресса
   * Теперь учитывает количество делений и лучше адаптируется под экран
   */
  private getProgressBarWidth(): number {
    const screenWidth = this.app.screen.width;
    const availableWidth = screenWidth - (this.PROGRESS_BAR_SIDE_MARGIN * 2);
    
    // Базовая ширина зависит от количества делений (больше делений = шире полоска)
    const baseWidthPerDivision = 30; // Базовая ширина на одно деление
    const calculatedWidth = Math.max(this.progressDivisions * baseWidthPerDivision, this.PROGRESS_BAR_MIN_WIDTH);
    
    // Ограничиваем ширину между минимумом и доступной шириной экрана
    const finalWidth = Math.max(
      this.PROGRESS_BAR_MIN_WIDTH,
      Math.min(this.PROGRESS_BAR_MAX_WIDTH, Math.min(calculatedWidth, availableWidth))
    );
    
    return finalWidth;
  }

  /**
   * Показать значок уровня с номером на 2 секунды
   * 🔥 ОБНОВЛЕНО: Теперь обновляет параметры уровня
   */
  public async showLevelIcon(level: number): Promise<void> {
    this.currentMode = DisplayMode.LEVEL_ICON;
    
    // 🔥 НОВОЕ: Обновляем параметры уровня перед показом
    this.updateLevelParameters(level);
    
    this.clearDisplay();
    
    try {
      // Получаем имя файла значка для уровня
      const iconFileName = this.getLevelIconFileNameForLevel(level);
      
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
      
      // Создаем иконку героя
      this.createHeroIcon();
      
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
      
      // Создаем иконку героя
      this.createHeroIcon();
      
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
      // Получаем имя файла значка для указанного уровня (НЕ из системы героя!)
      const iconFileName = this.getLevelIconFileNameForLevel(level);
      
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
   * Обновить номер уровня и значок (если изменился тип)
   */
  private updateLevelNumberAndIcon(newLevel: number, oldLevel: number): void {
    // Обновляем номер уровня
    this.updateLevelNumber(newLevel);
    
    // Проверяем, изменился ли тип значка (градация уровня)
    const oldLevelName = this.getLevelNameForLevel(oldLevel);
    const newLevelName = this.getLevelNameForLevel(newLevel);
    
    if (oldLevelName !== newLevelName && this.levelIconSprite) {
      // Градация изменилась - обновляем текстуру значка
      try {
        const newIconFileName = this.getLevelIconFileNameForLevel(newLevel);
        const newIconTexture = assetsManager.getLevelTexture(newIconFileName.split('.')[0]);
        
        // Заменяем текстуру
        this.levelIconSprite.texture = newIconTexture;
        
        // ВАЖНО: Пересчитываем масштаб для новой текстуры, чтобы размер остался тем же
        const screenWidth = this.app.screen.width;
        const adaptiveIconSize = Math.max(80, Math.min(120, screenWidth * 0.12));
        const newIconScale = adaptiveIconSize / Math.max(newIconTexture.width, newIconTexture.height);
        this.levelIconSprite.scale.set(newIconScale);
        
        console.log(`✨ Значок уровня изменен: ${oldLevelName} → ${newLevelName} (scale: ${newIconScale.toFixed(3)})`);
      } catch (error) {
        console.error('❌ Ошибка обновления значка уровня:', error);
      }
    }
    
    // Воспроизводим соответствующий звук
    this.playLevelUpSound(newLevel, oldLevel);
    
    // Запускаем визуальный эффект в центре значка
    this.playLevelUpEffect(newLevel, oldLevel);
  }

  /**
   * Воспроизвести звук повышения уровня
   */
  private playLevelUpSound(newLevel: number, oldLevel: number): void {
    try {
      const audioManager = AudioManager.getInstance();
      
      // Проверяем, изменился ли ранг (градация)
      const oldRankName = this.getLevelNameForLevel(oldLevel);
      const newRankName = this.getLevelNameForLevel(newLevel);
      
      if (oldRankName !== newRankName) {
        // Повышение ранга (бронза→серебро, серебро→золото и т.д.)
        audioManager.playSound('rank_up');
        console.log(`🎵 Воспроизведен звук повышения ранга: ${oldRankName} → ${newRankName}`);
      } else {
        // Обычное повышение уровня в пределах одного ранга
        audioManager.playSound('level_up');
        console.log(`🎵 Воспроизведен звук повышения уровня: ${oldLevel} → ${newLevel}`);
      }
    } catch (error) {
      console.warn('⚠️ Ошибка воспроизведения звука уровня:', error);
    }
  }

  /**
   * Воспроизвести визуальный эффект повышения уровня
   */
  private playLevelUpEffect(newLevel: number, oldLevel: number): void {
    if (!this.levelIconSprite) return;
    
    try {
      // Проверяем, изменился ли ранг (градация)
      const oldRankName = this.getLevelNameForLevel(oldLevel);
      const newRankName = this.getLevelNameForLevel(newLevel);
      const isRankUp = oldRankName !== newRankName;
      
      // Получаем позицию центра значка
      const centerX = this.levelIconSprite.x;
      const centerY = this.levelIconSprite.y;
      
      // Создаем контейнер для эффектов
      const effectContainer = new Container();
      effectContainer.x = centerX;
      effectContainer.y = centerY;
      effectContainer.zIndex = 1001; // Поверх значка
      
      this.container.addChild(effectContainer);
      
      if (isRankUp) {
        // Эффект повышения ранга - более яркий и масштабный
        this.createRankUpEffect(effectContainer);
        console.log(`✨ Воспроизведен эффект повышения ранга: ${oldRankName} → ${newRankName}`);
      } else {
        // Эффект обычного повышения уровня
        this.createLevelUpEffect(effectContainer);
        console.log(`✨ Воспроизведен эффект повышения уровня: ${oldLevel} → ${newLevel}`);
      }
      
      // Автоматически удаляем контейнер эффектов через 3 секунды
      setTimeout(() => {
        if (effectContainer.parent) {
          effectContainer.parent.removeChild(effectContainer);
          effectContainer.destroy();
        }
      }, 3000);
      
    } catch (error) {
      console.warn('⚠️ Ошибка воспроизведения эффекта уровня:', error);
    }
  }

  /**
   * Создать эффект обычного повышения уровня
   */
  private createLevelUpEffect(container: Container): void {
    // 1. Яркая вспышка в центре
    this.createFlashEffect(container, 0xFFD700, 0.8, 600); // Золотистый цвет
    
    // 2. Золотые частицы разлетаются радиально
    this.createParticleEffect(container, 0xFFD700, 12, 80, 1500);
    
    // 3. Пульсирующие кольца
    this.createRingEffect(container, 0xFFD700, 2, 100, 1200);
  }

  /**
   * Создать эффект повышения ранга (более яркий)
   */
  private createRankUpEffect(container: Container): void {
    // 1. Более яркая вспышка
    this.createFlashEffect(container, 0xFFFFFF, 1.0, 800); // Белая вспышка
    
    // 2. Больше частиц разных цветов
    this.createParticleEffect(container, 0xFFD700, 16, 120, 2000); // Золотые
    this.createParticleEffect(container, 0xFF8C00, 12, 100, 1800); // Оранжевые
    this.createParticleEffect(container, 0xFFFFFF, 8, 80, 1600);   // Белые
    
    // 3. Больше колец
    this.createRingEffect(container, 0xFFD700, 3, 150, 1500);
    this.createRingEffect(container, 0xFF8C00, 2, 120, 1300);
    
    // 4. Дополнительные звезды
    this.createStarEffect(container, 0xFFFFFF, 6, 100, 1800);
  }

  /**
   * Создать эффект вспышки
   */
  private createFlashEffect(container: Container, color: number, maxAlpha: number, duration: number): void {
    const flash = new Graphics();
    flash.circle(0, 0, 60);
    flash.fill({ color: color, alpha: 0 });
    
    container.addChild(flash);
    
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      if (progress < 0.2) {
        // Быстрое появление
        flash.alpha = (progress / 0.2) * maxAlpha;
        flash.scale.set(1 + progress * 2);
      } else {
        // Медленное исчезновение
        const fadeProgress = (progress - 0.2) / 0.8;
        flash.alpha = maxAlpha * (1 - fadeProgress);
        flash.scale.set(3 + fadeProgress * 2);
      }
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        container.removeChild(flash);
        flash.destroy();
      }
    };
    
    animate();
  }

  /**
   * Создать эффект частиц
   */
  private createParticleEffect(container: Container, color: number, count: number, maxDistance: number, duration: number): void {
    const particles: Graphics[] = [];
    
    for (let i = 0; i < count; i++) {
      const particle = new Graphics();
      particle.circle(0, 0, Math.random() * 3 + 1);
      particle.fill({ color: color, alpha: 0.8 });
      
      // Случайное направление
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const distance = Math.random() * maxDistance + 20;
      
      particle.x = 0;
      particle.y = 0;
      
      container.addChild(particle);
      particles.push(particle);
      
      // Анимация частицы
      const startTime = Date.now();
      const targetX = Math.cos(angle) * distance;
      const targetY = Math.sin(angle) * distance;
      
      const animateParticle = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Движение с замедлением
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        particle.x = targetX * easeProgress;
        particle.y = targetY * easeProgress;
        
        // Исчезновение
        particle.alpha = 0.8 * (1 - progress);
        
        if (progress < 1) {
          requestAnimationFrame(animateParticle);
        } else {
          container.removeChild(particle);
          particle.destroy();
        }
      };
      
      // Задержка для создания волнового эффекта
      setTimeout(animateParticle, i * 50);
    }
  }

  /**
   * Создать эффект колец
   */
  private createRingEffect(container: Container, color: number, count: number, maxRadius: number, duration: number): void {
    for (let i = 0; i < count; i++) {
      const ring = new Graphics();
      
      container.addChild(ring);
      
      const startTime = Date.now();
      const delay = i * 200; // Задержка между кольцами
      
      const animateRing = () => {
        const elapsed = Date.now() - startTime - delay;
        if (elapsed < 0) {
          requestAnimationFrame(animateRing);
          return;
        }
        
        const progress = Math.min(elapsed / duration, 1);
        
        // Расширение кольца
        const currentRadius = maxRadius * progress;
        const thickness = 3 * (1 - progress);
        
        // Очищаем и перерисовываем
        ring.clear();
        ring.circle(0, 0, currentRadius);
        ring.stroke({ width: thickness, color: color, alpha: 0.6 * (1 - progress) });
        
        if (progress < 1) {
          requestAnimationFrame(animateRing);
        } else {
          container.removeChild(ring);
          ring.destroy();
        }
      };
      
      animateRing();
    }
  }

  /**
   * Создать эффект звезд (только для повышения ранга)
   */
  private createStarEffect(container: Container, color: number, count: number, maxDistance: number, duration: number): void {
    for (let i = 0; i < count; i++) {
      const star = new Graphics();
      
      // Рисуем звезду
      const size = Math.random() * 4 + 2;
      star.star(0, 0, 5, size, size * 0.5);
      star.fill({ color: color, alpha: 0.9 });
      
      // Случайное направление
      const angle = (Math.PI * 2 * i) / count;
      const distance = Math.random() * maxDistance + 30;
      
      star.x = 0;
      star.y = 0;
      star.rotation = Math.random() * Math.PI * 2;
      
      container.addChild(star);
      
      // Анимация звезды
      const startTime = Date.now();
      const targetX = Math.cos(angle) * distance;
      const targetY = Math.sin(angle) * distance;
      
      const animateStar = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Движение с замедлением
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        star.x = targetX * easeProgress;
        star.y = targetY * easeProgress;
        
        // Вращение
        star.rotation += 0.1;
        
        // Исчезновение
        star.alpha = 0.9 * (1 - progress);
        
        if (progress < 1) {
          requestAnimationFrame(animateStar);
        } else {
          container.removeChild(star);
          star.destroy();
        }
      };
      
      // Задержка для создания волнового эффекта
      setTimeout(animateStar, i * 100);
    }
  }

  /**
   * Получить название градации для конкретного уровня
   */
  private getLevelNameForLevel(level: number): string {
    if (level >= 1 && level <= 5) {
      return 'Бронза';
    } else if (level >= 6 && level <= 10) {
      return 'Серебро';
    } else if (level >= 11 && level <= 15) {
      return 'Золото';
    } else if (level >= 16 && level <= 20) {
      return 'Платина';
    } else if (level >= 21 && level <= 25) {
      return 'Мастер';
    } else if (level >= 26 && level <= 30) {
      return 'Грандмастер';
    } else {
      return 'Неизвестно';
    }
  }

  /**
   * �� ОБНОВЛЕННЫЙ МЕТОД: Обновить прогресс (позицию джаггернаута)
   * Теперь работает с динамическим количеством крипов
   */
  public updateProgress(current: number): void {
    if (this.currentMode !== DisplayMode.PROGRESS_BAR || !this.juggernautSprite) {
      return;
    }
    
    this.currentProgress = Math.max(0, Math.min(current, this.totalCreepsOnLevel));
    
    // Обновляем текст счетчика крипов с актуальными значениями
    if (this.creepCountText) {
      this.creepCountText.text = `${this.currentProgress}/${this.totalCreepsOnLevel}`;
    }
    
    // 🔥 НОВАЯ ЛОГИКА: Рассчитываем позицию джаггернаута по динамическим границам
    // У нас progressDivisions делений = (progressDivisions + 1) границ для джаггернаута
    // Позиции границ: 0/progressDivisions, 1/progressDivisions, ..., progressDivisions/progressDivisions
    // Ограничиваем прогресс до progressDivisions, чтобы джаггернаут не ушел за правый край
    const clampedProgress = Math.min(this.currentProgress, this.progressDivisions);
    const progressRatio = this.progressDivisions > 0 ? clampedProgress / this.progressDivisions : 0;
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
  public transitionToNewLevel(newLevel: number, oldLevel?: number): void {
    if (this.currentMode === DisplayMode.PROGRESS_BAR && this.progressContainer) {
      // Используем переданный старый уровень или вычисляем его
      const previousLevel = oldLevel ?? (newLevel - 1);
      
      // Очищаем старые элементы значка (если есть)
      if (this.levelIconSprite) {
        this.container.removeChild(this.levelIconSprite);
        this.levelIconSprite = null;
      }
      if (this.levelNumberText) {
        this.container.removeChild(this.levelNumberText);
        this.levelNumberText = null;
      }
      
      // Создаем значок уровня со СТАРЫМ номером (скрытый и маленький)
      this.createLevelIconHidden(previousLevel);
      
      // Плавно скрываем прогресс-бар
      this.fadeOut(this.progressContainer, () => {
        // После исчезновения прогресс-бара анимируем увеличение значка
        this.animateIconToLarge(() => {
          // ПОСЛЕ завершения анимации увеличения обновляем номер уровня И значок (если изменился)
          this.updateLevelNumberAndIcon(newLevel, previousLevel);
          
          // Устанавливаем правильный режим
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
    this.createHeroIcon();
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
   * Получить имя файла значка для конкретного уровня (не из системы героя)
   */
  private getLevelIconFileNameForLevel(level: number): string {
    const levelName = this.getLevelNameForLevel(level).toLowerCase();
    
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
   * 🔥 ОБНОВЛЕННЫЙ МЕТОД: Создать полоску прогресса
   * Теперь создает динамическое количество делений
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
    
    // 🔥 НОВАЯ ЛОГИКА: Динамические деления
    // progressDivisions делений = (progressDivisions - 1) внутренних линий + 2 крайние = (progressDivisions + 1) границ
    // Границы находятся в позициях: 0/progressDivisions, 1/progressDivisions, ..., progressDivisions/progressDivisions
    // Рисуем только внутренние линии (i=1 до i=progressDivisions-1), крайние границы - это края прогресс-бара
    if (this.progressDivisions > 1) {
      for (let i = 1; i < this.progressDivisions; i++) {
        const x = -progressBarWidth / 2 + (i / this.progressDivisions) * progressBarWidth;
        
        this.progressBar.moveTo(x, -this.PROGRESS_BAR_HEIGHT / 2);
        this.progressBar.lineTo(x, this.PROGRESS_BAR_HEIGHT / 2);
        this.progressBar.stroke({ width: 1, color: 0x000000 });
      }
    }
    
    this.progressContainer!.addChild(this.progressBar);
  }

  /**
   * 🔥 ОБНОВЛЕННЫЙ МЕТОД: Создать иконку героя  
   * Теперь использует текущего выбранного героя и динамические расчеты позиций
   */
  private createHeroIcon(): void {
    try {
      // Удаляем старую иконку героя если она существует
      if (this.juggernautSprite) {
        this.progressContainer!.removeChild(this.juggernautSprite);
        this.juggernautSprite.destroy();
        this.juggernautSprite = null;
      }
      
      // Получаем текстуру текущего героя из AssetsManager
      const texture = assetsManager.getHeroIconTexture(this.currentHeroId);
      
      this.juggernautSprite = new Sprite(texture);
      this.juggernautSprite.anchor.set(0.5);
      this.juggernautSprite.width = this.JUGGERNAUT_SIZE;
      this.juggernautSprite.height = this.JUGGERNAUT_SIZE;
      
      // 🔥 ОБНОВЛЕННАЯ ЛОГИКА: Начальная позиция с динамическими расчетами
      // При currentProgress = 0 герой должен быть на первой границе (слева)
      const initialProgressRatio = this.progressDivisions > 0 ? 0 / this.progressDivisions : 0;
      const progressBarWidth = this.getProgressBarWidth();
      const initialX = -progressBarWidth / 2 + (initialProgressRatio * progressBarWidth);
      
      this.juggernautSprite.x = initialX;
      this.juggernautSprite.y = 0;
      
      this.progressContainer!.addChild(this.juggernautSprite);
      
    } catch (error) {
      console.error(`❌ Ошибка создания иконки героя ${this.currentHeroId}:`, error);
    }
  }

  /**
   * 🔥 ОБНОВЛЕННЫЙ МЕТОД: Создать счетчик убитых крипов
   * Теперь использует динамическое общее количество крипов
   */
  private createCreepCounter(): void {
    try {
      // Создаем текст счетчика крипов с динамическими значениями
      this.creepCountText = new Text({ 
        text: `${this.currentProgress}/${this.totalCreepsOnLevel}`, 
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