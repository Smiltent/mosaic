
import { BG, FG, HEIGHT, MS_PER_TICK, SIZE, WIDTH, World } from "@/src/shared/world.ts"
import { ClientMessage, ServerMessage } from "@/src/shared/messages.ts"
import { stepPlayer } from "@/src/shared/physics.ts"
import { brickSprite } from "@/src/client/bricks.ts"
import { Input, Player } from "@/src/shared/player.ts"
import { layerOf } from "@/src/shared/blocks.ts";
import { createBlockBar } from "@/src/client/ui/blocks.ts";

const canvas = document.getElementById("game") as HTMLCanvasElement
const ctx = canvas.getContext("2d")!

const GAME_W = WIDTH * SIZE // 1280
const GAME_H = HEIGHT * SIZE // 720
const world = new World()

const ZOOM = 1

let me: Player | null = null
let camX = 0
let camY = 0

type RemotePlayer = Player & { tx: number, ty: number }
const others = new Map<number, RemotePlayer>()

const send = (msg: ClientMessage) => ws.send(JSON.stringify(msg))
const ws = new WebSocket(`ws://${location.host}/ws`)

function scale() {
    return (devicePixelRatio || 1) * ZOOM
}

function resize() {
    const rect = canvas.getBoundingClientRect()
    const dpr = devicePixelRatio || 1

    canvas.width = Math.round(rect.width * dpr)
    canvas.height = Math.round(rect.height * dpr)

    draw()
}

function tileAt(e: MouseEvent) {
    const rect = canvas.getBoundingClientRect()
    // CSS px → world px: divide by ZOOM (one world px draws as ZOOM CSS px)
    const wx = camX + (e.clientX - rect.left) / ZOOM
    const wy = camY + (e.clientY - rect.top) / ZOOM

    return {
        x: Math.floor(wx / SIZE),
        y: Math.floor(wy / SIZE),
    }
}

ws.onmessage = (e) => {
    const msg = JSON.parse(e.data) as ServerMessage

    switch (msg.type) {
        case "init": 
            msg.world.forEach((tiles, layer) => world.layers[layer].set(tiles))
            me = { id: msg.id, x: msg.x, y: msg.y, speedX: 0, speedY: 0, onGround: false, jumpCount: 0, maxJumps: 1, lastJump: 0, tileQueue: [0, 0], color: msg.color }
            others.clear()

            for (const p of msg.players) {
                others.set(p.id, { ...p, tx: p.x, ty: p.y })
            }
            break

        case "place":
            world.set(msg.layer, msg.x, msg.y, msg.tile)
            break

        case "join":
            others.set(msg.id, { ...msg, speedX: 0, speedY: 0, onGround: false, jumpCount: 0, maxJumps: 1, lastJump: 0, tileQueue: [0, 0], tx: msg.x, ty: msg.y })
            break

        // deno-lint-ignore no-case-declarations -- temp
        case "move":
            const p = others.get(msg.id)
            if (p) {
                p.tx = msg.x
                p.ty = msg.y
            }
            break
        
        case "leave":
            others.delete(msg.id)
            break
    }
}

function draw() {
    const s = scale()
    const viewW = canvas.width / s
    const viewH = canvas.height / s

    camX = (me ? me.x + SIZE / 2 : 0) - viewW / 2
    camY = (me ? me.y + SIZE / 2 : 0) - viewH / 2

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

    for (const p of others.values()) {
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

const input: Input = { left: false, right: false, up: false, down: false, space: false, justSpace: false }

function setKey(e: KeyboardEvent, down: boolean) {
    switch (e.code) {
        case "ArrowLeft": 
        case "KeyA": 
            input.left = down
            break

        case "ArrowRight": 
        case "KeyD": 
            input.right = down
            break

        case "ArrowUp": 
        case "KeyW": 
            input.up = down
            break

        case "ArrowDown": 
        case "KeyS": 
            input.down = down
            break

        case "Space": 
            if (down && !input.space) {
                input.justSpace = true
            }
            input.space = down
            break
    }
}

onkeydown = (e) => setKey(e, true)
onkeyup = (e) => setKey(e, false)

// holy
function overlapsMe(x: number, y: number) {
    return !!me && x * SIZE < me.x + SIZE && x * SIZE + SIZE > me.x && y * SIZE < me.y + SIZE && y * SIZE + SIZE > me.y
}

let acc = 0
let last = performance.now()
let lastSent = 0

function frame(now: number) {
    acc += now - last
    last = now

    // simulate less than 10t per frame
    acc = Math.min(acc, MS_PER_TICK * 15)

    while (acc >= MS_PER_TICK) {
        if (me) {
            stepPlayer(me, input, world)
        }

        acc -= MS_PER_TICK
        input.justSpace = false
    }

    for (const p of others.values()) {
        p.x += (p.tx - p.x) * 0.2
        p.y += (p.ty - p.y) * 0.2
    }

    if (me && now - lastSent > 66) {
        lastSent = now
        send({
            type: "move",
            x: me.x,
            y: me.y,
            speedX: me.speedX,
            speedY: me.speedY
        })
    }

    draw()
    requestAnimationFrame(frame)
}

requestAnimationFrame(frame)

let selectedBlock = 1
createBlockBar((id) => {
    selectedBlock = id
})

// painting
let painting = false
let eraserLayer = FG
let pastX = -1
let pastY = -1
let pastT = 0

function placeAt(x: number, y: number, button: number) {
    const now = performance.now()
    if (x === pastX && y === pastY && now - pastT < 500) return
    pastX = x
    pastY = y
    pastT = now
    if (button === 2) {
        if (world.get(eraserLayer, x, y) !== 0) {
            send({ type: "place", layer: eraserLayer, x, y, tile: 0 })
        }
    } else if (!overlapsMe(x, y)) {
        const layer = layerOf(selectedBlock)
        if (world.get(layer, x, y) === selectedBlock) return
        
        send({ type: "place", layer, x, y, tile: selectedBlock })
    }
}

canvas.onmousedown = (e) => {
    const { x, y } = tileAt(e)
    eraserLayer = world.get(FG, x, y) !== 0 ? FG : BG
    painting = true

    placeAt(x, y, e.button)
}

canvas.onmousemove = (e) => {
    if (!painting) return
    const { x, y } = tileAt(e)

    placeAt(x, y, e.button)
}

onmouseup = () => {
    painting = false
    pastX = pastY = -1
}
oncontextmenu = (e) => e.preventDefault()
onresize = resize
resize()

