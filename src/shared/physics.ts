
import { SIZE, World } from "@/src/shared/world.ts"
import { Player } from "@/src/shared/player.ts"

const BASE_DRAG = Math.pow(0.9981, 10) * 1.00016093
const NO_MOD_DRAG = Math.pow(0.99, 10) * 1.00016093
const GRAVITY = 2
const JUMP = 26
const MAX_SPEED = 16

function hits(w: World, px: number, py: number) {
    return w.isSolid(Math.floor(px / SIZE), Math.floor(py / SIZE))
}

function rectHits(w: World, x: number, y: number) {
    return hits(w, x, y) || hits(w, x + SIZE - 1, y) || hits(w, x, y + SIZE - 1) || hits(w, x + SIZE - 1, y + SIZE - 1)
}

export interface Input {
    left: boolean
    right: boolean
    up: boolean
    down: boolean

    space: boolean
}

export function stepPlayer(p: Player, input: Input, world: World) {
    const mx = (input.right ? 1 : 0) - (input.left ? 1 : 0)
    const my = (input.down ? 1 : 0) - (input.up ? 1 : 0)

    p.speedX = (p.speedX + mx) * (mx === 0 ? BASE_DRAG * NO_MOD_DRAG : BASE_DRAG)
    p.speedY = (p.speedY + GRAVITY + my) * BASE_DRAG

    p.speedX = Math.abs(p.speedX) < 0.0001 ? 0 : Math.max(-MAX_SPEED, Math.min(MAX_SPEED, p.speedX))
    p.speedY = Math.abs(p.speedY) < 0.0001 ? 0 : Math.max(-MAX_SPEED, Math.min(MAX_SPEED, p.speedY))

    if (input.space && p.onGround) p.speedY = -JUMP
    p.onGround = false

    p.x += p.speedX
    if (rectHits(world, p.x, p.y)) {
        p.x = p.speedX > 0 ? Math.floor((p.x + SIZE) / SIZE) * SIZE - SIZE : (Math.floor(p.x / SIZE) + 1) * SIZE
        p.speedX = 0
    }

    p.y += p.speedY
    if (rectHits(world, p.x, p.y)) {
        if (p.speedY > 0) {
            p.y = Math.floor((p.y + SIZE) / SIZE) * SIZE - SIZE
            p.onGround = true
        } else {
            p.y = (Math.floor(p.y / SIZE) + 1) * SIZE
        }

        p.speedY = 0
    }
}