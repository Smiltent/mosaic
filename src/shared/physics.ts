
import { BuoyancyBlocks, DragBlocks, GRAVITY, GravityBlocks, isLiquid, LiquidDrag } from "@/src/shared/blocks.ts"
import { FG, SIZE, World } from "@/src/shared/world.ts"
import { Input, Player } from "@/src/shared/player.ts"

export const JUMP = 26
export const BOOST = 16
export const MAX_SPEED = 16
export const DEADZONE = 0.0001

const DragBase = {
    STEER: DragBlocks.BASE,
    NO_MOD: DragBlocks.BASE * DragBlocks.NO_MOD
}

function hits(w: World, px: number, py: number) {
    return w.isSolid(Math.floor(px / SIZE), Math.floor(py / SIZE))
}

function rectHits(w: World, x: number, y: number) {
    return hits(w, x, y) || hits(w, x + SIZE - 1, y) || hits(w, x, y + SIZE - 1) || hits(w, x + SIZE - 1, y + SIZE - 1)
}

function clampSpeed(v: number) {
    if (v > MAX_SPEED) return MAX_SPEED
    if (v < -MAX_SPEED) return -MAX_SPEED

    return v < DEADZONE && v > -DEADZONE ? 0 : v
}

export function stepPlayer(p: Player, input: Input, world: World) {
    const hor = (input.right ? 1 : 0) - (input.left ? 1 : 0)
    const ver = (input.down ? 1 : 0) - (input.up ? 1 : 0)

    const cx = Math.floor((p.x + SIZE / 2) / SIZE)
    const cy = Math.floor((p.y + SIZE / 2) / SIZE)
    const current = world.get(FG, cx, cy)
    const below = world.get(FG, cx, cy + 1)

    let morx = 0
    let mory = GRAVITY
    let mox = 0
    let moy = GRAVITY

    if (current in BuoyancyBlocks) {
        mory = BuoyancyBlocks[current]
    } else if (current in GravityBlocks) {
        [morx, mory] = GravityBlocks[current]
    }

    if (below in BuoyancyBlocks) {
        moy = BuoyancyBlocks[below]
    } else if (below in GravityBlocks) {
        [mox, moy] = GravityBlocks[below]
    }

    // input force
    let mx: number
    let my: number
    if (isLiquid(current) || (morx === 0 && mory === 0 && mox === 0 && moy === 0)) {
        mx = hor
        my = ver
    } else if (mory !== 0 || moy !== 0) {
        mx = hor
        my = 0
    } else {
        mx = 0
        my = ver
    }

    if (p.onGround) {
        p.jumpCount = 0
    }

    // jumping
    const now = Date.now()
    let jumpNow = input.justSpace

    if (input.space && !input.justSpace) {
        if (p.lastJump < 0 ? now + p.lastJump > 750 : now - p.lastJump < 150) {
            jumpNow = true
        }
    }

    if (input.justSpace) {
        p.lastJump = -now
    } else if (!input.space && p.lastJump < 0) {
        p.lastJump = now
    }

    if (jumpNow && p.jumpCount < p.maxJumps) {
        if (morx !== 0 || mox !== 0) {
            if (p.maxJumps < 1000) {
                p.jumpCount++
            }

            p.speedX = -morx * JUMP
        }

        if (mory !== 0 || moy !== 0) {
            if (p.maxJumps < 1000) {
                p.jumpCount++
            }

            p.speedY = -mory * JUMP
        }
            
        p.onGround = false
    }

    // dragging
    const drag = LiquidDrag[current]
    if (p.speedX !== 0 || mox + mx !== 0) {
        p.speedX += mox + mx
        p.speedX *= (mx === 0 && moy === 0) || (p.speedX < 0 && mx > 0) || (p.speedX > 0 && mx < 0)
            ? DragBase.NO_MOD
            : DragBase.STEER * (drag ?? 1)

        p.speedX = clampSpeed(p.speedX)
    }

    if (p.speedY !== 0 || moy + my !== 0) {
        p.speedY += moy + my
        p.speedY *= (my === 0 && mox === 0) || (p.speedY < 0 && my > 0) || (p.speedY > 0 && my < 0)
            ? DragBase.NO_MOD
            : DragBase.STEER * (drag ?? 1)

        p.speedY = clampSpeed(p.speedY)
    }

    p.onGround = false
    p.x += p.speedX
    if (rectHits(world, p.x, p.y)) {
        if ((morx > 0 && p.speedX > 0) || (morx < 0 && p.speedX < 0)) {
            p.onGround = true
        }

        p.x = p.speedX > 0 
            ? Math.floor((p.x + SIZE) / SIZE) * SIZE - SIZE 
            : (Math.floor(p.x / SIZE) + 1) * SIZE

        p.speedX = 0
    }

    p.y += p.speedY
    if (rectHits(world, p.x, p.y)) {
        if ((mory > 0 && p.speedY > 0) || (mory < 0 && p.speedY < 0)) {
            p.onGround = true
        }

        p.y = p.speedY > 0 
            ? Math.floor((p.y + SIZE) / SIZE) * SIZE - SIZE 
            : (Math.floor(p.y / SIZE) + 1) * SIZE

        p.speedY = 0
    }
}