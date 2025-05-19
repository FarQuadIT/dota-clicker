import { fetchHeroData, fetchItemData, updateGold } from "/front1/getData.js";
export let gold = 0; // Начальное количество золота
export let userId = 737;
export let heroId = 1;
export let passiveIncome = 0; // Золото в секунду
export let volume = 0.2;
export let defaultVolume = volume;
let incomeIntervalStarted = false; // Флаг для контроля интервала

export function returnGold() {
    return gold
}

export function changeGold(value) {
    gold = Number((gold + value).toFixed(2));
}
export function changePassiveIncome(value) {
    passiveIncome = Number((passiveIncome + value).toFixed(2));
}
function startPassiveIncomeGeneration() {
    if (!incomeIntervalStarted) {
        setInterval(() => generatePassiveIncome(), 1000); // Генерация золота каждую секунду
        incomeIntervalStarted = true; // Устанавливаем флаг
    }
}

// Функция для обновления отображения золота
export function updateGoldDisplay(goldDisplayed) {
    gold = goldDisplayed
    const goldAmountElement = document.getElementById("gold-amount");
    if (goldAmountElement) {
        goldAmountElement.textContent = goldDisplayed;
    }
}

// Функция для отображения пассивного дохода
export function updatePassiveIncomeDisplay() {
    const passiveIncomeElement = document.getElementById("passive-income");
    if (passiveIncomeElement) {
        passiveIncomeElement.innerHTML = `
            ${passiveIncome} <img src="/media/shop/main/gold.png" alt="Золото" width="12px" height="12px"></img>/сек 
        `;
    }
}

// Функция для генерации пассивного дохода
function generatePassiveIncome() {
    gold = Number((gold + passiveIncome).toFixed(2));
    updateGoldDisplay(gold);
    
}


// Функция для работы с footer
function setupFooterNavigation(dependencies) {
    console.log("Настраиваем обработчики для footer.");

    // Функция для динамической загрузки контента
    async function loadContent(targetPage, dependencies = {}) {
        const { initializeShopFeatures, initializeCanvas,} = dependencies
        try {
            // querySelectorAll(".tabbar li[data-where]").classList.add("active");
            const response = await fetch(targetPage);
            if (!response.ok) throw new Error(`Ошибка загрузки страницы: ${targetPage}`);
            const html = await response.text();

            // Извлекаем содержимое main
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = html;
            const newMainContent = tempDiv.querySelector("main");
            if (newMainContent) {
                document.querySelector("main").innerHTML = newMainContent.innerHTML;
            }

            // Вызываем нужные функции для загруженной страницы
            if (targetPage === "/front1/shop/shop.html" && initializeShopFeatures) {
               await initializeShopFeatures();
            } else if (targetPage === "/front1/main.html") {
                // updateGoldDisplay(dependencies.userData.coins);
                // updatePassiveIncomeDisplay(dependencies.userData.currentIncome);
            }
            else if (targetPage === "/front1/game/index.html" && initializeCanvas){
               await initializeCanvas();
            }
        } catch (error) {
            console.error(error);
        }
    }
    async function closeGame() {
        try {
            const { endGame } = await import('/front1/game/game.js');
            endGame();
            
        } catch (error) {
            console.error("Ошибка при попытке закончить игру:", error);
        }
    }
    // Добавляем обработчики кликов
    document.querySelectorAll(".tabbar li[data-where]").forEach((item) => {
        item.addEventListener("click", async (e) => {
            await closeGame();
            const tabSound = new Audio('/media/main/sounds/click.wav')
            tabSound.volume = volume
            tabSound.play();
            e.preventDefault();
            const target = item.getAttribute("data-where");

            // Удаляем активный класс со всех элементов
            document.querySelectorAll(".tabbar li").forEach((li) => li.classList.remove("active"));
            // Устанавливаем активный класс на текущий элемент
            item.classList.add("active");

            // Динамически загружаем контент в main
            if (target === "shop") {
                await loadContent("/front1/shop/shop.html", dependencies);
            } else if (target === "main") {
                await loadContent("/front1/main.html", dependencies);
            }
            else if (target === "upgrade") {
                await loadContent("/front1/game/index.html", dependencies);
            }
        });
    });
}

// Основная функция для загрузки header, footer и инициализации логики
async function loadHeaderAndFooterAndStart(dependencies) {
    try {
        // Загружаем header.html
        const headerResponse = await fetch("/front1/header.html");
        if (!headerResponse.ok) throw new Error("Ошибка загрузки header.html");
        const header = await headerResponse.text();
        document.getElementById("header").innerHTML = header;

        // Загружаем footer.html
        const footerResponse = await fetch("/front1/footer.html");
        if (!footerResponse.ok) throw new Error("Ошибка загрузки footer.html");
        const footer = await footerResponse.text();
        document.getElementById("footer").innerHTML = footer;

        console.log("Header и footer успешно загружены.");

        // Устанавливаем обработчики для footer
        setupFooterNavigation(dependencies);



        // Определяем текущую страницу
        const currentPage = window.location.pathname.split("/").pop();
        if (currentPage === "shop.html" && dependencies.initializeShopFeatures) {
            await dependencies.initializeShopFeatures();
        } else if (currentPage === "main.html") {
            updateGoldDisplay(gold);
            updatePassiveIncomeDisplay();
        }
        else if (currentPage === "index.html" && dependencies.initializeCanvas) {
            await dependencies.initializeCanvas();
        }
        // Запускаем генерацию пассивного дохода
        startPassiveIncomeGeneration(gold, passiveIncome);
    } catch (error) {
        console.error("Ошибка загрузки header или footer:", error);
    }
}


// Начинаем выполнение после загрузки страницы
document.addEventListener("DOMContentLoaded", async () => {
    updateGold({'userId': userId, 'heroId': heroId})
    const userData = await fetchHeroData(userId, heroId);
    const itemData = await fetchItemData(userId, heroId);
    const { initializeCanvas } = await import('/front1/game/game.js');// Глобальная переменная для хранения золота и пассивного дохода
    const { initializeShopFeatures } = await import('/front1/shop/shop.js');// Глобальная переменная для хранения золота и пассивного дохода
    const { updateButtonStates } = await import('/front1/shop/shop.js')
    const dependencies = { initializeShopFeatures, initializeCanvas, userData};
    gold = userData.coins
    passiveIncome = userData.currentIncome
    loadHeaderAndFooterAndStart(dependencies);
    console.log("Footer script loaded");
    setInterval(() => {
        updateButtonStates(); // Убедимся, что состояние кнопок всегда актуально
    }, 500);
});
