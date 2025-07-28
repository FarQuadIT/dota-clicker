/**
 * Система пассивных способностей героев
 * 
 * Позволяет героям иметь пассивные способности, которые срабатывают автоматически
 * во время боя без необходимости активации игроком.
 * 
 * Поддерживаемые типы событий:
 * - onTakeDamage: срабатывает когда герой получает урон
 * - onDealDamage: срабатывает когда герой наносит урон
 * - onCreepKilled: срабатывает когда герой убивает крипа
 * 
 * ОПТИМИЗИРОВАНО ДЛЯ iOS: убраны логи, упрощена обработка
 */

import { Hero } from '../entities/Hero';
import { Creep } from '../entities/Creep';

// ==================================================================================
// ОПТИМИЗАЦИЯ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ
// ==================================================================================

/**
 * Определение мобильных устройств для отключения логов
 */
const IS_MOBILE = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

/**
 * Функция для логирования только на десктопе (производительность на мобильных)
 */
function mobileLog(message: string, ...args: any[]): void {
  if (!IS_MOBILE) {
    console.log(message, ...args);
  }
}

// ==================================================================================
// ИНТЕРФЕЙСЫ И ТИПЫ
// ==================================================================================

/**
 * Контекст события получения урона
 */
export interface TakeDamageContext {
  /** Герой, который получает урон */
  hero: Hero;
  /** Крип, который наносит урон */
  attacker: Creep;
  /** Количество урона */
  damage: number;
  /** Можно ли модифицировать урон */
  modifiable: boolean;
}

/**
 * Контекст события нанесения урона
 */
export interface DealDamageContext {
  /** Герой, который наносит урон */
  hero: Hero;
  /** Крип, который получает урон */
  target: Creep;
  /** Количество урона */
  damage: number;
}

/**
 * Контекст события убийства крипа
 */
export interface CreepKilledContext {
  /** Герой, который убил крипа */
  hero: Hero;
  /** Убитый крип */
  target: Creep;
  /** Урон, который добил крипа */
  finalDamage: number;
}

/**
 * Результат обработки способности
 */
export interface AbilityResult {
  /** Было ли событие обработано способностью */
  handled: boolean;
  /** Модифицированное значение (например, урон) */
  modifiedValue?: number;
  /** Дополнительные эффекты */
  effects?: Array<{
    type: 'damage' | 'heal' | 'effect';
    target: Hero | Creep;
    value: number;
    description: string;
  }>;
  /** Был ли убит крип от этой способности (для GameController) */
  creepKilled?: boolean;
}

/**
 * Базовый интерфейс пассивной способности героя
 */
export interface PassiveAbility {
  /** Уникальный ID способности */
  id: string;
  /** Название способности */
  name: string;
  /** Описание способности */
  description: string;
  /** Тип героя, которому принадлежит способность */
  heroType: string;
  
  /** Обработчик получения урона героем */
  onTakeDamage?(context: TakeDamageContext): AbilityResult;
  
  /** Обработчик нанесения урона героем */
  onDealDamage?(context: DealDamageContext): AbilityResult;
  
  /** Обработчик убийства крипа героем */
  onCreepKilled?(context: CreepKilledContext): AbilityResult;
}

// ==================================================================================
// РЕАЛИЗАЦИЯ СПОСОБНОСТЕЙ
// ==================================================================================

/**
 * Способность "Retaliate" центавра
 * Отражает 5% получаемого урона обратно в атакующего крипа
 * ОПТИМИЗИРОВАНО: убраны лишние логи и проверки
 */
export class RetaliateAbility implements PassiveAbility {
  public readonly id = 'retaliate';
  public readonly name = 'Retaliate';
  public readonly description = 'Отражает 5% получаемого урона обратно в атакующего';
  public readonly heroType = 'centaur';
  
  private readonly RETALIATE_PERCENT = 5; // 5% отражения урона
  
  public onTakeDamage(context: TakeDamageContext): AbilityResult {
    const { attacker, damage } = context;
    
    // Вычисляем урон для отражения (5% от получаемого урона, минимум 1)
    const calculatedDamage = Math.floor(damage * (this.RETALIATE_PERCENT / 100));
    const retaliationDamage = Math.max(1, calculatedDamage); // Минимум 1 урон
    
    // Наносим урон атакующему крипу
    const creepDied = attacker.takeDamage(retaliationDamage);
    
    // Создаем число урона от пассивной способности над healthbar крипа
    // Получаем доступ к GameController через app для создания числа урона
    const app = (attacker as any).app;
    if (app && (app as any).gameController && (app as any).gameController.damageNumberManager) {
      (app as any).gameController.damageNumberManager.createPassiveDamageNumberAboveHealthBar(
        retaliationDamage,
        attacker
      );
    }
    

    
    // ВАЖНО: Если крип умер от пассивной способности, уведомляем через результат
    if (creepDied) {
      // Добавляем специальный маркер в эффекты что крип был убит
      return {
        handled: true,
        modifiedValue: retaliationDamage,
        effects: [{
          type: 'damage',
          target: attacker,
          value: retaliationDamage,
          description: `Retaliate убил крипа`
        }],
        creepKilled: true // Специальный флаг для GameController
      };
    }
    
    return {
      handled: true,
      effects: [{
        type: 'damage',
        target: attacker,
        value: retaliationDamage,
        description: `Retaliate отразил ${retaliationDamage} урона`
      }]
    };
  }
}

/**
 * Способность "Blade Dance" джаггернаута
 * Наносит критический урон в размере 130% с вероятностью 10%
 * ОПТИМИЗИРОВАНО: убраны лишние логи и проверки
 */
export class BladeDanceAbility implements PassiveAbility {
  public readonly id = 'blade_dance';
  public readonly name = 'Blade Dance';
  public readonly description = 'Наносит критический урон в размере 130% с вероятностью 10%';
  public readonly heroType = 'juggernaut';
  
  private readonly CRIT_CHANCE = 100; // 10% вероятность
  private readonly CRIT_MULTIPLIER = 1.5; // 130% урона
  
  public onDealDamage(context: DealDamageContext): AbilityResult {
    // Проверить вероятность критического удара (10%)
    const isCritical = Math.random() * 100 < this.CRIT_CHANCE;
    
    if (isCritical) {
      // Увеличить урон до 130%
      const criticalDamage = Math.floor(context.damage * this.CRIT_MULTIPLIER);
      const bonusDamage = criticalDamage - context.damage;
      
      // Нанести дополнительный урон крипу
      const creepDied = context.target.takeDamage(bonusDamage);
      
      // Создать визуальный эффект критического удара
      // Получаем доступ к GameController через app для создания числа урона
      const app = (context.target as any).app;
      if (app && (app as any).gameController && (app as any).gameController.damageNumberManager) {
        (app as any).gameController.damageNumberManager.createCriticalDamageNumber(
          bonusDamage,
          context.target
        );
      }
      
      // ВАЖНО: Если крип умер от критического удара, уведомляем через результат
      if (creepDied) {
        return {
          handled: true,
          modifiedValue: criticalDamage,
          effects: [{
            type: 'damage',
            target: context.target,
            value: bonusDamage,
            description: `Критический удар убил крипа! +${bonusDamage} урона`
          }],
          creepKilled: true // Специальный флаг для GameController
        };
      }
      
      return {
        handled: true,
        modifiedValue: criticalDamage,
        effects: [{
          type: 'damage',
          target: context.target,
          value: bonusDamage,
          description: `Критический удар! +${bonusDamage} урона`
        }]
      };
    }
    
    return { handled: false };
  }
}

// ==================================================================================
// МЕНЕДЖЕР СПОСОБНОСТЕЙ - ОПТИМИЗИРОВАННЫЙ
// ==================================================================================

/**
 * Менеджер пассивных способностей героев
 * Управляет регистрацией и выполнением способностей
 * ОПТИМИЗИРОВАН: убраны лишние логи, упрощена обработка
 */
export class HeroAbilitiesManager {
  private abilities: Map<string, PassiveAbility[]> = new Map();
  
  constructor() {
    this.registerDefaultAbilities();
  }
  
  /**
   * Регистрация стандартных способностей героев
   */
  private registerDefaultAbilities(): void {
    // Регистрируем способности центавра
    this.registerAbility(new RetaliateAbility());
    
    // Регистрируем способности джаггернаута
    this.registerAbility(new BladeDanceAbility());
  }
  
  /**
   * Регистрация способности для определенного типа героя
   */
  public registerAbility(ability: PassiveAbility): void {
    const heroType = ability.heroType;
    
    if (!this.abilities.has(heroType)) {
      this.abilities.set(heroType, []);
    }
    
    const heroAbilities = this.abilities.get(heroType)!;
    
    // Проверяем, что способность с таким ID еще не зарегистрирована
    const existingAbility = heroAbilities.find(a => a.id === ability.id);
    if (existingAbility) {
      mobileLog(`⚠️ Способность ${ability.id} уже зарегистрирована для героя ${heroType}`);
      return;
    }
    
    heroAbilities.push(ability);
    mobileLog(`✅ Зарегистрирована способность ${ability.name} для героя ${heroType}`);
  }
  
  /**
   * Получение всех способностей для типа героя
   */
  public getAbilitiesForHero(heroType: string): PassiveAbility[] {
    return this.abilities.get(heroType) || [];
  }
  
  /**
   * Обработка события получения урона героем
   * ОПТИМИЗИРОВАНО: упрощенная обработка, без лишних логов
   */
  public handleTakeDamage(hero: Hero, attacker: Creep, damage: number): AbilityResult[] {
    const heroType = hero.getHeroType();
    const abilities = this.getAbilitiesForHero(heroType);
    
    // ОПТИМИЗАЦИЯ: Если нет способностей, сразу возвращаем пустой массив
    if (abilities.length === 0) {
      return [];
    }
    
    const results: AbilityResult[] = [];
    
    for (const ability of abilities) {
      if (ability.onTakeDamage) {
        const context: TakeDamageContext = {
          hero,
          attacker,
          damage,
          modifiable: true
        };
        
        try {
          const result = ability.onTakeDamage(context);
          if (result.handled) {
            results.push(result);
          }
        } catch (error) {
          // Логируем ошибки только на десктопе
          if (!IS_MOBILE) {
            console.warn('⚠️ Ошибка в пассивной способности:', error);
          }
        }
      }
    }
    
    return results;
  }
  
  /**
   * Обработка события нанесения урона героем
   */
  public handleDealDamage(hero: Hero, target: Creep, damage: number): AbilityResult[] {
    const heroType = hero.getHeroType();
    const abilities = this.getAbilitiesForHero(heroType);
    
    // ОПТИМИЗАЦИЯ: Если нет способностей, сразу возвращаем пустой массив
    if (abilities.length === 0) {
      return [];
    }
    
    const results: AbilityResult[] = [];
    
    for (const ability of abilities) {
      if (ability.onDealDamage) {
        const context: DealDamageContext = {
          hero,
          target,
          damage
        };
        
        try {
          const result = ability.onDealDamage(context);
          if (result.handled) {
            results.push(result);
          }
        } catch (error) {
          if (!IS_MOBILE) {
            console.warn('⚠️ Ошибка в пассивной способности:', error);
          }
        }
      }
    }
    
    return results;
  }
  
  /**
   * Обработка события убийства крипа героем
   */
  public handleCreepKilled(hero: Hero, target: Creep, finalDamage: number): AbilityResult[] {
    const heroType = hero.getHeroType();
    const abilities = this.getAbilitiesForHero(heroType);
    
    // ОПТИМИЗАЦИЯ: Если нет способностей, сразу возвращаем пустой массив
    if (abilities.length === 0) {
      return [];
    }
    
    const results: AbilityResult[] = [];
    
    for (const ability of abilities) {
      if (ability.onCreepKilled) {
        const context: CreepKilledContext = {
          hero,
          target,
          finalDamage
        };
        
        try {
          const result = ability.onCreepKilled(context);
          if (result.handled) {
            results.push(result);
          }
        } catch (error) {
          if (!IS_MOBILE) {
            console.warn('⚠️ Ошибка в пассивной способности:', error);
          }
        }
      }
    }
    
    return results;
  }
  
  /**
   * Получение описания всех способностей героя
   */
  public getHeroAbilitiesDescription(heroType: string): string[] {
    const abilities = this.getAbilitiesForHero(heroType);
    return abilities.map(ability => `${ability.name}: ${ability.description}`);
  }
}

// ==================================================================================
// ГЛОБАЛЬНЫЙ ЭКЗЕМПЛЯР
// ==================================================================================

/**
 * Глобальный менеджер способностей героев
 */
export const heroAbilitiesManager = new HeroAbilitiesManager(); 