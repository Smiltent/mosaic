
import { isSolid, layerOf } from "@/src/shared/blocks.ts"

export const SIZE = 16
export const MS_PER_TICK = 10

export const FG = 0
export const BG = 1

export class World {
    public layers: Uint16Array[]

    constructor(public width: number, public height: number) {
        this.layers = [new Uint16Array(width * height), new Uint16Array(width * height)]
    }

    public get(layer: number, x: number, y: number) {
        return this.layers[layer][y * this.width + x]
    }

    public set(layer: number, x: number, y: number, id: number) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return
        this.layers[layer][y * this.width + x] = id
    }

    public setTile(layer: number, x: number, y: number, id: number) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false
        if (this.get(layer, x, y) === id) return false

        this.layers[layer][y * this.width + x] = id

        return true
    }

    public placeBlock(x: number, y: number, id: number, eraserLayer: number) {
        return this.setTile(id === 0 ? eraserLayer : layerOf(id), x, y, id)
    }

    public isSolid(x: number, y: number) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return true 
        return isSolid(this.layers[FG][y * this.width + x])
    }
}