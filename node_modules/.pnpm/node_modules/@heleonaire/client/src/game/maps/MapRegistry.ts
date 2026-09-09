export interface Portal {
  x: number;
  y: number;
  radius: number;
  targetMap: string;
}

export interface MapConfig {
  id: string;
  name: string;
  tileWidth: number;
  tileHeight: number;
  width: number;
  height: number;
  jsonPath: string;
  tilesetPath: string;
  tilesetKey: string;
  defaultSpawn: { x: number; y: number };
  portals: Portal[];
}

export const MAP_REGISTRY: Record<string, MapConfig> = {
  plains_of_ash: {
    id: 'plains_of_ash',
    name: 'Plains of Ash (Pradarias das Cinzas)',
    tileWidth: 32,
    tileHeight: 32,
    width: 40,
    height: 40,
    jsonPath: '/assets/maps/plains_of_ash.json',
    tilesetPath: '/assets/tilesets/world_tiles.png',
    tilesetKey: 'world_tiles',
    defaultSpawn: { x: 200, y: 200 },
    portals: [
      { x: 20, y: 640, radius: 30, targetMap: 'ash_field02' },
      { x: 1260, y: 640, radius: 30, targetMap: 'ash_field02' },
    ],
  },
  ash_field02: {
    id: 'ash_field02',
    name: 'Ash Field 02',
    tileWidth: 32,
    tileHeight: 32,
    width: 40,
    height: 40,
    jsonPath: '/assets/maps/ash_field02.json',
    tilesetPath: '/assets/tilesets/world_tiles.png',
    tilesetKey: 'world_tiles',
    defaultSpawn: { x: 200, y: 200 },
    portals: [
      { x: 20, y: 640, radius: 30, targetMap: 'plains_of_ash' },
    ],
  },
};

export function getMapConfig(mapId: string): MapConfig {
  return MAP_REGISTRY[mapId] || MAP_REGISTRY.plains_of_ash;
}