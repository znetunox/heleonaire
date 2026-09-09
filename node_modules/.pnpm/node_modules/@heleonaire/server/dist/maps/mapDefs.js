export const MAP_DEFS = {
    plains_of_ash: {
        mobDbIds: [1001, 1002, 1004, 1005], // Scorpion, Poring, Fabre, etc.
        mobCount: 15,
        defaultSpawn: { x: 200, y: 200 },
        portals: [
            { x: 20, y: 640, radius: 30, targetMap: 'ash_field02' },
            { x: 1260, y: 640, radius: 30, targetMap: 'ash_field02' },
        ],
    },
    ash_field02: {
        mobDbIds: [1002, 1113], // troque pelos mobs que quiser nesse mapa
        mobCount: 12,
        defaultSpawn: { x: 200, y: 200 },
        portals: [
            { x: 20, y: 640, radius: 30, targetMap: 'plains_of_ash' },
        ],
    },
};
