export class CoordinateSystem {
  private static readonly TILE_SIZE = 32;

  /** Convert server grid/tile coordinates to world render pixels */
  public static tileToWorld(tileX: number, tileY: number): { x: number; y: number } {
    return {
      x: tileX * this.TILE_SIZE + this.TILE_SIZE / 2,
      y: tileY * this.TILE_SIZE + this.TILE_SIZE / 2,
    };
  }

  /** Convert world render pixels to server tile coordinates */
  public static worldToTile(worldX: number, worldY: number): { tileX: number; tileY: number } {
    return {
      tileX: Math.floor(worldX / this.TILE_SIZE),
      tileY: Math.floor(worldY / this.TILE_SIZE),
    };
  }

  /** Calculate 8-way directional heading from movement vector */
  public static getDirection(dx: number, dy: number): number {
    if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) return 0; // Center / Idle
    const angle = Math.atan2(dy, dx) * (180 / Math.PI); // -180 to 180
    // 0: East, 45: SE, 90: South, 135: SW, 180: West, -135: NW, -90: North, -45: NE
    return angle;
  }
}
