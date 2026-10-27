
export const CONSTANT = 1.00016093
export const GRAVITY = 2

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

export const DragBlocks = {
    BASE: Math.pow(0.9981, 10) * CONSTANT,
    NO_MOD: Math.pow(0.99, 10) * CONSTANT,
}

export const LiquidDrag: { [id: number]: number } = {
    [Block.Water]: Math.pow(0.995, 10) * CONSTANT,
    [Block.Mud]: Math.pow(0.975, 10) * CONSTANT,
    [Block.Lava]: Math.pow(0.98, 10) * CONSTANT,
    [Block.Toxic]: Math.pow(0.99, 10) * CONSTANT
}

export const BuoyancyBlocks: Record<number, number> = {
    [Block.Water]: -0.5,
    [Block.Mud]: 0.4,
    [Block.Lava]: 0.2,
    [Block.Toxic]: -0.4
}

export const GravityBlocks: Record<number, [number, number]> = {
    [Block.GravityLeft]: [-GRAVITY, 0],
    [Block.GravityRight]: [GRAVITY, 0],
    [Block.GravityUp]: [0, -GRAVITY],
    [Block.GravityDown]: [0, GRAVITY],
    [Block.GravityDot]: [0, 0],
}

export const isLiquid = (id: number) => id >= Block.Water && id <= Block.Toxic
export const isBG = (id: number) => false // none currently

export function layerOf(id: number) {
    return isBG(id) ? 1 : 0
}