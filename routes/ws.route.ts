
import { HEIGHT, WIDTH } from "@/src/shared/world.ts"
import { Player } from "@/src/shared/player.ts"
import { upgradeWebSocket } from "@hono/deno"
import { WSContext } from "hono/ws"
import { Hono } from "hono"

interface WSPlayer extends Player {
    ws: WSContext
}

const players = new Map<number, WSPlayer>()
const world = new Uint16Array(WIDTH * HEIGHT)
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
                color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`
            })

            const p = players.get(id)!

            ws.send(JSON.stringify({
                type: "init",
                id,
                width: WIDTH,
                height: HEIGHT,
                tiles: Array.from(world),
                players: [...players].filter(([pid]) => pid !== id)
                    .map(([pid, pl]) => ({ id: pid, x: pl.x, y: pl.y, color: pl.color }))
            }))

            broadcast({ type: "join", id, x: 0, y: 0, color: p.color }, id)
        },

        onMessage(e) {
            const msg = JSON.parse(e.data.toString())
            const p = players.get(id)

            if (!p) return

            if (msg.type === "place") {
                const { x, y, tile } = msg

                if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return
                world[y * WIDTH + x] = tile

                broadcast({
                    type: "place",
                    x,
                    y,
                    tile
                })
            } else if (msg.type === "move") {
                p.x = msg.x
                p.y = msg.y

                broadcast({
                    type: "move",
                    id,
                    x: p.x,
                    y: p.y
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