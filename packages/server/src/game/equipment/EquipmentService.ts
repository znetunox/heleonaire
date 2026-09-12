import prisma from "../../db/prisma";

import {
    itemScriptInterpreter,
} from "../items/ItemScriptInterpreter";

import type { RathenaElement } from "../../data/rathena/parsers/attrFixParser";

const VALID_LOCATIONS = new Set([
    "Ammo",
    "Armor",

    "Both_Accessory",
    "Both_Hand",

    "Costume_Garment",
    "Costume_Head_Low",
    "Costume_Head_Mid",
    "Costume_Head_Top",

    "Garment",

    "Head_Low",
    "Head_Mid",
    "Head_Top",

    "Left_Accessory",
    "Left_Hand",

    "Right_Accessory",
    "Right_Hand",

    "Shoes",

    "Shadow_Armor",
    "Shadow_Left_Accessory",
    "Shadow_Right_Accessory",
    "Shadow_Shield",
    "Shadow_Shoes",
    "Shadow_Weapon",
]);

type EquipmentLocation = string;

interface ParsedLocation {
    slot: EquipmentLocation;
    occupies: EquipmentLocation[];
}

interface EquippedItemInstance {
    type: string;
    attack: number | null;
    magicAttack: number | null;
    defense: number | null;
    script: string | null;
}

export class EquipmentService {

    /**
     * Lê Item.locations preservando a taxonomia original
     * do rAthena.
     */
    private parseLocations(
        locations: string | null,
    ): ParsedLocation[] {

        if (!locations) {
            return [];
        }

        let parsed: Record<string, unknown>;

        try {
            parsed = JSON.parse(locations);
        } catch {
            throw new Error("Invalid item locations data");
        }

        const activeLocations = Object.entries(parsed)
            .filter(([, value]) => value === true)
            .map(([key]) => key);

        if (activeLocations.length === 0) {
            return [];
        }

        for (const location of activeLocations) {
            if (!VALID_LOCATIONS.has(location)) {
                throw new Error(
                    `Unsupported equipment location: ${location}`,
                );
            }
        }

        return activeLocations.map((slot) => ({
            slot,
            occupies: this.getOccupiedSlots(slot),
        }));
    }

    /**
     * Representa conflitos físicos de slots sem alterar
     * o valor original persistido em CharacterEquipment.slot.
     *
     * Both_Hand continua sendo Both_Hand no banco.
     */
    private getOccupiedSlots(
        slot: EquipmentLocation,
    ): EquipmentLocation[] {

        switch (slot) {

            case "Both_Hand":
                return [
                    "Both_Hand",
                    "Right_Hand",
                    "Left_Hand",
                ];

            case "Right_Hand":
                return [
                    "Right_Hand",
                    "Both_Hand",
                ];

            case "Left_Hand":
                return [
                    "Left_Hand",
                    "Both_Hand",
                ];

            case "Both_Accessory":
                return [
                    "Both_Accessory",
                    "Left_Accessory",
                    "Right_Accessory",
                ];

            case "Left_Accessory":
                return [
                    "Left_Accessory",
                    "Both_Accessory",
                ];

            case "Right_Accessory":
                return [
                    "Right_Accessory",
                    "Both_Accessory",
                ];

            default:
                return [slot];
        }
    }

    /**
     * Equipa um item existente no inventário.
     */
    async equipItem(
        characterId: string,
        inventoryId: string,
    ) {
        if (!characterId) {
            throw new Error("Character ID is required");
        }

        if (!inventoryId) {
            throw new Error("Inventory ID is required");
        }

        const inventory = await prisma.inventory.findFirst({
            where: {
                id: inventoryId,
                characterId,
            },
            include: {
                item: true,
                character: {
                    select: {
                        id: true,
                        level: true,
                        jobKey: true,
                    },
                },
            },
        });

        if (!inventory) {
            throw new Error(
                "Inventory item not found",
            );
        }

        if (inventory.quantity < 1) {
            throw new Error(
                "Inventory item has no quantity",
            );
        }

        const item = inventory.item;
        const character = inventory.character;

        const locations = this.parseLocations(
            item.locations,
        );

        if (locations.length === 0) {
            throw new Error(
                "Item cannot be equipped",
            );
        }

        this.validateLevel(
            character.level,
            item.equipLevelMin,
            item.equipLevelMax,
        );

        await this.validateJob(
            character.jobKey,
            item.jobs,
        );

        const occupiedSlots = [
            ...new Set(
                locations.flatMap(
                    (location) => location.occupies,
                ),
            ),
        ];

        return prisma.$transaction(async (tx) => {

            /**
             * Remove qualquer equipamento que esteja
             * ocupando algum dos slots necessários.
             *
             * O item que está sendo equipado também é
             * removido previamente para permitir re-equip.
             */
            await tx.characterEquipment.deleteMany({
                where: {
                    characterId,
                    slot: {
                        in: occupiedSlots,
                    },
                },
            });

            /**
             * Como locations pode conter múltiplos slots,
             * criamos uma linha para cada location verdadeira.
             */
            for (const location of locations) {

                await tx.characterEquipment.create({
                    data: {
                        characterId,
                        itemId: item.id,
                        slot: location.slot,
                        inventoryId: inventory.id,
                        refineLevel: inventory.refineLevel,
                    },
                });
            }

            return tx.characterEquipment.findMany({
                where: {
                    characterId,
                },
                include: {
                    item: {
                        select: {
                            id: true,
                            aegisName: true,
                            name: true,
                            type: true,
                            subType: true,
                            attack: true,
                            magicAttack: true,
                            defense: true,
                            weaponLevel: true,
                            armorLevel: true,
                            locations: true,
                        },
                    },
                },
                orderBy: {
                    slot: "asc",
                },
            });
        });
    }

    /**
     * Remove o equipamento de um slot.
     *
     * Se o item ocupa múltiplos slots, todas as linhas
     * daquela mesma instância física são removidas.
     */
    async unequipItem(
        characterId: string,
        slot: string,
    ) {
        if (!characterId) {
            throw new Error("Character ID is required");
        }

        if (!slot) {
            throw new Error("Equipment slot is required");
        }

        const equipment =
            await prisma.characterEquipment.findFirst({
                where: {
                    characterId,
                    slot,
                },
            });

        if (!equipment) {
            throw new Error("No equipment found in this slot");
        }

        /*
         * Novo modelo:
         * cada equipamento aponta para sua instância física
         * através de inventoryId.
         */
        if (equipment.inventoryId) {
            await prisma.characterEquipment.deleteMany({
                where: {
                    characterId,
                    inventoryId: equipment.inventoryId,
                },
            });
        } else {
            /*
             * Compatibilidade temporária com equipamentos antigos
             * que ainda não possuam inventoryId.
             */
            await prisma.characterEquipment.deleteMany({
                where: {
                    characterId,
                    itemId: equipment.itemId,
                },
            });
        }

        return this.getEquipment(characterId);
    }

    /**
     * Retorna todo o equipamento atualmente equipado.
     */
    async getEquipment(characterId: string) {
        if (!characterId) {
            throw new Error("Character ID is required");
        }

        return prisma.characterEquipment.findMany({
            where: {
                characterId,
            },
            include: {
                item: {
                    select: {
                        id: true,
                        aegisName: true,
                        name: true,
                        type: true,
                        subType: true,
                        attack: true,
                        magicAttack: true,
                        defense: true,
                        weaponLevel: true,
                        armorLevel: true,
                        equipLevelMin: true,
                        equipLevelMax: true,
                        refineable: true,
                        locations: true,
                    },
                },
            },
            orderBy: {
                slot: "asc",
            },
        });
    }

    /**
     * Obtém o contexto da arma física atualmente equipada.
     *
     * A instância do equipamento é identificada por inventoryId.
     * O refineLevel autoritativo vem de Inventory.
     *
     * CharacterEquipment.refineLevel é utilizado somente como
     * fallback para equipamentos legados sem inventoryId.
     */
    async getWeaponContext(characterId: string) {
        if (!characterId) {
            throw new Error("Character ID is required");
        }

        const equipment =
            await prisma.characterEquipment.findMany({
                where: {
                    characterId,
                    slot: {
                        in: [
                            "Both_Hand",
                            "Right_Hand",
                        ],
                    },
                },
                select: {
                    itemId: true,
                    slot: true,
                    inventoryId: true,
                    refineLevel: true,
                    item: {
                        select: {
                            id: true,
                            aegisName: true,
                            name: true,
                            type: true,
                            subType: true,
                            attack: true,
                            weaponLevel: true,
                            range: true,
                            script: true,
                        },
                    },
                },
            });

        const weaponEquipment =
            equipment.find(
                (entry) =>
                    entry.slot === "Both_Hand" &&
                    entry.item.type === "Weapon",
            ) ??
            equipment.find(
                (entry) =>
                    entry.slot === "Right_Hand" &&
                    entry.item.type === "Weapon",
            );

        if (!weaponEquipment) {
            return null;
        }

        let weaponAtkBonus = 0;
        let weaponAtk2Bonus = 0;

        if (weaponEquipment.item.script) {
            const effects =
                itemScriptInterpreter.interpret(
                    weaponEquipment.item.script,
                );

            for (const effect of effects) {
                switch (effect.type) {
                    case "weaponAtk":
                        weaponAtkBonus += effect.value;
                        break;

                    case "weaponAtk2":
                        weaponAtk2Bonus += effect.value;
                        break;

                    default:
                        break;
                }
            }
        }

        if (weaponEquipment.item.attack === null) {
            throw new Error(
                `Weapon ${weaponEquipment.item.aegisName} has no attack value`,
            );
        }

        if (weaponEquipment.item.weaponLevel === null) {
            throw new Error(
                `Weapon ${weaponEquipment.item.aegisName} has no weapon level`,
            );
        }

        let refineLevel =
            weaponEquipment.refineLevel;

        if (weaponEquipment.inventoryId) {
            const inventory =
                await prisma.inventory.findUnique({
                    where: {
                        id: weaponEquipment.inventoryId,
                    },
                    select: {
                        id: true,
                        itemId: true,
                        refineLevel: true,
                    },
                });

            if (!inventory) {
                throw new Error(
                    `Weapon inventory instance ${weaponEquipment.inventoryId} not found`,
                );
            }

            if (inventory.itemId !== weaponEquipment.itemId) {
                throw new Error(
                    `Weapon inventory instance ${inventory.id} does not match equipped item ${weaponEquipment.itemId}`,
                );
            }

            refineLevel =
                inventory.refineLevel;
        }

        if (refineLevel < 0) {
            throw new Error(
                `Invalid weapon refine level: ${refineLevel}`,
            );
        }

        let refineBonus = 0;
        let overRefineBonus = 0;

        if (refineLevel > 0) {
            const refineRule =
                await prisma.refineRule.findUnique({
                    where: {
                        group_itemLevel_refineLevel: {
                            group: "Weapon",
                            itemLevel:
                                weaponEquipment.item.weaponLevel,
                            refineLevel,
                        },
                    },
                    select: {
                        bonus: true,
                        randomBonus: true,
                    },
                });

            if (!refineRule) {
                throw new Error(
                    `Refine rule not found for Weapon level ${weaponEquipment.item.weaponLevel} refine +${refineLevel}`,
                );
            }

            refineBonus =
                refineRule.bonus / 100;

            overRefineBonus =
                refineRule.randomBonus / 100;
        }

        return {
            itemId: weaponEquipment.item.id,
            aegisName: weaponEquipment.item.aegisName,
            name: weaponEquipment.item.name,
            slot: weaponEquipment.slot,
            inventoryId:
                weaponEquipment.inventoryId,
            attack:
                weaponEquipment.item.attack,

            weaponAtkBonus,
            weaponAtk2Bonus,

            weaponLevel:
                weaponEquipment.item.weaponLevel,
            weaponType:
                weaponEquipment.item.subType ?? "",
            range:
                weaponEquipment.item.range ?? 0,
            refineLevel,
            refineBonus,
            overRefineBonus,
            element: "Neutral" as RathenaElement,
        };
    }

    /**
     * Calcula os modificadores numéricos fornecidos pelo
     * equipamento atualmente equipado.
     *
     * Atributos físicos estáticos:
     *
     * Item.attack      -> weaponAtk / equipAtk
     * Item.magicAttack -> equipMatk
     * Item.defense     -> armorDef
     *
     * Scripts permanentes do Item.script:
     *
     * bBaseAtk          -> equipAtk
     * bAtkRate          -> atkRate
     * bWeaponAtkRate    -> weaponAtkRate
     * bWeaponDamageRate -> weaponDamageRate
     * bPAtk             -> patk
     * bPAtkRate         -> patkRate
     * bWeaponAtk        -> weaponAtkByType
     *
     *
     * bAtk e bAtk2 são tratados no contexto da arma física
     * através de getWeaponContext().
     *
     * bAtk  -> weapon wa.atk
     * bAtk2 -> weapon wa.atk2
     *
     * Eles não pertencem a statusAtk, masteryAtk ou equipAtk.
     *
     * Um mesmo item pode ocupar múltiplos slots em
     * CharacterEquipment. Nesse caso, seus atributos e seu
     * script são contabilizados apenas uma vez.
     */
    async getStatModifiers(characterId: string) {
        if (!characterId) {
            throw new Error("Character ID is required");
        }

        const equipment =
            await prisma.characterEquipment.findMany({
                where: {
                    characterId,
                },
                select: {
                    itemId: true,
                    inventoryId: true,
                    item: {
                        select: {
                            type: true,
                            attack: true,
                            magicAttack: true,
                            defense: true,
                            script: true,
                        },
                    },
                },
            });

        /**
         * Deduplicação por instância física.
         *
         * inventoryId identifica corretamente duas cópias
         * diferentes do mesmo item.
         *
         * Equipamentos antigos sem inventoryId continuam
         * utilizando itemId como fallback.
         */
        const equippedInstances =
            new Map<string, EquippedItemInstance>();

        for (const equipped of equipment) {
            const key =
                equipped.inventoryId ??
                `legacy:${equipped.itemId}`;

            if (!equippedInstances.has(key)) {
                equippedInstances.set(
                    key,
                    equipped.item,
                );
            }
        }

        let weaponAtk = 0;
        let equipAtk = 0;
        let equipMatk = 0;
        let armorDef = 0;
        let ammoAtk = 0;

        /**
         * Modificadores provenientes de Item.script.
         */
        let atkRate = 0;
        let weaponAtkRate = 0;
        const weaponDamageRateByType =
            new Map<string, number>();
        let patk = 0;
        let patkRate = 0;
        let def = 0;
        let defRate = 0;
        let def2 = 0;
        let def2Rate = 0;

        /**
         * bWeaponAtk,w,n
         *
         * Deve permanecer separado por tipo de arma.
         *
         * Exemplo:
         *
         * {
         *     Sword: 20,
         *     Dagger: 10
         * }
         *
         * Não podemos somar isso globalmente porque o bônus
         * só deve ser aplicado quando a arma correspondente
         * estiver equipada.
         */
        const weaponAtkByType =
            new Map<string, number>();

        for (const item of equippedInstances.values()) {

            /*
             * --------------------------------------------------
             * Atributos estáticos do Item
             * --------------------------------------------------
             */

            if (item.type === "Weapon") {

                if (item.attack !== null) {
                    weaponAtk += item.attack;
                }

                if (item.magicAttack !== null) {
                    equipMatk += item.magicAttack;
                }

            } else if (item.type === "Ammo") {

                if (item.attack !== null) {
                    ammoAtk += item.attack;
                }

            } else if (item.type === "Armor") {

                if (item.defense !== null) {
                    armorDef += item.defense;
                }

            } else {

                if (item.attack !== null) {
                    equipAtk += item.attack;
                }

                if (item.magicAttack !== null) {
                    equipMatk += item.magicAttack;
                }

                if (item.defense !== null) {
                    armorDef += item.defense;
                }
            }

            /*
             * --------------------------------------------------
             * Item.script
             * --------------------------------------------------
             *
             * O script é interpretado uma única vez por
             * instância física.
             */
            if (!item.script) {
                continue;
            }

            const effects =
                itemScriptInterpreter.interpret(
                    item.script,
                );

            for (const effect of effects) {

                switch (effect.type) {

                    /**
                     * bBaseAtk
                     *
                     * EATK/equipment attack.
                     */
                    case "baseAtk":
                        equipAtk += effect.value;
                        break;

                    /**
                     * bAtkRate
                     *
                     * Percentual aplicado posteriormente sobre:
                     *
                     *     weaponAtk + equipAtk
                     *
                     * Não aplicar aqui sobre weapon.attack.
                     */
                    case "atkRate":
                        atkRate += effect.value;
                        break;

                    /**
                     * bWeaponAtkRate
                     *
                     * Modificador da WATK base.
                     *
                     * O cálculo efetivo ocorre em
                     * calculateWeaponAttack().
                     */
                    case "weaponAtkRate":
                        weaponAtkRate += effect.value;
                        break;

                    /**
                     * bWeaponDamageRate
                     *
                     * Atualmente mantemos o acumulador escalar
                     * porque PlayerCombatSnapshot ainda possui
                     * weaponDamageRate escalar.
                     *
                     * A modelagem definitiva deverá ser por
                     * tipo de arma.
                     */
                    case "weaponDamageRate": {
                        const weaponType =
                            effect.weaponType;

                        if (!weaponType) {
                            break;
                        }

                        const current =
                            weaponDamageRateByType.get(
                                weaponType,
                            ) ?? 0;

                        weaponDamageRateByType.set(
                            weaponType,
                            current + effect.value,
                        );

                        break;

                    }


                    case "def":
                        def += effect.value;
                        break;

                    case "defRate":
                        defRate += effect.value;
                        break;

                    case "def2":
                        def2 += effect.value;
                        break;

                    case "def2Rate":
                        def2Rate += effect.value;
                        break;

                    /**
                     * bPAtk
                     *
                     * P.ATK flat.
                     *
                     * Ainda será integrado ao estágio correto
                     * do cálculo de P.ATK.
                     */
                    case "patk":
                        patk += effect.value;
                        break;

                    /**
                     * bPAtkRate
                     *
                     * P.ATK percentual.
                     *
                     * Ainda será integrado ao estágio correto
                     * do cálculo de P.ATK.
                     */
                    case "patkRate":
                        patkRate += effect.value;
                        break;

                    /**
                     * bWeaponAtk,w,n
                     *
                     * Mantemos por tipo de arma.
                     *
                     * Não deve ser incorporado a weaponAtk global.
                     */
                    case "weaponAtkByType": {
                        const weaponType =
                            effect.weaponType;

                        if (!weaponType) {
                            break;
                        }

                        const current =
                            weaponAtkByType.get(
                                weaponType,
                            ) ?? 0;

                        weaponAtkByType.set(
                            weaponType,
                            current + effect.value,
                        );

                        break;
                    }

                    case "weaponAtk":
                    case "weaponAtk2":
                        break;

                    default:
                        break;
                }
            }
        }

        return {
            weaponAtk,
            equipAtk,
            equipMatk,
            armorDef,
            ammoAtk,
            atkRate,
            weaponAtkRate,
            weaponDamageRateByType: Object.fromEntries(
                weaponDamageRateByType,
            ),
            weaponAtkByType: Object.fromEntries(
                weaponAtkByType,
            ),
            patk,
            patkRate,
            def,
            defRate,
            def2,
            def2Rate,
        };
    }

    private validateLevel(
        characterLevel: number,
        minLevel: number | null,
        maxLevel: number | null,
    ): void {

        if (
            minLevel !== null &&
            characterLevel < minLevel
        ) {
            throw new Error(
                `Character level ${characterLevel} is below required level ${minLevel}`,
            );
        }

        if (
            maxLevel !== null &&
            characterLevel > maxLevel
        ) {
            throw new Error(
                `Character level ${characterLevel} exceeds maximum level ${maxLevel}`,
            );
        }
    }

    /**
     * Validação inicial dos jobs.
     *
     * Item.jobs continua sendo o JSON original do rAthena.
     *
     * Nesta primeira versão fazemos comparação
     * case-insensitive respeitando a hierarquia de GameClass.
     */
    private async validateJob(
        characterJobKey: string,
        jobsJson: string | null,
    ): Promise<void> {

        if (!jobsJson) {
            return;
        }

        let jobs: Record<string, unknown>;

        try {
            jobs = JSON.parse(jobsJson);
        } catch {
            throw new Error(
                "Invalid item jobs data",
            );
        }

        const entries = Object.entries(jobs);

        if (entries.length === 0) {
            return;
        }

        const normalizedJobKey =
            characterJobKey.trim().toLowerCase();

        const explicitFalseJobs = entries
            .filter(([, value]) => value === false)
            .map(([job]) => job);

        const isExplicitlyDenied =
            await this.characterMatchesJobHierarchy(
                characterJobKey.trim(),
                explicitFalseJobs,
            );

        if (isExplicitlyDenied) {
            throw new Error(
                `Job ${characterJobKey} cannot equip this item`,
            );
        }

        const allEntry = entries.find(
            ([job]) =>
                job.trim().toLowerCase() === "all",
        );

        if (allEntry?.[1] === true) {
            return;
        }

        const allowedJobs = entries
            .filter(([, value]) => value === true)
            .map(([job]) => job)
            .filter(
                (job) =>
                    job.trim().toLowerCase() !== "all",
            );

        if (allowedJobs.length === 0) {
            throw new Error(
                `Job ${characterJobKey} cannot equip this item`,
            );
        }

        const allowed =
            await this.characterMatchesJobHierarchy(
                characterJobKey.trim(),
                allowedJobs,
            );

        if (!allowed) {
            throw new Error(
                `Job ${characterJobKey} cannot equip this item`,
            );
        }
    }

    private async characterMatchesJobHierarchy(
        characterJobKey: string,
        targetJobs: string[],
    ): Promise<boolean> {

        const normalizedTargets = new Set(
            targetJobs.map(
                (job) => job.trim().toLowerCase(),
            ),
        );

        let currentJobKey: string | null =
            characterJobKey.trim();

        const visited = new Set<string>();

        while (currentJobKey) {
            const normalizedCurrent =
                currentJobKey.toLowerCase();

            if (visited.has(normalizedCurrent)) {
                throw new Error(
                    `Circular GameClass hierarchy detected at ${currentJobKey}`,
                );
            }

            visited.add(normalizedCurrent);

            if (
                normalizedTargets.has(
                    normalizedCurrent,
                )
            ) {
                return true;
            }

            const gameClass: {
                aegisName: string;
                parentId: number | null;
            } | null =
                await prisma.gameClass.findUnique({
                    where: {
                        aegisName: currentJobKey,
                    },
                    select: {
                        aegisName: true,
                        parentId: true,
                    },
                });

            if (!gameClass) {
                return false;
            }

            if (gameClass.parentId === null) {
                return false;
            }

            const parent: {
                aegisName: string;
            } | null =
                await prisma.gameClass.findUnique({
                    where: {
                        id: gameClass.parentId,
                    },
                    select: {
                        aegisName: true,
                    },
                });

            if (!parent) {
                return false;
            }

            currentJobKey =
                parent.aegisName;
        }

        return false;
    }
}

export const equipmentService =
    new EquipmentService();