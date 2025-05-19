import { updateGold} from "/front1/getData.js";
import {changeGold, volume, userId, heroId} from '/front1/main.js'
// import { waitForTimeout } from '/front1/game/game.js';

export class Creep {
    constructor(
        assets,
        background,
        unlockedLevel,
        creepDamage,
        creepHealthTotal,
        coinsEarned,
        animations,
        imgConfigs,
        functions,
        creepRank,
        creepNumber,
    ) {
        this.assets = assets;
        this.background = background;
        this.unlockedLevel = unlockedLevel;
        this.creepDamage = creepDamage;
        this.coinsEarned = coinsEarned ;
        this.creepHealthTotal = creepHealthTotal;
        this.creepHealthLeft = creepHealthTotal;
        this.imgConfigs = imgConfigs;
        this.creepRank = creepRank;
        this.creepNumber = creepNumber;
        this.functions = functions;
        // Анимации крипа
        this.animations = {};
        for (const [key, animConfig] of Object.entries(animations)) {
            this.animations[key] = {
                ...animConfig,
                spriteSheet: this.assets[animConfig.spriteSheet],
            };
        }

        // Другие свойства крипа
        this.creepsToLvlup = 100;
        this.currentAnimation = "idle";
        this.currentFrame = 0;
        this.frameTimer = 0;

        this.creepX = 0;
        this.creepY = 0;
        this.creepWidth = 0;
        this.creepHeight = 0;
        this.showCreep = false;
        this.isColliding = false;
        this.isDying = false;
        this.isAlive = true;
        this.attackCooldown = false;
        this.volume = volume;
        this.isGameActive = true
    }

    // Остальная логика класса...


    initialize(canvas) {
        this.creepWidth = this.animations.idle.frameWidth*this.imgConfigs.imgScale;
        this.creepHeight = this.animations.idle.frameHeight*this.imgConfigs.imgScale;
        this.creepX = canvas.width - 20; // Начальная позиция справа
        this.creepY = canvas.height - this.creepHeight + this.imgConfigs.deltaY; // Над нижним краем экрана
    }

    spawn(canvas) {
        const scale = canvas.height / 2 / this.animations.idle.frameHeight;
        this.creepHealthTotal = Math.floor(this.creepHealthTotal ** 1.15 ** (this.creepRank)); //Формула усиления крипа
        this.creepHealthLeft = this.creepHealthTotal;
        this.creepDamage = Math.floor(this.creepDamage ** 1.15 ** (this.creepRank)); //Формула усиления крипа
        this.showCreep = true;
        this.isAlive = true;
        this.isDying = false;
        this.isColliding = false;
        this.currentAnimation = "idle";
        this.hitCount = 0;
        this.creepX = canvas.width;
        this.creepY = canvas.height - this.creepHeight * scale + this.imgConfigs.deltaY;
        this.attackCooldown = false;
        this.currentFrame = 0;
        this.updateCreepInfo();
    }
    
    // Новый метод для обновления информации о крипе в интерфейсе
    updateCreepInfo() {
        const creepInfo = document.getElementById("creep-info");
        if (creepInfo) {
            creepInfo.textContent = `Крип: ${this.creepNumber - 1} / ${this.creepsToLvlup}, Уровень: ${this.creepRank}`;
        }
    }
    
    attackModifier(){
        
    }
    stopSounds() {
        // Остановка звука замаха
        this.isGameActive = false
    }
    
    updateAnimation(deltaTime, hero) {
        const animation = this.animations[this.currentAnimation];
        this.frameTimer += deltaTime;

        if (this.frameTimer > animation.frameInterval) {
            this.frameTimer = 0;

            //  Остаемся на последнем кадре анимация смерти
            if (this.isDying) {
                if (this.currentFrame < animation.totalFrames - 1) {
                    this.currentFrame++;
                }
                return;
            }

            this.currentFrame = (this.currentFrame + 1) % animation.totalFrames;

            // Завершение атаки и нанесение урона
            if (this.currentAnimation === "attack" && this.currentFrame === this.imgConfigs.swingFrame && this.isGameActive) {
                this.swing();
            }
            if (this.currentAnimation === "attack" && this.currentFrame === this.imgConfigs.attackFrame && this.isGameActive) {
                    this.dealDamage(hero);
            }
        }
    }
    swing() {
        const attacks = this.animations.attack.sounds.attack_start.length
        const attack_sound = this.animations.attack.sounds.attack_start[Math.floor(Math.random() * attacks)]
        attack_sound.volume = this.volume;
        attack_sound.currentTime = 0; // Сбрасываем звук, если он уже проигрывается
        attack_sound.play()    
    }

    dealDamage(hero) {
        if (hero.health > 0) {
            hero.health = Math.max(0, hero.health - this.creepDamage);
        }
        if (this.functions['attack_modifier']){
        this.functions['attack_modifier'](hero);}
        const attacks = this.animations.attack.sounds.attack_end.length
        const attack_sound = this.animations.attack.sounds.attack_end[Math.floor(Math.random() * attacks)]
        attack_sound.volume = this.volume;
        attack_sound.currentTime = 0; // Сбрасываем звук, если он уже проигрывается
        attack_sound.play()    
    }

    drawHealthBar(ctx, scale, creepX, creepY) {
        if (this.isDying) return; // Не отображаем полоску здоровья, если крип умирает

        const barHeight = 15; // Высота полоски здоровья
        const barWidth = this.creepWidth * scale / 3; // Ширина равна 1/3 ширины крипа

        // Координаты полоски. Регулируем право/лево через xBarDelta
        const barX = creepX + (this.creepWidth * scale - barWidth) / 2 + this.imgConfigs.xBarDelta ; 

        const barY = creepY + this.imgConfigs.yBarDelta * creepY; // Над крипом
        // console.log(barX, barY)
        // const barY = creepY + (this.creepHeight * scale - barHeight)/2 - 70 ;

        // Фон полоски
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Текущая полоска здоровья
        ctx.fillStyle = '#ff4d4d'; // Красный цвет для здоровья
        const healthPercentage = this.creepHealthLeft / this.creepHealthTotal;
        ctx.fillRect(barX, barY, barWidth * healthPercentage, barHeight);

        // Текст здоровья
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            `${this.creepHealthLeft}/${this.creepHealthTotal}`,
            barX + barWidth / 2,
            barY + barHeight / 2 + 3
        );
    }

    draw(ctx,canvas, hero, deltaTime = 16.66) {
        const scale = canvas.height  / this.animations.idle.frameHeight/2;// Масштабируем крип под 1/4 высоты экрана 
        this.scale = scale
        if (this.showCreep) {
            // Крип продолжает двигаться вместе с фоном при смерти
            if (this.isDying || !this.isColliding) {
                this.creepX -= this.background.backgroundSpeed; // Двигаем крипа вместе с фоном
                this.creepY = this.background.fixedHeight - this.creepHeight*scale + this.imgConfigs.deltaY; // Двигаем крипа по высоте вместе с фоном
            }

            this.updateAnimation(deltaTime, hero);
    
            const animation = this.animations[this.currentAnimation];
            const { spriteSheet, frameWidth, frameHeight, framesPerRow } = animation;
    
            if (spriteSheet.complete) {
                const frameX = (this.currentFrame % framesPerRow) * frameWidth;
                const frameY = Math.floor(this.currentFrame / framesPerRow) * frameHeight;
    
                // Рисуем полоску здоровья над крипом, если он жив
                if (!this.isDying) {
                    this.drawHealthBar(ctx, scale, this.creepX, this.creepY);
                }
                ctx.drawImage(
                    spriteSheet,
                    frameX, frameY, frameWidth, frameHeight,
                    this.creepX, this.creepY, this.creepWidth * scale, this.creepHeight*scale
                );
            }
        }
    }
    

    checkCollision(hero) {
        const creepRight = this.creepX + this.creepWidth * this.scale; // Правая граница крипа
        const heroRight = 0.4*hero.heroWidth  + hero.heroX; // Правая граница Джаггернаута с уменьшенным учетом ширины
        // Проверка пересечения по оси X
        const isCollideX = heroRight >= this.creepX && hero.heroX <= creepRight;
    
        // Игнорируем коллизию, если крип умирает
        if (this.isDying) return;
    
        // Если столкновение произошло, но ещё не зафиксировано
        if (isCollideX && !this.isColliding) {
            this.isColliding = true; // Устанавливаем флаг коллизии
            this.background.stopSpeed(); // Останавливаем фон
            this.currentAnimation = "attack"; // Переключаемся на анимацию атаки
        }
    
        // Если больше нет пересечения, сбрасываем флаг
        if (!isCollideX && this.isColliding) {
                this.isColliding = false;
                console.log(123123123) //возможно лишнее 
        };
        return isCollideX
    }
    
    showCoinAnimation(x, y, amount) {
        const container = document.getElementById('coin-animation-container');
        
        const coinElement = document.createElement('div');
        coinElement.classList.add('coin-animation');
        coinElement.style.left = `${x}px`;
        coinElement.style.top = `${y}px`;
        coinElement.innerHTML = `
            <span class="plus">+${amount}</span>
            <span class="coin"></span>
        `;
        
        container.appendChild(coinElement);
        setTimeout(() => {
            container.removeChild(coinElement);
        }, 1500); // Длительность совпадает с анимацией
                }
    handleAttack(hero) {
        if (this.isColliding && this.isAlive && hero.isAttacking) {
            this.creepHealthLeft -= hero.damage;
            if (this.creepHealthLeft <= 0) {
                const payload = {"userId": userId, "heroId": heroId, "income": 1}
                updateGold(payload)
                const death_sound = this.animations.death.sound;
                death_sound.volume = this.volume;
                death_sound.currentTime = 0; // Сбрасываем звук, если он уже проигрывается
                death_sound.play();
    
                this.isAlive = false;
                this.isDying = true;
                this.currentAnimation = "death";
                this.currentFrame = 0;
                
                // Анимация монет
                // this.showCoinAnimation(this.creepX + this.creepWidth / 2, this.creepY, this.coinsEarned);
                console.log(`Крип ${this.creepNumber} уничтожен`);
                const coinX = this.creepX + (this.creepWidth * this.scale) / 2 + this.imgConfigs.xBarDelta ; 
                const coinY = this.creepY + this.imgConfigs.yBarDelta * this.creepY; // Над крипом
                // Анимация монет
                this.showCoinAnimation(coinX, coinY , (Math.floor(this.coinsEarned**1.07**(this.creepRank))));
    
                if (this.creepNumber === this.creepsToLvlup) {
                    this.creepRank += 1;
                    console.log(`Уровень крипов: ${this.creepRank}`);
                }
                this.creepNumber = (this.creepNumber % this.creepsToLvlup) + 1;
    
                // Обновляем информацию о крипе в интерфейсе
                this.updateCreepInfo();
                hero.addCoins(Math.floor(this.coinsEarned**1.07**(this.creepRank)));
                changeGold(Math.floor(this.coinsEarned**1.07**(this.creepRank)))
                // let removeCreepProcess = null;
                // removeCreepProcess = waitForTimeout(
                //     this.animations[this.currentAnimation].frameInterval * this.animations[this.currentAnimation].totalFrames, 
                //                        () => {
                //         console.log('remove')
                //         this.background.returnSpeed()
                //     },
                //     () => {
                //         console.log("Спавн на паузе");
                //     }
                // );
                // setTimeout(() => {
                //     this.background.returnSpeed();
                //     console.log('rip')
                // }, this.animations[this.currentAnimation].frameInterval * this.animations[this.currentAnimation].totalFrames);
            }
        }
    }
    
    
    
    
    
    
    
}
