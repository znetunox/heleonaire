import { gameDataService, type GameDropData } from "../../services/GameDataService";

export interface RolledDrop {
    itemId: number;
    rate: number;
    stealProtected: boolean;
    sourceKey: string | null;
}

export class DropService {
    /**
     * Executa todas as rolagens de drop de um Mob.
     *
     * rAthena:
     * 100   = 1%
     * 1000  = 10%
     * 10000 = 100%
     */
    rollDrops(mobId: number): RolledDrop[] {
        const dropEntries = gameDataService.getMobDrops(mobId);

        if (dropEntries.length === 0) {
            return [];
        }

        const result: RolledDrop[] = [];

        for (const drop of dropEntries) {
            if (this.roll(drop.rate)) {
                result.push({
                    itemId: drop.itemId,
                    rate: drop.rate,
                    stealProtected: drop.stealProtected,
                    sourceKey: drop.sourceKey,
                });
            }
        }

        return result;
    }

    /**
     * Faz uma rolagem de 0 até 9999.
     *
     * rate 10000 = 100%
     * rate 1000  = 10%
     * rate 100   = 1%
     */
    private roll(rate: number): boolean {
        if (rate <= 0) {
            return false;
        }

        if (rate >= 10000) {
            return true;
        }

        return Math.floor(Math.random() * 10000) < rate;
    }
}

export const dropService = new DropService();