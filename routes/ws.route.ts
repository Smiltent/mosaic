
import { HEIGHT, WIDTH, World } from "@/src/shared/world.ts"
import { ClientMessage } from "@/src/shared/messages.ts"
import { Player } from "@/src/shared/player.ts"
import { upgradeWebSocket } from "@hono/deno"
import { WSContext } from "hono/ws"
import { Hono } from "hono"

interface WSPlayer extends Player {
    ws: WSContext
}

const players = new Map<number, WSPlayer>()
const world = new World()
const router = new Hono()

let nextId = 1

function broadcast(msg: object, except?: number) {
    const data = JSON.stringify(msg)

    for (const [id, p] of players) {
        if (id !== except) {
            p.ws.send(data)
        }
    }
}

router.get("/ws", upgradeWebSocket(() => {
    const id = nextId++

    return {
        onOpen(_e, ws) {
            players.set(id, {
                id,
                ws,
                x: 0,
                y: 0,
                speedX: 0,
                speedY: 0,
                onGround: false,
                jumpCount: 0,
                maxJumps: 1,
                lastJump: 0,
                color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`
            })

            const p = players.get(id)!

            ws.send(JSON.stringify({
                type: "init",
                id,
                x: p.x,
                y: p.y,
                color: p.color,
                world: world.layers.map(l => Array.from(l)),
                players: [...players].filter(([pid]) => pid !== id)
                    .map(([pid, pl]) => ({ id: pid, x: pl.x, y: pl.y, speedX: pl.speedX, speedY: pl.speedY, onGround: pl.onGround, color: pl.color }))
            }))

            broadcast({ type: "join", id, x: p.x, y: p.y, color: p.color }, id)
        },

        onMessage(e) {
            let msg: ClientMessage
            try {
                msg = JSON.parse(e.data.toString())
            } catch {
                return 
            }

            const p = players.get(id)

            if (!p) return

            if (msg.type === "place") {
                const { layer, x, y, tile } = msg

                if (layer !== 0 && layer !== 1) return
                if (!world.setTile(layer, x, y, tile)) return

                broadcast({
                    type: "place",
                    layer,
                    x,
                    y,
                    tile
                })
            } else if (msg.type === "move") {
                p.x = msg.x
                p.y = msg.y
                p.speedX = msg.speedX
                p.speedY = msg.speedY

                broadcast({
                    type: "move",
                    id,
                    x: p.x,
                    y: p.y,
                    speedX: p.speedX,
                    speedY: p.speedY
                }, id)
            }
        },

        onClose() {
            players.delete(id)
            broadcast({ type: "leave", id })
        }
    }
}))

export default router