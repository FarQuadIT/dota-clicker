/**
 * Система управления звуками в игре Dota Clicker
 * 
 * Функциональность:
 * 1. Загрузка и кеширование звуковых файлов
 * 2. Воспроизведение звуков с возможностью случайного выбора
 * 3. Управление громкостью и отключением звука
 * 4. Сохранение настроек в localStorage
 * 5. Управление одновременными звуками
 * 
 * Основано на звуках из старого проекта
 */

// ==================================================================================
// ВРЕМЕННОЕ ОТКЛЮЧЕНИЕ ЗВУКОВ ДЛЯ ОПТИМИЗАЦИИ
// ==================================================================================
const DISABLE_SOUNDS = true; // 🔇 ИЗМЕНИ НА false ЧТОБЫ ВКЛЮЧИТЬ ЗВУКИ ОБРАТНО

export interface AudioSettings {
  volume: number;
  isMuted: boolean;
}

export interface SoundGroup {
  name: string;
  sounds: HTMLAudioElement[];
}

/**
 * Менеджер звуков
 */
export class AudioManager {
  private static instance: AudioManager;
  
  // Карта звуков: ключ -> массив звуков (для случайного выбора)
  private sounds: Map<string, HTMLAudioElement[]> = new Map();
  
  // Настройки звука
  private settings: AudioSettings = {
    volume: 0.5,
    isMuted: false
  };
  
  // Активные звуки для управления
  private activeSounds: HTMLAudioElement[] = [];
  
  // Лимит одновременных звуков
  private maxSimultaneousSounds: number = 8;
  
  // Ключ для сохранения настроек
  private readonly SETTINGS_KEY = 'dota_clicker_audio_settings';
  
  // Флаг инициализации
  private isInitialized: boolean = false;
  
  // Флаг паузы игры (для блокировки игровых звуков)
  private isGamePaused: boolean = false;

  /**
   * Флаг пользовательского взаимодействия для разблокировки звуков
   */
  private hasUserInteracted: boolean = false;
  
  // Таймер для автоматической очистки звуков
  private cleanupTimer: number | null = null;

  /**
   * Синглтон для глобального доступа
   */
  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Конструктор (приватный для синглтона)
   */
  private constructor() {
    this.loadAudioSettings();
  }

  // ==================================================================================
  // ИНИЦИАЛИЗАЦИЯ
  // ==================================================================================

  /**
   * Инициализация звуковой системы
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    // 🔇 ОТКЛЮЧЕНИЕ ЗВУКОВ ДЛЯ ОПТИМИЗАЦИИ
    if (DISABLE_SOUNDS) {
      console.log('🔇 Загрузка звуков ОТКЛЮЧЕНА для оптимизации');
      this.isInitialized = true;
      return;
    }
    
    console.log('🎵 Инициализация звуковой системы...');
    
    try {
      // Загружаем все звуки
      await this.loadAllSounds();
      
      this.isInitialized = true;
      
      // Запускаем автоматическую очистку завершенных звуков
      this.startAutomaticCleanup();
      
      // Предзагружаем критичные звуки для лучшей производительности
      this.preloadCriticalSounds();
      
      console.log('✅ Звуковая система инициализирована');
    } catch (error) {
      console.error('❌ Ошибка инициализации звуковой системы:', error);
    }
  }

  /**
   * Загрузка всех звуков из плана
   */
  private async loadAllSounds(): Promise<void> {
    // 🔇 БЛОКИРОВКА ЗАГРУЗКИ ЗВУКОВ
    if (DISABLE_SOUNDS) {
      console.log('🔇 Загрузка звуков заблокирована флагом DISABLE_SOUNDS');
      return;
    }
    
    const loadPromises: Promise<void>[] = [];
    
    // Звуки героя
    loadPromises.push(this.loadSoundArray('hero_attack', '/media/game/sounds/heroes/juggernaut/attack/jugger_attack_', 6));
    loadPromises.push(this.loadSound('hero_run', '/media/game/sounds/heroes/juggernaut/run/Jugger_run.mp3'));
    
    // Звуки крипов (индексы файлов начинаются с 1)
    loadPromises.push(this.loadSoundArrayStartingFrom1('creep_attack_start', '/media/game/sounds/creeps/attack/attack_start_', 8));
    loadPromises.push(this.loadSoundArrayStartingFrom1('creep_attack_end', '/media/game/sounds/creeps/attack/attack_end_', 12));
    
    // Звуки смерти крипов (именованные файлы)
    loadPromises.push(this.loadSound('creep_death_dire', '/media/game/sounds/creeps/death/dire_creep_death.mp3'));
    loadPromises.push(this.loadSound('creep_death_medved', '/media/game/sounds/creeps/death/medved_death.mp3'));
    loadPromises.push(this.loadSound('creep_death_satyr', '/media/game/sounds/creeps/death/satyr_death.mp3'));
    loadPromises.push(this.loadSound('creep_death_shishka', '/media/game/sounds/creeps/death/shishka_death.mp3'));
    loadPromises.push(this.loadSound('creep_death_voul', '/media/game/sounds/creeps/death/voul_death.mp3'));
    loadPromises.push(this.loadSound('creep_death_wolf', '/media/game/sounds/creeps/death/wolf_death.mp3'));
    
    // Звуки магазина
    loadPromises.push(this.loadSound('shop_buy', '/media/shop/sounds/buy.wav'));
    loadPromises.push(this.loadSound('shop_category', '/media/shop/sounds/category.wav'));
    
    // Звуки UI
    loadPromises.push(this.loadSound('ui_click', '/media/main/sounds/click.wav'));
    loadPromises.push(this.loadSound('open_modal', '/media/interface_sounds/open_modal.mpeg'));
    loadPromises.push(this.loadSound('purchase_failed', '/media/shop/sounds/nonono.mpeg'));
    
    // Звуки событий уровня
    loadPromises.push(this.loadSound('level_up', '/media/game/sounds/events/LVL_UP.mpeg'));
    loadPromises.push(this.loadSound('rank_up', '/media/game/sounds/events/RANK_UP.mpeg'));
    
    // Ждем загрузки всех звуков
    await Promise.all(loadPromises);
    
    console.log(`✅ Загружено ${this.sounds.size} групп звуков`);
  }

  // ==================================================================================
  // ЗАГРУЗКА ЗВУКОВ
  // ==================================================================================

  /**
   * Загрузка одного звука
   */
  public async loadSound(key: string, path: string): Promise<void> {
    try {
      const audio = new Audio();
      
      // Промис для ожидания загрузки
      const loadPromise = new Promise<void>((resolve, reject) => {
        audio.addEventListener('canplaythrough', () => resolve());
        audio.addEventListener('error', (error) => reject(error));
      });
      
      // Начинаем загрузку
      audio.src = path;
      audio.preload = 'auto';
      
      // Ждем загрузки
      await loadPromise;
      
      // Настраиваем звук
      this.configureSoundElement(audio);
      
      // Сохраняем в карту
      this.sounds.set(key, [audio]);
      
      console.log(`✅ Загружен звук: ${key}`);
    } catch (error) {
      console.warn(`⚠️ Ошибка загрузки звука ${key}:`, error);
    }
  }

  /**
   * Загрузка массива звуков с числовыми индексами (начиная с 0)
   */
  public async loadSoundArray(key: string, basePath: string, count: number): Promise<void> {
    const sounds: HTMLAudioElement[] = [];
    const loadPromises: Promise<void>[] = [];
    
    for (let i = 0; i < count; i++) {
      const path = `${basePath}${i}.mp3`;
      
      const loadPromise = this.loadSingleSoundForArray(path).then(audio => {
        if (audio) {
          sounds[i] = audio;
        }
      });
      
      loadPromises.push(loadPromise);
    }
    
    await Promise.all(loadPromises);
    
    // Фильтруем загруженные звуки
    const validSounds = sounds.filter(s => s !== undefined);
    
    if (validSounds.length > 0) {
      this.sounds.set(key, validSounds);
      console.log(`✅ Загружено ${validSounds.length} звуков для ${key}`);
    } else {
      console.warn(`⚠️ Не удалось загрузить звуки для ${key}`);
    }
  }

  /**
   * Загрузка массива звуков с числовыми индексами (начиная с 1)
   */
  public async loadSoundArrayStartingFrom1(key: string, basePath: string, count: number): Promise<void> {
    const sounds: HTMLAudioElement[] = [];
    const loadPromises: Promise<void>[] = [];
    
    for (let i = 1; i <= count; i++) {
      const path = `${basePath}${i}.mp3`;
      
      const loadPromise = this.loadSingleSoundForArray(path).then(audio => {
        if (audio) {
          sounds[i - 1] = audio; // Сохраняем в массив начиная с индекса 0
        }
      });
      
      loadPromises.push(loadPromise);
    }
    
    await Promise.all(loadPromises);
    
    // Фильтруем загруженные звуки
    const validSounds = sounds.filter(s => s !== undefined);
    
    if (validSounds.length > 0) {
      this.sounds.set(key, validSounds);
      console.log(`✅ Загружено ${validSounds.length} звуков для ${key} (индексы 1-${count})`);
    } else {
      console.warn(`⚠️ Не удалось загрузить звуки для ${key}`);
    }
  }

  /**
   * Загрузка одного звука для массива
   */
  private async loadSingleSoundForArray(path: string): Promise<HTMLAudioElement | null> {
    try {
      const audio = new Audio();
      
      const loadPromise = new Promise<HTMLAudioElement>((resolve, reject) => {
        audio.addEventListener('canplaythrough', () => resolve(audio));
        audio.addEventListener('error', (error) => reject(error));
      });
      
      audio.src = path;
      audio.preload = 'auto';
      
      const loadedAudio = await loadPromise;
      this.configureSoundElement(loadedAudio);
      
      return loadedAudio;
    } catch (error) {
      console.warn(`⚠️ Ошибка загрузки звука ${path}:`, error);
      return null;
    }
  }

  /**
   * Настройка элемента звука
   */
  private configureSoundElement(audio: HTMLAudioElement): void {
    // Применяем текущие настройки
    audio.volume = this.settings.isMuted ? 0 : this.settings.volume;
    
    // Настройки для оптимизации
    audio.preload = 'auto';
  }

  // ==================================================================================
  // ВОСПРОИЗВЕДЕНИЕ ЗВУКОВ
  // ==================================================================================

  /**
   * Воспроизведение звука
   */
  public playSound(key: string, loop: boolean = false): void {
    // 🔇 БЛОКИРОВКА ВОСПРОИЗВЕДЕНИЯ ЗВУКОВ
    if (DISABLE_SOUNDS) return;
    
    if (!this.isAudioSupported() || this.settings.isMuted) return;
    
    // Проверяем инициализацию AudioManager
    if (!this.isInitialized) {
      console.warn(`⚠️ AudioManager еще не инициализирован, пропускаем звук: ${key}`);
      return;
    }
    
    // Проверяем пользовательское взаимодействие
    if (!this.hasUserInteracted) {
      console.warn(`⚠️ Пользователь еще не взаимодействовал с документом, пропускаем звук: ${key}`);
      return;
    }
    
    // ИСПРАВЛЕНИЕ: Проверяем паузу только для игровых звуков
    // Системные звуки (UI) воспроизводятся всегда
    if (this.isGamePaused && this.isGameSound(key)) {
      return; // Не воспроизводим игровые звуки если игра на паузе
    }
    
    const soundArray = this.sounds.get(key);
    if (!soundArray || soundArray.length === 0) {
      console.warn(`⚠️ Звук не найден: ${key}`);
      return;
    }
    
    try {
      // Берем первый звук из массива
      const audio = soundArray[0];
      
      // Проверяем лимит одновременных звуков
      if (this.activeSounds.length >= this.maxSimultaneousSounds) {
        this.cleanupFinishedSounds();
      }
      
      // Настраиваем звук
      audio.loop = loop;
      audio.currentTime = 0;
      audio.volume = this.settings.volume;
      
      // Воспроизводим
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn(`⚠️ Ошибка воспроизведения звука ${key}:`, error);
        });
      }
      
      // Добавляем в активные звуки
      this.activeSounds.push(audio);
      
      // Удаляем из активных после завершения
      if (!loop) {
        audio.addEventListener('ended', () => {
          this.removeFromActiveSounds(audio);
        }, { once: true });
      }
      
    } catch (error) {
      console.warn(`⚠️ Ошибка воспроизведения звука ${key}:`, error);
    }
  }

  /**
   * Воспроизведение случайного звука из массива
   */
  public playRandomSound(key: string): void {
    // 🔇 БЛОКИРОВКА ВОСПРОИЗВЕДЕНИЯ ЗВУКОВ
    if (DISABLE_SOUNDS) return;
    
    if (!this.isAudioSupported() || this.settings.isMuted) return;
    
    // Проверяем инициализацию AudioManager
    if (!this.isInitialized) {
      console.warn(`⚠️ AudioManager еще не инициализирован, пропускаем звук: ${key}`);
      return;
    }
    
    // Проверяем пользовательское взаимодействие
    if (!this.hasUserInteracted) {
      console.warn(`⚠️ Пользователь еще не взаимодействовал с документом, пропускаем звук: ${key}`);
      return;
    }
    
    // ИСПРАВЛЕНИЕ: Проверяем паузу только для игровых звуков
    // Системные звуки (UI) воспроизводятся всегда
    if (this.isGamePaused && this.isGameSound(key)) {
      return; // Не воспроизводим игровые звуки если игра на паузе
    }
    
    const soundArray = this.sounds.get(key);
    if (!soundArray || soundArray.length === 0) {
      console.warn(`⚠️ Звук не найден: ${key}`);
      return;
    }
    
    try {
      // Выбираем случайный звук
      const randomIndex = Math.floor(Math.random() * soundArray.length);
      const audio = soundArray[randomIndex];
      
      // Проверяем лимит одновременных звуков
      if (this.activeSounds.length >= this.maxSimultaneousSounds) {
        this.cleanupFinishedSounds();
      }
      
      // Настраиваем звук
      audio.currentTime = 0;
      audio.volume = this.settings.volume;
      
      // Воспроизводим
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn(`⚠️ Ошибка воспроизведения случайного звука ${key}:`, error);
        });
      }
      
      // Добавляем в активные звуки
      this.activeSounds.push(audio);
      
      // Удаляем из активных после завершения
      audio.addEventListener('ended', () => {
        this.removeFromActiveSounds(audio);
      }, { once: true });
      
    } catch (error) {
      console.warn(`⚠️ Ошибка воспроизведения случайного звука ${key}:`, error);
    }
  }

  /**
   * Остановка звука
   */
  public stopSound(key: string): void {
    const soundArray = this.sounds.get(key);
    if (!soundArray) return;
    
    soundArray.forEach(audio => {
      try {
        audio.pause();
        audio.currentTime = 0;
        this.removeFromActiveSounds(audio);
      } catch (error) {
        console.warn(`⚠️ Ошибка остановки звука ${key}:`, error);
      }
    });
  }

  /**
   * Остановка всех звуков
   */
  public stopAllSounds(): void {
    this.activeSounds.forEach(audio => {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (error) {
        console.warn('⚠️ Ошибка остановки звука:', error);
      }
    });
    
    this.activeSounds = [];
  }

  /**
   * Пауза всех звуков
   */
  public pauseAllSounds(): void {
    this.activeSounds.forEach(audio => {
      try {
        audio.pause();
      } catch (error) {
        console.warn('⚠️ Ошибка паузы звука:', error);
      }
    });
  }

  /**
   * Возобновление всех звуков
   */
  public resumeAllSounds(): void {
    this.activeSounds.forEach(audio => {
      try {
        if (audio.paused) {
          audio.play();
        }
      } catch (error) {
        console.warn('⚠️ Ошибка возобновления звука:', error);
      }
    });
  }

  // ==================================================================================
  // УПРАВЛЕНИЕ ПАУЗОЙ ИГРЫ
  // ==================================================================================

  /**
   * Установка состояния паузы игры
   */
  public setGamePaused(paused: boolean): void {
    this.isGamePaused = paused;
    
    if (paused) {
      this.pauseGameSounds();
    } else {
      this.resumeGameSounds();
    }
  }

  /**
   * Получение состояния паузы игры
   */
  public isGamePausedState(): boolean {
    return this.isGamePaused;
  }

  /**
   * Проверка готовности AudioManager
   */
  public isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Обработка первого пользовательского взаимодействия
   * Разблокирует возможность воспроизведения звуков
   */
  public onUserInteraction(): void {
    if (this.hasUserInteracted) return;
    
    this.hasUserInteracted = true;
    console.log('🎵 Пользователь взаимодействовал с документом - звуки разблокированы');
    
    // Пытаемся воспроизвести тишину для разблокировки аудио контекста
    this.unlockAudioContext();
  }

  /**
   * Разблокировка аудио контекста через воспроизведение тишины
   */
  private unlockAudioContext(): void {
    try {
      // Создаем временный аудио элемент с тишиной
      const silentAudio = new Audio();
      silentAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
      silentAudio.volume = 0;
      
      const playPromise = silentAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Игнорируем ошибки при разблокировке
        });
      }
    } catch (error) {
      // Игнорируем ошибки при разблокировке
    }
  }

  /**
   * Пауза только игровых звуков (исключая системные звуки)
   */
  public pauseGameSounds(): void {
    // ИСПРАВЛЕНИЕ: Используем новый метод isGameSound для определения игровых звуков
    this.activeSounds.forEach(audio => {
      try {
        // Проверяем, является ли звук игровым по его типу
        let isGameSound = false;
        
        // Проходим по всем игровым звукам и проверяем, принадлежит ли аудио к ним
        this.sounds.forEach((soundArray, key) => {
          if (this.isGameSound(key) && soundArray.includes(audio)) {
            isGameSound = true;
          }
        });
        
        if (isGameSound) {
          audio.pause();
        }
      } catch (error) {
        console.warn('⚠️ Ошибка паузы игрового звука:', error);
      }
    });
  }

  /**
   * Возобновление игровых звуков (если игра не на паузе)
   */
  public resumeGameSounds(): void {
    if (this.isGamePaused) return; // Не возобновляем если игра на паузе
    
    // ИСПРАВЛЕНИЕ: Используем новый метод isGameSound для определения игровых звуков
    this.activeSounds.forEach(audio => {
      try {
        // Проверяем, является ли звук игровым по его типу
        let isGameSound = false;
        
        // Проходим по всем игровым звукам и проверяем, принадлежит ли аудио к ним
        this.sounds.forEach((soundArray, key) => {
          if (this.isGameSound(key) && soundArray.includes(audio)) {
            isGameSound = true;
          }
        });
        
        if (isGameSound && audio.paused) {
          audio.play();
        }
      } catch (error) {
        console.warn('⚠️ Ошибка возобновления игрового звука:', error);
      }
    });
  }

  // ==================================================================================
  // УПРАВЛЕНИЕ НАСТРОЙКАМИ
  // ==================================================================================

  /**
   * Установка громкости
   */
  public setVolume(volume: number): void {
    this.settings.volume = Math.max(0, Math.min(1, volume));
    
    // Применяем ко всем звукам
    this.sounds.forEach(soundArray => {
      soundArray.forEach(audio => {
        audio.volume = this.settings.isMuted ? 0 : this.settings.volume;
      });
    });
    
    this.saveAudioSettings();
  }

  /**
   * Получение текущей громкости
   */
  public getVolume(): number {
    return this.settings.volume;
  }

  /**
   * Установка режима без звука
   */
  public setMuted(muted: boolean): void {
    this.settings.isMuted = muted;
    
    // Применяем ко всем звукам
    this.sounds.forEach(soundArray => {
      soundArray.forEach(audio => {
        audio.volume = muted ? 0 : this.settings.volume;
      });
    });
    
    if (muted) {
      this.stopAllSounds();
    }
    
    this.saveAudioSettings();
  }

  /**
   * Получение состояния без звука
   */
  public getMuted(): boolean {
    return this.settings.isMuted;
  }

  /**
   * Получение настроек
   */
  public getSettings(): AudioSettings {
    return { ...this.settings };
  }

  // ==================================================================================
  // СОХРАНЕНИЕ НАСТРОЕК
  // ==================================================================================

  /**
   * Сохранение настроек в localStorage
   */
  public saveAudioSettings(): void {
    try {
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.warn('⚠️ Ошибка сохранения настроек звука:', error);
    }
  }

  /**
   * Загрузка настроек из localStorage
   */
  public loadAudioSettings(): void {
    try {
      const stored = localStorage.getItem(this.SETTINGS_KEY);
      if (stored) {
        const settings = JSON.parse(stored);
        this.settings = {
          volume: typeof settings.volume === 'number' ? settings.volume : 0.5,
          isMuted: typeof settings.isMuted === 'boolean' ? settings.isMuted : false
        };
      }
    } catch (error) {
      console.warn('⚠️ Ошибка загрузки настроек звука:', error);
    }
  }

  // ==================================================================================
  // УТИЛИТЫ
  // ==================================================================================

  /**
   * Очистка завершенных звуков
   */
  private cleanupFinishedSounds(): void {
    this.activeSounds = this.activeSounds.filter(audio => !audio.ended);
  }

  /**
   * Запуск автоматической очистки завершенных звуков
   */
  private startAutomaticCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    // Очищаем завершенные звуки каждые 5 секунд
    this.cleanupTimer = window.setInterval(() => {
      this.cleanupFinishedSounds();
    }, 5000);
  }

  /**
   * Остановка автоматической очистки
   */
  private stopAutomaticCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Предзагрузка критичных звуков для немедленного воспроизведения
   */
  public preloadCriticalSounds(): void {
    const criticalSounds = ['hero_attack', 'hero_run', 'ui_click', 'open_modal', 'purchase_failed', 'level_up', 'rank_up'];
    
    criticalSounds.forEach(soundKey => {
      const soundArray = this.sounds.get(soundKey);
      if (soundArray && soundArray.length > 0) {
        soundArray.forEach(audio => {
          try {
            // Создаем промис загрузки если еще не загружен
            if (audio.readyState < 2) {
              audio.load();
            }
          } catch (error) {
            console.warn(`⚠️ Ошибка предзагрузки звука ${soundKey}:`, error);
          }
        });
      }
    });
  }

  /**
   * Удаление звука из активных
   */
  private removeFromActiveSounds(audio: HTMLAudioElement): void {
    const index = this.activeSounds.indexOf(audio);
    if (index > -1) {
      this.activeSounds.splice(index, 1);
    }
  }

  /**
   * Проверка поддержки аудио
   */
  private isAudioSupported(): boolean {
    return typeof Audio !== 'undefined';
  }

  /**
   * Проверка, является ли звук игровым (не фоновая музыка)
   */
  private isGameSound(key: string): boolean {
    // ИСПРАВЛЕНИЕ: Только звуки связанные с игровым процессом
    // UI звуки должны воспроизводиться всегда, даже при паузе
    const gameSoundTypes = [
      'hero_attack', 'hero_run',
      'creep_attack_start', 'creep_attack_end',
      'creep_death_dire', 'creep_death_medved', 'creep_death_satyr',
      'creep_death_shishka', 'creep_death_voul', 'creep_death_wolf',
      'level_up', 'rank_up'
    ];
    
    return gameSoundTypes.includes(key);
  }

  /**
   * Проверка, является ли звук системным (UI звуки, которые воспроизводятся всегда)
   */
  private isSystemSound(key: string): boolean {
    const systemSoundTypes = [
      'ui_click', 'open_modal', 'purchase_failed', 'shop_buy', 'shop_category'
    ];
    
    return systemSoundTypes.includes(key);
  }

  /**
   * Сброс состояния паузы игры (используется при выходе из игры)
   */
  public resetGamePause(): void {
    this.isGamePaused = false;
    console.log('🎵 Состояние паузы игры сброшено');
  }

  /**
   * Получение информации о загруженных звуках
   */
  public getDebugInfo(): object {
    const info: any = {
      isInitialized: this.isInitialized,
      settings: this.settings,
      totalSoundGroups: this.sounds.size,
      activeSounds: this.activeSounds.length,
      maxSimultaneousSounds: this.maxSimultaneousSounds,
      soundGroups: {}
    };
    
    this.sounds.forEach((soundArray, key) => {
      info.soundGroups[key] = soundArray.length;
    });
    
    return info;
  }

  // ==================================================================================
  // СПЕЦИАЛЬНЫЕ МЕТОДЫ ДЛЯ КРИПОВ
  // ==================================================================================

  /**
   * Воспроизведение звука смерти крипа по типу
   */
  public playCreepDeathSound(creepType: string): void {
    // Не воспроизводим звуки крипов если игра на паузе
    if (this.isGamePaused) return;
    
    // Маппинг типов крипов на звуки
    const creepSoundMapping: Record<string, string> = {
      'direCreep': 'creep_death_dire',
      'medved': 'creep_death_medved',
      'satyr': 'creep_death_satyr',
      'shishka': 'creep_death_shishka',
      'voul': 'creep_death_voul',
      'wolf': 'creep_death_wolf'
    };
    
    const soundKey = creepSoundMapping[creepType];
    if (soundKey) {
      this.playSound(soundKey);
    } else {
      console.warn(`⚠️ Звук смерти не найден для крипа: ${creepType}`);
    }
  }

  // ==================================================================================
  // ГЛОБАЛЬНЫЕ МЕТОДЫ
  // ==================================================================================

  /**
   * Уничтожение менеджера звуков
   */
  public destroy(): void {
    this.stopAllSounds();
    this.stopAutomaticCleanup();
    this.sounds.clear();
    this.activeSounds = [];
    this.isInitialized = false;
  }
}

// Создаем глобальный экземпляр для удобства
export const audioManager = AudioManager.getInstance();

// Глобальная функция для отладки в консоли
(window as any).audioManager = audioManager;
