/**
 * rathenaParser.ts
 * Reads rAthena YAML database files (mob_db, item_db, skill_db) and
 * converts them into typed Heleonaire data structures.
 * Zero Ragnarok Online assets are used — data only.
 */
import { readFileSync } from 'fs';
import { join, resolve } from 'path';
import { parse as parseYaml } from 'yaml';
// Load rAthena YAMLs tolerating intentional duplicate keys (e.g. RaceGroups, Trade)
function loadRathenaYaml(content) {
    return parseYaml(content, { uniqueKeys: false });
}
// Adjust this path to the rathena-master folder relative to the server root
const RATHENA_PATH = resolve(process.cwd(), '../../rathena-master/db/re');
// ─── Mob Parser ───────────────────────────────────────────────────────────────
function parseMobs(filePath) {
    const content = readFileSync(filePath, 'utf-8');
    const parsed = loadRathenaYaml(content);
    const mobs = new Map();
    for (const raw of parsed.Body ?? []) {
        const drops = (raw.Drops ?? []).map((d) => ({
            item: String(d.Item),
            rate: d.Rate,
            stealProtected: d.StealProtected ?? false
        }));
        const mob = {
            id: raw.Id,
            aegisName: raw.AegisName,
            name: raw.Name,
            level: raw.Level ?? 1,
            hp: raw.Hp ?? 1,
            sp: raw.Sp ?? 1,
            baseExp: raw.BaseExp ?? 0,
            jobExp: raw.JobExp ?? 0,
            attack: raw.Attack ?? 0,
            attack2: raw.Attack2 ?? 0,
            defense: raw.Defense ?? 0,
            resistance: raw.Resistance ?? 0,
            magicDefense: raw.MagicDefense ?? 0,
            str: raw.Str ?? 1,
            agi: raw.Agi ?? 1,
            vit: raw.Vit ?? 1,
            int: raw.Int ?? 1,
            dex: raw.Dex ?? 1,
            luk: raw.Luk ?? 1,
            attackRange: raw.AttackRange ?? 1,
            skillRange: raw.SkillRange ?? 10,
            chaseRange: raw.ChaseRange ?? 12,
            size: raw.Size ?? 'Small',
            race: raw.Race ?? 'Formless',
            element: raw.Element ?? 'Neutral',
            elementLevel: raw.ElementLevel ?? 1,
            walkSpeed: raw.WalkSpeed ?? 200,
            attackDelay: raw.AttackDelay ?? 2000,
            attackMotion: raw.AttackMotion ?? 720,
            damageMotion: raw.DamageMotion ?? 480,
            ai: String(raw.Ai ?? '01'),
            drops
        };
        mobs.set(mob.id, mob);
    }
    return mobs;
}
// ─── Item Parser ───────────────────────────────────────────────────────────────
function parseItems(filePath) {
    const content = readFileSync(filePath, 'utf-8');
    const parsed = loadRathenaYaml(content);
    const items = new Map();
    for (const raw of parsed.Body ?? []) {
        const item = {
            id: raw.Id,
            aegisName: raw.AegisName,
            name: raw.Name,
            type: raw.Type ?? 'Etc',
            subType: raw.SubType,
            buy: raw.Buy ?? 0,
            sell: raw.Sell ?? 0,
            weight: raw.Weight ?? 0,
            attack: raw.Attack ?? 0,
            magicAttack: raw.MagicAttack ?? 0,
            defense: raw.Defense ?? 0,
            range: raw.Range ?? 0,
            slots: raw.Slots ?? 0,
            weaponLevel: raw.WeaponLevel,
            armorLevel: raw.ArmorLevel,
            equipLevelMin: raw.EquipLevelMin ?? 0,
            refineable: raw.Refineable ?? false
        };
        // Evita duplicação: apenas seta se o ID não existir
        if (!items.has(item.id)) {
            items.set(item.id, item);
        }
    }
    return items;
}
// ─── Database Registry ────────────────────────────────────────────────────────
class RathenaDatabase {
    constructor() {
        this.mobs = new Map();
        this.items = new Map();
        this.loaded = false;
    }
    load() {
        if (this.loaded)
            return;
        console.log('[rAthena] Loading mob database...');
        try {
            this.mobs = parseMobs(join(RATHENA_PATH, 'mob_db.yml'));
            console.log(`[rAthena] Loaded ${this.mobs.size} mobs`);
        }
        catch (e) {
            console.warn('[rAthena] Failed to load mob_db.yml:', e.message);
        }
        // Carrega os 4 arquivos de itens (acumula no mesmo Map, evita duplicação pelo mesmo ID)
        const itemFiles = [
            'item_db_equip.yml',
            'item_db_etc.yml',
            'item_db_usable.yml',
            'item_db.yml'
        ];
        for (const file of itemFiles) {
            console.log(`[rAthena] Loading item database (${file})...`);
            try {
                const fileItems = parseItems(join(RATHENA_PATH, file));
                for (const [id, item] of fileItems) {
                    // Apenas adiciona se o ID ainda não existe no Map principal
                    if (!this.items.has(id)) {
                        this.items.set(id, item);
                    }
                }
                console.log(`[rAthena] Loaded ${this.items.size} unique items total`);
            }
            catch (e) {
                console.warn(`[rAthena] Failed to load ${file}:`, e.message);
            }
        }
        this.loaded = true;
    }
    getMob(id) {
        return this.mobs.get(id);
    }
    getMobByName(aegisName) {
        for (const mob of this.mobs.values()) {
            if (mob.aegisName === aegisName)
                return mob;
        }
        return undefined;
    }
    getItem(id) {
        return this.items.get(id);
    }
    getAllMobsInLevelRange(minLevel, maxLevel) {
        return Array.from(this.mobs.values()).filter(m => m.level >= minLevel && m.level <= maxLevel);
    }
    getMobCount() { return this.mobs.size; }
    getItemCount() { return this.items.size; }
    getAllItems() {
        return this.items.values();
    }
    isLoaded() {
        return this.loaded;
    }
    getAllMobs() {
        return this.mobs.values();
    }
}
// Singleton
export const rathenaDb = new RathenaDatabase();
