import { volume } from "/front1/main.js";
import { waitForTimeout } from '/front1/game/game.js';
export class Hero {
    constructor(
        assets,
        background,
        damage,
        maxHealth,
        healthRegen,
        coins,
        level,
        maxEnergy,
        energyRegen,
        vampirism,
        imgConfigs,
        functions,
        animations
    ) {
        this.assets = assets;
        this.background = background;
        this.damage = damage;
        this.maxHealth = maxHealth;
        this.health = this.maxHealth;
        this.baseHealthRegen = healthRegen;
        this.healthRegen = this.baseHealthRegen; // Для корректной работы "отравленой" атаки
        this.maxEnergy = maxEnergy;
        this.energy = this.maxEnergy;
        this.baseEnergyRegen = energyRegen;
        this.energyRegen = energyRegen;
        this.vampirism = vampirism;
        this.coins = coins;
        this.level = level;
        this.imgConfigs = imgConfigs;
        this.functions = functions;
        // Анимации героя
        this.animations = {};
        for (const [key, animConfig] of Object.entries(animations)) {
            this.animations[key] = {
                ...animConfig,
                spriteSheet: this.assets[animConfig.spriteSheet],
            };
        }

        // Другие свойства героя
        this.energyCooldown = false;
        this.isAttackingAllowed = true; // Флаг для блокировки атаки
        this.energyInterpolation = this.energy; // Для плавного отображения энергии
        this.healthInterpolation = this.health; // Для плавного отображения здоровья
        this.currentAnimation = "run";
        this.currentFrame = 0;
        this.frameTimer = 0;
        this.isAttacking = false;
        this.volume = volume;
        this.manaCooldown = null;

    }

    addCoins(amount) {
        this.coins += amount;
        this.updateCoinDisplay();
    }

    updateCoinDisplay() {
        const coinDisplay = document.getElementById("coin-display");
        if (coinDisplay) {
            coinDisplay.textContent = `Монеты: ${this.coins}`;
        }
    }
    stopSound(end = false) {
        const runSound = this.animations.run.sound;
        if (runSound && !runSound.paused) {
            runSound.pause(); // Приостанавливаем воспроизведение
            if (end) {
            runSound.currentTime = 0
            }
        }
    }
    resumeSound() {
        const runSound = this.animations.run.sound;
        if (runSound && this.currentAnimation === "run") {
            runSound.play(); // Возобновляем звук
        }
    }
    updateTimers(deltaTime, creep, background) {
        this.frameTimer += deltaTime;
        const animation = this.animations[this.currentAnimation];
        // Таймер для восстановления энергии
        if (this.energy < this.maxEnergy && !(this.currentAnimation =='attack' && !this.isColliding)) {
            this.energy = Math.min(this.maxEnergy, this.energy + this.energyRegen*deltaTime/1000);
    }
        // Таймер для восстановления здоровья
        if (this.health > 0 && this.health < this.maxHealth && !(this.currentAnimation =='attack' && !creep.isColliding)) {
            this.health = Math.min(this.maxHealth, this.health + this.healthRegen*deltaTime/1000);
    }

        if (this.frameTimer > animation.frameInterval) {
            this.frameTimer = 0;
            // Если это анимация атаки
            if (this.currentAnimation === "attack") {
                // Продолжаем увеличивать текущий кадр, пока не достигнем последнего
                if (this.currentFrame < animation.totalFrames - 5) {
                    this.currentFrame++;
                } else {
                    if (!creep.isColliding || !creep.isAlive ) {
                        this.currentAnimation = "run"
                        this.isAttacking = false;
                        this.currentFrame = 0;
                        if (background) {
                            // background.setSpeed(Math.max(background.defaultSpeed,background.backgroundSpeed)); // Возвращаем фон к исходной скорости
                            background.returnSpeed(); // Возвращаем фон к исходной скорости
                            // creep.creepSpeed = background.defaultSpeed;
                }
                    }
                    if (creep.isColliding && creep.isAlive) {
                        if (creep.isAlive) {
                            this.isAttacking = false;
                            this.currentAnimation = "idle";
                            this.currentFrame = 0;
                     
                        console.log('переходим к idle')
                    }
                    else {
                        this.isAttacking = false;
                        this.currentAnimation = "run";
                        this.currentFrame = 0;
                    }
                    }
                    // Анимация атаки завершена, переключаемся на idle
                    this.isAttacking = false;
                    // this.currentAnimation = "idle"; // Или "run", в зависимости от логики
                    this.currentFrame = 0; // Сбрасываем текущий кадр
                }
            } else {
                // Для других анимаций, например, "run" или "idle"
                this.currentFrame = (this.currentFrame + 1) % animation.totalFrames;
            }
        }
    
        // Плавное обновление отображения энергии
        if ((this.energyInterpolation < this.energy) && this.currentAnimation !='attack') {
            this.energyInterpolation +=
                (this.energy - this.energyInterpolation) * deltaTime * 0.005;
        } else {
            this.energyInterpolation = this.energy; // Обновляем мгновенно при уменьшении
        }
        // Плавное обновление отображения здоровья
        if (this.healthInterpolation < this.health ) {
            this.healthInterpolation +=
                (this.health - this.healthInterpolation) * deltaTime * 0.005;
        } else {
            this.healthInterpolation = this.health; // Обновляем мгновенно при уменьшении
        }
    }
    

    drawBars(ctx, frameWidth, scale, heroX, heroY, hpRegen, energyRegen) {
        const barHeight = 20; // Высота полоски здоровья
        const barWidth = (frameWidth * scale) / 3; // Ширина равна ширине Джаггернаута

        // Координаты полоски здоровья
        const healthBarX = heroX + (frameWidth * scale - barWidth) / 2 - 10;
        const healthBarY = heroY + 0.1 * heroY; // Чуть выше модели

        // Полоска здоровья
        if (hpRegen > 0) {
        ctx.fillStyle = "rgba(255, 0, 0, 0.8)";}
        else {
            ctx.fillStyle = "rgba(66, 102, 0, 0.8)"; //При отсутствии регена (нижняя полоска)
        }
        ctx.fillRect(healthBarX, healthBarY, barWidth, barHeight);
        if (hpRegen > 0) {
            ctx.fillStyle = "#ff4d4d";} // Красный цвет для здоровья
            else {
                ctx.fillStyle = "#88cc00" //При отсутствии регена (верхняя полоска)
            }
        ctx.fillRect(
            healthBarX,
            healthBarY,
            barWidth * (this.health / this.maxHealth),
            barHeight
        );

        // Текст здоровья
        ctx.fillStyle = "#fff";
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
            `${Math.round(this.health*10)/10}/${this.maxHealth}`,
            healthBarX + barWidth / 2,
            healthBarY + barHeight / 2 + 3
        );

        // Координаты полоски энергии
        const energyBarY = healthBarY + barHeight + 5; // Под полоской энергии
        if (this.energyRegen > 0) {
        ctx.fillStyle = "rgba(0, 0, 255, 0.8)";}
        else {ctx.fillStyle = "rgba(0, 0, 41, 0.8)"}
        ctx.fillRect(healthBarX, energyBarY, barWidth, barHeight);
        ctx.fillStyle = "#00bfff"; // Голубой цвет для энергии
        ctx.fillRect(
            healthBarX,
            energyBarY,
            barWidth * (this.energyInterpolation / this.maxEnergy),
            barHeight
        );

        // Текст энергии
        ctx.fillStyle = "#fff";
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
            `${Math.round(this.energy*10)/10}/${this.maxEnergy}`,
            healthBarX + barWidth / 2,
            energyBarY + barHeight / 2 + 3
        );
    }

    draw(ctx, canvas,creep, background, deltaTime = 16.6) {
        this.updateTimers(deltaTime, creep, background);
        const animation = this.animations[this.currentAnimation];
        const { spriteSheet, frameWidth, frameHeight, framesPerRow } = animation;
        // Корректное воспроизведение звука бега
        const runSound  = this.animations.run.sound
        if (this.currentAnimation === "run") {
            runSound.volume = this.volume;
            if (runSound.paused) {
                runSound.play();
            }
        } else if (!runSound.paused) {
            runSound.pause();
        }
        // Фиксированная позиция относительно нижнего левого угла экрана
        const scale = canvas.height / 2 / frameHeight; // Масштабируем Джаггернаута на 1/4 высоты экрана
        const heroX = -60;
        const heroY = canvas.height - frameHeight * scale - 20;

        const frameX = (this.currentFrame % framesPerRow) * frameWidth;
        const frameY = Math.floor(this.currentFrame / framesPerRow) * frameHeight;

        this.drawBars(ctx, frameWidth, scale, heroX, heroY, this.healthRegen, this.energyRegen);
        // Отрисовка Джаггернаута
        ctx.drawImage(
            spriteSheet,
            frameX,
            frameY,
            frameWidth,
            frameHeight,
            heroX,
            heroY,
            frameWidth * scale,
            frameHeight * scale
        );

        return {
            heroX,
            heroY,
            heroWidth: frameWidth * scale,
            heroHeight: frameHeight * scale,
        };
    }
    attack(background, creep) {
        // Если энергия опускается до 0, запускаем 2-секундный кулдаун
        if (1 >= this.energy > 0 ) {
        this.energy = 0
        this.energyRegen = 0
        this.manaCooldown = waitForTimeout(
            2000,
            () => {
            this.energyRegen = this.baseEnergyRegen
                },
        () => {
            console.log("Mana на паузе");
        }
        );
        // setTimeout(() => {
        //     this.energyRegen = this.baseEnergyRegen;}, 2000); // 2 секунды задержка на восстановление
            }
        if (this.energy >= 1 ) {
            this.isAttacking = true;
            this.currentAnimation = "attack";
            this.currentFrame = 0;
            this.energy--;
            this.health =  Math.min(this.health + this.vampirism, this.maxHealth)

            // Возвращаем фон после завершения анимации
            if (!creep.isColliding || !creep.isAlive ) {
                background.stopSpeed()
                const attack_sound = this.animations.attack.sounds.attack0
                attack_sound.volume = this.volume;
                attack_sound.currentTime = 0; // Сбрасываем звук, если он уже проигрывается
                attack_sound.play()
                this.isPlaying = true;
            }
            if (creep.isColliding && creep.isAlive) {
                this.isColliding = true;
                creep.handleAttack(this)
                const keys = Object.keys(this.animations.attack.sounds)
                const attack_sound = this.animations.attack.sounds[`attack${Math.floor(Math.random() * (keys.length - 1) + 1)}`]
                attack_sound.volume = this.volume;
                attack_sound.currentTime = 0; // Сбрасываем звук, если он уже проигрывается
                attack_sound.play(); 
                

            }
        }
        
    }
}
