import { WIDTH, SIZE, HEIGHT, World, BG, FG } from "@/src/shared/world.ts";
import { Player } from "@/src/shared/player.ts";
import { camX, camY } from "@/src/client/handlers/camera.ts";
import { brickSprite } from "@/src/client/bricks.ts";

const GAME_W = WIDTH * SIZE // 1280
const GAME_H = HEIGHT * SIZE // 720
export const ZOOM = 1

export function scale() {
    return (devicePixelRatio || 1) * ZOOM
}

export function tileAt(canvas: HTMLCanvasElement, e: MouseEvent) {
    const rect = canvas.getBoundingClientRect()

    const wx = camX + (e.clientX - rect.left) / ZOOM
    const wy = camY + (e.clientY - rect.top) / ZOOM

    return {
        x: Math.floor(wx / SIZE),
        y: Math.floor(wy / SIZE),
    }
}

export function resize(canvas: HTMLCanvasElement, draw: () => void) {
    const rect = canvas.getBoundingClientRect()
    const dpr = devicePixelRatio || 1

    canvas.width = Math.round(rect.width * dpr)
    canvas.height = Math.round(rect.height * dpr)

    draw()
}

export function draw(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, world: World, me: Player | null, others: Iterable<Player>) {
    const s = scale()
    const viewW = canvas.width / s
    const viewH = canvas.height / s

    ctx.setTransform(s, 0, 0, s, -camX * s, -camY * s)
    ctx.imageSmoothingEnabled = false

    // surrounding area
    ctx.fillStyle = "#000"
    ctx.fillRect(camX, camY, viewW, viewH)

    // play area
    ctx.fillStyle = "#565656"
    ctx.fillRect(0, 0, GAME_W, GAME_H)

    const x0 = Math.max(0, Math.floor(camX / SIZE) - 1)
    const y0 = Math.max(0, Math.floor(camY / SIZE) - 1)
    const x1 = Math.min(WIDTH, Math.ceil((camX + viewW) / SIZE) + 1)
    const y1 = Math.min(HEIGHT, Math.ceil((camY + viewH) / SIZE) + 1)

    for (const layer of [BG, FG] as const) {
        for (let y = y0; y < y1; y++) {
            for (let x = x0; x < x1; x++) {
                const id = world.get(layer, x, y)
                if (id) {
                    ctx.drawImage(brickSprite(id), x * SIZE, y * SIZE)
                }
            }
        }
    }

    for (const p of others) {
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x + SIZE / 2, p.y + SIZE / 2, SIZE / 2, 0, Math.PI * 2)
        ctx.fill()
    }

    if (me) {
        ctx.fillStyle = me.color
        ctx.beginPath()
        ctx.arc(me.x + SIZE / 2, me.y + SIZE / 2, SIZE / 2, 0, Math.PI * 2)
        ctx.fill()
    }
}