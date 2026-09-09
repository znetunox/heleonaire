import prisma from "../../db/prisma";
import { inventoryService } from "../inventory/InventoryService";
import { statusService } from "../status/StatusService";
import {
    itemScriptInterpreter,
    ItemEffect,
} from "./ItemScriptInterpreter";

export interface ItemUseResult {
    success: boolean;
    reason?: string;
    hpHealed?: number;
    mpHealed?: number;
}

export interface ItemUsePlayer {
    characterId: string;
    hp: number;
    maxHp: number;
    mp: number;
    maxMp: number;
}

export type RecalculateStatsCallback =
    () => void | Promise<void>;

export class ItemUseService {
    async useItem(
        player: ItemUsePlayer,
        inventoryId: string,
        recalculateStats?: RecalculateStatsCallback,
    ): Promise<ItemUseResult> {
        if (!player?.characterId) {
            return {
                success: false,
                reason: "PLAYER_NOT_FOUND",
            };
        }

        if (!inventoryId) {
            return {
                success: false,
                reason: "INVALID_INVENTORY_ID",
            };
        }

        const inventoryEntry =
            await prisma.inventory.findFirst({
                where: {
                    id: inventoryId,
                    characterId: player.characterId,
                },
                include: {
                    item: {
                        select: {
                            id: true,
                            name: true,
                            type: true,
                            script: true,
                        },
                    },
                },
            });

        if (!inventoryEntry) {
            return {
                success: false,
                reason: "ITEM_NOT_FOUND",
            };
        }

        if (inventoryEntry.quantity <= 0) {
            return {
                success: false,
                reason: "ITEM_OUT_OF_STOCK",
            };
        }

        const script =
            inventoryEntry.item.script;

        if (!script) {
            return {
                success: false,
                reason: "ITEM_HAS_NO_SCRIPT",
            };
        }

        const effects =
            itemScriptInterpreter.interpret(script);

        if (effects.length === 0) {
            return {
                success: false,
                reason: "UNSUPPORTED_ITEM_SCRIPT",
            };
        }

        /*
         * Primeiro validamos se o item possui algum efeito
         * que possa ser aplicado.
         *
         * Não calculamos HEAL/PERCENT_HEAL ainda porque
         * STATUS_START pode alterar maxHp/maxMp.
         */
        let hasStatusStartEffect = false;
        let hasStatusEndEffect = false;
        let hasHealEffect = false;

        for (const effect of effects) {
            switch (effect.type) {
                case "HEAL":
                case "PERCENT_HEAL":
                    hasHealEffect = true;
                    break;

                case "STATUS_START":
                    hasStatusStartEffect = true;
                    break;

                case "STATUS_END":
                    if (
                        statusService.hasStatus(
                            player.characterId,
                            effect.statusId,
                        )
                    ) {
                        hasStatusEndEffect = true;
                    }
                    break;

                default:
                    this.assertNeverEffect(effect);
            }
        }

        /*
         * Se o item possui apenas HEAL/PERCENT_HEAL,
         * verificaremos o delta real depois que todos os
         * status forem aplicados e os stats recalculados.
         */
        if (
            !hasHealEffect &&
            !hasStatusStartEffect &&
            !hasStatusEndEffect
        ) {
            return {
                success: false,
                reason: "ITEM_HAS_NO_EFFECT",
            };
        }

        const consumed =
            await inventoryService.consumeItem(
                player.characterId,
                inventoryId,
                1,
            );

        if (!consumed) {
            return {
                success: false,
                reason: "ITEM_CONSUME_FAILED",
            };
        }

        /*
         * STATUS_START precisa ser aplicado antes do cálculo
         * dos efeitos de cura.
         */
        for (const effect of effects) {
            if (effect.type !== "STATUS_START") {
                continue;
            }

            statusService.addStatus(
                player.characterId,
                effect.statusId,
                effect.durationMs,
                effect.value,
                effect.value2,
                effect.value3,
                effect.value4,
                {
                    type: "ITEM",
                    id: inventoryEntry.item.id,
                },
            );
        }

        /*
         * STATUS_END também é aplicado antes da cura para que
         * o cálculo final de atributos reflita o estado correto.
         */
        for (const effect of effects) {
            if (effect.type !== "STATUS_END") {
                continue;
            }

            statusService.removeStatus(
                player.characterId,
                effect.statusId,
            );
        }

        /*
         * STATUS_START / STATUS_END podem alterar maxHp/maxMp,
         * ATK, etc. O WorldRoom fornece o callback responsável
         * pelo recálculo dos atributos.
         */
        if (
            recalculateStats &&
            (hasStatusStartEffect || hasStatusEndEffect)
        ) {
            await recalculateStats();
        }

        const hpBefore = player.hp;
        const mpBefore = player.mp;

        let newHp = player.hp;
        let newMp = player.mp;

        /*
         * Agora HEAL/PERCENT_HEAL usa maxHp/maxMp já
         * recalculados.
         */
        for (const effect of effects) {
            switch (effect.type) {
                case "HEAL":
                    newHp =
                        Math.min(
                            player.maxHp,
                            Math.max(
                                0,
                                newHp + effect.hp,
                            ),
                        );

                    newMp =
                        Math.min(
                            player.maxMp,
                            Math.max(
                                0,
                                newMp + effect.mp,
                            ),
                        );

                    break;

                case "PERCENT_HEAL":
                    newHp =
                        Math.min(
                            player.maxHp,
                            Math.max(
                                0,
                                newHp +
                                Math.floor(
                                    player.maxHp *
                                    effect.hpPercent /
                                    100,
                                ),
                            ),
                        );

                    newMp =
                        Math.min(
                            player.maxMp,
                            Math.max(
                                0,
                                newMp +
                                Math.floor(
                                    player.maxMp *
                                    effect.mpPercent /
                                    100,
                                ),
                            ),
                        );

                    break;

                case "STATUS_START":
                case "STATUS_END":
                    break;

                default:
                    this.assertNeverEffect(effect);
            }
        }

        const hpDelta =
            newHp - hpBefore;

        const mpDelta =
            newMp - mpBefore;

        /*
         * Um item pode ter STATUS_START/STATUS_END sem cura.
         * Nesse caso continua sendo um uso válido.
         *
         * Já um item exclusivamente de cura que não produz
         * nenhuma alteração real não deve ser considerado
         * efeito aplicado.
         */
        if (
            hpDelta === 0 &&
            mpDelta === 0 &&
            !hasStatusStartEffect &&
            !hasStatusEndEffect
        ) {
            return {
                success: false,
                reason: "ITEM_HAS_NO_EFFECT",
            };
        }

        player.hp = newHp;
        player.mp = newMp;

        console.log(
            `[ItemUseService] Item used: ` +
            `${ inventoryEntry.item.name } ` +
            `(${ inventoryEntry.item.id }) ` +
            `character = ${ player.characterId } ` +
            `HP ${ this.formatDelta(hpDelta) } ` +
            `MP ${ this.formatDelta(mpDelta) } `,
        );

        return {
            success: true,
            hpHealed: Math.max(0, hpDelta),
            mpHealed: Math.max(0, mpDelta),
        };
    }

    private formatDelta(
        value: number,
    ): string {
        if (value > 0) {
            return `+ ${ value } `;
        }

        return `${ value } `;
    }

    private assertNeverEffect(
        effect: never,
    ): never {
        throw new Error(
            `Unsupported item effect: ${ JSON.stringify(effect) } `,
        );
    }
}

export const itemUseService =
    new ItemUseService();