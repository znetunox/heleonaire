const definitions = [
    {
        id: "SC_ASPDPOTION0",
        modifiers: [],
    },
    {
        id: "SC_ASPDPOTION1",
        modifiers: [],
    },
    {
        id: "SC_ASPDPOTION2",
        modifiers: [],
    },
    {
        id: "SC_ASPDPOTION3",
        modifiers: [],
    },
    {
        id: "SC_STRFOOD",
        modifiers: [
            {
                type: "ADDITIVE",
                stat: "str",
            },
        ],
    },
    {
        id: "SC_AGIFOOD",
        modifiers: [
            {
                type: "ADDITIVE",
                stat: "agi",
            },
        ],
    },
    {
        id: "SC_VITFOOD",
        modifiers: [
            {
                type: "ADDITIVE",
                stat: "vit",
            },
        ],
    },
    {
        id: "SC_INTFOOD",
        modifiers: [
            {
                type: "ADDITIVE",
                stat: "int",
            },
        ],
    },
    {
        id: "SC_DEXFOOD",
        modifiers: [
            {
                type: "ADDITIVE",
                stat: "dex",
            },
        ],
    },
    {
        id: "SC_LUKFOOD",
        modifiers: [
            {
                type: "ADDITIVE",
                stat: "luk",
            },
        ],
    },
    {
        id: "SC_ATKPOTION",
        modifiers: [
            {
                type: "ADDITIVE",
                stat: "atk",
            },
        ],
    },
    {
        id: "SC_MATKPOTION",
        modifiers: [
            {
                type: "ADDITIVE",
                stat: "matk",
            },
        ],
    },
    {
        id: "SC_HITFOOD",
        modifiers: [
            {
                type: "ADDITIVE",
                stat: "hit",
            },
        ],
    },
    {
        id: "SC_FLEEFOOD",
        modifiers: [
            {
                type: "ADDITIVE",
                stat: "flee",
            },
        ],
    },
    {
        id: "SC_INCCRI",
        modifiers: [
            {
                type: "ADDITIVE",
                stat: "crit",
            },
        ],
    },
    {
        id: "SC_INCREASE_MAXHP",
        modifiers: [
            {
                type: "PERCENT",
                stat: "maxHp",
            },
        ],
    },
    {
        id: "SC_INCREASE_MAXSP",
        modifiers: [
            {
                type: "PERCENT",
                stat: "maxMp",
            },
        ],
    },
];
const statusDefinitionMap = new Map(definitions.map((definition) => [
    definition.id,
    definition,
]));
export function getStatusDefinition(statusId) {
    return statusDefinitionMap.get(statusId);
}
