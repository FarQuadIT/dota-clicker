import React from 'react';
import { heroLevelSystem } from '../../../game/systems/HeroLevelSystem';
import './LevelProgressHUD.css';

interface LevelProgressHUDProps {
  /** Прогресс уровня: убито крипов из общего количества */
  progress: { current: number; total: number; isCurrentlyBoss: boolean };
}

/**
 * HUD компонент для отображения прогресса уровня
 * Показывает текущий уровень героя, градацию и прогресс убийства крипов
 */
const LevelProgressHUD: React.FC<LevelProgressHUDProps> = ({ progress }) => {
  const levelData = heroLevelSystem.getLevelData();
  
  return (
    <div className="level-progress-hud">
      {/* Информация об уровне героя */}
      <div className="hero-level-info" data-rank={levelData.levelName}>
        <div className="hero-level">
          Уровень {levelData.currentLevel}
        </div>
        <div className="hero-level-rank">
          ({levelData.levelName})
        </div>
      </div>
      
      {/* Прогресс текущего уровня */}
      <div className="level-progress">
        {progress.isCurrentlyBoss ? (
          <div className="boss-indicator">
            🔥 БОСС! 🔥
          </div>
        ) : (
          <div className="progress-indicator">
            Прогресс: {progress.current}/{progress.total}
          </div>
        )}
      </div>
      
      {/* Прогресс-бар */}
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ 
            width: `${(progress.current / progress.total) * 100}%`,
            backgroundColor: progress.isCurrentlyBoss ? '#ff6b35' : '#4caf50'
          }}
        />
      </div>
    </div>
  );
};

export default LevelProgressHUD; 