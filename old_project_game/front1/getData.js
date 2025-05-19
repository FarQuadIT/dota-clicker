
let cachedHeroData = null; // Переменная для хранения кэшированных данных героя
let cachedItemData = null; // Переменная для хранения кэшированных данных героя

export async function getHeroData(payload) {
    const queryParams = new URLSearchParams(payload).toString();
    try {
        const response = await fetch(`http://127.0.0.1:5000/hero_data?${queryParams}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });
        if (!response.ok) {
            throw new Error("Ошибка при получении данных с сервера.");
        }
        const data = await response.json();
        console.log("Данные успешно получены:", data);
        return data; // Возвращаем JSON-объект
    } catch (error) {
        console.error("Ошибка при получении данных:", error);
        return null; // Возвращаем null в случае ошибки
    }
}
// Асинхронная функция для загрузки данных из базы
export async function fetchHeroData(userId, heroId) {
    if (cachedHeroData) {
        console.log("Using cached hero data.");
        return cachedHeroData; // Если данные уже загружены, возвращаем их
    }

    const payload = { userId, heroId};
    try {
        cachedHeroData = await getHeroData(payload); // Запрашиваем данные из базы
        console.log("Hero data loaded:", cachedHeroData);
        return cachedHeroData;
    } catch (error) {
        console.error("Error loading hero data:", error);
        return null; // Возвращаем null в случае ошибки
    }
}

// Синхронная функция для доступа к кэшированным данным
export function getCachedHeroData() {
    return cachedHeroData; // Возвращаем кэшированные данные
}


export async function getItemData(payload) {
    const queryParams = new URLSearchParams(payload).toString();
    try {
        const response = await fetch(`http://127.0.0.1:5000/hero_items?${queryParams}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });
        if (!response.ok) {
            throw new Error("Ошибка при получении данных с сервера.");
        }
        const data = await response.json();
        console.log("Данные о предметах успешно получены:", data);
        return data; // Возвращаем JSON-объект
    } catch (error) {
        console.error("Ошибка при получении данных о предметах:", error);
        return null; // Возвращаем null в случае ошибки
    }
}

export async function fetchItemData(userId, heroId) {
    if (cachedItemData) {
        console.log("Using cached item data.");
        return cachedItemData; // Если данные уже загружены, возвращаем их
    }

    const payload = { userId, heroId};
    try {
        cachedItemData = await getItemData(payload); // Запрашиваем данные из базы
        console.log("Item data loaded:", cachedItemData);
        return cachedItemData;
    } catch (error) {
        console.error("Error loading item data:", error);
        return null; // Возвращаем null в случае ошибки
    }
}

export function getCachedItemData() {
    return cachedItemData; // Возвращаем кэшированные данные
}

export async function updateGold(payload) {
    fetch("http://127.0.0.1:5000/update_user_money", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
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

export async function updateItems(payload) {
    fetch("http://127.0.0.1:5000/update_item_level", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
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