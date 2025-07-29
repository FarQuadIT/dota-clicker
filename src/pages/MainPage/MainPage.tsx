// src/pages/MainPage/MainPage.tsx

import React, { useState, useEffect, useRef } from 'react';
import { useHeroStore } from '../../contexts/heroStore';
import { shopCategories } from '../../shared/constants/shopConfig';
import HeroDisplay from '../../features/ui/HeroDisplay';
import { heroLevelSystem, type HeroLevelData } from '../../game/systems/HeroLevelSystem';
import HeroesModal from '../../features/ui/HeroesModal';
import QuestsModal from '../../features/ui/QuestsModal';
import { heroAbilitiesManager, type PassiveAbility } from '../../game/systems/HeroAbilities';
import { TEST_HERO_ID, TEST_USER_ID } from '../../shared/constants';
import { mapNumericIdToHeroName, getHeroConfigByNumericId } from '../../game/config/heroConfig';
import { switchActiveHero, fetchActiveHeroStats } from '../../shared/api/apiService';
import { useGold } from '../../contexts/GoldContext';

/**
 * Главная страница с анимированным героем
 */
export default function MainPage() {
  // Получаем характеристики героя из хранилища
  const stats = useHeroStore((state) => state.stats);
  const setStats = useHeroStore((state) => state.setStats);
  
  // Получаем функции для работы с золотом
  const { syncGoldWithServer } = useGold();

  // Если данные еще не загружены, показываем загрузку
  if (!stats) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        height: '100vh',
        color: 'white',
        backgroundColor: '#1c2028'
      }}>
        <p>Загрузка данных героя...</p>
      </div>
    );
  }
  
  // Состояние для размеров экрана
  const [screenWidth, setScreenWidth] = useState(800);
  const [screenHeight, setScreenHeight] = useState(600);

  // Состояние для активной вкладки (по умолчанию "heroes")
  const [activeTab, setActiveTab] = useState<'heroes' | 'skins'>('heroes');
  
  // Состояние для слайдера героев
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);
  
  // Состояние для свайпов
  const [isSwipping, setIsSwipping] = useState(false);
  const [swipeStartX, setSwipeStartX] = useState<number | null>(null);
  const [swipeCurrentX, setSwipeCurrentX] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);

  // Состояние для выбранной характеристики и позиции тултипа
  const [selectedStat, setSelectedStat] = useState<{ key: string; position: { x: number; y: number; arrowOffset: number } } | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipMounted, setTooltipMounted] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const fadeTimeoutRef = useRef<number | null>(null);

  // Состояние для уровня героя
  const [heroLevelData, setHeroLevelData] = useState<HeroLevelData>(heroLevelSystem.getLevelData());

  // Перезагрузка данных героя при входе на страницу
  useEffect(() => {
    const reloadHeroData = async () => {
      try {
        const activeHeroData = await fetchActiveHeroStats(TEST_USER_ID);
        if (activeHeroData && activeHeroData.stats) {
          setStats(activeHeroData.stats);
          
          // Синхронизируем уровень с сервера
          if (activeHeroData.stats.level) {
            const currentSystemLevel = heroLevelSystem.getCurrentLevel();
            if (activeHeroData.stats.level !== currentSystemLevel) {
              heroLevelSystem.setLevel(activeHeroData.stats.level);
            }
          }
        }
      } catch (error) {
        console.error('❌ Ошибка при перезагрузке данных героя:', error);
      }
    };

    // Загружаем данные при монтировании компонента
    reloadHeroData();
  }, []); // Выполняется только при монтировании
  
  // Состояние для модального окна героев
  const [isHeroesModalOpen, setIsHeroesModalOpen] = useState(false);

  // Состояние для модального окна заданий
  const [isQuestsModalOpen, setIsQuestsModalOpen] = useState(false);

  // Интерфейс для отображения способности в UI
  interface UIAbility extends PassiveAbility {
    icon: string;
    type: 'passive' | 'active';
  }

  // Состояние для всплывающего блока способности
  const [selectedAbility, setSelectedAbility] = useState<{ ability: UIAbility; position: { x: number; y: number } } | null>(null);
  const [abilityTooltipVisible, setAbilityTooltipVisible] = useState(false);
  const [abilityTooltipMounted, setAbilityTooltipMounted] = useState(false);
  const abilityTooltipRef = useRef<HTMLDivElement>(null);
  const abilityFadeTimeoutRef = useRef<number | null>(null);

  // Отслеживаем изменения уровня героя
  useEffect(() => {
    const updateLevelData = () => {
      setHeroLevelData(heroLevelSystem.getLevelData());
    };

    // Подписываемся на события изменения уровня
    heroLevelSystem.on('levelUp', updateLevelData);
    heroLevelSystem.on('levelChanged', updateLevelData);
    heroLevelSystem.on('levelReset', updateLevelData);

    // Синхронизация уровня с данными героя при загрузке
    if (stats && stats.level) {
      // Если уровень в герое отличается от системы уровней, синхронизируем
      const currentSystemLevel = heroLevelSystem.getCurrentLevel();
      if (stats.level !== currentSystemLevel) {
        heroLevelSystem.setLevel(stats.level);
      }
    }

    // Очищаем подписки при размонтировании
    return () => {
      heroLevelSystem.off('levelUp', updateLevelData);
      heroLevelSystem.off('levelChanged', updateLevelData);
      heroLevelSystem.off('levelReset', updateLevelData);
    };
  }, [stats]); // Добавляем stats в зависимости

  // Отслеживаем изменения размера экрана
  useEffect(() => {
    const updateScreenSize = () => {
      setScreenWidth(window.innerWidth);
      setScreenHeight(window.innerHeight);
    };

    // Устанавливаем начальные значения
    updateScreenSize();

    // Добавляем слушатель изменения размера
    window.addEventListener('resize', updateScreenSize);

    // Очищаем слушатель при размонтировании
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  // Обработчик глобального клика для скрытия тултипа
  const handleGlobalClick = () => {
    if (tooltipMounted) {
      // Начинаем fade out анимацию
      setTooltipVisible(false);
      
      // Убираем тултип из DOM после завершения анимации
      fadeTimeoutRef.current = setTimeout(() => {
        setTooltipMounted(false);
        setSelectedStat(null);
        fadeTimeoutRef.current = null;
      }, 200); // 200ms для завершения fade out
    }
  };

  // Обработчик глобального клика для скрытия всплывающего блока способности
  const handleAbilityGlobalClick = () => {
    if (abilityTooltipMounted) {
      // Начинаем fade out анимацию
      setAbilityTooltipVisible(false);
      
      // Убираем всплывающий блок из DOM после завершения анимации
      abilityFadeTimeoutRef.current = setTimeout(() => {
        setAbilityTooltipMounted(false);
        setSelectedAbility(null);
        abilityFadeTimeoutRef.current = null;
      }, 200); // 200ms для завершения fade out
    }
  };

  // Глобальный слушатель кликов для скрытия тултипа и всплывающего блока способности
  useEffect(() => {
    const handleGlobalClickEvent = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Проверяем, что клик НЕ по иконке характеристики
      const isStatIcon = target.classList.contains('stat-icon') || 
                         target.closest('.stat-icon-container') ||
                         target.hasAttribute('data-stat-icon');
      
      // Проверяем, что клик НЕ по иконке способности
      const isAbilityIcon = target.classList.contains('ability-icon') || 
                            target.closest('.ability-icon-container') ||
                            target.hasAttribute('data-ability-icon');
      
      if (!isStatIcon && tooltipMounted) {
        handleGlobalClick();
      }
      
      if (!isAbilityIcon && abilityTooltipMounted) {
        handleAbilityGlobalClick();
      }
    };

    document.addEventListener('click', handleGlobalClickEvent);
    return () => document.removeEventListener('click', handleGlobalClickEvent);
  }, [tooltipMounted, abilityTooltipMounted]); // Добавляем зависимость от abilityTooltipMounted

  // Очистка timeout при размонтировании
  useEffect(() => {
    return () => {
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
      if (abilityFadeTimeoutRef.current) {
        clearTimeout(abilityFadeTimeoutRef.current);
      }
    };
  }, []);

  // Функция для измерения ширины текста
  const measureTextWidth = (text: string): number => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (context) {
      context.font = '14px system-ui, -apple-system, sans-serif'; // Соответствует стилям тултипа
      return context.measureText(text).width + 16; // +16 для padding (4px * 2) * 2
    }
    return text.length * 8 + 16; // Fallback
  };

  // Высота хедера и футера (примерно)
  const headerHeight = 60;
  const footerHeight = 70;
  
  // Свободная область = полная высота - хедер - футер
  const freeArea = screenHeight - headerHeight - footerHeight;
  
  // Кентавр занимает 50% свободной области
  const heroHeight = Math.max(200, freeArea * 0.5); // Минимум 200px
  
  // Адаптивная ширина для HeroDisplay
  const heroWidth = Math.min(800, screenWidth - 40);
  
  // Адаптивный масштаб для кентавра в зависимости от размера области  
  // Оптимизирован для кадров кентавра разного качества (256px-1024px)
  const adaptiveScale = Math.min(1.2, Math.max(0.3, heroHeight / 700));

  // Характеристики для отображения (берем иконки из shopCategories)
  const displayStats = [
    { key: 'max-health', icon: shopCategories['max-health'].icon },
    { key: 'health-regen', icon: shopCategories['health-regen'].icon },
    { key: 'max-mana', icon: shopCategories['max-mana'].icon },
    { key: 'mana-regen', icon: shopCategories['mana-regen'].icon },
    { key: 'damage', icon: shopCategories['damage'].icon },
    { key: 'vampirism', icon: shopCategories['vampirism'].icon },
    { key: 'movement-speed', icon: shopCategories['movement-speed'].icon }
  ];

  // Данные героев для слайдера (id соответствует hero_id в heroConfig.ts)
  const heroes = [
    { id: 1, name: 'Джаггернаут', image: '/media/main/heroes/slider/juggernaut.png' },
    { id: 2, name: 'Кентавр', image: '/media/main/heroes/slider/centaur.png' }
  ];

  // Получаем текущего героя из данных загруженных с сервера (через heroStore)
  // Если данные еще не загружены, используем значение по умолчанию
  const currentHeroNumericId = stats?.heroId ? parseInt(stats.heroId) : parseInt(TEST_HERO_ID);
  const currentHeroId = mapNumericIdToHeroName(currentHeroNumericId);
  const currentHeroConfig = getHeroConfigByNumericId(currentHeroNumericId);
  const gameAbilities = heroAbilitiesManager.getAbilitiesForHero(currentHeroId);
  
  // Преобразуем игровые способности в UI-способности с иконками
  const heroAbilities: UIAbility[] = gameAbilities.map(ability => ({
    ...ability,
    icon: ability.id === 'retaliate' 
      ? '/media/game/assets/heroes/centaur/centaur_abilities/centaur_retaliate.png'
      : ability.id === 'blade_dance'
      ? '/media/game/assets/heroes/juggernaut/juggernaut_abilities/juggernaut_blade_dance.png'
      : '/media/game/assets/default_ability.png', // fallback
    type: 'passive' as const // Пока все способности пассивные
  }));

  // Количество героев для отображения в слайдере (адаптивно)
  // Рассчитываем оптимальное количество на основе доступного пространства
  const getHeroesPerSlide = () => {
    const minCardWidth = 120; // Минимальная ширина карточки
    const maxCardWidth = 200; // Максимальная ширина карточки
    const containerPadding = Math.min(45, Math.max(30, screenWidth * 0.06)) * 2; // Левый и правый отступы
    const arrowsSpace = Math.min(32, Math.max(24, screenWidth * 0.04)) * 2; // Пространство для стрелок
    const availableWidth = screenWidth - containerPadding - arrowsSpace;
    
    // Попробуем разместить 4, 3, или 2 героя
    for (let count = 4; count >= 2; count--) {
      const gapSpace = (count - 1) * Math.min(16, Math.max(8, screenWidth * 0.02));
      const cardWidth = (availableWidth - gapSpace) / count;
      
      if (cardWidth >= minCardWidth && cardWidth <= maxCardWidth) {
        return count;
      }
    }
    
    return 2; // Минимум 2 героя
  };
  
  const heroesPerSlide = getHeroesPerSlide();
  const maxSlides = Math.max(0, heroes.length - heroesPerSlide);
  
  // Адаптивный gap для слайдов
  const adaptiveGap = Math.min(16, Math.max(8, screenWidth * 0.02));

  // Обработчик выбора героя
  const handleHeroSelect = async (heroId: number) => {
    // Проверяем что это не текущий герой
    if (heroId === currentHeroNumericId) {
      return;
    }

    
    try {
      const success = await switchActiveHero(TEST_USER_ID, heroId);
      if (success) {
        
        // Загружаем обновленные данные активного героя
        const activeHeroData = await fetchActiveHeroStats(TEST_USER_ID);
        if (activeHeroData) {
          // Обновляем данные героя в store
          useHeroStore.getState().setStats(activeHeroData.stats);
          
          // Принудительно синхронизируем золото для нового героя
          syncGoldWithServer(true);
        } else {
          console.warn('⚠️ Не удалось загрузить данные нового героя');
        }
      } else {
        console.error('❌ Не удалось переключить героя');
      }
    } catch (error) {
      console.error('❌ Ошибка при переключении героя:', error);
    }
  };

  // Функции для управления слайдером
  const nextHeroSlide = () => {
    setCurrentHeroSlide(prev => Math.min(prev + 1, maxSlides));
  };

  const prevHeroSlide = () => {
    setCurrentHeroSlide(prev => Math.max(prev - 1, 0));
  };

  // Новые обработчики интерактивных свайпов
  const handleSwipeStart = (clientX: number, target: HTMLElement) => {
    setIsSwipping(true);
    setSwipeStartX(clientX);
    setSwipeCurrentX(clientX);
    setSwipeOffset(0);
    target.style.cursor = 'grabbing';
  };

  const handleSwipeMove = (clientX: number) => {
    if (!isSwipping || !swipeStartX) return;
    
    setSwipeCurrentX(clientX);
    const deltaX = clientX - swipeStartX;
    const containerWidth = window.innerWidth;
    const maxOffset = containerWidth * 0.3; // Максимальное смещение 30% от ширины экрана
    
    // Ограничиваем смещение
    const limitedOffset = Math.max(-maxOffset, Math.min(maxOffset, deltaX));
    setSwipeOffset(limitedOffset);
  };

  const handleSwipeEnd = (target: HTMLElement) => {
    if (!isSwipping || !swipeStartX || !swipeCurrentX) {
      target.style.cursor = 'grab';
      setIsSwipping(false);
      setSwipeOffset(0);
      return;
    }

    const deltaX = swipeCurrentX - swipeStartX;
    const threshold = 80; // Пороговое значение для переключения

    // Определяем, нужно ли переключить слайд
    if (deltaX < -threshold && currentHeroSlide < maxSlides) {
      nextHeroSlide();
    } else if (deltaX > threshold && currentHeroSlide > 0) {
      prevHeroSlide();
    }

    // Сбрасываем состояние
    target.style.cursor = 'grab';
    setIsSwipping(false);
    setSwipeStartX(null);
    setSwipeCurrentX(null);
    setSwipeOffset(0);
  };

  // Touch события
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    handleSwipeStart(e.targetTouches[0].clientX, e.currentTarget as HTMLElement);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    handleSwipeMove(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    handleSwipeEnd(e.currentTarget as HTMLElement);
  };

  // Mouse события
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleSwipeStart(e.clientX, e.currentTarget as HTMLElement);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleSwipeMove(e.clientX);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    handleSwipeEnd(e.currentTarget as HTMLElement);
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    if (isSwipping) {
      handleSwipeEnd(e.currentTarget as HTMLElement);
    }
  };

  // Обработчик клика на иконку характеристики
  const handleStatClick = (key: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Предотвращаем всплытие события
    
    // Если кликнули на ту же иконку, что уже показана - скрываем тултип
    if (selectedStat && selectedStat.key === key && tooltipMounted) {
      handleGlobalClick();
      return;
    }
    
    // Очищаем предыдущий timeout, если есть
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = null;
    }
    
    // Сбрасываем все состояния для перезапуска анимации
    setTooltipVisible(false);
    setTooltipMounted(false);
    setSelectedStat(null);
    
    const rect = event.currentTarget.getBoundingClientRect();
    const originalX = rect.left + rect.width / 2; // Позиция центра иконки
    const y = rect.top - 10; // Немного выше иконки
    
    // Получаем текст и измеряем его ширину
    const categoryName = Object.entries(shopCategories).find(([k]) => k === key)?.[1]?.name || key;
    const tooltipWidth = measureTextWidth(categoryName);
    
    let tooltipX = originalX; // Позиция тултипа
    
    // Коррекция позиции тултипа для крайних элементов
    if (tooltipX - tooltipWidth / 2 < 10) {
      // Левый край - сдвигаем тултип правее
      tooltipX = tooltipWidth / 2 + 10;
    } else if (tooltipX + tooltipWidth / 2 > window.innerWidth - 10) {
      // Правый край - сдвигаем тултип левее
      tooltipX = window.innerWidth - tooltipWidth / 2 - 10;
    }
    
    // Вычисляем смещение стрелочки
    const arrowOffset = originalX - tooltipX;
    
    // Задержка для сброса состояний, затем запуск новой анимации
    setTimeout(() => {
      // Устанавливаем новую позицию тултипа
      setSelectedStat({
        key,
        position: { 
          x: tooltipX, 
          y,
          arrowOffset
        }
      });
      
      // Показываем тултип с анимацией
      setTooltipMounted(true);
      setTimeout(() => setTooltipVisible(true), 10); // Небольшая задержка для плавного появления
    }, 10);
  };

  // Обработчик клика на иконку способности
  const handleAbilityClick = (ability: UIAbility, event: React.MouseEvent) => {
    event.stopPropagation(); // Предотвращаем всплытие события
    
    // Если кликнули на ту же способность, что уже показана - скрываем всплывающий блок
    if (selectedAbility && selectedAbility.ability.id === ability.id && abilityTooltipMounted) {
      handleAbilityGlobalClick();
      return;
    }
    
    // Очищаем предыдущий timeout, если есть
    if (abilityFadeTimeoutRef.current) {
      clearTimeout(abilityFadeTimeoutRef.current);
      abilityFadeTimeoutRef.current = null;
    }
    
    // Сбрасываем все состояния для перезапуска анимации
    setAbilityTooltipVisible(false);
    setAbilityTooltipMounted(false);
    setSelectedAbility(null);
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.right + 10; // Справа от иконки
    const y = rect.top + rect.height / 2; // По центру иконки по вертикали
    
    // Задержка для сброса состояний, затем запуск новой анимации
    setTimeout(() => {
      // Устанавливаем новую позицию всплывающего блока
      setSelectedAbility({
        ability,
        position: { x, y }
      });
      
      // Показываем всплывающий блок с анимацией
      setAbilityTooltipMounted(true);
      setTimeout(() => setAbilityTooltipVisible(true), 10); // Небольшая задержка для плавного появления
    }, 10);
  };

  // Функция для получения изображения ранга
  const getRankImage = (rankName: string): string => {
    switch (rankName) {
      case 'Бронза':
        return '/media/game/assets/levels/bronze.jpg';
      case 'Серебро':
        return '/media/game/assets/levels/silver.webp';
      case 'Золото':
        return '/media/game/assets/levels/gold.JPG';
      case 'Платина':
        return '/media/game/assets/levels/platinum.webp';
      case 'Мастер':
        return '/media/game/assets/levels/master.webp';
      case 'Грандмастер':
        return '/media/game/assets/levels/grandmaster.webp';
      default:
        return '/media/game/assets/levels/bronze.jpg'; // Fallback на бронзу
    }
  };

  return (
    <div 
      onClick={(e) => {
        // Если клик не по иконке характеристики или способности - скрываем тултипы
        const target = e.target as HTMLElement;
        const isStatIcon = target.classList.contains('stat-icon') || 
                           target.closest('.stat-icon-container');
        const isAbilityIcon = target.classList.contains('ability-icon') || 
                              target.closest('.ability-icon-container');
        
        if (!isStatIcon && tooltipMounted) {
          handleGlobalClick();
        }
        
        if (!isAbilityIcon && abilityTooltipMounted) {
          handleAbilityGlobalClick();
        }
      }}
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingBottom: '70px', // Отступ от Footer
        backgroundColor: '#242424',
        color: 'white',
        overflow: 'auto',
        boxSizing: 'border-box'
      }}
    >
      
      {/* Кентавр адаптивно занимающий 50% свободной области */}
    <div style={{ 
        position: 'relative',
        width: '100vw', // На всю ширину экрана
        height: `${heroHeight}px`,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundImage: 'url(/media/game/images/forest_background1.jpg)',
        backgroundSize: '1000%', // Покрывает всю область без искажений
        backgroundPosition: '75% 59%', // Показываем центральную часть
        backgroundRepeat: 'no-repeat',
        marginLeft: 'calc(-50vw + 50%)', // Расширяем контейнер на всю ширину экрана
        zIndex: 0 // Фон позади кентавра
      }}>
        


        {/* Иконки способностей героя (слева) */}
        {heroAbilities.length > 0 && (
          <div style={{
            position: 'absolute',
            left: `clamp(15px, 3vw, 30px)`,
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            flexDirection: 'column',
            gap: `clamp(8px, 1.5vw, 15px)`,
            zIndex: 2
          }}>
                         {heroAbilities.map((ability: UIAbility, index: number) => (
              <div
                key={ability.id}
                className="ability-icon-container"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAbilityClick(ability, e);
                }}
                data-ability-icon={ability.id}
                style={{
                  width: `clamp(50px, 8vw, 80px)`,
                  height: `clamp(50px, 8vw, 80px)`,
                  background: 'linear-gradient(135deg, rgba(20, 25, 30, 0.95) 0%, rgba(35, 40, 45, 0.85) 50%, rgba(20, 25, 30, 0.95) 100%)',
                  border: '3px solid rgba(255, 215, 0, 0.6)',
                  borderRadius: `clamp(8px, 1.5vw, 12px)`,
                  padding: '0',
                  boxShadow: `
                    0 8px 32px rgba(0, 0, 0, 0.7),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1),
                    inset 0 -1px 0 rgba(0, 0, 0, 0.3),
                    0 0 15px rgba(255, 215, 0, 0.3)
                  `,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 1)';
                  e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
                  e.currentTarget.style.boxShadow = `
                    0 12px 40px rgba(0, 0, 0, 0.8),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1),
                    inset 0 -1px 0 rgba(0, 0, 0, 0.3),
                    0 0 25px rgba(255, 215, 0, 0.5)
                  `;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.6)';
                  e.currentTarget.style.transform = 'scale(1) translateY(0px)';
                  e.currentTarget.style.boxShadow = `
                    0 8px 32px rgba(0, 0, 0, 0.7),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1),
                    inset 0 -1px 0 rgba(0, 0, 0, 0.3),
                    0 0 15px rgba(255, 215, 0, 0.3)
                  `;
                }}
              >
                {/* Декоративный блик */}
                <div style={{
                  position: 'absolute',
                  top: '10%',
                  left: '10%',
                  width: '30%',
                  height: '30%',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, transparent 50%)',
                  borderRadius: '50%',
                  pointerEvents: 'none'
                }} />
                
                                 {/* Иконка способности */}
                 <img
                   className="ability-icon"
                   src={ability.icon}
                   alt={ability.name}
                   style={{
                     width: '100%',
                     height: '100%',
                     objectFit: 'cover',
                     filter: 'drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.8)) brightness(1.1)',
                     transition: 'transform 0.3s ease',
                     borderRadius: `clamp(4px, 1vw, 6px)`
                   }}
                 />
              </div>
            ))}
          </div>
        )}

        {/* Герой с адаптивным качеством (HD/MD/LD) */}
        <HeroDisplay 
          width={heroWidth} 
          height={heroHeight} 
          scale={adaptiveScale}
          heroType={currentHeroId}
        />

        {/* Значок ранга героя */}
        <div style={{
          position: 'absolute',
          top: `clamp(8px, 1.5vh, 20px)`,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 3
        }}>
          {/* Иконка ранга с цифрой уровня поверх */}
          <div style={{
            width: `clamp(45px, ${Math.min(screenWidth * 0.12, screenHeight * 0.08)}px, 90px)`,
            height: `clamp(45px, ${Math.min(screenWidth * 0.12, screenHeight * 0.08)}px, 90px)`,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img 
              src={getRankImage(heroLevelData.levelName)}
              alt={`Ранг ${heroLevelData.levelName}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'brightness(1.1) contrast(1.2)'
              }}
            />
            
            {/* Цифра уровня поверх значка */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: `clamp(14px, ${Math.min(screenWidth * 0.045, screenHeight * 0.03)}px, 32px)`,
              fontWeight: 'bold',
              color: '#ffffff',
              textShadow: `
                ${Math.max(1, Math.min(screenWidth * 0.004, 3))}px ${Math.max(1, Math.min(screenWidth * 0.004, 3))}px ${Math.max(2, Math.min(screenWidth * 0.008, 6))}px rgba(0, 0, 0, 1),
                -${Math.max(1, Math.min(screenWidth * 0.003, 2))}px -${Math.max(1, Math.min(screenWidth * 0.003, 2))}px ${Math.max(2, Math.min(screenWidth * 0.006, 4))}px rgba(0, 0, 0, 1),
                ${Math.max(1, Math.min(screenWidth * 0.003, 2))}px -${Math.max(1, Math.min(screenWidth * 0.003, 2))}px ${Math.max(2, Math.min(screenWidth * 0.006, 4))}px rgba(0, 0, 0, 1),
                -${Math.max(1, Math.min(screenWidth * 0.003, 2))}px ${Math.max(1, Math.min(screenWidth * 0.003, 2))}px ${Math.max(2, Math.min(screenWidth * 0.006, 4))}px rgba(0, 0, 0, 1),
                0 0 ${Math.max(3, Math.min(screenWidth * 0.01, 8))}px rgba(0, 0, 0, 0.8)
              `,
              lineHeight: 1,
              zIndex: 1
            }}>
              {heroLevelData.currentLevel}
            </div>
          </div>
        </div>

        {/* Кнопки заданий и видео-наград */}
        <div style={{
          position: 'absolute',
          right: '20px',
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          zIndex: 2
        }}>
          {/* Кнопка заданий */}
          <button
            onClick={() => {
              setIsQuestsModalOpen(true);
            }}
            style={{
              width: 'clamp(50px, 6vw, 70px)',
              height: 'clamp(50px, 6vw, 70px)',
              background: 'linear-gradient(135deg, rgba(20, 25, 30, 0.95) 0%, rgba(35, 40, 45, 0.85) 50%, rgba(20, 25, 30, 0.95) 100%)',
              border: '2px solid rgba(255, 215, 0, 0.4)',
              borderRadius: '8px',
              padding: '8px',
              boxShadow: `
                0 8px 32px rgba(0, 0, 0, 0.5),
                inset 0 1px 0 rgba(255, 255, 255, 0.1),
                inset 0 -1px 0 rgba(0, 0, 0, 0.3)
              `,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.8)';
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = `
                0 8px 32px rgba(0, 0, 0, 0.5),
                0 0 20px rgba(255, 215, 0, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.1),
                inset 0 -1px 0 rgba(0, 0, 0, 0.3)
              `;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.4)';
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = `
                0 8px 32px rgba(0, 0, 0, 0.5),
                inset 0 1px 0 rgba(255, 255, 255, 0.1),
                inset 0 -1px 0 rgba(0, 0, 0, 0.3)
              `;
            }}
          >
            <i 
              className="fas fa-list-ul" 
              style={{
                fontSize: 'clamp(18px, 3vw, 24px)',
                color: '#ffd700',
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)'
              }}
            />
          </button>

          {/* Кнопка видео-наград */}
          <button
            onClick={() => {
              console.log('Открыть видео для получения награды');
              // Здесь будет логика открытия видео-рекламы
            }}
            style={{
              width: 'clamp(50px, 6vw, 70px)',
              height: 'clamp(50px, 6vw, 70px)',
              background: 'linear-gradient(135deg, rgba(20, 25, 30, 0.95) 0%, rgba(35, 40, 45, 0.85) 50%, rgba(20, 25, 30, 0.95) 100%)',
              border: '2px solid rgba(255, 64, 129, 0.4)',
              borderRadius: '8px',
              padding: '8px',
              boxShadow: `
                0 8px 32px rgba(0, 0, 0, 0.5),
                inset 0 1px 0 rgba(255, 255, 255, 0.1),
                inset 0 -1px 0 rgba(0, 0, 0, 0.3)
              `,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 64, 129, 0.8)';
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = `
                0 8px 32px rgba(0, 0, 0, 0.5),
                0 0 20px rgba(255, 64, 129, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.1),
                inset 0 -1px 0 rgba(0, 0, 0, 0.3)
              `;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 64, 129, 0.4)';
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = `
                0 8px 32px rgba(0, 0, 0, 0.5),
                inset 0 1px 0 rgba(255, 255, 255, 0.1),
                inset 0 -1px 0 rgba(0, 0, 0, 0.3)
              `;
            }}
          >
            <i 
              className="fas fa-play" 
              style={{
                fontSize: 'clamp(18px, 3vw, 24px)',
                color: '#ff4081',
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)'
              }}
            />
          </button>
        </div>
      </div>

      {/* Стилизованная панель характеристик в стиле Dota */}
      <div style={{
        width: '100%',
        minHeight: '80px', // Минимальная высота для избежания слишком маленького размера
        background: 'linear-gradient(135deg, rgba(20, 25, 30, 0.95) 0%, rgba(35, 40, 45, 0.85) 50%, rgba(20, 25, 30, 0.95) 100%)',
        border: '2px solid rgba(100, 120, 140, 0.3)',
        borderRadius: '8px',
        padding: '16px 12px',
                  margin: '0 0 10px 0', // Убираем отступ сверху, оставляем снизу
        boxShadow: `
          0 8px 32px rgba(0, 0, 0, 0.5),
          inset 0 1px 0 rgba(255, 255, 255, 0.1),
          inset 0 -1px 0 rgba(0, 0, 0, 0.3)
        `,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {/* Декоративные элементы */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(255, 215, 0, 0.6) 50%, transparent 100%)'
        }} />
        
        {/* Компактный заголовок секции */}
        <div style={{
          textAlign: 'center',
          marginBottom: '12px',
          borderBottom: '1px solid rgba(100, 120, 140, 0.3)',
          paddingBottom: '8px',
          flexShrink: 0 // Не сжимается
        }}>
          <h3 style={{
            margin: 0,
            fontSize: 'clamp(12px, 3.5vw, 18px)', // Более чувствительный к размеру экрана
            fontWeight: 'bold',
            color: '#c9aa71',
            textTransform: 'uppercase',
            letterSpacing: 'clamp(0.5px, 0.5vw, 1px)', // Адаптивный spacing
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)'
          }}>
            Характеристики
          </h3>
        </div>
        
        {/* Адаптивная сетка характеристик по содержимому */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 'clamp(4px, 2vw, 12px)', // Адаптивный gap
          width: '100%',
          alignItems: 'start' // Выравнивание ячеек по верху
        }}>
          {displayStats.map(({ icon, key }, index) => (
            <div
              key={index}
              className="stat-icon-container"
              onClick={(e) => {
                e.stopPropagation();
                handleStatClick(key, e);
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 'clamp(2px, 1vw, 6px)', // Адаптивный gap
                cursor: 'pointer',
                background: 'rgba(0, 0, 0, 0.2)',
                border: '1px solid rgba(100, 120, 140, 0.3)',
                borderRadius: 'clamp(4px, 1vw, 8px)', // Адаптивный radius
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                padding: 'clamp(4px, 2vw, 12px) clamp(2px, 1vw, 8px)', // Адаптивный padding
                height: 'fit-content' // Высота по содержимому
              }}
              data-stat-icon={key}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(201, 170, 113, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(201, 170, 113, 0.5)';
                e.currentTarget.style.transform = 'translateY(-1px)'; // Меньше подъем
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(100, 120, 140, 0.3)';
                e.currentTarget.style.transform = 'translateY(0px)';
              }}
            >
              {/* Адаптивная иконка характеристики */}
              <img
                className="stat-icon"
                src={icon}
                alt=""
                style={{
                  width: 'clamp(24px, 4vw, 36px)', // Уменьшил размеры
                  height: 'clamp(24px, 4vw, 36px)',
                  filter: `${shopCategories[key].filter} drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.5))`,
                  transition: 'transform 0.3s ease',
                  transform: selectedStat?.key === key ? 'scale(1.05)' : 'scale(1)', // Меньше увеличение
                  flexShrink: 0 // Не сжимается
                }}
              />
              
              {/* Адаптивное значение характеристики */}
              <div style={{
                fontSize: 'clamp(10px, 2.5vw, 16px)', // Уменьшил размер текста
                color: '#ffd700',
                fontWeight: 'bold',
                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
                textAlign: 'center',
                lineHeight: 1.2 // Компактная высота строки
              }}>
      {stats ? (
                  typeof stats[key] === 'number' ? 
                    stats[key].toFixed(1).replace(/\.0$/, '') : 
                    stats[key]
                ) : (
                  '...'
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Нижний декоративный элемент */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(100, 120, 140, 0.4) 50%, transparent 100%)'
        }} />
      </div>

      {/* Панель с героями и скинами */}
      <div style={{
        width: '100%',
        background: 'linear-gradient(135deg, rgba(20, 25, 30, 0.95) 0%, rgba(35, 40, 45, 0.85) 50%, rgba(20, 25, 30, 0.95) 100%)',
        border: '2px solid rgba(100, 120, 140, 0.3)',
        borderRadius: '8px',
        padding: '16px 12px',
        margin: '5px 0 30px 0', // Увеличенный отступ снизу для футера
        boxShadow: `
          0 8px 32px rgba(0, 0, 0, 0.5),
          inset 0 1px 0 rgba(255, 255, 255, 0.1),
          inset 0 -1px 0 rgba(0, 0, 0, 0.3)
        `,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start', // Прижимаем к верхнему краю
        justifyContent: 'flex-start'
      }}>
        
        {/* Декоративные элементы */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(255, 215, 0, 0.6) 50%, transparent 100%)'
        }} />
        
        {/* Кнопки "Герои" и "Скины" */}
        <div style={{
          display: 'flex',
          gap: `${Math.min(8, Math.max(4, screenWidth * 0.01))}px`,
          width: '100%',
          padding: `0 clamp(30px, 6vw, 45px)`,
          boxSizing: 'border-box',
          justifyContent: 'space-between'
        }}>
          
                    {/* Кнопка "Герои" */}
          <button 
          onClick={() => setActiveTab('heroes')}
          style={{
            flex: 1, // Занимает 50% ширины
            height: 'auto', // Высота по содержимому
            background: 'linear-gradient(135deg, rgba(20, 25, 30, 0.95) 0%, rgba(35, 40, 45, 0.85) 50%, rgba(20, 25, 30, 0.95) 100%)',
            border: `2px solid ${activeTab === 'heroes' ? 'rgba(255, 215, 0, 0.8)' : 'rgba(255, 215, 0, 0.4)'}`,
            borderRadius: `clamp(6px, 1.5vw, 10px)`,
            padding: `clamp(6px, 1.5vw, 10px) clamp(8px, 2vw, 15px)`, // Адаптивные отступы
            boxShadow: `
              0 8px 32px rgba(0, 0, 0, 0.5),
              inset 0 1px 0 rgba(255, 255, 255, 0.1),
              inset 0 -1px 0 rgba(0, 0, 0, 0.3)
            `,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: `clamp(12px, 2.8vw, 20px)`,
            fontWeight: 'bold',
            color: '#c9aa71',
            textTransform: 'uppercase',
            letterSpacing: `clamp(0.5px, 0.2vw, 1.5px)`,
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.8)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = `
              0 12px 40px rgba(0, 0, 0, 0.6),
              0 0 20px rgba(255, 215, 0, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.1),
              inset 0 -1px 0 rgba(0, 0, 0, 0.3)
            `;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.4)';
            e.currentTarget.style.transform = 'translateY(0px)';
            e.currentTarget.style.boxShadow = `
              0 8px 32px rgba(0, 0, 0, 0.5),
              inset 0 1px 0 rgba(255, 255, 255, 0.1),
              inset 0 -1px 0 rgba(0, 0, 0, 0.3)
            `;
          }}
          >
            <i className="fas fa-user-ninja" style={{
               marginRight: `clamp(4px, 1vw, 8px)`,
               fontSize: `clamp(10px, 2.2vw, 18px)`
             }} />
            Герои
          </button>

          {/* Кнопка "Скины" */}
          <button 
          onClick={() => setActiveTab('skins')}
          style={{
            flex: 1, // Занимает 50% ширины
            height: 'auto', // Высота по содержимому
            background: 'linear-gradient(135deg, rgba(20, 25, 30, 0.95) 0%, rgba(35, 40, 45, 0.85) 50%, rgba(20, 25, 30, 0.95) 100%)',
            border: `2px solid ${activeTab === 'skins' ? 'rgba(255, 215, 0, 0.8)' : 'rgba(255, 215, 0, 0.4)'}`,
            borderRadius: `clamp(6px, 1.5vw, 10px)`,
            padding: `clamp(6px, 1.5vw, 10px) clamp(8px, 2.5vw, 15px)`, // Адаптивные отступы
            boxShadow: `
              0 8px 32px rgba(0, 0, 0, 0.5),
              inset 0 1px 0 rgba(255, 255, 255, 0.1),
              inset 0 -1px 0 rgba(0, 0, 0, 0.3)
            `,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: `clamp(12px, 2.8vw, 20px)`,
            fontWeight: 'bold',
            color: '#c9aa71',
            textTransform: 'uppercase',
            letterSpacing: `clamp(0.5px, 0.2vw, 1.5px)`,
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.8)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = `
              0 12px 40px rgba(0, 0, 0, 0.6),
              0 0 20px rgba(255, 215, 0, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.1),
              inset 0 -1px 0 rgba(0, 0, 0, 0.3)
            `;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.4)';
            e.currentTarget.style.transform = 'translateY(0px)';
            e.currentTarget.style.boxShadow = `
              0 8px 32px rgba(0, 0, 0, 0.5),
              inset 0 1px 0 rgba(255, 255, 255, 0.1),
              inset 0 -1px 0 rgba(0, 0, 0, 0.3)
            `;
          }}
          >
                         <i className="fas fa-palette" style={{
               marginRight: `clamp(4px, 1vw, 8px)`,
               fontSize: `clamp(10px, 2.2vw, 18px)`
             }} />
            Скины
          </button>
        </div>

        {/* Контент вкладок */}
        {activeTab === 'heroes' && (
          <>
            {/* Слайдер героев (скрываем на очень маленьких экранах) */}
            {screenWidth > 375 && (
              <div style={{
                width: '100%',
                maxWidth: '100%',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                padding: `clamp(10px, 2vw, 17px) clamp(30px, 6vw, 45px)`,
                boxSizing: 'border-box',
                overflow: 'hidden'
              }}>
                <button
                  onClick={prevHeroSlide}
                  disabled={currentHeroSlide === 0}
                  style={{
                    width: `clamp(24px, 4vw, 32px)`,
                    height: `clamp(24px, 4vw, 32px)`,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none', // Убираем рамку фокуса
                    cursor: currentHeroSlide === 0 ? 'not-allowed' : 'pointer',
                    opacity: currentHeroSlide === 0 ? 0.3 : 1,
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    position: 'absolute',
                    left: `clamp(3px, 1vw, 8px)`,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 10
                  }}
                  onMouseEnter={(e) => {
                    if (currentHeroSlide > 0) {
                      e.currentTarget.style.transform = 'translateY(-50%) scale(1.15)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentHeroSlide > 0) {
                      e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                    }
                  }}
                >
                  <i className="fas fa-chevron-left" style={{
                    color: '#ffd700',
                    fontSize: `clamp(16px, 3vw, 24px)`,
                    fontWeight: 'bold',
                    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)'
                  }} />
                </button>

                {/* Контейнер для героев */}
                <div 
                  style={{
                    width: '100%',
                    overflow: 'hidden',
                    padding: '2px', // Небольшой отступ для предотвращения обрезания рамок
                    touchAction: 'pan-y', // Разрешаем только вертикальную прокрутку страницы
                    userSelect: 'none', // Предотвращаем выделение текста при свайпах
                    WebkitUserSelect: 'none',
                    cursor: 'grab'
                  }}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseLeave}
                >
                  <div
                    style={{
                      display: 'flex',
                      gap: `${adaptiveGap}px`,
                      transform: `translateX(calc(-${currentHeroSlide * (100 / heroesPerSlide)}% + ${swipeOffset}px))`,
                      transition: isSwipping ? 'none' : 'transform 0.3s ease'
                    }}
                  >
                    {heroes.map((hero) => (
                      <div
                        key={hero.id}
                                                style={{
                          flex: `0 0 calc((100% - ${(heroesPerSlide - 1) * adaptiveGap}px - 4px) / ${heroesPerSlide})`, // Учитываем padding контейнера
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: `clamp(6px, 1.5vw, 10px)`,
                          cursor: isSwipping ? 'grabbing' : 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                        onClick={(e) => {
                          if (isSwipping) {
                            e.preventDefault();
                            e.stopPropagation();
                            return;
                          }
                          // Вызываем обработчик выбора героя
                          handleHeroSelect(hero.id);
                        }}
                        onMouseEnter={(e) => {
                          // Улучшаем эффект для карточки
                          const card = e.currentTarget.querySelector('div');
                          if (card) {
                            card.style.borderColor = 'rgba(255, 215, 0, 0.8)';
                            card.style.boxShadow = `
                              0 8px 25px rgba(0, 0, 0, 0.8),
                              0 0 20px rgba(255, 215, 0, 0.3),
                              inset 0 1px 0 rgba(255, 255, 255, 0.1),
                              inset 0 -1px 0 rgba(0, 0, 0, 0.3)
                            `;
                          }
                          // Улучшаем эффект для изображения
                          const img = e.currentTarget.querySelector('img');
                          if (img) {
                            img.style.transform = 'scale(1.05)';
                            img.style.filter = 'drop-shadow(2px 2px 8px rgba(0, 0, 0, 0.9)) brightness(1.1)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          // Возвращаем стили карточки
                          const card = e.currentTarget.querySelector('div');
                          if (card) {
                            card.style.borderColor = 'rgba(255, 215, 0, 0.3)';
                            card.style.boxShadow = `
                              0 6px 20px rgba(0, 0, 0, 0.6),
                              inset 0 1px 0 rgba(255, 255, 255, 0.1),
                              inset 0 -1px 0 rgba(0, 0, 0, 0.3)
                            `;
                          }
                          // Возвращаем стили изображения
                          const img = e.currentTarget.querySelector('img');
                          if (img) {
                            img.style.transform = 'scale(1)';
                            img.style.filter = 'drop-shadow(2px 2px 6px rgba(0, 0, 0, 0.8))';
                          }
                        }}
                        >
                        {/* Прямоугольник с изображением героя */}
                        <div style={{
                          width: '100%',
                          height: `clamp(80px, 15vw, 140px)`, // Адаптивная высота
                          background: 'linear-gradient(135deg, rgba(20, 25, 30, 0.95) 0%, rgba(35, 40, 45, 0.85) 50%, rgba(20, 25, 30, 0.95) 100%)',
                          border: '2px solid rgba(255, 215, 0, 0.3)',
                          borderRadius: `clamp(6px, 1.5vw, 10px)`,
                          boxShadow: `
                            0 6px 20px rgba(0, 0, 0, 0.6),
                            inset 0 1px 0 rgba(255, 255, 255, 0.1),
                            inset 0 -1px 0 rgba(0, 0, 0, 0.3)
                          `,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          position: 'relative',
                          transition: 'all 0.3s ease'
                        }}>
                          <img
                            src={hero.image}
                            alt={hero.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              filter: 'drop-shadow(2px 2px 6px rgba(0, 0, 0, 0.8))',
                              transition: 'all 0.3s ease'
                            }}
                          />
                        </div>
                        
                        {/* Название героя */}
                        <span style={{
                          fontSize: 'clamp(9px, 1.8vw, 14px)',
                          color: '#ffd700',
                          fontWeight: 'bold',
                          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.9)',
                          textAlign: 'center',
                          textTransform: 'uppercase',
                          letterSpacing: '0.8px',
                          lineHeight: 1.2,
                          maxWidth: '100%',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {hero.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Правая стрелка */}
                <button
                  onClick={nextHeroSlide}
                  disabled={currentHeroSlide >= maxSlides}
                  style={{
                    width: `clamp(24px, 4vw, 32px)`,
                    height: `clamp(24px, 4vw, 32px)`,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none', // Убираем рамку фокуса
                    cursor: currentHeroSlide >= maxSlides ? 'not-allowed' : 'pointer',
                    opacity: currentHeroSlide >= maxSlides ? 0.3 : 1,
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    position: 'absolute',
                    right: `clamp(3px, 1vw, 8px)`,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 10
                  }}
                  onMouseEnter={(e) => {
                    if (currentHeroSlide < maxSlides) {
                      e.currentTarget.style.transform = 'translateY(-50%) scale(1.15)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentHeroSlide < maxSlides) {
                      e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                    }
                  }}
                >
                  <i className="fas fa-chevron-right" style={{
                    color: '#ffd700',
                    fontSize: `clamp(16px, 3vw, 24px)`,
                    fontWeight: 'bold',
                    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)'
                  }} />
                </button>
              </div>
            )}

            {/* Текст "Показать всех героев" */}
            <div style={{
              width: '100%',
              padding: screenWidth <= 375 ? 
                `clamp(8px, 2vw, 15px) clamp(15px, 4vw, 25px)` : 
                `clamp(5px, 1vw, 8px) clamp(20px, 4vw, 30px)`,
              textAlign: 'center',
              boxSizing: 'border-box'
            }}>
              <span style={{
                fontSize: screenWidth <= 375 ? 
                  `clamp(14px, 4vw, 20px)` : 
                  `clamp(12px, 2.5vw, 16px)`,
                color: 'rgba(150, 150, 150, 0.8)',
                fontWeight: '500',
                letterSpacing: `clamp(0.5px, 0.15vw, 1.2px)`,
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'inline-block'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'rgba(200, 200, 200, 1)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'rgba(150, 150, 150, 0.8)';
                e.currentTarget.style.transform = 'translateY(0px)';
              }}
              onClick={() => {
                setIsHeroesModalOpen(true);
              }}
              >
                Показать всех героев ...
              </span>
            </div>
          </>
        )}

        {activeTab === 'skins' && (
          <div style={{
            width: '100%',
            padding: '20px',
            textAlign: 'center',
            color: 'rgba(201, 170, 113, 0.5)',
            fontSize: 'clamp(14px, 2.5vw, 18px)',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Скины - скоро будет добавлено
          </div>
        )}
        
        {/* Нижний декоративный элемент */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(100, 120, 140, 0.4) 50%, transparent 100%)'
        }} />
      </div>

      {/* Тултип для характеристик */}
      {tooltipMounted && selectedStat && (
        <div
          ref={tooltipRef}
          style={{
            position: 'fixed',
            left: `${selectedStat.position.x}px`,
            top: `${selectedStat.position.y}px`,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '6px',
            fontSize: '14px',
            whiteSpace: 'nowrap',
            zIndex: 1000,
            pointerEvents: 'none',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            textAlign: 'center',
            opacity: tooltipVisible ? 1 : 0,
            transition: 'opacity 0.2s ease-in-out, transform 0.2s ease-in-out',
            transform: `translate(-50%, -100%) scale(${tooltipVisible ? 1 : 0.9})`
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
              borderTop: '6px solid rgba(0, 0, 0, 0.5)',
            }}
          />
        </div>
      )}

      {/* Всплывающий блок с информацией о способности */}
      {abilityTooltipMounted && selectedAbility && (
        <div
          ref={abilityTooltipRef}
          style={{
            position: 'fixed',
            left: `${selectedAbility.position.x}px`,
            top: `${selectedAbility.position.y}px`,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: 'white',
            padding: `clamp(8px, 2.5vw, 16px)`,
            borderRadius: `clamp(6px, 1.5vw, 10px)`,
            fontSize: `clamp(10px, 2vw, 14px)`,
            minWidth: `clamp(160px, 40vw, 280px)`,
            maxWidth: `clamp(200px, 60vw, 320px)`,
            zIndex: 2000,
            pointerEvents: 'none',
            border: '2px solid rgba(255, 215, 0, 0.6)',
            boxShadow: `
              0 15px 50px rgba(0, 0, 0, 0.8),
              inset 0 1px 0 rgba(255, 255, 255, 0.1),
              inset 0 -1px 0 rgba(0, 0, 0, 0.3),
              0 0 30px rgba(255, 215, 0, 0.3)
            `,
            opacity: abilityTooltipVisible ? 1 : 0,
            transition: 'opacity 0.2s ease-in-out, transform 0.2s ease-in-out',
            transform: `translate(0, -50%) scale(${abilityTooltipVisible ? 1 : 0.9})`,
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)'
          }}
        >
          {/* Название способности */}
          <div style={{
            fontSize: `clamp(12px, 2.5vw, 16px)`,
            fontWeight: 'bold',
            color: '#ffd700',
            textAlign: 'center',
            marginBottom: `clamp(6px, 1.5vw, 10px)`,
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
            textTransform: 'uppercase',
            letterSpacing: `clamp(0.5px, 0.15vw, 0.8px)`
          }}>
            {selectedAbility.ability.name}
          </div>
          
          {/* Разделительная линия */}
          <div style={{
            width: '100%',
            height: '1px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(255, 215, 0, 0.8) 50%, transparent 100%)',
            marginBottom: `clamp(6px, 1.5vw, 10px)`
          }} />
          
          {/* Описание способности */}
          <div style={{
            color: '#e0e0e0',
            lineHeight: 1.3,
            textAlign: 'center',
            fontSize: `clamp(9px, 1.8vw, 12px)`
          }}>
            {selectedAbility.ability.description}
          </div>
          
          {/* Индикатор типа способности */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: `clamp(6px, 1.5vw, 10px)`,
            gap: `clamp(3px, 0.8vw, 5px)`
          }}>
            <div style={{
              padding: `clamp(2px, 0.4vw, 3px) clamp(4px, 1vw, 8px)`,
              backgroundColor: selectedAbility.ability.type === 'passive' ? 'rgba(100, 200, 100, 0.2)' : 'rgba(200, 100, 100, 0.2)',
              border: `1px solid ${selectedAbility.ability.type === 'passive' ? 'rgba(100, 200, 100, 0.6)' : 'rgba(200, 100, 100, 0.6)'}`,
              borderRadius: `clamp(2px, 0.5vw, 4px)`,
              fontSize: `clamp(8px, 1.5vw, 11px)`,
              color: selectedAbility.ability.type === 'passive' ? '#90ff90' : '#ff9090',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.3px'
            }}>
              {selectedAbility.ability.type === 'passive' ? 'Пассивная' : 'Активная'}
            </div>
          </div>
          
          {/* Стрелочка, указывающая на иконку */}
          <div
            style={{
              position: 'absolute',
              left: '-8px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '0',
              height: '0',
              borderTop: '8px solid transparent',
              borderBottom: '8px solid transparent',
              borderRight: '8px solid rgba(0, 0, 0, 0.75)',
            }}
          />
        </div>
      )}

      {/* Модальное окно героев */}
      <HeroesModal 
        isVisible={isHeroesModalOpen}
        onClose={() => setIsHeroesModalOpen(false)}
      />

      {/* Модальное окно заданий */}
      <QuestsModal
        isVisible={isQuestsModalOpen}
        onClose={() => setIsQuestsModalOpen(false)}
        userId={TEST_USER_ID}
      />
      
    </div>
  );
}