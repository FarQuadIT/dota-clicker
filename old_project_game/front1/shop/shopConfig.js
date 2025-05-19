import { getCachedItemData } from "/front1/getData.js";
function initializeCharacteristics() {
    const data = getCachedItemData(); // Запрашиваем данные из базы
    const shopItems = {
    'shopButtons':{
        "max-health": {
            name: "Максимальное здоровье",
            icon: "/media/shop/main/health.png",
            color: "#77d87a",
            filter: "invert(63%) sepia(26%) saturate(5174%) hue-rotate(78deg) brightness(100%) contrast(100%)"
        },
        "health-regen": {
            name: "Восстановление здоровья",
            icon: "/media/shop/main/healing.png",
            color: "#bc9520",
            filter: "invert(50%) sepia(20%) saturate(400%) hue-rotate(30deg) brightness(90%) contrast(85%)"
        },
        "max-mana": {
            name: "Максимальная мана",
            icon: "/media/shop/main/mana.png",
            color: "#2d52e4",
            filter: "invert(40%) sepia(50%) saturate(3000%) hue-rotate(220deg) brightness(85%) contrast(90%)"
        },
        "mana-regen": {
            name: "Восстановление маны",
            icon: "/media/shop/main/regmana.png",
            color: "#6404be",
            filter: "invert(35%) sepia(75%) saturate(700%) hue-rotate(260deg) brightness(80%) contrast(95%)"
        },
        "damage": {
            name: "Урон",
            icon: "/media/shop/main/damage.png",
            color: "#c00000",
            filter: "invert(60%) sepia(70%) saturate(6000%) hue-rotate(0deg) brightness(80%) contrast(90%)"
        },
        "vampirism": {
            name: "Вампиризм",
            icon: "/media/shop/main/vampiric.png",
            color: "#d1007a",
            filter: "invert(40%) sepia(80%) saturate(1500%) hue-rotate(310deg) brightness(75%) contrast(100%)"
        },
        "movement-speed": {
            name: "Скорость бега",
            icon: "/media/shop/main/speed.png",
            color: "#c63f00",
            filter: "invert(45%) sepia(70%) saturate(500%) hue-rotate(25deg) brightness(85%) contrast(90%)"
        },
        "income": {
            name: "Доход",
            icon: "/media/shop/main/gold.png",
            color: "#d6de00",
            filter: "invert(80%) sepia(40%) saturate(500%) hue-rotate(60deg) brightness(95%) contrast(105%)"
        }
    },
    'shopItems':{
        "max-health": [
            {
                id: "1",
                img: "/media/shop/items/gauntlets_of_strength.jpg",
                title: data["items"]["max-health"]["1"]["itemName"],
                value: data["items"]["max-health"]["1"]["currentValue"],
                baseValue: data["items"]["max-health"]["1"]["baseValue"],
                level: data["items"]["max-health"]["1"]["currentLevel"],
                basePrice: data["items"]["max-health"]["1"]["currentPrice"], // Начальная стоимость
                priceFormula: (currentPrice) => Math.ceil(currentPrice * 1.15) // Формула для роста стоимости
            },
            {
                id: "2",
                img: "/media/shop/items/belt_of_strength.jpg",
                title: data["items"]["max-health"]["2"]["itemName"],
                value: data["items"]["max-health"]["2"]["currentValue"],
                baseValue: data["items"]["max-health"]["2"]["baseValue"],
                level: data["items"]["max-health"]["2"]["currentLevel"],
                basePrice: data["items"]["max-health"]["2"]["currentPrice"], // Начальная стоимость
                priceFormula: (currentPrice) => Math.ceil(currentPrice * 1.15) // Формула для роста стоимости
            },
            {
                id: "3",
                img: "/media/shop/items/bracer.jpg",
                title: data["items"]["max-health"]["3"]["itemName"],
                value: data["items"]["max-health"]["3"]["currentValue"],
                baseValue: data["items"]["max-health"]["3"]["baseValue"],
                level: data["items"]["max-health"]["3"]["currentLevel"],
                basePrice: data["items"]["max-health"]["3"]["currentPrice"], // Начальная стоимость
                priceFormula: (currentPrice) => Math.ceil(currentPrice * 1.15) // Формула для роста стоимости
            },
            {
                id: "4",
                img: "/media/shop/items/vitality_booster.jpg",
                title: data["items"]["max-health"]["4"]["itemName"],
                value: data["items"]["max-health"]["4"]["currentValue"],
                baseValue: data["items"]["max-health"]["4"]["baseValue"],
                level: data["items"]["max-health"]["4"]["currentLevel"],
                basePrice: data["items"]["max-health"]["4"]["currentPrice"], 
                priceFormula: (currentPrice) => Math.ceil(currentPrice * 1.15) // Формула для роста стоимости
            },
            {
                id: "5",
                img: "/media/shop/items/ogre_axe.jpg",
                title: data["items"]["max-health"]["5"]["itemName"],
                value: data["items"]["max-health"]["5"]["currentValue"],
                baseValue: data["items"]["max-health"]["5"]["baseValue"],
                level: data["items"]["max-health"]["5"]["currentLevel"],
                basePrice: data["items"]["max-health"]["5"]["currentPrice"],
                priceFormula: (currentPrice) => Math.ceil(currentPrice * 1.15) // Формула для роста стоимости
            },
            {
                id: "6",
                img: "/media/shop/items/reaver.jpg",
                title: data["items"]["max-health"]["6"]["itemName"],
                value: data["items"]["max-health"]["6"]["currentValue"],
                baseValue: data["items"]["max-health"]["6"]["baseValue"],
                level: data["items"]["max-health"]["6"]["currentLevel"],
                basePrice: data["items"]["max-health"]["6"]["currentPrice"],
                priceFormula: (currentPrice) => Math.ceil(currentPrice * 1.15) // Формула для роста стоимости
            },
            {
                id: "7",
                img: "/media/shop/items/heart_of_tarrasque.jpg",
                title: data["items"]["max-health"]["7"]["itemName"],
                value: data["items"]["max-health"]["7"]["currentValue"],
                baseValue: data["items"]["max-health"]["7"]["baseValue"],
                level: data["items"]["max-health"]["7"]["currentLevel"],
                basePrice: data["items"]["max-health"]["7"]["currentPrice"],
                priceFormula: (currentPrice) => Math.ceil(currentPrice * 1.15) // Формула для роста стоимости
            },
        ],
        "health-regen": [
            {
                id: "8",
                img: "/media/shop/items/tango.jpg",
                title: data["items"]["health-regen"]["8"]["itemName"],
                value: data["items"]["health-regen"]["8"]["currentValue"],
                baseValue: data["items"]["health-regen"]["8"]["baseValue"],
                level: data["items"]["health-regen"]["8"]["currentLevel"],
                basePrice: data["items"]["health-regen"]["8"]["currentPrice"],
                priceFormula: (currentPrice) => Math.ceil(currentPrice * 1.15) // Формула для роста стоимости
            },
            {
                id: "9",
                img: "/media/shop/items/ring_of_regen.jpg",
                title: data["items"]["health-regen"]["9"]["itemName"],
                value: data["items"]["health-regen"]["9"]["currentValue"],
                baseValue: data["items"]["health-regen"]["9"]["baseValue"],
                level: data["items"]["health-regen"]["9"]["currentLevel"],
                basePrice: data["items"]["health-regen"]["9"]["currentPrice"],
                priceFormula: (currentPrice) => Math.ceil(currentPrice * 1.15) // Формула для роста стоимости
            },
            {
                id: "10",
                img: "/media/shop/items/ring_of_health.jpg",
                title: data["items"]["health-regen"]["10"]["itemName"],
                value: data["items"]["health-regen"]["10"]["currentValue"],
                baseValue: data["items"]["health-regen"]["10"]["baseValue"],
                level: data["items"]["health-regen"]["10"]["currentLevel"],
                basePrice: data["items"]["health-regen"]["10"]["currentPrice"],
                priceFormula: (currentPrice) => Math.ceil(currentPrice * 1.15) // Формула для роста стоимости
            },
            {
                id: "11",
                img: "/media/shop/items/tranquil_boots.jpg",
                title: data["items"]["health-regen"]["11"]["itemName"],
                value: data["items"]["health-regen"]["11"]["currentValue"],
                baseValue: data["items"]["health-regen"]["11"]["baseValue"],
                level: data["items"]["health-regen"]["11"]["currentLevel"],
                basePrice: data["items"]["health-regen"]["11"]["currentPrice"],
                priceFormula: (currentPrice) => Math.ceil(currentPrice * 1.15) // Формула для роста стоимости
            },
            {
                id: "12",
                img: "/media/shop/items/ring_of_tarrasque.jpg",
                title: data["items"]["health-regen"]["12"]["itemName"],
                value: data["items"]["health-regen"]["12"]["currentValue"],
                baseValue: data["items"]["health-regen"]["12"]["baseValue"],
                level: data["items"]["health-regen"]["12"]["currentLevel"],
                basePrice: data["items"]["health-regen"]["12"]["currentPrice"],
                priceFormula: (currentPrice) => Math.ceil(currentPrice * 1.15) // Формула для роста стоимости
            },
            
        ],
        "max-mana": [
            {
                id: "13",
                img: "/media/shop/items/mantle_of_intelligence.jpg",
                title: data["items"]["max-mana"]["13"]["itemName"],
                value: data["items"]["max-mana"]["13"]["currentValue"],
                baseValue: data["items"]["max-mana"]["13"]["baseValue"],
                level: data["items"]["max-mana"]["13"]["currentLevel"],
                basePrice: data["items"]["max-mana"]["13"]["currentPrice"],
                priceFormula: (currentPrice) => Math.ceil(currentPrice * 1.15) // Формула для роста стоимости
            },
            {
                id: "14",
                img: "/media/shop/items/robe_of_the_magi.jpg",
                title: data["items"]["max-mana"]["14"]["itemName"],
                value: data["items"]["max-mana"]["14"]["currentValue"],
                baseValue: data["items"]["max-mana"]["14"]["baseValue"],
                level: data["items"]["max-mana"]["14"]["currentLevel"],
                basePrice: data["items"]["max-mana"]["14"]["currentPrice"],
                priceFormula: (currentPrice) => Math.ceil(currentPrice * 1.15) // Формула для роста стоимости
            },
            {
                id: "15",
                img: "/media/shop/items/null_talisman.jpg",
                title: data["items"]["max-mana"]["15"]["itemName"],
                value: data["items"]["max-mana"]["15"]["currentValue"],
                baseValue: data["items"]["max-mana"]["15"]["baseValue"],
                level: data["items"]["max-mana"]["15"]["currentLevel"],
                basePrice: data["items"]["max-mana"]["15"]["currentPrice"],
                priceFormula: (currentPrice) => Math.ceil(currentPrice * 1.15) // Формула для роста стоимости
            },
            {
                id: "16",
                img: "/media/shop/items/energy_booster.jpg",
                title: data["items"]["max-mana"]["16"]["itemName"],
                value: data["items"]["max-mana"]["16"]["currentValue"],
                baseValue: data["items"]["max-mana"]["16"]["baseValue"],
                level: data["items"]["max-mana"]["16"]["currentLevel"],
                basePrice: data["items"]["max-mana"]["16"]["currentPrice"],
                priceFormula: (currentPrice) => Math.ceil(currentPrice * 1.15) // Формула для роста стоимости
            },
            {
                id: "17",
                img: "/media/shop/items/staff_of_wizardry.jpg",
                title: data["items"]["max-mana"]["17"]["itemName"],
                value: data["items"]["max-mana"]["17"]["currentValue"],
                baseValue: data["items"]["max-mana"]["17"]["baseValue"],
                level: data["items"]["max-mana"]["17"]["currentLevel"],
                basePrice: data["items"]["max-mana"]["17"]["currentPrice"],
                priceFormula: (currentPrice) => Math.ceil(currentPrice * 1.15) // Формула для роста стоимости
            },
            {
                id: "18",
                img: "/media/shop/items/mystic_staff.jpg",
                title: data["items"]["max-mana"]["18"]["itemName"],
                value: data["items"]["max-mana"]["18"]["currentValue"],
                baseValue: data["items"]["max-mana"]["18"]["baseValue"],
                level: data["items"]["max-mana"]["18"]["currentLevel"],
                basePrice: data["items"]["max-mana"]["18"]["currentPrice"],
                priceFormula: (currentPrice) => Math.ceil(currentPrice * 1.15) // Формула для роста стоимости
            },
            {
                id: "19",
                img: "/media/shop/items/parasma.jpg",
                title: data["items"]["max-mana"]["19"]["itemName"],
                value: data["items"]["max-mana"]["19"]["currentValue"],
                baseValue: data["items"]["max-mana"]["19"]["baseValue"],
                level: data["items"]["max-mana"]["19"]["currentLevel"],
                basePrice: data["items"]["max-mana"]["19"]["currentPrice"],
                priceFormula: (currentPrice) => Math.ceil(currentPrice * 1.15) // Формула для роста стоимости
            },
        ],
        "mana-regen":[
            {
                id: "20",
                img: "/media/shop/items/clarity.jpg",
                title: data["items"]["mana-regen"]["20"]["itemName"],
                value: data["items"]["mana-regen"]["20"]["currentValue"],
                baseValue: data["items"]["mana-regen"]["20"]["baseValue"],
                level: data["items"]["mana-regen"]["20"]["currentLevel"],
                basePrice: data["items"]["mana-regen"]["20"]["currentPrice"],
                priceFormula: (currentPrice) => Math.ceil(currentPrice * 1.15) // Формула для роста стоимости
            },
            {
                id: "21",
                img: "/media/shop/items/sages_mask.jpg",
                title: data["items"]["mana-regen"]["21"]["itemName"],
                value: data["items"]["mana-regen"]["21"]["currentValue"],
                baseValue: data["items"]["mana-regen"]["21"]["baseValue"],
                level: data["items"]["mana-regen"]["21"]["currentLevel"],
                basePrice: data["items"]["mana-regen"]["21"]["currentPrice"],
                priceFormula: (currentPrice) => Math.ceil(currentPrice * 1.15) // Формула для роста стоимости
            },
            {
                id: "22",
                img: "/media/shop/items/void_stone.jpg",
                title: data["items"]["mana-regen"]["22"]["itemName"],
                value: data["items"]["mana-regen"]["22"]["currentValue"],
                baseValue: data["items"]["mana-regen"]["22"]["baseValue"],
                level: data["items"]["mana-regen"]["22"]["currentLevel"],
                basePrice: data["items"]["mana-regen"]["22"]["currentPrice"],
                priceFormula: (currentPrice) => Math.ceil(currentPrice * 1.15) // Формула для роста стоимости
            },
            {
                id: "23",
                img: "/media/shop/items/soul_ring.jpg",
                title: data["items"]["mana-regen"]["23"]["itemName"],
                value: data["items"]["mana-regen"]["23"]["currentValue"],
                baseValue: data["items"]["mana-regen"]["23"]["baseValue"],
                level: data["items"]["mana-regen"]["23"]["currentLevel"],
                basePrice: data["items"]["mana-regen"]["23"]["currentPrice"],
                priceFormula: (currentPrice) => Math.ceil(currentPrice * 1.15) // Формула для роста стоимости
            },
            {
                id: "24",
                img: "/media/shop/items/arcane_boots.jpg",
                title: data["items"]["mana-regen"]["24"]["itemName"],
                value: data["items"]["mana-regen"]["24"]["currentValue"],
                baseValue: data["items"]["mana-regen"]["24"]["baseValue"],
                level: data["items"]["mana-regen"]["24"]["currentLevel"],
                basePrice: data["items"]["mana-regen"]["24"]["currentPrice"],
                priceFormula: (currentPrice) => Math.ceil(currentPrice * 1.15) // Формула для роста стоимости
            },
            {
                id: "25",
                img: "/media/shop/items/tiara_of_selemene.jpg",
                title: data["items"]["mana-regen"]["25"]["itemName"],
                value: data["items"]["mana-regen"]["25"]["currentValue"],
                baseValue: data["items"]["mana-regen"]["25"]["baseValue"],
                level: data["items"]["mana-regen"]["25"]["currentLevel"],
                basePrice: data["items"]["mana-regen"]["25"]["currentPrice"],
                priceFormula: (currentPrice) => Math.ceil(currentPrice * 1.15) // Формула для роста стоимости
            },

        ],
        "damage": [
            {
                id: "26",
                img: "/media/shop/items/blades_of_attack.jpg",
                title: data["items"]["damage"]["26"]["itemName"],
                value: data["items"]["damage"]["26"]["currentValue"],
                baseValue: data["items"]["damage"]["26"]["baseValue"],
                level: data["items"]["damage"]["26"]["currentLevel"],
                basePrice: data["items"]["damage"]["26"]["currentPrice"],
                priceFormula: (currentPrice) => Math.ceil(currentPrice * 1.15) // Формула для роста стоимости
            },
            {
                id: "27",
                img: "/media/shop/items/broadsword.jpg",
                title: data["items"]["damage"]["27"]["itemName"],
                value: data["items"]["damage"]["27"]["currentValue"],
                baseValue: data["items"]["damage"]["27"]["baseValue"],
                level: data["items"]["damage"]["27"]["currentLevel"],
                basePrice: data["items"]["damage"]["27"]["currentPrice"],
                priceFormula: (currentPrice) => Math.ceil(currentPrice * 1.15) // Формула для роста стоимости
            },
            {
                id: "28",
                img: "/media/shop/items/claymore.jpg",
                title: data["items"]["damage"]["28"]["itemName"],
                value: data["items"]["damage"]["28"]["currentValue"],
                baseValue: data["items"]["damage"]["28"]["baseValue"],
                level: data["items"]["damage"]["28"]["currentLevel"],
                basePrice: data["items"]["damage"]["28"]["currentPrice"],
                priceFormula: (currentPrice) => Math.ceil(currentPrice * 1.15) // Формула для роста стоимости
            },
            {
                id: "29",
                img: "/media/shop/items/mithril_hammer.jpg",
                title: data["items"]["damage"]["29"]["itemName"],
                value: data["items"]["damage"]["29"]["currentValue"],
                baseValue: data["items"]["damage"]["29"]["baseValue"],
                level: data["items"]["damage"]["29"]["currentLevel"],
                basePrice: data["items"]["damage"]["29"]["currentPrice"],
                priceFormula: (currentPrice) => Math.ceil(currentPrice * 1.15) // Формула для роста стоимости
            },
            {
                id: "30",
                img: "/media/shop/items/crystalys.jpg",
                title: data["items"]["damage"]["30"]["itemName"],
                value: data["items"]["damage"]["30"]["currentValue"],
                baseValue: data["items"]["damage"]["30"]["baseValue"],
                level: data["items"]["damage"]["30"]["currentLevel"],
                basePrice: data["items"]["damage"]["30"]["currentPrice"],
                priceFormula: (currentPrice) => Math.ceil(currentPrice * 1.15) // Формула для роста стоимости
            },
            {
                id: "31",
                img: "/media/shop/items/desolator.jpg",
                title: data["items"]["damage"]["31"]["itemName"],
                value: data["items"]["damage"]["31"]["currentValue"],
                baseValue: data["items"]["damage"]["31"]["baseValue"],
                level: data["items"]["damage"]["31"]["currentLevel"],
                basePrice: data["items"]["damage"]["31"]["currentPrice"],
                priceFormula: (currentPrice) => Math.ceil(currentPrice * 1.15) // Формула для роста стоимости
            },
            {
                id: "32",
                img: "/media/shop/items/daedalus.jpg",
                title: data["items"]["damage"]["32"]["itemName"],
                value: data["items"]["damage"]["32"]["currentValue"],
                baseValue: data["items"]["damage"]["32"]["baseValue"],
                level: data["items"]["damage"]["32"]["currentLevel"],
                basePrice: data["items"]["damage"]["32"]["currentPrice"],
                priceFormula: (currentPrice) => Math.ceil(currentPrice * 1.15) // Формула для роста стоимости
            },
            {
                id: "33",
                img: "/media/shop/items/divine_rapier.jpg",
                title: data["items"]["damage"]["33"]["itemName"],
                value: data["items"]["damage"]["33"]["currentValue"],
                baseValue: data["items"]["damage"]["33"]["baseValue"],
                level: data["items"]["damage"]["33"]["currentLevel"],
                basePrice: data["items"]["damage"]["33"]["currentPrice"],
                priceFormula: (currentPrice) => Math.ceil(currentPrice * 1.15) // Формула для роста стоимости
            },

        ],
        "vampirism": [
            {
                id: "34",
                img: "/media/shop/items/morbid_mask.jpg",
                title: data["items"]["vampirism"]["34"]["itemName"],
                value: data["items"]["vampirism"]["34"]["currentValue"],
                baseValue: data["items"]["vampirism"]["34"]["baseValue"],
                level: data["items"]["vampirism"]["34"]["currentLevel"],
                basePrice: data["items"]["vampirism"]["34"]["currentPrice"],
                priceFormula: (currentPrice) => Math.ceil(currentPrice * 1.15) // Формула для роста стоимости
            },
            {
                id: "35",
                img: "/media/shop/items/mask_of_madness.jpg",
                title: data["items"]["vampirism"]["35"]["itemName"],
                value: data["items"]["vampirism"]["35"]["currentValue"],
                baseValue: data["items"]["vampirism"]["35"]["baseValue"],
                level: data["items"]["vampirism"]["35"]["currentLevel"],
                basePrice: data["items"]["vampirism"]["35"]["currentPrice"],
                priceFormula: (currentPrice) => Math.ceil(currentPrice * 1.15) // Формула для роста стоимости
            },
            {
                id: "36",
                img: "/media/shop/items/vladmirs_offering.jpg",
                title: data["items"]["vampirism"]["36"]["itemName"],
                value: data["items"]["vampirism"]["36"]["currentValue"],
                baseValue: data["items"]["vampirism"]["36"]["baseValue"],
                level: data["items"]["vampirism"]["36"]["currentLevel"],
                basePrice: data["items"]["vampirism"]["36"]["currentPrice"],
                priceFormula: (currentPrice) => Math.ceil(currentPrice * 1.15) // Формула для роста стоимости
            },
            {
                id: "37",
                img: "/media/shop/items/satanic.jpg",
                title: data["items"]["vampirism"]["37"]["itemName"],
                value: data["items"]["vampirism"]["37"]["currentValue"],
                baseValue: data["items"]["vampirism"]["37"]["baseValue"],
                level: data["items"]["vampirism"]["37"]["currentLevel"],
                basePrice: data["items"]["vampirism"]["37"]["currentPrice"],
                priceFormula: (currentPrice) => Math.ceil(currentPrice * 1.15) // Формула для роста стоимости
            },

        ],
        "movement-speed": [
            {
                id: "38",
                img: "/media/shop/items/wind_lace.jpg",
                title: data["items"]["movement-speed"]["38"]["itemName"],
                value: data["items"]["movement-speed"]["38"]["currentValue"],
                baseValue: data["items"]["movement-speed"]["38"]["baseValue"],
                level: data["items"]["movement-speed"]["38"]["currentLevel"],
                basePrice: data["items"]["movement-speed"]["38"]["currentPrice"],
                priceFormula: (currentPrice) => Math.ceil(currentPrice * 1.15) // Формула для роста стоимости
            },
            {
                id: "39",
                img: "/media/shop/items/boots_of_speed.jpg",
                title: data["items"]["movement-speed"]["39"]["itemName"],
                value: data["items"]["movement-speed"]["39"]["currentValue"],
                baseValue: data["items"]["movement-speed"]["39"]["baseValue"],
                level: data["items"]["movement-speed"]["39"]["currentLevel"],
                basePrice: data["items"]["movement-speed"]["39"]["currentPrice"],
                priceFormula: (currentPrice) => Math.ceil(currentPrice * 1.15) // Формула для роста стоимости
            },
            {
                id: "40",
                img: "/media/shop/items/phase_boots.jpg",
                title: data["items"]["movement-speed"]["40"]["itemName"],
                value: data["items"]["movement-speed"]["40"]["currentValue"],
                baseValue: data["items"]["movement-speed"]["40"]["baseValue"],
                level: data["items"]["movement-speed"]["40"]["currentLevel"],
                basePrice: data["items"]["movement-speed"]["40"]["currentPrice"],
                priceFormula: (currentPrice) => Math.ceil(currentPrice * 1.15) // Формула для роста стоимости
            },
            {
                id: "41",
                img: "/media/shop/items/boots_of_travel.jpg",
                title: data["items"]["movement-speed"]["41"]["itemName"],
                value: data["items"]["movement-speed"]["41"]["currentValue"],
                baseValue: data["items"]["movement-speed"]["41"]["baseValue"],
                level: data["items"]["movement-speed"]["41"]["currentLevel"],
                basePrice: data["items"]["movement-speed"]["41"]["currentPrice"],
                priceFormula: (currentPrice) => Math.ceil(currentPrice * 1.15) // Формула для роста стоимости
            },
            {
                id: "42",
                img: "/media/shop/items/boots_of_travel_2.jpg",
                title: data["items"]["movement-speed"]["42"]["itemName"],
                value: data["items"]["movement-speed"]["42"]["currentValue"],
                baseValue: data["items"]["movement-speed"]["42"]["baseValue"],
                level: data["items"]["movement-speed"]["42"]["currentLevel"],
                basePrice: data["items"]["movement-speed"]["42"]["currentPrice"],
                priceFormula: (currentPrice) => Math.ceil(currentPrice * 1.15) // Формула для роста стоимости
            },

        ],
        "income": [
            {
                id: "43",
                img: "/media/shop/items/quelling_blade.jpg",
                title: data["items"]["income"]["43"]["itemName"],
                value: data["items"]["income"]["43"]["currentValue"],
                baseValue: data["items"]["income"]["43"]["baseValue"],
                level: data["items"]["income"]["43"]["currentLevel"],
                basePrice: data["items"]["income"]["43"]["currentPrice"],
                priceFormula: (currentPrice) => Math.ceil(currentPrice * 1.15) // Формула для роста стоимости
            },
            {
                id: "44",
                img: "/media/shop/items/hand_of_midas.jpg",
                title: data["items"]["income"]["44"]["itemName"],
                value: data["items"]["income"]["44"]["currentValue"],
                baseValue: data["items"]["income"]["44"]["baseValue"],
                level: data["items"]["income"]["44"]["currentLevel"],
                basePrice: data["items"]["income"]["44"]["currentPrice"],
                priceFormula: (currentPrice) => Math.ceil(currentPrice * 1.15) // Формула для роста стоимости
            },
            {
                id: "45",
                img: "/media/shop/items/battle_fury.jpg",
                title: data["items"]["income"]["45"]["itemName"],
                value: data["items"]["income"]["45"]["currentValue"],
                baseValue: data["items"]["income"]["45"]["baseValue"],
                level: data["items"]["income"]["45"]["currentLevel"],
                basePrice: data["items"]["income"]["45"]["currentPrice"],
                priceFormula: (currentPrice) => Math.ceil(currentPrice * 1.15) // Формула для роста стоимости
            },
            {
                id: "46",
                img: "/media/shop/items/radiance.jpg",
                title: data["items"]["income"]["46"]["itemName"],
                value: data["items"]["income"]["46"]["currentValue"],
                baseValue: data["items"]["income"]["46"]["baseValue"],
                level: data["items"]["income"]["46"]["currentLevel"],
                basePrice: data["items"]["income"]["46"]["currentPrice"],
                priceFormula: (currentPrice) => Math.ceil(currentPrice * 1.15) // Формула для роста стоимости
            },
        ]
    }
}
return shopItems
}

export const itemData = initializeCharacteristics()