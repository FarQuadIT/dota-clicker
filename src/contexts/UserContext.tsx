// src/contexts/UserContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchUserInfo, setUserName, selectStarterHero, type UserInfoResponse } from '../shared/api/apiService';
import { TEST_USER_ID } from '../shared/constants';

/**
 * Типы состояния пользователя в приложении
 */
export type UserStatus = 
  | 'loading'           // Проверяем статус пользователя
  | 'first_login'       // Новый пользователь - нужно имя + герой  
  | 'no_heroes'         // Есть имя, нужно выбрать героя
  | 'authenticated'     // Все настроено, можно играть
  | 'error';            // Ошибка загрузки

/**
 * Интерфейс данных пользователя
 */
export interface UserData {
  userName?: string;
  diamonds: number;
  enabledHeroes: number[];
  disabledHeroes: number[];
}

/**
 * Интерфейс контекста пользователя
 */
interface UserContextType {
  status: UserStatus;
  userData: UserData | null;
  
  // Методы для первого входа
  setUserNameAndCheck: (userName: string) => Promise<boolean>;
  selectHeroAndComplete: (heroId: number) => Promise<boolean>;
  
  // Методы для обновления данных
  refreshUserData: () => Promise<void>;
  updateUserData: (updates: Partial<UserData>) => void;
  
  // Проверки
  isHeroEnabled: (heroId: number) => boolean;
  isHeroDisabled: (heroId: number) => boolean;
}

const UserContext = createContext<UserContextType | null>(null);

/**
 * Провайдер пользовательского контекста
 */
export function UserProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<UserStatus>('loading');
  const [userData, setUserData] = useState<UserData | null>(null);

  /**
   * Инициализация - проверка статуса пользователя при запуске
   */
  useEffect(() => {
    checkUserStatus();
  }, []);

  /**
   * Проверка статуса пользователя
   */
  const checkUserStatus = async () => {
    try {
      setStatus('loading');
      
      const response = await fetchUserInfo(TEST_USER_ID);
      
      if (!response) {
        setStatus('error');
        return;
      }

      // Обработка разных типов ответа
      if (response.message === 'first_login') {
        setStatus('first_login');
        setUserData(null);
      } else if (response.message === 'no_heroes') {
        setStatus('no_heroes');
        setUserData({
          userName: response.user_name,
          diamonds: 0,
          enabledHeroes: [],
          disabledHeroes: []
        });
      } else {
        // Полные данные пользователя
        setStatus('authenticated');
        setUserData({
          userName: response.user_name,
          diamonds: response.user_diamonds ?? 0,
          enabledHeroes: response.enabled_heroes,
          disabledHeroes: response.disabled_heroes
        });
      }
    } catch (error) {
      console.error('❌ Ошибка при проверке статуса пользователя:', error);
      setStatus('error');
    }
  };

  /**
   * Установка имени пользователя и переход к выбору героя
   */
  const setUserNameAndCheck = async (userName: string): Promise<boolean> => {
    try {
      const success = await setUserName(TEST_USER_ID, userName);
      
      if (success) {
        // Обновляем локальное состояние и переходим к выбору героя
        setUserData({
          userName,
          diamonds: 0,
          enabledHeroes: [],
          disabledHeroes: []
        });
        setStatus('no_heroes');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Ошибка при установке имени:', error);
      return false;
    }
  };

  /**
   * Выбор героя и завершение первоначальной настройки
   */
  const selectHeroAndComplete = async (heroId: number): Promise<boolean> => {
    try {
      const success = await selectStarterHero(TEST_USER_ID, heroId);
      
      if (success) {
        // Обновляем данные и переходим в состояние "аутентифицирован"
        await refreshUserData();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Ошибка при выборе героя:', error);
      return false;
    }
  };

  /**
   * Обновление данных пользователя с сервера
   */
  const refreshUserData = async () => {
    await checkUserStatus();
  };

  /**
   * Локальное обновление данных пользователя
   */
  const updateUserData = (updates: Partial<UserData>) => {
    if (userData) {
      setUserData({ ...userData, ...updates });
    }
  };

  /**
   * Проверка доступности героя
   */
  const isHeroEnabled = (heroId: number): boolean => {
    return userData?.enabledHeroes.includes(heroId) ?? false;
  };

  /**
   * Проверка заблокированности героя
   */
  const isHeroDisabled = (heroId: number): boolean => {
    return userData?.disabledHeroes.includes(heroId) ?? false;
  };

  const contextValue: UserContextType = {
    status,
    userData,
    setUserNameAndCheck,
    selectHeroAndComplete,
    refreshUserData,
    updateUserData,
    isHeroEnabled,
    isHeroDisabled
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}

/**
 * Хук для использования пользовательского контекста
 */
export function useUser() {
  const context = useContext(UserContext);
  
  if (!context) {
    throw new Error('useUser должен использоваться внутри UserProvider');
  }
  
  return context;
}