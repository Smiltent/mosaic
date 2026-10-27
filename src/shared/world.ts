
export const WIDTH = 80
export const HEIGHT = 45
export const SIZE = 16

export const MS_PER_TICK = 10

export const FG = 0
export const BG = 1

export class World {
    public layers = [new Uint16Array(WIDTH * HEIGHT), new Uint16Array(WIDTH * HEIGHT)]

    public get(layer: number, x: number, y: number) {
        return this.layers[layer][y * WIDTH + x]
    }

    public set(layer: number, x: number, y: number, id: number) {
        if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return
        this.layers[layer][y * WIDTH + x] = id
    }

    public isSolid(x: number, y: number) {
        if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return true 
        return this.layers[FG][y * WIDTH + x] === 1
    }
}