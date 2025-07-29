// src/pages/GamePage/GamePage.tsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Application, Graphics, TilingSprite } from 'pixi.js';
import { assetsManager, type LoadingProgress } from '../../game/managers/AssetsManager';
import { GAME_CONFIG } from '../../game/config/GameConfig';
import { useGame } from '../../contexts/GameContext';
import { useHeroStore } from '../../contexts/heroStore';
import GameOverModal from '../../features/ui/GameOverModal';
import { heroLevelSystem } from '../../game/systems/HeroLevelSystem';
import { audioManager } from '../../game/managers/SoundManager';
// 🔥 НОВЫЕ ИМПОРТЫ: Добавляем импорты для Hero и GameController
import { Hero } from '../../game/entities/Hero';
import { GameController } from '../../game/core/GameController';
import { TEST_HERO_ID } from '../../shared/constants';
import { mapNumericIdToHeroName } from '../../game/config/heroConfig';

/**
 * Компонент диагностики устройства
 */
const DeviceDiagnostic = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [diagnosticData, setDiagnosticData] = useState<any>(null);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  // Функция определения мощности устройства
  const detectDeviceCapability = () => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') as WebGLRenderingContext || 
                  canvas.getContext('experimental-webgl') as WebGLRenderingContext;
      
      if (!gl) {
        return {
          webglSupport: false,
          maxTextureSize: 'Не поддерживается',
          devicePower: 'weak',
          selectedQuality: 'md',
          recommendation: 'Используйте другой браузер',
          screenAnalysis: 'WebGL не поддерживается'
        };
      }

      const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
      const maxCombinedTextures = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
      const vendor = gl.getParameter(gl.VENDOR);
      const rendererInfo = gl.getParameter(gl.RENDERER);
      

      
      // Предупреждение если размер текстуры мал
      if (maxTextureSize < 4096) {
        console.warn('⚠️ ПРЕДУПРЕЖДЕНИЕ: Размер текстуры ограничен! Некоторые спрайтшиты могут не загрузиться.');
        console.warn(`   Максимальный размер: ${maxTextureSize}x${maxTextureSize}`);
        console.warn('   Спрайтшиты крипов (8192x7168) превышают этот лимит!');
      }

      // Определение мощности устройства по GPU
      let devicePower: 'weak' | 'medium' | 'strong' = 'weak';
      
      if (maxTextureSize >= 8192 && maxCombinedTextures >= 16) {
        devicePower = 'strong';
      } else if (maxTextureSize >= 4096 && maxCombinedTextures >= 8) {
        devicePower = 'medium';
      } else {
        devicePower = 'weak';
      }

      // НОВАЯ ЛОГИКА: Определение качества с учетом размера экрана и DPI
      const screenWidth = window.screen.width;
      const screenHeight = window.screen.height;
      const pixelRatio = window.devicePixelRatio || 1;
      const actualWidth = window.innerWidth;
      const actualHeight = window.innerHeight;
      
      // Определяем тип экрана по физическому размеру
      const screenArea = screenWidth * screenHeight;
      const isSmallScreen = screenArea < 1000000; // < ~1000x1000 (мобильные)
      const isMediumScreen = screenArea < 2000000; // < ~1414x1414 (планшеты)
      const isLargeScreen = screenArea >= 2000000; // >= ~1414x1414 (десктопы)
      
      // Определяем минимальный размер спрайта на экране
      const minSpriteSize = 120;
      const spriteScreenRatio = 0.15; // Спрайт занимает ~15% от ширины экрана
      const expectedSpriteSize = actualWidth * spriteScreenRatio * pixelRatio;
      
      // Максимальные размеры наших спрайт-листов для каждого качества
      const maxSpritesheetSizes = {
        hd: Math.max(7168, 6144, 5120), // Максимальный размер HD спрайт-листов (7168×6144 direCreep idle)
        md: Math.max(3584, 3072, 2560), // Максимальный размер MD спрайт-листов (7×6×512 = 3584×3072)
        ld: Math.max(1792, 1536, 1280)  // Максимальный размер LD спрайт-листов (7×6×256 = 1792×1536)
      };
      
      // Функция проверки поддержки качества по размеру текстуры
      const canSupportQuality = (quality: 'ld' | 'md' | 'hd'): boolean => {
        return maxSpritesheetSizes[quality] <= maxTextureSize;
      };
      
      // Определяем максимально доступное качество по размеру текстуры
      let maxSupportedQuality: 'ld' | 'md' | 'hd' = 'ld';
      if (canSupportQuality('hd')) {
        maxSupportedQuality = 'hd';
      } else if (canSupportQuality('md')) {
        maxSupportedQuality = 'md';
      } else {
        maxSupportedQuality = 'ld';
      }
      
      let selectedQuality: 'ld' | 'md' | 'hd' = 'md';
      let qualityReason = '';
      
      // Логика выбора качества с приоритетом визуального качества на маленьких экранах
      if (isSmallScreen) {
        // Маленькие экраны (мобильные): приоритет качеству, иначе спрайты будут крошечными
        if (expectedSpriteSize < minSpriteSize || pixelRatio >= 2) {
          selectedQuality = 'hd';
          qualityReason = 'Маленький экран + высокий DPI → желаем HD для четкости';
        } else if (devicePower === 'weak') {
          selectedQuality = 'md';
          qualityReason = 'Маленький экран + слабый GPU → желаем MD компромисс';
        } else {
          selectedQuality = 'hd';
          qualityReason = 'Маленький экран + хороший GPU → желаем HD для четкости';
        }
      } else if (isMediumScreen) {
        // Средние экраны (планшеты): баланс производительности и качества
        if (devicePower === 'weak') {
          selectedQuality = 'md';
          qualityReason = 'Средний экран + слабый GPU → желаем MD';
        } else {
          selectedQuality = 'hd';
          qualityReason = 'Средний экран + хороший GPU → желаем HD';
        }
      } else {
        // Большие экраны (десктопы): качество по мощности GPU
        if (devicePower === 'weak') {
          selectedQuality = 'md';
          qualityReason = 'Большой экран + слабый GPU → желаем MD';
        } else {
          selectedQuality = 'hd';
          qualityReason = 'Большой экран + хороший GPU → желаем HD';
        }
      }
      
      // Применяем ограничение по максимальному размеру текстуры
      const desiredQuality = selectedQuality;
      const finalQuality = canSupportQuality(selectedQuality) ? selectedQuality : maxSupportedQuality;
      const wasDowngraded = finalQuality !== desiredQuality;
      
      if (wasDowngraded) {
        qualityReason += ` → снижено до ${finalQuality.toUpperCase()} (GPU лимит: ${maxTextureSize}px)`;
      }
      
      selectedQuality = finalQuality;

      // Генерируем рекомендацию
      const recommendation = selectedQuality === 'hd' ? 'Используются кадры 1024×1024' :
                           selectedQuality === 'md' ? 'Используются кадры 512×512' :
                           'Используются кадры 256×256';

      // Дополнительная информация об устройстве
      const userAgent = navigator.userAgent;
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const cores = navigator.hardwareConcurrency || 'Неизвестно';
      const memory = (navigator as any).deviceMemory || 'Неизвестно';
      const screenRes = `${screenWidth}×${screenHeight}`;

      // Анализ экрана для диагностики
      const screenAnalysis = {
        type: isSmallScreen ? '📱 Маленький (мобильный)' : 
              isMediumScreen ? '📱 Средний (планшет)' : 
              '🖥️ Большой (десктоп)',
        area: Math.round(screenArea / 1000000 * 10) / 10,
        pixelRatio,
        expectedSpriteSize: Math.round(expectedSpriteSize),
        reason: qualityReason
      };
      
      // Анализ текстур для диагностики
      const textureAnalysis = {
        maxTextureSize,
        maxSpritesheetSizes,
        maxSupportedQuality,
        desiredQuality,
        finalQuality: selectedQuality,
        wasDowngraded,
        supportedQualities: {
          hd: canSupportQuality('hd'),
          md: canSupportQuality('md'),
          ld: canSupportQuality('ld')
        }
      };

      return {
        webglSupport: true,
        maxTextureSize,
        maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS) as number,
        maxRenderbufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) as number,
        maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS) as Int32Array,
        devicePower,
        selectedQuality,
        recommendation,
        isMobile,
        cores,
        memory,
        screenRes,
        screenAnalysis,
        userAgent: userAgent.slice(0, 100) + (userAgent.length > 100 ? '...' : ''),
        textureAnalysis: textureAnalysis
      };
    } catch (error: any) {
      return {
        webglSupport: false,
        error: error?.message || 'Неизвестная ошибка',
        devicePower: 'unknown',
        selectedQuality: 'md',
        recommendation: 'Ошибка определения',
        screenAnalysis: 'Ошибка анализа экрана'
      };
    }
  };

  // Загружаем данные при первом открытии
  useEffect(() => {
    if (isVisible && !diagnosticData) {
      setDiagnosticData(detectDeviceCapability());
    }
  }, [isVisible, diagnosticData]);

  // Отслеживаем изменения размера окна для адаптивности
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Определение размера устройства для адаптивных стилей
  const isMobile = windowSize.width <= 768;
  const isTablet = windowSize.width > 768 && windowSize.width <= 1024;
  const isDesktop = windowSize.width > 1024;

  // Анализ текущих спрайт листов
  const analyzeCurrentSprites = () => {
    if (!diagnosticData?.maxTextureSize) return [];

    const sprites = [
      // ГЕРОИ
      { name: 'Джаггернаут idle', size: '3072×3072', frames: '6×6×512px', adaptive: false },
      { name: 'Джаггернаут attack', size: '3072×2560', frames: '6×5×512px', adaptive: false },
      { name: 'Кентавр (адаптивный)', size: 'авто', frames: 'авто', adaptive: true, category: 'hero' },
      
      // КРИПЫ
      { name: 'DireCreep (адаптивный)', size: 'авто', frames: 'авто', adaptive: true, category: 'creep' },
      { name: 'Сатир idle', size: '3584×3072', frames: '7×6×512px', adaptive: false },
      { name: 'Wolf idle', size: '5120×5120', frames: '5×5×1024px', adaptive: false },
      { name: 'Medved idle', size: '6144×5120', frames: '6×5×1024px', adaptive: false },
      { name: 'Voul idle', size: '5120×7168', frames: '5×7×1024px', adaptive: false },
      { name: 'Shishka idle', size: '5120×6144', frames: '5×6×1024px', adaptive: false }
    ];

    return sprites.map(sprite => {
      if (sprite.adaptive) {
        // Для адаптивных спрайт листов показываем выбранное качество
        let qualityInfo;
        
        if (sprite.category === 'hero') {
          // Кентавр: 7×6 idle, 7×6 run, 5×4 attack 
          qualityInfo = diagnosticData.selectedQuality === 'hd' ? 
            { size: '7168×6144', frames: '7×6×1024px', quality: 'HD' } :
            diagnosticData.selectedQuality === 'md' ?
            { size: '3584×3072', frames: '7×6×512px', quality: 'MD' } :
            { size: '1792×1536', frames: '7×6×256px', quality: 'LD' };
        } else if (sprite.category === 'creep') {
          // DireCreep: 7×6 idle, 5×5 attack, 6×5 death
          qualityInfo = diagnosticData.selectedQuality === 'hd' ? 
            { size: '7168×6144', frames: '7×6×1024px', quality: 'HD' } :
            diagnosticData.selectedQuality === 'md' ?
            { size: '3584×3072', frames: '7×6×512px', quality: 'MD' } :
            { size: '1792×1536', frames: '7×6×256px', quality: 'LD' };
        } else {
          // Общий случай
          qualityInfo = diagnosticData.selectedQuality === 'hd' ? 
            { size: '5120×4096', frames: '7×7×1024px', quality: 'HD' } :
            diagnosticData.selectedQuality === 'md' ?
            { size: '3584×3584', frames: '7×7×512px', quality: 'MD' } :
            { size: '1792×1792', frames: '7×7×256px', quality: 'LD' };
        }
        
        return {
          ...sprite,
          size: qualityInfo.size,
          frames: qualityInfo.frames,
          isSupported: true,
          status: `✅ ${qualityInfo.quality}`
        };
      } else {
        const [width, height] = sprite.size.split('×').map(Number);
        const maxDimension = Math.max(width, height);
        const isSupported = maxDimension <= diagnosticData.maxTextureSize;
        
        return {
          ...sprite,
          isSupported,
          status: isSupported ? '✅' : '❌'
        };
      }
    });
  };

  return (
    <>
             {/* Кнопка диагностики */}
       <button
         onClick={() => setIsVisible(!isVisible)}
         style={{
           position: 'fixed',
           top: isMobile ? '45px' : '50px',
           right: isMobile ? '5px' : '10px',
           zIndex: 1001,
           background: isVisible ? '#ff6b6b' : '#4CAF50',
           color: 'white',
           border: 'none',
           borderRadius: '50%',
           width: isMobile ? '45px' : '50px',
           height: isMobile ? '45px' : '50px',
           fontSize: isMobile ? '16px' : '18px',
           cursor: 'pointer',
           boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
           transition: 'all 0.3s ease'
         }}
         title="Диагностика устройства"
       >
         {isVisible ? '✕' : '🔍'}
       </button>

             {/* Окно диагностики */}
       {isVisible && (
         <div style={{
           position: 'fixed',
           top: isMobile ? '95px' : '100px',
           right: isMobile ? '5px' : '10px',
           left: isMobile ? '5px' : 'auto',
           width: isMobile ? 'auto' : isTablet ? '350px' : '400px',
           maxWidth: isMobile ? 'calc(100vw - 10px)' : isTablet ? '350px' : '400px',
           maxHeight: isMobile ? '80vh' : '75vh',
           background: 'rgba(0, 0, 0, 0.95)',
           color: 'white',
           borderRadius: isMobile ? '8px' : '10px',
           padding: isMobile ? '12px' : '20px',
           zIndex: 1000,
           fontSize: isMobile ? '10px' : isTablet ? '11px' : '12px',
           fontFamily: 'monospace',
           boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
           overflow: 'auto',
           border: '1px solid #333'
         }}>
                     <h3 style={{ 
             margin: '0 0 15px 0', 
             color: '#4CAF50', 
             fontSize: isMobile ? '14px' : '16px',
             textAlign: 'center'
           }}>
             📱 Диагностика устройства
           </h3>

          {diagnosticData ? (
            <div>
              {/* Основная информация */}
              <div style={{ marginBottom: '15px', padding: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '5px' }}>
                                 <h4 style={{ 
                   margin: '0 0 10px 0', 
                   color: '#FFD700',
                   fontSize: isMobile ? '12px' : '14px'
                 }}>🎮 GPU Характеристики:</h4>
                <p><strong>WebGL поддержка:</strong> {diagnosticData.webglSupport ? '✅ Да' : '❌ Нет'}</p>
                                 <p><strong>Макс. размер текстуры:</strong> <span style={{ 
                   color: '#4CAF50', 
                   fontSize: isMobile ? '12px' : '14px',
                   fontWeight: 'bold'
                 }}>{diagnosticData.maxTextureSize}×{diagnosticData.maxTextureSize}</span></p>
                <p><strong>Макс. вершинные атрибуты:</strong> {diagnosticData.maxVertexAttribs}</p>
                <p><strong>Макс. размер буфера:</strong> {diagnosticData.maxRenderbufferSize}×{diagnosticData.maxRenderbufferSize}</p>
                <p><strong>Макс. viewport:</strong> {diagnosticData.maxViewportDims ? `${diagnosticData.maxViewportDims[0]}×${diagnosticData.maxViewportDims[1]}` : 'Неизвестно'}</p>
                
                {/* Информация об адаптивном качестве */}
                <div style={{ 
                  marginTop: '10px', 
                  padding: '8px', 
                  background: 'rgba(76, 175, 80, 0.2)', 
                  borderRadius: '5px',
                  border: '1px solid #4CAF50'
                }}>
                  <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#4CAF50' }}>🎨 Выбранное качество:</p>
                  <p style={{ margin: '0', fontSize: isMobile ? '10px' : '11px' }}>
                    <strong>{diagnosticData.selectedQuality?.toUpperCase() || 'MD'}:</strong> {
                      diagnosticData.selectedQuality === 'hd' ? 'Высокое (1024×1024)' :
                      diagnosticData.selectedQuality === 'md' ? 'Среднее (512×512)' :
                      diagnosticData.selectedQuality === 'ld' ? 'Низкое (256×256)' :
                      'Среднее (512×512)'
                    }
                  </p>
                </div>
              </div>

              {/* Классификация устройства */}
              <div style={{ marginBottom: '15px', padding: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '5px' }}>
                <h4 style={{ 
                  margin: '0 0 10px 0', 
                  color: '#FFD700',
                  fontSize: isMobile ? '12px' : '14px'
                }}>⚡ Мощность устройства:</h4>
                <p><strong>Категория:</strong> 
                  <span style={{ 
                    color: diagnosticData.devicePower === 'strong' ? '#4CAF50' : 
                           diagnosticData.devicePower === 'medium' ? '#FF9800' : '#f44336',
                    marginLeft: '5px',
                    fontWeight: 'bold'
                  }}>
                    {diagnosticData.devicePower === 'strong' ? '💪 Мощное' : 
                     diagnosticData.devicePower === 'medium' ? '📱 Среднее' : '🐌 Слабое'}
                  </span>
                </p>
                <p><strong>Рекомендация:</strong> <span style={{ color: '#81C784' }}>{diagnosticData.recommendation}</span></p>
              </div>

              {/* НОВАЯ СЕКЦИЯ: Анализ экрана */}
              {diagnosticData.screenAnalysis && typeof diagnosticData.screenAnalysis === 'object' && (
                <div style={{ marginBottom: '15px', padding: '10px', background: 'rgba(33, 150, 243, 0.1)', borderRadius: '5px', border: '1px solid #2196F3' }}>
                  <h4 style={{ 
                    margin: '0 0 10px 0', 
                    color: '#2196F3',
                    fontSize: isMobile ? '12px' : '14px'
                  }}>📱 Анализ экрана:</h4>
                  <p><strong>Тип экрана:</strong> <span style={{ color: '#81C784' }}>{diagnosticData.screenAnalysis.type}</span></p>
                  <p><strong>Площадь:</strong> {diagnosticData.screenAnalysis.area}M пикселей</p>
                  <p><strong>Pixel Ratio:</strong> {diagnosticData.screenAnalysis.pixelRatio}x</p>
                  <p><strong>Ожидаемый размер спрайта:</strong> {diagnosticData.screenAnalysis.expectedSpriteSize}px</p>
                  <div style={{ 
                    marginTop: '8px', 
                    padding: '6px', 
                    background: 'rgba(76, 175, 80, 0.2)', 
                    borderRadius: '4px',
                    fontSize: isMobile ? '9px' : '10px'
                  }}>
                    <strong>Логика выбора:</strong> {diagnosticData.screenAnalysis.reason}
                  </div>
                </div>
              )}

              {/* НОВАЯ СЕКЦИЯ: Анализ текстур */}
              {diagnosticData.textureAnalysis && typeof diagnosticData.textureAnalysis === 'object' && (
                <div style={{ marginBottom: '15px', padding: '10px', background: 'rgba(156, 39, 176, 0.1)', borderRadius: '5px', border: '1px solid #9C27B0' }}>
                  <h4 style={{ 
                    margin: '0 0 10px 0', 
                    color: '#9C27B0',
                    fontSize: isMobile ? '12px' : '14px'
                  }}>🖼️ Анализ текстур:</h4>
                  <p><strong>Max Texture Size:</strong> <span style={{ 
                    color: diagnosticData.textureAnalysis.maxTextureSize >= 8192 ? '#4CAF50' : 
                           diagnosticData.textureAnalysis.maxTextureSize >= 4096 ? '#FF9800' : '#f44336'
                  }}>{diagnosticData.textureAnalysis.maxTextureSize}×{diagnosticData.textureAnalysis.maxTextureSize}</span></p>
                  
                  <div style={{ marginTop: '8px', fontSize: isMobile ? '10px' : '11px' }}>
                    <strong>Размеры спрайт-листов:</strong>
                    <div style={{ marginLeft: '10px' }}>
                      <div>HD: {diagnosticData.textureAnalysis.maxSpritesheetSizes.hd}px {diagnosticData.textureAnalysis.supportedQualities.hd ? '✅' : '❌'}</div>
                      <div>MD: {diagnosticData.textureAnalysis.maxSpritesheetSizes.md}px {diagnosticData.textureAnalysis.supportedQualities.md ? '✅' : '❌'}</div>
                      <div>LD: {diagnosticData.textureAnalysis.maxSpritesheetSizes.ld}px {diagnosticData.textureAnalysis.supportedQualities.ld ? '✅' : '❌'}</div>
                    </div>
                  </div>
                  
                  <div style={{ 
                    marginTop: '8px', 
                    padding: '6px', 
                    background: diagnosticData.textureAnalysis.wasDowngraded ? 'rgba(244, 67, 54, 0.2)' : 'rgba(76, 175, 80, 0.2)', 
                    borderRadius: '4px',
                    fontSize: isMobile ? '9px' : '10px'
                  }}>
                    <strong>Результат:</strong> Желаемое {diagnosticData.textureAnalysis.desiredQuality?.toUpperCase()} → Финальное {diagnosticData.textureAnalysis.finalQuality?.toUpperCase()}
                    {diagnosticData.textureAnalysis.wasDowngraded && <div style={{ color: '#f44336', marginTop: '4px' }}>⚠️ Качество понижено из-за ограничения GPU</div>}
                  </div>
                </div>
              )}

              {/* Системная информация */}
              <div style={{ marginBottom: '15px', padding: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '5px' }}>
                                 <h4 style={{ 
                   margin: '0 0 10px 0', 
                   color: '#FFD700',
                   fontSize: isMobile ? '12px' : '14px'
                 }}>📊 Системная информация:</h4>
                <p><strong>Устройство:</strong> {diagnosticData.isMobile ? '📱 Мобильное' : '💻 Десктоп'}</p>
                <p><strong>Ядра процессора:</strong> {diagnosticData.cores}</p>
                <p><strong>ОЗУ:</strong> {diagnosticData.memory} GB</p>
                <p><strong>Разрешение экрана:</strong> {diagnosticData.screenRes}</p>
                                 <p><strong>User Agent:</strong> <span style={{ 
                   fontSize: isMobile ? '8px' : '10px', 
                   wordBreak: 'break-all',
                   lineHeight: isMobile ? '1.2' : '1.4'
                 }}>{diagnosticData.userAgent}</span></p>
              </div>

              {/* Анализ спрайт листов */}
              <div style={{ marginBottom: '15px', padding: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '5px' }}>
                                 <h4 style={{ 
                   margin: '0 0 10px 0', 
                   color: '#FFD700',
                   fontSize: isMobile ? '12px' : '14px'
                 }}>🎨 Анализ текущих спрайт листов:</h4>
                                 {analyzeCurrentSprites().map((sprite, index) => (
                   <div key={index} style={{ 
                     display: isMobile ? 'block' : 'flex', 
                     justifyContent: 'space-between', 
                     padding: '3px 0',
                     borderBottom: index < analyzeCurrentSprites().length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                     fontSize: isMobile ? '9px' : '11px'
                   }}>
                     <span style={{ 
                       flex: isMobile ? 'auto' : 1,
                       display: 'block',
                       marginBottom: isMobile ? '2px' : '0'
                     }}>{sprite.name}</span>
                     <span style={{ 
                       color: sprite.isSupported ? '#4CAF50' : '#f44336', 
                       marginLeft: isMobile ? '0' : '10px',
                       fontWeight: 'bold'
                     }}>
                       {sprite.status} {sprite.size}
                     </span>
                   </div>
                 ))}
              </div>

                             {/* Рекомендации */}
               <div style={{ 
                 padding: isMobile ? '8px' : '10px', 
                 background: 'rgba(255,193,7,0.2)', 
                 borderRadius: '5px', 
                 border: '1px solid #FFC107' 
               }}>
                                 <h4 style={{ 
                   margin: '0 0 10px 0', 
                   color: '#FFC107',
                   fontSize: isMobile ? '12px' : '14px'
                 }}>💡 Рекомендации:</h4>
                {diagnosticData.devicePower === 'weak' && (
                  <p style={{ margin: '5px 0', color: '#FFE082' }}>
                    • Используйте кадры 256×256 для лучшей производительности<br/>
                    • Рассмотрите обновление браузера или устройства
                  </p>
                )}
                {diagnosticData.devicePower === 'medium' && (
                  <p style={{ margin: '5px 0', color: '#FFE082' }}>
                    • Оптимальный размер кадров: 512×512<br/>
                    • Большинство игр будут работать нормально
                  </p>
                )}
                {diagnosticData.devicePower === 'strong' && (
                  <p style={{ margin: '5px 0', color: '#FFE082' }}>
                    • Можете использовать максимальное качество<br/>
                    • Кадры 1024×1024 будут работать отлично
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: '20px', marginBottom: '10px' }}>🔄</div>
              <p>Определение характеристик устройства...</p>
            </div>
          )}
        </div>
      )}
    </>
  );
};

/**
* Компонент игровой страницы с полноэкранным Pixi.js канвасом
* 
* Принципы работы:
* 1. Создаем Pixi Application, который управляет рендерингом
* 2. Загружаем все игровые ресурсы через AssetsManager
* 3. Показываем экран загрузки с прогрессом
* 4. После загрузки создаем игровую сцену
* 5. Header и Footer остаются поверх канваса через z-index
* 
* Документация:
* - PixiJS Application: https://pixijs.download/release/docs/app.Application.html
* - Assets loading: all_pixijs_content.txt раздел "Assets"
*/
export default function GamePage() {
 // Ref для DOM элемента, в который будет помещен канвас
 const gameContainerRef = useRef<HTMLDivElement>(null);
 
 // Состояние для хранения экземпляра Pixi Application
 const [pixiApp, setPixiApp] = useState<Application | null>(null);
 
 // Состояния для отслеживания процесса инициализации и загрузки
 const [isInitializing, setIsInitializing] = useState(true);
 const [isLoadingAssets, setIsLoadingAssets] = useState(false);
 const [loadingProgress, setLoadingProgress] = useState<LoadingProgress>({
   loaded: 0,
   total: 0,
   percentage: 0,
   currentAsset: ''
 });
 const [error, setError] = useState<string | null>(null);
 

 // Состояние для отслеживания готовности DOM
 const [isDOMReady, setIsDOMReady] = useState(false);

 // 🔥 НОВОЕ: Ref для отслеживания состояния компонента
 const isMountedRef = useRef(true);
 const isCleaningUpRef = useRef(false);

 // Состояние для Game Over модального окна
 const [isGameOver, setIsGameOver] = useState(false);
 const [sessionGold, setSessionGold] = useState(0);

 // Состояние прогресса уровня больше не нужно - HUD встроен в Pixi.js

 // Используем контекст игры для управления паузой
 const { isPaused, setGameActive, setGameController, gameController, isGameActive } = useGame();
 
 // Используем героя для получения общего золота
 const { stats } = useHeroStore();

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
       <p>Загрузка данных героя для игры...</p>
     </div>
   );
 }
 
 // Навигация для переходов между страницами
 const navigate = useNavigate();

 // 🔥 НОВОЕ: Принудительная очистка ресурсов
 const forceCleanupResources = () => {
   if (isCleaningUpRef.current) return; // Предотвращаем множественные cleanup
   isCleaningUpRef.current = true;
   
   
   try {
     // Останавливаем игру через контекст
     setGameActive(false);
     
     // Очищаем звуковую систему
     audioManager.stopAllSounds();
     audioManager.resetGamePause();
     
     // Очищаем GameController
     if (gameController) {
       if (typeof gameController.destroy === 'function') {
         gameController.destroy();
       }
       setGameController(null);
     }
     
     // Очищаем PIXI приложение
     if (pixiApp) {
       try {
         // Останавливаем все ticker'ы
         if (pixiApp.ticker) {
           pixiApp.ticker.stop();
           pixiApp.ticker.remove((pixiApp as any).heroUpdateTicker);
           pixiApp.ticker.remove((pixiApp as any).gameControllerUpdateTicker);
         }
         
         // Очищаем обработчик resize
         if ((pixiApp as any).removeResizeListener) {
           (pixiApp as any).removeResizeListener();
         }
         
         // Удаляем canvas из DOM
         if (gameContainerRef.current && pixiApp.canvas) {
           try {
             gameContainerRef.current.removeChild(pixiApp.canvas);
           } catch (e) {
             // Canvas уже удален
           }
         }
         
         // Уничтожаем приложение
         pixiApp.destroy(true, { children: true, texture: true });
         setPixiApp(null);
       } catch (error) {
         console.warn('Ошибка при очистке PIXI:', error);
       }
     }
     
     // Очищаем контейнер
     if (gameContainerRef.current) {
       gameContainerRef.current.innerHTML = '';
     }
     

   } catch (error) {
     console.error('❌ Ошибка при принудительной очистке:', error);
   }
 };

 // 🔥 НОВОЕ: Отслеживание видимости страницы для мобильных устройств
 useEffect(() => {
   const handleVisibilityChange = () => {
     if (document.hidden) {
       forceCleanupResources();
     }
   };

   const handleBeforeUnload = () => {
     forceCleanupResources();
   };

   const handlePageHide = () => {
     forceCleanupResources();
   };

   // Добавляем слушатели для всех событий потери фокуса
   document.addEventListener('visibilitychange', handleVisibilityChange);
   window.addEventListener('beforeunload', handleBeforeUnload);
   window.addEventListener('pagehide', handlePageHide);

   return () => {
     document.removeEventListener('visibilitychange', handleVisibilityChange);
     window.removeEventListener('beforeunload', handleBeforeUnload);
     window.removeEventListener('pagehide', handlePageHide);
   };
 }, [gameController, pixiApp]);

 // Эффект для проверки готовности DOM
 useEffect(() => {
   const checkDOMReady = () => {
     if (gameContainerRef.current && isMountedRef.current) {
       setIsDOMReady(true);
     } else if (isMountedRef.current) {
       requestAnimationFrame(checkDOMReady);
     }
   };
   
   checkDOMReady();
 }, []);

 // Эффект для инициализации Pixi.js когда DOM готов
 useEffect(() => {
   if (!isDOMReady) return;
   
   // 🔥 ИСПРАВЛЕНИЕ: Проверяем что компонент все еще mounted и не очищается
   if (!isMountedRef.current || isCleaningUpRef.current) return;
   
   /**
    * Основная функция инициализации игры
    * 
    * Последовательность действий:
    * 1. Инициализация Pixi.js Application
    * 2. Загрузка всех игровых ресурсов
    * 3. Создание игровой сцены
    */
   async function initializeGame() {
     try {
       // 🔥 ЗАЩИТА: Проверяем что приложение еще не создано и компонент не очищается
       if (pixiApp || !isMountedRef.current || isCleaningUpRef.current) {
         return;
       }

       setIsInitializing(true);
       setError(null);

       // Шаг 1: Создание и настройка Pixi Application
       const app = await initializePixiApp();
       
       // 🔥 ЗАЩИТА: Проверяем состояние после асинхронной операции
       if (!isMountedRef.current || isCleaningUpRef.current) {
         app.destroy(true, { children: true, texture: true });
         return;
       }
       
       setPixiApp(app);
       setIsInitializing(false);

       // Шаг 2: Загрузка игровых ресурсов
       if (!isMountedRef.current || isCleaningUpRef.current) return;
       setIsLoadingAssets(true);
       await loadGameAssets();
       
       if (!isMountedRef.current || isCleaningUpRef.current) return;
       setIsLoadingAssets(false);

       // Шаг 3: Создание игровой сцены
       if (!isMountedRef.current || isCleaningUpRef.current) return;
       await createGameScene(app);

     } catch (err) {
       if (!isMountedRef.current || isCleaningUpRef.current) return;
       console.error('❌ Ошибка инициализации игры:', err);
       setError(`Ошибка инициализации: ${err instanceof Error ? err.message : String(err)}`);
       setIsInitializing(false);
       setIsLoadingAssets(false);
     }
   }

   /**
    * Инициализация Pixi.js Application
    * 
    * Создает и настраивает приложение PixiJS
    * Документация: https://pixijs.download/release/docs/app.Application.html
    */
   async function initializePixiApp(): Promise<Application> {


     // Создаем новый экземпляр Pixi Application
     const app = new Application();

     // Вычисляем правильный размер канваса с учетом header и footer
     const headerHeight = 40; // Из Header.css
     const footerHeight = 50; // Из Footer.css
     const gameWidth = window.innerWidth;
     const gameHeight = window.innerHeight - headerHeight - footerHeight;

     // Инициализируем приложение с настройками
     // Это асинхронная операция в PixiJS v8
     await app.init({
       // Цвет фона (темно-серый)
       background: '#1a1a1a',
       
       // Размеры канваса - весь экран минус header и footer
       width: gameWidth,
       height: gameHeight,
       
       // НЕ используем resizeTo: window, так как нам нужен кастомный размер
       // resizeTo: window,
       
       // Включаем антиалиасинг для сглаживания
       antialias: true,
       
       // Разрешение для четкости на retina дисплеях
       resolution: window.devicePixelRatio || 1,
       
       // Автоматическая плотность пикселей
       autoDensity: true,
       
       // Настройки для мобильных устройств
       preference: 'webgl',
       powerPreference: 'high-performance',
     });

     // 🔍 ДИАГНОСТИКА: Проверяем ограничения устройства
     try {
       // Проверяем тип рендерера и получаем WebGL контекст
       const renderer = app.renderer as any;
       let gl: WebGLRenderingContext | null = null;
       
       // Для WebGLRenderer
       if (renderer.gl) {
         gl = renderer.gl;
       }
                // Для случаев когда используется canvas context
         else if (app.canvas && app.canvas.getContext) {
           gl = app.canvas.getContext('webgl') as WebGLRenderingContext || 
                app.canvas.getContext('experimental-webgl') as WebGLRenderingContext;
         }
       
       if (gl) {
         const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
         const maxCombinedTextures = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
         const vendor = gl.getParameter(gl.VENDOR);
         const rendererInfo = gl.getParameter(gl.RENDERER);
         
         
         // Предупреждение если размер текстуры мал
         if (maxTextureSize < 4096) {
           console.warn('⚠️ ПРЕДУПРЕЖДЕНИЕ: Размер текстуры ограничен! Некоторые спрайтшиты могут не загрузиться.');
           console.warn(`   Максимальный размер: ${maxTextureSize}x${maxTextureSize}`);
           console.warn('   Спрайтшиты крипов (8192x7168) превышают этот лимит!');
         }
       } else {
         console.warn('⚠️ WebGL контекст недоступен - возможны проблемы с текстурами на мобильных');
       }
     } catch (error) {
       console.warn('⚠️ Ошибка при проверке GPU ограничений:', error);
     }

     

     // Добавляем canvas в контейнер
     // В PixiJS v8 используется app.canvas вместо app.view
     const container = gameContainerRef.current;
     if (!container) {
       throw new Error('Game container is not available');
     }
     
     // Проверяем что canvas создан
     if (!app.canvas) {
       throw new Error('Canvas was not created by PixiJS');
     }
     
     // Очищаем контейнер от предыдущих элементов (если есть)
     // ИСПРАВЛЕНИЕ: Используем более безопасную очистку
     while (container.firstChild) {
       container.removeChild(container.firstChild);
     }
     
     // Добавляем canvas
     container.appendChild(app.canvas);
     
     

     // Добавляем обработчик изменения размера окна
     const handleResize = () => {
       const headerHeight = 40;
       const footerHeight = 50;
       const newGameWidth = window.innerWidth;
       const newGameHeight = window.innerHeight - headerHeight - footerHeight;
       
       // Изменяем размер рендерера
       app.renderer.resize(newGameWidth, newGameHeight);
       
       // Обновляем скорость фона пропорционально новой ширине экрана
       if ((app as any).updateBackgroundSpeed) {
         (app as any).updateBackgroundSpeed(newGameWidth / 200);
       }
       
       // Обновляем размеры фона
       if ((app as any).updateBackgroundSize) {
         (app as any).updateBackgroundSize();
       }
       
       // Обновляем игровые объекты при изменении размера
       if ((app as any).gameHero) {
         (app as any).gameHero.onResize();
       }
       if ((app as any).gameController) {
         (app as any).gameController.onResize();
       }
     };
     
     window.addEventListener('resize', handleResize);
     
     // Сохраняем функцию для очистки
     (app as any).removeResizeListener = () => {
       window.removeEventListener('resize', handleResize);
     };

     return app;
   }

   /**
    * Загрузка всех игровых ресурсов
    * 
    * Использует AssetsManager для загрузки текстур, звуков и других ресурсов
    * Отслеживает прогресс загрузки для отображения пользователю
    */
   async function loadGameAssets(): Promise<void> {


     // Подписываемся на обновления прогресса загрузки
     const progressCallback = (progress: LoadingProgress) => {
       setLoadingProgress(progress);
       
     };

     assetsManager.onProgress(progressCallback);

     try {
       // Запускаем загрузку всех ресурсов
       await assetsManager.loadGameAssets();
       
     } finally {
       // Отписываемся от обновлений прогресса
       assetsManager.offProgress(progressCallback);
     }
   }

   /**
    * Создание игровой сцены
    * 
    * После загрузки ресурсов создаем основные игровые объекты:
    * - Фон
    * - Героя
    * - Игровой контроллер для управления циклом боя
    */
   async function createGameScene(app: Application): Promise<void> {


     // Очищаем сцену
     app.stage.removeChildren();

     // Создаем фон
     await createBackground(app);

     // Создаем героя и игровой контроллер
     await createGameController(app);

     
   }

   /**
    * Создание фонового изображения
    * 
    * Использует TilingSprite для создания движущегося фона
    * Документация: https://pixijs.download/release/docs/scene.TilingSprite.html
    */
   async function createBackground(app: Application): Promise<void> {


     try {
       // Получаем загруженную текстуру фона
       const forestTexture = assetsManager.getBackgroundTexture('forest');
       
       // Создаем TilingSprite для повторяющегося фона
       // TilingSprite позволяет создавать бесшовный повторяющийся фон
       const backgroundTiling = new TilingSprite({
         texture: forestTexture,
         width: app.screen.width * 2,  // Делаем шире экрана для плавного движения
         height: app.screen.height
       });
       
       // Масштабируем фон по высоте игрового экрана (с учетом header/footer)
       // Сохраняем пропорции, но покрываем всю игровую высоту
       const scaleY = app.screen.height / forestTexture.height;
       backgroundTiling.tileScale.set(scaleY, scaleY);
       
       // Позиционируем фон
       backgroundTiling.x = 0;
       backgroundTiling.y = 0;
       
       // Добавляем фон на сцену (он будет отрисован первым)
       app.stage.addChild(backgroundTiling);
       
       // Анимация движения фона справа налево  
       // Скорость движения пропорциональная ширине экрана с общим коэффициентом
       const baseSpeed = app.screen.width / 200;
       const speedMultiplier = GAME_CONFIG.BACKGROUND.scroll.speedMultiplier;
       let scrollSpeed = baseSpeed * speedMultiplier;
       
       // Флаг для управления движением фона
       let isBackgroundMoving = false;
       
       app.ticker.add((time) => {
         // Двигаем фон только если установлен флаг движения
         if (isBackgroundMoving) {
           // ✅ СИНХРОНИЗАЦИЯ: Используем deltaMS как у крипов
           // Нормализуем deltaMS (16.67 при 60 FPS) к стандартному значению
           const normalizedDelta = time.deltaMS / 16.67;
           const backgroundSpeed = scrollSpeed * normalizedDelta;
           backgroundTiling.tilePosition.x -= backgroundSpeed;
           
           // 🔍 ОТЛАДКА: Логируем скорости каждые 60 кадров
           if (Math.floor(Date.now() / 1000) % 2 === 0 && Math.random() < 0.01) {

           }
         }
       });
       
       // Сохраняем функции управления фоном в контексте приложения
       // Это позволит герою управлять фоном и обновлять скорость при изменении размера
       (app as any).setBackgroundMoving = (moving: boolean) => {
         isBackgroundMoving = moving;
   
       };
       
       (app as any).updateBackgroundSpeed = (newBaseSpeed: number) => {
         scrollSpeed = newBaseSpeed * speedMultiplier; // Применяем общий коэффициент скорости
 
       };
       
       // Функция для обновления размеров фона при изменении экрана
       (app as any).updateBackgroundSize = () => {
         backgroundTiling.width = app.screen.width * 2;
         backgroundTiling.height = app.screen.height;
         
         // Пересчитываем масштаб
         const scaleY = app.screen.height / forestTexture.height;
         backgroundTiling.tileScale.set(scaleY, scaleY);
       };
       

       
     } catch (error) {
       console.error('❌ Ошибка создания фона:', error);
       
       // Fallback: создаем простой цветной фон
       const fallbackBg = new Graphics();
       fallbackBg.rect(0, 0, app.screen.width, app.screen.height);
       fallbackBg.fill({ color: 0x228B22 }); // Зеленый цвет леса
       app.stage.addChild(fallbackBg);
     }
   }

   /**
    * Создание игрового контроллера
    * 
    * Создает героя и игровой контроллер для управления циклом боя
    */
   async function createGameController(app: Application): Promise<void> {
      try {

        
        // 🔥 НОВОЕ: Очищаем все существующие ticker'ы перед созданием нового контроллера
        if (app.ticker) {
          // Удаляем все пользовательские обработчики
          app.ticker.remove((app as any).heroUpdateTicker);
          app.ticker.remove((app as any).gameControllerUpdateTicker);
          
          // Очищаем ссылки
          (app as any).heroUpdateTicker = null;
          (app as any).gameControllerUpdateTicker = null;
        }
        
        // Создаем нового героя
        const hero = await createHero(app);
        
        // Создаем новый игровой контроллер
        const gameController = new GameController(app, hero);
        
        // 🔥 НОВОЕ: Связываем героя с контроллером для нанесения урона после атаки
        hero.setAttackCallback(() => {
          gameController.dealDamageToCreep();
        });
        
        // Добавляем героя на сцену
        app.stage.addChild(hero);
        
        // 🔥 ИСПРАВЛЕНИЕ: Сохраняем ссылки на ticker функции для последующего удаления
        const heroUpdateTicker = (time: any) => {
          // ИСПРАВЛЕНИЕ: Проверяем что игра запущена перед обновлением героя
          if (gameController.isRunning()) {
            // ✅ МИЛЛИСЕКУНДЫ: GameController ожидает deltaMS для таймеров
            hero.update(time.deltaMS);
          }
        };
        
        const gameControllerUpdateTicker = (time: any) => {
          // ИСПРАВЛЕНИЕ: Проверяем что игра запущена перед обновлением контроллера
          if (gameController.isRunning()) {
            // ✅ МИЛЛИСЕКУНДЫ: GameController ожидает deltaMS для таймеров
            gameController.update(time.deltaMS);
          }
        };
        
        // Добавляем героя в игровой цикл для обновления анимаций
        app.ticker.add(heroUpdateTicker);
        
        // Добавляем контроллер в игровой цикл
        app.ticker.add(gameControllerUpdateTicker);
        
        // 🔥 НОВОЕ: Сохраняем ссылки на ticker функции для возможности их удаления
        (app as any).heroUpdateTicker = heroUpdateTicker;
        (app as any).gameControllerUpdateTicker = gameControllerUpdateTicker;
        
        // Сохраняем ссылки для обработки resize
        (app as any).gameHero = hero;
        (app as any).gameController = gameController;
        
        // Передаем контроллер в игровой контекст
        setGameController(gameController);
        
        // Прогресс уровня теперь отображается в Pixi.js HUD автоматически
        
        // Устанавливаем callback для Game Over
       gameController.setGameOverCallback((sessionGoldEarned: number) => {
         setSessionGold(sessionGoldEarned);
         setIsGameOver(true);
         setGameActive(false); // Деактивируем игру
       });
       
       // ИСПРАВЛЕНИЕ: Принудительно сбрасываем состояние Game Over при создании новой игры
       // Это нужно для случая когда пользователь возвращается в игру после смерти героя
       setIsGameOver(false);
       setSessionGold(0);
       
       // Устанавливаем игру как активную
       setGameActive(true);
        
        // Запускаем игровой цикл
        gameController.startGameLoop();
        
        
      } catch (error) {
        console.error('❌ Ошибка создания игрового контроллера:', error);
      }
    }

   /**
    * 🔥 НОВОЕ: Создание героя
    * 
    * Создает экземпляр героя с настройками из useHeroStore
    */
   async function createHero(app: Application): Promise<Hero> {
     // Получаем активного героя из данных загруженных с сервера (через heroStore)
     // Если данные еще не загружены, используем значение по умолчанию
     const currentStats = stats;
     const heroId = currentStats?.heroId ? parseInt(currentStats.heroId) : parseInt(TEST_HERO_ID);
     
     const { mapNumericIdToHeroName } = await import('../../game/config/heroConfig');
     const heroType = mapNumericIdToHeroName(heroId);
     
     
     // Создаем экземпляр героя
     const hero = new Hero(app, heroType);
     
     // Настройка callback'ов, которые были в оригинальном коде
     heroLevelSystem.on('levelUp', (newLevel: number) => {
     });
     
     // Связываем героя с системой уровней для тестирования
     (window as any).heroLevelSystem = heroLevelSystem;
     
     // Связываем героя с контроллером для нанесения урона после атаки
     // (это будет настроено в createGameController)
     
     return hero;
   }

   // Запускаем инициализацию игры
   initializeGame();

   // 🔥 УЛУЧШЕННАЯ функция очистки при размонтировании компонента
   return () => {
  
     
     // Отмечаем что компонент размонтирован
     isMountedRef.current = false;
     
     // Запускаем принудительную очистку
     forceCleanupResources();
   };
 }, [isDOMReady]); // Зависит от готовности DOM

 // Эффект для перезапуска игры при возврате из других вкладок
 useEffect(() => {
   // Проверяем нужно ли перезапустить игру
   const checkAndRestartGame = () => {
     // Если есть GameController, но игра неактивна или остановлена
     if (gameController && 
         typeof gameController.isRunning === 'function' && 
         typeof gameController.restartGame === 'function') {
       
       const isRunning = gameController.isRunning();
       
             // Если игра остановлена, но мы на странице игры - перезапускаем
      if (!isRunning && !isGameActive) {

        
        // Сбрасываем состояние Game Over перед перезапуском
        setIsGameOver(false);
        setSessionGold(0);
        
        gameController.restartGame();
        setGameActive(true);
      }
     }
   };

   // Запускаем проверку через небольшую задержку для корректной инициализации
   const timeoutId = setTimeout(checkAndRestartGame, 100);
   
   return () => clearTimeout(timeoutId);
 }, [gameController, isGameActive, setGameActive]); // Зависит от состояния игры

 // Обработчик для перезагрузки при ошибке
   const handleRetry = () => {
    setError(null);
    setIsInitializing(true);
    setIsLoadingAssets(false);
    // Перезагружаем страницу для повторной инициализации
    window.location.reload();
  };

  // Обработчики для Game Over модального окна
  const handleGameRestart = () => {
    if (gameController) {
      // ИСПРАВЛЕНИЕ: НЕ вызываем stopGame() чтобы избежать конфликта с setGameActive
      // Используем только логику сброса характеристик + перезапуск через контекст
      
      // 1. Восстанавливаем здоровье и ману героя до полных значений
      if (typeof gameController.restoreHeroToFullHealth === 'function') {
        gameController.restoreHeroToFullHealth();
      }
      
      // 2. Сбрасываем счетчик золота за сессию
      if (typeof gameController.resetSessionGold === 'function') {
        gameController.resetSessionGold();
      }
      
      // 3. Перезапускаем игру напрямую через GameController (безопасный метод)
      if (typeof gameController.restartGame === 'function') {
        gameController.restartGame();
      }
      
      // 4. Убеждаемся что игра активна в контексте
      setGameActive(true);
    }
    
    // Закрываем модалку
    setIsGameOver(false);
    setSessionGold(0);
    
    
  };

  const handleMainMenu = () => {
    // Закрываем модалку
    setIsGameOver(false);
    setSessionGold(0);
    
    // ИСПРАВЛЕНИЕ: Сбрасываем состояние паузы при выходе из игры
    try {
      audioManager.resetGamePause();
    } catch (error) {
      console.warn('Ошибка при сбросе состояния паузы:', error);
    }
    
    // Переходим на главную страницу
    navigate('/main');
    
    
  };

  // Функции управления паузой теперь находятся в GameContext

 /**
  * Компонент экрана загрузки
  * 
  * Отображает прогресс загрузки ресурсов с красивой анимацией
  */
 const LoadingScreen = () => (
   <div style={{
     position: 'absolute',
     top: 0,
     left: 0,
     width: '100%',
     height: '100%',
     backgroundColor: 'rgba(0, 0, 0, 0.95)',
     display: 'flex',
     flexDirection: 'column',
     justifyContent: 'center',
     alignItems: 'center',
     zIndex: 10,
     color: 'white',
     fontFamily: 'Arial, sans-serif',
     backgroundImage: 'url(/media/game/images/forest_background1.jpg)',
     backgroundSize: 'cover',
     backgroundPosition: 'center',
     backgroundRepeat: 'no-repeat',
   }}>
     
     {/* Затемняющий overlay для лучшей читаемости */}
     <div style={{
       position: 'absolute',
       top: 0,
       left: 0,
       right: 0,
       bottom: 0,
       backgroundColor: 'rgba(0, 0, 0, 0.8)',
       zIndex: -1
     }} />

     {/* Стилизованная панель загрузки */}
     <div style={{
       background: 'linear-gradient(135deg, rgba(20, 25, 30, 0.95) 0%, rgba(35, 40, 45, 0.85) 50%, rgba(20, 25, 30, 0.95) 100%)',
       border: '2px solid rgba(255, 215, 0, 0.6)',
       borderRadius: '8px',
       padding: 'clamp(20px, 4vw, 40px)',
       boxShadow: `
         0 8px 32px rgba(0, 0, 0, 0.5),
         inset 0 1px 0 rgba(255, 255, 255, 0.1),
         inset 0 -1px 0 rgba(0, 0, 0, 0.3)
       `,
       position: 'relative',
       overflow: 'hidden',
       minWidth: 'clamp(320px, 60vw, 500px)',
       maxWidth: '90vw',
       textAlign: 'center'
     }}>
       
       {/* Декоративный элемент сверху */}
       <div style={{
         position: 'absolute',
         top: 0,
         left: 0,
         right: 0,
         height: '2px',
         background: 'linear-gradient(90deg, transparent 0%, rgba(255, 215, 0, 0.8) 50%, transparent 100%)'
       }} />

       {/* Заголовок */}
       <div style={{
         fontSize: 'clamp(18px, 4vw, 28px)',
         fontWeight: 'bold',
         marginBottom: 'clamp(20px, 4vw, 30px)',
         color: '#c9aa71',
         textTransform: 'uppercase',
         letterSpacing: 'clamp(0.5px, 0.2vw, 1.5px)',
         textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
       }}>
         {isInitializing && '⚙️ Инициализация игрового движка...'}
         {isLoadingAssets && '📦 Загрузка игровых ресурсов...'}
       </div>

       {/* Прогресс бар */}
       {isLoadingAssets && (
         <>
           <div style={{
             width: '100%',
             height: 'clamp(16px, 2vw, 24px)',
             backgroundColor: 'rgba(0, 0, 0, 0.4)',
             borderRadius: '12px',
             overflow: 'hidden',
             marginBottom: 'clamp(15px, 3vw, 20px)',
             border: '2px solid rgba(100, 120, 140, 0.5)',
             boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
           }}>
             <div style={{
               width: `${loadingProgress.percentage}%`,
               height: '100%',
               borderRadius: '10px',
               transition: 'width 0.3s ease',
               background: 'linear-gradient(90deg, #c9aa71, #ffd700, #c9aa71)',
               boxShadow: '0 0 10px rgba(201, 170, 113, 0.5)',
             }} />
           </div>

           {/* Процент и статус */}
           <div style={{
             fontSize: 'clamp(16px, 3vw, 22px)',
             marginBottom: 'clamp(10px, 2vw, 15px)',
             fontWeight: 'bold',
             color: '#ffd700',
             textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
           }}>
             {loadingProgress.percentage}%
           </div>

           <div style={{
             fontSize: 'clamp(12px, 2.5vw, 16px)',
             opacity: 0.9,
             color: '#c9aa71',
             marginBottom: 'clamp(8px, 1.5vw, 12px)',
             textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
           }}>
             {loadingProgress.currentAsset || 'Подготовка...'}
           </div>

           {/* Информация о прогрессе */}
           <div style={{
             fontSize: 'clamp(10px, 2vw, 14px)',
             opacity: 0.7,
             color: '#a0a0a0',
             textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
           }}>
             {loadingProgress.loaded} из {loadingProgress.total} ресурсов
           </div>
         </>
       )}

       {/* Индикатор инициализации */}
       {isInitializing && (
         <div style={{
           width: 'clamp(40px, 6vw, 60px)',
           height: 'clamp(40px, 6vw, 60px)',
           border: '4px solid rgba(201, 170, 113, 0.3)',
           borderTop: '4px solid #c9aa71',
           borderRadius: '50%',
           animation: 'spin 1s linear infinite',
           boxShadow: '0 0 20px rgba(201, 170, 113, 0.3)',
         }} />
       )}

       {/* Декоративные элементы по углам */}
       <div style={{
         position: 'absolute',
         top: '8px',
         left: '8px',
         width: '20px',
         height: '20px',
         border: '2px solid rgba(255, 215, 0, 0.4)',
         borderRight: 'none',
         borderBottom: 'none',
         borderRadius: '4px 0 0 0',
       }} />
       <div style={{
         position: 'absolute',
         top: '8px',
         right: '8px',
         width: '20px',
         height: '20px',
         border: '2px solid rgba(255, 215, 0, 0.4)',
         borderLeft: 'none',
         borderBottom: 'none',
         borderRadius: '0 4px 0 0',
       }} />
       <div style={{
         position: 'absolute',
         bottom: '8px',
         left: '8px',
         width: '20px',
         height: '20px',
         border: '2px solid rgba(255, 215, 0, 0.4)',
         borderRight: 'none',
         borderTop: 'none',
         borderRadius: '0 0 0 4px',
       }} />
       <div style={{
         position: 'absolute',
         bottom: '8px',
         right: '8px',
         width: '20px',
         height: '20px',
         border: '2px solid rgba(255, 215, 0, 0.4)',
         borderLeft: 'none',
         borderTop: 'none',
         borderRadius: '0 0 4px 0',
       }} />
     </div>

     {/* CSS анимация */}
     <style dangerouslySetInnerHTML={{
       __html: `
         @keyframes spin {
           0% { transform: rotate(0deg); }
           100% { transform: rotate(360deg); }
         }
       `
     }} />
   </div>
 );

 return (
   <div style={{
     // Контейнер занимает весь экран
     width: '100vw',
     height: '100vh',
     
     // Убираем отступы и переполнение
     margin: 0,
     padding: 0,
     overflow: 'hidden',
     
     // Позиционирование для правильного отображения
     position: 'relative',
     
     // Темный фон на случай проблем с загрузкой
     backgroundColor: '#1a1a1a',
   }}>
     
     {/* Контейнер для Pixi.js канваса */}
     <div 
       ref={gameContainerRef}
       style={{
         // Канвас занимает пространство между header и footer
         width: '100%',
         height: 'calc(100vh - 90px)', // 40px (header) + 50px (footer)
         
         // Позиционирование - используем paddingTop из main, убираем top
         position: 'absolute',
         top: 0,
         left: 0,
         
         // Z-index ниже, чем у Header/Footer
         zIndex: 1,
       }}
     />

     {/* Экран загрузки */}
     {(isInitializing || isLoadingAssets) && <LoadingScreen />}

     {/* Диагностика устройства */}
     <DeviceDiagnostic />

     {/* HUD прогресса уровня теперь встроен в Pixi.js игру */}

     {/* Кнопки управления игрой теперь находятся в Header */}

     {/* Overlay для отображения ошибок */}
     {error && (
       <div style={{
         position: 'absolute',
         top: '50%',
         left: '50%',
         transform: 'translate(-50%, -50%)',
         background: 'rgba(255, 0, 0, 0.9)',
         color: 'white',
         padding: '20px',
         borderRadius: '10px',
         textAlign: 'center',
         zIndex: 1000,
         maxWidth: '80%'
       }}>
         <h3>Ошибка инициализации игры</h3>
         <p>{error}</p>
         <button
           onClick={() => window.location.reload()}
           style={{
             background: '#fff',
             color: '#000',
             border: 'none',
             padding: '10px 20px',
             borderRadius: '5px',
             cursor: 'pointer',
             marginTop: '10px'
           }}
         >
           Перезагрузить страницу
         </button>
       </div>
     )}

     {/* Модальное окно окончания игры */}
     {isGameOver && (
     <GameOverModal
       isVisible={isGameOver}
       sessionGold={sessionGold}
         totalGold={1000} // Временное значение для общего золота
       onRestart={handleGameRestart}
       onMainMenu={handleMainMenu}
     />
     )}
   </div>
 );
}