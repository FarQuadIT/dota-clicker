import { getCachedHeroData } from "/front1/getData.js";
function initializeCharacteristics() {
    const data = getCachedHeroData(); // Запрашиваем данные из базы
    // Сейчас в data передается только характеристика выбранного героя.
    // В дальнейшем, нужно передавать все характеристики, чтобы заполнить данные по всем героям, либо изменить
    // структуру heroConfig так, чтобы переменные типа maxHealth: data.maxHealth были вне словаря (т.е. общие для всех героев)
    const heroConfig = [
        {
            id: 1,
            type: "juggernaut",
            damage: data.damage || 1,
            maxHealth: data.maxHealth || 30,
            healthRegen: data.healthRegen || 1,
            coins: data.coins || 0,
            maxEnergy: data.maxEnergy || 10,
            energyRegen: data.energyRegen || 1,
            vampirism: data.vampirism || 0,
            movementSpeed: data.movementSpeed || 0,
            level: data.level || 0,
            imgConfigs: {
                // imgScale: ,
                // deltaY: ,
                // swingFrame: ,
                // attackFrame:,
                // yBarDelta: ,
                // xBarDelta: ,
            },
            functions:{},
            animations: {
                run: {
                    spriteSheet: 'juggernautRunSpriteSheet',
                    frameWidth: 512,
                    frameHeight: 512,
                    totalFrames: 21,
                    framesPerRow: 7,
                    frameInterval:40,
                    sound: new Audio('/media/game/sounds/heroes/juggernaut/run/jugger_run.mp3')
                },
                attack: {
                    spriteSheet: 'juggernautAttackSpriteSheet',
                    frameWidth: 512,
                    frameHeight: 512,
                    totalFrames: 34,
                    framesPerRow: 6,
                    frameInterval: 30,
                    sounds: {
                        attack0: new Audio('/media/game/sounds/heroes/juggernaut/attack/jugger_attack_0.mp3'),
                        attack1: new Audio('/media/game/sounds/heroes/juggernaut/attack/jugger_attack_1.mp3'),
                        attack2: new Audio('/media/game/sounds/heroes/juggernaut/attack/jugger_attack_2.mp3'),
                        attack3: new Audio('/media/game/sounds/heroes/juggernaut/attack/jugger_attack_3.mp3'),
                        attack4: new Audio('/media/game/sounds/heroes/juggernaut/attack/jugger_attack_4.mp3'),
                        attack5: new Audio('/media/game/sounds/heroes/juggernaut/attack/jugger_attack_5.mp3'),
    
                    }
                },
                idle: {
                    spriteSheet: 'juggernautIdleSpriteSheet',
                    frameWidth: 512,
                    frameHeight: 512,
                    totalFrames: 35,
                    framesPerRow: 6,
                    frameInterval: 40,
                },
            },
        },
    ]
    if (data) {
        // Инициализируем значения из базы
            heroConfig[0]["max-health"] =  data.maxHealth || 30;
            heroConfig[0]["health-regen"] = data.healthRegen || 1;
            heroConfig[0]["max-mana"] = data.maxEnergy || 10;
            heroConfig[0]["mana-regen"] = data.energyRegen || 1;
            heroConfig[0]["damage"] = data.damage || 1;
            heroConfig[0]["vampirism"] = data.vampirism || 0;
            heroConfig[0]["movement-speed"] = data.movementSpeed || 2;
            heroConfig[0]["income"] = data.currentIncome || 0;
            heroConfig[0]["level"] = data.level || 0;
    } else {
        console.warn("Данные из базы не были загружены.");
    }
return heroConfig
}

export const heroData = initializeCharacteristics()