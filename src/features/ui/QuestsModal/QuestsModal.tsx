// src/features/ui/QuestsModal/QuestsModal.tsx

import React, { useState, useEffect } from 'react';
import './QuestsModal.css';
import { fetchUserQuests, updateUserQuests, addDiamonds, addGoldToServer } from '../../../shared/api/apiService';
import type { Quest } from '../../../shared/types';
import { shopCategories } from '../../../shared/constants/shopConfig';
import { 
  getQuestRewardConfig, 
  calculateQuestReward, 
  isRewardDiamonds, 
  isRewardGold,
  RewardType 
} from '../../../shared/constants/questRewards';
import { useGold } from '../../../contexts/GoldContext';

// Интерфейс для props компонента
interface QuestsModalProps {
  /** Флаг видимости модального окна */
  isVisible: boolean;
  
  /** Функция для закрытия модального окна */
  onClose: () => void;
  
  /** ID пользователя для загрузки заданий */
  userId: string;
}

/**
 * Модальное окно ежедневных заданий
 */
const QuestsModal: React.FC<QuestsModalProps> = ({ isVisible, onClose, userId }) => {
  // Состояния компонента
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claimingRewards, setClaimingRewards] = useState<Set<number>>(new Set());

  // Контекст для работы с золотом
  const { setGold, setDiamonds } = useGold();

  // Загрузка заданий при открытии модального окна
  useEffect(() => {
    if (isVisible && userId) {
      loadQuests();
    }
  }, [isVisible, userId]);

  /**
   * Загружает задания с сервера
   */
  const loadQuests = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetchUserQuests(userId);
      
      if (response) {
        setQuests(response.quests);
      } else {
        setError('Не удалось загрузить задания');
      }
    } catch (err) {
      setError('Ошибка загрузки заданий');
    } finally {
      setLoading(false);
    }
  };

  // Регистрируем функцию перезагрузки квестов для внешнего использования
  useEffect(() => {
    if (isVisible && typeof window !== 'undefined') {
      (window as any).reloadQuests = loadQuests;
      
      return () => {
        delete (window as any).reloadQuests;
      };
    }
  }, [isVisible, loadQuests]);

  /**
   * Вычисляет процент прогресса задания
   */
  const calculateProgress = (quest: Quest): number => {
    if (!quest.questGoal || quest.questGoal <= 0) {
      return 0;
    }
    return Math.min(100, (quest.questCurrentValue / quest.questGoal) * 100);
  };

  /**
   * Проверяет, выполнено ли задание (достигнута ли цель)
   */
  const isQuestCompleted = (quest: Quest): boolean => {
    return quest.questGoal !== null && quest.questCurrentValue >= quest.questGoal;
  };

  /**
   * Проверяет, можно ли получить награду за задание
   */
  const canClaimReward = (quest: Quest): boolean => {
    return isQuestCompleted(quest) && !quest.claimedReward;
  };

  /**
   * Проверяет, уже ли получена награда за задание
   */
  const isRewardClaimed = (quest: Quest): boolean => {
    return quest.claimedReward;
  };

  /**
   * Форматирует текст прогресса
   */
  const formatProgressText = (quest: Quest): string => {
    if (quest.questGoal === null) {
      return `Выполнено: ${quest.questCurrentValue}`;
    }
    return `${quest.questCurrentValue} / ${quest.questGoal}`;
  };

  /**
   * Получить конфигурацию награды для задания
   */
  const getRewardConfig = (quest: Quest) => {
    return getQuestRewardConfig(quest.questId);
  };

  /**
   * Вычисляет награду за задание с использованием конфигурации
   */
  const getRewardAmount = (quest: Quest): number => {
    return calculateQuestReward(quest.questId, quest.questGoal);
  };

  /**
   * Обработчик получения награды
   */
  const handleClaimReward = async (quest: Quest) => {
    // Проверяем, можно ли получить награду
    if (!canClaimReward(quest)) {
      return;
    }

    // Проверяем, не происходит ли уже получение награды
    if (claimingRewards.has(quest.questId)) {
      return;
    }

    const rewardConfig = getRewardConfig(quest);
    const rewardAmount = getRewardAmount(quest);
    
    // Добавляем задание в список получающих награду
    setClaimingRewards(prev => new Set([...prev, quest.questId]));

    try {
      // Отправляем запрос на обновление квеста с флагом claimedReward: true
      // Также отправляем currentValue, так как сервер может его ожидать
      const success = await updateUserQuests({
        userId: parseInt(userId),
        quests: [{
          questId: quest.questId,
          currentValue: quest.questCurrentValue,
          claimedReward: true
        }]
      });

      if (success) {
        // Обновляем локальное состояние
        setQuests(prevQuests => 
          prevQuests.map(q => 
            q.questId === quest.questId 
              ? { ...q, claimedReward: true }
              : q
          )
        );
        
        // Начисляем награду в зависимости от типа
        if (rewardConfig.type === RewardType.GOLD) {
          // Начисляем золото через сервер (аналогично убийству крипов)
          try {
            const goldSuccess = await addGoldToServer(userId, rewardAmount);
            if (goldSuccess) {
              // Обновляем локальный контекст только после успешной отправки на сервер
              setGold(prevGold => prevGold + rewardAmount);
            }
          } catch (goldError) {
            // Ошибка обработается в addGoldToServer
          }
        } else if (rewardConfig.type === RewardType.DIAMONDS) {
          // Начисляем осколки через API и контекст
          try {
            const diamondsSuccess = await addDiamonds(userId, rewardAmount);
            if (diamondsSuccess) {
              setDiamonds(prevDiamonds => prevDiamonds + rewardAmount);
            }
          } catch (diamondError) {
            // Ошибка обработается в addDiamonds
          }
        }
        
      }
    } catch (error) {
      // Ошибки обрабатываются в соответствующих API функциях
    } finally {
      // Убираем задание из списка получающих награду
      setClaimingRewards(prev => {
        const newSet = new Set(prev);
        newSet.delete(quest.questId);
        return newSet;
      });
    }
  };

  /**
   * Обработчик закрытия модального окна
   */
  const handleClose = () => {
    onClose();
  };

  /**
   * Обработчик клика по overlay (закрытие при клике вне модального окна)
   */
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Если модальное окно не видно, не рендерим его
  if (!isVisible) {
    return null;
  }

  return (
    <div className="quests-modal-overlay" onClick={handleOverlayClick}>
      <div className="quests-modal">
        
        {/* Декоративные элементы по углам */}
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
          pointerEvents: 'none'
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
          pointerEvents: 'none'
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
          pointerEvents: 'none'
        }} />

        {/* Заголовок модального окна */}
        <div className="quests-modal-header">
          <h2 className="quests-modal-title">
            🎯 Ежедневные задания
          </h2>
          <button className="quests-modal-close" onClick={handleClose}>
            ×
          </button>
        </div>

        {/* Содержимое модального окна */}
        <div className="quests-modal-content">
          {loading && (
            <div className="quests-empty">
              Загрузка заданий...
            </div>
          )}

          {error && (
            <div className="quests-empty" style={{ color: '#ff6b6b' }}>
              {error}
              <br />
              <button 
                onClick={loadQuests}
                style={{
                  marginTop: '10px',
                  background: 'rgba(255, 215, 0, 0.2)',
                  border: '1px solid rgba(255, 215, 0, 0.5)',
                  color: '#ffd700',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Попробовать снова
              </button>
            </div>
          )}

          {!loading && !error && quests.length === 0 && (
            <div className="quests-empty">
              Нет доступных заданий
            </div>
          )}

          {!loading && !error && quests.length > 0 && (
            <div className="quests-list">
              {quests.map((quest) => {
                const progress = calculateProgress(quest);
                const isCompleted = isQuestCompleted(quest);
                const canClaim = canClaimReward(quest);
                const isRewarded = isRewardClaimed(quest);
                const isClaiming = claimingRewards.has(quest.questId);
                const rewardConfig = getRewardConfig(quest);
                const reward = getRewardAmount(quest);

                return (
                  <div 
                    key={quest.questId} 
                    className={`quest-item ${isCompleted ? 'completed' : ''}`}
                  >
                    {/* Бейдж выполнения или получения награды */}
                    {isRewarded && (
                      <div className="quest-completion-badge" style={{ background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)' }}>
                        Награда получена
                      </div>
                    )}
                    {isCompleted && !isRewarded && (
                      <div className="quest-completion-badge">
                        Выполнено
                      </div>
                    )}

                    {/* Заголовок задания */}
                    <div className="quest-title">
                      {quest.questTitle}
                    </div>

                    {/* Контейнер прогресса и награды */}
                    <div className="quest-progress-container">
                      
                      {/* Прогресс-бар */}
                      <div className="quest-progress-wrapper">
                        <div className="quest-progress-text">
                          {formatProgressText(quest)}
                        </div>
                        
                        <div className="quest-progress-bar">
                          <div 
                            className="quest-progress-fill"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Награда */}
                      <div className="quest-reward-container">
                        <button
                          className="quest-reward-button"
                          disabled={!canClaim || isClaiming}
                          onClick={() => handleClaimReward(quest)}
                          style={{
                            opacity: isClaiming ? 0.7 : 1,
                            cursor: isClaiming ? 'wait' : (canClaim ? 'pointer' : 'not-allowed')
                          }}
                        >
                          {isClaiming 
                            ? 'Получаем...' 
                            : isRewarded 
                            ? 'Получено' 
                            : canClaim 
                            ? 'Получить' 
                            : 'В процессе'
                          }
                        </button>
                        
                        <div className="quest-reward-value" style={{ color: rewardConfig.color }}>
                          <img 
                            src={rewardConfig.icon} 
                            alt={rewardConfig.currency} 
                            className="quest-gold-icon"
                          />
                          {reward}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestsModal; 