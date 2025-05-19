import { HeroFactory } from "/front1/game/heroes/heroFactory.js";
import { Background } from "/front1/game/background.js";
import { AssetsLoader } from "/front1/game/assetsLoader.js";
import { creepsConfig } from "/front1/game/creepData/creepsConfig.js";
import { CreepFactory } from "/front1/game/creepData/creepFactory.js";
let endGame = () => {
    console.warn("Игра не инициализирована. Невозможно остановить звуки.");
};
export let isGameRunning = true;
export let isPaused = false
export async function initializeCanvas() {
    const pauseControls = document.getElementById("pause-controls");
    const resumeButton = document.getElementById("resume1-button");
    const muteButton = document.getElementById("mute-button");
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    let isSoundMuted = false;

    // Установка размеров холста
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Создание экземпляров классов
    const assets = new AssetsLoader();
    const background = new Background(assets);
    background.setSpeed(canvas.width/200)
    let hero = new HeroFactory(assets, background).createHero('juggernaut');
    // Создаем фабрику крипов
    const creepFactory = new CreepFactory(assets, background);
    // Переменная для хранения текущего крипа
    let currentCreep;
    window.addEventListener("resize", () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        background.resize(canvas); // Обновляем размеры фона
        background.setSpeed(canvas.width/200)
    });
    
    assets.loadImages(() => {
        // Создаем первого крипа с помощью фабрики
        spawnNewCreep("defaultCreep");
        gameLoop();
    });

    // Функция для спауна нового крипа
    function generateUnlockedCreep(level){
        const indices = [];
        creepsConfig.forEach((creep, index) => {
            if (creep.unlockedLevel <= level) {
                indices.push(index);
            }
        });
        const randomCreep = creepsConfig[indices[Math.floor(Math.random() * indices.length)]].type
        return randomCreep
    }
    function spawnNewCreep(type) {
        if (type === "random") {
            type = generateUnlockedCreep(hero.level); // Берем тип случайного крипа
        }
        const creepNumber = currentCreep ? currentCreep.creepNumber : 1;
        const creepRank = currentCreep ? currentCreep.creepRank : 0;
        currentCreep = creepFactory.createCreep(type,creepRank, creepNumber);
        currentCreep.initialize(canvas);
        currentCreep.spawn(canvas);
    }

    let spawnProcess = null;
    let spamBlock = true;
    // Обработка кликов на холсте
    canvas.addEventListener("click", () => {
        console.log('click')
        hero.attack(background, currentCreep); // Атака Джаггернаута
        if (!currentCreep.isAlive && currentCreep.isDying && spamBlock) {
            spamBlock = false;
    
            // Запускаем процесс спауна с паузой
            spawnProcess = waitForTimeout(
                3000,
                () => {
                    spawnNewCreep("random");
                    spamBlock = true; // Сбрасываем блокировку
                },
                () => {
                    console.log("Спавн на паузе");
                }
            );
        }
    });

    // Главный игровой цикл
    function gameLoop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Очистка холста
        if (!isGameRunning) {
            return; // Прекращаем выполнение цикла
        }
        if (hero.health <= 0) {
            endGame(); // Завершаем игру, если здоровье равно 0
            return; // Останавливаем игровой цикл
        }

        background.draw(ctx, canvas); // Отрисовка фона
        currentCreep.draw(ctx,canvas, hero); // Отрисовка крипа
        const heroData = hero.draw(ctx, canvas, currentCreep, background); // Отрисовка Джаггернаута

        // Проверка столкновений и управление состоянием крипа
        if (!currentCreep.isDying) {
            let isColide = currentCreep.checkCollision(heroData);
            if (isColide && hero.currentAnimation != 'attack'){
                hero.currentAnimation = 'idle';
            }
        }

        requestAnimationFrame(gameLoop); // Рекурсивный вызов для следующего кадра
    }
    function pauseGame() {
        if (hero) {
            pauseControls.style.display = "flex";
            // gameCanvas.style.filter = "blur(5px)"; // Добавляем размытие игры для эффекта
        isGameRunning = false; // Останавливаем игровой цикл
        hero.stopSound();}

        // Показываем всплывающее окно
        // document.getElementById("pause-overlay").style.display = "flex";
    }
    function resumeGame() {
        console.log('continue')

        if (!isGameRunning){
            pauseControls.style.display = "none";
        isGameRunning = true; // Возобновляем игровой цикл
        isPaused = false
        hero.resumeSound();
        // Скрываем всплывающее окно
        // document.getElementById("pause-overlay").style.display = "none";
        gameLoop(); // Запускаем игровой цикл снова
        }
    }

    endGame = () => {
        console.log('endgame')
        isGameRunning = false; // Останавливаем игру
        background.setSpeed(0); // Останавливаем фон
        if (hero) {hero.stopSound(true);}
        canvas.remove();
        currentCreep = null;
        hero = null;
        
        // const gameOverScreen = document.getElementById("game-over-screen");
        // gameOverScreen.style.display = "flex";

        // Обработка клика на кнопку "Меню"
        // const menuButton = document.getElementById("menu-button");
        // menuButton.addEventListener("click", () => {
        //     window.location.href = "/front1/main.html"; // Перевод на страницу меню
        // });
    }
    document.getElementById("pause-button").addEventListener("click", () => {
        try {
        if (spawnProcess) spawnProcess.pause();
        if (hero.manaCooldown){
            hero.manaCooldown.pause()}
        // if (currentCreep.removeCreepProcess) currentCreep.removeCreepProcess.pause();
        pauseGame()}
        catch (error) {
            // console.log('Вызов атрибутов у обнуленных объектов из предыдущих сессий')
        };
    });
    document.getElementById("resume-button").addEventListener("click", () => {
        try {
        if (spawnProcess) spawnProcess.resume();
        if (hero.manaCooldown) hero.manaCooldown.resume();
        // if (currentCreep.removeCreepProcess) currentCreep.removeCreepProcess.resume();

        resumeGame()}
        catch (error) {
            // console.log('Вызов атрибутов у обнуленных объектов из предыдущих сессий')
        };
    });
    resumeButton.addEventListener("click", () => {
        try {
        if (spawnProcess) spawnProcess.resume();
        if (hero.manaCooldown) hero.manaCooldown.resume();
        // if (currentCreep.removeCreepProcess) currentCreep.removeCreepProcess.resume();

        resumeGame()}
        catch (error) {
            // console.log('Вызов атрибутов у обнуленных объектов из предыдущих сессий')
        };
    });
    muteButton.addEventListener("click", () => {
        isSoundMuted = !isSoundMuted;
        console.log(isSoundMuted ? "Звук выключен" : "Звук включен");
    
        // Логика управления звуком
        if (isSoundMuted) {
            hero.muteSound();
        } else {
            hero.unmuteSound();
        }
        muteButton.textContent = isSoundMuted ? "Включить звук" : "Выключить звук";
    });
    // // Пересчет размеров холста при изменении размеров окна
    // window.addEventListener("resize", () => {
    //     canvas.width = window.innerWidth;
    //     canvas.height = window.innerHeight;
    // });
}
export function waitForTimeout(timeout, callback, onPause = () => {}) {
    let steps = Math.ceil(timeout / 100);
    let currentStep = 0; // Текущий шаг
    let timeoutId = null; // Идентификатор текущего таймера
    function step() {
        if (isPaused) return; // Если пауза, не продолжаем выполнение

        currentStep++;
        if (currentStep >= 100) {
            callback(); // Выполняем основной коллбэк, если все шаги завершены
        } else {
            timeoutId = setTimeout(step, steps); // Переходим к следующему шагу
        }
    }

    // Функция для паузы
    function pause() {
        isPaused = true;
        clearTimeout(timeoutId); // Останавливаем текущий таймер
        onPause(); // Вызываем коллбэк для паузы, если он есть
    }

    // Функция для продолжения
    function resume() {
        if (isPaused) {
            isPaused = false;
            step(); // Возобновляем выполнение
        }
    }

    step(); // Запускаем процесс
    return { pause, resume }; // Возвращаем функции для управления
}

export { endGame };
