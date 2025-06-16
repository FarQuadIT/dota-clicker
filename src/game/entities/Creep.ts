import { AnimatedSprite } from 'pixi.js';
import { assetsManager } from '../managers/AssetsManager';
import { GAME_CONFIG } from '../config/GameConfig';
import { EntityState } from '../core/GameStates';

/**
 * Конфигурация крипа
 */
interface CreepConfig {
  /** Позиция X на экране */
  x?: number;
  /** Позиция Y на экране */
  y?: number;
  /** Масштаб крипа */
  scale?: number;
  /** Скорость движения справа налево (пикселей в тик) */
  moveSpeed?: number;
  /** Смещение позиции X при анимации смерти */
  deathOffsetX?: number;
  /** Смещение позиции Y при анимации смерти */
  deathOffsetY?: number;
}

/**
 * Класс крипа - враг героя
 * Движется справа налево, атакует героя
 */
export class Creep extends AnimatedSprite {
  private currentState: EntityState = EntityState.IDLE;
  private moveSpeed: number;
  private isDead: boolean = false;
  private deathOffsetX: number;
  private deathOffsetY: number;

  constructor(config: CreepConfig = {}) {
    // Получаем кадры idle для создания начального спрайта
    const idleFrames = assetsManager.getCreepFrames('direCreep', 'idle');
    super(idleFrames);

    // Устанавливаем anchor сразу в конструкторе
    this.anchor.set(0.5);

    this.moveSpeed = config.moveSpeed ?? GAME_CONFIG.CREEP.movement.baseSpeed; // По умолчанию скорость крипа
    this.deathOffsetX = config.deathOffsetX ?? GAME_CONFIG.CREEP.death.offsetX; // Смещение по X при смерти
    this.deathOffsetY = config.deathOffsetY ?? GAME_CONFIG.CREEP.death.offsetY; // Смещение по Y при смерти

    // Настройка позиции и масштаба
    this.x = config.x ?? (GAME_CONFIG.SCREEN.defaultWidth + GAME_CONFIG.CREEP.spawn.spawnOffset); // Начинаем за правым краем экрана
    this.y = config.y ?? (GAME_CONFIG.SCREEN.defaultHeight * (GAME_CONFIG.CREEP.spawn.positionY / GAME_CONFIG.SCREEN.defaultHeight)); // Примерно на уровне земли
    this.scale.set(config.scale ?? GAME_CONFIG.CREEP.scale.base);

    // Создаем все анимации
    this.createAnimations();
    
    // Настройка начальной анимации
    this.setupIdleAnimation();
    
    console.log(`👹 Создан dire creep на позиции (${this.x}, ${this.y})`);
  }

  /**
   * Создание всех анимаций крипа
   */
  private createAnimations(): void {
    console.log('🎬 Анимации dire creep готовы');
  }

  /**
   * Настройка анимации idle
   */
  private setupIdleAnimation(): void {
    const idleFrames = assetsManager.getCreepFrames('direCreep', 'idle');
    this.textures = idleFrames;
    this.animationSpeed = GAME_CONFIG.CREEP.animations.speed;
    this.loop = true;
    this.play();
    this.currentState = EntityState.IDLE;
    
    console.log('⭕ Dire creep: переход в IDLE');
  }

  /**
   * Переход к анимации атаки
   */
  public startAttack(): void {
    if (this.isDead) return;
    
    // Сохраняем текущую позицию перед переключением анимации
    const currentX = this.x;
    const currentY = this.y;
    
    this.stop();
    const attackFrames = assetsManager.getCreepFrames('direCreep', 'attack');
    this.textures = attackFrames;
    this.animationSpeed = GAME_CONFIG.CREEP.animations.speed;
    this.loop = true;
    this.play();
    
    // Восстанавливаем позицию после переключения анимации
    this.x = currentX;
    this.y = currentY;
    
    this.currentState = EntityState.ATTACKING;
    
    console.log('⚔️ Dire creep: переход в ATTACK');
  }

  /**
   * Переход к анимации смерти
   */
  public startDeath(): void {
    if (this.isDead) return;
    
    console.log(`💀 СМЕРТЬ: до переключения позиция (${this.x}, ${this.y})`);
    
    this.isDead = true;
    
    // Сохраняем текущую позицию перед переключением анимации
    const currentX = this.x;
    const currentY = this.y;
    
    this.stop();
    const deathFrames = assetsManager.getCreepFrames('direCreep', 'death');
    this.textures = deathFrames;
    this.animationSpeed = GAME_CONFIG.CREEP.animations.speed;
    this.loop = false;
    this.play();
    
    // Восстанавливаем позицию после переключения анимации с принудительным смещением
    // Используем настраиваемое смещение для компенсации проблем с anchor/размерами кадров
    this.x = currentX + this.deathOffsetX; 
    this.y = currentY + this.deathOffsetY;
    
    console.log(`💀 СМЕРТЬ: после переключения позиция (${this.x}, ${this.y}) [смещено +${this.deathOffsetX}px по X, +${this.deathOffsetY}px по Y]`);
    
    this.currentState = EntityState.DYING; // Переходим в состояние смерти
    
    // Слушаем окончание анимации смерти
    this.onComplete = () => {
      console.log('💀 Dire creep: анимация смерти завершена');
      this.emit('death-complete'); // Событие для удаления крипа
    };
    
    // Дополнительная гарантия - удаляем через таймер если событие не сработало
    setTimeout(() => {
      if (!this.destroyed) {
        console.log('💀 Dire creep: принудительное завершение анимации смерти');
        this.emit('death-complete');
      }
    }, GAME_CONFIG.CREEP.death.maxDuration); // Максимальная длительность анимации смерти
    
    console.log('💀 Dire creep: переход в DEATH');
  }

  /**
   * Обновление крипа (движение)
   */
  public updateCreep(deltaTime: number): void {
    // Крип движется в состояниях IDLE и DYING (продолжает двигаться во время смерти)
    // Останавливается только во время атаки
    if (this.currentState === EntityState.IDLE || this.currentState === EntityState.DYING) {
      this.x -= this.moveSpeed * deltaTime;
    }
  }

  /**
   * Проверка жив ли крип
   */
  public getIsDead(): boolean {
    return this.isDead;
  }

  /**
   * Получение текущего состояния
   */
  public getCurrentState(): EntityState {
    return this.currentState;
  }

  /**
   * Получение позиции X
   */
  public getX(): number {
    return this.x;
  }

  /**
   * Установка скорости движения
   */
  public setMoveSpeed(speed: number): void {
    this.moveSpeed = speed;
  }
}
