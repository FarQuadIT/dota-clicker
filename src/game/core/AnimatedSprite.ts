/**
 * Базовый класс для анимированных спрайтов в игре
 * 
 * Принципы работы:
 * 1. Управляет кадрами анимации из спрайтшита
 * 2. Переключает анимации (idle, run, attack, death)
 * 3. Использует таймеры для смены кадров
 * 4. Поддерживает колбэки на события анимации
 * 
 * Основано на примере из skeleton boy.txt - раздел про SpineBoy класс
 * Документация: all_pixijs_content.txt раздел "Sprites"
 */

import { Container, Texture, Sprite } from 'pixi.js';

// ==================================================================================
// ТИПЫ ДАННЫХ ДЛЯ АНИМАЦИЙ
// ==================================================================================

/**
 * Конфигурация одной анимации
 * Описывает как должна воспроизводиться конкретная анимация
 */
interface AnimationConfig {
  /** Имя анимации (например: 'idle', 'run', 'attack') */
  name: string;
  
  /** Массив текстур для кадров анимации */
  textures: Texture[];
  
  /** Скорость воспроизведения (кадров в секунду) */
  frameRate: number;
  
  /** Зацикливать ли анимацию */
  loop: boolean;
  
  /** Колбэк при завершении анимации */
  onComplete?: () => void;
  
  /** Колбэк при начале анимации */
  onStart?: () => void;
}

/**
 * Состояние анимации
 */
interface AnimationState {
  /** Текущий кадр анимации */
  currentFrame: number;
  
  /** Время с последней смены кадра */
  frameTimer: number;
  
  /** Активна ли анимация */
  isPlaying: boolean;
  
  /** Завершена ли анимация */
  isComplete: boolean;
}

// ==================================================================================
// КЛАСС АНИМИРОВАННОГО СПРАЙТА
// ==================================================================================

/**
 * Базовый класс для всех анимированных объектов в игре
 * 
 * Extends Container из PixiJS - это позволяет:
 * - Добавлять дочерние объекты (полоски здоровья, эффекты)
 * - Использовать трансформации (позиция, поворот, масштаб)
 * - Легко интегрироваться с системой рендера PixiJS
 */
export class AnimatedSprite extends Container {
  // Спрайт для отображения текущего кадра анимации
  protected sprite: Sprite;
  
  // Коллекция всех доступных анимаций
  protected animations: Map<string, AnimationConfig> = new Map();
  
  // Текущая активная анимация
  protected currentAnimation: AnimationConfig | null = null;
  
  // Состояние текущей анимации
  protected animationState: AnimationState = {
    currentFrame: 0,
    frameTimer: 0,
    isPlaying: false,
    isComplete: false
  };

  /**
   * Конструктор создает базовый анимированный спрайт
   * 
   * @param initialTexture - начальная текстура для отображения
   */
  constructor(initialTexture?: Texture) {
    super();
    
    // Создаем спрайт для отображения кадров
    this.sprite = new Sprite(initialTexture || Texture.WHITE);
    
    // Центрируем якорь спрайта для правильного позиционирования
    this.sprite.anchor.set(0.5, 0.5);
    
    // Добавляем спрайт как дочерний объект
    this.addChild(this.sprite);
    
    console.log('🎭 Создан AnimatedSprite');
  }

  /**
   * Добавление новой анимации в коллекцию
   * 
   * @param config - конфигурация анимации
   */
  public addAnimation(config: AnimationConfig): void {
    // Проверяем корректность данных
    if (!config.name || !config.textures || config.textures.length === 0) {
      console.error('❌ Некорректная конфигурация анимации:', config);
      return;
    }
    
    // Сохраняем анимацию в коллекции
    this.animations.set(config.name, config);
    
    console.log(`✅ Добавлена анимация: ${config.name} (${config.textures.length} кадров)`);
  }

  /**
   * Воспроизведение анимации
   * 
   * @param animationName - имя анимации для воспроизведения
   * @param forceRestart - принудительно перезапустить, если анимация уже играет
   */
  public playAnimation(animationName: string, forceRestart: boolean = false): void {
    // Получаем конфигурацию анимации
    const animation = this.animations.get(animationName);
    
    if (!animation) {
      console.warn(`⚠️ Анимация не найдена: ${animationName}`);
      return;
    }
    
    // Проверяем, нужно ли менять анимацию
    if (this.currentAnimation?.name === animationName && !forceRestart) {
      return; // Уже играет
    }
    
    // Останавливаем текущую анимацию
    this.stopAnimation();
    
    // Устанавливаем новую анимацию
    this.currentAnimation = animation;
    
    // Сбрасываем состояние
    this.animationState = {
      currentFrame: 0,
      frameTimer: 0,
      isPlaying: true,
      isComplete: false
    };
    
    // Устанавливаем первый кадр
    this.updateFrame();
    
    // Вызываем колбэк начала анимации
    if (animation.onStart) {
      animation.onStart();
    }
    
    console.log(`🎬 Запущена анимация: ${animationName}`);
  }

  /**
   * Остановка текущей анимации
   */
  public stopAnimation(): void {
    if (!this.currentAnimation) return;
    
    this.animationState.isPlaying = false;
    
    console.log(`⏹️ Остановлена анимация: ${this.currentAnimation.name}`);
  }

  /**
   * Обновление анимации (вызывается каждый кадр из игрового цикла)
   * 
   * @param deltaTime - время, прошедшее с последнего кадра (в миллисекундах)
   */
  public updateAnimation(deltaTime: number): void {
    // Проверяем, есть ли активная анимация
    if (!this.currentAnimation || !this.animationState.isPlaying) {
      return;
    }
    
    // Увеличиваем таймер кадра
    this.animationState.frameTimer += deltaTime;
    
    // Вычисляем время одного кадра (в миллисекундах)
    const frameTime = 1000 / this.currentAnimation.frameRate;
    
    // Проверяем, пора ли переключить кадр
    if (this.animationState.frameTimer >= frameTime) {
      this.nextFrame();
      this.animationState.frameTimer = 0;
    }
  }

  /**
   * Переход к следующему кадру анимации
   */
  private nextFrame(): void {
    if (!this.currentAnimation) return;
    
    // Переходим к следующему кадру
    this.animationState.currentFrame++;
    
    // Проверяем, не закончилась ли анимация
    if (this.animationState.currentFrame >= this.currentAnimation.textures.length) {
      if (this.currentAnimation.loop) {
        // Зацикливаем анимацию
        this.animationState.currentFrame = 0;
      } else {
        // Завершаем анимацию
        this.animationState.currentFrame = this.currentAnimation.textures.length - 1;
        this.animationState.isPlaying = false;
        this.animationState.isComplete = true;
        
        // Вызываем колбэк завершения
        if (this.currentAnimation.onComplete) {
          this.currentAnimation.onComplete();
        }
      }
    }
    
    // Обновляем отображаемый кадр
    this.updateFrame();
  }

  /**
   * Обновление отображаемого кадра
   */
  private updateFrame(): void {
    if (!this.currentAnimation) return;
    
    // Получаем текстуру текущего кадра
    const texture = this.currentAnimation.textures[this.animationState.currentFrame];
    
    if (texture) {
      // Устанавливаем новую текстуру
      this.sprite.texture = texture;
    }
  }

  /**
   * Проверка, играет ли конкретная анимация
   * 
   * @param animationName - имя анимации для проверки
   * @returns true если анимация активна
   */
  public isAnimationPlaying(animationName: string): boolean {
    return this.currentAnimation?.name === animationName && this.animationState.isPlaying;
  }

  /**
   * Получение имени текущей анимации
   */
  public getCurrentAnimationName(): string | null {
    return this.currentAnimation?.name || null;
  }

  /**
   * Получение прогресса текущей анимации (0-1)
   */
  public getAnimationProgress(): number {
    if (!this.currentAnimation) return 0;
    
    return this.animationState.currentFrame / this.currentAnimation.textures.length;
  }

  /**
   * Получение текущего кадра анимации
   */
  public getCurrentFrame(): number {
    return this.animationState.currentFrame;
  }

  /**
   * Очистка ресурсов при удалении объекта
   */
  public destroy(): void {
    // Останавливаем анимацию
    this.stopAnimation();
    
    // Очищаем коллекцию анимаций
    this.animations.clear();
    
    // Вызываем родительский метод destroy
    super.destroy();
    
    console.log('🗑️ AnimatedSprite уничтожен');
  }
}