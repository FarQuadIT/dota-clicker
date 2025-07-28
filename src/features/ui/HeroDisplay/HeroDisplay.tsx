import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { Application, extend, useTick } from '@pixi/react';
import { Assets, Texture, Rectangle, AnimatedSprite, Container } from 'pixi.js';

// Регистрируем Pixi.js компоненты для использования в JSX
extend({ AnimatedSprite, Container });

interface HeroDisplayProps {
  /** Ширина канваса */
  width?: number;
  /** Высота канваса */
  height?: number;
  /** Масштаб героя */
  scale?: number;
  /** Тип героя для отображения */
  heroType?: string;
}

// Типы для качества текстур
type QualityLevel = 'md' | 'hd';
type DevicePower = 'weak' | 'medium' | 'strong';
type DeviceType = 'smartphone' | 'tablet' | 'desktop';

// Конфигурация спрайтлистов для главной страницы
const heroSpritesheets = {
  centaur: {
    front_hd: {
      path: '/media/game/assets/heroes/centaur/centaur_front/centaur_front_hd.webp',
      frameWidth: 1024,
      frameHeight: 1024,
      framesX: 7,
      framesY: 7,
      totalFrames: 47
    },
    front_md: {
      path: '/media/game/assets/heroes/centaur/centaur_front/centaur_front_md.webp',
      frameWidth: 512,
      frameHeight: 512,
      framesX: 7,
      framesY: 7,
      totalFrames: 47
    }
  },
  juggernaut: {
    front_hd: {
      path: '/media/game/assets/heroes/juggernaut/juggernaut_front/juggernaut_front_hd.webp',
      frameWidth: 1024,
      frameHeight: 1024,
      framesX: 8,
      framesY: 8,
      totalFrames: 60
    },
    front_md: {
      path: '/media/game/assets/heroes/juggernaut/juggernaut_front/juggernaut_front_md.webp',
      frameWidth: 512,
      frameHeight: 512,
      framesX: 8,
      framesY: 8,
      totalFrames: 60
    }
  }
};

/**
 * Система выбора качества текстур для главной страницы
 * Адаптирована из AssetsManager игры
 */
class QualitySelector {
  /**
   * Определение типа устройства
   */
  private detectDeviceType(): DeviceType {
    try {
      const smallestDimension = Math.min(window.screen.width, window.screen.height);
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      
      if (isMobile) {
        if (smallestDimension >= 500) {
          return 'tablet';
        } else {
          return 'smartphone';
        }
      }
      
      if (smallestDimension < 500) {
        return 'smartphone';
      }
      
      if (smallestDimension >= 500 && smallestDimension < 900) {
        return 'tablet';
      }
      
      return 'desktop';
    } catch (error) {
      console.error('Ошибка определения типа устройства:', error);
      return 'desktop';
    }
  }

  /**
   * Определение мощности устройства
   */
  private detectDevicePower(): DevicePower {
    try {
      const memory = (navigator as any).deviceMemory || 4;
      const cores = navigator.hardwareConcurrency || 4;
      const connection = (navigator as any).connection;
      const pixelRatio = window.devicePixelRatio || 1;
      
      let powerScore = 0;
      
      // Оценка по памяти
      if (memory >= 8) powerScore += 3;
      else if (memory >= 4) powerScore += 2;
      else powerScore += 1;
      
      // Оценка по ядрам
      if (cores >= 8) powerScore += 3;
      else if (cores >= 4) powerScore += 2;
      else powerScore += 1;
      
      // Оценка по пиксельной плотности
      if (pixelRatio >= 2) powerScore += 1;
      
      // Оценка по типу соединения
      if (connection) {
        const effectiveType = connection.effectiveType;
        if (effectiveType === '4g') powerScore += 2;
        else if (effectiveType === '3g') powerScore += 1;
      }
      
      // Классификация
      if (powerScore >= 7) return 'strong';
      else if (powerScore >= 4) return 'medium';
      else return 'weak';
      
    } catch (error) {
      console.error('Ошибка определения мощности устройства:', error);
      return 'medium';
    }
  }

  /**
   * Проверка поддержки iOS
   */
  private isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.userAgent.includes('Macintosh') && 'ontouchend' in document);
  }

  /**
   * Выбор качества текстур
   */
  public selectQualityLevel(): QualityLevel {
    const deviceType = this.detectDeviceType();
    const devicePower = this.detectDevicePower();
    
    console.log(`🎮 Выбор качества для главной страницы (HD/MD только):`);
    console.log(`📱 Тип устройства: ${deviceType}`);
    console.log(`⚡ Мощность: ${devicePower}`);
    
    // Получаем максимальный размер текстуры
    let maxTextureSize = 4096;
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') as WebGLRenderingContext;
      if (gl) {
        maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
      }
    } catch (error) {
      console.warn('⚠️ Не удалось определить max texture size');
    }

    // Максимальные размеры спрайтлистов кентавра
    const maxSpritesheetSizes = {
      hd: 7 * 1024, // 7168px (7x7 кадров по 1024px)
      md: 7 * 512   // 3584px (7x7 кадров по 512px) 
    };

    const canSupportQuality = (quality: QualityLevel): boolean => {
      return maxSpritesheetSizes[quality] <= maxTextureSize;
    };

    let desiredQuality: QualityLevel;
    let qualityReason: string;

    switch (deviceType) {
      case 'desktop':
        if (devicePower === 'strong' && canSupportQuality('hd')) {
          desiredQuality = 'hd';
          qualityReason = 'ПК + мощный GPU → HD качество';
        } else {
          desiredQuality = 'md';
          qualityReason = 'ПК + средний/слабый GPU → MD качество';
        }
        break;

      case 'tablet':
        desiredQuality = 'md';
        qualityReason = 'Планшет → MD качество для оптимальной производительности';
        break;

      case 'smartphone':
        desiredQuality = 'md';
        qualityReason = 'Смартфон → MD качество для баланса качества и производительности';
        break;

      default:
        desiredQuality = 'md';
        qualityReason = 'Неизвестное устройство → MD качество по умолчанию';
    }

    // Проверяем ограничения iOS
    if (this.isIOS() && desiredQuality === 'hd') {
      console.log('📱 iOS устройство - ограничиваем HD до MD');
      desiredQuality = 'md';
      qualityReason += ' → снижено до MD (iOS ограничение)';
    }

    // Применяем ограничение по размеру текстуры
    if (!canSupportQuality(desiredQuality)) {
      const fallbackQuality: QualityLevel = 'md'; // Всегда фоллбек на MD
      console.log(`⚠️ Снижаем качество с ${desiredQuality} до ${fallbackQuality} из-за ограничения GPU`);
      desiredQuality = fallbackQuality;
      qualityReason += ` → снижено до ${desiredQuality} (GPU лимит: ${maxTextureSize}px)`;
    }

    console.log(`✅ Выбрано качество: ${desiredQuality}`);
    console.log(`📝 ${qualityReason}`);

    return desiredQuality;
  }
}

/**
 * Внутренний компонент с анимированным кентавром
 * Должен быть внутри <Application>
 */
const AnimatedHero: React.FC<{ 
  scale: number; 
  width: number; 
  height: number;
  heroType: string;
  onQualitySelected: (quality: QualityLevel) => void;
}> = ({ 
  scale, 
  width, 
  height,
  heroType,
  onQualitySelected
}) => {
  const [textures, setTextures] = useState<Texture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<QualityLevel>('md');
  const spriteRef = useRef<AnimatedSprite>(null);
  
  // Отслеживаем загруженную текстуру для корректной выгрузки (используем ref для надежности)
  const currentSpritesheetPathRef = useRef<string | null>(null);

  // Функция очистки ресурсов
  const cleanupResources = async (pathToUnload?: string) => {
    const spritesheetPath = pathToUnload || currentSpritesheetPathRef.current;
    
    if (spritesheetPath) {
      try {
        console.log(`🗑️ Выгружаем спрайтлист: ${spritesheetPath}`);
        await Assets.unload(spritesheetPath);
        console.log(`✅ Спрайтлист ${spritesheetPath} выгружен из памяти`);
      } catch (error) {
        console.warn(`⚠️ Ошибка при выгрузке спрайтлиста ${spritesheetPath}:`, error);
      }
    }
    
    // Очищаем локальные текстуры
    setTextures([]);
    currentSpritesheetPathRef.current = null;
  };

  useEffect(() => {
    const loadAnimation = async () => {
      try {
        // Сбрасываем состояние при загрузке нового героя
        setIsLoading(true);
        setError(null);
        
        // Очищаем предыдущие ресурсы перед загрузкой новых
        await cleanupResources();
        
        // Выбираем качество текстур
        const qualitySelector = new QualitySelector();
        const quality = qualitySelector.selectQualityLevel();
        setSelectedQuality(quality);
        onQualitySelected(quality);

        // Получаем конфигурацию спрайтлиста для текущего героя
        const heroConfig = heroSpritesheets[heroType as keyof typeof heroSpritesheets];
        if (!heroConfig) {
          throw new Error(`Конфигурация героя ${heroType} не найдена`);
        }
        
        const config = heroConfig[`front_${quality}`];
        
        console.log(`🎮 Загрузка ${heroType} качества ${quality}:`, config.path);
        
        const spritesheetTexture = await Assets.load(config.path);
        console.log(`✅ Спрайтлист ${heroType} загружен:`, spritesheetTexture);
        
        // Сохраняем путь для последующей выгрузки
        currentSpritesheetPathRef.current = config.path;

        // Создаем кадры анимации
        const frames: Texture[] = [];
        
        for (let i = 0; i < config.totalFrames; i++) {
          const row = Math.floor(i / config.framesX);
          const col = i % config.framesX;
          
          const x = col * config.frameWidth;
          const y = row * config.frameHeight;

          const frameTexture = new Texture({
            source: spritesheetTexture.source,
            frame: new Rectangle(x, y, config.frameWidth, config.frameHeight)
          });
          frames.push(frameTexture);
        }

        console.log(`📦 Создано кадров ${heroType}: ${frames.length}`);
        console.log(`🎯 Качество: ${quality}, размер кадра: ${config.frameWidth}x${config.frameHeight}px`);
        setTextures(frames);
        setIsLoading(false);

      } catch (err) {
        console.error(`❌ Ошибка загрузки анимации ${heroType}:`, err);
        setError(`Не удалось загрузить анимацию ${heroType}`);
        setIsLoading(false);
      }
    };

    loadAnimation();
  }, [heroType, onQualitySelected]);

  // Очистка ресурсов при размонтировании компонента
  useEffect(() => {
    return () => {
      console.log(`🧹 Очистка ресурсов компонента AnimatedHero для ${heroType}`);
      cleanupResources();
    };
  }, []);

  // Запускаем анимацию после создания спрайта
  useEffect(() => {
    if (spriteRef.current && textures.length > 0) {
      console.log('Настройка анимации кентавра...');
      spriteRef.current.animationSpeed = 0.45; // Плавная анимация
      spriteRef.current.loop = true;
      spriteRef.current.play();
      console.log('Анимация кентавра запущена!');
    }
  }, [textures]);

  // Вычисляем компенсационный масштаб для разных качеств
  const qualityScaleMultiplier = useMemo(() => {
    let multiplier: number;
    switch (selectedQuality) {
      case 'hd': multiplier = 0.5; break;   // 1024px - немного уменьшаем
      case 'md': multiplier = 1.0; break;   // 512px - увеличиваем для четкости
      default: multiplier = 1.0; break;     // По умолчанию как MD
    }
    console.log(`📏 Компенсационный масштаб для ${selectedQuality}: x${multiplier}`);
    return multiplier;
  }, [selectedQuality]);

  // Мемоизируем настройки спрайта
  const spriteProps = useMemo(() => ({
    ref: spriteRef,
    textures,
    anchor: { x: 0.46, y: 0.45}, // Центрирование кентавра
    x: width / 2,
    y: height / 2,
    scale: { 
      x: scale * qualityScaleMultiplier, 
      y: scale * qualityScaleMultiplier 
    },
    animationSpeed: 0.5,
    loop: true,
    autoPlay: true
  }), [textures, width, height, scale, qualityScaleMultiplier]);

  if (isLoading) {
    return null; // Пустой контейнер во время загрузки
  }

  if (error || textures.length === 0) {
    return null; // Пустой контейнер при ошибке
  }

  return (
    <pixiAnimatedSprite {...spriteProps} />
  );
};

/**
 * Компонент для отображения анимированного кентавра с адаптивным качеством
 * Используется на главной странице
 */
const HeroDisplay: React.FC<HeroDisplayProps> = ({
  width = 300,
  height = 300,
  scale = 0.4,
  heroType = 'centaur'
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuality, setCurrentQuality] = useState<QualityLevel>('md');
  
  // Вычисляем правильное разрешение для четкости на мобильных
  const pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const resolution = Math.min(pixelRatio, 3); // Ограничиваем до 3 для производительности

  // Имитируем небольшую задержку для показа состояния загрузки
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (error) {
    return (
      <div style={{
        width,
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ff6b6b',
        fontSize: '14px',
        textAlign: 'center',
      }}>
        {error}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{
        width,
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Анимированный спиннер */}
        <div style={{
          width: '60px',
          height: '60px',
          border: '4px solid rgba(255, 215, 0, 0.2)',
          borderTop: '4px solid #ffd700',
          borderRadius: '50%',
          animation: 'heroSpinnerRotate 1s linear infinite'
        }} />
        
        {/* CSS анимация */}
        <style>{`
          @keyframes heroSpinnerRotate {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      width,
      height,
      position: 'relative',
      overflow: 'hidden',
      // Улучшаем четкость рендеринга на мобильных
      imageRendering: 'crisp-edges',
      WebkitBackfaceVisibility: 'hidden',
      backfaceVisibility: 'hidden',
      transform: 'translateZ(0)' // Включаем аппаратное ускорение
    }}>
      <Application
        width={width}
        height={height}
        backgroundAlpha={0}
        antialias={true}
        autoDensity={true}
        resolution={resolution}
        resizeTo={undefined}
      >
        <AnimatedHero 
          key={heroType}
          scale={scale} 
          width={width} 
          height={height} 
          heroType={heroType}
          onQualitySelected={setCurrentQuality}
        />
      </Application>
      
      {/* Надпись с качеством */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: '#ffd700',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        zIndex: 10
      }}>
        {currentQuality} {pixelRatio > 1 && `@${resolution.toFixed(1)}x`}
      </div>
    </div>
  );
};

export default HeroDisplay; 