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
}

/**
 * Внутренний компонент с анимированным героем
 * Должен быть внутри <Application>
 */
const AnimatedHero: React.FC<{ scale: number; width: number; height: number }> = ({ 
  scale, 
  width, 
  height 
}) => {
  const [textures, setTextures] = useState<Texture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const spriteRef = useRef<AnimatedSprite>(null);

  useEffect(() => {
    const loadAnimation = async () => {
      try {
        console.log('Загрузка спрайтшита героя...');
        const idleTexture = await Assets.load('/media/main/heroes/mainpagejug.webp');
        console.log('Спрайтшит загружен:', idleTexture);

        // Создаем кадры анимации для mainpagejug
        const frames: Texture[] = [];
        const frameWidth = 1024; // 11264 / 11 столбцов
        const frameHeight = 1024; // 10240 / 10 строк
        const totalFrames = 104; // Общее количество кадров
        const framesPerRow = 11; // Количество столбцов

        for (let i = 0; i < totalFrames; i++) {
          const row = Math.floor(i / framesPerRow);
          const col = i % framesPerRow;
          
          const x = col * frameWidth;
          const y = row * frameHeight;

          const frameTexture = new Texture({
            source: idleTexture.source,
            frame: new Rectangle(x, y, frameWidth, frameHeight)
          });
          frames.push(frameTexture);
        }

        console.log(`Создано кадров: ${frames.length}`);
        setTextures(frames);
        setIsLoading(false);

      } catch (err) {
        console.error('Ошибка загрузки анимации:', err);
        setError('Не удалось загрузить анимацию героя');
        setIsLoading(false);
      }
    };

    loadAnimation();
  }, []);

  // Запускаем анимацию после создания спрайта
  useEffect(() => {
    if (spriteRef.current && textures.length > 0) {
      console.log('Настройка анимации героя...');
      spriteRef.current.animationSpeed = 0.6; // Уменьшаем скорость для плавной анимации с 104 кадрами
      spriteRef.current.loop = true;
      spriteRef.current.play();
      console.log('Анимация запущена!');
    }
  }, [textures]);

  // Мемоизируем настройки спрайта
  const spriteProps = useMemo(() => ({
    ref: spriteRef,
    textures, // Обязательный проп для pixiAnimatedSprite
    anchor: { x: 0.5, y: 0.65}, // Слегка сдвигаем вверх для лучшего центрирования
    x: width / 2,
    y: height / 2,
    scale: { x: scale, y: scale },
    animationSpeed: 0.15,
    loop: true,
    autoPlay: true
  }), [textures, width, height, scale]);

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
 * Упрощенный компонент для отображения анимированного героя
 * Используется на главной странице для показа анимации idle
 */
const HeroDisplay: React.FC<HeroDisplayProps> = ({
  width = 300,
  height = 300,
  scale = 0.4
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      overflow: 'hidden'
    }}>
      <Application
        width={width}
        height={height}
        backgroundAlpha={0}
        antialias={true}
        autoDensity={true}
        resizeTo={undefined}
      >
        <AnimatedHero scale={scale} width={width} height={height} />
      </Application>
    </div>
  );
};

export default HeroDisplay; 