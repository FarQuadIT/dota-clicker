import React, { useState, useRef, useEffect, useCallback } from 'react';
import { mapNumericIdToHeroName, getHeroConfigByNumericId } from '../../../game/config/heroConfig';
import { heroAbilitiesManager, type PassiveAbility } from '../../../game/systems/HeroAbilities';
import { shopCategories } from '../../../shared/constants/shopConfig';
import { purchaseHeroWithDiamonds, fetchHeroInfo, type HeroInfo } from '../../../shared/api/apiService';
import { useGold } from '../../../contexts/GoldContext';
import { useUser } from '../../../contexts/UserContext';
import { TEST_USER_ID } from '../../../shared/constants';
import HeroDisplay from '../HeroDisplay';
import './HeroPreview.css';

interface HeroPreviewProps {
  /** ID героя для превью */
  heroId: number;
  /** Имя героя для отображения */
  heroName: string;
  /** Коллбэк при закрытии */
  onClose: () => void;
  /** Коллбэк при нажатии кнопки "Назад" */
  onBack: () => void;
}

// Интерфейс для отображения способности в UI
interface UIAbility extends PassiveAbility {
  icon: string;
  type: 'passive' | 'active';
}

// Типизированные характеристики героев (соответствует API)
interface HeroStatsType {
  'max-health': number;
  'health-regen': number;
  'max-mana': number;
  'mana-regen': number;
  'damage': number;
  'vampirism': number;
  'movement-speed': number;
}

/**
 * Компонент превью героя с анимацией и характеристиками
 */
const HeroPreview: React.FC<HeroPreviewProps> = ({
  heroId,
  heroName,
  onClose,
  onBack
}) => {
  // Состояние для тултипа характеристик
  const [selectedStat, setSelectedStat] = useState<{ key: string; position: { x: number; y: number; arrowOffset: number } } | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipMounted, setTooltipMounted] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const fadeTimeoutRef = useRef<number | null>(null);
  
  // Состояние для покупки героя
  const [isPurchasing, setIsPurchasing] = useState(false);
  
  // Состояние для данных героя
  const [heroInfo, setHeroInfo] = useState<HeroInfo | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  
  // Получаем данные о осколках и пользователе
  const { diamonds, setDiamonds } = useGold();
  const { refreshUserData } = useUser();

  // Получаем техническое имя героя и его конфигурацию
  const heroTechnicalName = mapNumericIdToHeroName(heroId);
  const heroConfig = getHeroConfigByNumericId(heroId);
  const gameAbilities = heroAbilitiesManager.getAbilitiesForHero(heroTechnicalName);

  // Загружаем данные героя из API
  useEffect(() => {
    const loadHeroInfo = async () => {
      setIsLoadingStats(true);
      try {
        const info = await fetchHeroInfo(heroId);
        if (info) {
          setHeroInfo(info);
        } else {
          console.error(`Не удалось загрузить информацию о герое ${heroId}`);
        }
      } catch (error) {
        console.error('Ошибка загрузки информации о герое:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    loadHeroInfo();
  }, [heroId]);

  // Преобразуем данные API в формат для отображения
  const stats: HeroStatsType | null = heroInfo ? {
    'max-health': Math.round(heroInfo.maxHealth),
    'health-regen': Math.round(heroInfo.healthRegen),
    'max-mana': Math.round(heroInfo.maxEnergy),
    'mana-regen': Math.round(heroInfo.energyRegen),
    'damage': Math.round(heroInfo.damage),
    'vampirism': Math.round(heroInfo.vampirism),
    'movement-speed': Math.round(heroInfo.movementSpeed)
  } : null;

  // Преобразуем игровые способности в UI-способности с иконками
  const heroAbilities: UIAbility[] = gameAbilities.map(ability => ({
    ...ability,
    icon: ability.id === 'retaliate' 
      ? '/media/game/assets/heroes/centaur/centaur_abilities/centaur_retaliate.png'
      : ability.id === 'blade_dance'
      ? '/media/game/assets/heroes/juggernaut/juggernaut_abilities/juggernaut_blade_dance.png'
      : '/media/game/assets/default_ability.png', // fallback
    type: 'passive' as const
  }));

  // Характеристики для отображения
  const displayStats = [
    { key: 'max-health' as keyof HeroStatsType, icon: shopCategories['max-health'].icon },
    { key: 'health-regen' as keyof HeroStatsType, icon: shopCategories['health-regen'].icon },
    { key: 'max-mana' as keyof HeroStatsType, icon: shopCategories['max-mana'].icon },
    { key: 'mana-regen' as keyof HeroStatsType, icon: shopCategories['mana-regen'].icon },
    { key: 'damage' as keyof HeroStatsType, icon: shopCategories['damage'].icon },
    { key: 'vampirism' as keyof HeroStatsType, icon: shopCategories['vampirism'].icon },
    { key: 'movement-speed' as keyof HeroStatsType, icon: shopCategories['movement-speed'].icon }
  ];

  // Получаем характеристики героя
  // const stats = heroStats[heroId] || heroStats[1]; // This line is removed as stats are now fetched from API

  // Функция для измерения ширины текста (из MainPage)
  const measureTextWidth = (text: string): number => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (context) {
      context.font = '14px system-ui, -apple-system, sans-serif';
      return context.measureText(text).width + 16;
    }
    return text.length * 8 + 16;
  };

  // Обработчик глобального клика для скрытия тултипа
  const handleGlobalClick = () => {
    if (tooltipMounted) {
      setTooltipVisible(false);
      fadeTimeoutRef.current = setTimeout(() => {
        setTooltipMounted(false);
        setSelectedStat(null);
        fadeTimeoutRef.current = null;
      }, 200);
    }
  };

  // Обработчик клика на иконку характеристики (из MainPage)
  const handleStatClick = (key: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (selectedStat && selectedStat.key === key && tooltipMounted) {
      handleGlobalClick();
      return;
    }
    
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = null;
    }
    
    setTooltipVisible(false);
    setTooltipMounted(false);
    setSelectedStat(null);
    
    const rect = event.currentTarget.getBoundingClientRect();
    const originalX = rect.left + rect.width / 2;
    const y = rect.top - 10;
    
    const categoryName = Object.entries(shopCategories).find(([k]) => k === key)?.[1]?.name || key;
    const tooltipWidth = measureTextWidth(categoryName);
    
    let tooltipX = originalX;
    
    if (tooltipX - tooltipWidth / 2 < 10) {
      tooltipX = tooltipWidth / 2 + 10;
    } else if (tooltipX + tooltipWidth / 2 > window.innerWidth - 10) {
      tooltipX = window.innerWidth - tooltipWidth / 2 - 10;
    }
    
    const arrowOffset = originalX - tooltipX;
    
    setTimeout(() => {
      setSelectedStat({
        key,
        position: { 
          x: tooltipX, 
          y,
          arrowOffset
        }
      });
      
      setTooltipMounted(true);
      setTimeout(() => setTooltipVisible(true), 10);
    }, 10);
  };

  // Глобальный слушатель кликов для скрытия тултипа
  useEffect(() => {
    const handleGlobalClickEvent = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const isStatIcon = target.classList.contains('hero-preview-stat-icon') || 
                         target.closest('.hero-preview-stat') ||
                         target.hasAttribute('data-stat-icon');
      
      if (!isStatIcon && tooltipMounted) {
        handleGlobalClick();
      }
    };

    document.addEventListener('click', handleGlobalClickEvent);
    return () => document.removeEventListener('click', handleGlobalClickEvent);
  }, [tooltipMounted]);

  // Очистка timeout при размонтировании
  useEffect(() => {
    return () => {
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, []);

  // Стоимость героя в осколках (примерная, можно настроить)
  const heroCost = 20;
  
  // Проверяем, достаточно ли осколков
  const canAfford = diamonds >= heroCost;

  // Обработчик покупки героя
  const handlePurchaseHero = async () => {
    if (isPurchasing || !canAfford) return;
    
    setIsPurchasing(true);
    
    try {
      console.log(`🛒 Начинаем покупку героя ${heroId} за ${heroCost} осколков`);
      
      const success = await purchaseHeroWithDiamonds(TEST_USER_ID, heroId, heroCost);
      
      if (success) {
        console.log(`✅ Герой ${heroId} успешно куплен!`);
        
        // Сразу списываем осколки из UI
        setDiamonds(diamonds - heroCost);
        
        try {
          // Обновляем данные пользователя
          await refreshUserData();
          
          // Закрываем модальное окно
          onClose();
        } catch (refreshError) {
          console.warn('⚠️ Герой куплен, но не удалось обновить данные:', refreshError);
          // Все равно закрываем окно - герой уже куплен
          onClose();
        }
      } else {
        console.error(`❌ Не удалось купить героя ${heroId}`);
        alert('Не удалось купить героя. Попробуйте еще раз.');
      }
    } catch (error) {
      console.error('❌ Ошибка при покупке героя:', error);
      alert('Произошла ошибка при покупке героя.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="hero-preview-overlay" onClick={handleOverlayClick}>
      <div className="hero-preview-modal">
        {/* Заголовок с кнопкой "Назад" */}
        <div className="hero-preview-header">
          <button 
            className="hero-preview-back-btn"
            onClick={onBack}
            aria-label="Назад"
          >
            <i className="fas fa-arrow-left" />
          </button>
          <h2 className="hero-preview-title">{heroName}</h2>
          <button 
            className="hero-preview-close-btn"
            onClick={onClose}
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>

        {/* Основной контент */}
        <div className="hero-preview-content">
          {/* Верхняя часть с анимацией и способностями */}
          <div className="hero-preview-top">
            {/* Анимация героя с фоном - используем готовый HeroDisplay */}
            <div className="hero-preview-animation">
              <HeroDisplay 
                width={360} 
                height={280} 
                scale={0.35}
                heroType={heroTechnicalName}
              />
            </div>

            {/* Способности слева */}
            {heroAbilities.length > 0 && (
              <div className="hero-preview-abilities">
                <h3 className="hero-preview-abilities-title">Способности</h3>
                {heroAbilities.map((ability) => (
                  <div key={ability.id} className="hero-preview-ability">
                    <div className="hero-preview-ability-icon">
                      <img 
                        src={ability.icon} 
                        alt={ability.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/media/game/assets/default_ability.png';
                        }}
                      />
                    </div>
                    <div className="hero-preview-ability-info">
                      <h4 className="hero-preview-ability-name">{ability.name}</h4>
                      <p className="hero-preview-ability-desc">{ability.description}</p>
                      <span className="hero-preview-ability-type">
                        {ability.type === 'passive' ? 'Пассивная' : 'Активная'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Блок характеристик */}
          <div className="hero-preview-stats">
            <h3 className="hero-preview-stats-title">Характеристики</h3>
            {isLoadingStats ? (
              <div className="hero-preview-stats-loading">
                <div style={{ 
                  textAlign: 'center', 
                  color: '#c0c0c0', 
                  padding: '20px',
                  fontSize: '14px'
                }}>
                  Загрузка характеристик...
                </div>
              </div>
            ) : !stats ? (
              <div className="hero-preview-stats-error">
                <div style={{ 
                  textAlign: 'center', 
                  color: '#ff6b6b', 
                  padding: '20px',
                  fontSize: '14px'
                }}>
                  Ошибка загрузки характеристик
                </div>
              </div>
            ) : (
              <div className="hero-preview-stats-grid">
                {displayStats.map(({ key, icon }) => (
                  <div 
                    key={key} 
                    className="hero-preview-stat"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatClick(key, e);
                    }}
                    data-stat-icon={key}
                  >
                    <img
                      src={icon}
                      alt={shopCategories[key].name}
                      className="hero-preview-stat-icon"
                      style={{
                        filter: `${shopCategories[key].filter} drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.5))`
                      }}
                    />
                    <div className="hero-preview-stat-value">
                      {typeof stats[key] === 'number' ? 
                        stats[key].toFixed(1).replace(/\.0$/, '') : 
                        stats[key]
                      }
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Кнопка приобрести */}
          <div className="hero-preview-actions">
            <button 
              className={`hero-preview-buy-btn ${!canAfford ? 'disabled' : ''}`}
              onClick={handlePurchaseHero}
              disabled={!canAfford || isPurchasing}
            >
              <img 
                src="/media/interface_icons/diamonds.png" 
                alt="Осколки" 
                className="hero-preview-diamonds-icon"
              />
              {isPurchasing ? 'Покупка...' : `Приобрести за ${heroCost} осколков`}
            </button>
          </div>
        </div>

        {/* Тултип для характеристик */}
        {tooltipMounted && selectedStat && (
          <div
            ref={tooltipRef}
            style={{
              position: 'fixed',
              left: `${selectedStat.position.x}px`,
              top: `${selectedStat.position.y}px`,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '14px',
              whiteSpace: 'nowrap',
              zIndex: 3000,
              pointerEvents: 'none',
              border: '1px solid rgba(255, 215, 0, 0.4)',
              textAlign: 'center',
              opacity: tooltipVisible ? 1 : 0,
              transition: 'opacity 0.2s ease-in-out, transform 0.2s ease-in-out',
              transform: `translate(-50%, -100%) scale(${tooltipVisible ? 1 : 0.9})`,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.6)'
            }}
          >
            {Object.entries(shopCategories).find(([key]) => key === selectedStat.key)?.[1]?.name || selectedStat.key}
            
            {/* Стрелочка, указывающая на иконку */}
            <div
              style={{
                position: 'absolute',
                bottom: '-6px',
                left: `calc(50% + ${selectedStat.position.arrowOffset}px)`,
                transform: 'translateX(-50%)',
                width: '0',
                height: '0',
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '6px solid rgba(0, 0, 0, 0.8)',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default HeroPreview;