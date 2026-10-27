
import { ClientMessage, ServerMessage } from "@/src/shared/messages.ts"
import { HEIGHT, WIDTH } from "@/src/shared/world.ts"
import { Player } from "@/src/shared/player.ts"

const canvas = document.getElementById("game") as HTMLCanvasElement
const ctx = canvas.getContext("2d")!

const SIZE = 16
const GAME_W = WIDTH * SIZE // 1280
const GAME_H = HEIGHT * SIZE // 720

let tiles: number[] = []
let height = 0
let width = 0

interface WSPlayer extends Player {
    id: number
}

const others = new Map<number, WSPlayer>()

const send = (msg: ClientMessage) => ws.send(JSON.stringify(msg))
const ws = new WebSocket(`ws://${location.host}/ws`)

function resize() {
    const rect = canvas.getBoundingClientRect()
    const dpr = devicePixelRatio || 1

    canvas.width = Math.round(rect.width * dpr)
    canvas.height = Math.round(rect.height * dpr)
    // ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    draw()
}

function tileAt(e: MouseEvent) {
    const rect = canvas.getBoundingClientRect()

    return {
        x: Math.floor((e.clientX - rect.left) / rect.width * GAME_W / SIZE),
        y: Math.floor((e.clientY - rect.top) / rect.height * GAME_H / SIZE)
    }
}

ws.onmessage = (e) => {
    const msg = JSON.parse(e.data) as ServerMessage

    switch (msg.type) {
        case "init": 
            ({ width, height, tiles } = msg)
            for (const p of msg.players) {
                others.set(p.id, p)
            }
            break

        case "place":
            tiles[msg.y * width + msg.x] = msg.tile
            break

        case "join":
            others.set(msg.id, msg)
            break

        // deno-lint-ignore no-case-declarations -- temp
        case "move":
            const p = others.get(msg.id)
            if (p) {
                p.x = msg.x
                p.y = msg.y
            }
            break
        
        case "leave":
            others.delete(msg.id)
            break
    }

    draw()
}

function draw() {
    const s = canvas.width / GAME_W
    ctx.setTransform(s, 0, 0, s, 0, 0)

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            ctx.fillStyle = tiles[y * width + x] ? "#333" : "#eee"
            ctx.fillRect(x * SIZE, y * SIZE, SIZE, SIZE)
        }
    }

    for (const p of others.values()) {
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x * SIZE + SIZE / 2, p.y * SIZE + SIZE / 2, SIZE, 0, Math.PI * 2)
        ctx.fill()
    }
}

let painting = false
canvas.onmousedown = (e) => {
    painting = true
    place(e)
}

onmouseup = () => (painting = false)
oncontextmenu = (e) => e.preventDefault()
onresize = resize
resize()

function place(e: MouseEvent) {
    send({
        type: "place",
        tile: e.button === 2 ? 0 : 1,
        ...tileAt(e)
    })
}

let lastSent = 0
canvas.onmousemove = (e) => {
    if (painting) {
        place(e)
    }

    const now = Date.now()
    if (now - lastSent < 66) return

    lastSent = now

    send({
        type: "move",
        ...tileAt(e)
    })
}