import prisma from "../../db/prisma";

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
             *
             * Ex:
             *
             * Munak_Turban
             * Head_Low
             * Head_Mid
             * Head_Top
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
     * daquele item são removidas.
     */
    async unequipItem(characterId: string, slot: string) {
        if (!characterId) {
            throw new Error("Character ID is required");
        }

        if (!slot) {
            throw new Error("Equipment slot is required");
        }

        const equipment = await prisma.characterEquipment.findFirst({
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
 * Calcula os modificadores numéricos fornecidos pelo
 * equipamento atualmente equipado.
 *
 * Item.attack       -> ATK
 * Item.magicAttack  -> MATK
 * Item.defense      -> DEF
 *
 * Um mesmo item pode ocupar múltiplos slots em
 * CharacterEquipment. Nesse caso, seus atributos
 * devem ser contabilizados apenas uma vez.
 */
    async getStatModifiers(characterId: string) {
        if (!characterId) {
            throw new Error("Character ID is required");
        }

        const equipment = await prisma.characterEquipment.findMany({
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
                    },
                },
            },
        });

        const equippedInstances = new Map<
            string,
            {
                type: string;
                attack: number | null;
                magicAttack: number | null;
                defense: number | null;
            }
        >();

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

        for (const item of equippedInstances.values()) {
            if (item.type === "Weapon") {
                if (item.attack !== null) {
                    weaponAtk += item.attack;
                }

                if (item.magicAttack !== null) {
                    equipMatk += item.magicAttack;
                }

                continue;
            }

            if (item.type === "Ammo") {
                if (item.attack !== null) {
                    ammoAtk += item.attack;
                }

                continue;
            }

            if (item.type === "Armor") {
                if (item.defense !== null) {
                    armorDef += item.defense;
                }

                continue;
            }

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

        return {
            weaponAtk,
            equipAtk,
            equipMatk,
            armorDef,
            ammoAtk,
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
     * IMPORTANTE:
     * item.jobs continua sendo o JSON original do rAthena.
     *
     * Nesta primeira versão fazemos somente comparação
     * case-insensitive do jobKey e nomes presentes no JSON.
     *
     * A hierarquia completa de GameClass será adicionada
     * quando fecharmos a regra de herança de jobs.
     */
    private async validateJob(
        characterJobKey: string,
        jobsJson: string | null,
    ): Promise<void> {

        // Item sem restrição de job.
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

        /**
         * Primeiro verificamos as restrições explícitas.
         *
         * Isso é importante para casos como:
         *
         * {
         *   "All": true,
         *   "Novice": false,
         *   "SuperNovice": false
         * }
         */
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

        /**
         * All=true significa que o item não possui uma
         * whitelist restritiva.
         *
         * As exceções false já foram avaliadas acima.
         */
        const allEntry = entries.find(
            ([job]) =>
                job.trim().toLowerCase() === "all",
        );

        if (allEntry?.[1] === true) {
            return;
        }

        /**
         * Sem All=true, precisamos encontrar o job do
         * personagem na árvore de GameClass.
         */
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

            if (normalizedTargets.has(normalizedCurrent)) {
                return true;
            }

            const gameClass: {
                aegisName: string;
                parentId: number | null;
            } | null = await prisma.gameClass.findUnique({
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
            } | null = await prisma.gameClass.findUnique({
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

            currentJobKey = parent.aegisName;
        }

        return false;
    }
}

export const equipmentService =
    new EquipmentService();