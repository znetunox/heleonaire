var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Schema, MapSchema, type } from "@colyseus/schema";
export class Player extends Schema {
    constructor() {
        // ─────────────────────────────────────────────────────────────
        // IDENTIDADE
        // ─────────────────────────────────────────────────────────────
        super(...arguments);
        this.id = "";
        this.characterId = "";
        this.name = "";
        this.class = "knight";
        this.faction = "heleonaire";
        // ─────────────────────────────────────────────────────────────
        // BASE LEVEL / JOB LEVEL
        // ─────────────────────────────────────────────────────────────
        this.level = 1;
        this.jobLevel = 1;
        // ─────────────────────────────────────────────────────────────
        // EXPERIENCE
        // ─────────────────────────────────────────────────────────────
        this.baseExp = 0;
        /**
         * EXP necessária para o próximo Base Level.
         *
         * É um valor de runtime.
         * Posteriormente será calculado a partir da tabela
         * oficial de EXP importada do rAthena.
         */
        this.maxBaseExp = 100;
        this.jobExp = 0;
        /**
         * Pontos de habilidade disponíveis para aprender/evoluir skills.
         *
         * O sistema de skills ainda será implementado.
         */
        this.availableSkillPoints = 0;
        // ─────────────────────────────────────────────────────────────
        // HP / MP
        // ─────────────────────────────────────────────────────────────
        this.hp = 100;
        this.maxHp = 100;
        this.mp = 50;
        this.maxMp = 50;
        // ─────────────────────────────────────────────────────────────
        // POSITION
        // ─────────────────────────────────────────────────────────────
        this.x = 200;
        this.y = 200;
        this.targetX = 200;
        this.targetY = 200;
        this.targetId = "";
        // ─────────────────────────────────────────────────────────────
        // BASE ATTRIBUTES
        // ─────────────────────────────────────────────────────────────
        this.str = 1;
        this.agi = 1;
        this.vit = 1;
        this.int = 1;
        this.dex = 1;
        this.luk = 1;
        // ─────────────────────────────────────────────────────────────
        // ATTRIBUTE POINTS
        // ─────────────────────────────────────────────────────────────
        /**
         * Pontos de atributo disponíveis para o jogador distribuir.
         *
         * NÃO são pontos ganhos automaticamente nos atributos.
         */
        this.availablePoints = 0;
        // ─────────────────────────────────────────────────────────────
        // DERIVED COMBAT STATS
        // ─────────────────────────────────────────────────────────────
        /**
         * Valores derivados temporários.
         *
         * Posteriormente deverão ser recalculados pelo StatSystem
         * a partir de:
         *
         * Base Stats
         * + Equipamentos
         * + Classe
         * + Buffs/Debuffs
         * + Arma
         */
        this.atk = 2;
        this.def = 1;
        /**
         * ASPD em milissegundos por ataque.
         */
        this.aspd = 800;
    }
}
__decorate([
    type("string"),
    __metadata("design:type", String)
], Player.prototype, "id", void 0);
__decorate([
    type("string"),
    __metadata("design:type", String)
], Player.prototype, "characterId", void 0);
__decorate([
    type("string"),
    __metadata("design:type", String)
], Player.prototype, "name", void 0);
__decorate([
    type("string"),
    __metadata("design:type", String)
], Player.prototype, "class", void 0);
__decorate([
    type("string"),
    __metadata("design:type", String)
], Player.prototype, "faction", void 0);
__decorate([
    type("number"),
    __metadata("design:type", Number)
], Player.prototype, "level", void 0);
__decorate([
    type("number"),
    __metadata("design:type", Number)
], Player.prototype, "jobLevel", void 0);
__decorate([
    type("number"),
    __metadata("design:type", Number)
], Player.prototype, "baseExp", void 0);
__decorate([
    type("number"),
    __metadata("design:type", Number)
], Player.prototype, "maxBaseExp", void 0);
__decorate([
    type("number"),
    __metadata("design:type", Number)
], Player.prototype, "jobExp", void 0);
__decorate([
    type("number"),
    __metadata("design:type", Number)
], Player.prototype, "availableSkillPoints", void 0);
__decorate([
    type("number"),
    __metadata("design:type", Number)
], Player.prototype, "hp", void 0);
__decorate([
    type("number"),
    __metadata("design:type", Number)
], Player.prototype, "maxHp", void 0);
__decorate([
    type("number"),
    __metadata("design:type", Number)
], Player.prototype, "mp", void 0);
__decorate([
    type("number"),
    __metadata("design:type", Number)
], Player.prototype, "maxMp", void 0);
__decorate([
    type("number"),
    __metadata("design:type", Number)
], Player.prototype, "x", void 0);
__decorate([
    type("number"),
    __metadata("design:type", Number)
], Player.prototype, "y", void 0);
__decorate([
    type("number"),
    __metadata("design:type", Number)
], Player.prototype, "targetX", void 0);
__decorate([
    type("number"),
    __metadata("design:type", Number)
], Player.prototype, "targetY", void 0);
__decorate([
    type("string"),
    __metadata("design:type", String)
], Player.prototype, "targetId", void 0);
__decorate([
    type("number"),
    __metadata("design:type", Number)
], Player.prototype, "str", void 0);
__decorate([
    type("number"),
    __metadata("design:type", Number)
], Player.prototype, "agi", void 0);
__decorate([
    type("number"),
    __metadata("design:type", Number)
], Player.prototype, "vit", void 0);
__decorate([
    type("number"),
    __metadata("design:type", Number)
], Player.prototype, "int", void 0);
__decorate([
    type("number"),
    __metadata("design:type", Number)
], Player.prototype, "dex", void 0);
__decorate([
    type("number"),
    __metadata("design:type", Number)
], Player.prototype, "luk", void 0);
__decorate([
    type("number"),
    __metadata("design:type", Number)
], Player.prototype, "availablePoints", void 0);
__decorate([
    type("number"),
    __metadata("design:type", Number)
], Player.prototype, "atk", void 0);
__decorate([
    type("number"),
    __metadata("design:type", Number)
], Player.prototype, "def", void 0);
__decorate([
    type("number"),
    __metadata("design:type", Number)
], Player.prototype, "aspd", void 0);
export class Mob extends Schema {
    constructor() {
        // ─────────────────────────────────────────────────────────────
        // IDENTIDADE
        // ─────────────────────────────────────────────────────────────
        super(...arguments);
        this.id = "";
        this.mobDbId = 1001;
        this.name = "Monster";
        // ─────────────────────────────────────────────────────────────
        // LEVEL
        // ─────────────────────────────────────────────────────────────
        this.level = 1;
        // ─────────────────────────────────────────────────────────────
        // HP
        // ─────────────────────────────────────────────────────────────
        this.hp = 50;
        this.maxHp = 50;
        // ─────────────────────────────────────────────────────────────
        // POSITION
        // ─────────────────────────────────────────────────────────────
        this.x = 300;
        this.y = 300;
        this.targetX = 300;
        this.targetY = 300;
        this.targetId = "";
        // ─────────────────────────────────────────────────────────────
        // COMBAT
        // ─────────────────────────────────────────────────────────────
        this.atk = 10;
        this.def = 2;
        this.exp = 50;
        // ─────────────────────────────────────────────────────────────
        // STATE
        // ─────────────────────────────────────────────────────────────
        this.isDead = false;
        this.spriteKey = "skeleton";
    }
}
__decorate([
    type("string"),
    __metadata("design:type", String)
], Mob.prototype, "id", void 0);
__decorate([
    type("number"),
    __metadata("design:type", Number)
], Mob.prototype, "mobDbId", void 0);
__decorate([
    type("string"),
    __metadata("design:type", String)
], Mob.prototype, "name", void 0);
__decorate([
    type("number"),
    __metadata("design:type", Number)
], Mob.prototype, "level", void 0);
__decorate([
    type("number"),
    __metadata("design:type", Number)
], Mob.prototype, "hp", void 0);
__decorate([
    type("number"),
    __metadata("design:type", Number)
], Mob.prototype, "maxHp", void 0);
__decorate([
    type("number"),
    __metadata("design:type", Number)
], Mob.prototype, "x", void 0);
__decorate([
    type("number"),
    __metadata("design:type", Number)
], Mob.prototype, "y", void 0);
__decorate([
    type("number"),
    __metadata("design:type", Number)
], Mob.prototype, "targetX", void 0);
__decorate([
    type("number"),
    __metadata("design:type", Number)
], Mob.prototype, "targetY", void 0);
__decorate([
    type("string"),
    __metadata("design:type", String)
], Mob.prototype, "targetId", void 0);
__decorate([
    type("number"),
    __metadata("design:type", Number)
], Mob.prototype, "atk", void 0);
__decorate([
    type("number"),
    __metadata("design:type", Number)
], Mob.prototype, "def", void 0);
__decorate([
    type("number"),
    __metadata("design:type", Number)
], Mob.prototype, "exp", void 0);
__decorate([
    type("boolean"),
    __metadata("design:type", Boolean)
], Mob.prototype, "isDead", void 0);
__decorate([
    type("string"),
    __metadata("design:type", String)
], Mob.prototype, "spriteKey", void 0);
export class WorldState extends Schema {
    constructor() {
        super(...arguments);
        this.players = new MapSchema();
        this.mobs = new MapSchema();
    }
}
__decorate([
    type({ map: Player }),
    __metadata("design:type", Object)
], WorldState.prototype, "players", void 0);
__decorate([
    type({ map: Mob }),
    __metadata("design:type", Object)
], WorldState.prototype, "mobs", void 0);
