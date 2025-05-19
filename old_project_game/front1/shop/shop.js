import {itemData} from '/front1/shop/shopConfig.js'
import {updateGoldDisplay, volume, userId} from '/front1/main.js'
import { getCachedHeroData, updateGold, getCachedItemData, updateItems} from "/front1/getData.js";
import {changeGold, passiveIncome,changePassiveIncome, updatePassiveIncomeDisplay, returnGold} from '/front1/main.js'
const categoryData = itemData['shopButtons']
const data = itemData['shopItems']
const buy_sound = new Audio('/media/shop/sounds/buy.wav')
const category_sound = new Audio('/media/shop/sounds/category.wav')
export let visibleMoney = 0
export let characteristics = {}; // Пустой объект для инициализации
export let gold = 0 //Вызвать из main.js функцию, возвращающую gold. Заменить ей все gold. Также вызвать функцию, менюящубю gold, чтобы не менять его вручную

async function initializeCharacteristics() {
    const data = getCachedHeroData(); // Запрашиваем данные из базы
    if (data) {
        // Инициализируем значения из базы
        characteristics = {
            "max-health": data.maxHealth || 3000,
            "health-regen": data.healthRegen || 1,
            "max-mana": data.maxEnergy || 10,
            "mana-regen": data.energyRegen || 1,
            "damage": data.damage || 1,
            "vampirism": data.vampirism || 0,
            "movement-speed": data.movementSpeed || 2,
            "income": data.currentIncome || 0,
            "heroId": data.heroId || 1,
        };
        gold = returnGold()
    } else {
        console.warn("Данные из базы не были загружены.");
    }
    console.log('characteristics инициализирована', characteristics)
}

export function updateButtonStates() {

    const buttons = document.querySelectorAll(".button-path");
    buttons.forEach(button => {
        const itemElement = button.closest(".item");
        const priceElement = itemElement.querySelector(".svg-container text");
        const price = parseInt(priceElement.textContent, 10);
        visibleMoney = document.getElementById("gold-amount").textContent
        if (!isNaN(price)) {
            if (visibleMoney >= price) {
                button.classList.remove("disabled");
                button.style.cursor = "pointer";
            } else {
                button.classList.add("disabled");
                button.style.cursor = "not-allowed";
            }
        }
    });
}

export async function initializeShopFeatures() {
        
        console.log("shop.js загружен и выполняется");
        await initializeCharacteristics()
        document.querySelectorAll('.upgrade-section').forEach(section => {
            section.style.overflowY = 'auto'; // Добавляем прокрутку для каждой секции
        });
        // Все ваши текущие функции и логика shop.js
        // Например, работа с характеристиками, обновление золота, кнопки и т.д.

    
    Object.entries(data).forEach(([section, items]) => {
        items.forEach((item) => {
            item.currentPrice = item.basePrice; // Устанавливаем начальную стоимость
        });
    });

    
    function getInfoFromDatabase(payload) {
        const queryParams = new URLSearchParams(payload).toString(); // Конвертируем объект в строку параметров
        fetch(`http://127.0.0.1:5000/hero_items?${queryParams}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error("Ошибка при отправке данных на сервер.");
            }
        })
        .then(data => {
            console.log("Данные успешно отправлены на сервер:", data);
        })
        .catch(error => {
            console.error("Ошибка при отправке данных:", error);
        });
    }


    function updateCharacteristicDisplay(category, value) {
        const characteristicElement = document.querySelector(".characteristic-stat span");
        if (characteristicElement && categoryData[category]) {
            const { icon, filter } = categoryData[category];
            characteristicElement.innerHTML = `
                ${value} 
                <img src="${icon}" alt="${category}" width="14px" height="14px" style="filter: ${filter};">
            `;
        }
    }
    

    function updateCategoryDisplay(category) {
        const categoryNameElement = document.querySelector(".characteristic-name span");
        const characteristicElement = document.querySelector(".characteristic-stat span");
    
        if (categoryData[category]) {
            const { name, icon, color, filter } = categoryData[category];
    
            // Обновляем текст названия
            if (categoryNameElement) {
                categoryNameElement.textContent = name;
                categoryNameElement.style.color = color; // Изменение цвета текста
            }
    
            // Обновляем иконку и стиль текста
            if (characteristicElement) {
                const value = characteristics[category] || 0;
                characteristicElement.innerHTML = `
                    ${value} 
                    <img src="${icon}" alt="${name}" width="14px" height="14px" style="filter: ${filter};">
                `;
                characteristicElement.style.color = color; // Изменение цвета чисел
            }
        } else {
            console.warn(`Категория "${category}" не найдена в данных.`);
        }
    }
    
    function updateItemsDisplay(section) {
        const sectionElement = document.querySelector(`.spoiler-content [data-section="${section}"]`);
        const items = data[section];
    
        if (!sectionElement || !items) return;
    
        // Очищаем содержимое секции
        sectionElement.innerHTML = "";
    
        items.forEach((item, index) => {
            const clone = template.cloneNode(true);
    
            clone.querySelector(".icon-column img").src = item.img;
            clone.querySelector(".icon-column img").alt = item.title;
            clone.querySelector(".item-title").textContent = item.title;
            
            
            // Вычисляем следующее значение характеристики
            const currentValue = Number(characteristics[section]) || 0;
            const nextValue = Number((currentValue + item.baseValue).toFixed(2));
            const { icon, filter } = categoryData[section];
            
            // Устанавливаем текущий уровень в элемент уровня
            const itemLevelElement = clone.querySelector(".item-level");
            
            if (itemLevelElement) {
                itemLevelElement.textContent = `Ур. ${item.level}`;
            }
            // Создаём объединённый контент
            const combinedRow = `
            <span style="color: #20bc25;">+ ${item.baseValue}</span>
                <img src="${icon}" alt="Иконка статов" width="10px" height="10px" 
                     style="filter: ${filter};">
                <img src="/media/shop/main/Double_arrow_green_right.png" alt="Иконка стрелки" width="7px" height="7px">
                <span style="color: #20bc25;">${nextValue}</span>
                <img src="${icon}" alt="Иконка статов" width="10px" height="10px" 
                     style="filter: ${filter};">
            `;
            
            clone.querySelector(".stats-row").innerHTML = combinedRow;
    
            // Удаляем старый элемент level-row, если он больше не нужен
            const levelRow = clone.querySelector(".level-row");
            if (levelRow) {
                levelRow.remove();
            }
    
            const priceText = clone.querySelector(".svg-container text");
            if (priceText) {
                priceText.textContent = item.currentPrice;
            }
    
            sectionElement.appendChild(clone);
        });
    
        updateButtonStates(); // Обновляем состояние кнопок после рендера
    }
    
    

    const initialCategory = "max-health"; // Начальная категория
    updateCategoryDisplay(initialCategory); // Устанавливаем начальное состояние
    updateButtonStates();
    // Обновляем отображение при загрузке страницы
    // updateGoldDisplay(gold);
    updatePassiveIncomeDisplay(); // Отображаем начальный пассивный доход
    
    const template = document.getElementById("item-template").content;

    Object.entries(data).forEach(([section, items]) => {
        const sectionElement = document.querySelector(`.spoiler-content [data-section="${section}"]`);
        if (!sectionElement) {
            console.error(`Секция с data-section="${section}" не найдена.`);
            return;
        }

        items.forEach((item, index) => {
            const clone = template.cloneNode(true);

            // Уникальные ID для градиентов
            const gradientFillId = `gradient-fill-${section}-${index}`;
            const gradientStrokeId = `gradient-stroke-${section}-${index}`;

            // Обновляем ID градиентов
            const gradientFill = clone.querySelector("#gradient-fill-template");
            const gradientStroke = clone.querySelector("#gradient-stroke-template");
            if (gradientFill) gradientFill.setAttribute("id", gradientFillId);
            if (gradientStroke) gradientStroke.setAttribute("id", gradientStrokeId);

            // Обновляем ссылки на градиенты
            const buttonPath = clone.querySelector(".button-path");
            if (buttonPath) {
                buttonPath.setAttribute("fill", `url(#${gradientFillId})`);
                buttonPath.setAttribute("stroke", `url(#${gradientStrokeId})`);
            }
            
            // Заполняем данные предмета
            clone.querySelector(".icon-column img").src = item.img;
            clone.querySelector(".icon-column img").alt = item.title;
            clone.querySelector(".item-title").textContent = item.title;
            
            // Устанавливаем текущий уровень в элемент уровня
            const itemLevelElement = clone.querySelector(".item-level");
            if (itemLevelElement) {
                itemLevelElement.textContent = `Ур. ${item.level}`;
            }

            // Вычисляем значение следующей характеристики
            const currentValue = section === "income" ? passiveIncome : characteristics[section] || 0;
            const nextValue = Number((currentValue + item.baseValue).toFixed(2));
            const { icon, color, filter } = categoryData[section];
            const combinedRow = `
                <span style="color: #20bc25;">+ ${item.baseValue}</span>
                <img src="${icon}" alt="Иконка статов" width="10px" height="10px" 
                     style="filter: ${filter};">
                <img src="/media/shop/main/Double_arrow_green_right.png" alt="Иконка стрелки" width="7px" height="7px">
                <span style="color: #20bc25;">${nextValue}</span>
                <img src="${icon}" alt="Иконка статов" width="10px" height="10px" 
                     style="filter: ${filter};">
            `;
            
            clone.querySelector(".stats-row").innerHTML = combinedRow;
    
            // Удаляем старый элемент level-row, если он больше не нужен
            const levelRow = clone.querySelector(".level-row");
            if (levelRow) {
                levelRow.remove();
            }
        
            const priceText = clone.querySelector(".svg-container text");
            if (priceText) {
                priceText.textContent = item.currentPrice; // Используем текущую стоимость
            }

            sectionElement.appendChild(clone);
        });
    });


    
    document.addEventListener("click", event => {
        let buttonPath = event.target.closest(".button-path");
        
        // Если клик был по тексту или изображению внутри кнопки
        if (!buttonPath) {
            const svgButton = event.target.closest("svg.button");
            if (svgButton) {
                buttonPath = svgButton.querySelector(".button-path");
            }
        }



        // Проверяем, что кнопка найдена и активна
        if (buttonPath && !buttonPath.classList.contains("disabled")) {
            const itemElement = buttonPath.closest(".item");
            // Проверяем, существует ли itemElement
            if (!itemElement) {
                console.warn("Элемент .item не найден для нажатой кнопки.");
                return; // Выходим из функции
            }
            buy_sound.volume = volume
            buy_sound.currentTime = 0
            buy_sound.play();
            const upgradeSection = itemElement.closest(".upgrade-section");
            if (!upgradeSection) {
                console.warn("Элемент .upgrade-section не найден для itemElement:", itemElement);
                return; // Выходим из функции
            }

            const section = itemElement.closest(".upgrade-section").getAttribute("data-section");
            if (!section) {
                console.warn("Атрибут data-section отсутствует в .upgrade-section.");
                return; // Выходим из функции
            }
    
            const itemIndex = Array.from(itemElement.parentElement.children).indexOf(itemElement);
            const itemData = data[section][itemIndex];


    
            const priceElement = itemElement.querySelector(".svg-container text");
            const price = parseInt(priceElement.textContent, 10);
    
            if (!isNaN(price) ) {
                changeGold(-price)
                updateGoldDisplay(visibleMoney - price);
                
                if (section === "income") {
                    changePassiveIncome(itemData.baseValue); // Увеличиваем пассивный доход
                    updatePassiveIncomeDisplay(); // Обновляем отображение пассивного дохода
                    console.log(`Passive income increased: ${passiveIncome} gold/second`);
                }
                
                // Увеличение характеристик от предмета
                const nextValue = (itemData.baseValue + Number(characteristics[section])).toFixed(2);
                characteristics[section] = Number(nextValue)
                // Увеличиваем уровни предмета
                itemData.level += 1;

                // Увеличиваем стоимость предмета
                itemData.cost = itemData.currentPrice
                itemData.currentPrice = itemData.priceFormula(itemData.currentPrice);

               
            
                // Обновляем интерфейс секции
                updateItemsDisplay(section);
                updateCharacteristicDisplay(section, section === "income" ? passiveIncome : characteristics[section]);
                updateButtonStates();
                // **Отправляем данные на сервер**
                const payload = {
                    userId: userId,
                    itemId: itemData.id,
                    heroId: characteristics["heroId"],
                    currentLevel: itemData.level,
                    currentValue: characteristics[section],
                    cost: itemData.cost,
                    currentPrice: itemData.currentPrice,
                    currentIncome:characteristics["income"],
                    maxHealth: characteristics["max-health"],
                    healthRegen: characteristics["health-regen"],
                    maxEnergy: characteristics["max-mana"],
                    energyRegen: characteristics["mana-regen"],
                    damage: characteristics["damage"],
                    income: characteristics["income"],
                    movementSpeed: characteristics["movement-speed"],
                    vampirism: characteristics["vampirism"],
                };
                console.log(payload, 'payload')
                updateItems(payload)
                // getInfoFromDatabase(getPayload);
            }
            
            
        }
    });
    
    
    // Инициализация состояний кнопок
    updateButtonStates();
    

    const buttons = document.querySelectorAll(".menu-item");
    const sections = document.querySelectorAll(".upgrade-section");

    buttons.forEach(button => {
        button.addEventListener("click", () => {
            const section = button.getAttribute("data-section");
            category_sound.volume = volume
            category_sound.play();
            // Обновляем отображение секций
            sections.forEach(sec => {
                sec.style.display = sec.getAttribute("data-section") === section ? "block" : "none";
            });
    
            // Обновляем текст и иконку
            updateCategoryDisplay(section);
        });
    });

    const ul = document.querySelector(".tab-style3 ul");

    const lis = ul.querySelectorAll("li");

    lis.forEach((li) => {
        li.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            const target = e.currentTarget;

            // Игнорируем клик по follow
            if (target.classList.contains("active") || target.classList.contains("follow")) {
            return;
            }

            // Удаляем активный класс со всех элементов
            lis.forEach((item) => item.classList.remove("active"));

            // Устанавливаем активный класс на текущий элемент
            target.classList.add("active");
        });
    });
    
    
};

