export const creepsConfig = [
    {
        type: "defaultCreep",
        unlockedLevel: 0,
        creepDamage: 3,
        creepHealthTotal: 10,
        coinsEarned: 1,
        imgConfigs: {
            imgScale: 1,
            deltaY: -5,
            swingFrame: 4,
            attackFrame:13,
            yBarDelta: 0.25,
            xBarDelta: 30,
        },
        functions:{},
        animations: {
            idle: {
                spriteSheet: "direCreepIdleSpriteSheet",
                frameWidth: 1024,
                frameHeight: 1024,
                totalFrames: 52,
                framesPerRow: 8,
                frameInterval: 20,
            },
            attack: {
                spriteSheet: "direCreepAttackSpriteSheet",
                frameWidth: 1024,
                frameHeight: 1024,
                totalFrames: 29,
                framesPerRow: 6,
                frameInterval: 30,
                sounds: {
                    attack_start: [
                        new Audio('/media/game/sounds/creeps/attack/attack_start_1.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_start_2.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_start_3.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_start_4.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_start_5.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_start_6.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_start_7.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_start_8.mp3')
                    ],
                    attack_end: [
                        new Audio('/media/game/sounds/creeps/attack/attack_end_4.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_end_6.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_end_7.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_end_8.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_end_9.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_end_10.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_end_11.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_end_12.mp3')
                    ]

                }
            },
            death: {
                spriteSheet: "direCreepDeathSpriteSheet",
                frameWidth: 1024,
                frameHeight: 1024,
                totalFrames: 29,
                framesPerRow: 6,
                frameInterval: 40,
                sound: new Audio('/media/game/sounds/creeps/death/dire_creep_death.mp3')

            },
        },
    },
    {
        type: "shiska",
        unlockedLevel: 1,
        creepDamage: 2,
        creepHealthTotal: 15,
        coinsEarned: 1,
        imgConfigs:{
            imgScale: 1.5,
            deltaY: 70,
            swingFrame: 5,
            attackFrame:11,
            yBarDelta: 0.7,
            xBarDelta: -80,
        },
        functions:{},
        animations: {
            idle: {
                spriteSheet: "shishkaIdleSpriteSheet",
                frameWidth: 1024,
                frameHeight: 1024,
                totalFrames: 24,
                framesPerRow: 5,
                frameInterval: 40,
            },
            attack: {
                spriteSheet: "shishkaAttackSpriteSheet",
                frameWidth: 1024,
                frameHeight: 1024,
                totalFrames: 27,
                framesPerRow: 6,
                frameInterval: 30,
                sounds: {
                    attack_start: [
                        new Audio('/media/game/sounds/creeps/attack/attack_start_1.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_start_2.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_start_3.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_start_4.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_start_5.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_start_6.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_start_7.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_start_8.mp3')
                    ],
                    attack_end: [
                        new Audio('/media/game/sounds/creeps/attack/attack_end_4.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_end_6.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_end_7.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_end_8.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_end_9.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_end_10.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_end_11.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_end_12.mp3')
                    ]

                }
            },
            death: {
                spriteSheet: "shishkaDeathSpriteSheet",
                frameWidth: 1024,
                frameHeight: 1024,
                totalFrames: 28,
                framesPerRow: 6,
                frameInterval: 30,
                sound: new Audio('/media/game/sounds/creeps/death/shishka_death.mp3')

            },
        },
    },
    {
        type: "medved",
        unlockedLevel: 2,
        creepDamage: 1,
        creepHealthTotal: 10,
        coinsEarned: 1,
        imgConfigs: {
            imgScale: 1,
            deltaY: -30,
            swingFrame: 10,
            attackFrame:11,
            yBarDelta: 0.25,
            xBarDelta: -20, //????
        },
        functions:{},
        animations: {
            idle: {
                spriteSheet: "medvedIdleSpriteSheet",
                frameWidth: 1024,
                frameHeight: 1024,
                totalFrames: 27,
                framesPerRow: 6,
                frameInterval: 40,
            },
            attack: {
                spriteSheet: "medvedAttackSpriteSheet",
                frameWidth: 1024,
                frameHeight: 1024,
                totalFrames: 21,
                framesPerRow: 5,
                frameInterval: 20,
                sounds: {
                    attack_start: [
                        new Audio('/media/game/sounds/creeps/attack/attack_start_1.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_start_2.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_start_3.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_start_4.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_start_5.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_start_6.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_start_7.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_start_8.mp3')
                    ],
                    attack_end: [
                        new Audio('/media/game/sounds/creeps/attack/attack_end_2.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_end_3.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_end_5.mp3'),
                    ]

                }
            },
            death: {
                spriteSheet: "medvedDeathSpriteSheet",
                frameWidth: 1024,
                frameHeight: 1024,
                totalFrames: 24,
                framesPerRow: 5,
                frameInterval: 30,
                sound: new Audio('/media/game/sounds/creeps/death/medved_death.mp3')
            },
        },
    },
    {
        type: "wolf",
        unlockedLevel: 3,
        creepDamage: 5,
        creepHealthTotal: 5,
        coinsEarned: 1,
        imgConfigs: {
            imgScale: 1,
            deltaY: -20,
            swingFrame: 6,
            attackFrame:8,
            yBarDelta: 0.35,
            xBarDelta: 0, //????
        },
        functions:{},
        animations: {
            idle: {
                spriteSheet: "wolfIdleSpriteSheet",
                frameWidth: 1024,
                frameHeight: 1024,
                totalFrames: 23,
                framesPerRow: 5,
                frameInterval: 40,
            },
            attack: {
                spriteSheet: "wolfAttackSpriteSheet",
                frameWidth: 1024,
                frameHeight: 1024,
                totalFrames: 21,
                framesPerRow: 7,
                frameInterval: 40,
                sounds: {
                    attack_start: [
                        new Audio('/media/game/sounds/creeps/attack/attack_start_1.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_start_2.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_start_3.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_start_4.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_start_5.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_start_6.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_start_7.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_start_8.mp3')
                    ],
                    attack_end: [
                        new Audio('/media/game/sounds/creeps/attack/attack_end_2.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_end_3.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_end_5.mp3'),
                    ]

                }
            },
            death: {
                spriteSheet: "wolfDeathSpriteSheet",
                frameWidth: 1024,
                frameHeight: 1024,
                totalFrames: 18,
                framesPerRow: 6,
                frameInterval: 40,
                sound: new Audio('/media/game/sounds/creeps/death/wolf_death.mp3')
            },
        },
    },
    {
        type: "voul",
        unlockedLevel: 5,
        creepDamage: 2,
        creepHealthTotal: 10,
        coinsEarned: 1,
        imgConfigs:{
            imgScale: 1,
            deltaY: -30,
            swingFrame: 5,
            attackFrame:11,
            yBarDelta: 0.3,
            xBarDelta: -10,
        },
        functions:{
            // Отравление при ударе - на секунду пропадает восстановление хп
            attack_modifier: function(hero) {
                hero.healthRegen = 0
                if (this.isPoisoned) {
                    clearTimeout(this.isPoisoned);
                }
                this.isPoisoned = setTimeout(() => {
                    hero.healthRegen = hero.baseHealthRegen;
                }, 1000)

            }
        },
        animations: {
            idle: {
                spriteSheet: "voulIdleSpriteSheet",
                frameWidth: 1024,
                frameHeight: 1024,
                totalFrames: 34,
                framesPerRow: 5,
                frameInterval: 40,
            },
            attack: {
                spriteSheet: "voulAttackSpriteSheet",
                frameWidth: 1024,
                frameHeight: 1024,
                totalFrames: 25,
                framesPerRow: 5,
                frameInterval: 30,
                sounds: {
                    attack_start: [
                        new Audio('/media/game/sounds/creeps/attack/attack_start_1.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_start_2.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_start_3.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_start_4.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_start_5.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_start_6.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_start_7.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_start_8.mp3')
                    ],
                    attack_end: [
                        new Audio('/media/game/sounds/creeps/attack/attack_end_4.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_end_6.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_end_7.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_end_8.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_end_9.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_end_10.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_end_11.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_end_12.mp3')
                    ]

                }
            },
            death: {
                spriteSheet: "voulDeathSpriteSheet",
                frameWidth: 1024,
                frameHeight: 1024,
                totalFrames: 31,
                framesPerRow: 8,
                frameInterval: 30,
                sound: new Audio('/media/game/sounds/creeps/death/voul_death.mp3')
            },
        },
    },
    {
        type: "satyr",
        unlockedLevel: 4,
        creepDamage: 2,
        creepHealthTotal: 7,
        coinsEarned: 1,
        imgConfigs:{
            imgScale: 1,
            deltaY: -30,
            swingFrame: 5,
            attackFrame:11,
            yBarDelta: 0.3,
            xBarDelta: -10,
        },
        functions:{
            // Лишение маны при ударе
            attack_modifier: function(hero) {
                if (hero.energy >= 2) {
                hero.energy = Math.max(hero.energy - creepsConfig.find(o => o.type === 'satyr').creepDamage, 0)
            }}
        },
        animations: {
            idle: {
                spriteSheet: "voulIdleSpriteSheet",
                frameWidth: 1024,
                frameHeight: 1024,
                totalFrames: 34,
                framesPerRow: 5,
                frameInterval: 40,
            },
            attack: {
                spriteSheet: "voulAttackSpriteSheet",
                frameWidth: 1024,
                frameHeight: 1024,
                totalFrames: 25,
                framesPerRow: 5,
                frameInterval: 30,
                sounds: {
                    attack_start: [
                        new Audio('/media/game/sounds/creeps/attack/attack_start_1.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_start_2.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_start_3.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_start_4.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_start_5.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_start_6.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_start_7.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_start_8.mp3')
                    ],
                    attack_end: [
                        new Audio('/media/game/sounds/creeps/attack/attack_end_4.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_end_6.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_end_7.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_end_8.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_end_9.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_end_10.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_end_11.mp3'),
                        new Audio('/media/game/sounds/creeps/attack/attack_end_12.mp3')
                    ]

                }
            },
            death: {
                spriteSheet: "voulDeathSpriteSheet",
                frameWidth: 1024,
                frameHeight: 1024,
                totalFrames: 31,
                framesPerRow: 8,
                frameInterval: 30,
                sound: new Audio('/media/game/sounds/creeps/death/voul_death.mp3')
            },
        },
    },
    // Другие типы крипов...
];
