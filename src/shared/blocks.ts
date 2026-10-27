
export const enum Block {
    Empty = 0,
    Basic = 1,
    GravityLeft = 100,
    GravityRight = 101,
    GravityUp = 102,
    GravityDown = 103,
    GravityDot = 104,

    Water = 200,
    Mud = 201,
    Lava = 202,
    Toxic = 203,
    Spike = 204,
}

export const isLiquid = (id: number) => id >= Block.Water && id <= Block.Toxic
export const isBG = (id: number) => false // none currently

export function layerOf(id: number) {
    return isBG(id) ? 1 : 0
}