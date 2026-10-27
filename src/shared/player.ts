
export interface Player {
    id: number

    x: number
    y: number
    speedX: number
    speedY: number
    onGround: boolean

    jumpCount: number
    maxJumps: number
    lastJump: number

    tileQueue: [number, number]

    color: string
}

export interface Input {
    left: boolean
    right: boolean
    up: boolean
    down: boolean

    space: boolean // held
    justSpace: boolean // pressed for a single tick
}

export function createPlayer(id: number, color: string, x: number = 0, y: number = 0): Player {
    return {
        id, x, y,
        speedX: 0,
        speedY: 0,
        onGround: false,
        jumpCount: 0,
        maxJumps: 1,
        lastJump: 0,
        tileQueue: [0, 0],
        color,
    }
}