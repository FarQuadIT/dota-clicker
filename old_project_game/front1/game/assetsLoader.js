export class AssetsLoader {
    constructor() {
        this.backgroundImg = new Image();
        //Heroes
        this.juggernautRunSpriteSheet = new Image();
        this.juggernautIdleSpriteSheet = new Image();
        this.juggernautAttackSpriteSheet = new Image();
        //Creeps
        this.direCreepIdleSpriteSheet = new Image(); 
        this.direCreepAttackSpriteSheet = new Image(); 
        this.direCreepDeathSpriteSheet = new Image();
        this.shishkaIdleSpriteSheet = new Image();
        this.shishkaAttackSpriteSheet = new Image();
        this.shishkaDeathSpriteSheet = new Image();
        this.medvedIdleSpriteSheet = new Image();
        this.medvedAttackSpriteSheet = new Image();
        this.medvedDeathSpriteSheet = new Image();
        this.wolfIdleSpriteSheet = new Image();
        this.wolfAttackSpriteSheet = new Image();
        this.wolfDeathSpriteSheet = new Image();
        this.voulIdleSpriteSheet = new Image();
        this.voulAttackSpriteSheet = new Image();
        this.voulDeathSpriteSheet = new Image();
        this.imagesLoaded = 0;
        this.totalImages = 19; // Увеличивать при добавлении новых ассетов
    }

    loadImages(onAllLoaded) {
        const assets = [
            { image: this.backgroundImg, src: '/media/game/images/forest_background.png' },
            { image: this.juggernautRunSpriteSheet, src: '/media/game/assets/heroes/juggernaut_run.png' },
            { image: this.juggernautIdleSpriteSheet, src: '/media/game/assets/heroes/juggernaut_idle.png' },
            { image: this.juggernautAttackSpriteSheet, src: '/media/game/assets/heroes/juggernaut_attack.png' },
            { image: this.direCreepIdleSpriteSheet, src: '/media/game/assets/creeps/dire_creep_idle.png' },
            { image: this.direCreepAttackSpriteSheet, src: '/media/game/assets/creeps/dire_creep_attack.png' },
            { image: this.direCreepDeathSpriteSheet, src: '/media/game/assets/creeps/dire_creep_death.png' },
            { image: this.shishkaIdleSpriteSheet, src: '/media/game/assets/creeps/shishka_idle.png' },
            { image: this.shishkaAttackSpriteSheet, src: '/media/game/assets/creeps/shishka_attack.png' },
            { image: this.shishkaDeathSpriteSheet, src: '/media/game/assets/creeps/shishka_death.png' },
            { image: this.medvedIdleSpriteSheet, src: '/media/game/assets/creeps/medved_idle.png' },
            { image: this.medvedAttackSpriteSheet, src: '/media/game/assets/creeps/medved_attack.png' },
            { image: this.medvedDeathSpriteSheet, src: '/media/game/assets/creeps/medved_death.png' },
            { image: this.wolfIdleSpriteSheet, src: '/media/game/assets/creeps/wolf_idle.png' },
            { image: this.wolfAttackSpriteSheet, src: '/media/game/assets/creeps/wolf_attack.png' },
            { image: this.wolfDeathSpriteSheet, src: '/media/game/assets/creeps/wolf_death.png' },
            { image: this.voulIdleSpriteSheet, src: '/media/game/assets/creeps/voul_idle.png' },
            { image: this.voulAttackSpriteSheet, src: '/media/game/assets/creeps/voul_attack.png' },
            { image: this.voulDeathSpriteSheet, src: '/media/game/assets/creeps/voul_death.png' },
        ];

        const loadAndDecodeImage = (image, src) => {
            return new Promise((resolve, reject) => {
                image.src = src;
        
                image.onload = () => {
                    if ('decode' in image && typeof image.decode === 'function') {
                        // Попытка декодировать изображение
                        image.decode()
                            .then(() => {
                                console.log(`Изображение успешно декодировано: ${src}`);
                                resolve(image); // Возвращаем загруженное изображение
                            })
                            .catch((error) => {
                                console.warn(`Ошибка декодирования изображения: ${src} - ${error.message}`);
                                resolve(image); // Разрешаем даже при ошибке
                            });
                    } else {
                        console.log(`Декодирование не поддерживается, изображение загружено: ${src}`);
                        resolve(image); // Если decode() не поддерживается
                    }
                };
        
                image.onerror = (error) => {
                    console.error(`Ошибка загрузки изображения: ${src} - ${error.message}`);
                    reject(new Error(`Ошибка загрузки: ${src}`)); // Отказ, если загрузка полностью не удалась
                };
            });
        };
        
        

        const sequentialLoad = async () => {
            for (const { image, src } of assets) {
                await loadAndDecodeImage(image, src);
                this.imagesLoaded++;
            }

            if (this.imagesLoaded === this.totalImages) {
                onAllLoaded();
            }
        };

        sequentialLoad();
    }
}
