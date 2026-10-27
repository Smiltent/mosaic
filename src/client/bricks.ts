import { SIZE } from "@/src/shared/world.ts"

const sprites = new Map<number, HTMLCanvasElement>()

function makeSprite(id: number) {
    const c = document.createElement("canvas")
    c.width = c.height = SIZE

    const g = c.getContext("2d")!

    const hue = (id * 47) % 360
    g.fillStyle = `hsl(${hue}, 50%, 45%)`
    g.fillRect(0, 0, SIZE, SIZE)
    g.fillStyle = `hsl(${hue}, 50%, 30%)`
    g.fillRect(0, SIZE - 1, SIZE, 1)
    g.fillRect(SIZE - 1, 0, 1, SIZE)

    return c
}

export function brickSprite(id: number) {
    let s = sprites.get(id)
    if (!s) {
        sprites.set(id, s = makeSprite(id))
    }

    return s
}