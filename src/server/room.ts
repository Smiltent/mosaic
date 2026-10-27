
import { createPlayer, Player } from "@/src/shared/player.ts"
import { handlePlace } from "@/src/server/handlers/place.ts"
import { handleMove } from "@/src/server/handlers/move.ts"
import { ClientMessage } from "@/src/shared/messages.ts"
import { World } from "@/src/shared/world.ts"
import { WSContext } from "hono/ws"

export interface WSPlayer extends Player {
    ws: WSContext
}

export class Room {
    world = new World()
    players = new Map<number, WSPlayer>()
    private nextId = 1

    public broadcast(msg: object, except?: number) {
        const data = JSON.stringify(msg)
    
        for (const [id, p] of this.players) {
            if (id !== except) {
                p.ws.send(data)
            }
        }
    }

    public connect(ws: WSContext) {
        const id = this.nextId++
        const color = `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`
        const base = createPlayer(id, color)

        this.players.set(id, { ...base, ws })
        const p = this.players.get(id)!

        ws.send(JSON.stringify({
            type: "init",
            id,
            x: p.x,
            y: p.y,
            color: p.color,
            world: this.world.layers.map(l => Array.from(l)),
            players: [...this.players].filter(([pid]) => pid !== id)
                .map(([pid, pl]) => ({ id: pid, x: pl.x, y: pl.y, speedX: pl.speedX, speedY: pl.speedY, onGround: pl.onGround, color: pl.color }))
        }))

        this.broadcast({ type: "join", id, x: p.x, y: p.y, color: p.color }, id)
        return id
    }

    public disconnect(id: number) {
        this.players.delete(id)
        this.broadcast({ type: "leave", id })
    }

    public handle(id: number, msg: ClientMessage) {
        const p = this.players.get(id)
        if (!p) return

        if (msg.type === "place") {
            handlePlace(this, msg)
        } else if (msg.type === "move") {
            handleMove(this, p, msg)
        }
    }
}

export const room = new Room()