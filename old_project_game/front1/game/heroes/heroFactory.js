import { heroData } from "./heroConfig.js";
import { Hero } from "./hero.js";

export class HeroFactory {
    constructor(assets, background) {
        this.assets = assets;
        this.background = background;
    }

    createHero(type) {
        const config = heroData.find(c => c.type === type);
        if (!config) {
            throw new Error(`Тип героя "${type}" не найден в конфигурации.`);
        }

        return new Hero(
            this.assets,
            this.background,
            config.damage,
            config.maxHealth,
            config.healthRegen,
            config.coins,
            config.level,
            config.maxEnergy,
            config.energyRegen,
            config.vampirism,
            config.imgConfigs,
            config.functions,
            config.animations
        );
    }
}
