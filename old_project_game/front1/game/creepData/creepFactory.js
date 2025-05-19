import { creepsConfig } from "./creepsConfig.js";
import { Creep } from "./creep.js";

export class CreepFactory {
    constructor(assets, background) {
        this.assets = assets;
        this.background = background;
    }

    createCreep(type, creepNumber = 1, creepRank = 0) {
        const config = creepsConfig.find(c => c.type === type);
        if (!config) {
            throw new Error(`Тип крипа "${type}" не найден в конфигурации.`);
        }

        return new Creep(
            this.assets,
            this.background,
            config.unlockedLevel,
            config.creepDamage,
            config.creepHealthTotal,
            config.coinsEarned,
            config.animations,
            config.imgConfigs,
            config.functions,
            creepNumber,
            creepRank,
        );
    }
}
