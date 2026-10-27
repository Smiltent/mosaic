import { Block, BuoyancyBlocks, DragBlocks, GRAVITY, GravityBlocks, isLiquid, LiquidDrag } from "@/src/shared/blocks.ts"
import { FG, HEIGHT, SIZE, WIDTH, World } from "@/src/shared/world.ts"
import { Input, Player } from "@/src/shared/player.ts"

export const JUMP = 26
export const BOOST = 16
export const MAX_SPEED = 16
export const DEADZONE = 0.0001
export const MULT = 7.752

function overlaps(w: World, x: number, y: number) {
    if (x < 0 || y < 0 || x > WIDTH * SIZE - SIZE || y > HEIGHT * SIZE - SIZE) return true

    const ox = x >> 4
    const oy = y >> 4
    const endX = (x + SIZE) / SIZE
    const endY = (y + SIZE) / SIZE

    for (let ty = oy; ty < endY; ty++) {
        for (let tx = ox; tx < endX; tx++) {
            if (w.isSolid(tx, ty)) return true
        }
    }

    return false
}

function gravityOf(id: number): [number, number] {
    if (id in BuoyancyBlocks) return [0, BuoyancyBlocks[id]]
    if (id in GravityBlocks) return GravityBlocks[id]
    return [0, GRAVITY]
}

function trunc(v: number) {
    return v | 0
}

function applyDrag(speed: number, input: number, crossGravity: number, current: number) {
    const noMod = (input === 0 && crossGravity !== 0)
        || (speed < 0 && input > 0)
        || (speed > 0 && input < 0)

    const liquid = LiquidDrag[current]
    if (noMod) {
        speed *= DragBlocks.BASE
        speed *= DragBlocks.NO_MOD
    } else if (liquid !== undefined) {
        speed *= DragBlocks.BASE
        speed *= liquid
    } else {
        speed *= DragBlocks.BASE
    }

    if (speed > MAX_SPEED) return MAX_SPEED
    if (speed < -MAX_SPEED) return -MAX_SPEED
    if (speed < DEADZONE && speed > -DEADZONE) return 0
    return speed
}

export function stepPlayer(p: Player, input: Input, world: World) {
    const hor = (input.right ? 1 : 0) - (input.left ? 1 : 0)
    const ver = (input.down ? 1 : 0) - (input.up ? 1 : 0)

    const cx = (p.x + 8) >> 4
    const cy = (p.y + 8) >> 4
    const current = world.get(FG, cx, cy)

    let delayed = p.tileQueue[0]
    p.tileQueue[0] = p.tileQueue[1]
    p.tileQueue[1] = current

    if (current === Block.GravityDot) {
        delayed = p.tileQueue[0]
        p.tileQueue[0] = p.tileQueue[1]
        p.tileQueue[1] = current
    }

    const [morx, mory] = gravityOf(current)
    const [mox, moy] = gravityOf(delayed)

    let mx: number
    let my: number
    if (isLiquid(delayed)) {
        mx = hor
        my = ver
    } else if (moy !== 0) {
        mx = hor
        my = 0
    } else if (mox !== 0) {
        mx = 0
        my = ver
    } else {
        mx = hor
        my = ver
    }

    const modifierX = (mox + mx) / MULT
    const modifierY = (moy + my) / MULT

    if (p.speedX !== 0 || modifierX !== 0) {
        p.speedX += modifierX
        p.speedX = applyDrag(p.speedX, mx, moy, current)
    }

    if (p.speedY !== 0 || modifierY !== 0) {
        p.speedY += modifierY
        p.speedY = applyDrag(p.speedY, my, mox, current)
    }

    let reminderX = p.x % 1
    let reminderY = p.y % 1
    let currentSX = p.speedX
    let currentSY = p.speedY
    let donex = false
    let doney = false
    let grounded = false

    const stepx = () => {
        const ox = p.x

        if (currentSX > 0) {
            if (currentSX + reminderX >= 1) {
                p.x += 1 - reminderX
                p.x = trunc(p.x)
                currentSX -= 1 - reminderX
                reminderX = 0
            } else {
                p.x += currentSX
                currentSX = 0
            }
        } else if (currentSX < 0) {
            if (reminderX + currentSX < 0 && reminderX !== 0) {
                currentSX += reminderX
                p.x -= reminderX
                p.x = trunc(p.x)
                reminderX = 1
            } else {
                p.x += currentSX
                currentSX = 0
            }
        }

        if (overlaps(world, p.x, p.y)) {
            p.x = ox
            if (p.speedX > 0 && morx > 0) grounded = true
            if (p.speedX < 0 && morx < 0) grounded = true
            p.speedX = 0
            currentSX = 0
            donex = true
        }
    }

    const stepy = () => {
        const oy = p.y

        if (currentSY > 0) {
            if (currentSY + reminderY >= 1) {
                p.y += 1 - reminderY
                p.y = trunc(p.y)
                currentSY -= 1 - reminderY
                reminderY = 0
            } else {
                p.y += currentSY
                currentSY = 0
            }
        } else if (currentSY < 0) {
            if (reminderY + currentSY < 0 && reminderY !== 0) {
                p.y -= reminderY
                p.y = trunc(p.y)
                currentSY += reminderY
                reminderY = 1
            } else {
                p.y += currentSY
                currentSY = 0
            }
        }

        if (overlaps(world, p.x, p.y)) {
            p.y = oy
            if (p.speedY > 0 && mory > 0) grounded = true
            if (p.speedY < 0 && mory < 0) grounded = true
            p.speedY = 0
            currentSY = 0
            doney = true
        }
    }

    while ((currentSX !== 0 && !donex) || (currentSY !== 0 && !doney)) {
        stepx()
        stepy()
    }

    p.onGround = grounded

    const now = Date.now()
    let injump = false
    let mod = 1

    if (input.justSpace) {
        p.lastJump = -now
        injump = true
        mod = -1
    }

    if (input.space) {
        if (p.lastJump < 0) {
            if (now + p.lastJump > 750) injump = true
        } else if (now - p.lastJump > 150) {
            injump = true
        }
    }

    if (((p.speedX === 0 && morx !== 0 && mox !== 0) || (p.speedY === 0 && mory !== 0 && moy !== 0)) && grounded) {
        p.jumpCount = 0
    }

    if (p.jumpCount === 0 && !grounded) {
        p.jumpCount = 1
    }

    if (injump) {
        if (p.jumpCount < p.maxJumps && morx !== 0 && mox !== 0) {
            if (p.maxJumps < 1000) p.jumpCount++
            p.speedX = (-morx * JUMP) / MULT
            p.lastJump = now * mod
        }
        if (p.jumpCount < p.maxJumps && mory !== 0 && moy !== 0) {
            if (p.maxJumps < 1000) p.jumpCount++
            p.speedY = (-mory * JUMP) / MULT
            p.lastJump = now * mod
        }
    }

    if (!isLiquid(current)) {
        if (trunc(p.speedX * 256) === 0 && Math.abs(modifierX * MULT) < 0.1) {
            const tx = p.x % SIZE
            if (tx < 2) {
                if (tx < 0.2) p.x = trunc(p.x)
                else p.x -= tx / 15
            } else if (tx > 14) {
                if (tx > 15.8) p.x = trunc(p.x) + 1
                else p.x += (tx - 14) / 15
            }
        }

        if (trunc(p.speedY * 256) === 0 && Math.abs(modifierY * MULT) < 0.1) {
            const ty = p.y % SIZE
            if (ty < 2) {
                if (ty < 0.2) p.y = trunc(p.y)
                else p.y -= ty / 15
            } else if (ty > 14) {
                if (ty > 15.8) p.y = trunc(p.y) + 1
                else p.y += (ty - 14) / 15
            }
        }
    }
}
