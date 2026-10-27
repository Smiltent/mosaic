
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